import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, Form, Statistic,
  Typography, Tag, Badge, Alert, DatePicker, TimePicker, message,
  Tree, Radio, Upload, Spin
} from 'antd';
import Lottie from 'lottie-react';
import qualityAnimation from '../../assets/quality.json';
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
  SearchOutlined,
  ReloadOutlined, 
  LinkOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { qualityStore } from '../../store/quality-store';
import QualityInspectionDetails from '../supervisorscreens/QualityManagement/QualityInspectionDetails';

const { Option } = Select;
const { TabPane } = Tabs;
const { Step } = Steps;
const { RangePicker } = DatePicker;

const QualityManagementDashboard = () => {
  const [isQmsModalVisible, setIsQmsModalVisible] = useState(false);

  const handleLaunchQMS = async () => {
    try {
      // Use the custom protocol handler to launch QMS
      window.location.href = "belmes://launch-qms";
      
      // Close the QMS modal
      setIsQmsModalVisible(false);
    } catch (error) {
      console.error('Failed to launch QMS:', error);
      message.error('Failed to launch QMS software');
    }
  };
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
  const [orderOptions, setOrderOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inspectionDetails, setInspectionDetails] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Memoized fetch function with retry logic
  const fetchOrdersWithRetry = useCallback(async (retryAttempt = 0) => {
    const maxRetries = 3;
    
    try {
      setLoading(true);
      setError(null);
      setIsRetrying(retryAttempt > 0);
      
      const data = await qualityStore.fetchAllOrders();
      setOrderOptions(data);
      setRetryCount(0);
      setIsRetrying(false);
    } catch (err) {
      console.error(`Fetch attempt ${retryAttempt + 1} failed:`, err);
      
      if (retryAttempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1)));
        return fetchOrdersWithRetry(retryAttempt + 1);
      } else {
        setError(err.message);
        message.error('Failed to load orders after multiple attempts. Please refresh the page.');
        setRetryCount(retryAttempt + 1);
        setIsRetrying(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchOrdersWithRetry();
  }, [fetchOrdersWithRetry]);

  // Memoized part selection with retry logic
  const handlePartSelect = useCallback(async (value) => {
    if (!value) {
      setSelectedPart(null);
      setInspectionDetails(null);
      return;
    }

    setSelectedPart(value);
    setLoading(true);
    setError(null);
    
    try {
      const details = await qualityStore.fetchInspectionDetails(value);
      setInspectionDetails(details);
      setError(null);
    } catch (err) {
      console.error('Error fetching inspection details:', err);
      setError(err.message);
      message.error('Failed to load inspection details. Please try again.');
      
      // Clear the selection on error
      setSelectedPart(null);
      setInspectionDetails(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry function for failed requests
  const handleRetry = useCallback(() => {
    if (selectedPart) {
      handlePartSelect(selectedPart);
    } else {
      fetchOrdersWithRetry();
    }
  }, [selectedPart, handlePartSelect, fetchOrdersWithRetry]);

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
              <div>{ipid.partNo}</div>
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

  // Function to open QMS software
  const openQMSSoftware = () => {
    try {
      window.open('file:///D:/HAJU/BEL/QMS', '_blank');
      message.success('Opening QMS Software');
    } catch (error) {
      message.error('Failed to open QMS Software');
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
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 mr-3">
            <Lottie
              animationData={qualityAnimation}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <Typography.Title level={3} className="mb-0">
            Quality Management Dashboard
          </Typography.Title>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Error Loading Data"
          description={
            <div>
              <p>{error}</p>
              <p className="mt-2">
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<ReloadOutlined />}
                  onClick={handleRetry}
                  loading={isRetrying}
                >
                  {isRetrying ? `Retrying (${retryCount})` : 'Retry'}
                </Button>
              </p>
            </div>
          }
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Part Selection with improved UI */}
      <Card className="shadow-sm hover:shadow-md transition-all duration-300">
        <Row gutter={24} align="middle">
          <Col span={16}>
            <Form.Item 
              label={<span className="font-medium">Select Part Number/Production Order</span>} 
              className="mb-0 flex-1"
            >
              <Select
                showSearch
                size="large"
                placeholder="Search by Production Order or Part Number"
                onChange={handlePartSelect}
                optionFilterProp="children"
                className="w-full"
                loading={loading}
                options={orderOptions}
                filterOption={(input, option) =>
                  option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                notFoundContent={
                  loading ? (
                    <div className="text-center py-2">
                      <Spin size="small" /> Loading...
                    </div>
                  ) : error ? (
                    <div className="text-center py-2">
                      <Alert type="error" message="Error loading data" showIcon />
                    </div>
                  ) : (
                    'No data found'
                  )
                }
                allowClear
                showArrow
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRetry}
                loading={isRetrying}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={handleLaunchQMS}
          >
            Open QMS Software
          </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Display Operations and Inspections */}
      {selectedPart && inspectionDetails && (
        <QualityInspectionDetails
          selectedPart={selectedPart}
          inspectionDetails={inspectionDetails}
          loading={loading}
          selectedOperation={selectedOperation}
          setSelectedOperation={setSelectedOperation}
          orderId={selectedPart.value} // Pass the orderId from selectedPart
        />
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

export default QualityManagementDashboard;













