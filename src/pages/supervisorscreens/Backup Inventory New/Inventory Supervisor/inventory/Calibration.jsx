import React, { useState } from 'react'; 
import { Table, Tag, Button, Space, Tooltip, Modal, Input, message, Card, Form, Row, Col } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import 'tailwindcss/tailwind.css';

const RequestTable = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState([
    {
      key: '1',
      slNo: '1',
      instrumentCode: 'L02-8011',
      size: '6.00 - 8.00',
      equipmentNo: '1023510',
      maintaincePlan: '26863',
      notificationNumber: '8000263747',
      calibrationDate: '19-04-2024',
      calibrationDueDate: '26-12-2025',
      remarks: 'CALIBRATED',
      location: 'C2_R3',
      other: 'Yes',
      description: '',
    },
    {
      key: '2',
      slNo: '2',
      instrumentCode: 'L02-8087',
      size: '7.01 - 8.50',
      equipmentNo: '1023511',
      maintaincePlan: '26864',
      notificationNumber: '8000298478',
      calibrationDate: '19-04-2024',
      calibrationDueDate: '06-01-2024',
      remarks: 'CALIBRATED',
      location: 'C2_R3',
      other: '',
      description: 'Naveen Kumar,218477',
    },
    { slNo: '3', instrumentCode: 'L02-8094', size: '3.60 - 4.03', equipmentNo: '1027213', maintaincePlan: '32622', notificationNumber: '8000298500', calibrationDate: '19-04-2024', calibrationDueDate: '10-01-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
    { slNo: '4', instrumentCode: 'L02-8095', size: '3.90 - 4.03', equipmentNo: '1023509', maintaincePlan: '26862', notificationNumber: '8000298501', calibrationDate: '19-04-2024', calibrationDueDate: '24-01-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
    { slNo: '5', instrumentCode: 'L02-8096', size: '4.60 - 5.03', equipmentNo: '1023196', maintaincePlan: '26549', notificationNumber: '8000298504', calibrationDate: '19-04-2024', calibrationDueDate: '20-01-2025', remarks: 'CALIBRATED', location: 'C2_R2', other: '', description:'' },
  ]);

  const handleDetails = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const filteredData = data.filter(
    (item) =>
      item.instrumentCode.toLowerCase().includes(searchText) ||
      item.remarks.toLowerCase().includes(searchText) ||
      item.location.toLowerCase().includes(searchText)
  );

  const getCalibrationStatus = (calibrationDueDate) => {
    const dueDate = new Date(calibrationDueDate);
    const currentDate = new Date();
    const daysRemaining = Math.ceil((dueDate - currentDate) / (1000 * 3600 * 24));

    if (daysRemaining < 0) {
      return { status: 'Overdue', color: 'red' }; // Overdue (red)
    }
    if (daysRemaining <= 15) {
      return { status: 'Near 2 to 15 days', color: 'orange' }; // Near (2 to 15 days) (orange)
    }
    if (daysRemaining <= 30) {
      return { status: 'Near 16 to 30 days', color: 'yellow' }; // Near (16 to 30 days) (yellow)
    }
    return { status: 'Calibrated', color: 'green' }; // Calibrated (green)
  };

  const columns = [
    { title: 'Sl No', dataIndex: 'slNo', key: 'slNo' },
    { title: 'Instrument Code', dataIndex: 'instrumentCode', key: 'instrumentCode' },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { title: 'Equipment No.', dataIndex: 'equipmentNo', key: 'equipmentNo' },
    { title: 'Maintaince Plan', dataIndex: 'maintaincePlan', key: 'maintaincePlan' },
    { title: 'Notification Number', dataIndex: 'notificationNumber', key: 'notificationNumber' },
    { title: 'Calibration Date', dataIndex: 'calibrationDate', key: 'calibrationDate' },
    {
      title: 'Calibration Due Date',
      key: 'calibrationDueDate',
      render: (_, record) => {
        const { status, color } = getCalibrationStatus(record.calibrationDueDate); // Get status and color
        return (
          <Tag color={color} className="text-sm">
            {record.calibrationDueDate}
          </Tag>
        );
      },
    },    
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Other', dataIndex: 'other', key: 'other' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Calibration Status',
      key: 'calibrationStatus',
      render: (_, record) => {
        const { status, color } = getCalibrationStatus(record.calibrationDueDate);
        return (
          <Tag color={color} className="text-sm">{status}</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => handleDetails(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card title="Calibration Table" bordered={false} className="shadow-lg">
        <div className="flex justify-end mb-4">
          <Input.Search placeholder="Search Instruments" onChange={handleSearch} className="w-60" />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            defaultPageSize: 5,
            showSizeChanger: true,
          }}
          rowClassName={(record) => {
            const { color } = getCalibrationStatus(record.calibrationDueDate);
            if (color === 'red') {
              return 'bg-red-100'; // Set red background for overdue rows
            } else if (color === 'orange') {
              return 'bg-orange-100'; // Set orange background for near-overdue rows
            } else if (color === 'yellow') {
              return 'bg-yellow-100'; // Set yellow background for near-warning rows
            }
            return ''; // No background for other rows
          }}
          scroll={{ x: 1000 }}
        />

        <Modal
          title="Instrument Details"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          {selectedRecord && (
            <Form layout="vertical" initialValues={selectedRecord} onFinish={() => {}}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="instrumentCode" label="Instrument Code">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="equipmentNo" label="Equipment No.">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="size" label="Size">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="location" label="Location">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit">Save</Button>
            </Form>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default RequestTable;
