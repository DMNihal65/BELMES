import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Row, Col, Statistic, Progress, Select, DatePicker, Tooltip, Tag, Badge, Empty, Spin, Modal, Divider, Alert, message } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, DownloadOutlined, EyeOutlined, FileSearchOutlined, PlusCircleOutlined, CloseOutlined, DatabaseOutlined, UserOutlined, ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Wrench } from 'lucide-react';
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
  const [detailedMeasurements, setDetailedMeasurements] = useState(null);
  const [isDetailedMeasurementsVisible, setIsDetailedMeasurementsVisible] = useState(false);
  const [loadingDetailedMeasurements, setLoadingDetailedMeasurements] = useState(false);
  const [ftpApprovalStatus, setFtpApprovalStatus] = useState(null);
  const [measuredData, setMeasuredData] = useState(null);
  const [isMeasuredDataModalVisible, setIsMeasuredDataModalVisible] = useState(false);

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
      
      // Use fetchInspectionDetails instead of fetchInspectionByOrderId
      const inspectionDetails = await qualityStore.fetchInspectionDetails(value);
      console.log('Received inspection details:', inspectionDetails);
      
      // Format the data for the table display
      const formattedData = [{
        key: value,
        order_id: inspectionDetails.order_id || value,
        production_order: inspectionDetails.production_order || '',
        part_number: inspectionDetails.part_number || '',
        operations: inspectionDetails.operations || [],
        inspection_data: [] // We'll modify this as needed based on operation_groups
      }];
      
      // Check if we have operation_groups to process
      if (inspectionDetails.operation_groups && inspectionDetails.operation_groups.length > 0) {
        // Group the inspection data by operation
        const groupedByOperation = {};
        
        inspectionDetails.operation_groups.forEach(group => {
          const opNo = group.op_no;
          
          if (!groupedByOperation[opNo]) {
            groupedByOperation[opNo] = {
              operation_number: opNo,
              inspections: []
            };
          }
          
          // Add this measurement to the operation's inspections
          if (group.details) {
            groupedByOperation[opNo].inspections.push({
              id: `${opNo}-${group.details.zone || 'unknown'}-${groupedByOperation[opNo].inspections.length + 1}`,
              dimension_type: group.details.dimension_type || '',
              nominal_value: group.details.nominal || '',
              uppertol: group.details.uppertol || '',
              lowertol: group.details.lowertol || '',
              zone: group.details.zone || '',
              measured_instrument: group.details.measured_instrument || ''
            });
          }
        });
        
        // Convert the grouped data back to an array
        formattedData[0].inspection_data = Object.values(groupedByOperation);
      }
      
      setInspectionData(formattedData);
      
    } catch (error) {
      console.error('Error fetching inspection details:', error);
      message.error('Failed to load inspection data');
      
      // Set empty data with the structure
      setInspectionData([{
        key: value,
        order_id: value,
        production_order: '',
        part_number: '',
        operations: [],
        inspection_data: []
      }]);
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

  const handleLaunchQMS = async () => {
    try {
      setIsLaunching(true);
      
      // Use the custom protocol handler to launch QMS
      window.location.href = "belmes://launch-qms";
      
      // Show success message
      message.success('Launching QMS software...');
      
      // Set a timeout to reset the launching state after a few seconds
      setTimeout(() => {
        setIsLaunching(false);
        
        // Close the QMS modal if it's open
        if (isQmsModalVisible) {
          setIsQmsModalVisible(false);
        }
      }, 3000);

    } catch (error) {
      console.error('Failed to launch QMS:', error);
      message.error('Failed to launch QMS software');
      setIsLaunching(false);
    }
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
          render: (value, record) => {
            // Format to 4 decimal places
            const formattedValue = typeof value === 'number' ? value.toFixed(4) : value;
            
            // Check if value is within tolerance
            const nominal = parseFloat(record.nominal_value);
            const upper = parseFloat(record.uppertol);
            const lower = parseFloat(record.lowertol);
            const mean = parseFloat(value);
            
            if (isNaN(mean) || isNaN(nominal)) {
              return <span className="font-mono">{formattedValue}</span>;
            }
            
            const withinTolerance = mean <= (nominal + upper) && mean >= (nominal + lower);
            
            return (
              <span className={`font-mono font-medium ${withinTolerance ? 'text-green-600' : 'text-red-600'}`}>
                {formattedValue}
              </span>
            );
          }
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
      width: '8%',
      fixed: 'left',
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: '12%',
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: '12%',
    },
    {
      title: 'Operations',
      dataIndex: 'operations',
      key: 'operations',
      width: '28%',
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
                size="small"
              >
                OP {op}
                {hasData ? (
                  <Tag color="success" className="ml-2">
                    {record.inspection_data.find(d => d.operation_number === op)?.inspections.length || 0}
                  </Tag>
                ) : (
                  <Tooltip title="Launch QMS Software">
                    <Tag color="warning" className="ml-2 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchQMS();
                      }}>
                      QMS
                    </Tag>
                  </Tooltip>
                )}
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
      width: '20%',
      fixed: 'right',
      render: (inspectionData) => {
        if (!inspectionData || inspectionData.length === 0) {
          return (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Tag color="warning">No inspection data</Tag>
              <Button 
                type="primary" 
                size="small"
                icon={<Wrench size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchQMS();
                }}
                loading={isLaunching}
                style={{ 
                  background: '#1890ff', 
                  borderRadius: '4px',
                  boxShadow: '0 2px 0 rgba(0, 0, 0, 0.045)' 
                }}
              >
                Open QMS Software
              </Button>
            </Space>
          );
        }
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space direction="vertical" size="small">
              {inspectionData.map((item, index) => (
                <Tag key={index} color="processing">
                  {`Inspection ${index + 1}`}
                </Tag>
              ))}
            </Space>
            <Button 
              type="primary" 
              size="small"
              icon={<Wrench size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleLaunchQMS();
              }}
              loading={isLaunching}
              style={{ 
                background: '#1890ff', 
                borderRadius: '4px',
                boxShadow: '0 2px 0 rgba(0, 0, 0, 0.045)' 
              }}
            >
              Open QMS Software
            </Button>
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

  // Modal for showing operation measurements with simplified UI and drawing
  const OperationMeasurementsModal = () => {
    // State for active filter tab
    const [activeTab, setActiveTab] = useState('all');
    // State for drawing data
    const [drawingData, setDrawingData] = useState(null);
    // State for drawing loading
    const [loadingDrawing, setLoadingDrawing] = useState(false);
    
    // Fetch the drawing when the modal opens
    useEffect(() => {
      if (isOperationModalVisible && selectedOperation) {
        fetchBalloonedDrawing();
      }
      
      return () => {
        // Clean up blob URL when component unmounts
        if (drawingData?.url) {
          URL.revokeObjectURL(drawingData.url);
        }
      };
    }, [isOperationModalVisible, selectedOperation]);
    
    // Function to fetch ballooned drawing
    const fetchBalloonedDrawing = async () => {
      try {
        setLoadingDrawing(true);
        
        // Get the production order from the inspection data
        const productionOrder = inspectionData?.[0]?.production_order;
        if (!productionOrder) {
          throw new Error('No production order found');
        }
        
        // Use the production order as the drawing ID and the selected operation
        const response = await qualityStore.fetchBalloonedDrawing(productionOrder, selectedOperation);
        setDrawingData(response);
      } catch (error) {
        console.error('Error fetching drawing:', error);
        message.error('Failed to load drawing');
      } finally {
        setLoadingDrawing(false);
      }
    };
    
    // Function to fetch detailed measurements
    const fetchDetailedMeasurements = async () => {
      try {
        setLoadingDetailedMeasurements(true);
        
        // Use the actual order ID from the selected data
        const inspectionId = selectedOrderId;
        if (!inspectionId) {
          throw new Error('No order ID selected');
        }
        
        console.log(`Fetching detailed measurements for inspection ID: ${inspectionId}, operation: ${selectedOperation}`);
        
        // Call the fetchDetailedInspection method from quality-store.js
        const response = await qualityStore.fetchDetailedInspection(inspectionId);
        console.log('Detailed measurements data received:', response);
        
        // Check FTP approval status
        const orderId = inspectionId;
        const ipid = 'IPID-213301910108-10';
        
        console.log('Checking FTP status for orderId:', orderId, 'ipid:', ipid);
        
        try {
          const ftpStatus = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
          console.log('FTP Status received:', ftpStatus);
          setFtpApprovalStatus(ftpStatus);
          
          // If FTP is approved, update all measurements to show as done
          if (ftpStatus?.is_completed === true && response?.inspection_data) {
            console.log('FTP is completed, updating all measurements to done');
            response.inspection_data = response.inspection_data.map(op => ({
              ...op,
              inspections: op.inspections.map(insp => ({
                ...insp,
                is_done: true
              }))
            }));
          }
        } catch (error) {
          console.error('Error checking FTP status:', error);
          message.error('Failed to check FTP approval status');
        }
        
        if (response) {
          // If we have a selected operation, filter the data to show only that operation
          if (selectedOperation && response.inspection_data) {
            const filteredOperationData = response.inspection_data.filter(data => 
              data.operation_number === parseInt(selectedOperation, 10) || 
              data.operation_number === selectedOperation
            );
            
            if (filteredOperationData.length > 0) {
              // Create a new object with filtered data for the selected operation only
              const filteredResponse = {
                ...response,
                inspection_data: filteredOperationData
              };
              
              console.log('Filtered data for operation', selectedOperation, ':', filteredResponse);
              setDetailedMeasurements(filteredResponse);
            } else {
              // Keep all data if no matching operation is found
              setDetailedMeasurements(response);
              console.log('No data found for operation', selectedOperation, 'showing all data');
            }
          } else {
            // No specific operation selected, show all data
            setDetailedMeasurements(response);
          }
          
          // Show the modal with the measurements
          setIsDetailedMeasurementsVisible(true);
        } else {
          message.error('No measurement data found');
        }
      } catch (error) {
        console.error('Error fetching detailed measurements:', error);
        message.error(`Failed to load detailed measurements: ${error.message}`);
      } finally {
        setLoadingDetailedMeasurements(false);
      }
    };
    
    // Function to filter measurements
    const getFilteredInspections = () => {
      if (!selectedOperationData?.inspections) return [];
      
      const allInspections = selectedOperationData.inspections;
      
      if (activeTab === 'all') {
        return allInspections;
      } else if (zones.includes(activeTab)) {
        // Filter by zone when a zone button is clicked
        return allInspections.filter(record => record.zone === activeTab);
      }
      
      return allInspections;
    };
    
    // Get unique zones for zone filtering
    const getUniqueZones = () => {
      if (!selectedOperationData?.inspections) return [];
      
      const zones = new Set();
      selectedOperationData.inspections.forEach(item => {
        if (item.zone) {
          zones.add(item.zone);
        }
      });
      
      return Array.from(zones).sort();
    };
    
    const zones = getUniqueZones();
    
    // Columns for detailed measurements table
    const detailedMeasurementColumns = [
      {
        title: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        width: '8%',
        render: (zone) => (
          <Tag color="blue" className="zone-tag">
            {zone || 'N/A'}
          </Tag>
        )
      },
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
        render: (value) => (
          <span className="font-mono font-medium">{value || '-'}</span>
        )
      },
      {
        title: 'Tolerance',
        children: [
          {
            title: 'Upper',
            dataIndex: 'uppertol',
            key: 'uppertol',
            width: '8%',
            render: (value) => (
              <span className="font-mono text-green-600 font-medium">
                {value > 0 ? `+${value}` : value}
              </span>
            )
          },
          {
            title: 'Lower',
            dataIndex: 'lowertol',
            key: 'lowertol',
            width: '8%',
            render: (value) => (
              <span className="font-mono text-red-600 font-medium">
                {value}
              </span>
            )
          }
        ]
      },
      {
        title: 'Measured Values',
        children: [
          {
            title: 'M1',
            dataIndex: 'measured_1',
            key: 'measured_1',
            width: '8%',
            render: (value) => (
              <span className="font-mono">{value}</span>
            )
          },
          {
            title: 'M2',
            dataIndex: 'measured_2',
            key: 'measured_2',
            width: '8%',
            render: (value) => (
              <span className="font-mono">{value}</span>
            )
          },
          {
            title: 'M3',
            dataIndex: 'measured_3',
            key: 'measured_3',
            width: '8%',
            render: (value) => (
              <span className="font-mono">{value}</span>
            )
          },
          {
            title: 'Mean',
            dataIndex: 'measured_mean',
            key: 'measured_mean',
            width: '8%',
            render: (value, record) => {
              // Format to 4 decimal places
              const formattedValue = typeof value === 'number' ? value.toFixed(4) : value;
              
              // Check if value is within tolerance
              const nominal = parseFloat(record.nominal_value);
              const upper = parseFloat(record.uppertol);
              const lower = parseFloat(record.lowertol);
              const mean = parseFloat(value);
              
              if (isNaN(mean) || isNaN(nominal)) {
                return <span className="font-mono">{formattedValue}</span>;
              }
              
              const withinTolerance = mean <= (nominal + upper) && mean >= (nominal + lower);
              
              return (
                <span className={`font-mono font-medium ${withinTolerance ? 'text-green-600' : 'text-red-600'}`}>
                  {formattedValue}
                </span>
              );
            }
          }
        ]
      },
      {
        title: 'Instrument',
        dataIndex: 'measured_instrument',
        key: 'measured_instrument',
        width: '10%',
        render: (value) => (
          <Tag color="cyan" className="instrument-tag">
            {value || 'N/A'}
          </Tag>
        )
      },
      {
        title: 'Status',
        dataIndex: 'is_done',
        key: 'is_done',
        width: '8%',
        render: (isDone, record) => {
          console.log('Rendering status for record:', record);
          console.log('Current FTP status:', ftpApprovalStatus);
          
          // If FTP is approved, always show as done
          if (ftpApprovalStatus?.is_completed === true) {
            console.log('FTP is completed, showing Done status');
            return (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Done
              </Tag>
            );
          }
          
          // Otherwise show based on individual measurement status
          console.log('FTP not completed, showing individual status:', isDone);
          return isDone ? 
            <Tag color="success" icon={<CheckCircleOutlined />}>Done</Tag> : 
            <Tag color="warning" icon={<ClockCircleOutlined />}>Pending</Tag>;
        }
      },
      {
        title: 'Operator',
        dataIndex: 'operator',
        key: 'operator',
        width: '10%',
        render: (operator) => (
          <Tooltip title={`${operator?.email || ''}`}>
            <Tag icon={<UserOutlined />} color="processing">
              {operator?.username || 'Unknown'}
            </Tag>
          </Tooltip>
        )
      }
    ];
    
    // Simplified measurement columns as requested
    const simplifiedColumns = [
      {
        title: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        width: '10%',
        render: (zone) => (
          <Tag color="blue" className="zone-tag">{zone || 'N/A'}</Tag>
        )
      },
      {
        title: 'Description',
        dataIndex: 'dimension_type',
        key: 'dimension_type',
        width: '25%',
        render: (type) => {
          // Handle GDT symbols properly
          if (type?.includes('GDT:')) {
            return (
              <div className="flex items-center">
                <span className="text-purple-700 font-medium">
                  {type}
                </span>
              </div>
            );
          }
          return <span className="text-gray-800">{type || '-'}</span>;
        }
      },
      {
        title: 'Nominal',
        dataIndex: 'nominal_value',
        key: 'nominal_value',
        width: '20%',
        render: (value) => {
          if (value?.toLowerCase().includes('hole') || 
              value?.toLowerCase().includes('tapped')) {
            return <Tag color="orange" className="w-full text-center">{value}</Tag>;
          }
          return <span className="font-mono font-medium">{value || '-'}</span>;
        }
      },
      {
        title: 'Upper Tol',
        dataIndex: 'uppertol',
        key: 'uppertol',
        width: '15%',
        render: (value) => (
          <span className="font-mono text-green-600 font-medium">
            {value > 0 ? `+${value}` : value}
          </span>
        )
      },
      {
        title: 'Lower Tol',
        dataIndex: 'lowertol',
        key: 'lowertol',
        width: '15%',
        render: (value) => (
          <span className="font-mono text-red-600 font-medium">
            {value}
          </span>
        )
      },
      {
        title: 'Instrument',
        dataIndex: 'measured_instrument',
        key: 'measured_instrument',
        width: '15%',
        render: (value) => (
          <Tag color="cyan" className="instrument-tag">
            {value || 'N/A'}
          </Tag>
        )
      }
    ];

    // DetailedMeasurementsModal component
    const DetailedMeasurementsModal = () => {
      // Function to get the measurements for the selected operation
      const getOperationMeasurements = () => {
        if (!detailedMeasurements || !detailedMeasurements.inspection_data) {
          return [];
        }
        
        // Find the operation data matching the selected operation
        const operationData = detailedMeasurements.inspection_data.find(
          data => data.operation_number === parseInt(selectedOperation, 10) || 
                 data.operation_number === selectedOperation
        );
        
        // Return the inspections if found, otherwise empty array
        return operationData?.inspections || [];
      };
      
      const measurements = getOperationMeasurements();
      
      return (
        <Modal
          title={
            <div className="flex items-center gap-3 py-2">
              <div className="bg-blue-50 p-2 rounded-lg">
                <DatabaseOutlined className="text-blue-500 text-xl" />
              </div>
              <div>
                <div className="text-lg font-semibold">Operation {selectedOperation} Measurements</div>
                <Text type="secondary" className="text-sm">
                  {detailedMeasurements?.production_order || 'N/A'} | {detailedMeasurements?.part_number || 'N/A'}
                </Text>
              </div>
            </div>
          }
          open={isDetailedMeasurementsVisible}
          onCancel={() => setIsDetailedMeasurementsVisible(false)}
          width={1400}
          footer={[
            <Button 
              key="close" 
              onClick={() => setIsDetailedMeasurementsVisible(false)}
              className="hover:scale-105 transition-transform"
              icon={<CloseOutlined />}
            >
              Close
            </Button>
          ]}
        >
          <div className="p-4">
            {loadingDetailedMeasurements ? (
              <div className="flex justify-center items-center p-12">
                <Spin size="large" tip="Loading measurement data..." />
              </div>
            ) : detailedMeasurements ? (
              <div>
                <Alert
                  message="Inspection Details"
                  description={
                    <Row gutter={[16, 16]} className="pt-2">
                      <Col span={6}>
                        <Text strong>Order ID:</Text> {detailedMeasurements.order_id || 'N/A'}
                      </Col>
                      <Col span={6}>
                        <Text strong>Part Number:</Text> {detailedMeasurements.part_number || 'N/A'}
                      </Col>
                      <Col span={6}>
                        <Text strong>Production Order:</Text> {detailedMeasurements.production_order || 'N/A'}
                      </Col>
                      <Col span={6}>
                        <Text strong>Operation:</Text> {selectedOperation || 'N/A'}
                      </Col>
                    </Row>
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />
                
                {measurements && measurements.length > 0 ? (
                  <Table
                    columns={detailedMeasurementColumns}
                    dataSource={measurements.map(item => ({
                      ...item,
                      key: item.id || `${item.zone}-${item.dimension_type}`
                    }))}
                    bordered
                    size="middle"
                    scroll={{ y: 500, x: 1300 }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    className="detailed-measurements-table"
                    summary={data => {
                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row className="bg-gray-50">
                            <Table.Summary.Cell index={0} colSpan={2}>
                              <Text strong>Total Items: {data.length}</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} colSpan={5}>
                              <Space>
                                <Badge status="success" text={`Completed: ${data.filter(item => item.is_done).length}`} />
                                <Badge status="warning" text={`Pending: ${data.filter(item => !item.is_done).length}`} />
                              </Space>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} colSpan={3}>
                              <Text type="secondary">
                                {data.length > 0 && data[0].created_at ? 
                                  `Last Updated: ${new Date(Math.max(...data.filter(item => item.created_at).map(item => new Date(item.created_at)))).toLocaleString()}` 
                                  : ''}
                              </Text>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                  />
                ) : (
                  <Empty description={
                    <span>
                      No measurements found for Operation {selectedOperation}. 
                      <Button 
                        type="link" 
                        onClick={handleLaunchQMS}
                        className="ml-2"
                      >
                        Launch QMS Software
                      </Button>
                    </span>
                  } />
                )}
              </div>
            ) : (
              <Empty description="No detailed measurements available" />
            )}
          </div>
        </Modal>
      );
    };

    return (
      <Modal
        title={
          <div className="flex items-center gap-3 py-2">
            <div className="bg-blue-50 p-2 rounded-lg">
              <FileSearchOutlined className="text-blue-500 text-xl" />
            </div>
            <div>
              <div className="text-lg font-semibold">Operation {selectedOperation} Measurements</div>
              <Text type="secondary" className="text-sm">
                {inspectionData?.[0]?.production_order} | {inspectionData?.[0]?.part_number}
              </Text>
            </div>
          </div>
        }
        open={isOperationModalVisible}
        onCancel={() => {
          setIsOperationModalVisible(false);
          setSelectedOperationData(null);
          setActiveTab('all');
          setDrawingData(null);
        }}
        width={1600}
        className="custom-modal measurement-modal"
        footer={[
          <Button 
            key="close" 
            onClick={() => {
              setIsOperationModalVisible(false);
              setSelectedOperationData(null);
              setActiveTab('all');
              setDrawingData(null);
            }}
            className="hover:scale-105 transition-transform"
            icon={<CloseOutlined />}
            size="large"
          >
            Close
          </Button>
        ]}
      >
        <div className="p-4">
          {selectedOperationData ? (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left side - Measurements */}
              <div className="w-full md:w-1/2">
                {/* Simple zone filter */}
                {zones.length > 0 && (
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <Text strong className="mr-2">Filter by Zone:</Text>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        type={activeTab === 'all' ? 'primary' : 'default'}
                        onClick={() => setActiveTab('all')}
                        className="zone-button"
                        size="small"
                      >
                        All Zones
                      </Button>
                      {zones.map(zone => (
                        <Button
                          key={zone}
                          type={activeTab === zone ? 'primary' : 'default'}
                          onClick={() => setActiveTab(activeTab === zone ? 'all' : zone)}
                          className="zone-button"
                          size="small"
                        >
                          {zone}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Table with simplified columns */}
                <Table
                  columns={simplifiedColumns}
                  dataSource={getFilteredInspections()}
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: false, 
                    showTotal: (total) => `Total ${total} items`
                  }}
                  rowKey={(record) => `${record.zone}-${record.dimension_type}-${record.nominal_value}`}
                  bordered
                  size="middle"
                  className="measurement-table"
                  scroll={{ y: 500 }}
                  rowClassName={(record) => {
                    if (record.dimension_type?.toLowerCase().includes('gdt')) {
                      return 'bg-purple-50 hover:bg-purple-100';
                    } else if (record.nominal_value?.toLowerCase().includes('hole') || 
                              record.nominal_value?.toLowerCase().includes('tapped')) {
                      return 'bg-orange-50 hover:bg-orange-100';
                    } else if (record.dimension_type?.toLowerCase().includes('length')) {
                      return 'bg-green-50 hover:bg-green-100';
                    }
                    return '';
                  }}
                  onRow={(record) => ({
                    onClick: () => {
                      // Optionally highlight the corresponding zone in the drawing
                      console.log(`Clicked zone: ${record.zone}`);
                    }
                  })}
                />
              </div>
              
              {/* Right side - Drawing */}
              <div className="w-full md:w-1/2 mt-4 md:mt-0">
                <div className="h-full bg-white border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
                    <Text strong>Ballooned Drawing</Text>
                    <Space>
                      {/* New View Measurements button */}
                      <Button 
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={fetchDetailedMeasurements}
                        loading={loadingDetailedMeasurements}
                      >
                        View Measurements 
                      </Button>
                      
                      {drawingData && (
                        <Button 
                          type="default"
                          icon={<DownloadOutlined />}
                          size="small"
                          onClick={() => {
                            // Create a download link for the drawing
                            const link = document.createElement('a');
                            link.href = drawingData.url;
                            link.download = `drawing-op-${selectedOperation}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Download
                        </Button>
                      )}
                    </Space>
                  </div>
                  
                  <div className="h-[600px] flex items-center justify-center bg-gray-50">
                    {loadingDrawing ? (
                      <div className="text-center">
                        <Spin size="large" />
                        <div className="mt-2 text-gray-500">Loading drawing...</div>
                      </div>
                    ) : drawingData ? (
                      <iframe
                        src={drawingData.url}
                        className="w-full h-full border-0"
                        title="Ballooned Drawing"
                      />
                    ) : (
                      <div className="text-center">
                        <FileSearchOutlined style={{ fontSize: '48px', opacity: 0.2 }} />
                        <div className="mt-2 text-gray-500">No drawing available</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Empty 
              description="No measurement data available for this operation"
              className="my-12" 
            />
          )}
        </div>
        
        {/* Render the Detailed Measurements Modal */}
        <DetailedMeasurementsModal />
      </Modal>
    );
  };

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

  // Update the handleViewMeasuredData function to check FTP status
  const handleViewMeasuredData = async () => {
    if (!inspectionDetails?.order_id) return;

    try {
      // Show loading indicator
      message.loading({ content: 'Loading measured data...', key: 'measuredDataLoading' });
      
      // Fetch inspection data using the quality store
      const response = await qualityStore.fetchInspectionByOrderId(inspectionDetails.order_id);
      
      // Check FTP approval status
      const orderId = inspectionDetails.order_id;
      const ipid = inspectionDetails.operation_groups?.[0]?.ipid;
      if (orderId && ipid) {
        const ftpStatus = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
        setFtpApprovalStatus(ftpStatus);
        
        // If FTP is approved, update all measurements to show as done
        if (ftpStatus?.is_completed === true && response?.inspection_data) {
          response.inspection_data = response.inspection_data.map(op => ({
            ...op,
            inspections: op.inspections.map(insp => ({
              ...insp,
              is_done: true
            }))
          }));
        }
      }
      
      // Check if we have valid data with the correct structure
      if (response && response.inspection_data && response.inspection_data.length > 0) {
        setMeasuredData(response);
        setIsMeasuredDataModalVisible(true);
        message.success({ content: 'Data loaded successfully', key: 'measuredDataLoading', duration: 1 });
      } else {
        message.warning({ content: 'No measurement data available', key: 'measuredDataLoading' });
      }
    } catch (error) {
      console.error('Error loading measured data:', error);
      message.error({ content: 'Failed to load measured data', key: 'measuredDataLoading' });
    }
  };

  const prepareInspectionData = () => {
    if (!measuredData || !measuredData.inspection_data) return [];
    
    console.log('Preparing inspection data with FTP status:', ftpApprovalStatus);
    
    // Flatten the nested structure for table display
    const flatData = [];
    
    measuredData.inspection_data.forEach(operationData => {
      const operationNumber = operationData.operation_number;
      
      if (operationData.inspections && operationData.inspections.length > 0) {
        operationData.inspections.forEach(inspection => {
          // Calculate upper and lower tolerance limits
          const nominal = parseFloat(inspection.nominal_value) || 0;
          const upperTol = parseFloat(inspection.uppertol) || 0;
          const lowerTol = parseFloat(inspection.lowertol) || 0;
          const mean = parseFloat(inspection.measured_mean) || 0;
          
          // Calculate the actual upper and lower limits
          const upperLimit = nominal + upperTol;
          const lowerLimit = nominal + lowerTol; // Note: lowerTol is typically negative
          
          // Check if mean is within tolerance
          const isWithinTolerance = mean <= upperLimit && mean >= lowerLimit;
          
          // If FTP is approved, all measurements should be marked as done
          const isDone = ftpApprovalStatus?.is_completed === true ? true : inspection.is_done;
          
          console.log('Processing inspection:', {
            id: inspection.id,
            isDone: isDone,
            ftpCompleted: ftpApprovalStatus?.is_completed
          });
          
          flatData.push({
            ...inspection,
            operation_number: operationNumber,
            key: `${operationNumber}-${inspection.id}`,
            upperLimit,
            lowerLimit,
            isWithinTolerance,
            is_done: isDone // Override is_done based on FTP approval status
          });
        });
      }
    });
    
    console.log('Prepared flat data:', flatData);
    return flatData;
  };

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
              <div style={{ maxWidth: '90%', margin: '0 auto' }}>
                <Table
                  columns={columns}
                  dataSource={inspectionData}
                  pagination={false}
                  scroll={{ x: 1200 }}
                  className="custom-table"
                  bordered
                  size="middle"
                  sticky
                />
              </div>
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

  /* Fixed column styling */
  .custom-table .ant-table-cell-fix-right {
    background: #fff;
    box-shadow: -6px 0 6px -4px rgba(0, 0, 0, 0.1);
  }

  .custom-table .ant-table-cell-fix-left {
    background: #fff;
    box-shadow: 6px 0 6px -4px rgba(0, 0, 0, 0.1);
  }

  .custom-table .ant-table-tbody > tr:hover .ant-table-cell-fix-left,
  .custom-table .ant-table-tbody > tr:hover .ant-table-cell-fix-right {
    background: #f1f5f9;
  }

  .custom-table .ant-table-sticky-scroll {
    display: none;
  }

  .custom-modal .ant-modal-content {
    border-radius: 12px;
    padding: 0;
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

  /* Enhanced measurement table styling */
  .measurement-modal .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
  }
  
  .measurement-modal .ant-modal-header {
    background: #f0f7ff;
    border-bottom: 1px solid #e0e7ff;
    padding: 16px 24px;
  }
  
  .measurement-modal .ant-statistic-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .measurement-modal .ant-statistic-content {
    font-size: 24px;
    font-weight: 500;
  }
  
  .tab-button {
    padding: 8px 16px;
    height: auto;
    border-radius: 8px 8px 0 0;
    transition: all 0.3s;
  }
  
  .tab-button:hover {
    transform: translateY(-2px);
  }
  
  .active-tab {
    font-weight: 500;
    border-bottom: 2px solid #1890ff;
  }
  
  .length-tab.active-tab {
    color: #16a34a;
    border-bottom-color: #16a34a;
  }
  
  .gdt-tab.active-tab {
    color: #7e22ce;
    border-bottom-color: #7e22ce;
  }
  
  .holes-tab.active-tab {
    color: #ea580c;
    border-bottom-color: #ea580c;
  }
  
  .custom-measurement-table .ant-table-thead > tr > th {
    background: #f8fafc;
    text-align: center;
    font-weight: 600;
    color: #334155;
  }
  
  .custom-measurement-table .zone-tag {
    border-radius: 4px;
    font-weight: 500;
    text-align: center;
    display: block;
    margin: 0 auto;
    width: fit-content;
  }
  
  .custom-measurement-table .holes-tag {
    border-radius: 4px;
    font-weight: 500;
    text-align: center;
    display: block;
    margin: 0 auto;
    width: fit-content;
    font-size: 11px;
    white-space: normal;
    line-height: 1.4;
    max-width: 180px;
  }
  
  .custom-measurement-table .instrument-tag {
    text-align: center;
    display: block;
    margin: 0 auto;
    width: fit-content;
  }
  
  .dimension-type {
    font-weight: 500;
    color: #334155;
  }
  
  .gdt-symbol {
    font-family: monospace;
    letter-spacing: 0.5px;
  }
  
  .nominal-value {
    font-weight: 500;
  }
  
  .zone-button {
    min-width: 90px;
    border-radius: 20px;
    font-weight: 500;
    transition: all 0.3s;
    margin: 4px;
  }
  
  .zone-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  /* Styles for the simplified measurement table */
  .measurement-table .ant-table-thead > tr > th {
    background: #f0f5ff;
    font-weight: 600;
    text-align: center;
    color: #1e3a8a;
    padding: 12px 8px;
  }
  
  .measurement-table .ant-table-tbody > tr > td {
    padding: 12px 8px;
    text-align: center;
  }
  
  .zone-tag {
    display: inline-block;
    font-weight: 500;
    min-width: 40px;
  }
  
  .instrument-tag {
    display: inline-block;
    font-family: monospace;
    font-size: 12px;
  }
  
  .tab-button {
    border-radius: 6px;
    margin-right: 4px;
    margin-bottom: 4px;
    font-weight: 500;
    display: flex;
    align-items: center;
  }
  
  .zone-button {
    font-size: 11px;
    height: 24px;
    border-radius: 12px;
    padding: 0 10px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
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
`;

export default InspectionResult;