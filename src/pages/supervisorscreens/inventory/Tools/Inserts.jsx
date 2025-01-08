import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const Inserts = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);

  const [InsertsData, setInsertsData] = useState([
    {
      key: '1',
      bel_part_number: '3105 120 201 59',
      bel_part_description: 'High precision end mill',
      configuration: '', // Added new field
      type: '', // Added new field
      size: '', // Added new field
      no_of_edges: 0, // Added new field
      thickness: 0, // Added new field
      corner_radius: 0, // Added new field
      suitable_for: 'Aluminum',
      tool_material: 'Carbide',
      project: 'Milling',
      stock: 10,
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
      const updatedData = InsertsData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setInsertsData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${InsertsData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setInsertsData([...InsertsData, newTool]); // Add new tool to the list
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
        setInsertsData(InsertsData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(InsertsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inserts Data");
    XLSX.writeFile(wb, "Inserts_template.xlsx");
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
                key: item.key || `T${InsertsData.length + index + 1}`, // Generate a new key if not present
                bel_part_number: item.bel_part_number || '',
                bel_part_description: item.bel_part_description || '',
                configuration: item.configuration || '', // New field
                type: item.type || '', // New field
                size: item.size || '', // New field
                no_of_edges: parseInt(item.no_of_edges) || 0, // New field
                thickness: parseFloat(item.thickness) || 0, // New field
                corner_radius: parseFloat(item.corner_radius) || 0, // New field
                suitable_for: item.suitable_for || '',
                tool_material: item.tool_material || '', // New field
                project: item.project || '', // New field
                stock: parseInt(item.stock) || 0,
            }));
  
            setInsertsData([...InsertsData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} Inserts`);
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
      title: 'SL. No',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: 'BEL Part Number',
      dataIndex: 'bel_part_number',
      key: 'bel_part_number',
      sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
    },
    {
      title: 'BEL Part Description',
      dataIndex: 'bel_part_description',
      key: 'bel_part_description',
      sorter: (a, b) => a.bel_part_description.localeCompare(b.bel_part_description),
    },
    {
      title: 'Configuration', // Added new column
      dataIndex: 'configuration',
      key: 'configuration',
      sorter: (a, b) => a.configuration.localeCompare(b.configuration),
    },
    {
      title: 'Type', // Added new column
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: 'Size', // Added new column
      dataIndex: 'size',
      key: 'size',
      sorter: (a, b) => a.size.localeCompare(b.size),
    },
    {
      title: 'No. of Edges', // Added new column
      dataIndex: 'no_of_edges',
      key: 'no_of_edges',
      sorter: (a, b) => a.no_of_edges - b.no_of_edges,
    },
    {
      title: 'Thickness', // Added new column
      dataIndex: 'thickness',
      key: 'thickness',
      sorter: (a, b) => a.thickness - b.thickness,
    },
    {
      title: 'Corner Radius', // Added new column
      dataIndex: 'corner_radius',
      key: 'corner_radius',
      sorter: (a, b) => a.corner_radius - b.corner_radius,
    },
    {
      title: 'Suitable For',
      dataIndex: 'suitable_for',
      key: 'suitable_for',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.suitable_for))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.suitable_for.includes(value),
    },
    {
      title: 'Tool Material',
      dataIndex: 'tool_material',
      key: 'tool_material',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.tool_material))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.tool_material.includes(value),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.project))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.project.includes(value),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.stock === value,
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
        title="Inserts Data"
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
          dataSource={InsertsData}
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
            lastUpdated: dayjs(),
            status: 'Available'
          }}
        >
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="bel_part_number"
                label="BEL Part Number"
                rules={[{ required: true, message: 'Please input the BEL Part Number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bel_part_description"
                label="BEL Part Description"
                rules={[{ required: true, message: 'Please input the BEL Part Description!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="configuration" // Added new field
                label="Configuration"
                rules={[{ required: true, message: 'Please input the Configuration!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="type" // Added new field
                label="Type"
                rules={[{ required: true, message: 'Please input the Type!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="size" // Added new field
                label="Size"
                rules={[{ required: true, message: 'Please input the Size!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="no_of_edges" // Added new field
                label="No. of Edges"
                rules={[{ required: true, message: 'Please input the No. of Edges!' }]}
              >
                <Input type="number" min={0} step="1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="thickness" // Added new field
                label="Thickness"
                rules={[{ required: true, message: 'Please input the Thickness!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="corner_radius" // Added new field
                label="Corner Radius"
                rules={[{ required: true, message: 'Please input the Corner Radius!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="suitable_for"
                label="Suitable For"
                rules={[{ required: true, message: 'Please input what the tool is suitable for!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tool_material"
                label="Tool Material"
                rules={[{ required: true, message: 'Please input the Tool Material!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="project"
                label="Project"
                rules={[{ required: true, message: 'Please input the Project!' }]}
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
                <Input type="number" min={0} step="1"/>
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

export default Inserts;