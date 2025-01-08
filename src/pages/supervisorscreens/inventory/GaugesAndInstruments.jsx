import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const GaugesAndInstruments = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [GaugesAndInstrumentsData, setGaugesAndInstrumentsData] = useState([
    {
      key: '1',
      id: '001',
      type: 'Type A',
      description: 'High precision end mill',
      instrument_code: 'INST001',
      size: '8mm',
      equipment_number: 'EQ001',
      maintenance_plan: 'Monthly',
      notification_number: 'NOTIF001',
      calibration_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      calibration_due_date: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      location: 'Warehouse 1',
      quantity: 10,
      status: 'Available',
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
      const updatedData = GaugesAndInstrumentsData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setGaugesAndInstrumentsData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${GaugesAndInstrumentsData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setGaugesAndInstrumentsData([...GaugesAndInstrumentsData, newTool]); // Add new tool to the list
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
        setGaugesAndInstrumentsData(GaugesAndInstrumentsData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(GaugesAndInstrumentsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GaugesAndInstruments Data");
    XLSX.writeFile(wb, "GaugesAndInstruments_template.xlsx");
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
                key: item.key,
                id: item.id || '',
                type: item.type || '',
                description: item.description || '',
                instrument_code: item.instrument_code || '',
                size: item.size || '',
                equipment_number: item.equipment_number || '',
                maintenance_plan: item.maintenance_plan || '',
                notification_number: item.notification_number || '',
                calibration_date: item.calibration_date || '',
                calibration_due_date: item.calibration_due_date || '',
                location: item.location || '',
                quantity: parseInt(item.quantity) || 0,
                status: item.status || '',
            }));

            setGaugesAndInstrumentsData([...GaugesAndInstrumentsData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} GaugesAndInstruments`);
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
      onFilter: (value, record) => record.key === value,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.type))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.type.includes(value),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => a.description.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.description))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.description.includes(value),
    },
    {
      title: 'Instrument Code',
      dataIndex: 'instrument_code',
      key: 'instrument_code',
      sorter: (a, b) => a.instrument_code.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.instrument_code))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.instrument_code.includes(value),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      sorter: (a, b) => a.size.localeCompare(b.size),
    },
    {
      title: 'Equipment Number',
      dataIndex: 'equipment_number',
      key: 'equipment_number',
      sorter: (a, b) => a.equipment_number.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.equipment_number))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.equipment_number.includes(value),
    },
    {
      title: 'Maintenance Plan',
      dataIndex: 'maintenance_plan',
      key: 'maintenance_plan',
      sorter: (a, b) => a.maintenance_plan.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.maintenance_plan))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.maintenance_plan.includes(value),
    },
    {
      title: 'Notification Number',
      dataIndex: 'notification_number',
      key: 'notification_number',
      sorter: (a, b) => a.notification_number.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.notification_number))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.notification_number.includes(value),
    },
    {
      title: 'Calibration Date',
      dataIndex: 'calibration_date',
      key: 'calibration_date',
      sorter: (a, b) => a.calibration_date.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.calibration_date))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.calibration_date.includes(value),
    },
    {
      title: 'Calibration Due Date',
      dataIndex: 'calibration_due_date',
      key: 'calibration_due_date',
      sorter: (a, b) => a.calibration_due_date.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.calibration_due_date))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.calibration_due_date.includes(value),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a, b) => a.location.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.location))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.location.includes(value),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.quantity))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.quantity.includes(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.status))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.status.includes(value),
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
        title="GaugesAndInstruments Data"
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
          dataSource={GaugesAndInstrumentsData}
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
            calibration_date: dayjs(),
            calibration_due_date: dayjs().add(1, 'month'),
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
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please input the Type!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please input the Description!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="instrument_code"
                label="Instrument Code"
                rules={[{ required: true, message: 'Please input the Instrument Code!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Please input the Size!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="equipment_number"
                label="Equipment Number"
                rules={[{ required: true, message: 'Please input the Equipment Number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="maintenance_plan"
                label="Maintenance Plan"
                rules={[{ required: true, message: 'Please input the Maintenance Plan!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="notification_number"
                label="Notification Number"
                rules={[{ required: true, message: 'Please input the Notification Number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="calibration_date"
                label="Calibration Date"
                rules={[{ required: true, message: 'Please input the Calibration Date!' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="calibration_due_date"
                label="Calibration Due Date"
                rules={[{ required: true, message: 'Please input the Calibration Due Date!' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please input the Location!' }]}
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

export default GaugesAndInstruments;