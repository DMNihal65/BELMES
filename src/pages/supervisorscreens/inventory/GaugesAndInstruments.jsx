import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

const GaugesAndInstruments = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // Sample data for table
  const [gaugesData, setGaugesData] = useState([
    {
      key: '1',
      type: 'Threaded Plug Gauge',
      description: 'M14X1-7H',
      instrument_code: 'L4-17219',
      validation: 'Replacement *',
    },
    {
      key: '2',
      type: 'Plain Plug Gauge',
      description: 'Ø 4.3 to Ø 4.5',
      instrument_code: 'L2-8041',
      validation: 'Replacement *',
    },
    {
      key: '3',
      type: 'Vernier Caliper',
      description: '0 to 150 mm',
      instrument_code: 'L14-1367',
      validation: 'Up to 2 years',
    },
    {
      key: '4',
      type: 'Micrometer',
      description: '0 to 25 mm',
      instrument_code: 'L13-1567',
      validation: 'Up to 2 years',
    },
    {
      key: '5',
      type: 'Height Gauge',
      description: '0 to 300 mm',
      instrument_code: 'L14-1390',
      validation: 'Up to 2 years',
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
    const newGauge = {
      key: `${gaugesData.length + 1}`,
      type: values.type,
      description: values.description,
      instrument_code: values.instrument_code,
      validation: values.validation,
    };
    
    setGaugesData([...gaugesData, newGauge]);
    message.success('Gauge added successfully');
    handleCancel();
  };

  const columns = [
    {
      title: 'Sl No',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: 'Gauge/Instruments Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
        filterSearch: true,
        filters: [...new Set(gaugesData.map(item => item.type))].map(type => ({
          text: type,
          value: type,
        })),
        onFilter: (value, record) => record.type.indexOf(value) === 0,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Instrument Code',
      dataIndex: 'instrument_code',
      key: 'instrument_code',
      sorter: (a, b) => a.instrument_code.localeCompare(b.instrument_code),
        filterSearch: true,
        filters: [...new Set(gaugesData.map(item => item.instrument_code))].map(instrument_code => ({
          text: instrument_code,
          value: instrument_code,
        })),
        onFilter: (value, record) => record.instrument_code.indexOf(value) === 0,
    },
    {
      title: 'Validation',
      dataIndex: 'validation',
      key: 'validation',
    },
  ];

  return (
    <div>
      <Card 
        title="Gauges and Instruments"
        extra={
          <Space>
            <Button onClick={showModal}>Add New Gauge</Button>
            <Button icon={<DownloadOutlined />}>Download</Button>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={() => false} // Prevent automatic upload
            >
              <Button icon={<UploadOutlined />}>Upload Excel</Button>
            </Upload>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={gaugesData}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title="Add New Gauge"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="type"
            label="Gauge/Instruments Type"
            rules={[{ required: true, message: 'Please input the Gauge Type!' }]}
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
            name="instrument_code"
            label="Instrument Code"
            rules={[{ required: true, message: 'Please input the Instrument Code!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="validation"
            label="Validation"
            rules={[{ required: true, message: 'Please input the Validation!' }]}
          >
            <Input />
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

export default GaugesAndInstruments;