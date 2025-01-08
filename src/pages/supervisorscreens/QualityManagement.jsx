import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Tabs, Form, Statistic,
  Typography, Tag, Badge, message
} from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, WarningOutlined,
  PieChartOutlined, FileOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { TabPane } = Tabs;

const QualityManagementDashboard = () => {
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTab, setActiveTab] = useState('qualityOverview');
  const [isIPIDModalVisible, setIsIPIDModalVisible] = useState(false);
  const [selectedIPID, setSelectedIPID] = useState(null);

  // Stats data
  const qualityStats = {
    totalParts: 100,
    goodParts: 85,
    badParts: 10,
    nonConformance: 5,
    yield: 85,
    deviations: 8
  };

  // Sample part options
  const partOptions = [
    { value: 'PART-001', label: 'PART-001 Aluminium Housing' },
    { value: 'PART-002', label: 'PART-002 Steel Bracket' },
    { value: 'PART-003', label: 'PART-003 Copper Fitting' }
  ];

  // IPID Table columns
  const ipidColumns = [
    { title: 'Sl. No.', dataIndex: 'slNo', key: 'slNo' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Nominal', dataIndex: 'nominal', key: 'nominal' },
    { title: 'Upper Tol', dataIndex: 'upperTol', key: 'upperTol' },
    { title: 'Lower Tol', dataIndex: 'lowerTol', key: 'lowerTol' },
    { title: 'Max Value', dataIndex: 'maxValue', key: 'maxValue' },
    { title: 'Min Value', dataIndex: 'minValue', key: 'minValue' },
    { title: 'UOM', dataIndex: 'uom', key: 'uom' },
    { title: 'Drg. Zone', dataIndex: 'drgZone', key: 'drgZone' },
    { 
      title: 'Instrument/Template/Gauge to be used', 
      dataIndex: 'instrument', 
      key: 'instrument' 
    },
    { 
      title: 'Instrument Least Count/Template No./Gauge No.', 
      dataIndex: 'instrumentDetails', 
      key: 'instrumentDetails' 
    },
    { title: 'Measurement', dataIndex: 'measurement', key: 'measurement' },
    { 
      title: 'Instrument No. used', 
      dataIndex: 'instrumentNo', 
      key: 'instrumentNo' 
    },
    { 
      title: 'Calibration Due Date', 
      dataIndex: 'calibrationDue', 
      key: 'calibrationDue' 
    }
  ];

  // Quality Overview table columns
  const qualityOverviewColumns = [
    { title: 'IPID No.', dataIndex: 'ipidNo', key: 'ipidNo' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Job No.', dataIndex: 'jobNo', key: 'jobNo' },
    { title: 'Order No. - Batch No.', dataIndex: 'orderNo', key: 'orderNo' },
    { title: 'Part Number', dataIndex: 'partNumber', key: 'partNumber' },
    { title: 'Operation Number', dataIndex: 'operationNumber', key: 'operationNumber' },
    { title: 'Inspected By', dataIndex: 'inspectedBy', key: 'inspectedBy' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => {
              setSelectedIPID(record);
              setIsIPIDModalVisible(true);
            }}
          >
            View
          </Button>
          {/* <Button 
            type="link" 
            onClick={() => handleDownload(record)}
          >
            Download
          </Button> */}
        </Space>
      ),
    }
  ];

  // Mock data for Quality Overview table
  const qualityOverviewData = [
    {
      key: '1',
      ipidNo: 'IPID-21340184011',
      date: '20-02-2023',
      time: '09:30 AM',
      jobNo: '1',
      orderNo: '10548862',
      partNumber: 'PART-001',
      operationNumber: '10',
      inspectedBy: 'Manjunath'
    },
    {
      key: '2',
      ipidNo: 'IPID-21340184012',
      date: '21-02-2023',
      time: '10:15 AM',
      jobNo: '2',
      orderNo: '10548863',
      partNumber: 'PART-002',
      operationNumber: '20',
      inspectedBy: 'Ramesh'
    },
    {
      key: '3',
      ipidNo: 'IPID-21340184013',
      date: '22-02-2023',
      time: '02:45 PM',
      jobNo: '3',
      orderNo: '10548864',
      partNumber: 'PART-003',
      operationNumber: '30',
      inspectedBy: 'Suresh'
    },
    {
      key: '4',
      ipidNo: 'IPID-21340184014',
      date: '23-02-2023',
      time: '11:20 AM',
      jobNo: '4',
      orderNo: '10548865',
      partNumber: 'PART-001',
      operationNumber: '40',
      inspectedBy: 'Manjunath'
    },
    {
      key: '5',
      ipidNo: 'IPID-21340184015',
      date: '24-02-2023',
      time: '03:15 PM',
      jobNo: '5',
      orderNo: '10548866',
      partNumber: 'PART-002',
      operationNumber: '50',
      inspectedBy: 'Kumar'
    }
  ];

  // Mock data for IPID measurements
  const mockMeasurements = [
    {
      key: '1',
      slNo: '1',
      description: 'Diameter',
      nominal: '2.50',
      upperTol: '0.10',
      lowerTol: '-0.10',
      maxValue: '2.60',
      minValue: '2.40',
      uom: 'mm',
      drgZone: '-',
      instrument: 'Digital Vernier',
      instrumentDetails: '0.01',
      measurement: '2.5005',
      instrumentNo: 'L4-1367',
      calibrationDue: '27-05-2023'
    },
    {
      key: '2',
      slNo: '2',
      description: 'Depth',
      nominal: '6.00',
      upperTol: '0.10',
      lowerTol: '-0.10',
      maxValue: '6.10',
      minValue: '5.90',
      uom: 'mm',
      drgZone: '-',
      instrument: 'Digital Vernier',
      instrumentDetails: '0.01',
      measurement: '6.020',
      instrumentNo: 'L4-1367',
      calibrationDue: '27-05-2023'
    },
    {
      key: '3',
      slNo: '3',
      description: 'Thread',
      nominal: '4.00',
      upperTol: '-',
      lowerTol: '-',
      maxValue: '-',
      minValue: '-',
      uom: 'mm',
      drgZone: '-',
      instrument: 'Thread Plug Gauge',
      instrumentDetails: 'M4',
      measurement: 'OK',
      instrumentNo: 'L5-17255',
      calibrationDue: '12.03.2023'
    },
    // ... add more measurement rows as needed
  ];

  // Updated IPID Modal content
  const IPIDModalContent = ({ ipid }) => (
    <div className="ipid-container">
      {/* Header Section */}
      <div className="bg-[#f5f5f5] border border-gray-200 mb-6">
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">IPID No.:</div>
              <div>{ipid.ipidNo}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Date:</div>
              <div>{ipid.date}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Time:</div>
              <div>{ipid.time}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Order No. - Batch No.:</div>
              <div>{ipid.orderNo}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Job No.:</div>
              <div>{ipid.jobNo}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Sheet No.:</div>
              <div>{ipid.sheetNo}</div>
            </div>
          </div>
        </div>
        
        {/* Info Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="font-semibold mb-2">Info:</div>
          <ul className="list-disc pl-5 text-sm">
            <li>Entry to be made in all the fields highlighted in yellow</li>
            <li>In Case of 3D PDF drawing or Drawing with '10 of' less dimensions, Drg. Zone is not Mandatory</li>
            <li>Additional observations can be noted in the designated area at the bottom of the page</li>
            <li>Text of OK measurement values turn to green colour & Not OK values turn to Red colour</li>
          </ul>
        </div>
      </div>

      {/* IPID Table with improved styling */}
      <Table 
        columns={ipidColumns.map(col => ({
          ...col,
          className: 'whitespace-nowrap',
          width: col.width || 'auto',
          align: col.align || 'center'
        }))}
        dataSource={mockMeasurements}
        bordered
        size="middle"
        pagination={false}
        scroll={{ x: 'max-content' }}
        className="ipid-table"
      />

      {/* Additional Observations */}
      <div className="mt-6">
        <div className="font-semibold mb-2">Additional Observations:</div>
        <Input.TextArea 
          rows={4}
          placeholder="Enter any additional observations here..."
          className="w-full"
        />
      </div>

      {/* Report Review */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <div className="font-semibold">Review Date:</div>
          <div>{ipid.date}</div>
        </div>
        <div>
          <div className="font-semibold">Review By:</div>
          <div>{ipid.inspectedBy}</div>
        </div>
      </div>
    </div>
  );

  // Handle download function
  const handleDownload = (record) => {
    // Create data for export
    const exportData = mockMeasurements.map(item => ({
      'Sl. No.': item.slNo,
      'Description': item.description,
      'Nominal': item.nominal,
      'Upper Tolerance': item.upperTol,
      'Lower Tolerance': item.lowerTol,
      'Max Value': item.maxValue,
      'Min Value': item.minValue,
      'UOM': item.uom,
      'Drawing Zone': item.drgZone,
      'Instrument/Template/Gauge': item.instrument,
      'Instrument Details': item.instrumentDetails,
      'Measurement': item.measurement,
      'Instrument No.': item.instrumentNo,
      'Calibration Due Date': item.calibrationDue
    }));

    // Add header information
    const headerData = [
      ['FABRICATION COMPONENTS'],
      ['IN PROCESS INSPECTION DOCUMENT (IPID)'],
      [''],
      [`IPID No.: ${record.ipidNo}`, `Date: ${record.date}`, `Time: ${record.time}`],
      [`Order No. - Batch No.: ${record.orderNo}`, `Job No.: ${record.jobNo}`],
      [`Part Number: ${record.partNumber}`, `Operation Number: ${record.operationNumber}`],
      [`Inspected By: ${record.inspectedBy}`],
      ['']
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData, { origin: 'A10' });
    XLSX.utils.sheet_add_aoa(ws, headerData, { origin: 'A1' });

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IPID Report');

    // Generate Excel file
    XLSX.writeFile(wb, `IPID_${record.ipidNo}.xlsx`);
    
    message.success(`IPID ${record.ipidNo} downloaded successfully`);
  };

  // Replace handleOpenQMSFile function with this
  const handleOpenQMSFile = async () => {
    try {
      // Call your backend API endpoint
      const response = await fetch('/api/open-gdnt-file', {
        method: 'POST',
      });
      
      if (response.ok) {
        message.success('Opening GDNT Updates application');
      } else {
        throw new Error('Failed to open application');
      }
    } catch (error) {
      message.error('Failed to open GDNT Updates application');
      console.error('Error opening file:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Overview */}
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Total Parts"
              value={qualityStats.totalParts}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Good Parts"
              value={qualityStats.goodParts}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Bad Parts"
              value={qualityStats.badParts}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Non Conformance"
              value={qualityStats.nonConformance}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Yield"
              value={qualityStats.yield}
              suffix="%"
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic 
              title="Deviations"
              value={qualityStats.deviations}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Part Selection Section */}
      <Card className="shadow-sm">
        <Row gutter={24} align="middle">
          <Col span={16}>
            <Form.Item label="Select Job/Part Number" className="mb-0 flex-1">
              <Select
                showSearch
                placeholder="Search by Job ID or Part Number"
                onChange={(value) => setSelectedPart(value)}
                optionFilterProp="children"
                className="w-full"
                options={partOptions}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {selectedPart && (
        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Quality Overview" key="qualityOverview">
              <Table 
                columns={qualityOverviewColumns}
                dataSource={qualityOverviewData}
                bordered
                size="small"
              />
            </TabPane>

            <TabPane tab="Create New IPID" key="ipidManagement">
              <Card title="IPID Management" className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="Create New IPID" className="h-full">
                      <Form layout="vertical">
                        <Form.Item label="Part Number">
                          <Select
                            showSearch
                            placeholder="Select Part Number"
                            options={partOptions}
                          />
                        </Form.Item>
                        <Form.Item label="Operation Number">
                          <Input placeholder="Enter Operation Number" />
                        </Form.Item>
                        <Button type="primary" block>
                          Create IPID
                        </Button>
                      </Form>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Software" className="h-full">
                      <div className="flex justify-center items-center h-full">
                        <Button 
                          type="primary" 
                          icon={<FileOutlined />}
                          onClick={handleOpenQMSFile}
                          className="bg-blue-600"
                          size="large"
                        >
                          Open GDNT Updates
                        </Button>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane tab="Quality Reports" key="qualityReports">
              {/* Quality Reports content */}
            </TabPane>
          </Tabs>
        </Card>
      )}

      {/* IPID Detail Modal */}
      <Modal
        title={
          <div className="text-lg font-semibold">
            FABRICATION COMPONENTS
            <div className="text-sm font-normal">IN PROCESS INSPECTION DOCUMENT (IPID)</div>
          </div>
        }
        visible={isIPIDModalVisible}
        onCancel={() => setIsIPIDModalVisible(false)}
        width={1200}
        footer={[
          <Button key="download" type="primary" onClick={() => handleDownload(selectedIPID)}>
            Download
          </Button>,
          <Button key="close" onClick={() => setIsIPIDModalVisible(false)}>
            Close
          </Button>
        ]}
        className="ipid-modal"
      >
        {selectedIPID && <IPIDModalContent ipid={selectedIPID} />}
      </Modal>
    </div>
  );
};

// Add this CSS to your styles file
const styles = `
  .ipid-modal .ant-modal-body {
    padding: 24px;
  }

  .ipid-table .ant-table-thead > tr > th {
    background-color: #f0f2f5;
    text-align: center;
    padding: 12px 8px;
  }

  .ipid-table .ant-table-tbody > tr > td {
    padding: 8px;
  }

  .ipid-container {
    max-width: 100%;
    margin: 0 auto;
  }
`;

export default QualityManagementDashboard;