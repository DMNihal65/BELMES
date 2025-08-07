import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Space, Button, Row, Col, Statistic, Progress, Select, DatePicker, Tooltip, Tag, Badge, Empty, Spin, Modal, Divider, Alert, message, Switch, InputNumber } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, DownloadOutlined, EyeOutlined, FileSearchOutlined, PlusCircleOutlined, CloseOutlined, DatabaseOutlined, UserOutlined, ClockCircleOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
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
  const [viewMode, setViewMode] = useState('current'); // Default to current operation view
  const [currentOperationData, setCurrentOperationData] = useState(null);
  // Remove qty and loadingQty from parent

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

  useEffect(() => {
    const loadCurrentOperation = () => {
      try {
        const currentJobStr = localStorage.getItem('currentJobData');
        const activeOpStr = localStorage.getItem('activeOperation');
        
        if (currentJobStr && activeOpStr) {
          const currentJob = JSON.parse(currentJobStr);
          const activeOp = JSON.parse(activeOpStr);
          
          console.log('Current Job Data:', currentJob);
          console.log('Active Operation:', activeOp);
          
          // Find the active operation details from currentJob operations
          const activeOperation = currentJob.operations?.find(
            op => op.operation_number === activeOp.operation_number
          ) || activeOp;

          // Format the data to match inspection data structure
          const formattedData = {
            key: currentJob.order_id || activeOp.operation_id,
            order_id: currentJob.order_id || activeOp.operation_id,
            production_order: currentJob.production_order || '',
            part_number: currentJob.part_number || '',
            operations: currentJob.operations?.map(op => ({
              ...op,
              operation_number: op.operation_number.toString()
            })) || [],
            active_operation: {
              ...activeOperation,
              operation_number: activeOperation.operation_number.toString()
            }
          };
          
          setCurrentOperationData(formattedData);
          
          // Automatically set the selected part number to the current job's part number
          if (currentJob.part_number) {
            setSelectedPartNumber(currentJob.part_number);
            setSelectedOrderId(currentJob.order_id || activeOp.operation_id);
          }
        } else {
          console.log('No current job or active operation found in localStorage');
        }
      } catch (error) {
        console.error('Error loading current job data:', error);
      }
    };

    loadCurrentOperation();
  }, []); // Remove selectedPartNumber dependency to load on page load

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

  const handleOperationClick = async (operation, record) => {
    if (operation === 'final') {
      try {
        setLoading(true);
        // Fetch inspection details for final inspection
        const inspectionDetails = await qualityStore.fetchInspectionDetails(record.order_id);
        
        // Filter only operation 999 data
        const finalInspectionData = inspectionDetails.operation_groups.filter(
          group => group.op_no === 999
        );

        if (finalInspectionData.length > 0) {
          // Get the IPID for operation 999
          const ipid = finalInspectionData[0].ipid;
          
          if (!ipid) {
            message.warning('No IPID found for final inspection');
            return;
          }

          try {
            // Check FTP approval status
            const ftpStatus = await qualityStore.checkFinalInspectionStatus(record.order_id, ipid);
            
            // Format the data for display
            const formattedData = {
              key: record.order_id,
              order_id: inspectionDetails.order_id,
              production_order: inspectionDetails.production_order,
              part_number: inspectionDetails.part_number,
              operations: inspectionDetails.operations,
              inspection_data: [{
                operation_number: 999,
                inspections: finalInspectionData.map(group => ({
                  id: `${group.op_no}-${group.details.zone}`,
                  dimension_type: group.details.dimension_type,
                  nominal_value: group.details.nominal,
                  uppertol: group.details.uppertol,
                  lowertol: group.details.lowertol,
                  zone: group.details.zone,
                  measured_instrument: group.details.measured_instrument,
                  is_approved: ftpStatus.is_completed
                }))
              }]
            };

            setSelectedOperationData(formattedData.inspection_data[0]);
            setSelectedOperation('999');
            setFtpApprovalStatus(ftpStatus);
            setIsOperationModalVisible(true);
          } catch (ftpError) {
            console.error('Error checking FTP status:', ftpError);
            // Remove the error message and silently set status to not completed
            setFtpApprovalStatus({ is_completed: false });
            
            // Still show the data even if FTP check fails
            const formattedData = {
              key: record.order_id,
              order_id: inspectionDetails.order_id,
              production_order: inspectionDetails.production_order,
              part_number: inspectionDetails.part_number,
              operations: inspectionDetails.operations,
              inspection_data: [{
                operation_number: 999,
                inspections: finalInspectionData.map(group => ({
                  id: `${group.op_no}-${group.details.zone}`,
                  dimension_type: group.details.dimension_type,
                  nominal_value: group.details.nominal,
                  uppertol: group.details.uppertol,
                  lowertol: group.details.lowertol,
                  zone: group.details.zone,
                  measured_instrument: group.details.measured_instrument,
                  is_approved: false
                }))
              }]
            };

            setSelectedOperationData(formattedData.inspection_data[0]);
            setSelectedOperation('999');
            setIsOperationModalVisible(true);
          }
        } else {
          Modal.info({
            title: 'Final Inspection Not Available',
            content: (
              <div>
                <p>No final inspection data is available.</p>
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      handleLaunchQMS();
                      Modal.destroyAll();
                    }}
                    icon={<LinkOutlined />}
                    loading={isLaunching}
                  >
                    Open QMS Software
                  </Button>
                </div>
              </div>
            ),
            okText: 'Close',
            width: 400
          });
        }
      } catch (error) {
        console.error('Error fetching final inspection data:', error);
        message.error('Failed to load final inspection data');
      } finally {
        setLoading(false);
      }
    } else {
      // For operation 20, check FTP status
      if (operation === '20') {
        try {
          setLoading(true);
          const orderId = record.order_id;
          const ipid = `IPID-${record.part_number}-${operation}`;
          console.log('Checking FTP status for operation 20:', { orderId, ipid });
          
          const ftpStatus = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
          console.log('FTP Status for operation 20:', ftpStatus);
          
          setFtpApprovalStatus(ftpStatus);
        } catch (error) {
          console.error('Error checking FTP status for operation 20:', error);
          message.error('Failed to check FTP approval status');
        } finally {
          setLoading(false);
        }
      }
      
      // Existing operation click logic
      const operationData = record.inspection_data.find(
        data => data.operation_number === operation
      );

      setSelectedOperation(operation);
      
      if (operationData && operationData.inspections && operationData.inspections.length > 0) {
        setSelectedOperationData(operationData);
        setIsOperationModalVisible(true);
      } else {
        setIsQmsModalVisible(true);
      }
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

  // Update the columns definition to handle current view
  const columns = useMemo(() => [
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: '20%',
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: '15%',
    },
    {
      title: 'Description',
      dataIndex: 'active_operation',
      key: 'description',
      width: '25%',
      render: (activeOperation, record) => {
        if (viewMode === 'current' && activeOperation) {
          return activeOperation.description || 'No description available';
        }
        // For all operations view, show the first operation's description or a general description
        if (record.operations && record.operations.length > 0) {
          const firstOp = record.operations[0];
          return firstOp.description || 'No description available';
        }
        return 'No description available';
      }
    },
    {
      title: 'Operations',
      dataIndex: 'operations',
      key: 'operations',
      width: '30%',
      render: (operations, record) => {
        // If in current operation view, only show the active operation
        const opsToShow = viewMode === 'current' ? 
          [record.active_operation] : 
          operations;

        return (
          <Space wrap>
            {opsToShow.map((op) => {
              // For all operations view, op is the operation number itself
              const opNumber = viewMode === 'current' ? op.operation_number : op;
              
              // Check if operation has measurement data
              const hasData = record.inspection_data?.some(
                data => data.operation_number === opNumber && data.inspections && data.inspections.length > 0
              );

              return (
                <Button
                  key={opNumber}
                  type={hasData ? 'primary' : 'default'}
                  icon={hasData ? <CheckCircleOutlined /> : <PlusCircleOutlined />}
                  onClick={() => handleOperationClick(opNumber, record)}
                  className={`hover:scale-105 transition-transform ${hasData ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' : ''}`}
                >
                  {opNumber}
                </Button>
              );
            })}
          </Space>
        );
      }
    },
    // {
    //   title: 'Final Inspection',
    //   dataIndex: 'inspection_data',
    //   key: 'inspection_data',
    //   width: '20%',
    //   fixed: 'right',
    //   render: (inspectionData, record) => {
    //     // Check if there's any final inspection data (operation 999)
    //     const hasFinalInspection = record.inspection_data?.some(
    //       data => data.operation_number === 999 && data.inspections && data.inspections.length > 0
    //     );
        
    //     return (
    //       <Button
    //         type={hasFinalInspection ? 'primary' : 'default'}
    //         size="small"
    //         icon={hasFinalInspection ? <CheckCircleOutlined /> : <EyeOutlined />}
    //         onClick={() => handleOperationClick('final', record)}
    //         className={`hover:scale-105 transition-transform ${hasFinalInspection ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' : ''}`}
    //       >
    //         {hasFinalInspection ? 'View Final Inspection' : 'No Final Data'}
    //       </Button>
    //     );
    //   },
    // }
  ], [viewMode]); // Add viewMode to dependencies

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
    const fetchDetailedMeasurements = async (qtyValue = 1) => {
      try {
        setLoadingDetailedMeasurements(true);
    
        const inspectionId = selectedOrderId;
        if (!inspectionId) {
          throw new Error('No order ID selected');
        }
    
        console.log(`Fetching stage inspection for order ID: ${inspectionId}, operation: ${selectedOperation}, qty: ${qtyValue}`);
    
        // Call fetchStageInspectionByOperation — it throws detailed backend errors
        const response = await qualityStore.fetchStageInspectionByOperation(inspectionId, selectedOperation, qtyValue);
        console.log('Stage inspection data received:', response);
    
        // Optional: FTP status check
        const ipid = `IPID-${inspectionData?.[0]?.part_number}-${selectedOperation}`;
        if (ipid) {
          console.log('Checking FTP status for orderId:', inspectionId, 'ipid:', ipid);
          try {
            const ftpStatus = await qualityStore.checkFTPApprovalStatus(inspectionId, ipid);
            console.log('FTP Status received:', ftpStatus);
            setFtpApprovalStatus(ftpStatus);
          } catch (ftpError) {
            console.error('Error checking FTP status:', ftpError);
            setFtpApprovalStatus({ is_completed: false });
          }
        }
    
        // Transform backend data for display
        const transformedData = {
          order_id: inspectionId,
          production_order: inspectionData?.[0]?.production_order || '',
          part_number: inspectionData?.[0]?.part_number || '',
          inspection_data: [{
            operation_number: selectedOperation,
            inspections: response.map(item => ({
              id: item.id,
              zone: item.zone,
              dimension_type: item.dimension_type,
              nominal_value: item.nominal_value,
              uppertol: item.uppertol,
              lowertol: item.lowertol,
              measured_1: item.measured_1,
              measured_2: item.measured_2,
              measured_3: item.measured_3,
              measured_mean: item.measured_mean,
              measured_instrument: item.measured_instrument,
              operator: item.operator,
              is_done: ftpApprovalStatus?.is_completed === true ? true : item.measured_mean !== 0
            }))
          }]
        };
    
        setDetailedMeasurements(transformedData);
        if (!isDetailedMeasurementsVisible) {
          setIsDetailedMeasurementsVisible(true);
        }
    
      } catch (error) {
        console.error('Error fetching stage inspection data:', error);
        
        // Use error.message which now includes backend `detail` if available
        message.error(`Failed to load measurements: ${error.message}`);
      } finally {
        setLoadingDetailedMeasurements(false);
      }
    };
    // Handler for qty change
    // const handleQtyChange = async (value) => {
    //   setQty(value);
    //   setLoadingQty(true);
    //   try {
    //     const inspectionId = selectedOrderId;
    //     if (!inspectionId) return;
    //     const response = await qualityStore.fetchStageInspectionByOperation(inspectionId, selectedOperation, value);
    //     if (!response || response.length === 0) {
    //       Modal.info({
    //         title: 'No Data',
    //         content: `No measurements found for quantity ${value}.`,
    //         okText: 'OK',
    //       });
    //       setFilteredData([]);
    //       return;
    //     }
    //     // Prepare flat data for the table directly
    //     const flatData = response.map((item, idx) => ({
    //       ...item,
    //       operation_number: selectedOperation,
    //       key: `${selectedOperation}-${item.id || idx}`
    //     }));
    //     // Apply current filter
    //     let filtered = [];
    //     if (activeFilter === 'all') {
    //       filtered = flatData;
    //     } else if (activeFilter === 'out-of-tolerance') {
    //       filtered = flatData.filter(item => {
    //         const nominal = parseFloat(item.nominal_value) || 0;
    //         const upperTol = parseFloat(item.uppertol) || 0;
    //         const lowerTol = parseFloat(item.lowertol) || 0;
    //         const mean = parseFloat(item.measured_mean) || 0;
    //         return !(mean <= (nominal + upperTol) && mean >= (nominal + lowerTol));
    //       });
    //     } else if (activeFilter === 'within-tolerance') {
    //       filtered = flatData.filter(item => {
    //         const nominal = parseFloat(item.nominal_value) || 0;
    //         const upperTol = parseFloat(item.uppertol) || 0;
    //         const lowerTol = parseFloat(item.lowertol) || 0;
    //         const mean = parseFloat(item.measured_mean) || 0;
    //         return mean <= (nominal + upperTol) && mean >= (nominal + lowerTol);
    //       });
    //     }
    //     setFilteredData(filtered);
    //   } finally {
    //     setLoadingQty(false);
    //   }
    // };
    
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
          console.log('Record FTP Status:', record.ftp_status);
          
          // Check FTP status
          if (record.ftp_status?.is_completed) {
            return (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Approved
              </Tag>
            );
          }
          
          // If FTP is not completed or status is pending
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Not Yet Approved
            </Tag>
          );
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
      },
      // {
      //   title: 'Qty',
      //   dataIndex: 'quantity_no',
      //   key: 'quantity_no',
      //   width: '8%',
      //   render: (value) => <Tag color="orange">{value}</Tag>
      // }
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
      const [qty, setQty] = useState(1);
      const [loadingQty, setLoadingQty] = useState(false);
      const [activeFilter, setActiveFilter] = useState('all');
      const [filteredData, setFilteredData] = useState([]);

      // Reset qty and filter when modal opens (only on first open)
      useEffect(() => {
        if (isDetailedMeasurementsVisible) {
          setQty(1);
          setActiveFilter('all');
          setFilteredData([]);
        }
      }, [isDetailedMeasurementsVisible]);

      // Prepare flat data for filtering, always using the current qty
      const prepareInspectionData = () => {
        if (!detailedMeasurements || !detailedMeasurements.inspection_data) return [];
        const flatData = [];
        detailedMeasurements.inspection_data.forEach(operationData => {
          if (operationData.inspections && operationData.inspections.length > 0) {
            operationData.inspections.forEach(inspection => {
              flatData.push({
                ...inspection,
                operation_number: operationData.operation_number,
                key: `${operationData.operation_number}-${inspection.id}`
              });
            });
          }
        });
        return flatData;
      };

      // Handle filter changes
      const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        let allData = prepareInspectionData();
        let filtered = [];
        if (filter === 'all') {
          filtered = allData;
        } else if (filter === 'out-of-tolerance') {
          filtered = allData.filter(item => {
            const nominal = parseFloat(item.nominal_value) || 0;
            const upperTol = parseFloat(item.uppertol) || 0;
            const lowerTol = parseFloat(item.lowertol) || 0;
            const mean = parseFloat(item.measured_mean) || 0;
            return !(mean <= (nominal + upperTol) && mean >= (nominal + lowerTol));
          });
        } else if (filter === 'within-tolerance') {
          filtered = allData.filter(item => {
            const nominal = parseFloat(item.nominal_value) || 0;
            const upperTol = parseFloat(item.uppertol) || 0;
            const lowerTol = parseFloat(item.lowertol) || 0;
            const mean = parseFloat(item.measured_mean) || 0;
            return mean <= (nominal + upperTol) && mean >= (nominal + lowerTol);
          });
        }
        setFilteredData(filtered);
      };

      // Handle Qty change
      const handleQtyChange = async (value) => {
        setQty(value);
        setLoadingQty(true);
        try {
          const inspectionId = selectedOrderId;
          if (!inspectionId) return;
      
          const response = await qualityStore.fetchStageInspectionByOperation(
            inspectionId, selectedOperation, value
          );
      
          if (!response || response.length === 0) {
            setFilteredData([]); // Clear table data
            Modal.info({
              title: (
                <Space>
                  <PlusCircleOutlined className="text-blue-500" />
                  <span>No Measurements Found</span>
                </Space>
              ),
              content: (
                <div className="p-4">
                  <Alert
                    message="No Measurement Data Available"
                    description={
                      <div>
                        <p>No measurement data is available for Operation {selectedOperation} and Quantity {value}.</p>
                        <p>Would you like to open the QMS software to create new measurements?</p>
                        <div className="mt-4">
                          <Text strong>Details:</Text>
                          <ul className="mt-2">
                            <li>Operation Number: {selectedOperation}</li>
                            <li>Quantity: {value}</li>
                            <li>Part Number: {inspectionData?.[0]?.part_number || 'N/A'}</li>
                            <li>Production Order: {inspectionData?.[0]?.production_order || 'N/A'}</li>
                          </ul>
                        </div>
                      </div>
                    }
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                  <div className="text-center mt-4">
                    <Button 
                      type="primary"
                      onClick={() => {
                        Modal.destroyAll();
                        handleLaunchQMS();
                      }}
                      loading={isLaunching}
                      icon={<LinkOutlined />}
                      size="large"
                    >
                      Open QMS Software
                    </Button>
                  </div>
                </div>
              ),
              okText: 'Close',
              width: 500,
              onOk: () => {
                Modal.destroyAll();
              }
            });
            return;
          }
      
          const flatData = response.map((item, idx) => ({
            ...item,
            operation_number: selectedOperation,
            key: `${selectedOperation}-${item.id || idx}`
          }));
      
          let filtered = [];
          if (activeFilter === 'all') {
            filtered = flatData;
          } else if (activeFilter === 'out-of-tolerance') {
            filtered = flatData.filter(item => {
              const nominal = parseFloat(item.nominal_value) || 0;
              const upperTol = parseFloat(item.uppertol) || 0;
              const lowerTol = parseFloat(item.lowertol) || 0;
              const mean = parseFloat(item.measured_mean) || 0;
              return !(mean <= (nominal + upperTol) && mean >= (nominal + lowerTol));
            });
          } else if (activeFilter === 'within-tolerance') {
            filtered = flatData.filter(item => {
              const nominal = parseFloat(item.nominal_value) || 0;
              const upperTol = parseFloat(item.uppertol) || 0;
              const lowerTol = parseFloat(item.lowertol) || 0;
              const mean = parseFloat(item.measured_mean) || 0;
              return mean <= (nominal + upperTol) && mean >= (nominal + lowerTol);
            });
          }
      
          setFilteredData(filtered);
      
        } catch (error) {
          setFilteredData([]);
          console.error('Error loading inspection data:', error);
          message.error(error.message || 'Failed to load inspection data.');
        } finally {
          setLoadingQty(false);
        }
      };

      // Update filtered data when measured data or filter changes
      useEffect(() => {
        handleFilterChange(activeFilter);
        // eslint-disable-next-line
      }, [detailedMeasurements]);

      const allData = prepareInspectionData();

      return (
        <Modal
          key="detailed-measurements-modal"
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
          onCancel={handleCloseModal}
          width={1800}
          style={{ top: 20 }}
          bodyStyle={{ padding: '24px', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
          footer={[
            <Button 
              key="close" 
              onClick={handleCloseModal}
              className="hover:scale-105 transition-transform"
              icon={<CloseOutlined />}
            >
              Close
            </Button>
          ]}
        >
          <div className="p-4">
            {/* Filter and Qty controls in a flex row */}
            <div className="mb-4 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-2 items-center">
                <Text strong>Quick Filters:</Text>
                <Button 
                  size="small" 
                  type={activeFilter === 'all' ? "primary" : "default"}
                  ghost={activeFilter !== 'all'}
                  className={`filter-btn ${activeFilter === 'all' ? 'active-filter' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All ({allData.length})
                </Button>
                <Button 
                  size="small"
                  type={activeFilter === 'out-of-tolerance' ? "danger" : "default"}
                  danger={activeFilter === 'out-of-tolerance'}
                  ghost={activeFilter === 'out-of-tolerance'}
                  className={`filter-btn ${activeFilter === 'out-of-tolerance' ? 'active-filter' : ''}`}
                  onClick={() => handleFilterChange('out-of-tolerance')}
                >
                  Out of Tolerance ({allData.filter(item => {
                    const nominal = parseFloat(item.nominal_value) || 0;
                    const upperTol = parseFloat(item.uppertol) || 0;
                    const lowerTol = parseFloat(item.lowertol) || 0;
                    const mean = parseFloat(item.measured_mean) || 0;
                    return !(mean <= (nominal + upperTol) && mean >= (nominal + lowerTol));
                  }).length})
                </Button>
                <Button 
                  size="small"
                  className={`filter-btn ${activeFilter === 'within-tolerance' 
                    ? 'bg-green-100 border-green-300 text-green-700' 
                    : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'}`}
                  onClick={() => handleFilterChange('within-tolerance')}
                >
                  Within Tolerance ({allData.filter(item => {
                    const nominal = parseFloat(item.nominal_value) || 0;
                    const upperTol = parseFloat(item.uppertol) || 0;
                    const lowerTol = parseFloat(item.lowertol) || 0;
                    const mean = parseFloat(item.measured_mean) || 0;
                    return mean <= (nominal + upperTol) && mean >= (nominal + lowerTol);
                  }).length})
                </Button>
                {/* Qty input */}
                <span style={{ marginLeft: 16, fontWeight: 500 }}>Qty:</span>
                <InputNumber
                  min={1}
                  max={1000}
                  value={qty}
                  onChange={handleQtyChange}
                  style={{ width: 80 }}
                  placeholder="Qty"
                  loading={loadingQty}
                />
              </div>
              {/* Filter count summary */}
              <Text type="secondary">
                Showing {filteredData.length} of {allData.length} measurements
              </Text>
            </div>
            {loadingQty ? (
              <div className="flex justify-center items-center p-12">
                <Spin size="large" tip="Loading measurement data..." />
              </div>
            ) : filteredData && filteredData.length > 0 ? (
              <div>
                <Alert
                  message={
                    <div className="flex items-center gap-2">
                      <Text strong>Operation Status:</Text>
                      {ftpApprovalStatus?.is_completed === true ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Approved
                        </Tag>
                      ) : (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                          Not Yet Approved
                        </Tag>
                      )}
                      {ftpApprovalStatus?.updated_at && (
                        <Text type="secondary" className="ml-4">
                          Last Updated: {ftpApprovalStatus.updated_at ? moment(ftpApprovalStatus.updated_at).format('DD-MM-YYYY') : ''}
                        </Text>
                      )}
                    </div>
                  }
                  type={ftpApprovalStatus?.is_completed === true ? "success" : "warning"}
                  showIcon
                  className="mb-4"
                />
                <Table
                  columns={detailedMeasurementColumns}
                  dataSource={filteredData.map(item => ({
                    ...item,
                    key: item.id || `${item.zone}-${item.dimension_type}`
                  }))}
                  bordered
                  size="middle"
                  scroll={{ x: 'max-content', y: 600 }}
                  pagination={{ 
                    pageSize: 10, 
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                  }}
                  className="detailed-measurements-table"
                  style={{ 
                    width: '100%',
                    overflowX: 'auto'
                  }}
                />
              </div>
            ) : (
              <div className="text-center">
                <Empty 
                  description={
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">
                        No measurements found for Operation {selectedOperation} and Quantity {qty}
                      </p>
                      {!ftpApprovalStatus?.is_completed && (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                          Not Yet Approved
                        </Tag>
                      )}
                    </div>
                  }
                  className="my-8"
                />
                <div className="mt-6">
                  {/* <Alert
                    message="No Measurement Data Available"
                    description={
                      <div>
                        <p>No measurement data is available for Operation {selectedOperation} and Quantity {qty}.</p>
                        <p>Would you like to open the QMS software to create new measurements?</p>
                        <div className="mt-4">
                          <Text strong>Details:</Text>
                          <ul className="mt-2 text-left">
                            <li>Operation Number: {selectedOperation}</li>
                            <li>Quantity: {qty}</li>
                            <li>Part Number: {detailedMeasurements?.part_number || 'N/A'}</li>
                            <li>Production Order: {detailedMeasurements?.production_order || 'N/A'}</li>
                          </ul>
                        </div>
                      </div>
                    }
                    type="info"
                    showIcon
                    className="mb-4"
                  /> */}
                  <div className="text-center mt-4">
                  
                  </div>

                  <Button 
                      type="primary"
                      onClick={handleLaunchQMS}
                      loading={isLaunching}
                      icon={<LinkOutlined />}
                      size="large"
                    >
                      Open QMS Software
                    </Button>

                </div>
              </div>
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
                        onClick={() => fetchDetailedMeasurements(1)}
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
            <div className="text-center">
              <Empty 
                description="No measurement data available for this operation"
                className="my-8" 
              />
              <div className="mt-6">
                <Alert
                  message="No Measurement Data Available"
                  description={
                    <div>
                      <p>No measurement data is available for Operation {selectedOperation}.</p>
                      <p>Would you like to open the QMS software to create new measurements?</p>
                      <div className="mt-4">
                        <Text strong>Details:</Text>
                        <ul className="mt-2 text-left">
                          <li>Operation Number: {selectedOperation}</li>
                          <li>Part Number: {inspectionData?.[0]?.part_number || 'N/A'}</li>
                          <li>Production Order: {inspectionData?.[0]?.production_order || 'N/A'}</li>
                        </ul>
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />
                <div className="text-center mt-4">
                  <Button 
                    type="primary"
                    onClick={handleLaunchQMS}
                    loading={isLaunching}
                    icon={<LinkOutlined />}
                    size="large"
                  >
                    Open QMS Software
                  </Button>
                </div>
              </div>
            </div>
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

  // Update the handleViewModeChange function
  const handleViewModeChange = (checked) => {
    setViewMode(checked ? 'current' : 'all');
    if (checked) {
      try {
        const currentJobStr = localStorage.getItem('currentJobData');
        const activeOpStr = localStorage.getItem('activeOperation');
        
        if (currentJobStr && activeOpStr) {
          const currentJob = JSON.parse(currentJobStr);
          const activeOp = JSON.parse(activeOpStr);
          
          const formattedData = {
            key: currentJob.order_id || activeOp.operation_id,
            order_id: currentJob.order_id || activeOp.operation_id,
            production_order: currentJob.production_order || '',
            part_number: currentJob.part_number || '',
            operations: currentJob.operations?.map(op => op.operation_number.toString()) || [activeOp.operation_number.toString()],
            active_operation: activeOp,
            inspection_data: currentJob.operations?.map(op => ({
              operation_number: op.operation_number.toString(),
              inspections: []
            })) || [{
              operation_number: activeOp.operation_number.toString(),
              inspections: []
            }]
          };
          
          setCurrentOperationData(formattedData);
        } else {
          console.log('No current job or active operation found when switching view');
          message.info('No current job data found');
        }
      } catch (error) {
        console.error('Error loading current job data:', error);
        message.error('Failed to load current job data');
      }
    }
  };

  // Update the formatCurrentOperationData function
  const formatCurrentOperationData = useMemo(() => {
    if (!currentOperationData) return null;
    
    return [{
      ...currentOperationData,
      operations: [currentOperationData.active_operation], // Only include active operation
      key: currentOperationData.order_id
    }];
  }, [currentOperationData]);

  // Define the current operation columns correctly
  const currentOperationColumns = useMemo(() => [
    {
      title: 'Operation ID',
      dataIndex: 'operation_id',
      key: 'operation_id',
      width: '8%'
    },
    {
      title: 'Operation Number',
      dataIndex: 'operation_number',
      key: 'operation_number',
      width: '8%'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '15%'
    },
    {
      title: 'Work Center',
      dataIndex: 'work_center',
      key: 'work_center',
      width: '8%',
      render: (text) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: 'Quantities',
      children: [
        {
          title: 'Required',
          dataIndex: 'required_quantity',
          key: 'required_quantity',
          width: '8%'
        },
        {
          title: 'Completed',
          dataIndex: 'completed_quantity',
          key: 'completed_quantity',
          width: '8%'
        },
        {
          title: 'Rejected',
          dataIndex: 'rejected_quantity',
          key: 'rejected_quantity',
          width: '8%'
        },
        {
          title: 'Remaining',
          dataIndex: 'remaining_quantity',
          key: 'remaining_quantity',
          width: '8%'
        }
      ]
    },
    {
      title: 'Times (Hours)',
      children: [
        {
          title: 'Cycle Time',
          dataIndex: 'ideal_cycle_time',
          key: 'ideal_cycle_time',
          width: '8%',
          render: (time) => time?.toFixed(2) || '-'
        },
        {
          title: 'Setup Time',
          dataIndex: 'setup_time',
          key: 'setup_time',
          width: '8%',
          render: (time) => time?.toFixed(2) || '-'
        },
        {
          title: 'Operation Time',
          dataIndex: 'operation_time',
          key: 'operation_time',
          width: '8%',
          render: (time) => time?.toFixed(2) || '-'
        }
      ]
    },
    {
      title: 'Status',
      key: 'status',
      width: '13%',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_complete ? 'success' : 'processing'}>
            {record.is_complete ? 'Completed' : 'In Progress'}
          </Tag>
          {record.can_log && (
            <Tag color="green">Can Log</Tag>
          )}
          {record.work_center_schedulable && (
            <Tag color="blue">Schedulable</Tag>
          )}
        </Space>
      )
    }
  ], []); // Empty dependency array since columns don't depend on any props or state

  // Add this before the return statement
  const currentOperationRow = useMemo(() => {
    if (!currentOperationData) return null;
    return {
      ...currentOperationData,
      key: currentOperationData.operation_id
    };
  }, [currentOperationData]);

  // When closing the modal, reset qty to 1 and filter to 'all'
  const handleCloseModal = () => {
    setIsDetailedMeasurementsVisible(false);
    setQty(1);
    setActiveFilter('all');
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
                  <span className="text-lg font-semibold">Current Operation</span>
                  {loading && <Spin size="small" />}
                </Space>
                {/* <Switch
                  checkedChildren="Current Operation"
                  unCheckedChildren="All Operations"
                  onChange={handleViewModeChange}
                  defaultChecked
                  className="custom-switch"
                /> */}
              </div>
            }
            className="shadow-sm border-0 rounded-lg"
          >
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Spin size="large" />
              </div>
            ) : viewMode === 'current' ? (
              currentOperationData ? (
                <div style={{ maxWidth: '95%', margin: '0 auto' }}>
                  {/* <Alert
                    message={
                      <Space direction="vertical" size="small" className="w-full">
                        <Space>
                          <Text strong>Current Job:</Text>
                          <Text>Production Order: {currentOperationData.production_order}</Text>
                          <Divider type="vertical" />
                          <Text>Part Number: {currentOperationData.part_number}</Text>
                        </Space>
                        <Space>
                          <Text strong>Active Operation:</Text>
                          <Tag color="blue">OP {currentOperationData.active_operation.operation_number}</Tag>
                          <Text>{currentOperationData.active_operation.description}</Text>
                        </Space>
                        <Space>
                          <Text strong>Work Center:</Text>
                          <Tag color="cyan">{currentOperationData.active_operation.work_center}</Tag>
                          <Divider type="vertical" />
                          <Text strong>Status:</Text>
                          <Tag color={currentOperationData.active_operation.is_complete ? 'success' : 'processing'}>
                            {currentOperationData.active_operation.is_complete ? 'Completed' : 'In Progress'}
                          </Tag>
                        </Space>
                        <Space>
                          <Statistic 
                            title="Required Qty" 
                            value={currentOperationData.active_operation.required_quantity} 
                            valueStyle={{ fontSize: '14px' }}
                          />
                          <Divider type="vertical" />
                          <Statistic 
                            title="Completed Qty" 
                            value={currentOperationData.active_operation.completed_quantity} 
                            valueStyle={{ fontSize: '14px' }}
                          />
                          <Divider type="vertical" />
                          <Statistic 
                            title="Remaining Qty" 
                            value={currentOperationData.active_operation.remaining_quantity} 
                            valueStyle={{ fontSize: '14px' }}
                          />
                        </Space>
                      </Space>
                    }
                    type="info"
                    showIcon
                    className="mb-4"
                  /> */}
                  <Table
                    columns={columns}
                    dataSource={[currentOperationData]}
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
                      <p>No active operation data available</p>
                      <p className="text-sm">Please make sure an operation is selected</p>
                    </div>
                  }
                  className="my-12"
                />
              )
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

  .ant-statistic {
    margin-right: 24px;
  }

  .ant-statistic-title {
    font-size: 12px;
    color: #6b7280;
  }

  .ant-statistic-content {
    font-size: 14px !important;
  }

  .ant-alert-info {
    background-color: #f0f7ff;
    border: 1px solid #e0e7ff;
  }

  .ant-alert-message {
    margin-bottom: 0;
  }
`;

export default InspectionResult;