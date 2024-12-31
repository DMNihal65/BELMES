// File: ../operatorscreens/JobDetails/IPID.jsx
import React, { useState } from 'react';
import { 
  Button, Modal, Spin, Card, Table, Space, Tag, 
  Typography, Alert, Tooltip, Steps 
} from 'antd';
import { 
  LoadingOutlined, CheckCircleOutlined, 
  WarningOutlined, InfoCircleOutlined,
  RightOutlined, FileTextOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

const IPID = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const inspectionPoints = [
    {
      id: 1,
      parameter: 'Length',
      nominal: '100',
      tolerance: '±0.1',
      unit: 'mm',
      method: 'Vernier Caliper',
      frequency: 'Every Part',
      status: 'pending'
    },
    {
      id: 2,
      parameter: 'Width',
      nominal: '50',
      tolerance: '±0.1',
      unit: 'mm',
      method: 'Vernier Caliper',
      frequency: 'Every Part',
      status: 'pending'
    },
    // Add more inspection points...
  ];

  const handleIPIDClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/open-exe', { method: 'POST' });
      if (response.ok) {
        console.log('QMS application opened successfully');
      } else {
        throw new Error('Failed to open QMS application');
      }
    } catch (error) {
      console.error(error);
      Modal.error({
        title: 'Error',
        content: 'Failed to open QMS application. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      title: 'Parameter',
      dataIndex: 'parameter',
      key: 'parameter',
    },
    {
      title: 'Nominal',
      dataIndex: 'nominal',
      key: 'nominal',
      render: (text, record) => `${text} ${record.unit}`,
    },
    {
      title: 'Tolerance',
      dataIndex: 'tolerance',
      key: 'tolerance',
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          icon={status === 'completed' ? <CheckCircleOutlined /> : <WarningOutlined />}
          color={status === 'completed' ? 'success' : 'warning'}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="m-0">In-Process Inspection Details</Title>
          <Space>
            <Button 
              icon={<InfoCircleOutlined />}
              onClick={() => setShowInstructions(true)}
            >
              Instructions
            </Button>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={handleIPIDClick}
              loading={isLoading}
            >
              Open QMS
            </Button>
          </Space>
        </div>

        <Alert
          message="Inspection Requirements"
          description="All measurements must be recorded in QMS. Ensure proper calibration of measuring instruments."
          type="info"
          showIcon
          className="mb-4"
        />

        <Table 
          columns={columns} 
          dataSource={inspectionPoints}
          pagination={false}
          className="mb-4"
        />

        <Steps size="small" current={1}>
          <Step title="Setup" description="Verify instruments" />
          <Step title="Measure" description="Record values" />
          <Step title="Verify" description="Check compliance" />
          <Step title="Submit" description="Update QMS" />
        </Steps>
      </Card>

      {/* Instructions Modal */}
      <Modal
        title="Inspection Instructions"
        open={showInstructions}
        onCancel={() => setShowInstructions(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <Alert
            message="Important Note"
            description="Follow all safety procedures and ensure proper calibration before measurements."
            type="warning"
            showIcon
            className="mb-4"
          />
          
          {/* Add instruction steps */}
        </div>
      </Modal>

      {/* Loading Modal */}
      <Modal
        title="QMS Loading"
        open={isLoading}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
      >
        <div className="text-center p-6">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <Text className="block mt-4">Loading QMS, please wait...</Text>
        </div>
      </Modal>
    </div>
  );
};

export default IPID;
