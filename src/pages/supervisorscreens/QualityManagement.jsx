import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, Form, Statistic,
  Typography, Tag, Badge, Alert, DatePicker, TimePicker, message,
  Tree, Radio, Upload
} from 'antd';
import {
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined,
  PieChartOutlined, 
  FolderOpenOutlined, 
  FileSearchOutlined, 
  FormOutlined,
  FolderOutlined, 
  DownloadOutlined,
  FilterOutlined,
  FileExcelOutlined, 
  FilePdfOutlined,
  InfoCircleOutlined,
  DeleteOutlined, 
  StarOutlined, 
  StarFilled,
  UploadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { TabPane } = Tabs;
const { Step } = Steps;
const { RangePicker } = DatePicker;

const QualityManagementDashboard = () => {
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTab, setActiveTab] = useState('qualityOverview');
  const [isIPIDModalVisible, setIsIPIDModalVisible] = useState(false);
  const [selectedIPID, setSelectedIPID] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [reportsData, setReportsData] = useState([
    {
      key: '1',
      name: 'Quality Metrics Report Q1',
      type: 'metrics',
      date: '2024-01-15',
      status: 'Completed',
      size: '2.3 MB',
      folder: 'ipid-jan',
      favorite: false
    },
    // ... more mock data
  ]);

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
    { title: 'Part No.', dataIndex: 'partNo', key: 'partNo' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Opeartion No.', dataIndex: 'jobNo', key: 'jobNo' },
    { title: 'Order No. - Batch No.', dataIndex: 'orderNo', key: 'orderNo' },
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
          <Button 
            type="link" 
            onClick={() => handleDownload(record)}
          >
            Download Excel
          </Button>
        </Space>
      ),
    }
  ];

  // Mock data for Quality Overview table
  const qualityOverviewData = [
    {
      key: '1',
      ipidNo: 'IPID-21340184011',
      partNo: 'PART-001',
      date: '20-02-2023',
      time: '09:30 AM',
      jobNo: '1',
      orderNo: '10548862',
      inspectedBy: 'Manjunath'
    },
    {
      key: '2',
      ipidNo: 'IPID-21340184012',
      partNo: 'PART-002',
      date: '21-02-2023',
      time: '10:15 AM',
      jobNo: '2',
      orderNo: '10548863',
      inspectedBy: 'Ramesh'
    },
    {
      key: '3',
      ipidNo: 'IPID-21340184013',
      partNo: 'PART-003',
      date: '22-02-2023',
      time: '02:45 PM',
      jobNo: '3',
      orderNo: '10548864',
      inspectedBy: 'Suresh'
    },
    {
      key: '4',
      ipidNo: 'IPID-21340184014',
      partNo: 'PART-001',
      date: '23-02-2023',
      time: '11:20 AM',
      jobNo: '4',
      orderNo: '10548865',
      inspectedBy: 'Manjunath'
    },
    {
      key: '5',
      ipidNo: 'IPID-21340184015',
      partNo: 'PART-002',
      date: '24-02-2023',
      time: '03:15 PM',
      jobNo: '5',
      orderNo: '10548866',
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
              <div className="font-semibold">Part No.:</div>
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
              <div className="font-semibold">Operation No.:</div>
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

  // Handle download function for Excel export
  const handleDownload = (record) => {
    // Create header information for the IPID document
    const headerData = [{
      'IPID No.': record.ipidNo,
      'Part No.': record.partNo,
      'Date': record.date,
      'Time': record.time,
      'Operation No.': record.jobNo,
      'Order No. - Batch No.': record.orderNo,
      'Sheet No.': '1',
      'Inspected By': record.inspectedBy
    }];

    // Add the measurements data with formatting
    const measurementsData = mockMeasurements.map(item => ({
      'Sl. No.': item.slNo,
      'Description': item.description,
      'Nominal': item.nominal,
      'Upper Tol': item.upperTol,
      'Lower Tol': item.lowerTol,
      'Max Value': item.maxValue,
      'Min Value': item.minValue,
      'UOM': item.uom,
      'Drg. Zone': item.drgZone,
      'Instrument/Template/Gauge': item.instrument,
      'Instrument Details': item.instrumentDetails,
      'Measurement': item.measurement,
      'Instrument No.': item.instrumentNo,
      'Calibration Due Date': item.calibrationDue
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet for the IPID document
    const ws = XLSX.utils.json_to_sheet([
      { 'FABRICATION COMPONENTS': '' },
      { 'IN PROCESS INSPECTION DOCUMENT (IPID)': '' },
      {},  // Empty row for spacing
      ...headerData,
      {},  // Empty row for spacing
      { 'MEASUREMENTS': '' },
      ...measurementsData,
      {},  // Empty row for spacing
      { 'Additional Observations': '' },
      { 'Review Date': record.date },
      { 'Review By': record.inspectedBy }
    ], { skipHeader: true });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "IPID Report");

    // Save file
    XLSX.writeFile(wb, `IPID_${record.ipidNo}.xlsx`);
    message.success(`Downloaded IPID ${record.ipidNo} as Excel`);
  };

  // Function to check if GDNT file exists
  const checkGDNTFile = () => {
    return true; // Mock implementation
  };

  // Function to open GDNT file
  const openGDNTFile = () => {
    try {
      window.open('file:///D:/HAJU/BEL/GDNT_updates2[1]', '_blank');
      message.success('Opening GDNT file');
    } catch (error) {
      message.error('Failed to open GDNT file');
    }
  };

  // Update the openQMSSoftware function
  const openQMSSoftware = () => {
    try {
      // Using registered myapp protocol to launch QMS
      window.location.href = "myapp://launch-qms";
      message.success('Launching QMS Software');
    } catch (error) {
      console.error('Failed to launch QMS application:', error);
      message.error('Failed to launch QMS. Please ensure the application is properly installed.');
    }
  };

  // Mock folder structure
  const treeData = [
    {
      title: 'Quality Reports',
      key: 'quality',
      icon: <FolderOutlined />,
      children: [
        {
          title: 'IPID Reports',
          key: 'ipid',
          icon: <FolderOutlined />,
          children: [
            { title: 'January 2024', key: 'ipid-jan', icon: <FileTextOutlined /> },
            { title: 'February 2024', key: 'ipid-feb', icon: <FileTextOutlined /> },
          ],
        },
        {
          title: 'VMS Reports',
          key: 'vms',
          icon: <FolderOutlined />,
          children: [
            { title: 'Machine Performance', key: 'vms-perf', icon: <FileTextOutlined /> },
            { title: 'Calibration Reports', key: 'vms-cal', icon: <FileTextOutlined /> },
          ],
        },
        {
          title: 'CMM Reports',
          key: 'cmm',
          icon: <FolderOutlined />,
          children: [
            { title: 'Measurement Reports', key: 'cmm-meas', icon: <FileTextOutlined /> },
            { title: 'Analysis Reports', key: 'cmm-analysis', icon: <FileTextOutlined /> },
          ],
        },
      ],
    },
  ];

  // Report columns
  const reportColumns = [
    {
      title: 'Report Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'metrics' ? 'blue' : type === 'nonconformance' ? 'red' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={record.favorite ? <StarFilled /> : <StarOutlined />}
            onClick={() => handleFavoriteToggle(record)}
            type={record.favorite ? 'primary' : 'default'}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record)}
          />
          <Button 
            icon={<FilePdfOutlined />} 
            size="small"
            onClick={() => handleDownload(record, 'pdf')}
          >
            PDF
          </Button>
          <Button 
            icon={<FileExcelOutlined />} 
            size="small"
            onClick={() => handleDownload(record, 'excel')}
          >
            Excel
          </Button>
        </Space>
      ),
    },
  ];

  // Handle folder selection
  const handleFolderSelect = (selectedKeys) => {
    setSelectedFolder(selectedKeys[0]);
  };

  // Handle file deletion
  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this file?',
      content: `This will permanently delete "${record.name}"`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        setReportsData(prev => prev.filter(item => item.key !== record.key));
        message.success('File deleted successfully');
      }
    });
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (record) => {
    setReportsData(prev => prev.map(item => {
      if (item.key === record.key) {
        return { ...item, favorite: !item.favorite };
      }
      return item;
    }));
  };

  // Handle file upload
  const handleUpload = (files) => {
    if (!selectedFolder) {
      message.error('Please select a folder first');
      return;
    }

    const newFiles = Array.from(files).map((file, index) => ({
      key: `new-${Date.now()}-${index}`,
      name: file.name,
      type: file.name.split('.').pop(),
      date: new Date().toISOString().split('T')[0],
      status: 'Uploaded',
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      folder: selectedFolder,
      favorite: false
    }));

    setReportsData(prev => [...prev, ...newFiles]);
    message.success(`${files.length} file(s) uploaded successfully`);
    setUploadModalVisible(false);
  };

  // Filter reports based on selected folder and search text
  const filteredReports = reportsData.filter(report => {
    const matchesFolder = !selectedFolder || report.folder === selectedFolder;
    const matchesSearch = !searchText || 
      report.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesFolder && matchesSearch;
  });

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
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <Card className="shadow-sm">
                  <div className="mb-6">
                    <Alert
                      message="Important Pre-requisite"
                      description={
                        <div>
                          <p>Before creating a new IPID, please ensure:</p>
                          <ul className="list-disc pl-5 mt-2">
                            <li>You have the latest GDNT_updates2[1] file in your system</li>
                            <li>Location: D:\HAJU\BEL</li>
                            <li>File is accessible and up to date</li>
                            <li>You have knowledge of auto-ballooning process in QMS software</li>
                          </ul>
                        </div>
                      }
                      type="warning"
                      showIcon
                    />
                  </div>

                  <Card title="File Verification" className="bg-gray-50 mb-6">
                    <Space direction="vertical" size="middle" className="w-full">
                      <div className="flex items-center justify-between">
                        <span>Check GDNT File Availability:</span>
                        <Button
                          type="primary"
                          icon={<FileSearchOutlined />}
                          onClick={() => {
                            const exists = checkGDNTFile();
                            if (exists) {
                              message.success('GDNT file found at D:\\HAJU\\BEL\\GDNT_updates2[1]');
                            } else {
                              message.error('GDNT file not found. Please check the location.');
                            }
                          }}
                        >
                          Click to Check File
                        </Button>
                      </div>
                      {/* <div className="flex items-center justify-between">
                        <span>Open GDNT File:</span>
                        <Button
                          type="primary"
                          icon={<FolderOpenOutlined />}
                          onClick={openGDNTFile}
                        >
                          Open GDNT File
                        </Button>
                      </div> */}
                    </Space>
                  </Card>

                  <div className="flex justify-center">
                    <Button
                      type="primary"
                      size="large"
                      icon={<FileTextOutlined />}
                      onClick={openQMSSoftware}
                      className="px-8 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    >
                      Launch QMS Software
                    </Button>
                  </div>
                </Card>

                {/* Right Column */}
                <Card 
                  title="IPID Creation Guide" 
                  className="shadow-sm"
                  extra={
                    <Tag color="blue" icon={<InfoCircleOutlined />}>
                      Step by Step Guide
                    </Tag>
                  }
                >
                  <div className="space-y-6">
                    <Card className="bg-gray-50">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
                        Auto Ballooning
                      </h4>
                      <ul className="list-disc pl-5 ml-8">
                        <li>Open QMS software using the button on the left</li>
                        <li>Use auto ballooning feature to mark dimensions</li>
                        <li>Ensure all critical dimensions are properly marked</li>
                      </ul>
                    </Card>

                    <Card className="bg-gray-50">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">2</span>
                        Operation Setup
                      </h4>
                      <ul className="list-disc pl-5 ml-8">
                        <li>Drag the part for the first operation</li>
                        <li>Set up operation parameters as required</li>
                        <li>Define measurement points and tolerances</li>
                      </ul>
                    </Card>

                    <Card className="bg-gray-50">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">3</span>
                        IPID Creation
                      </h4>
                      <ul className="list-disc pl-5 ml-8">
                        <li>Create individual IPIDs for each operation</li>
                        <li>Verify all measurements and parameters</li>
                        <li>Use the Save/Create IPID button in QMS software</li>
                      </ul>
                    </Card>

                    <Alert
                      message="Note"
                      description="All IPID creation and editing operations must be performed within the QMS software. This guide is for reference only."
                      type="info"
                      showIcon
                    />
                  </div>
                </Card>
              </div>
            </TabPane>

            <TabPane tab="Quality Reports" key="qualityReports">
              <Card className="shadow-sm">
                {/* Filters Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <Row gutter={[16, 16]} align="middle">
                    <Col span={8}>
                      <div className="font-semibold mb-2">Date Range</div>
                      <RangePicker 
                        className="w-full" 
                        onChange={(dates) => setDateRange(dates)}
                      />
                    </Col>
                    <Col span={8}>
                      <div className="font-semibold mb-2">Report Type</div>
                      <Select
                        className="w-full"
                        defaultValue="all"
                        onChange={(value) => setSelectedReportType(value)}
                        options={[
                          { value: 'all', label: 'All Reports' },
                          { value: 'metrics', label: 'Quality Metrics' },
                          { value: 'nonconformance', label: 'Non-conformance' },
                          { value: 'yield', label: 'Yield Analysis' },
                        ]}
                      />
                    </Col>
                    <Col span={8}>
                      <div className="font-semibold mb-2">Export Options</div>
                      <Radio.Group defaultValue="pdf">
                        <Radio.Button value="pdf">PDF</Radio.Button>
                        <Radio.Button value="excel">Excel</Radio.Button>
                        <Radio.Button value="csv">CSV</Radio.Button>
                      </Radio.Group>
                    </Col>
                  </Row>
                </div>

                {/* Content Section */}
                <Row gutter={16}>
                  {/* Folder Tree */}
                  <Col span={6}>
                    <Card title="Report Categories" className="h-full">
                      <Tree
                        treeData={treeData}
                        showIcon
                        defaultExpandAll
                        onSelect={(selectedKeys) => setSelectedFolder(selectedKeys[0])}
                      />
                    </Card>
                  </Col>

                  {/* Reports Table */}
                  <Col span={18}>
                    <Card 
                      title="Reports List"
                      extra={
                        <Space>
                          <Input
                            placeholder="Search files..."
                            prefix={<SearchOutlined />}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                          />
                          <Button 
                            icon={<UploadOutlined />} 
                            type="primary"
                            onClick={() => setUploadModalVisible(true)}
                            disabled={!selectedFolder}
                          >
                            Upload
                          </Button>
                        </Space>
                      }
                    >
                      <Table
                        columns={reportColumns}
                        dataSource={filteredReports}
                        size="middle"
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
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

      {/* Add Upload Modal */}
      <Modal
        title="Upload Files"
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          multiple
          beforeUpload={(file) => {
            return false; // Prevent automatic upload
          }}
          onChange={(info) => {
            handleUpload(info.fileList.map(f => f.originFileObj));
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to upload</p>
          <p className="ant-upload-hint">
            Files will be uploaded to folder: {selectedFolder}
          </p>
        </Upload.Dragger>
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

  .ant-steps-item-description {
    padding-bottom: 16px;
  }

  .file-check-section {
    background-color: #f5f5f5;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 24px;
  }

  .ant-tree {
    background: transparent;
  }
  
  .report-filters {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
  }
`;

export default QualityManagementDashboard;