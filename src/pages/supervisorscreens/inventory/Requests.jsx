import React, { useState } from 'react';
import { Table, Tag, Button, Space, Tooltip, Modal, Input, message, Card, Form, Row, Col,   Input as AntInput  } from 'antd';
import { EyeOutlined, CheckOutlined } from '@ant-design/icons';
import 'tailwindcss/tailwind.css';

const RequestTable = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [RequestData, setRequestData] = useState([
    {
      key: '1',
      requestId: 'REQ001',
      operatorName: 'Nanjan',
      requestTime: '2024-08-20 10:00 AM',
      status: 'approved',
      details: {
        partNumber: 'BEL1234',
        description: 'High Precision Tool',
        toolDiameter: '10mm',
        shankDiameter: '8mm',
        noOfFlutes: 4,
        fluteLength: '50mm',
        clearanceLength: '30mm',
        totalLength: '100mm',
        cornerRadius: '2mm',
        suitableFor: 'Steel',
        typeProject: 'Manufacturing',
        stock: 20,
        status: 'In Stock',
      },
    },
    {
      key: '2',
      requestId: 'REQ002',
      operatorName: 'Samarth',
      requestTime: '2024-08-20 11:00 AM',
      status: 'pending',
      details: {
        partNumber: 'BEL5678',
        description: 'Cutting Tool',
        toolDiameter: '12mm',
        shankDiameter: '10mm',
        noOfFlutes: 6,
        fluteLength: '60mm',
        clearanceLength: '40mm',
        totalLength: '120mm',
        cornerRadius: '1mm',
        suitableFor: 'Aluminum',
        typeProject: 'Assembly',
        stock: 10,
        status: 'Low Stock',
      },
    },
  ]);

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  // Modify the columns array to work with global search
  const getFilteredData = () => {
    if (!searchText) return RequestData;

    return RequestData.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key]?.toString().toLowerCase();
        return value?.includes(searchText.toLowerCase());
      });
    });
  };

  const handleDetails = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleApprove = (key) => {
    setRequestData((prevData) =>
      prevData.map((item) =>
        item.key === key ? { ...item, status: 'approved' } : item
      )
    );
    message.success('Request approved successfully!');
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const filteredData = RequestData.filter(
    (item) =>
      item.requestId.toLowerCase().includes(searchText) ||
      item.operatorName.toLowerCase().includes(searchText) ||
      item.status.toLowerCase().includes(searchText)
  );

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'requestId',
      key: 'requestId',
      sorter: (a, b) => a.requestId.localeCompare(b.requestId),
    },
    {
      title: 'Operator Name',
      dataIndex: 'operatorName',
      key: 'operatorName',
      sorter: (a, b) => a.operatorName.localeCompare(b.operatorName),
    },
    {
      title: 'Request Time',
      dataIndex: 'requestTime',
      key: 'requestTime',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'pending' ? 'red' : 'green'}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => handleDetails(record)} />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Approve">
              <Button
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.key)}
                className="text-green-500"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
        <Card title="Requests Table" extra={
          <AntInput.Search
            placeholder="Search across all columns..."
            onChange={(e) => handleGlobalSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        }
        bordered={false} className="shadow-lg">

      <Table
        columns={columns}
        dataSource={getFilteredData()}
        rowClassName={(record) => (record.status === 'pending' ? 'bg-red-50' : '')}
        pagination={{
          defaultPageSize: 5,
          showSizeChanger: true,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="Request Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedRecord && (
          <Form
            layout="vertical"
            initialValues={selectedRecord.details}
            onFinish={() => {}}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="partNumber"
                  label="BEL Part Number"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="description"
                  label="Description"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="toolDiameter"
                  label="Tool Diameter"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="shankDiameter"
                  label="Shank Diameter"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="noOfFlutes"
                  label="No. of Flutes"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="fluteLength"
                  label="Flute Length"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="clearanceLength"
                  label="Clearance Length"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="totalLength"
                  label="Total Length"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="cornerRadius"
                  label="Corner Radius"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="suitableFor"
                  label="Suitable For"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="typeProject"
                  label="Type Project"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="stock"
                  label="Stock"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="status"
                  label="Status"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>
      </Card>
    </div>
  );
};

export default RequestTable;
