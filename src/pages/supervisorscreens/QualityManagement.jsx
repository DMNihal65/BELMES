import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Button,
  Form,
  Input,
  Select,
  Upload,
  Space,
  Typography,
  Table,
  Steps,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  EditOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FileProtectOutlined,
  ToolOutlined,
  AimOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { Dragger } = Upload;
const { Step } = Steps;

// Define the tab components first
const IPIDGenerationTab = ({ onUpload, onGenerate }) => (
  <Card className="shadow-sm">
    <Row gutter={[24, 24]}>
      <Col span={12}>
        <Title level={5}>Upload Engineering Drawing</Title>
        <Dragger
          accept=".pdf"
          onChange={info => {
            if (info.file.status === 'done') {
              message.success(`${info.file.name} file uploaded successfully`);
              onUpload?.(info);
            }
          }}
          className="mb-4"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag PDF file to upload</p>
        </Dragger>
      </Col>
      <Col span={12}>
        <Title level={5}>IPID Details</Title>
        <Form layout="vertical">
          <Form.Item label="Part Number" required>
            <Input />
          </Form.Item>
          <Form.Item label="Revision" required>
            <Input />
          </Form.Item>
          <Button type="primary" onClick={onGenerate}>
            Generate IPID
          </Button>
        </Form>
      </Col>
    </Row>
  </Card>
);

const BallooningTab = ({ bocData, onBOCCreate, onStageAssign }) => (
  <Card className="shadow-sm">
    <Row gutter={[24, 24]}>
      <Col span={16}>
        <div className="bg-gray-100 p-4 rounded-lg h-[400px] relative">
          {/* Drawing preview with ballooning interface */}
          <div className="text-center pt-8">
            <p>Drawing Preview Area</p>
            <p>Click to add balloons</p>
          </div>
        </div>
      </Col>
      <Col span={8}>
        <Title level={5}>Bill of Characteristics</Title>
        <Table
          dataSource={bocData}
          columns={[
            { title: 'Balloon ID', dataIndex: 'balloonId' },
            { title: 'Zone', dataIndex: 'zone' },
            { title: 'Nominal', dataIndex: 'nominalValue' },
            { title: 'Stage', dataIndex: 'stage' },
          ]}
          size="small"
        />
        <Button type="primary" onClick={onStageAssign} className="mt-4">
          Assign Stages
        </Button>
      </Col>
    </Row>
  </Card>
);

const StageInspectionTab = ({ stages }) => (
  <Card className="shadow-sm">
    <Steps current={1} className="mb-8">
      <Step title="OP10" description="Complete" />
      <Step title="OP20" description="In Progress" />
      <Step title="OP30" description="Pending" />
    </Steps>
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Form layout="vertical">
          <Card title="Current Stage: OP20">
            <Row gutter={[16, 16]}>
              {[1, 2, 3].map(point => (
                <Col span={8} key={point}>
                  <Form.Item label={`Measurement Point ${point}`}>
                    <Input />
                  </Form.Item>
                </Col>
              ))}
            </Row>
            <Button type="primary">Submit Measurements</Button>
          </Card>
        </Form>
      </Col>
    </Row>
  </Card>
);

const FinalInspectionTab = ({ onReportGenerate }) => (
  <Card className="shadow-sm">
    <Space direction="vertical" className="w-full">
      <Card title="Import External Data" size="small">
        <Upload accept=".csv">
          <Button icon={<UploadOutlined />}>Import CMM/VMS Data</Button>
        </Upload>
      </Card>
      <Card title="Report Generation" size="small">
        <Form layout="vertical">
          <Form.Item label="Report Template">
            <Select defaultValue="standard">
              <Option value="standard">Standard Report</Option>
              <Option value="detailed">Detailed Report</Option>
              <Option value="custom">Custom Template</Option>
            </Select>
          </Form.Item>
          <Button type="primary" onClick={onReportGenerate}>
            Generate Final Report
          </Button>
        </Form>
      </Card>
    </Space>
  </Card>
);

const AnalyticsTab = ({ data }) => (
  <Card className="shadow-sm">
    <Row gutter={[24, 24]}>
      <Col span={8}>
        <Card>
          <Statistic
            title="First Time Pass Rate"
            value={95.2}
            suffix="%"
            precision={1}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Yield Rate"
            value={98.5}
            suffix="%"
            precision={1}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Process Deviations"
            value={3}
            suffix="stages"
          />
        </Card>
      </Col>
    </Row>
  </Card>
);

// Main component
const QualityManagement = () => {
  const [activeTab, setActiveTab] = useState('1');

  // Mock data for BOC
  const bocData = [
    {
      id: '1',
      balloonId: 'B1',
      zone: 'A1',
      nominalValue: '10.00',
      stage: 'OP10',
    },
    {
      id: '2',
      balloonId: 'B2',
      zone: 'A2',
      nominalValue: '15.00',
      stage: 'OP20',
    },
  ];

  const handleDrawingUpload = (info) => {
    console.log('Drawing uploaded:', info);
  };

  const handleIPIDGeneration = () => {
    console.log('Generating IPID');
  };

  const handleBOCCreate = () => {
    console.log('Creating BOC');
  };

  const handleStageAssign = () => {
    console.log('Assigning stages');
  };

  const handleReportGeneration = () => {
    console.log('Generating report');
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <FileProtectOutlined /> IPID Generation
        </span>
      ),
      children: <IPIDGenerationTab onUpload={handleDrawingUpload} onGenerate={handleIPIDGeneration} />
    },
    {
      key: '2',
      label: (
        <span>
          <AimOutlined /> Ballooning & BOC
        </span>
      ),
      children: <BallooningTab bocData={bocData} onBOCCreate={handleBOCCreate} onStageAssign={handleStageAssign} />
    },
    {
      key: '3',
      label: (
        <span>
          <ToolOutlined /> Stage Inspection
        </span>
      ),
      children: <StageInspectionTab stages={[]} />
    },
    {
      key: '4',
      label: (
        <span>
          <CheckCircleOutlined /> Final Inspection
        </span>
      ),
      children: <FinalInspectionTab onReportGenerate={handleReportGeneration} />
    },
    {
      key: '5',
      label: (
        <span>
          <BarChartOutlined /> Analytics
        </span>
      ),
      children: <AnalyticsTab />
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card
        bordered={false}
        className="mb-6 shadow-sm"
        title={
          <Space>
            <FileTextOutlined />
            <span>Quality Management System</span>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="1"
          items={tabItems}
          onChange={setActiveTab}
          type="card"
        />
      </Card>
    </div>
  );
};

export default QualityManagement;