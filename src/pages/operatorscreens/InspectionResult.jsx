import React, { useState } from 'react';
import { Card, Table, Typography, Space, Button, Row, Col, Statistic, Progress, Select, DatePicker, Tooltip, Tag, Badge, Empty, Spin, Modal } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function InspectionResult() {
  const navigate = useNavigate();
  const [selectedPartNumber, setSelectedPartNumber] = useState('PA-0678');
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState([]);
  const [view, setView] = useState('table');
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const showInspectionDetails = (record) => {
    setSelectedRecord(record);
    setIsDetailModalVisible(true);
  };

  const measurementColumns = [
    { title: 'Sl. No.', dataIndex: 'slNo', key: 'slNo', width: 80 },
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
    },
    { 
      title: 'Status', 
      key: 'status', 
      render: (_, record) => {
        const measurement = parseFloat(record.measurement);
        const nominal = parseFloat(record.nominal);
        const upperTol = parseFloat(record.upperTol);
        const lowerTol = parseFloat(record.lowerTol);
        
        if (record.measurement === 'OK') return <Tag color="success">OK</Tag>;
        if (!measurement || !nominal) return <Tag>N/A</Tag>;
        
        const isWithinTolerance = measurement >= (nominal + lowerTol) && 
                                 measurement <= (nominal + upperTol);
        
        return isWithinTolerance ? 
          <Tag color="success">Within Tolerance</Tag> : 
          <Tag color="error">Out of Tolerance</Tag>;
      }
    }
  ];

  // Mock measurement data
  const mockMeasurementData = [
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
      measurement: '5.020',
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
      calibrationDue: '12-03-2023'
    }
  ];

  // Enhanced mock part numbers with "All Parts" option
  const partNumbers = [
    { value: 'all', label: 'All Parts', category: 'All Categories' },
    { value: 'PA-0678', label: 'PA-0678 - Brake Caliper Assembly', category: 'Braking' },
    { value: 'PA-0679', label: 'PA-0679 - Wheel Hub Bearing', category: 'Wheel' },
    { value: 'PA-0680', label: 'PA-0680 - Steering Knuckle', category: 'Steering' },
    // ... more parts
  ];

  // Enhanced analytics with trends
  const analytics = {
    totalInspections: 150,
    goodParts: 135,
    badParts: 15,
    deviations: 8,
    qualityScore: 90,
    trends: {
      weeklyTrend: [90, 92, 88, 95, 89, 91, 90],
      defectTypes: [
        { name: 'Dimensional', value: 5 },
        { name: 'Surface', value: 3 },
        { name: 'Material', value: 2 },
      ]
    }
  };

  // Enhanced mock data with part-specific analytics
  const partAnalytics = {
    'PA-0678': {
      totalInspections: 150,
      goodParts: 135,
      badParts: 15,
      deviations: 8,
      trends: { /* ... */ }
    },
    'PA-0679': {
      totalInspections: 98,
      goodParts: 90,
      badParts: 8,
      deviations: 5,
      trends: { /* ... */ }
    },
    'PA-0680': {
      totalInspections: 120,
      goodParts: 112,
      badParts: 8,
      deviations: 4,
      trends: { /* ... */ }
    }
  };

  // Modified getCurrentAnalytics to handle "all" parts selection
  const getCurrentAnalytics = () => {
    if (selectedPartNumber === 'all') {
      // Combine statistics from all parts
      return Object.values(partAnalytics).reduce((acc, curr) => ({
        totalInspections: acc.totalInspections + curr.totalInspections,
        goodParts: acc.goodParts + curr.goodParts,
        badParts: acc.badParts + curr.badParts,
        deviations: acc.deviations + curr.deviations
      }), {
        totalInspections: 0,
        goodParts: 0,
        badParts: 0,
        deviations: 0
      });
    }
    
    return partAnalytics[selectedPartNumber] || {
      totalInspections: 0,
      goodParts: 0,
      badParts: 0,
      deviations: 0
    };
  };

  // Mock data for inspection history
  const inspectionHistory = [
    {
      key: '1',
      date: '2024-12-19',
      partNumber: 'PA-0678',
      operator: 'John Doe',
      operationNumber: 'OP-101',
      result: 'Pass',
      deviations: 0,
      remarks: 'All parameters within specification',
    },
    {
      key: '2',
      date: '2024-12-19',
      partNumber: 'PA-0678',
      operator: 'John Doe',
      operationNumber: 'OP-102',
      result: 'Fail',
      deviations: 2,
      remarks: 'Dimension out of tolerance',
    },
    {
      key: '3',
      date: '2024-12-18',
      partNumber: 'PA-0678',
      operator: 'Jane Smith',
      operationNumber: 'OP-101',
      result: 'Pass',
      deviations: 1,
      remarks: 'Minor surface finish variation',
    },
  ];

  // Enhanced columns with more features
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
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
      title: 'Operation Number',
      dataIndex: 'operationNumber',
      key: 'operationNumber',
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result) => (
        <Badge
          status={result === 'Pass' ? 'success' : 'error'}
          text={
            <Tag color={result === 'Pass' ? 'success' : 'error'}>
              {result}
            </Tag>
          }
        />
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="link" onClick={() => showInspectionDetails(record)}>
              Details
            </Button>
          </Tooltip>
          {record.deviations > 0 && (
            <Tooltip title="View Deviations">
              <Button type="link" danger>
                <WarningOutlined /> {record.deviations}
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    }
  ];

  // Handle export to Excel
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(inspectionHistory); // Convert data to Excel sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inspection Results');
    
    // Export as Excel file
    XLSX.writeFile(wb, 'inspection_results.xlsx');
  };

  // Add chart data and configurations
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const qualityTrendData = [
    { name: 'Mon', value: 90 },
    { name: 'Tue', value: 92 },
    { name: 'Wed', value: 88 },
    { name: 'Thu', value: 95 },
    { name: 'Fri', value: 89 },
    { name: 'Sat', value: 91 },
    { name: 'Sun', value: 90 },
  ];

  const defectData = [
    { name: 'Dimensional', value: 5 },
    { name: 'Surface', value: 3 },
    { name: 'Material', value: 2 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex-1 p-6 space-y-6">
        {/* Enhanced Header with better spacing and responsive design */}
        <Card className="shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/operator/dashboard')}
                type="primary"
                ghost
              >
                Back
              </Button>
              <div>
                <Title level={4} style={{ margin: 0 }}>Inspection Results</Title>
                <Text type="secondary">Monitor and analyze inspection data</Text>
              </div>
            </div>
            <Space wrap className="w-full md:w-auto">
              <Select
                value={selectedPartNumber}
                onChange={setSelectedPartNumber}
                style={{ width: '100%', minWidth: 300 }}
                showSearch
                optionFilterProp="label"
                options={partNumbers}
                optionRender={(option) => (
                  <Space className="flex justify-between w-full">
                    <span>{option.data.label}</span>
                    <Tag color="blue">{option.data.category}</Tag>
                  </Space>
                )}
                dropdownStyle={{ maxHeight: 400 }}
                placeholder="Select Part Number"
              />
              <RangePicker 
                value={timeRange}
                onChange={setTimeRange}
                style={{ minWidth: 250 }}
              />
            </Space>
          </div>
        </Card>

        {/* Enhanced Analytics Cards with dynamic data */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="text-center transition-all duration-300 hover:shadow-lg">
              <Statistic
                title={<span className="text-lg font-medium">Total Inspections</span>}
                value={getCurrentAnalytics().totalInspections}
                prefix={<CheckCircleOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="text-center transition-all duration-300 hover:shadow-lg">
              <Statistic
                title={<span className="text-lg font-medium">Good Parts</span>}
                value={getCurrentAnalytics().goodParts}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="text-center transition-all duration-300 hover:shadow-lg">
              <Statistic
                title={<span className="text-lg font-medium">Bad Parts</span>}
                value={getCurrentAnalytics().badParts}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable className="text-center transition-all duration-300 hover:shadow-lg">
              <Statistic
                title={<span className="text-lg font-medium">Deviations</span>}
                value={getCurrentAnalytics().deviations}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Enhanced Inspection History */}
        <Card 
          title={
            <div className="flex justify-between items-center">
              <span>Inspection History</span>
              <Space>
                <Button icon={<DownloadOutlined />} onClick={handleExport}>
                  Export
                </Button>
                <Button type="primary" onClick={() => navigate('/operator/new-inspection')}>
                  New Inspection
                </Button>
              </Space>
            </div>
          }
          className="shadow-md"
        >
          <Table
            columns={columns}
            dataSource={inspectionHistory}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} records`,
            }}
            summary={(pageData) => {
              // Add summary row with totals
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell>Total</Table.Summary.Cell>
                    <Table.Summary.Cell>{pageData.length} Records</Table.Summary.Cell>
                    {/* ... more summary cells ... */}
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      </div>

      <Modal
    title="Inspection Details"
    visible={isDetailModalVisible}
    onCancel={() => setIsDetailModalVisible(false)}
    width={1200}
    footer={[
      <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
        Close
      </Button>
    ]}
  >
    {selectedRecord && (
      <div className="space-y-6">
        {/* Header Information Card */}
        <Card className="bg-gray-50">
          <Row gutter={[24, 16]}>
            <Col span={6}>
              <Text strong>Operator Number:</Text>
              <div>{selectedRecord.operationNumber}</div>
            </Col>
            <Col span={6}>
              <Text strong>Operator:</Text>
              <div>{selectedRecord.operator}</div>
            </Col>
            <Col span={6}>
              <Text strong>IPID:</Text>
              <div>{selectedRecord.ipidNo || 'IPID-' + selectedRecord.key}</div>
            </Col>
            <Col span={6}>
              <Text strong>Part Number:</Text>
              <div>{selectedRecord.partNumber}</div>
            </Col>
          </Row>
        </Card>

        {/* Measurements Table Card */}
        <Card title="Measurements">
          <Table
            columns={measurementColumns}
            dataSource={mockMeasurementData}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => {
              const measurement = parseFloat(record.measurement);
              const maxValue = parseFloat(record.maxValue);
              const minValue = parseFloat(record.minValue);
              
              // Only apply red background if measurement is numeric and out of range
              if (!isNaN(measurement) && !isNaN(maxValue) && !isNaN(minValue)) {
                if (measurement > maxValue || measurement < minValue) {
                  return 'bg-red-100';
                }
              }
              return '';
            }}
          />
        </Card>
      </div>
    )}
  </Modal>
    </div>
  );
}

export default InspectionResult;
