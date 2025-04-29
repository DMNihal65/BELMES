import { useState, useEffect } from 'react';
import { Button, Form, Input, Modal, Select } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import useAuthStore from '../../../store/auth-store';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Option } = Select;

const RegisterNewUser = ({onSuccess }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm] = Form.useForm();
  const { isLoading, roles = [], fetchRoles, register } = useAuthStore();

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleRegister = async (values) => {
    try {
      const selectedRoleId = values.role;
      const selectedRole = roles.find(role => role.id === selectedRoleId);

      await register({
        email: values.email,
        username: values.username,
        password: values.password,
        role_id: selectedRoleId,
      });

      if (selectedRole) {
        toast.success(`Registration successful as ${selectedRole.role_name.charAt(0).toUpperCase() + selectedRole.role_name.slice(1)}!`);
      } else {
        toast.success('Registration successful!');
      }

      setShowRegister(false);
      registerForm.resetFields();
      if (onSuccess) onSuccess();  // <- Call parent's callback
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex justify-end p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <Button type="primary" onClick={() => setShowRegister(true)}>
        Register New User
      </Button>

      <Modal
        title="Register New User"
        open={showRegister}
        onCancel={() => setShowRegister(false)}
        footer={null}
        destroyOnClose
        centered
        width={600} // <- Added to control width (perfect for all desktop screens)
        style={{ maxWidth: '95%' }} // <- Ensure it fits even on small desktop screens
      >
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
                {
                  pattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                  message: 'Please enter a valid Gmail address!',
                },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your Gmail address" />
            </Form.Item>

            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter username!' }]}
            >
              <Input prefix={<UserOutlined />} size="large" placeholder="Enter username" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} size="large" placeholder="Enter password" />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role!' }]}
            >
              <Select placeholder="Select role">
                {roles.map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.role !== curr.role}
            >
              {({ getFieldValue }) =>
                getFieldValue('role') === 'supervisor' && (
                  <Form.Item
                    name="passkey"
                    label="Passkey"
                    rules={[{ required: true, message: 'Please enter passkey!' }]}
                  >
                    <Input.Password prefix={<SafetyCertificateOutlined />} size="large" placeholder="Enter passkey" />
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
      </Modal>
    </div>
  );
};

export default RegisterNewUser;
