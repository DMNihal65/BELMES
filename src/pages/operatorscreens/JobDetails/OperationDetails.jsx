import React, { useState } from 'react';
import { 
  Table, Card, Button, Space, Modal, Upload, 
  Tabs, Typography, Tag, Image, Tooltip 
} from 'antd';
import { 
  FileTextOutlined, EyeOutlined, UploadOutlined,
  InfoCircleOutlined, ToolOutlined, 
  ClockCircleOutlined
} from '@ant-design/icons';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const OperationDetails = () => {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  const operations = [
    {
      id: 1,
      opNo: 'OP10',
      description: 'Face Milling',
      machine: 'VMC-001',
      cycleTime: '5:30',
      tools: ['T101', 'T102'],
      fixtures: 'F-123',
      parameters: {
        speed: '1200 RPM',
        feed: '300 mm/min',
        doc: '0.5 mm'
      },
      images: ['/images/op10-setup.jpg'],
      notes: 'Ensure perpendicularity within 0.01mm'
    },
    // Add more operations...
  ];

  const columns = [
    {
      title: 'Op. No',
      dataIndex: 'opNo',
      key: 'opNo',
      width: 100,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Cycle Time',
      dataIndex: 'cycleTime',
      key: 'cycleTime',
      render: (text) => <Tag icon={<ClockCircleOutlined />}>{text}</Tag>
    },
    {
      title: 'Tools',
      dataIndex: 'tools',
      key: 'tools',
      render: (tools) => (
        <Space>
          {tools.map(tool => (
            <Tag key={tool} icon={<ToolOutlined />}>{tool}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              onClick={() => setSelectedOperation(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handlePdfUpload = (file) => {
    setPdfFile(file);
    return false;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Operation Sequence</Title>
          <Space>
            <Upload 
              beforeUpload={handlePdfUpload}
              accept=".pdf"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                Upload MPP PDF
              </Button>
            </Upload>
            {pdfFile && (
              <Button 
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => setShowPdfModal(true)}
              >
                View MPP PDF
              </Button>
            )}
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={operations}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Operation Detail Modal */}
      <Modal
        title={`Operation Details - ${selectedOperation?.opNo}`}
        open={!!selectedOperation}
        onCancel={() => setSelectedOperation(null)}
        width={800}
        footer={null}
      >
        {selectedOperation && (
          <Tabs defaultActiveKey="details">
            <TabPane tab="Details" key="details">
              {/* Operation details content */}
            </TabPane>
            <TabPane tab="Parameters" key="parameters">
              {/* Parameters content */}
            </TabPane>
            <TabPane tab="Images" key="images">
              {/* Images content */}
            </TabPane>
            <TabPane tab="Notes" key="notes">
              {/* Notes content */}
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal
        title="Manufacturing Process Plan (MPP)"
        open={showPdfModal}
        onCancel={() => setShowPdfModal(false)}
        width={1200}
        footer={null}
      >
        {pdfFile && (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div style={{ height: '800px' }}>
              <Viewer fileUrl={URL.createObjectURL(pdfFile)} />
            </div>
          </Worker>
        )}
      </Modal>
    </div>
  );
};

export default OperationDetails; 