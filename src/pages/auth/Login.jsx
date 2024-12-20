import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Steps, Select, Radio } from 'antd';
import { LockOutlined, UserOutlined, NumberOutlined, DesktopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white rounded-xl">
        {/* Header */}
        <div className="text-center">
          <div className="bg-blue-600 text-white py-6 -mt-6 -mx-6 rounded-t-xl mb-8">
            <h1 className="text-3xl font-bold mb-2">BELMES</h1>
            <p className="text-blue-100">Bharat Electronics Limited - MES</p>
          </div>
        </div>

        {/* Login Type Selection */}
        <div className="mb-8">
          <Radio.Group
            onChange={handleLoginTypeChange}
            value={loginType}
            className="w-full"
            size="large"
          >
            <div className="grid grid-cols-2 gap-4 ">
              <Radio.Button
                value="operator"
                className="text-center h-20 flex items-center justify-center"
              >
                <div className="flex justify-center items-center gap-2">
                  <DesktopOutlined className="text-xl  block" />
                  <span>Operator Login</span>
                </div>
              </Radio.Button>
              <Radio.Button
                value="supervisor"
                className="text-center h-20 flex items-center justify-center"
              >
                <div className="flex justify-center items-center gap-2" >
                  <UserOutlined className="text-xl  block" />
                  <span>Supervisor Login</span>
                </div>
              </Radio.Button>
            </div>
          </Radio.Group>
        </div>

        {loginType && (
          <>
            {/* Progress Steps */}
            <Steps
              current={currentStep}
              items={loginType === 'operator' ? [
                { title: 'Machine', description: 'Select & Verify' },
                { title: 'Operator', description: 'Credentials' }
              ] : [
                { title: 'Verify', description: 'Supervisor PIN' },
                { title: 'Login', description: 'Credentials' }
              ]}
              className="mb-8"
            />

            {/* Login Form */}
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
                <Button
                  type="primary"
                  htmlType="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
                >
                  {currentStep === 0 ? 'Next' : 'Login'}
                </Button>
              </Form.Item>
            </Form>

            {/* Help Text */}
            <div className="text-center text-gray-500 text-sm mt-6">
              <p>Please contact your supervisor if you cannot access the system</p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Login;
