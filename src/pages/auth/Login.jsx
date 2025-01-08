import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Steps, Select, Radio, Typography } from 'antd';
import { LockOutlined, UserOutlined, NumberOutlined, DesktopOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import shopFloorBg from '../../../public/images/shop3.jpg';
import { motion } from 'framer-motion';
import belLogo from '../../../public/images/BEL_Logo.png';
import cmtiLogo from '../../../public/images/CMTI_Logo2.png';

const { Option } = Select;
const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  // Mock machine list - In real app, fetch from API
  const machines = [
    { id: 'DMG-001', name: 'DMG DMU 60 eVo linear' },
    { id: 'DMG-002', name: 'DMG DMU 60T mB' },
    { id: 'HMC-001', name: 'Horizontal Machining Center 01' },
    { id: 'VMC-001', name: 'Vertical Machining Center 01' },
  ];

  const handleLoginTypeChange = (e) => {
    setLoginType(e.target.value);
    setCurrentStep(0);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (loginType === 'operator') {
        // Validate machine credentials first
        if (currentStep === 0) {
          // In real app, verify machine password
          if (values.machinePassword === '1234') { // Mock validation
            setCurrentStep(1);
          } else {
            throw new Error('Invalid machine credentials');
          }
        } else {
          // Final operator login
          console.log('Operator login values:', values);
          localStorage.setItem('userRole', 'operator');
          localStorage.setItem('operatorName', values.operatorName);
          localStorage.setItem('machineName', values.machineName);
          localStorage.setItem('isAuthenticated', 'true');
          message.success(`Welcome ${values.operatorName}!`);
          navigate('/operator/dashboard');
        }
      } else {
        // Supervisor login flow
        if (currentStep === 0) {
          // Verify supervisor PIN
          if (values.supervisorPin === '9999') { // Mock validation
            setCurrentStep(1);
          } else {
            throw new Error('Invalid supervisor PIN');
          }
        } else {
          // Final supervisor login
          console.log('Supervisor login values:', values);
          localStorage.setItem('userRole', 'supervisor');
          localStorage.setItem('operatorName', values.supervisorName);
          localStorage.setItem('isAuthenticated', 'true');
          message.success(`Welcome Supervisor ${values.supervisorName}!`);
          navigate('/supervisor/dashboard');
        }
      }
    } catch (error) {
      message.error(error.message || 'Login failed');
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
            >
              {machines.map(machine => (
                <Option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.id})
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
    if (currentStep === 0) {
      return (
        <Form.Item
          name="supervisorPin"
          label={<span className="text-gray-700 font-medium">Supervisor PIN</span>}
          rules={[
            { required: true, message: 'Please enter supervisor PIN!' },
            { len: 4, message: 'PIN must be 4 digits!' }
          ]}
        >
          <Input
            prefix={<NumberOutlined className="text-gray-400" />}
            placeholder="Enter 4-digit PIN"
            maxLength={4}
            size="large"
            type="password"
          />
        </Form.Item>
      );
    }
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

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${shopFloorBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card 
          className="backdrop-blur-md bg-blue-200 shadow-2xl rounded-2xl overflow-hidden border-0"
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

          {/* Login Type Selection */}
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
                    {loginType === 'operator' ? renderOperatorSteps() : renderSupervisorSteps()}

                    <Form.Item className="mb-0">
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg font-medium rounded-lg"
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
    </div>
  );
};

export default Login;
