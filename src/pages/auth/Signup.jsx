import React from 'react';
import { Form, Input, Button, message } from 'antd';

const Signup = () => {
  const handleSignup = async (values) => {
    try {
      // Call your signup API here
      const response = await fetch('http://172.18.7.85:7798/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      message.success('Signup successful! You can now access the application.');
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Form onFinish={handleSignup}>
      <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
        <Input placeholder="Username" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
        <Input.Password placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">Sign Up</Button>
      </Form.Item>
    </Form>
  );
};

export default Signup; 