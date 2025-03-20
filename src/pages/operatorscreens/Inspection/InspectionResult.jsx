import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Row, Col, Statistic, Progress, Select, DatePicker, Tooltip, Tag, Badge, Empty, Spin, Modal, Divider, Alert, message } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, DownloadOutlined, EyeOutlined, FileSearchOutlined, PlusCircleOutlined, CloseOutlined, DatabaseOutlined, UserOutlined, ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import { qualityStore } from '../../../store/quality-store';
import axios from 'axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function InspectionResult() {
  const navigate = useNavigate();
  const [selectedPartNumber, setSelectedPartNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [partNumbers, setPartNumbers] = useState([]);
  const [inspectionData, setInspectionData] = useState(null);
  const [isOperationModalVisible, setIsOperationModalVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOperationData, setSelectedOperationData] = useState(null);
  const [isQmsModalVisible, setIsQmsModalVisible] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const fetchPartNumbers = async () => {
      try {
        setLoading(true);
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login'); // Redirect to login page
          return;
        }
        
        const orders = await qualityStore.fetchAllOrders();
        setPartNumbers(orders);
      } catch (error) {
        console.error('Error fetching part numbers:', error);
        if (error.message === 'No authentication token found') {
          navigate('/login'); // Redirect to login if token is missing
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPartNumbers();
  }, [navigate]);

  const handlePartNumberChange = async (value) => {
    try {
      setLoading(true);
      setSelectedPartNumber(value);
      setSelectedOrderId(value);
      
      // Use the correct endpoint
      const response = await axios.get(
        `http://172.18.7.88:6970/quality/inspection/${value}/detailed`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Received inspection data:', response.data);
      
      // Transform the data to match the expected structure
      const transformedData = [{
        key: response.data.order_id,
        order_id: response.data.order_id,
        production_order: response.data.production_order,
        part_number: response.data.part_number,
        operations: response.data.operations || [],
        inspection_data: response.data.inspection_data || []
      }];
      
      setInspectionData(transformedData);
    } catch (error) {
      console.error('Error fetching inspection details:', error);
      
      // If there's an error, set empty data with the structure
      setInspectionData([{
        key: value,
        order_id: value,
        production_order: '',
        part_number: '',
        operations: [],
        inspection_data: []
      }]);
      
      message.error('Failed to load inspection data');
    } finally {
      setLoading(false);
    }
  };

  const showInspectionDetails = (record) => {
    setSelectedRecord(record);
    setIsDetailModalVisible(true);
  };

  const handleOperationClick = (operation, record) => {
    // Find inspection data for the selected operation
    const operationData = record.inspection_data.find(
      data => data.operation_number === operation
    );

    setSelectedOperation(operation);
    
    if (operationData && operationData.inspections && operationData.inspections.length > 0) {
      // If measurements exist, show measurements modal
      setSelectedOperationData(operationData);
      setIsOperationModalVisible(true);
    } else {
      // If no measurements, show QMS modal
      setIsQmsModalVisible(true);
    }
  };

  const handleLaunchQMS = () => {
    setIsLaunching(true);
    setIsQmsModalVisible(false);
    
    // Show the loading modal
    Modal.info({
      title: 'Launching QMS Software',
      content: (
        <div className="py-8 text-center">
          <div className="mb-6">
            <LoadingOutlined style={{ fontSize: 48 }} spin />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Please wait while QMS software is launching...</h3>
            <div className="flex flex-col items-center gap-2">
              <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full animate-progress"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-gray-500 text-sm">This may take a few moments</p>
            </div>
          </div>
        </div>
      ),
      icon: null,
      closable: false,
      maskClosable: false,
      centered: true,
      okButtonProps: { style: { display: 'none' } },
      width: 400,
      className: "qms-loading-modal"
    });

    // Auto close the loading modal after 5 seconds
    setTimeout(() => {
      Modal.destroyAll();
      setIsLaunching(false);
      message.success('QMS software launched successfully');
    }, 5000);
  };

  const measurementColumns = [
    {
      title: 'Dimension Type',
      dataIndex: 'dimension_type',
      key: 'dimension_type',
      width: '15%',
    },
    {
      title: 'Nominal',
      dataIndex: 'nominal_value',
      key: 'nominal_value',
      width: '10%',
    },
    {
      title: 'Upper Tol',
      dataIndex: 'uppertol',
      key: 'uppertol',
      width: '10%',
    },
    {
      title: 'Lower Tol',
      dataIndex: 'lowertol',
      key: 'lowertol',
      width: '10%',
    },
    {
      title: 'Zone',
      dataIndex: 'zone',
      key: 'zone',
      width: '10%',
    },
    {
      title: 'Measured Values',
      children: [
        {
          title: 'M1',
          dataIndex: 'measured_1',
          key: 'measured_1',
          width: '8%',
        },
        {
          title: 'M2',
          dataIndex: 'measured_2',
          key: 'measured_2',
          width: '8%',
        },
        {
          title: 'M3',
          dataIndex: 'measured_3',
          key: 'measured_3',
          width: '8%',
        },
        {
          title: 'Mean',
          dataIndex: 'measured_mean',
          key: 'measured_mean',
          width: '8%',
        },
      ],
    },
    {
      title: 'Instrument',
      dataIndex: 'measured_instrument',
      key: 'measured_instrument',
      width: '13%',
    },
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

  // Enhanced columns with conditional icons
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: '10%',
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: '15%',
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: '15%',
    },
    {
      title: 'Operations',
      dataIndex: 'operations',
      key: 'operations',
      width: '30%',
      render: (operations, record) => (
        <Space wrap>
          {operations.map((op) => {
            // Check if operation has measurement data
            const hasData = record.inspection_data.some(
              data => data.operation_number === op && 
              data.inspections && 
              data.inspections.length > 0
            );

            return (
              <Button
                key={op}
                type={hasData ? "primary" : "default"}
                onClick={() => handleOperationClick(op, record)}
                icon={hasData ? <CheckCircleOutlined /> : <PlusCircleOutlined />}
                className={`
                  transition-all duration-300
                  ${hasData ? 'hover:shadow-md' : 'hover:border-blue-400'}
                `}
              >
                OP {op}
                {hasData ? (
                  <Tag color="success" className="ml-2">
                    {record.inspection_data.find(d => d.operation_number === op)?.inspections.length || 0}
                  </Tag>
                ) : null}
              </Button>
            );
          })}
        </Space>
      ),
    },
    {
      title: 'Inspection Data',
      dataIndex: 'inspection_data',
      key: 'inspection_data',
      width: '30%',
      render: (inspectionData) => {
        if (!inspectionData || inspectionData.length === 0) {
          return <Tag color="warning">No inspection data</Tag>;
        }
        return (
          <Space direction="vertical">
            {inspectionData.map((item, index) => (
              <Tag key={index} color="processing">
                {`Inspection ${index + 1}`}
              </Tag>
            ))}
          </Space>
        );
      },
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

  // Modal for showing operation measurements
  const OperationMeasurementsModal = () => (
    <Modal
      title={
        <div className="flex items-center gap-3 py-2">
          <div className="bg-green-50 p-2 rounded-lg">
            <CheckCircleOutlined className="text-green-500 text-xl" />
          </div>
          <div>
            <div className="text-lg font-semibold">Operation {selectedOperation} Measurements</div>
            <Text type="secondary" className="text-sm">
              Detailed measurement data and inspection results
            </Text>
          </div>
        </div>
      }
      open={isOperationModalVisible}
      onCancel={() => {
        setIsOperationModalVisible(false);
        setSelectedOperationData(null);
      }}
      width={1200}
      className="custom-modal"
      footer={[
        <Button 
          key="close" 
          onClick={() => {
            setIsOperationModalVisible(false);
            setSelectedOperationData(null);
          }}
          className="hover:scale-105 transition-transform"
          icon={<CloseOutlined />}
        >
          Close
        </Button>
      ]}
    >
      <div className="p-4">
        {selectedOperationData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50 border-0">
                <Statistic
                  title={<Text strong>Total Measurements</Text>}
                  value={selectedOperationData.inspections.length}
                  prefix={<DatabaseOutlined className="text-blue-500" />}
                />
              </Card>
              <Card className="bg-green-50 border-0">
                <Statistic
                  title={<Text strong>Operator</Text>}
                  value={selectedOperationData.inspections[0]?.operator?.username || 'N/A'}
                  prefix={<UserOutlined className="text-green-500" />}
                />
              </Card>
              <Card className="bg-purple-50 border-0">
                <Statistic
                  title={<Text strong>Last Updated</Text>}
                  value={moment(selectedOperationData.inspections[0]?.created_at).format('YYYY-MM-DD HH:mm')}
                  prefix={<ClockCircleOutlined className="text-purple-500" />}
                />
              </Card>
            </div>

            {/* Measurements Table */}
            <Card 
              className="shadow-sm border-0 rounded-lg"
              title={
                <div className="flex items-center gap-2">
                  <FileSearchOutlined className="text-blue-500" />
                  <span>Measurement Details</span>
                </div>
              }
            >
              <Table
                columns={measurementColumns}
                dataSource={selectedOperationData.inspections}
                pagination={false}
                scroll={{ x: 'max-content', y: 400 }}
                size="middle"
                bordered
                rowKey="id"
                className="custom-measurement-table"
                rowClassName={(record) => {
                  const mean = parseFloat(record.measured_mean);
                  const nominal = parseFloat(record.nominal_value);
                  const upper = parseFloat(record.uppertol);
                  const lower = parseFloat(record.lowertol);
                  
                  if (isNaN(mean) || isNaN(nominal) || isNaN(upper) || isNaN(lower)) {
                    return '';
                  }
                  
                  return (mean > (nominal + upper) || mean < (nominal + lower)) 
                    ? 'bg-red-50 hover:bg-red-100' 
                    : 'bg-green-50 hover:bg-green-100';
                }}
              />
            </Card>
          </>
        ) : (
          <Empty 
            description="No measurement data available for this operation"
            className="my-12" 
          />
        )}
      </div>
    </Modal>
  );

  // QMS Modal
  const QmsModal = () => (
    <Modal
      title={
        <Space>
          <PlusCircleOutlined className="text-blue-500" />
          <span>No Measurements Available</span>
        </Space>
      }
      open={isQmsModalVisible}
      onCancel={() => setIsQmsModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setIsQmsModalVisible(false)}>
          Cancel
        </Button>,
        <Button 
          key="openQms" 
          type="primary"
          onClick={handleLaunchQMS}
          loading={isLaunching}
        >
          Open QMS Software
        </Button>
      ]}
    >
      <div className="p-4">
        <Alert
          message="No Measurement Data"
          description={
            <div>
              <p>No measurement data is available for Operation {selectedOperation}.</p>
              <p>Would you like to open the QMS software to create new measurements?</p>
              <div className="mt-4">
                <Text strong>Details:</Text>
                <ul className="mt-2">
                  <li>Operation Number: {selectedOperation}</li>
                  <li>Part Number: {selectedPartNumber}</li>
                  <li>Production Order: {inspectionData?.[0]?.production_order}</li>
                </ul>
              </div>
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />
      </div>
    </Modal>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <style>{styles}</style>
      <div className="flex-1 p-6 space-y-6">
        {/* Header Card */}
        <Card className="shadow-sm border-0 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileSearchOutlined className="text-2xl text-blue-500" />
              </div>
              <div>
                <Title level={4} style={{ margin: 0 }}>Inspection Results</Title>
                <Text type="secondary">Monitor and analyze inspection data</Text>
              </div>
            </div>
            <Space wrap className="w-full md:w-auto">
              <Text strong>Select Part Number:</Text>
              <Select
                value={selectedPartNumber}
                onChange={handlePartNumberChange}
                style={{ width: '100%', minWidth: 300 }}
                showSearch
                loading={loading}
                optionFilterProp="label"
                options={partNumbers}
                optionRender={(option) => (
                  <Space className="flex justify-between w-full">
                    <span>{option.data.label}</span>
                  </Space>
                )}
                dropdownStyle={{ maxHeight: 400 }}
                placeholder="Select Part Number"
                className="custom-select"
              />
            </Space>
          </div>
        </Card>

        {/* Show Inspection History only when a part number is selected */}
        {selectedPartNumber && (
          <Card 
            title={
              <div className="flex justify-between items-center">
                <Space size="middle">
                  <span className="text-lg font-semibold">Inspection History</span>
                  {loading && <Spin size="small" />}
                </Space>
              
              </div>
            }
            className="shadow-sm border-0 rounded-lg"
          >
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Spin size="large" />
              </div>
            ) : inspectionData && inspectionData.length > 0 ? (
              <Table
                columns={columns}
                dataSource={inspectionData}
                pagination={false}
                scroll={{ x: 'max-content' }}
                className="custom-table"
              />
            ) : (
              <Empty 
                description={
                  <div className="text-gray-500">
                    <p>No inspection data available for the selected part</p>
                    <Button 
                      type="link" 
                      onClick={() => navigate('/operator/new-inspection')}
                    >
                      Create New Inspection
                    </Button>
                  </div>
                }
                className="my-12"
              />
            )}
          </Card>
        )}
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
              <div>{selectedRecord.part_number}</div>
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

      <OperationMeasurementsModal />
      <QmsModal />
    </div>
  );
}

// Enhanced styles
const styles = `
  .custom-select .ant-select-selector {
    border-radius: 8px !important;
    border: 1px solid #e2e8f0 !important;
    padding: 4px 12px !important;
  }

  .custom-select .ant-select-selector:hover {
    border-color: #60a5fa !important;
  }

  .ant-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border-radius: 8px;
    transition: all 0.3s;
    height: 38px;
  }

  .ant-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .ant-tag {
    margin: 0;
    font-size: 12px;
    border-radius: 4px;
    padding: 2px 8px;
  }

  .ant-card {
    overflow: hidden;
  }

  .custom-table .ant-table-thead > tr > th {
    background: #f8fafc;
    font-weight: 600;
  }

  .custom-table .ant-table-tbody > tr:hover > td {
    background: #f1f5f9;
  }

  .custom-modal .ant-modal-content {
    border-radius: 12px;
    padding: 0;
  }

  .custom-modal .ant-modal-header {
    border-radius: 12px 12px 0 0;
    padding: 16px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .custom-modal .ant-modal-body {
    padding: 24px;
  }

  .ant-btn-primary {
    background: #3b82f6;
    border-color: #3b82f6;
  }

  .ant-btn-primary:hover {
    background: #2563eb;
    border-color: #2563eb;
  }

  .ant-btn-default .anticon {
    color: #3b82f6;
  }

  .ant-empty {
    color: #64748b;
  }

  @media (max-width: 640px) {
    .ant-card-head {
      padding: 0 12px;
    }

    .ant-card-body {
      padding: 12px;
    }
  }

  .custom-measurement-table .ant-table-thead > tr > th {
    background: #f8fafc;
    font-weight: 600;
    text-align: center;
  }

  .custom-measurement-table .ant-table-tbody > tr > td {
    text-align: center;
  }

  .custom-measurement-table .ant-table-cell {
    padding: 12px 8px;
  }

  .custom-measurement-table .ant-table-row:hover > td {
    transition: background-color 0.3s;
  }

  .ant-statistic-title {
    color: #4b5563;
    margin-bottom: 8px;
  }

  .ant-statistic-content {
    color: #1f2937;
    font-size: 1.25rem;
  }

  .ant-card-head {
    border-bottom: 1px solid #e5e7eb;
    min-height: 48px;
  }

  .ant-card-head-title {
    padding: 12px 0;
  }

  .ant-modal-content {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }

  .ant-table-cell.measured-value {
    font-family: monospace;
    font-size: 0.95rem;
  }

  .dimension-type-cell {
    font-weight: 500;
    color: #374151;
  }

  .zone-cell {
    font-weight: 500;
    color: #4b5563;
    background: #f3f4f6;
  }

  @keyframes progress {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-progress {
    animation: progress 2s infinite linear;
  }

  .qms-loading-modal .ant-modal-content {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .qms-loading-modal .ant-modal-body {
    padding: 24px;
  }
`;

export default InspectionResult;