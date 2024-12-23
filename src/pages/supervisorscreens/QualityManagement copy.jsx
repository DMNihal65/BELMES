import React, { useState } from 'react';
import {
  Layout,
  Card,
  Tabs,
  Button,
  Form,
  Input,
  Select,
  Upload,
  Space,
  Typography,
  Table,
  Drawer,
  message,
  Tooltip,
  Row,
  Col,
  Divider,
  Tag,
  Modal,
  DatePicker,
} from 'antd';
import {
  UploadOutlined,
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const QualityManagement = () => {
  const [form] = Form.useForm();
  const [newInspectionForm] = Form.useForm();
  const [ballooningDrawer, setBallooningDrawer] = useState(false);
  const [inspectionDrawer, setInspectionDrawer] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [newInspectionModal, setNewInspectionModal] = useState(false);

  // Mock data for parts
  const partsData = [
    {
      key: '1',
      partNo: 'PART-001',
      description: 'Flange Assembly',
      revision: 'Rev A',
      status: 'In Progress',
      inspectionPoints: 8,
      completedPoints: 3,
    },
    {
      key: '2',
      partNo: 'PART-002',
      description: 'Bearing Housing',
      revision: 'Rev B',
      status: 'Completed',
      inspectionPoints: 12,
      completedPoints: 12,
    },
  ];

  // Mock data for inspection points
  const inspectionPoints = [
    { id: 1, x: 120, y: 80, dimension: '⌀50±0.02', nominal: '50.00', tolerance: '±0.02' },
    { id: 2, x: 180, y: 120, dimension: '45°±1°', nominal: '45°', tolerance: '±1°' },
    { id: 3, x: 220, y: 160, dimension: '10±0.05', nominal: '10.00', tolerance: '±0.05' },
  ];

  const columns = [
    {
      title: 'Part No',
      dataIndex: 'partNo',
      key: 'partNo',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Revision',
      dataIndex: 'revision',
      key: 'revision',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Text type="secondary">{record.completedPoints}/{record.inspectionPoints} points</Text>
            <Tag color={record.status === 'Completed' ? 'success' : 'processing'}>
              {record.status === 'Completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              {' '}{record.status}
            </Tag>
          </Space>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${(record.completedPoints / record.inspectionPoints) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ballooning">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleBallooning(record)}
              className="hover:border-blue-600 hover:text-blue-600"
            >
              Balloon
            </Button>
          </Tooltip>
          <Tooltip title="Inspection">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleInspection(record)}
              className="hover:bg-blue-600"
            >
              Inspect
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleBallooning = (part) => {
    setSelectedPart(part);
    setBallooningDrawer(true);
  };

  const handleInspection = (part) => {
    setSelectedPart(part);
    setInspectionDrawer(true);
  };

  const handleNewInspection = () => {
    setNewInspectionModal(true);
  };

  const handleNewInspectionSubmit = async () => {
    try {
      const values = await newInspectionForm.validateFields();
      console.log('New Inspection Values:', values);
      
      // Add the new inspection to your data
      const newInspection = {
        key: `PART-${partsData.length + 1}`,
        partNo: values.partNo,
        description: values.description,
        revision: values.revision,
        status: 'In Progress',
        inspectionPoints: 0,
        completedPoints: 0,
      };

      // Here you would typically make an API call to save the new inspection
      message.success('New inspection created successfully');
      setNewInspectionModal(false);
      newInspectionForm.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    action: 'https://your-upload-endpoint.com/upload',
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card 
        bordered={false} 
        className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-300"
        title={
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} style={{ margin: 0 }}>Quality Management</Title>
              <Text type="secondary">Manage part quality checks and inspections</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleNewInspection}>
              New Inspection
            </Button>
          </div>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          className="custom-tabs"
        >
          <TabPane tab="Part Creation" key="1">
            <Row gutter={[24, 24]}>
              <Col span={8}>
                <Card className="h-full shadow-sm">
                  <Form form={form} layout="vertical">
                    <Form.Item
                      name="partNo"
                      label="Part Number"
                      rules={[{ required: true, message: 'Please enter part number' }]}
                    >
                      <Input prefix={<FileTextOutlined />} placeholder="Enter part number" />
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[{ required: true, message: 'Please enter description' }]}
                    >
                      <Input.TextArea
                        placeholder="Enter part description"
                        autoSize={{ minRows: 3, maxRows: 5 }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="revision"
                      label="Revision"
                      rules={[{ required: true, message: 'Please enter revision' }]}
                    >
                      <Input prefix={<EditOutlined />} placeholder="Enter revision" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" block size="large">
                        Create Part
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={16}>
                <Card className="h-full shadow-sm">
                  <Dragger {...uploadProps} className="bg-gray-50 border-2 border-dashed rounded-lg">
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined className="text-blue-500 text-4xl" />
                    </p>
                    <p className="ant-upload-text font-medium">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint text-gray-500">
                      Support for single file upload. Allowed file types: PDF, DWG
                    </p>
                  </Dragger>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Parts List" key="2">
            <Card className="shadow-sm">
              <Table
                columns={columns}
                dataSource={partsData}
                pagination={{
                  total: partsData.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
                className="custom-table"
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* New Inspection Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>Create New Inspection</span>
          </Space>
        }
        open={newInspectionModal}
        onCancel={() => {
          setNewInspectionModal(false);
          newInspectionForm.resetFields();
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setNewInspectionModal(false);
              newInspectionForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            onClick={handleNewInspectionSubmit}
          >
            Create Inspection
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={newInspectionForm}
          layout="vertical"
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="partNo"
                label="Part Number"
                rules={[{ required: true, message: 'Please enter part number' }]}
              >
                <Input prefix={<FileTextOutlined />} placeholder="Enter part number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="revision"
                label="Revision"
                rules={[{ required: true, message: 'Please enter revision' }]}
              >
                <Input prefix={<EditOutlined />} placeholder="Enter revision" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              placeholder="Enter part description"
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inspectionType"
                label="Inspection Type"
                rules={[{ required: true, message: 'Please select inspection type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="dimensional">Dimensional</Option>
                  <Option value="visual">Visual</Option>
                  <Option value="functional">Functional</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Option value="high">
                    <Tag color="error">High</Tag>
                  </Option>
                  <Option value="medium">
                    <Tag color="warning">Medium</Tag>
                  </Option>
                  <Option value="low">
                    <Tag color="success">Low</Tag>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assignedTo"
                label="Assigned To"
                rules={[{ required: true, message: 'Please select assignee' }]}
              >
                <Select placeholder="Select assignee">
                  <Option value="john">John Doe</Option>
                  <Option value="jane">Jane Smith</Option>
                  <Option value="mike">Mike Johnson</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Ballooning Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>Ballooning - {selectedPart?.partNo}</span>
          </Space>
        }
        placement="right"
        width={800}
        onClose={() => setBallooningDrawer(false)}
        open={ballooningDrawer}
        className="custom-drawer"
      >
        <div className="flex flex-col h-full">
          <Card className="mb-4 shadow-sm">
            <div className="w-full h-[500px] bg-gray-100 rounded-lg relative">
              {inspectionPoints.map((point) => (
                <Tooltip key={point.id} title={
                  <div>
                    <p><strong>Dimension:</strong> {point.dimension}</p>
                    <p><strong>Nominal:</strong> {point.nominal}</p>
                    <p><strong>Tolerance:</strong> {point.tolerance}</p>
                  </div>
                }>
                  <div
                    className="absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                    style={{ left: point.x, top: point.y }}
                  >
                    {point.id}
                  </div>
                </Tooltip>
              ))}
            </div>
          </Card>

          <Card title="Inspection Points" className="shadow-sm">
            <Table
              dataSource={inspectionPoints}
              columns={[
                { title: 'Point ID', dataIndex: 'id', key: 'id' },
                { title: 'Dimension', dataIndex: 'dimension', key: 'dimension' },
                { title: 'Nominal', dataIndex: 'nominal', key: 'nominal' },
                { title: 'Tolerance', dataIndex: 'tolerance', key: 'tolerance' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button type="text" icon={<EditOutlined />} className="text-blue-500" />
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Space>
                  ),
                },
              ]}
              pagination={false}
              size="small"
              className="custom-table"
            />
          </Card>
        </div>
      </Drawer>

      {/* Inspection Drawer */}
      <Drawer
        title={
          <Space>
            <EyeOutlined />
            <span>Inspection - {selectedPart?.partNo}</span>
          </Space>
        }
        placement="right"
        width={800}
        onClose={() => setInspectionDrawer(false)}
        open={inspectionDrawer}
        className="custom-drawer"
      >
        <div className="flex flex-col h-full">
          <Form layout="vertical">
            <Row gutter={[16, 16]}>
              {inspectionPoints.map((point) => (
                <Col span={8} key={point.id}>
                  <Card 
                    size="small" 
                    title={`Point ${point.id}`}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Form.Item 
                      label={
                        <Space>
                          <span>Measured Value</span>
                          <Tooltip title={`Nominal: ${point.nominal}, Tolerance: ${point.tolerance}`}>
                            <Tag color="blue">{point.dimension}</Tag>
                          </Tooltip>
                        </Space>
                      } 
                      required
                    >
                      <Input placeholder="Enter measurement" />
                    </Form.Item>
                    <Form.Item label="Status">
                      <Select defaultValue="pass">
                        <Option value="pass">
                          <Tag color="success">Pass</Tag>
                        </Option>
                        <Option value="fail">
                          <Tag color="error">Fail</Tag>
                        </Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Remarks">
                      <Input.TextArea rows={2} placeholder="Add remarks if any" />
                    </Form.Item>
                  </Card>
                </Col>
              ))}
            </Row>
            <Form.Item className="mt-4">
              <Button type="primary" size="large" block>
                Save Inspection Results
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Drawer>

      <style jsx global>{`
        .custom-tabs .ant-tabs-nav {
          margin-bottom: 24px;
        }
        
        .custom-tabs .ant-tabs-tab {
          border-radius: 6px 6px 0 0;
          padding: 12px 24px;
          transition: all 0.3s;
        }
        
        .custom-tabs .ant-tabs-tab-active {
          background-color: #1890ff;
        }
        
        .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: white !important;
        }
        
        .custom-table .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
        }
        
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #f0f7ff;
        }
        
        .custom-drawer .ant-drawer-header {
          padding: 16px 24px;
          background: #fafafa;
        }
        
        .custom-drawer .ant-drawer-title {
          font-weight: 600;
        }
        
        .ant-card {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .ant-btn {
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .ant-input, .ant-select-selector, .ant-input-number {
          border-radius: 6px !important;
        }
        
        .ant-form-item-label > label {
          font-weight: 500;
        }
        
        .ant-upload-drag {
          border-radius: 12px;
          border: 2px dashed #d9d9d9;
          background: #fafafa;
          padding: 32px;
        }
        
        .ant-upload-drag:hover {
          border-color: #1890ff;
        }
      `}</style>
    </div>
  );
};

export default QualityManagement;