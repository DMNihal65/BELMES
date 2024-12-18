import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const Login = () => {
  const navigate = useNavigate();

  const onFinish = (values) => {
    console.log('Login values:', values);
    localStorage.setItem('userRole', values.role);
    localStorage.setItem('operatorName', values.operatorName);
    localStorage.setItem('isAuthenticated', 'true');
    message.success(`Welcome ${values.operatorName}!`);
    navigate('/dashboard');
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

        {/* Login Form */}
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          size="large"
          className="space-y-6"
        >
          {/* Operator Name Input */}
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
              className="rounded-md"
            />
          </Form.Item>

          {/* Role Selection */}
          <Form.Item
            name="role"
            label={<span className="text-gray-700 font-medium">Select Role</span>}
            rules={[{ required: true, message: 'Please select role!' }]}
          >
            <Select placeholder="Select role">
              <Option value="operator">Operator</Option>
              <Option value="supervisor">Supervisor</Option>
            </Select>
          </Form.Item>

          {/* Password */}
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
              className="rounded-md"
            />
          </Form.Item>

          {/* Login Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
            >
              Login
            </Button>
          </Form.Item>

          {/* Help Text */}
          <div className="text-center text-gray-500 text-sm">
            <p>Please contact your supervisor if you cannot access the system</p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
