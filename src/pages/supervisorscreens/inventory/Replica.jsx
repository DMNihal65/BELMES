import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Select, DatePicker } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'; // Import the icons
import dayjs from 'dayjs'; // Import dayjs
import * as XLSX from 'xlsx';

const Tools = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
 // Sample data for table
 const [toolsData, setToolsData] = useState([
    {
      key: '1',
      toolId: 'T001',
      toolName: 'Power Drill',
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
      category: 'Consumables',
      quantity: 15,
      location: 'Warehouse D',
      lastUpdated: '2024-03-09',
      status: 'Available',
    },
  ]);

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
      category: values.category,
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

  return (
    <div>
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
            name="category"
            label="Category "
            rules={[{ required: true, message: 'Please input the Category!' }]}
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
};

export default Tools;