import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col,  Input as AntInput  } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const RawMaterials = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [RawMaterialsData, setRawMaterialsData] = useState([
    {
      key: '1',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'High precision end mill',
      stock: 10,
      unit_id: 'UNIT001', // Added unit_id
      available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), 
      status: 'Available',
    },
    {
        key: '2',
        id: '001',
        order_id: 'ORD001', // Added order_id
        part_number: 'PART001', // Added part_number
        description: 'low precision end mill',
        unit_id: 'UNIT001', 
        available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), // Added available_from
        stock: 10,
        status: 'In Use',
      },
    // ... other existing data ...
  ]);

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  // Modify the columns array to work with global search
  const getFilteredData = () => {
    if (!searchText) return RawMaterialsData;

    return RawMaterialsData.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key]?.toString().toLowerCase();
        return value?.includes(searchText.toLowerCase());
      });
    });
  };

  const showModal = () => {
    form.resetFields(); // Reset form fields when opening the modal
    setIsModalVisible(true);
    setEditingKey(null); // Reset editing key for adding new tool
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingKey(null); // Reset editing key
  };

  const handleSubmit = (values) => {
    if (editingKey) { // Check if we are editing an existing row
      const updatedData = RawMaterialsData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setRawMaterialsData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${RawMaterialsData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setRawMaterialsData([...RawMaterialsData, newTool]); // Add new tool to the list
      message.success('Tool added successfully');
    }
    handleCancel(); // Close the modal
  };

  const handleEditOrder = (record) => {
    form.setFieldsValue(record); // Set the form fields with the selected record's data
    setIsModalVisible(true); // Show the modal for editing
    setEditingKey(record.key); // Set the editing key
  };

  const handleDeleteOrder = (record) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this tool?',
      onOk: () => {
        setRawMaterialsData(RawMaterialsData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(RawMaterialsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RawMaterials Data");
    XLSX.writeFile(wb, "RawMaterials_template.xlsx");
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            const formattedData = data.map((item) => ({
                key: item.key || `T${RawMaterialsData.length + 1}`, // Generate a new key if not present
                id: item.id || '',
                order_id: item.order_id || '',
                part_number: item.part_number || '',
                description: item.description || '',
                stock: parseInt(item.stock) || 0,
                unit_id: item.unit_id || '',
                status: item.status || '',
                available_from: item.available_from || dayjs().format('YYYY-MM-DD'), // Default to today if not present
            }));

            setRawMaterialsData([...RawMaterialsData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} RawMaterials`);
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
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    sorter: (a, b) => a.id.localeCompare(b.id),
    onFilter: (value, record) => record.id.includes(value),
  },
  {
    title: 'Order ID',
    dataIndex: 'order_id',
    key: 'order_id',
    sorter: (a, b) => a.order_id.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.order_id))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.order_id.includes(value),
  },
  {
    title: 'Part Number',
    dataIndex: 'part_number',
    key: 'part_number',
    sorter: (a, b) => a.part_number.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.part_number))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.part_number.includes(value),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    sorter: (a, b) => a.description.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.description))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.description.includes(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    sorter: (a, b) => a.stock.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.stock.includes(value),
  },
  {
    title: 'Unit ID',
    dataIndex: 'unit_id',
    key: 'unit_id',
    sorter: (a, b) => a.unit_id.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.unit_id))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.unit_id.includes(value),
  },
  {
    title: 'Available From',
    dataIndex: 'available_from',
    key: 'available_from',
    sorter: (a, b) => a.available_from.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.available_from))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.available_from.includes(value),
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditOrder(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteOrder(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title="RawMaterials Data"
        extra={
          <Space>
             <AntInput.Search
              placeholder="Search across all columns..."
              onChange={(e) => handleGlobalSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button className='bg-sky-600 text-white hover:bg-white hover:text-sky-600' 
          onClick={showModal}>
          Add New Tool
      </Button>
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
          dataSource={getFilteredData()}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingKey ? "Edit Tool" : "Add New Tool"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            available_from: dayjs(),
            status: 'Available'
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="id"
                label="ID"
                rules={[{ required: true, message: 'Please input the ID!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="order_id" // New field
                label="Order ID"
                rules={[{ required: true, message: 'Please input the Order ID!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="part_number" // New field
                label="Part Number"
                rules={[{ required: true, message: 'Please input the Part Number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please input the Description!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="Stock"
                rules={[{ required: true, message: 'Please input the Stock!' }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit_id" // New field
                label="Unit ID"
                rules={[{ required: true, message: 'Please input the Unit ID!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please input the Status!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="available_from" // New field
                label="Available From"
                rules={[{ required: true, message: 'Please input the Available From date!' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
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

export default RawMaterials;