import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Steps, Select, Radio, Typography, Modal, Alert } from 'antd';
import { LockOutlined, UserOutlined, NumberOutlined, DesktopOutlined, SafetyCertificateOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import shopFloorBg from '../../../public/images/shop3.jpg';
import { motion } from 'framer-motion';
// import belLogo from '../../../public/images/belLogo.png';
import belLogo from '../../../public/images/BEL_Logo.png';
import cmtiLogo from '../../../public/images/CMTI_Logo2.png';
import useAuthStore from '../../store/auth-store';

const { Option } = Select;
const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [showRegister, setShowRegister] = useState(false);

  const { 
    login, 
    register, 
    fetchMachines, 
    fetchRoles,
    machines = [],
    roles = [],
    isLoading,
    error,
    clearError
  } = useAuthStore();

  useEffect(() => {
    fetchMachines();
    fetchRoles();
  }, []);

  const handleLoginTypeChange = (e) => {
    setLoginType(e.target.value);
    setCurrentStep(0);
    form.resetFields();
  };

  const onFinish = async (values) => {
      try {
          if (loginType === 'operator') {
            if (currentStep === 0) {
              // Get the selected machine ID and verify machine password
              const selectedMachine = machines.find(m => m.id === values.machineName);
              if (!selectedMachine) {
                throw new Error('Please select a valid machine');
              }

              // Make API call to verify machine credentials
              const response = await fetch('http://172.16.0.229:1292/api/v1/auth/machine-id-login', {
                method: 'POST',
                headers: {
                  'accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  machine_id: values.machineName,
                  password: values.machinePassword,
                }),
              });

              const responseData = await response.json();

              if (!response.ok) {
                // Handle error from backend
                throw new Error(responseData.detail || 'Invalid machine credentials');
              }

              // If successful, move to the next step
              setCurrentStep(1);
        } else {
          const response = await login({
            username: values.operatorName,
            password: values.password,
            role: 'operator',
            machineId: form.getFieldValue('machineName'),
            machinePassword: form.getFieldValue('machinePassword')
          });
          
          // Check role from response
          if (response.role === 'operator') {
            toast.success(`Welcome ${values.operatorName}!`);
            navigate('/operator/dashboard', { replace: true });
          } else {
            throw new Error('You do not have operator access');
          }
        }
      } 
          else if (loginType === 'admin') {
          const response = await login({
            username: values.adminName, // Use adminName for admin login
            password: values.password,
            role: 'admin' // Set role to admin
          });
          
          // Check role from response
          if (response.role === 'admin') { // Check for admin role
            toast.success(`Welcome ${values.adminName}!`);
            navigate('/admin/dashboard', { replace: true }); // Navigate to admin dashboard
          } else {
            throw new Error('You do not have admin access');
          }
      } else {
          const response = await login({
            username: values.supervisorName,
            password: values.password,
            role: 'supervisor'
          });
          
          // Check role from response
          if (response.role === 'supervisor') {
            toast.success(`Welcome ${values.supervisorName}!`);
            navigate('/supervisor/dashboard', { replace: true });
          } else {
            throw new Error('You do not have supervisor access');
          }
        }
    } catch (error) {
      // Show error messages for all types of errors
      if (error.message.includes('access')) {
        toast.error('Access Denied: ' + error.message);
      } else if (error.message.includes('Invalid machine credentials')) {
        toast.error('Invalid machine credentials. Please check your machine details.');
        setCurrentStep(0); // Go back to machine credentials step
      } else if (error.message.includes('Invalid operator credentials')) {
        toast.error('Invalid operator credentials. Please check your username and password.');
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleRegister = async (values) => {
    try {
      // Directly use the role_id from the form values
      const selectedRoleId = values.role; // This will be the id of the selected role
      console.log('Selected Role ID from Form:', selectedRoleId); // Log the selected role ID
  
      await register({
        email: values.email,
        username: values.username,
        password: values.password,
        role_id: selectedRoleId, // Use the selected role ID directly
      });
      
      toast.success('Registration successful! Please login.');
      setIsRegisterModalVisible(false);
      registerForm.resetFields();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const renderOperatorSteps = () => {
    if (currentStep === 0) {
      return (
        <>
          <Form.Item
            name="machineName"
            label={<span className="text-gray-700 font-medium">Select Machine</span>}
            rules={[{ required: true, message: 'Please select a machine!' }]}
          >
            <Select
              placeholder="Select machine"
              className="w-full"
              size="large"
              loading={isLoading}
            >
              {(machines || [])
                .filter(machine => 
                  !machine.make?.toLowerCase().includes('default') && 
                  !machine.work_center?.code?.toLowerCase().includes('default')
                )
                .map(machine => (
                  <Option key={machine.id} value={machine.id}>
                    ({machine.work_center.code}) {machine.make}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="machinePassword"
            label={<span className="text-gray-700 font-medium">Machine Password</span>}
            rules={[{ required: true, message: 'Please enter machine password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter machine password"
              size="large"
            />
          </Form.Item>
        </>
      );
    }
    return (
      <>
        <Form.Item
          name="operatorName"
          label={<span className="text-gray-700 font-medium">Operator Name</span>}
          rules={[
            { required: true, message: 'Please enter operator name!' },
            { min: 3, message: 'Name must be at least 3 characters!' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Enter your name"
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span className="text-gray-700 font-medium">Password</span>}
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter your password"
            size="large"
          />
        </Form.Item>
      </>
    );
  };

  const renderSupervisorSteps = () => {
   
    return (
      <>
        <Form.Item
          name="supervisorName"
          label={<span className="text-gray-700 font-medium">Supervisor Name</span>}
          rules={[{ required: true, message: 'Please enter supervisor name!' }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Enter your name"
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span className="text-gray-700 font-medium">Password</span>}
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter your password"
            size="large"
          />
        </Form.Item>
      </>
    );
  };

  const renderAdminSteps = () => {
   
    return (
      <>
        <Form.Item
          name="adminName"
          label={<span className="text-gray-700 font-medium">Admin Name</span>}
          rules={[{ required: true, message: 'Please enter admin name!' }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Enter your name"
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span className="text-gray-700 font-medium">Password</span>}
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter your password"
            size="large"
          />
        </Form.Item>
      </>
    );
  };


  const RegisterModal = () => (
    <Modal
      title="Register New User"
      open={isRegisterModalVisible}
      onCancel={() => setIsRegisterModalVisible(false)}
      footer={null}
      width={400}
    >
      <Form
        form={registerForm}
        layout="vertical"
        onFinish={handleRegister}
      >
        <Form.Item
          name="email"
          label="Email (Gmail)"
          rules={[
            { required: true, message: 'Please enter your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
            { pattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/, message: 'Please enter a valid Gmail address!' }
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Enter your Gmail address" />
        </Form.Item>

        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please enter username!' }]}
        >
          <Input prefix={<UserOutlined />} />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter password!' },
            { min: 6, message: 'Password must be at least 6 characters!' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Please select role!' }]}
        >
          <Select placeholder="Select role">
            {roles.map(role => (
              <Option key={role.id} value={role.role_name}>
                {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
        >
          {({ getFieldValue }) =>
            getFieldValue('role') === 'supervisor' && (
              <Form.Item
                name="passkey"
                label="Passkey"
                rules={[{ required: true, message: 'Please enter passkey!' }]}
              >
                <Input.Password prefix={<SafetyCertificateOutlined />} />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Register
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  console.log('Roles:', roles);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${shopFloorBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card 
          className="backdrop-blur-md bg-white/90 shadow-2xl rounded-2xl overflow-hidden border-0"
          bordered={false}
        >
          {/* Header with Logos */}
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-center"
          >
            <div className="bg-blue-100  text-white py-6 -mt-6 -mx-6 rounded-t-xl">
              {/* BEL Logo and Title */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <img 
                  src={belLogo} 
                  alt="BEL Logo" 
                  className="h-12 object-contain"
                />
               
              </div>
              <div className="flex items-center justify-center text-left">
                  {/* <Title level={2} className="text-white mb-0 font-bold"></Title> */}
                  <Text className="text-slate-700 text-xl font-bold">Manufacturing Execution System</Text>
                </div>

              {/* Divider */}
              <div className="w-3/4 mx-auto border-t border-blue-400/30 my-4" />

              {/* Powered By Section */}
              <div className="flex items-center justify-center gap-2">
                <Text className="text-slate-700 text-sm">Powered by</Text>
                <img 
                  src={cmtiLogo} 
                  alt="CMTI Logo" 
                  className="h-8 object-contain"
                />
              </div>
            </div>
          </motion.div>

          

          {showRegister ? (
            // Registration Form
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Form
                form={registerForm}
                layout="vertical"
                onFinish={handleRegister}
                requiredMark={false}
              >
                <Form.Item
                  name="email"
                  label="Email (Gmail)"
                  rules={[
                    { required: true, message: 'Please enter your email!' },
                    { type: 'email', message: 'Please enter a valid email!' },
                    { pattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/, message: 'Please enter a valid Gmail address!' }
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter your Gmail address" />
                </Form.Item>

                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: 'Please enter username!' }]}
                >
                  <Input 
                    prefix={<UserOutlined />}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Role"
                  rules={[{ required: true, message: 'Please select role!' }]}
                >
                  <Select placeholder="Select role">
                    {roles.map(role => (
                      <Option key={role.id} value={role.id}> {/* Use role.id as the value */}
                        {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)} {/* Display role_name */}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => 
                    prevValues.role !== currentValues.role
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue('role') === 'supervisor' && (
                      <Form.Item
                        name="passkey"
                        label="Passkey"
                        rules={[{ required: true, message: 'Please enter passkey!' }]}
                      >
                        <Input.Password 
                          prefix={<SafetyCertificateOutlined />}
                          size="large"
                        />
                      </Form.Item>
                    )
                  }
                </Form.Item>

                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    Register
                  </Button>
                </Form.Item>
              </Form>
            </motion.div>
          ) : (
            // Login Form
            <div className="mt-8">
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="mb-8"
              >
                <Radio.Group
                  onChange={handleLoginTypeChange}
                  value={loginType}
                  className="w-full"
                  size="large"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      className="shadow-sm"
                    >
                      <Radio.Button
                        value="operator"
                        className="text-center h-24 flex items-center justify-center w-full rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500"
                      >
                        <div className="flex  justify-center items-center gap-2">
                          <DesktopOutlined className="text-2xl text-blue-600" />
                          <span className="font-medium">Operator Login</span>
                        </div>
                      </Radio.Button>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      className="shadow-sm"
                    >
                      <Radio.Button
                        value="supervisor"
                        className="text-center h-24 flex items-center justify-center w-full rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500"
                      >
                        <div className="flex justify-center items-center gap-2">
                          <UserOutlined className="text-xl text-blue-600" />
                          <span className=" font-medium">Supervisor Login</span>
                        </div>
                      </Radio.Button>
                    </motion.div>
                  </div>

                  <div className="p-4 gap-2 w-64 ml-20">
                  <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      className="shadow-sm"
                    >
                      <Radio.Button
                        value="admin"
                        className="text-center h-24 flex items-center justify-center w-full rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500"
                      >
                        <div className="flex justify-center items-center gap-2">
                          <UserOutlined className="text-xl text-blue-600" />
                          <span className=" font-medium">Admin Login</span>
                        </div>
                      </Radio.Button>
                    </motion.div>
                  </div>
                </Radio.Group>
              </motion.div>

              {loginType && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Progress Steps */}
                  <Steps
                    current={currentStep}
                    items={loginType === 'operator' ? [
                      { 
                        title: 'Machine', 
                        description: 'Select & Verify',
                        icon: <DesktopOutlined /> 
                      },
                      { 
                        title: 'Operator', 
                        description: 'Credentials',
                        icon: <SafetyCertificateOutlined />
                      }
                    ] : [
                      { 
                        title: 'Verify', 
                        description: 'Supervisor PIN',
                        icon: <NumberOutlined />
                      },
                      { 
                        title: 'Login', 
                        description: 'Credentials',
                        icon: <SafetyCertificateOutlined />
                      }
                    ]}
                    className="mb-8"
                  />

                  {/* Login Form */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Form
                      form={form}
                      name="login"
                      onFinish={onFinish}
                      layout="vertical"
                      requiredMark={false}
                      className="space-y-4"
                    >
                      {loginType === 'admin' ? renderAdminSteps() : loginType === 'operator' ? renderOperatorSteps() : renderSupervisorSteps()}

                      <Form.Item className="mb-0">
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg font-medium rounded-lg"
                            loading={isLoading}
                          >
                            {currentStep === 0 ? 'Next' : 'Login'}
                          </Button>
                        </motion.div>
                      </Form.Item>
                    </Form>
                  </motion.div>

                  {/* Help Text */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-6"
                  >
                    <Text type="secondary" className="text-sm">
                      Please contact your Admin if you cannot access the system
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </div>
            
          )}
          {/* Toggle between Login and Register */}
          {/* <div className="flex justify-center mb-4">
            <Button 
              type="link" 
              onClick={() => setShowRegister(!showRegister)}
              className="text-blue-600 bg-slate-50 mt-2 border-1 border-blue-600"
            >
              {showRegister ? 'Back to Login' : 'Register New User'}
            </Button>
          </div> */}
          

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6 pt-4 border-t border-gray-200"
          >
            <div className="flex flex-col items-center gap-2">
              <Text type="secondary" className="text-xs">
                © 2025 Bharat Electronics Limited. All rights reserved.
              </Text>
              <Text type="secondary" className="text-xs">
                Developed and maintained by CMTI 
              </Text>
            </div>
          </motion.div>
        </Card>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="absolute top-4 left-4"
        />
      )}
    </div>
  );
};

export default Login;