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
import { ArrowUpIcon } from 'lucide-react';

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
      partNumber: 'PN-001',
      category: 'Cutting Tools',
      quantity: 5,
      location: 'Warehouse A',
      lastUpdated: '2024-03-15',
      status: 'Available',
    },
    {
      key: '2',
      toolId: 'T002',
      toolName: 'Circular Saw',
      partNumber: 'PN-002',
      category: 'Cutting Tools',
      quantity: 3,
      location: 'Warehouse B',
      lastUpdated: '2024-03-14',
      status: 'In Use',
    },
    {
      key: '3',
      toolId: 'T003',
      toolName: 'Wrench Set',
      partNumber: 'PN-003',
      category: 'Tool Holders',
      quantity: 8,
      location: 'Warehouse A',
      lastUpdated: '2024-03-13',
      status: 'Available',
    },
    {
      key: '4',
      toolId: 'T004',
      toolName: 'Safety Goggles',
      partNumber: 'PN-004',
      category: 'Consumables',
      quantity: 0,
      location: 'Warehouse C',
      lastUpdated: '2024-03-12',
      status: 'In Use',
    },
    {
      key: '5',
      toolId: 'T005',
      toolName: 'Hammer',
      partNumber: 'PN-005',
      category: 'Raw Materials',
      quantity: 12,
      location: 'Warehouse B',
      lastUpdated: '2024-03-11',
      status: 'Available',
    },
    {
      key: '6',
      toolId: 'T006',
      toolName: 'Screwdriver Set',
      partNumber: 'PN-006',
      category: 'Tool Holders',
      quantity: 4,
      location: 'Warehouse A',
      lastUpdated: '2024-03-10',
      status: 'In Use',
    },
    {
      key: '7',
      toolId: 'T007',
      toolName: 'Level Tool',
      partNumber: 'PN-007',
      category: 'Measuring Instruments',
      quantity: 6,
      location: 'Warehouse C',
      lastUpdated: '2024-03-09',
      status: 'Available',
    },
    {
      key: '8',
      toolId: 'T008',
      toolName: 'Measuring Tape',
      partNumber: 'PN-008',
      category: 'Measuring Instruments',
      quantity: 15,
      location: 'Warehouse B',
      lastUpdated: '2024-03-08',
      status: 'Available',
    },
    {
      key: '9',
      toolId: 'T009',
      toolName: 'Machine Oil',
      partNumber: 'PN-009',
      category: 'Consumables',
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
      title: 'Part Number',
      dataIndex: 'partNumber',
      key: 'partNumber',
      sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.partNumber,
        value: item.partNumber,
      })))],
      onFilter: (value, record) => record.partNumber.indexOf(value) === 0,
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
      filterSearch: true,
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
      filterSearch: true,
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
      filterSearch: true,
      render: (status) => (
        <span style={{ color: status === 'Available' ? '#52c41a' : '#faad14' }}>
          {status}
        </span>
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
                status: item.status || 'Available',
                partNumber: item.partNumber || '', // Ensure partNumber is included
                category: item.category || '' // Ensure category is included
            }));

            setToolsData([...toolsData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} tools`);
        } catch (error) {
            message.error('Error processing file');
            console.error(error);
        }
    };
    reader.readAsBinaryString(file);
    return false; // Prevent automatic upload
};

  const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
    return (
      <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            <div className="flex items-center gap-1.5">
              <ArrowUpIcon className="w-5 h-5 text-sky-500" />
              <span className="text-sky-500 text-sm font-medium">{trend}%</span>
              <span className="text-gray-500 text-sm">{trendPeriod}</span>
            </div>
          </div>
          <div className="p-4 bg-sky-100 rounded-xl">
          <Icon style={{ fontSize: '40px', color: '#0EA5E9' }} /> {/* Set icon size directly */}
          </div>
        </div>
      </div>
    );
  };
  
  

  return (
    <div className="p-3 md:p-6"> {/* Reduced top padding */}
      <Tabs defaultActiveKey="analytics"  >
      <Tabs.TabPane tab="Analytics" key="analytics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
          <MetricCard
            title="Total Tools"
            value={summaryData.totalTools.toLocaleString()}
            trend={summaryData.totalToolsChange}
            trendPeriod={summaryData.totalToolsPeriod}
            icon={ToolOutlined}
          />
          <MetricCard
            title="Raw Materials"
            value={summaryData.rawMaterials.toLocaleString()}
            trend={summaryData.rawMaterialsChange}
            trendPeriod={summaryData.rawMaterialsPeriod}
            icon={BarChartOutlined}
          />
          <MetricCard
            title="Consumables"
            value={summaryData.consumables.toLocaleString()}
            trend={summaryData.consumablesChange}
            trendPeriod={summaryData.consumablesPeriod}
            icon={PieChartOutlined}
          />
          <MetricCard
            title="Available Tools"
            value={summaryData.availableTools.toLocaleString()}
            trend={summaryData.availableToolsChange}
            trendPeriod={summaryData.availableToolsPeriod}
            icon={CheckCircleOutlined}
          />
          <MetricCard
            title="In Use Tools"
            value={summaryData.inUseTools.toLocaleString()}
            trend={summaryData.inUseToolsChange}
            trendPeriod={summaryData.inUseToolsPeriod}
            icon={LineChartOutlined}
          />
          <MetricCard
            title="Total Requests"
            value={summaryData.totalRequests.toLocaleString()}
            trend={summaryData.totalRequestsChange}
            trendPeriod={summaryData.totalRequestsPeriod}
            icon={DashboardOutlined}
          />
        </div>
      </Tabs.TabPane>


        <Tabs.TabPane tab="Tools" key="tools">
          <Card 
            title="Tools Inventory"
            extra={
              <Space>
                <Button className='bg-sky-500 ' style={{ color: '#FFFFFF'}} onMouseEnter={(e) => e.currentTarget.style.color = '#0EA5E9'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}   onClick={showModal}>Add New Tool</Button>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadData}>
                  Download
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
            <DatePicker className="w-full" disabled />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
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