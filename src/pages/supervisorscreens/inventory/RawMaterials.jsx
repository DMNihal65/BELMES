// src/pages/supervisorscreens/inventory/RawMaterials.jsx
import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, DatePicker } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'; // Import the icons
import dayjs from 'dayjs'; // Import dayjs
import * as XLSX from 'xlsx';

const RawMaterials = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [rawMaterialsData, setRawMaterialsData] = useState([
    {
      key: '1',
      type_name: 'Steel',
      description: 'High carbon steel',
      bel_part_number: 'RM-001',
      quantity: 100,
      status_id: 'Available',
      available_from: '2023-01-01',
    },
    // Add more raw materials as needed
  ]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleSubmit = (values) => {
    const newMaterial = {
      key: `RM${rawMaterialsData.length + 1}`,
      type_name: values.type_name,
      description: values.description,
      bel_part_number: values.bel_part_number,
      quantity: values.quantity,
      status_id: values.status_id,
      available_from: values.available_from.format('YYYY-MM-DD'), // Format date
    };

    setRawMaterialsData([...rawMaterialsData, newMaterial]);
    message.success('Raw Material added successfully');
    handleCancel();
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(rawMaterialsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Raw Materials Data");
    XLSX.writeFile(wb, "raw_materials_template.xlsx");
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
          key: `RM${rawMaterialsData.length + index + 1}`,
          type_name: item.type_name || '',
          description: item.description || '',
          bel_part_number: item.bel_part_number || '',
          quantity: parseInt(item.quantity) || 0,
          status_id: 'Available',
          available_from: item.available_from || '', // Ensure available_from is included
        }));

        setRawMaterialsData([...rawMaterialsData, ...formattedData]);
        message.success(`Successfully added ${formattedData.length} raw materials`);
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
      title: 'Material Type',
      dataIndex: 'type_name',
      key: 'type_name',
      sorter: (a, b) => a.type_name.localeCompare(b.type_name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: 'BEL Part Number',
      dataIndex: 'bel_part_number',
      key: 'bel_part_number',
      sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Status',
      dataIndex: 'status_id',
      key: 'status_id',
      filters: [
        { text: 'Available', value: 'Available' },
        { text: 'In Use', value: 'In Use' },
      ],
      onFilter: (value, record) => record.status_id === value,
    },
    {
      title: 'Available From',
      dataIndex: 'available_from',
      key: 'available_from',
      sorter: (a, b) => new Date(a.available_from) - new Date(b.available_from),
      render: (date) => <span>{dayjs(date).format('YYYY-MM-DD')}</span>, // Format the date
    },
  ];

  return (
    <div>
      <Card 
        title="Raw Materials"
        extra={
          <Space>
            <Button className='bg-sky-500' style={{ color: '#FFFFFF'}} onMouseEnter={(e) => e.currentTarget.style.color = '#0EA5E9'} 
                    onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'} onClick={showModal}>Add New Material</Button>
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
          dataSource={rawMaterialsData}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="Add New Raw Material"
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
            status_id: 'Available'
          }}
        >
          <Form.Item
            name="type_name"
            label="Material Type"
            rules={[{ required: true, message: 'Please input the Material Type!' }]}
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
            name="bel_part_number"
            label="Part Number"
            rules={[{ required: true, message: 'Please input the Part Number!' }]}
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
            name="available_from"
            label="Available From"
            rules={[{ required: true, message: 'Please select the Available From date!' }]}
          >
            <DatePicker className="w-full" />
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

export default RawMaterials;