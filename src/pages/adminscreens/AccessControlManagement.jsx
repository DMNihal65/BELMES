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
import axios from 'axios';
const { TabPane } = Tabs;

const AccessControlManagement = ({onSuccess }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm] = Form.useForm();
  const { isLoading, roles = [], fetchRoles, register } = useAuthStore();
  const [isMachinePasswordModalVisible, setMachinePasswordModalVisible] = useState(false);
  const [machineCredentials, setMachineCredentials] = useState([]);
  const [editMachineModalVisible, setEditMachineModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineForm] = Form.useForm();
  const { users, loading, totalUsers, fetchUsers, deleteUser, updateUser } = useAccessControlStore();
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const { registerUser } = useAccessControlStore();

  useEffect(() => {
    if (activeTab === 'machines') {
      fetchMachineCredentials();
    }
  }, [activeTab]);

  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.role.role_name.toLowerCase().includes(searchText.toLowerCase()) ||
        (user.role.access_list && JSON.parse(user.role.access_list).some(access => 
          access.toLowerCase().includes(searchText.toLowerCase())
        ))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchText, users]);

  const fetchMachineCredentials = async () => {
    try {
      const response = await axios.get('http://172.18.7.88:3252/api/v1/auth/get-machine-credentials');
      setMachineCredentials(response.data);
    } catch (error) {
      message.error('Failed to fetch machine credentials');
    }
  };
  
  const handleEditMachine = (record) => {
    setSelectedMachine(record);
    machineForm.setFieldsValue({
      password: record.password
    });
    setEditMachineModalVisible(true);
  };
  
  const handleUpdateMachinePassword = async (values) => {
    try {
      await axios.put(`http://172.18.7.88:3252/api/v1/auth/machine-credentials/${selectedMachine.machine_id}`, {
        password: values.password
      });
      message.success('Machine password updated successfully');
      setEditMachineModalVisible(false);
      fetchMachineCredentials();
    } catch (error) {
      message.error('Failed to update machine password');
    }
  };
  
  const handleDeleteMachineCredential = (machineId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this machine credential?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await axios.delete(`http://172.18.7.88:3252/api/v1/auth/machine-credentials/${machineId}`);
          message.success('Machine credential deleted successfully');
          fetchMachineCredentials();
        } catch (error) {
          message.error('Failed to delete machine credential');
        }
      },
    });
  };

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


  const handleRefresh = () => {
    if (pageSize === -1) {
      fetchUsers(0, 999999); // For "All" option
    } else {
      fetchUsers((currentPage - 1) * pageSize, pageSize);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      if (pageSize === -1) {
        fetchUsers(0, 999999); // For "All" option
      } else {
        fetchUsers((currentPage - 1) * pageSize, pageSize);
      }
    }
  }, [activeTab, currentPage, pageSize, fetchUsers]);


  const handleDelete = (userId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await axios.delete(`http://172.18.7.88:3252/api/v1/auth/users/${userId}`);
          message.success('User deleted successfully');
          handleRefresh(); // Refresh the user list after deletion
        } catch (error) {
          message.error('Failed to delete user');
          console.error('Error deleting user:', error);
        }
      },
    });
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

  const MachineColumns = [
    // {
    //   title: 'Machine ID',
    //   dataIndex: 'machine_id',
    //   key: 'machine_id',
    //   width: '30%',
    // },
    {
      title: 'Machine Name',
      dataIndex: 'machine_name',
      key: 'machine_name',
      width: '30%',
    },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
      width: '40%',
      render: (password) => '••••••••' // Hide actual password
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '30%',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditMachine(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteMachineCredential(record.machine_id)}
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
          <div className="flex justify-between items-center mb-4">
              <Input.Search
                placeholder="Search by username, role, or access"
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Button type="primary" onClick={() => setShowRegister(true)}>
                Register New User
              </Button>
            </div>

            <Table
              dataSource={searchText ? filteredUsers : users}
              columns={UsersColumns}
              rowKey={(record) => record.id}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: searchText ? filteredUsers.length : totalUsers,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['5', '10', '15', '20'],
                position: ['bottomCenter'],
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                  fetchUsers((page - 1) * size, size);
                },
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                  fetchUsers(0, size);
                },
                showTotal: (total) => `Total ${total} items`
              }}
              loading={loading}
              size="middle"
              bordered
            />
          </TabPane>
          <TabPane
            tab={
              <Badge count={machineCredentials.length} offset={[10, 0]}>
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
              dataSource={machineCredentials}
              columns={MachineColumns}
              rowKey={(record) => record.id}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                responsive: true
              }}
              scroll={{ x: 'max-content' }}
                className="responsive-table"
              size="middle"
              bordered
            />
          </TabPane>
          {/* <TabPane
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
          </TabPane> */}
          
          {/* Other tabs can be added here */}
        </Tabs>
      </Card>

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

      <Modal
        title="Edit Machine Password"
        open={editMachineModalVisible}
        onCancel={() => setEditMachineModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={machineForm}
          layout="vertical"
          onFinish={handleUpdateMachinePassword}
        >
          <Form.Item
            name="password"
            label="New Password"
            rules={[{ required: true, message: 'Please enter new password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      
    </div>
  );
};

export default AccessControlManagement;
