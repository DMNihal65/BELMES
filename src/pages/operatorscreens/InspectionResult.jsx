import React, { useState } from 'react';
import { Card, Table, Typography, Space, Button, Row, Col, Statistic, Progress, Select, DatePicker } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function InspectionResult() {
  const navigate = useNavigate();
  const [selectedPartNumber, setSelectedPartNumber] = useState('PA-0678');

  // Mock data for analytics
  const analytics = {
    totalInspections: 150,
    goodParts: 135,
    badParts: 15,
    deviations: 8,
    qualityScore: 90,
  };

  // Mock data for inspection history
  const inspectionHistory = [
    {
      key: '1',
      date: '2024-12-19',
      partNumber: 'PA-0678',
      operator: 'John Doe',
      result: 'Pass',
      deviations: 0,
      remarks: 'All parameters within specification',
    },
    {
      key: '2',
      date: '2024-12-19',
      partNumber: 'PA-0678',
      operator: 'John Doe',
      result: 'Fail',
      deviations: 2,
      remarks: 'Dimension out of tolerance',
    },
    {
      key: '3',
      date: '2024-12-18',
      partNumber: 'PA-0678',
      operator: 'Jane Smith',
      result: 'Pass',
      deviations: 1,
      remarks: 'Minor surface finish variation',
    },
  ];

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Part Number',
      dataIndex: 'partNumber',
      key: 'partNumber',
    },
    {
      title: 'Operator',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result) => (
        <Text
          strong
          style={{
            color: result === 'Pass' ? '#52c41a' : '#f5222d',
          }}
        >
          {result}
        </Text>
      ),
    },
    {
      title: 'Deviations',
      dataIndex: 'deviations',
      key: 'deviations',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/operator/dashboard')}
              size="large"
            >
              Back to Dashboard
            </Button>
            <Title level={4} style={{ margin: 0 }}>Inspection Results</Title>
          </div>
          <Space>
            <Select
              value={selectedPartNumber}
              onChange={setSelectedPartNumber}
              style={{ width: 200 }}
              options={[
                { value: 'PA-0678', label: 'PA-0678' },
                { value: 'PA-0679', label: 'PA-0679' },
              ]}
            />
            <RangePicker />
          </Space>
        </div>

        {/* Analytics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Inspections"
                value={analytics.totalInspections}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Good Parts"
                value={analytics.goodParts}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Bad Parts"
                value={analytics.badParts}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Deviations"
                value={analytics.deviations}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Quality Score Card */}
        <Card className="mb-6">
          <Title level={5}>Quality Score</Title>
          <Progress
            percent={analytics.qualityScore}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </Card>

        {/* Inspection History Table */}
        <Card title="Inspection History">
          <Table
            columns={columns}
            dataSource={inspectionHistory}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </div>
  );
}

export default InspectionResult;