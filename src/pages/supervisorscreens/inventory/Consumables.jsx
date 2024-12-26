// src/pages/supervisorscreens/inventory/Consumables.jsx
import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'; // Import the icons
import * as XLSX from 'xlsx';

const Consumables = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [consumablesData, setConsumablesData] = useState([
    {
      key: '1',
      type: 'Cleaning Supplies',
      description: 'Multi-surface cleaner',
      unit: 'Bottle',
      quantity: 50,
    },
    // Add more consumables as needed
  ]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleSubmit = (values) => {
    const newConsumable = {
      key: `C${consumablesData.length + 1}`,
      type: values.type,
      description: values.description,
      unit: values.unit,
      quantity: values.quantity,
    };

    setConsumablesData([...consumablesData, newConsumable]);
    message.success('Consumable added successfully');
    handleCancel();
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(consumablesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consumables Data");
    XLSX.writeFile(wb, "consumables_template.xlsx");
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
          key: `C${consumablesData.length + index + 1}`,
          type: item.type || '',
          description: item.description || '',
          unit: item.unit || '',
          quantity: parseInt(item.quantity) || 0,
        }));

        setConsumablesData([...consumablesData, ...formattedData]);
        message.success(`Successfully added ${formattedData.length} consumables`);
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
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      sorter: (a, b) => a.unit.localeCompare(b.unit),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
  ];

  return (
    <div>
      <Card 
        title="Consumables"
        extra={
          <Space>
            <Button className='bg-sky-500' style={{ color: '#FFFFFF'}} onMouseEnter={(e) => e.currentTarget.style.color = '#0EA5E9'} 
                    onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'} onClick={showModal}>Add New Consumable</Button>
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
          dataSource={consumablesData}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="Add New Consumable"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            quantity: 0,
          }}
        >
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please input the Type!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the Description!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unit"
            rules={[{ required: true, message: 'Please input the Unit!' }]}
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