import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Select, DatePicker } from 'antd';
import { DownloadOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons'; // Import the icons
import dayjs from 'dayjs'; // Import dayjs
import * as XLSX from 'xlsx';
import '../../../styles/inventory.css';

const Tools = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
 // Sample data for table
 const [toolsData, setToolsData] = useState([
    {
      key: '1',
      type_name: 'End Mill',
      description: 'DBL_CR_HIPR EM ø8x R0.5 4FL L',
      bel_part_number: '3105 120 201 59',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '2',
      type_name: 'End Mill',
      description: 'HPEM-SST-DIA8XR0.5-Z2',
      bel_part_number: '3105 118 202 42',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '3',
      type_name: 'T-Slot End Mill',
      description: 'Uslot R0.5 Cutter Carb-ø8.8-4FL-R0.5',
      bel_part_number: '3120 711 389 89',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '4',
      type_name: 'Centre Bit (CD)',
      description: 'CD-D4-Z2-FL1.5-',
      bel_part_number: '3105 118 401 27',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '5',
      type_name: 'Drill-bit',
      description: 'DR-D1.7-Z2-FL12-CL10.5-SHK3.17',
      bel_part_number: '3105 118 303 30',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '6',
      type_name: 'Drill-bit',
      description: 'DR-D2.6-Z2-FL12-CL10.5-SHK3.17',
      bel_part_number: '3105 118 305 24',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '7',
      type_name: 'Drill-bit',
      description: 'DR-D4.1-Z2-FL12-CL10.5-SHK3.17-',
      bel_part_number: '3105 118 302 33',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '8',
      type_name: 'End Mill',
      description: 'DR-D2.0-Z2-FL12-CL10.5-SHK3.17',
      bel_part_number: '3105 118 106 39',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '9',
      type_name: 'Thread-Mill',
      description: 'TM-M2x0.45-D2.3-1Z3-2Z3-FL1.5',
      bel_part_number: '3120 124 102 42',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '10',
      type_name: 'Thread-Mill',
      description: 'TM-M3x0.5-D2.3-1Z3-2Z3-FL1.5',
      bel_part_number: '3120 124 103 39',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '11',
      type_name: 'Thread-Mill',
      description: 'TM-M6x1-D2.3-1Z3-2Z3-FL1.5',
      bel_part_number: '3120 125 201 43',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '12',
      type_name: 'Chamfer End Mill',
      description: 'Hi Carb-ø4-4FL-Chf PRJ15-OAL57-',
      bel_part_number: '3105 118 201 45',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '13',
      type_name: 'Chamfer Tool',
      description: 'ChamferTool-8mm-60°',
      bel_part_number: '3120 711 386 01',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '14',
      type_name: 'Chamfer Tool',
      description: 'ChamferTool-8mm-90°',
      bel_part_number: '3120 124 301 27',
      quantity: 1,
      status_id: 'Available',
    },
    {
      key: '15',
      type_name: 'Chamfer Tool',
      description: 'Rev Chamfer D-4mm-90°',
      bel_part_number: '3130 124 401 81',
      quantity: 1,
      status_id: 'Available',
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
      type_name: values.type_name,
      description: values.description,
      bel_part_number: values.bel_part_number,
      quantity: values.quantity,
      status_id: values.status_id,
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
                type_name: item.type_name || '',
                description: item.description || '',
                bel_part_number: item.bel_part_number || '', // Ensure partNumber is included
                quantity: parseInt(item.quantity) || 0,
                status_id: `Available`,
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
      title: 'ID',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
    },
    {
        title: 'Tool Type',
        dataIndex: 'type_name',
        key: 'type_name',
        sorter: (a, b) => a.type_name.localeCompare(b.type_name),
        filterSearch: true,
        filters: [...new Set(toolsData.map(item => item.type_name))].map(type => ({
          text: type,
          value: type,
        })),
        onFilter: (value, record) => record.type_name.indexOf(value) === 0,
      },
      {
        title: 'Tool Description',
        dataIndex: 'description',
        key: 'description',
        sorter: (a, b) => a.description.localeCompare(b.description),
        filterSearch: true,
        filters: [...new Set(toolsData.map(item => item.description))].map(desc => ({
          text: desc,
          value: desc,
        })),
        onFilter: (value, record) => record.description.indexOf(value) === 0,
      },
      {
        title: 'BEL Part Number',
        dataIndex: 'bel_part_number',
        key: 'bel_part_number',
        sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
        filterSearch: true,
        filters: [...new Set(toolsData.map(item => item.bel_part_number))].map(partNumber => ({
          text: partNumber,
          value: partNumber,
        })),
        onFilter: (value, record) => record.bel_part_number.indexOf(value) === 0,
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
      render: (status) => (
        <span className={status === 'Available' ? 'status-available' : 'status-in-use'}>
          {status}
        </span>
      ),
    },
    
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="inventory-title">Tools Inventory</h2>
        <Space size="middle">
          <Button
            icon={<PlusOutlined />}
            className="primary-button"
            onClick={showModal}
          >
            Add Tool
          </Button>
          <Button
            icon={<DownloadOutlined />}
            className="download-button"
            onClick={handleDownloadData}
          >
            Export
          </Button>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleFileUpload}
          >
            <Button icon={<UploadOutlined />} className="upload-button">
              Import
            </Button>
          </Upload>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={toolsData}
        className="inventory-table"
        pagination={{ 
          pageSize: 10,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          className: "pagination-custom"
        }}
        scroll={{ x: 'max-content' }}
        rowClassName="hover:bg-gray-50"
      />

      <Modal
        title={<span className="text-lg font-semibold">Add New Tool</span>}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        className="custom-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="p-4"
        >
          <Form.Item
            name="type_name" // Changed from toolId to toolName
            label="Tool Type"
            rules={[{ required: true, message: 'Please input the Tool Name!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description" // Added description field
            label="Description"
            rules={[{ required: true, message: 'Please input the Description!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="bel_part_number" // Added part number field
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
            name="lastUpdated"
            label="Last Updated"
          >
            <DatePicker className="w-full" disabled />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button className="secondary-button" onClick={handleCancel}>
                Cancel
              </Button>
              <Button className="primary-button" htmlType="submit">
                Add Tool
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tools;