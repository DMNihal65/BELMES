import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col,  Input as AntInput  } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const EndMills = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [EndMillsData, setEndMillsData] = useState([
    {
      key: '1',
      bel_part_number: '3105 120 201 59',
      bel_part_description: 'High precision end mill',
      tool_diameter: 8,
      shank_diameter: 6,
      no_of_flutes: 4,
      flute_length: 50,
      clearance_length: 50,
      total_length: 100,
      corner_radius: 0.5,
      suitable_for: 'Aluminum',
      type_project: 'Milling',
      stock: 10,
      status: 'Available',
    },
    {
      key: '2',
      bel_part_number: '3205 120 201 59',
      bel_part_description: 'Low precision end mill',
      tool_diameter: 8,
      shank_diameter: 6,
      no_of_flutes: 4,
      flute_length: 50,
      clearance_length: 50,
      total_length: 100,
      corner_radius: 0.5,
      suitable_for: 'Aluminum machining',
      type_project: 'Milling and Drilling',
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
    if (!searchText) return EndMillsData;

    return EndMillsData.filter(item => {
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
      const updatedData = EndMillsData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setEndMillsData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${EndMillsData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setEndMillsData([...EndMillsData, newTool]); // Add new tool to the list
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
        setEndMillsData(EndMillsData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(EndMillsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EndMills Data");
    XLSX.writeFile(wb, "EndMills_template.xlsx");
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
                bel_part_number: item.bel_part_number || '',
                bel_part_description: item.bel_part_description || '',
                tool_diameter: parseFloat(item.tool_diameter) || 0,
                shank_diameter: parseFloat(item.shank_diameter) || 0,
                no_of_flutes: parseInt(item.no_of_flutes) || 0,
                flute_length: parseFloat(item.flute_length) || 0, // Added new field
                clearance_length: parseFloat(item.clearance_length) || 0,
                total_length: parseFloat(item.total_length) || 0,
                corner_radius: parseFloat(item.corner_radius) || 0,
                suitable_for: item.suitable_for || '',
                type_project: item.type_project || '',
                stock: parseInt(item.stock) || 0,
            }));

            setEndMillsData([...EndMillsData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} EndMills`);
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
      title: 'Sl No',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
      onFilter: (value, record) => record.key === value,
    },
    {
        title: 'BEL Part Number',
        dataIndex: 'bel_part_number',
        key: 'bel_part_number',
        sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.bel_part_number))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.bel_part_number.includes(value),
    },
    {
        title: 'BEL Part Description',
        dataIndex: 'bel_part_description',
        key: 'bel_part_description',
        sorter: (a, b) => a.bel_part_description.localeCompare(b.bel_part_description),
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.bel_part_description))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.bel_part_description.includes(value),
    },
    {
        title: 'Tool Diameter',
        dataIndex: 'tool_diameter',
        key: 'tool_diameter',
        sorter: (a, b) => a.tool_diameter - b.tool_diameter,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.tool_diameter))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.tool_diameter === value,
    },
    {
        title: 'Shank Diameter',
        dataIndex: 'shank_diameter',
        key: 'shank_diameter',
        sorter: (a, b) => a.shank_diameter - b.shank_diameter,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.shank_diameter))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.shank_diameter === value,
    },
    {
        title: 'No. of Flutes',
        dataIndex: 'no_of_flutes',
        key: 'no_of_flutes',
        sorter: (a, b) => a.no_of_flutes - b.no_of_flutes,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.no_of_flutes))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.no_of_flutes === value,
    },
    {
        title: 'Flute Length',
        dataIndex: 'flute_length',
        key: 'flute_length',
        sorter: (a, b) => a.flute_length - b.flute_length,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.flute_length))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.flute_length === value,
    },
    {
        title: 'Clearance Length',
        dataIndex: 'clearance_length',
        key: 'clearance_length',
        sorter: (a, b) => a.clearance_length - b.clearance_length,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.clearance_length))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.clearance_length === value,
    },
    {
        title: 'Total Length',
        dataIndex: 'total_length',
        key: 'total_length',
        sorter: (a, b) => a.total_length - b.total_length,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.total_length))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.total_length === value,
    },
    {
        title: 'Corner Radius',
        dataIndex: 'corner_radius',
        key: 'corner_radius',
        sorter: (a, b) => a.corner_radius - b.corner_radius,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.corner_radius))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.corner_radius === value,
    },
    {
        title: 'Suitable For',
        dataIndex: 'suitable_for',
        key: 'suitable_for',
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.suitable_for))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.suitable_for.includes(value),
    },
    {
        title: 'Type Project',
        dataIndex: 'type_project',
        key: 'type_project',
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.type_project))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.type_project.includes(value),
    },
    {
        title: 'Stock',
        dataIndex: 'stock',
        key: 'stock',
        sorter: (a, b) => a.stock - b.stock,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.stock === value,
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
        title="EndMills Data"
        extra={
          <Space>
             <AntInput.Search
              placeholder="Search across all columns..."
              onChange={(e) => handleGlobalSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button className='bg-sky-500' style={{ color: '#FFFFFF' }} onClick={showModal}>
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
                name="tool_diameter"
                label="Tool Diameter"
                rules={[{ required: true, message: 'Please input the Tool Diameter!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="shank_diameter"
                label="Shank Diameter"
                rules={[{ required: true, message: 'Please input the Shank Diameter!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="no_of_flutes"
                label="No. of Flutes"
                rules={[{ required: true, message: 'Please input the No. of Flutes!' }]}
              >
                <Input type="number" min={0} step="0.1"/>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
          <Col span={8}>
              <Form.Item
                name="flute_length"
                label="Flute Length"
                rules={[{ required: true, message: 'Please input the Flute Length!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="clearance_length"
                label="Clearance Length"
                rules={[{ required: true, message: 'Please input the Clearance Length!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="total_length"
                label="Total Length"
                rules={[{ required: true, message: 'Please input the Total Length!' }]}
              >
                <Input type="number" min={0} step="0.1"/>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
          <Col span={8}>
              <Form.Item
                name="corner_radius"
                label="Corner Radius"
                rules={[{ required: true, message: 'Please input the Corner Radius!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
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
                name="type_project"
                label="Type Project"
                rules={[{ required: true, message: 'Please input the Type Project!' }]}
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
                <Input type="number" min={0} step="0.1"/>
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

export default EndMills;