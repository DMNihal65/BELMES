import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const Consumables = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [ConsumablesData, setConsumablesData] = useState([
    {
      key: '1',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'High precision end mill',
      quantity: 10,
      unit_id: 'UNIT001', // Added unit_id
      status: 'Available',
      available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), // Added available_from
    },
    // ... other existing data ...
  ]);

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
      const updatedData = ConsumablesData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setConsumablesData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${ConsumablesData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setConsumablesData([...ConsumablesData, newTool]); // Add new tool to the list
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
        setConsumablesData(ConsumablesData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(ConsumablesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consumables Data");
    XLSX.writeFile(wb, "Consumables_template.xlsx");
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
                key: item.key || `T${ConsumablesData.length + 1}`, // Generate a new key if not present
                id: item.id || '',
                description: item.description || '',
                unit_id: item.unit_id || '',
                quantity: parseInt(item.quantity) || 0,
            }));

            setConsumablesData([...ConsumablesData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} Consumables`);
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
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    sorter: (a, b) => a.description.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(ConsumablesData.map(item => item.description))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.description.includes(value),
  },
  {
    title: 'Unit ID',
    dataIndex: 'unit_id',
    key: 'unit_id',
    sorter: (a, b) => a.unit_id.localeCompare(b.type),
    filterSearch: true,
    filters: [...new Set(ConsumablesData.map(item => item.unit_id))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.unit_id.includes(value),
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    sorter: (a, b) => a.quantity.localeCompare(b.type),
    filterSearch: true,
    filters: [...new Set(ConsumablesData.map(item => item.quantity))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.unit_id.includes(value),
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
        title="Consumables Data"
        extra={
          <Space>
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
          dataSource={ConsumablesData}
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
                name="unit_id" // New field
                label="Unit ID"
                rules={[{ required: true, message: 'Please input the Unit ID!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please input the Quantity!' }]}
              >
                <Input type="number" min={0} />
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

export default Consumables;