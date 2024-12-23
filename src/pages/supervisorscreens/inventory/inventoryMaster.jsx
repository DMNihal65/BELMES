import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Row, 
  Col, 
  Space, 
  Upload, 
  message, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker,
  Tabs 
} from 'antd';
import dayjs from 'dayjs';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  DownloadOutlined, 
  UploadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

function Inventory() {
  // Sample data for cards
  const summaryData = {
    totalTools: 4689,
    totalToolsChange: 8.5,
    totalToolsPeriod: 'Up from past week',
    
    availableTools: 293,
    availableToolsChange: 1.3,
    availableToolsPeriod: 'Up from yesterday',
    
    inUseTools: 56,
    inUseToolsChange: 1.3,
    inUseToolsPeriod: 'Up from past week',
    
    totalRequests: 200,
    totalRequestsChange: 8.5,
    totalRequestsPeriod: 'Up from past week',
    
    rawMaterials: 689,
    rawMaterialsChange: 8.5,
    rawMaterialsPeriod: 'Up from past week',
    
    consumables: 89,
    consumablesChange: 8.5,
    consumablesPeriod: 'Up from past week'
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleSubmit = (values) => {
    const newTool = {
      key: `T${toolsData.length + 1}`,
      toolId: values.toolId,
      toolName: values.toolName,
      quantity: values.quantity,
      location: values.location,
      lastUpdated: values.lastUpdated.format('YYYY-MM-DD'),
      status: 'Available'
    };
    
    setToolsData([...toolsData, newTool]);
    message.success('Tool added successfully');
    handleCancel();
  };

  // Analytics click handlers
  const handleCardClick = (cardType) => {
    console.log(`Clicked ${cardType} card`);
    message.info(`Viewing detailed ${cardType} analytics`);
    // Add your analytics logic here
  };

  // Sample data for table
  const [toolsData, setToolsData] = useState([
    {
      key: '1',
      toolId: 'T001',
      toolName: 'Power Drill',
      quantity: 5,
      location: 'Warehouse A',
      lastUpdated: '2024-03-15',
      status: 'Available',
    },
    {
      key: '2',
      toolId: 'T002',
      toolName: 'Circular Saw',
      quantity: 3,
      location: 'Warehouse B',
      lastUpdated: '2024-03-14',
      status: 'In Use',
    },
    {
      key: '3',
      toolId: 'T003',
      toolName: 'Wrench Set',
      quantity: 8,
      location: 'Warehouse A',
      lastUpdated: '2024-03-13',
      status: 'Available',
    },
    {
      key: '4',
      toolId: 'T004',
      toolName: 'Safety Goggles',
      quantity: 0,
      location: 'Warehouse C',
      lastUpdated: '2024-03-12',
      status: 'In Use',
    },
    {
      key: '5',
      toolId: 'T005',
      toolName: 'Hammer',
      quantity: 12,
      location: 'Warehouse B',
      lastUpdated: '2024-03-11',
      status: 'Available',
    },
    {
      key: '6',
      toolId: 'T006',
      toolName: 'Screwdriver Set',
      quantity: 4,
      location: 'Warehouse A',
      lastUpdated: '2024-03-10',
      status: 'In Use',
    },
    {
      key: '7',
      toolId: 'T007',
      toolName: 'Level Tool',
      quantity: 6,
      location: 'Warehouse C',
      lastUpdated: '2024-03-09',
      status: 'Available',
    },
    {
      key: '8',
      toolId: 'T008',
      toolName: 'Measuring Tape',
      quantity: 15,
      location: 'Warehouse B',
      lastUpdated: '2024-03-08',
      status: 'Available',
    },
    {
      key: '9',
      toolId: 'T009',
      toolName: 'Measuring Tape',
      quantity: 15,
      location: 'Warehouse D',
      lastUpdated: '2024-03-09',
      status: 'Available',
    },
  ]);

  const columns = [
    {
      title: 'Tool ID',
      dataIndex: 'toolId',
      key: 'toolId',
      sorter: (a, b) => a.toolId.localeCompare(b.toolId),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.toolId,
        value: item.toolId,
      })))],
      onFilter: (value, record) => record.toolId.indexOf(value) === 0,
    },
    {
      title: 'Tool Name',
      dataIndex: 'toolName',
      key: 'toolName',
      sorter: (a, b) => a.toolName.localeCompare(b.toolName),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.toolName,
        value: item.toolName,
      })))],
      onFilter: (value, record) => record.toolName.indexOf(value) === 0,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Raw Materials', value: 'Raw Materials' },
        { text: 'Cutting Tools', value: 'Cutting Tools' },
        { text: 'Consumables', value: 'Consumables' },
        { text: 'Spares', value: 'Spares' },
        { text: 'Tool Holders', value: 'Tool Holders' },
        { text: 'Jigs & Fixtures', value: 'Jigs & Fixtures' },
        { text: 'Measuring Instruments', value: 'Measuring Instruments' },
      ],
      onFilter: (value, record) => record.category === value,
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      filters: [...new Set(toolsData.map(item => ({
        text: item.location,
        value: item.location,
      })))],
      onFilter: (value, record) => record.location === value,
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      sorter: (a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Available', value: 'Available' },
        { text: 'In Use', value: 'In Use' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span style={{ color: status === 'Available' ? '#52c41a' : '#faad14' }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          disabled={record.status === 'In Use'}
          onClick={() => handleRequest(record)}
        >
          Request
        </Button>
      ),
    },
  ];

  const handleRequest = (record) => {
    console.log('Requesting tool:', record);
    message.success(`Request submitted for ${record.toolName}`);
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(toolsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tools Data");
    XLSX.writeFile(wb, "tools_template.xlsx");
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        const formattedData = data.map((item, index) => ({
          key: `T${toolsData.length + index + 1}`,
          toolId: item.toolId || `T${toolsData.length + index + 1}`,
          toolName: item.toolName || '',
          quantity: parseInt(item.quantity) || 0,
          location: item.location || '',
          lastUpdated: item.lastUpdated || dayjs().format('YYYY-MM-DD'),
          status: item.status || 'Available'
        }));
  
        setToolsData([...toolsData, ...formattedData]);
        message.success(`Successfully added ${formattedData.length} tools`);
      } catch (error) {
        message.error('Error processing file');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  return (
    <div style={{ padding: '12px 24px 24px 24px' }}> {/* Reduced top padding */}
      <Tabs defaultActiveKey="analytics"  >
        <Tabs.TabPane tab="Analytics" key="analytics" >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card hoverable onClick={() => handleCardClick('totalTools')}>
                <Space align="center">
                  <ToolOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div>
                    <h3 style={{ margin: 0, color: '#8c8c8c' }}>Total Tools</h3>
                    <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.totalTools}</h2>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={8}>
              <Card hoverable onClick={() => handleCardClick('availableTools')}>
                <Space align="center">
                  <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  <div>
                    <h3 style={{ margin: 0, color: '#8c8c8c' }}>Available Tools</h3>
                    <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.availableTools}</h2>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={8}>
              <Card hoverable onClick={() => handleCardClick('inUseTools')}>
                <Space align="center">
                  <BarChartOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                  <div>
                    <h3 style={{ margin: 0, color: '#8c8c8c' }}>In Use Tools</h3>
                    <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.inUseTools}</h2>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={8}>
              <Card hoverable onClick={() => handleCardClick('maintenanceTools')}>
                <Space align="center">
                  <PieChartOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                  <div>
                    <h3 style={{ margin: 0, color: '#8c8c8c' }}>Under Maintenance</h3>
                    <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.maintenanceTools}</h2>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={8}>
              <Card hoverable onClick={() => handleCardClick('totalRequests')}>
                <Space align="center">
                  <LineChartOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                  <div>
                    <h3 style={{ margin: 0, color: '#8c8c8c' }}>Total Requests</h3>
                    <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.totalRequests}</h2>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={8}>
              <Card hoverable onClick={() => handleCardClick('pendingRequests')}>
                <Space align="center">
                  <DashboardOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />
                  <div>
                    <h3 style={{ margin: 0, color: '#8c8c8c' }}>Pending Requests</h3>
                    <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.pendingRequests}</h2>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Tools" key="tools">
          <Card 
            title="Tools Inventory"
            extra={
              <Space>
                <Button type="primary" onClick={showModal}>Add New Tool</Button>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadData}>
                  Download Template
                </Button>
                <Upload
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  beforeUpload={handleFileUpload}
                >
                  <Button icon={<UploadOutlined />}>
                    Upload Excel
                  </Button>
                </Upload>
              </Space>
            }
          >
            <Table 
              columns={columns} 
              dataSource={toolsData}
              pagination={{ 
                pageSize: 8,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Add New Tool"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            lastUpdated: dayjs(),
            status: 'Available'
          }}
        >
          <Form.Item
            name="toolId"
            label="Tool ID"
            rules={[{ required: true, message: 'Please input the Tool ID!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="toolName"
            label="Tool Name"
            rules={[{ required: true, message: 'Please input the Tool Name!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input the Quantity!' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
          
          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please select the Location!' }]}
          >
            <Select>
              <Select.Option value="Warehouse A">Warehouse A</Select.Option>
              <Select.Option value="Warehouse B">Warehouse B</Select.Option>
              <Select.Option value="Warehouse C">Warehouse C</Select.Option>
              <Select.Option value="Warehouse D">Warehouse D</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="lastUpdated"
            label="Last Updated"
          >
            <DatePicker style={{ width: '100%' }} disabled />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">Submit</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Inventory;