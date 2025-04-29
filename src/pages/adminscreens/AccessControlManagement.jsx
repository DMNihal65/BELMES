import React, { useEffect, useState } from 'react';
import { Tabs, Table, Card, Badge, Select, Button, Space, Tag, Tooltip, Modal, Form, Input, message } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, EditOutlined, DeleteOutlined, UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccessControlStore } from '../../store/access-control-management';
import useAuthStore from '../../store/auth-store';
import MachinePasswordManagement from "../../pages/adminscreens/machineManagement/MachinePasswordManagement"; 

const { TabPane } = Tabs;

const AccessControlManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm] = Form.useForm();
  const { isLoading, roles = [], fetchRoles, register } = useAuthStore();
  const [isMachinePasswordModalVisible, setMachinePasswordModalVisible] = useState(false);

  const { users, loading, totalUsers, fetchUsers, deleteUser, updateUser } = useAccessControlStore();

  const { registerUser } = useAccessControlStore();

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers((currentPage - 1) * pageSize, pageSize);
    }
  }, [activeTab, currentPage, pageSize, fetchUsers]);
  

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const handleLimitChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchUsers((currentPage - 1) * pageSize, pageSize);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      role: record.role.role_name
    });
    setIsEditModalVisible(true);
  };

  const handleDelete = (userId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        deleteUser(userId);
      },
    });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      await updateUser(editingUser.id, values);
      setIsEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

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
  

  const UsersColumns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: '20%',
    },
    {
      title: 'Role',
      dataIndex: ['role', 'role_name'],
      key: 'role',
      width: '20%',
      render: (role) => (
        <Tag color="blue">
          {role}
        </Tag>
      ),
    },
    {
      title: 'Access List',
      dataIndex: ['role', 'access_list'],
      key: 'access_list',
      width: '30%',
      render: (accessList) => {
        try {
          const parsedAccessList = JSON.parse(accessList);
          return (
            <Space>
              {parsedAccessList.map((access, index) => (
                <Tag key={index} color="green">{access}</Tag>
              ))}
            </Space>
          );
        } catch (e) {
          return <span>{accessList}</span>;
        }
      },
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '20%',
      render: (date) => (
        <Tooltip title={format(parseISO(date), 'dd/MM/yyyy HH:mm:ss')}>
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {format(parseISO(date), 'dd/MM/yyyy HH:mm')}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <Card bordered={false}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Access Control Management</h1>
          <Space>
            <Select
              value={pageSize}
              onChange={handleLimitChange}
              style={{ width: 120 }}
            >
              <Select.Option value={5}>Latest 5</Select.Option>
              <Select.Option value={10}>Latest 10</Select.Option>
              <Select.Option value={15}>Latest 15</Select.Option>
              <Select.Option value={20}>Latest 20</Select.Option>
              <Select.Option value={-1}>All</Select.Option>
            </Select>
            <Tooltip title="Refresh">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
              />
            </Tooltip>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane
            tab={
              <Badge count={users.length} offset={[10, 0]}>
                <span>Users</span>
              </Badge>
            }
            key="users"
          >
          <div className='flex justify-end p-2'>
              <Button type="primary" onClick={() => setShowRegister(true)}>
                  Register New User
              </Button>
            </div>

            <Table
              dataSource={users}
              columns={UsersColumns}
              rowKey={(record) => record.id}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalUsers,
                showSizeChanger: true,
                showQuickJumper: true,
                position: ['bottomCenter'],
                onChange: (page) => setCurrentPage(page),
              }}
              loading={loading}
              size="middle"
              bordered
            />
          </TabPane>
          <TabPane
            tab={
              <Badge count={0} offset={[10, 0]}>
                <span>Machines</span>
              </Badge>
            }
            key="machines"
          >
            <div className="flex justify-end mb-4">
              <Button
                type="primary"
                onClick={() => setMachinePasswordModalVisible(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Machine Password Set
              </Button>
            </div>
            <Table
              dataSource={[]}
              rowKey={(record) => record.id}
              pagination={{
                current: currentPage,
                total: 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} machines`,
                position: ['bottomCenter'],
              }}
              size="middle"
              bordered
              locale={{ emptyText: 'No machines available' }}
            />
          </TabPane>
          <TabPane
            tab={
              <Badge count={0} offset={[10, 0]}>
                <span>Roles</span>
              </Badge>
            }
            key="roles"
          >
            <Table
              dataSource={[]}
              rowKey={(record) => record.id}
              pagination={{
                current: currentPage,
                total: 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} roles`,
                position: ['bottomCenter'],
              }}
              size="middle"
              bordered
              locale={{ emptyText: 'No roles available' }}
            />
          </TabPane>
          
          {/* Other tabs can be added here */}
        </Tabs>
      </Card>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        visible={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setIsEditModalVisible(false);
          form.resetFields();
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input the username!' }]}

          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please input the role!' }]}

          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

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

      <Modal
        open={isMachinePasswordModalVisible}
        onCancel={() => setMachinePasswordModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <MachinePasswordManagement />
      </Modal>

      
    </div>
  );
};

export default AccessControlManagement;
