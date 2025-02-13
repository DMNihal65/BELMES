import React, { useState } from 'react';
import { 
  Tabs, 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Upload, 
  Progress,
  Timeline,
  Statistic,
  Row,
  Col,
  Badge
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data for machines
  const machines = [
    { id: 1, name: 'CNC Machine 1', status: 'Running', lastMaintenance: '2024-02-01', nextMaintenance: '2024-03-01', health: 85 },
    { id: 2, name: 'Lathe Machine 2', status: 'Maintenance Required', lastMaintenance: '2024-01-15', nextMaintenance: '2024-02-15', health: 65 },
    { id: 3, name: 'Drilling Machine 3', status: 'Down', lastMaintenance: '2024-02-10', nextMaintenance: '2024-03-10', health: 45 },
  ];

  // Machine Maintenance Table Columns
  const machineColumns = [
    {
      title: 'Machine Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'Running' ? 'green' : status === 'Maintenance Required' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Health Score',
      dataIndex: 'health',
      key: 'health',
      render: (health) => (
        <Progress 
          percent={health} 
          size="small" 
          status={health < 60 ? 'exception' : 'active'}
          strokeColor={health > 80 ? '#52c41a' : health > 60 ? '#faad14' : '#f5222d'}
        />
      ),
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
    },
    {
      title: 'Next Maintenance',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => showMaintenanceModal(record)}>
            Schedule
          </Button>
          <Button type="default" size="small" onClick={() => showHistoryModal(record)}>
            History
          </Button>
        </Space>
      ),
    },
  ];

  // Downtime Table Columns
  const downtimeColumns = [
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => <Tag color="blue">{reason}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'Resolved' ? 'green' : status === 'In Progress' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  // Mock downtime data
  const downtimeData = [
    {
      key: '1',
      machine: 'CNC Machine 1',
      startTime: '2024-02-10 09:00',
      endTime: '2024-02-10 11:00',
      duration: '2 hours',
      reason: 'Preventive Maintenance',
      status: 'Resolved',
    },
    {
      key: '2',
      machine: 'Lathe Machine 2',
      startTime: '2024-02-11 14:00',
      endTime: 'Ongoing',
      duration: 'Ongoing',
      reason: 'Breakdown',
      status: 'In Progress',
    },
  ];

  // Maintenance Documents Table
  const documentColumns = [
    {
      title: 'Document Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<FileTextOutlined />}>View</Button>
          <Button type="link" icon={<UploadOutlined />}>Update</Button>
        </Space>
      ),
    },
  ];

  // Mock documents data
  const documentsData = [
    {
      key: '1',
      name: 'CNC Machine Manual',
      type: 'Manual',
      machine: 'CNC Machine 1',
      lastUpdated: '2024-01-15',
    },
    {
      key: '2',
      name: 'Maintenance Checklist',
      type: 'Checklist',
      machine: 'All Machines',
      lastUpdated: '2024-02-01',
    },
  ];

  // Modal functions
  const showMaintenanceModal = (machine) => {
    setIsModalVisible(true);
    form.setFieldsValue({
      machineName: machine.name,
      maintenanceType: '',
      scheduledDate: '',
      description: '',
    });
  };

  const showHistoryModal = (machine) => {
    // Implementation for history modal
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      console.log('Form values:', values);
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <div className="p-6">
      <Card title="Maintenance Management System" className="mb-4">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Machine Maintenance Tab */}
          <TabPane 
            tab={<span><ToolOutlined />Machine Maintenance</span>} 
            key="1"
          >
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Machines"
                    value={machines.length}
                    prefix={<ToolOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Machines Running"
                    value={machines.filter(m => m.status === 'Running').length}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Maintenance Required"
                    value={machines.filter(m => m.status === 'Maintenance Required').length}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Machines Down"
                    value={machines.filter(m => m.status === 'Down').length}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<StopOutlined />}
                  />
                </Card>
              </Col>
            </Row>
            <Table 
              columns={machineColumns} 
              dataSource={machines}
              pagination={false}
            />
          </TabPane>

          {/* Maintenance Downtime Tab */}
          <TabPane 
            tab={<span><ClockCircleOutlined />Maintenance Downtime</span>} 
            key="2"
          >
            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Downtime Hours"
                    value={24}
                    suffix="hrs"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Active Issues"
                    value={2}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Resolved Issues"
                    value={15}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
            </Row>
            <Table 
              columns={downtimeColumns} 
              dataSource={downtimeData}
              pagination={false}
            />
          </TabPane>

          {/* Maintenance Documents Tab */}
          <TabPane 
            tab={<span><FileTextOutlined />Maintenance Documents</span>} 
            key="3"
          >
            <Space className="mb-4">
              <Upload>
                <Button icon={<UploadOutlined />}>Upload Document</Button>
              </Upload>
              <Select 
                placeholder="Filter by Machine" 
                style={{ width: 200 }}
              >
                <Option value="all">All Machines</Option>
                {machines.map(machine => (
                  <Option key={machine.id} value={machine.id}>{machine.name}</Option>
                ))}
              </Select>
              <Select 
                placeholder="Document Type" 
                style={{ width: 200 }}
              >
                <Option value="all">All Types</Option>
                <Option value="manual">Manuals</Option>
                <Option value="checklist">Checklists</Option>
                <Option value="report">Reports</Option>
              </Select>
            </Space>
            <Table 
              columns={documentColumns} 
              dataSource={documentsData}
              pagination={false}
            />
          </TabPane>

          {/* Maintenance History Tab */}
          <TabPane 
            tab={<span><HistoryOutlined />Maintenance History</span>} 
            key="4"
          >
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <RangePicker style={{ width: '100%' }} />
              </Col>
              <Col span={6}>
                <Select 
                  placeholder="Select Machine" 
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Machines</Option>
                  {machines.map(machine => (
                    <Option key={machine.id} value={machine.id}>{machine.name}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Timeline mode="left" className="mt-4">
              <Timeline.Item color="green">
                <p>Preventive Maintenance - CNC Machine 1</p>
                <p>2024-02-10 09:00</p>
                <p>Completed routine maintenance and parts replacement</p>
              </Timeline.Item>
              <Timeline.Item color="red">
                <p>Emergency Repair - Lathe Machine 2</p>
                <p>2024-02-09 14:30</p>
                <p>Fixed critical breakdown in spindle system</p>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <p>Scheduled Maintenance - Drilling Machine 3</p>
                <p>2024-02-08 11:00</p>
                <p>Performed scheduled maintenance checks</p>
              </Timeline.Item>
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      {/* Schedule Maintenance Modal */}
      <Modal
        title="Schedule Maintenance"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="machineName"
            label="Machine Name"
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="maintenanceType"
            label="Maintenance Type"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="preventive">Preventive Maintenance</Option>
              <Option value="corrective">Corrective Maintenance</Option>
              <Option value="emergency">Emergency Maintenance</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="scheduledDate"
            label="Scheduled Date"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Maintenance; 