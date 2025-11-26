import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Spin,
  Typography,
  Tag,
  Button,
  Select,
  Modal,
  Row,
  Col,
  Divider,
  Alert,
  message,
  Badge,
  Tabs,
  Empty,
  Switch,
  Progress,
  InputNumber
} from 'antd';
import { 
  EyeOutlined, 
  FileSearchOutlined, 
  FileTextOutlined, 
  FilePdfOutlined, 
  AppstoreOutlined, 
  LoadingOutlined, 
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import moment from 'moment';
import InspectionReport from './InspectionReport';
import { qualityStore } from '../../../store/quality-store';

const { Text, Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const QualityInspectionDetails = ({ 
  selectedPart, 
  inspectionDetails, 
  loading,
  openQMSSoftware,
  orderId
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [isQmsModalVisible, setIsQmsModalVisible] = useState(false);
  const [operationMeasurements, setOperationMeasurements] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [drawingData, setDrawingData] = useState(null);
  const [loadingDrawing, setLoadingDrawing] = useState(false);
  const [measuredData, setMeasuredData] = useState(null);
  const [isMeasuredDataModalVisible, setIsMeasuredDataModalVisible] = useState(false);
  const [approvingIds, setApprovingIds] = useState({});
  const [approvedStatus, setApprovedStatus] = useState({});
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [isFinalInspectionModalVisible, setIsFinalInspectionModalVisible] = useState(false);
  const [allApproved, setAllApproved] = useState(false);
  const [isFinalApprovingAll, setIsFinalApprovingAll] = useState(false);
  const [isFinalAllApproved, setIsFinalAllApproved] = useState(false);
  const [finalInspectionApproved, setFinalInspectionApproved] = useState(false);
  const [ftpApprovalStatus, setFtpApprovalStatus] = useState(null);
  const [finalInspectionDrawing, setFinalInspectionDrawing] = useState(null);
  const [loadingFinalDrawing, setLoadingFinalDrawing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [qtyFilter, setQtyFilter] = useState(1);
  const [loadingQty, setLoadingQty] = useState(false);
  const [quantityData, setQuantityData] = useState({
    operations: {},
    required_qty: 0,
    completed_qty: 0,
    rejected_qty: 0,
    accepted_qty: 0
  });

  // Fetch quantity data when component mounts or orderId changes
  useEffect(() => {
    const fetchQuantityData = async () => {
      if (!inspectionDetails?.order_id) return;
      
      try {
        setLoadingQty(true);
        const data = await qualityStore.getProductionOrderOperationsStatus(inspectionDetails?.production_order);
        console.log("Operations data:", data);
        
        // Create operations map with operation number as key
        const operationsMap = {};
        let totalCompleted = 0;
        let totalRejected = 0;
        
        if (data.operations && Array.isArray(data.operations)) {
          data.operations.forEach(op => {
            operationsMap[op.operation_number] = {
              completed_qty: op.completed_quantity || 0,
              rejected_qty: op.rejected_quantity || 0,
              required_qty: op.required_quantity || 0,
              remaining_qty: op.remaining_quantity || 0,
              is_complete: op.is_complete || false,
              description: op.description || ''
            };
            
            totalCompleted += op.completed_quantity || 0;
            totalRejected += op.rejected_quantity || 0;
          });
        }
        
        setQuantityData({
          operations: operationsMap,
          required_qty: data.required_quantity || 0,
          completed_qty: totalCompleted,
          rejected_qty: totalRejected,
          accepted_qty: totalCompleted - totalRejected
        });
      } catch (error) {
        console.error('Error fetching quantity data:', error);
        message.error('Failed to load quantity data');
      } finally {
        setLoadingQty(false);
      }
    };

    fetchQuantityData();
  }, [inspectionDetails?.order_id]);

  const hasIpid = inspectionDetails?.operation_groups?.length > 0;
  let ipid1 = inspectionDetails?.operation_groups?.[0]?.ipid;

  // Get IPID number from operation groups
  const getIpidNumber = () => {
    if (!hasIpid) return null;
    // Get the first operation group's IPID
    return inspectionDetails.operation_groups[0]?.ipid;
  };

  // Function to handle drawing download and display
  const handleDrawingDownload = async (productionOrder, operationNo) => {
    try {
      setLoadingDrawing(true);
      setDownloadProgress(0);
      setRetryCount(0);
      setIsRetrying(false);
      
      // Add a loading message
      message.loading({ 
        content: 'Loading drawing...', 
        key: 'drawingLoading',
        duration: 0 // Keep the message until we explicitly destroy it
      });
      
      const data = await qualityStore.fetchBalloonedDrawing(inspectionDetails.part_number, operationNo);
      setDrawingData(data);
      
      // Show success message
      message.success({ content: 'Drawing loaded successfully', key: 'drawingLoading' });
    } catch (error) {
      if (error.message.includes('timed out')) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        message.loading({ 
          content: `Retrying download (attempt ${retryCount + 1} of 3)...`, 
          key: 'drawingLoading',
          duration: 0
        });
      } else {
        message.error({ content: error.message || 'Failed to load drawing', key: 'drawingLoading' });
      }
      console.error('Error loading drawing:', error);
    } finally {
      setLoadingDrawing(false);
    }
  };

  // Update handleOperationClick to include drawing download
  const handleOperationClick = async (op) => {
    setSelectedOperation(op);
    
    const operationData = inspectionDetails?.operation_groups?.filter(
      group => group.op_no === op && group.details
    );

    if (operationData && operationData.length > 0) {
      setOperationMeasurements(operationData);
      setIsModalVisible(true);
      
      // Fetch and show drawing with loading state
      try {
        setLoadingDrawing(true);
        setDownloadProgress(0);
        setRetryCount(0);
        setIsRetrying(false);
        
        message.loading({ 
          content: 'Loading drawing...', 
          key: 'drawingLoading',
          duration: 0
        });
        
        const data = await qualityStore.fetchBalloonedDrawing(
          inspectionDetails.part_number, 
          op
        );
        
        if (data && data.url) {
          setDrawingData(data);
          message.success({ content: 'Drawing loaded successfully', key: 'drawingLoading' });
        } else {
          throw new Error('Invalid drawing data received');
        }
      } catch (error) {
        console.error('Error loading drawing:', error);
        
        if (error.message.includes('timed out')) {
          setIsRetrying(true);
          setRetryCount(prev => prev + 1);
          
          if (retryCount < 3) {
            message.loading({ 
              content: `Retrying download (attempt ${retryCount + 1} of 3)...`, 
              key: 'drawingLoading',
              duration: 0
            });
          } else {
            message.error({ 
              content: 'Failed to load drawing after multiple attempts. Please try again later.', 
              key: 'drawingLoading',
              duration: 5
            });
          }
        } else {
          message.error({ 
            content: error.message || 'Failed to load drawing', 
            key: 'drawingLoading',
            duration: 5
          });
        }
      } finally {
        setLoadingDrawing(false);
      }
    } else {
      setIsQmsModalVisible(true);
    }
  };

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

  // Check if we have data
  const hasData = inspectionDetails && inspectionDetails.order_id;

  // Create summary data from the response - one row per operation
  const summaryData = hasData ? [
    // First create rows for each operation
    ...(inspectionDetails.operations || []).map((op, index) => ({
      key: `op-${op}-${index}`,
      order_id: inspectionDetails.order_id,
      production_order: inspectionDetails.production_order,
      part_number: inspectionDetails.part_number,
      operations: [op],
      isFinalInspection: false
    })),
    // Then add the final inspection row
    {
      key: 'final-inspection',
      order_id: inspectionDetails.order_id,
      production_order: inspectionDetails.production_order,
      part_number: inspectionDetails.part_number,
      operations: ['Final Inspection'],
      isFinalInspection: true
    }
  ] : [];
  console.log("SUMMARY", summaryData);
  const summaryColumns = [
    {
      title: 'OP Number',
      key: 'operation_number',
      width: '8%',
      align: 'center',
      render: (_, record, index) => (
        <div className="text-center">
          {record.operations?.[0] === 'Final Inspection' ? 'FINAL' : `OP${record.operations?.[0] || ''}`}
        </div>
      )
    },
    {
      title: 'Operation Description',
      key: 'operation',
      width: '20%',
      render: (_, record) => {
        const opNumber = record.operations?.[0];
        if (opNumber === 'Final Inspection') {
          return <div className="font-normal">Final Inspection</div>;
        }
        
        const opData = quantityData.operations[opNumber];
        return (
          <div className="font-normal">
            {opData?.description || `Operation ${opNumber}`}
          </div>
        );
      }
    },
    {
      title: 'Inspection Plan',
      key: 'inspection_plan',
      width: '9%',
      align: 'center',
      render: (_, record) => {
        const op = record.operations?.[0];
        const isFinalInspection = op === 'Final Inspection';
        const hasOperationData = isFinalInspection 
          ? inspectionDetails?.operation_groups?.some(g => g.op_no === 999)
          : inspectionDetails?.operation_groups?.some(g => g.op_no === op && g.details);

        return (
          <div className="text-center">
            <Button 
              type={hasOperationData ? 'primary' : 'default'}
              size="small"
              onClick={() => isFinalInspection ? handleFinalInspectionClick() : handleOperationClick(op)}
              icon={hasOperationData ? <FileTextOutlined /> : <FileSearchOutlined />}
              className={`w-full h-8 flex items-center justify-center ${
                hasOperationData 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              {hasOperationData ? 'View Plan' : 'Create Plan'}
            </Button>
          </div>
        );
      }
    },
    {
      title: 'Measurements',
      key: 'measurements',
      width: '9%',
      align: 'center',
      render: (_, record) => {
        const op = record.operations?.[0];
        const isFinalInspection = op === 'Final Inspection';
        const hasOperationData = isFinalInspection 
          ? inspectionDetails?.operation_groups?.some(g => g.op_no === 999)
          : inspectionDetails?.operation_groups?.some(g => g.op_no === op && g.details);

        return (
          <div className="text-center">
            <Button 
              type={hasOperationData ? 'primary' : 'default'}
              size="small"
              onClick={async () => {
                if (isFinalInspection) {
                  await setSelectedOperation(999);
                  handleViewFinalMeasurements();
                } else {
                  await setSelectedOperation(op);
                  handleViewMeasuredData();
                }
              }}
              icon={<EyeOutlined />}
              disabled={!hasOperationData}
              className="w-full h-8 flex items-center justify-center"
            >
              View Data
            </Button>
          </div>
        );
      }
    },
    {
      title: 'Required Qty',
      key: 'required_qty',
      width: '10%',
      align: 'center',
      render: (_, record) => {
        const opNumber = record.operations?.[0];
        const opData = opNumber !== 'Final Inspection' ? quantityData.operations[opNumber] : null;
        return (
          <div className="text-center font-medium">
            {loadingQty ? (
              <Spin size="small" />
            ) : opData ? (
              opData.required_qty || '0'
            ) : (
              record.isFinalInspection ? quantityData.required_qty || '0' : 'N/A'
            )}
          </div>
        );
      },
    },
    {
      title: 'Completed Qty',
      key: 'completed_qty',
      width: '10%',
      align: 'center',
      render: (_, record) => {
        const opNumber = record.operations?.[0];
        const opData = opNumber !== 'Final Inspection' ? quantityData.operations[opNumber] : null;
        return (
          <div className="text-center font-medium">
            {loadingQty ? <Spin size="small" /> : opData?.completed_qty || '0'}
          </div>
        );
      },
    },
    {
      title: 'Accepted Qty',
      key: 'accepted_qty',
      width: '10%',
      align: 'center',
      render: (_, record) => {
        const opNumber = record.operations?.[0];
        const opData = opNumber !== 'Final Inspection' ? quantityData.operations[opNumber] : null;
        const acceptedQty = opData ? (opData.completed_qty || 0) - (opData.rejected_qty || 0) : 0;
        return (
          <div className="text-center font-medium text-green-600">
            {loadingQty ? <Spin size="small" /> : acceptedQty}
          </div>
        );
      },
    },
    {
      title: 'Rejected Qty',
      key: 'rejected_qty',
      width: '10%',
      align: 'center',
      render: (_, record) => {
        const opNumber = record.operations?.[0];
        const opData = opNumber !== 'Final Inspection' ? quantityData.operations[opNumber] : null;
        return (
          <div className="text-center font-medium text-red-600">
            {loadingQty ? <Spin size="small" /> : opData?.rejected_qty || '0'}
          </div>
        );
      },
    },
    {
      title: 'Yield %',
      key: 'yield_percentage',
      width: '15%',
      align: 'center',
      render: (_, record) => {
        const opNumber = record.operations?.[0];
        let yieldPercentage = 0;
        let completedQty = 0;
        let rejectedQty = 0;
        
        if (opNumber === 'Final Inspection') {
          // For Final Inspection, show overall yield
          completedQty = quantityData.completed_qty || 0;
          rejectedQty = quantityData.rejected_qty || 0;
          const accepted = quantityData.accepted_qty || 0;
          yieldPercentage = completedQty > 0 ? Number(((accepted / completedQty) * 100).toFixed(2)) : 0;
        } else {
          // For individual operations, show operation-specific yield
          const opData = quantityData.operations[opNumber];
          if (opData) {
            completedQty = opData.completed_qty || 0;
            rejectedQty = opData.rejected_qty || 0;
            const accepted = completedQty - rejectedQty;
            yieldPercentage = completedQty > 0 ? Number(((accepted / completedQty) * 100).toFixed(2)) : 0;
          }
        }
        
        // Determine color based on yield percentage
        const getColor = (percentage) => {
          if (percentage >= 95) return '#10B981'; // Green
          if (percentage >= 90) return '#F59E0B'; // Yellow
          return percentage > 0 ? '#EF4444' : '#D1D5DB'; // Red for low yield, Gray for no data
        };
        
        const color = getColor(yieldPercentage);
        const isDataAvailable = completedQty > 0;
        
        return (
          <div className="flex flex-col items-center px-2">
            <div className="w-full flex items-center gap-2 mb-1">
              <div className="text-sm font-medium text-gray-700">{yieldPercentage} %</div>
              {isDataAvailable && (
                <div className="text-xs text-gray-500">
                  ({completedQty - rejectedQty}/{completedQty})
                </div>
              )}
            </div>
            {isDataAvailable ? (
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${yieldPercentage}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 5px ${color}80`
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className="w-full h-full bg-gray-200 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        );
      }
    }
  ];

  const items = [
    {
      key: 'details',
      label: (
        <span className="px-2">
          <FileTextOutlined /> Inspection Details
        </span>
      ),
      children: (
        <Card 
          className="bg-white transition-all duration-300 hover:shadow-md"
          
        >
          <div className="w-[100%] mx-auto">
            <Table
              columns={summaryColumns}
              dataSource={summaryData}
              pagination={false}
              size="middle"
              loading={loading}
              className="w-full with-gridlines"
              bordered
            />
          </div>
        </Card>
      )
    },
    {
      key: 'report',
      label: (
        <span className="px-2">
          <FilePdfOutlined /> Inspection Report
        </span>
      ),
      children: <InspectionReport inspectionDetails={inspectionDetails} loading={loading} />
    }
  ];

  const getOperationDetails = () => {
    if (!selectedOperation) return null;
    
    // If no operation_groups, return basic structure
    if (!inspectionDetails?.operation_groups?.length) {
      return {
        ipid: 'No IPID',
        operation_number: selectedOperation,
        details: []
      };
    }
    
    const operationData = inspectionDetails.operation_groups.filter(
      group => group.op_no === selectedOperation
    );
  
    const details = operationData.map((item, index) => ({
      key: index,
      id: item.details?.id || 0, // Keep the original ID for reference
      zone: item.details?.zone || '',
      dimension_type: item.details?.dimension_type || '',
      nominal: item.details?.nominal || '',
      uppertol: item.details?.uppertol || '',
      lowertol: item.details?.lowertol || '',
      measured_instrument: item.details?.measured_instrument || ''
    }));
  
    // Sort details by id in ascending order
    details.sort((a, b) => {
      const idA = typeof a.id === 'number' ? a.id : parseInt(a.id) || 0;
      const idB = typeof b.id === 'number' ? b.id : parseInt(b.id) || 0;
      return idA - idB;
    });
  
    // After sorting, update the key to reflect the new order
    details.forEach((item, index) => {
      item.key = index;
    });
  
    return {
      ipid: operationData[0]?.ipid || 'No IPID',
      operation_number: selectedOperation,
      details: details
    };
  };
  const renderOperationDetails = () => {
    const data = getOperationDetails();
    if (!data) return null;
  
    const columns = [
      {
        title: 'S.No',
        key: 'sno',
        width: 60,
        render: (_, record, index) => index + 1, // Display sequential serial number
      },
      {
        title: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        width: 100,
      },
      {
        title: 'Description',
        dataIndex: 'dimension_type',
        key: 'dimension_type',
        width: 150,
      },
      {
        title: 'Nominal',
        dataIndex: 'nominal',
        key: 'nominal',
        width: 100,
      },
      {
        title: 'Upper Tol',
        dataIndex: 'uppertol',
        key: 'uppertol',
        width: 100,
      },
      {
        title: 'Lower Tol',
        dataIndex: 'lowertol',
        key: 'lowertol',
        width: 100,
      },
      {
        title: 'Instrument',
        dataIndex: 'measured_instrument',
        key: 'measured_instrument',
        width: 150,
      }
    ];
  
    return (
      <>
        <div className="mb-4">
          <Text strong>Operation: {data.operation_number}</Text>
          <br />
          <Text strong>IPID: {data.ipid}</Text>
        </div>
        <Table
          columns={columns}
          dataSource={data.details}
          pagination={false}
          scroll={{ x: 900, y: 400 }}
          size="small"
        />
      </>
    );
  };
  

  const renderModalHeader = () => {
    const data = getOperationDetails();
    if (!data) return null;

    return (
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <div className="flex-1">
          <Text strong className="mr-4">IPID No: {data.ipid}</Text>
          <Text strong className="mr-4">Part No: {inspectionDetails.part_number}</Text>
          <Text strong className="mr-4">Date: {moment().format('DD-MM-YYYY')}</Text>
          <Text strong className="mr-4">Time: {moment().format('HH:mm A')}</Text>
        </div>
        <div className="flex items-center">
         
        </div>
      </div>
    );
  };

  // Function to handle viewing measured data
  const handleViewMeasuredData = async () => {
    if (!inspectionDetails?.order_id || !selectedOperation) return;

    try {
      // Show loading indicator
      message.loading({ content: 'Loading measured data...', key: 'measuredDataLoading' });
      
      // Fetch inspection data using the new endpoint with quantity 1 by default
      const response = await qualityStore.fetchStageInspectionByOperation(
        inspectionDetails.order_id,
        selectedOperation,
        1 // Default to quantity 1
      );
      
      // Get the IPID for the selected operation
      const selectedOpGroup = inspectionDetails.operation_groups?.find(
        group => group.op_no === selectedOperation
      );
      const ipid = selectedOpGroup?.ipid;
      
      // Check FTP approval status
      if (inspectionDetails.order_id && ipid) {
        const ftpStatus = await qualityStore.checkFTPApprovalStatus(
          inspectionDetails.order_id,
          ipid
        );
        setFtpApprovalStatus(ftpStatus);
      }
      
      if (response && response.length > 0) {
        // Transform the data to match the expected format
        const transformedData = {
          inspection_data: [{
            operation_number: selectedOperation,
            inspections: response.map(item => ({
              ...item,
              is_done: item.is_done || false
            }))
          }]
        };
        
        setMeasuredData(transformedData);
        setIsMeasuredDataModalVisible(true);
        message.success({ content: 'Data loaded successfully', key: 'measuredDataLoading', duration: 1 });
      } else {
        message.warning({ content: 'No measurement data available for this operation', key: 'measuredDataLoading' });
      }
    } catch (error) {
      console.error('Error loading measured data:', error);
      message.info({ content: 'No measured data is available for this operation', key: 'measuredDataLoading' });
    }
  };

  // Function to prepare flat data from the nested structure
  const prepareInspectionData = () => {
    if (!measuredData || !measuredData.inspection_data) return [];
    
    // Flatten the nested structure for table display
    const flatData = [];
    
    measuredData.inspection_data.forEach(operationData => {
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
          
          flatData.push({
            ...inspection,
            operation_number: operationData.operation_number,
            key: `${operationData.operation_number}-${inspection.id}`,
            upperLimit,
            lowerLimit,
            isWithinTolerance
          });
        });
      }
    });
    
    return flatData;
  };

  // Function to render the measured data modal
  const renderMeasuredDataModal = () => {
    // Add state for active filter
    const [activeFilter, setActiveFilter] = useState('all');
    // Add state for filtered data
    const [filteredData, setFilteredData] = useState([]);
    // Add state for quantity filter
    const [qtyFilter, setQtyFilter] = useState(1);
    
    // Function to handle filter changes
    const handleFilterChange = (filter, qty = qtyFilter) => {
      setActiveFilter(filter);
      const allData = prepareInspectionData();
      let filtered = [];
      let qtyVal = qty;
      if (qtyVal === null || qtyVal === undefined || qtyVal === '') qtyVal = '';
      if (filter === 'all') {
        filtered = allData;
      } else if (filter === 'out-of-tolerance') {
        filtered = allData.filter(item => !item.isWithinTolerance);
      } else if (filter === 'within-tolerance') {
        filtered = allData.filter(item => item.isWithinTolerance);
      }
      // Apply qty filter if set
      if (qtyVal !== '' && !isNaN(qtyVal)) {
        filtered = filtered.filter(item => Number(item.quantity_no) === Number(qtyVal));
      }
      setFilteredData(filtered);
    };
    // Handle qty change
    // console.log("YEET11", !selectedOperation);
    const handleQtyChange = async (value) => {
      setQtyFilter(value);
      if (!isMeasuredDataModalVisible || !selectedOperation) return;
      setMeasuredData({ inspection_data: [] }); // Clear table immediately
      setLoadingQty(true);
      try {
        if (inspectionDetails?.order_id && selectedOperation) {
          const response = await qualityStore.fetchStageInspectionByOperation(
            inspectionDetails.order_id,
            selectedOperation,
            value
          );
          if (response && response.length > 0) {
            const transformedData = {
              inspection_data: [{
                operation_number: selectedOperation,
                inspections: response.map(item => ({
                  ...item,
                  is_done: item.is_done || false
                }))
              }]
            };
            setMeasuredData(transformedData);
          } else {
            // Always clear the table first
            setMeasuredData({ inspection_data: [] });
            // Destroy any previous messages and show a new one
            message.destroy('qtyNoData');
            message.info({
              content: `No measurements found for quantity ${value}.`,
              key: 'qtyNoData',
              duration: 2
            });
          }
        }
      } catch (error) {
        setMeasuredData({ inspection_data: [] });
        message.destroy('qtyNoData');
        message.info({
          content: `No measurements found for quantity ${value}.`,
          key: 'qtyNoData',
          duration: 2
        });
      } finally {
        setLoadingQty(false);
      }
    };
    // Initialize filtered data when measured data changes
    useEffect(() => {
      if (measuredData) {
        const data = prepareInspectionData();
        // Always filter for quantity 1 by default
        let filtered = data.filter(item => Number(item.quantity_no) === 1);
        // Only apply qtyFilter if it's explicitly set to something other than 1
        if (qtyFilter !== '' && !isNaN(qtyFilter) && qtyFilter !== 1) {
          filtered = data.filter(item => Number(item.quantity_no) === Number(qtyFilter));
        }
        setFilteredData(filtered);
      }
    }, [measuredData, qtyFilter]);

    // Set default quantity to 1 and fetch data when modal opens
    useEffect(() => {
      if (isMeasuredDataModalVisible && selectedOperation) {
        // Set quantity filter to 1 by default
        setQtyFilter(1);
        // Fetch data for quantity 1
        handleQtyChange(1);
      }
    }, [isMeasuredDataModalVisible, selectedOperation]);
    
    // Check if we're viewing final inspection measurements
    const isViewingFinalInspection = measuredData?.inspection_data?.some(
      data => data.operation_number === 999
    );
    
    return (
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileSearchOutlined className="text-blue-500" />
            <span>{isViewingFinalInspection ? 'Measured Final Inspection Data' : 'Measured Inspection Data'}</span>
          </div>
        }
        visible={isMeasuredDataModalVisible}
        onCancel={() => {
          setIsMeasuredDataModalVisible(false);
          // Clear the measured data when modal closes to ensure fresh start next time
          setMeasuredData(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsMeasuredDataModalVisible(false);
            // Clear the measured data when modal closes to ensure fresh start next time
            setMeasuredData(null);
          }}>
            Close
          </Button>
        ]}
        width={1600}
        className="measured-data-modal"
        style={{ zIndex: 1200 }}
        mask={true}
        maskClosable={false}
      >
        {/* Header section */}
        <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
          <Row gutter={16} align="middle">
            <Col span={24}>
              <Row gutter={[16, 8]}>
                {/* <Col span={8}>
                  <div className="flex flex-col">
                    <Text type="secondary" className="text-xs">Order ID</Text>
                    <Text strong className="text-base">{inspectionDetails?.order_id || '-'}</Text>
                  </div>
                </Col> */}
                <Col span={8}>
                  <div className="flex flex-col">
                    <Text type="secondary" className="text-xs">Production Order</Text>
                    <Text strong className="text-base">{inspectionDetails?.production_order || '-'}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="flex flex-col">
                    <Text type="secondary" className="text-xs">Part Number</Text>
                    <Text strong className="text-base">{inspectionDetails?.part_number || '-'}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="flex flex-col">
                    <Text type="secondary" className="text-xs">Operation</Text>
                    <Text strong className="text-base">OP {selectedOperation || '-'}</Text>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        {/* Show approval status alert for final inspection */}
        {isViewingFinalInspection && ftpApprovalStatus?.is_completed && (
          <Alert
            message="Final Inspection Approved"
            description={`This final inspection was approved on ${moment(ftpApprovalStatus.updated_at).format('DD-MM-YYYY HH:mm')}`}
            type="success"
            showIcon
            className="mb-4"
          />
        )}

        {/* Add approve button for all operations - only show for quantity 1 */}
        {qtyFilter === 1 && (
          <div className="mb-4 flex justify-end gap-2">
            <Button 
              type={ftpApprovalStatus?.is_completed === true ? "primary" : "default"}
              icon={<CheckCircleOutlined />}
              onClick={isViewingFinalInspection ? handleFinalApproveAll : handleApproveAll}
              loading={isViewingFinalInspection ? isFinalApprovingAll : isApprovingAll}
              size="large"
              className="approve-all-btn"
              style={ftpApprovalStatus?.is_completed === true ? { 
                backgroundColor: "#52c41a", 
                borderColor: "#52c41a", 
                color: "#fff",
                cursor: 'not-allowed',
                opacity: 0.8
              } : {}}
              disabled={ftpApprovalStatus?.is_completed === true}
            >
              {ftpApprovalStatus?.is_completed === true 
                ? "Already Approved" 
                : isViewingFinalInspection 
                  ? "Approve Final Inspection" 
                  : "Approve All Measurements"}
            </Button>

            {ftpApprovalStatus?.is_completed === false && (ftpApprovalStatus?.status === 'NA' || ftpApprovalStatus?.status === 'rejected') && (
              <Button
                type="primary" 
                danger
                icon={<CloseCircleOutlined />}
                size="large"
                className="reject-btn"
                onClick={RejectFTP}
              >
                Rejected 
              </Button>
            )}
          </div>
        )}

        {/* Filter and search controls with updated functionality */}
        <div className="mb-4 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2 items-center">
            <Text strong>Quick Filters:</Text>
            <Button 
              size="small" 
              type={activeFilter === 'all' ? "primary" : "default"}
              ghost={activeFilter !== 'all'}
              className={`filter-btn ${activeFilter === 'all' 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300'}`}
              onClick={() => handleFilterChange('all')}
            >
              All ({prepareInspectionData().length})
            </Button>
            <Button 
              size="small"
              type={activeFilter === 'out-of-tolerance' ? "danger" : "default"}
              danger={activeFilter === 'out-of-tolerance'}
              ghost={activeFilter === 'out-of-tolerance'}
              className={`filter-btn ${activeFilter === 'out-of-tolerance' ? 'active-filter' : ''}`}
              onClick={() => handleFilterChange('out-of-tolerance')}
            >
              Out of Tolerance ({prepareInspectionData().filter(item => !item.isWithinTolerance).length})
            </Button>
            <Button 
              size="small"
              className={`filter-btn ${activeFilter === 'within-tolerance' 
                ? 'bg-green-100 border-green-300 text-green-700' 
                : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'}`}
              onClick={() => handleFilterChange('within-tolerance')}
            >
              Within Tolerance ({prepareInspectionData().filter(item => item.isWithinTolerance).length})
            </Button>
            {/* Qty input */}
            <span style={{ marginLeft: 16, fontWeight: 500 }}>Qty:</span>
            <InputNumber
              min={1}
              max={1000}
              value={qtyFilter}
              onChange={handleQtyChange}
              style={{ width: 80 }}
              placeholder="Qty"
              loading={loadingQty}
              disabled={loadingQty}
            />
          </div>
          
          {/* Filter count summary */}
          <Text type="secondary">
            Showing {filteredData.length} of {prepareInspectionData().length} measurements
          </Text>
        </div>

        {loadingQty ? (
          <div className="flex justify-center items-center p-12">
            <Spin size="large" tip="Loading measurement data..." />
          </div>
        ) : (
          measuredData && measuredData.inspection_data && measuredData.inspection_data.length > 0 ? (            
            <Table
              rowClassName={(record) => {
                // Check if any measurement value is 'G' or 'NG'
                const hasG = ['measured_1', 'measured_2', 'measured_3'].some(
                  field => record[field]?.toString().toUpperCase() === 'G'
                );
                const hasNG = ['measured_1', 'measured_2', 'measured_3'].some(
                  field => record[field]?.toString().toUpperCase() === 'NG'
                );
                
                if (hasG) {
                  return 'bg-green-50 in-tolerance-row';
                } else if (hasNG) {
                  return 'bg-red-50 out-of-tolerance-row';
                } else if (record.status === 'G' || record.isWithinTolerance) {
                  return 'bg-green-50 in-tolerance-row';
                } else if (record.status === 'NG' || !record.isWithinTolerance) {
                  return 'bg-red-50 out-of-tolerance-row';
                }
                return '';
              }}
              columns={[
                { 
                  title: 'S.No',
                  key: 'sno',
                  width: 70,
                  fixed: 'left',
                  render: (_, __, index) => index + 1,
                },
                // { 
                //   title: 'ID',
                //   dataIndex: 'id',
                //   key: 'id',
                //   width: 70,
                //   render: (id) => <span className="font-medium">{id}</span>,
                //   sorter: (a, b) => a.id - b.id,
                //   defaultSortOrder: 'ascend'
                // },
                //   width: 70,
                //   render: (id) => <Tag color="blue">{id}</Tag>,
                //   sorter: (a, b) => a.id - b.id,
                //   defaultSortOrder: 'ascend'
                // },
                { 
                  title: 'Zone',
                  dataIndex: 'zone',
                  key: 'zone',
                  width: 90,
                  render: (zone) => zone || '-'
                },
                { 
                  title: 'Type',
                  dataIndex: 'dimension_type',
                  key: 'dimension_type',
                  width: 160,
                  render: (type) => <Tag color="cyan" className="type-tag">{type || 'Unknown'}</Tag>,
                  filters: [...new Set(prepareInspectionData().map(item => item.dimension_type))].map(type => ({
                    text: type || 'Unknown',
                    value: type || 'Unknown'
                  })),
                  onFilter: (value, record) => record.dimension_type === value
                },
                { 
                  title: 'Nominal',
                  dataIndex: 'nominal_value',
                  key: 'nominal_value',
                  width: 100,
                  render: (value) => <Text strong className="nominal-value">{value || '-'}</Text>
                },
                { 
                  title: 'Tolerance',
                  children: [
                    { 
                      title: 'Upper',
                      dataIndex: 'uppertol',
                      key: 'uppertol',
                      width: 80,
                      render: (value) => <Text type="success">+{value || '0'}</Text>
                    },
                    { 
                      title: 'Lower',
                      dataIndex: 'lowertol',
                      key: 'lowertol',
                      width: 80,
                      render: (value) => <Text type="danger">{value || '0'}</Text>
                    }
                  ]
                },
                {
                  title: 'Limits',
                  children: [
                    { 
                      title: 'Upper Limit',
                      key: 'upperLimit',
                      width: 100,
                      render: (_, record) => {
                        const nominal = parseFloat(record.nominal_value) || 0;
                        const upperTol = parseFloat(record.uppertol) || 0;
                        const upperLimit = (nominal + upperTol).toFixed(4);
                        return <Text type="success" className="limit-value">{upperLimit}</Text>;
                      }
                    },
                    { 
                      title: 'Lower Limit',
                      key: 'lowerLimit',
                      width: 100,
                      render: (_, record) => {
                        const nominal = parseFloat(record.nominal_value) || 0;
                        const lowerTol = parseFloat(record.lowertol) || 0;
                        const lowerLimit = (nominal + lowerTol).toFixed(4);
                        return <Text type="danger" className="limit-value">{lowerLimit}</Text>;
                      }
                    }
                  ]
                },
                {
                  title: 'Measurements',
                  children: [
                    { 
                      title: '#1',
                      dataIndex: 'measured_1',
                      key: 'measured_1',
                      width: 80,
                      render: (value) => value || '-'
                    },
                    { 
                      title: '#2',
                      dataIndex: 'measured_2',
                      key: 'measured_2',
                      width: 80,
                      render: (value) => value || '-'
                    },
                    { 
                      title: '#3',
                      dataIndex: 'measured_3',
                      key: 'measured_3',
                      width: 80,
                      render: (value) => value || '-'
                    },
                  ]
                },
                { 
                  title: 'Mean',
                  dataIndex: 'measured_mean',
                  key: 'measured_mean',
                  width: 110,
                  fixed: 'right',
                  render: (value, record) => {
                    if (!value) return '-';

                    if (value === 'G') {
                      return <Text type="success">G</Text>;
                    }
                    if (value === 'NG') {
                      return <Text type="danger">NG</Text>;
                    }
                    
                    // Convert to number and fix to 4 decimal places
                    const formattedValue = Number(value).toFixed(4);
                    
                    // Check if mean is within tolerance
                    const nominal = parseFloat(record.nominal_value) || 0;
                    const upperTol = parseFloat(record.uppertol) || 0;
                    const lowerTol = parseFloat(record.lowertol) || 0;
                    const mean = parseFloat(value) || 0;
                    
                    const upperLimit = nominal + upperTol;
                    const lowerLimit = nominal + lowerTol;
                    
                    const isWithinTolerance = mean <= upperLimit && mean >= lowerLimit;
                    
                    return (
                      <div className="flex items-center">
                        <Text 
                          strong 
                          className={`mean-value ${isWithinTolerance ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {formattedValue}
                        </Text>
                        {isWithinTolerance ? 
                          <CheckCircleOutlined className="ml-1 text-green-500" /> : 
                          <CloseCircleOutlined className="ml-1 text-red-500" />
                        }
                      </div>
                    );
                  },
                  sorter: (a, b) => {
                    const meanA = parseFloat(a.measured_mean) || 0;
                    const meanB = parseFloat(b.measured_mean) || 0;
                    return meanA - meanB;
                  }
                },
                { 
                  title: 'Instrument',
                  dataIndex: 'measured_instrument',
                  key: 'measured_instrument',
                  width: 120,
                  render: (value) => value || '-'
                },
                // {
                //   title: 'Qty',
                //   dataIndex: 'quantity_no',
                //   key: 'quantity_no',
                //   width: 60,
                //   render: (value) => <Tag color="orange">{value || '1'}</Tag>
                // },
                {
                  title: 'Date',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  width: 130,
                  render: (value) => value ? moment(value).format('DD-MM-YYYY HH:mm') : '-'
                },
                { 
                  title: 'Operator',
                  dataIndex: 'operator',
                  key: 'operator',
                  width: 100,
                  render: (operator) => operator?.username || '-'
                }
              ]}
              dataSource={[...filteredData].sort((a, b) => (a.id || 0) - (b.id || 0))}
              pagination={{ 
                pageSize: 10,
                // showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
              }}
              size="small"
              scroll={{ x: 1800, y: 500 }}
              bordered

              summary={pageData => {
                const totalItems = pageData.length;
                const withinToleranceItems = pageData.filter(item => item.isWithinTolerance).length;
                const outOfToleranceItems = totalItems - withinToleranceItems;
                
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="summary-row">
                      <Table.Summary.Cell index={0} colSpan={6}>
                        <Text strong>Summary:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} colSpan={11}>
                        <Space size="large">
                          <span><Text strong>{totalItems}</Text> total measurements</span>
                          <span><Text type="success" strong>{withinToleranceItems}</Text> within tolerance</span>
                          <span><Text type="danger" strong>{outOfToleranceItems}</Text> out of tolerance</span>
                          <span><Text type="secondary">{totalItems > 0 ? ((withinToleranceItems/totalItems) * 100).toFixed(1) : '0'}%</Text> pass rate</span>
                        </Space>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          ) : (
            <Empty 
              description={
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-600">No measurement data available</p>
                  <p className="text-sm text-gray-400">No data has been recorded for this inspection yet</p>
                  <Button 
                    type="primary" 
                    className="mt-4"
                    onClick={() => setIsQmsModalVisible(true)}
                  >
                    Open QMS Software
                  </Button>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              className="py-10"
            />
          )
        )}
      </Modal>
    );
  };

  // Function to handle approving or rejecting a measurement
  const handleApproveReject = async (id, isApproved) => {
    try {
      // Set loading state for this specific item
      setApprovingIds(prev => ({ ...prev, [id]: true }));
      
      // Show a message that we're attempting to update
      message.loading({ 
        content: `Updating status for measurement #${id}...`, 
        key: `update-${id}`,
        duration: 0
      });
      
      // Call the API to update the status with the specific endpoint format
      const response = await qualityStore.updateInspectionStatus(id, isApproved);
      
      // The API response contains the complete record with is_done field
      console.log(`Full API response for measurement #${id}:`, response);
      
      // Get the actual is_done value from the response
      const isDone = response.is_done;
      console.log(`Measurement #${id} is_done value from API:`, isDone);
      
      // Update the status based on the actual response from the API
      setApprovedStatus(prev => ({ 
        ...prev, 
        [id]: isDone === true ? 'approved' : 'rejected' 
      }));
      
      // Show success message with the actual status from the API
      message.success({
        content: isDone === true 
          ? `Measurement #${id} marked as Done` 
          : `Measurement #${id} marked as Not Done`,
        key: `update-${id}`,
        duration: 2
      });
      
      // Update the measurement data in our local state immediately
      setMeasuredData(prevData => {
        if (!prevData || !prevData.inspection_data) return prevData;
        
        const newData = {...prevData};
        
        // Loop through all operations and find the measurement with this ID
        newData.inspection_data = newData.inspection_data.map(op => {
          if (!op.inspections) return op;
          
          // Update the is_done value in the inspections array
          const updatedInspections = op.inspections.map(insp => {
            if (insp.id === id) {
              // Return a new inspection object with the updated is_done value
              return {...insp, is_done: isDone};
            }
            return insp;
          });
          
          return {...op, inspections: updatedInspections};
        });
        
        return newData;
      });
      
    } catch (error) {
      console.error(`Error ${isApproved ? 'approving' : 'rejecting'} measurement:`, error);
      
      // Create a detailed error message for debugging
      let errorMessage = `Failed to update measurement #${id}.`;
      
      if (error.response) {
        errorMessage += ` Server responded with status code ${error.response.status}.`;
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage += ` Message: ${error.response.data}`;
          } else if (error.response.data.message) {
            errorMessage += ` Message: ${error.response.data.message}`;
          }
        }
        
        console.log('Full error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        });
      } else if (error.request) {
        errorMessage += ' No response received from server. Check network connection.';
      } else {
        errorMessage += ` ${error.message}`;
      }
      
      // Show the error message
      message.error({
        content: errorMessage,
        key: `update-${id}`,
        duration: 5
      });
    } finally {
      // Clear loading state
      setApprovingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  // Function to handle approving all measurements
  const handleApproveAll = async () => {
    if (ftpApprovalStatus?.is_completed) {
      Modal.info({
        title: 'Already Approved',
        content: 'This inspection has already been approved.',
        okText: 'OK'
      });
      return;
    }

    const orderId = inspectionDetails?.order_id;
    // FIX: Get IPID for the selected operation
    const ipid = inspectionDetails?.operation_groups?.find(group => group.op_no === selectedOperation)?.ipid;
    ipid1 = ipid;

    if (!orderId || !ipid) {
      message.error('Order ID or IPID not found.');
      return;
    }

    setIsApprovingAll(true);
    try {
      await qualityStore.approveAllMeasurements(orderId, ipid);
      message.success('All measurements approved');
      setAllApproved(true);

      // Update FTP status after approval
      const ftpStatus = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
      setFtpApprovalStatus(ftpStatus);

      Modal.success({
        title: 'Approval Successful',
        content: 'All measurements have been approved successfully.',
        okText: 'OK'
      });
    } catch (error) {
      message.error('Failed to approve all measurements');
    } finally {
      setIsApprovingAll(false);
    }
  };

  // Function to handle rejecting all measurements
  const RejectFTP = async () => {
    // Check if already rejected
    if (ftpApprovalStatus?.is_completed === false && ftpApprovalStatus?.status === 'rejected') {
      Modal.info({
        title: 'Already Rejected',
        content: 'This inspection has already been rejected.',
        okText: 'OK'
      });
      return;
    }

    const orderId = inspectionDetails?.order_id;
    // Get IPID for the selected operation
    const ipid = inspectionDetails?.operation_groups?.find(group => group.op_no === selectedOperation)?.ipid;
    ipid1 = ipid;

    if (!orderId || !ipid) {
      message.error('Order ID or IPID not found.');
      return;
    }

    // Confirm before rejecting
    Modal.confirm({
      title: 'Confirm Rejection',
      content: 'Are you sure you want to reject this inspection? This will require QC intervention.',
      okText: 'Yes, Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await qualityStore.rejectAllMeasurements(orderId, ipid);
          message.success('Inspection has been rejected');

          // Update FTP status after rejection
          const ftpStatus = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
          setFtpApprovalStatus(ftpStatus);

          Modal.error({
            title: 'Inspection Rejected',
            content: 'This inspection has been rejected. Please contact QC for further actions.',
            okText: 'OK'
          });
        } catch (error) {
          message.error('Failed to reject inspection');
        }
      }
    });
  };

  // Update the renderModalContent function to include measured data
  const renderModalContent = () => (
    <div className="flex gap-6">
      {/* Left side - Measurements */}
      <div className="flex-1 min-w-[45%]">
        <div className="bg-white rounded-lg shadow-sm p-4">
          {/* Add header with buttons */}
          <div className="flex justify-between items-center mb-4">
            <Typography.Title level={5} className="mb-0">
              Measurement Details
            </Typography.Title>
          </div>
          <Divider className="my-3" />
          {renderModalHeader()}
          <div className="mt-4">
            {renderOperationDetails()}
          </div>
        </div>
      </div>

      {/* Right side - Drawing */}
      <div className="flex-1 min-w-[55%]">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-240px)] flex flex-col">
          {/* Drawing Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <Typography.Title level={5} className="mb-0">
                Drawing View
              </Typography.Title>
              {drawingData && (
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  size="middle"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = drawingData.url;
                    link.download = drawingData.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Download Drawing
                </Button>
              )}
            </div>
          </div>

          {/* Drawing Content */}
          <div className="flex-1 p-4">
            {renderDrawingContent()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDrawingContent = () => {
    if (loadingDrawing) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">
              {isRetrying ? (
                <>
                  <div>Retrying download...</div>
                  <div className="text-sm text-gray-400">Attempt {retryCount} of 3</div>
                </>
              ) : (
                <>
                  <div>Loading drawing...</div>
                  <div className="text-sm text-gray-400">This may take a few moments</div>
                </>
              )}
            </div>
            {downloadProgress > 0 && (
              <div className="mt-2">
                <Progress percent={downloadProgress} size="small" status="active" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (drawingData) {
      return (
        <div className="h-full rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src={drawingData.url}
            type="application/pdf"
            className="w-full h-full"
            style={{
              backgroundColor: '#f8fafc',
              border: 'none'
            }}
            title="Drawing View"
            onLoad={() => {
              message.destroy('drawingLoading');
              setDownloadProgress(0);
              setIsRetrying(false);
              setRetryCount(0);
            }}
            onError={() => {
              message.error('Failed to load drawing in viewer');
              setDrawingData(null);
            }}
          />
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-gray-500">
              No drawing available
            </span>
          }
        />
      </div>
    );
  };

  const renderQmsModal = () => (
    <Modal
      title="No Measurements Available"
      visible={isQmsModalVisible}
      onCancel={() => setIsQmsModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setIsQmsModalVisible(false)}>
          Cancel
        </Button>,
        <Button 
          key="launch" 
          type="primary"
          onClick={handleLaunchQMS}
          loading={isLaunching}
        >
          Open QMS Software
        </Button>
      ]}
    >
      <p>No measurement data is available for this operation. Would you like to open the QMS software?</p>
    </Modal>
  );

  // Clean up blob URLs when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (drawingData?.url) {
        URL.revokeObjectURL(drawingData.url);
      }
    };
  }, [drawingData]);

  useEffect(() => {
    if (orderId) {
      fetchMeasuredData();
      checkFTPStatus();
    }
  }, [orderId]);

  // Update the fetchMeasuredData function to properly check final inspection status
  const fetchMeasuredData = async () => {
    if (!orderId) return;
    
    try {
      const response = await qualityStore.fetchInspectionByOrderId(orderId);
      if (response && response.inspection_data && response.inspection_data.length > 0) {
        setMeasuredData(response);
        
        // Check if final inspection is already approved
        const finalInspection = response.inspection_data.find(
          op => op.operation_number === 999
        );
        
        // Check both is_approved and is_done flags
        const isApproved = finalInspection?.is_approved || 
                          (finalInspection?.inspections?.every(insp => insp.is_done === true));
        
        if (isApproved) {
          setFinalInspectionApproved(true);
          setIsFinalAllApproved(true);
        }
        
        // Initialize approved status from fetched data
        const statusMap = {};
        response.inspection_data.forEach(opData => {
          if (opData.inspections && opData.inspections.length > 0) {
            opData.inspections.forEach(inspection => {
              // Check for the is_done field explicitly
              console.log(`Inspection #${inspection.id} is_done value:`, inspection.is_done);
              
              // Strictly check for boolean true/false values to set appropriate status
              if (inspection.is_done === true) {
                statusMap[inspection.id] = 'approved';
              } else if (inspection.is_done === false) {
                statusMap[inspection.id] = 'rejected';
              } else {
                // Handle any undefined or null cases
                statusMap[inspection.id] = null;
              }
            });
          }
        });
        
        // Update the approval status state
        setApprovedStatus(statusMap);
        console.log('Updated approval status map:', statusMap);
      }
    } catch (error) {
      console.error('Error fetching measured data:', error);
    }
  };

  // Add handler for final inspection click
  const handleFinalInspectionClick = () => {
    // Check if we have operation groups with op_no 999
    const hasFinalInspection = inspectionDetails?.operation_groups?.some(
      group => group.op_no === 999
    );

    if (!hasFinalInspection) {
      Modal.info({
        title: 'Final Inspection Not Available',
        content: (
          <div>
            <p>Final inspection has not been done yet.</p>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button 
                type="primary" 
                onClick={() => {
                  handleLaunchQMS();
                  Modal.destroyAll();
                }}
                icon={<LinkOutlined />}
              >
                Open QMS Software
              </Button>
            </div>
          </div>
        ),
        okText: 'Close',
        width: 400
      });
      return;
    }

    setIsFinalInspectionModalVisible(true);
  };

  const getFinalInspectionData = () => {
    if (!inspectionDetails?.operation_groups) return [];
    
    const finalInspectionData = inspectionDetails.operation_groups
      .filter(group => group.op_no === 999)
      .map((group, index) => ({
        key: index,
        id: group.details?.id || 0, // Keep the original ID for reference
        zone: group.details?.zone || '',
        dimension_type: group.details?.dimension_type || '',
        nominal: group.details?.nominal || '',
        uppertol: group.details?.uppertol || '',
        lowertol: group.details?.lowertol || '',
        measured_instrument: group.details?.measured_instrument || ''
      }));
  
    // Sort by id in ascending order
    finalInspectionData.sort((a, b) => {
      const idA = typeof a.id === 'number' ? a.id : parseInt(a.id) || 0;
      const idB = typeof b.id === 'number' ? b.id : parseInt(b.id) || 0;
      return idA - idB;
    });
  
    // After sorting, update the key to reflect the new order
    finalInspectionData.forEach((item, index) => {
      item.key = index;
    });
  
    return finalInspectionData;
  };

  // Add function to check FTP approval status
  const checkFTPStatus = async () => {
    const orderId = inspectionDetails?.order_id;
    
    console.log('YETTE:', orderId, ipid1);
    if (!orderId || !ipid1) return;

    try {
      const response = await qualityStore.checkFTPApprovalStatus(orderId, ipid1);
      console.log('FTP Approval Status:', response);
      
      // Update FTP status
      setFtpApprovalStatus(response);
      
      // If is_completed is true, update all related states
      if (response.is_completed === true) {
        setFinalInspectionApproved(true);
        setIsFinalAllApproved(true);
        setAllApproved(true);
      }
    } catch (error) {
      console.error('Error checking FTP status:', error);
    }
  };

  // Update useEffect to check FTP status when component mounts and when inspection details change
  useEffect(() => {
    if (inspectionDetails?.order_id && ipid1) {
      checkFTPStatus();
    }
  }, [inspectionDetails]);

  // Update handleFinalApproveAll function
  const handleFinalApproveAll = async () => {
    // First check if already approved
    if (ftpApprovalStatus?.is_completed === true) {
      Modal.info({
        title: 'Already Approved',
        content: 'This final inspection has already been approved.',
        okText: 'OK'
      });
      return;
    }

    const orderId = inspectionDetails?.order_id;
    const ipid = inspectionDetails?.operation_groups?.find(group => group.op_no === 999)?.ipid;
    ipid1 = ipid;

    if (!orderId || !ipid) {
      message.error('Order ID or IPID not found.');
      return;
    }

    setIsFinalApprovingAll(true);
    try {
      console.log('Approving all final inspection measurements for Order ID:', orderId, ipid);
      
      await qualityStore.approveAllMeasurements(orderId, ipid);
      message.success('All final inspection measurements approved');
      setIsFinalAllApproved(true);
      setFinalInspectionApproved(true);
      setAllApproved(true);
      
      // Update FTP status after approval
      await checkFTPStatus();
      
      Modal.success({
        title: 'Approval Successful',
        content: 'Final inspection has been approved successfully.',
        okText: 'OK'
      });
    } catch (error) {
      message.error('Failed to approve all final inspection measurements');
    } finally {
      setIsFinalApprovingAll(false);
    }
  };

  // Add a function to fetch the final inspection drawing
  const fetchFinalInspectionDrawing = async () => {
    try {
      setLoadingFinalDrawing(true);
      const productionOrder = inspectionDetails?.production_order;
      const operationId = '999'; // Operation ID for final inspection
      
      if (!productionOrder) {
        message.info('No production order found for final inspection');
        return;
      }
      
      const data = await qualityStore.fetchBalloonedDrawing(inspectionDetails.part_number, operationId);
      if (data && data.url) {
        setFinalInspectionDrawing(data);
      } else {
        message.info('No drawing is uploaded for final inspection');
      }
    } catch (error) {
      if (error.message !== 'Drawing not found') {
        console.error('Error loading final inspection drawing:', error);
      }
      message.info('No drawing is uploaded for final inspection');
    } finally {
      setLoadingFinalDrawing(false);
    }
  };

  // Move useEffect to component level
  useEffect(() => {
    if (isFinalInspectionModalVisible) {
      fetchFinalInspectionDrawing();
    }
  }, [isFinalInspectionModalVisible]);

  // Clean up drawing URL when component unmounts
  useEffect(() => {
    return () => {
      if (finalInspectionDrawing?.url) {
        URL.revokeObjectURL(finalInspectionDrawing.url);
      }
    };
  }, [finalInspectionDrawing]);

  // Add new function to handle viewing final inspection measurements
  const handleViewFinalMeasurements = async () => {
    try {
      if (!inspectionDetails?.order_id) {
        message.error('Order ID not found');
        return;
      }
      
      // Show loading indicator
      message.loading({ content: 'Loading final inspection measurements...', key: 'finalMeasurementsLoading' });
      
      // Get the IPID for final inspection
      const finalOpGroup = inspectionDetails.operation_groups?.find(
        group => group.op_no === 999
      );
      const ipid = finalOpGroup?.ipid;
      console.log("YEET");
      console.log(ipid);

      if (!ipid) {
        message.error('IPID not found for final inspection');
        return;
      }
      
      // Fetch measurements using the stage inspection endpoint
      const response = await qualityStore.fetchStageInspectionByOperation(
        inspectionDetails.order_id,
        999 // Final inspection operation number
      );
      
      // Check FTP approval status for final inspection
      const ftpStatus = await qualityStore.checkFTPApprovalStatus(
        inspectionDetails.order_id,
        ipid
      );
      setFtpApprovalStatus(ftpStatus);
      
      if (response && response.length > 0) {
        // Transform the data to match the expected format
        const transformedData = {
          inspection_data: [{
            operation_number: 999,
            inspections: response.map(item => ({
              ...item,
              is_done: item.is_done || false
            }))
          }]
        };
        
        setMeasuredData(transformedData);
        setIsMeasuredDataModalVisible(true);
        message.success({ content: 'Final inspection data loaded successfully', key: 'finalMeasurementsLoading', duration: 1 });
      } else {
        Modal.warning({
          title: 'No Measurements Found',
          content: 'No measurements have been recorded for Final Inspection (Operation 999) yet.',
          okText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error loading final inspection measurements:', error);
      message.error({ 
        content: error.response?.data?.message || 'Failed to load final inspection measurements', 
        key: 'finalMeasurementsLoading' 
      });
    }
  };

  // Add function to handle measurement click
  const handleMeasurementClick = (record) => {
    setSelectedMeasurement(record);
    setIsDetailModalVisible(true);
  };

  // Add function to render measurement details modal
  const renderMeasurementDetailModal = () => {
    if (!selectedMeasurement) return null;

    return (
      <Modal
        title={
          <div className="flex items-center gap-2">
            <InfoCircleOutlined className="text-blue-500" />
            <span>Measurement Details</span>
          </div>
        }
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div className="space-y-4">
          {/* Header Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Text type="secondary" className="text-xs">Zone</Text>
                <div className="text-base font-medium">{selectedMeasurement.zone || '-'}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary" className="text-xs">Dimension Type</Text>
                <div className="text-base font-medium">{selectedMeasurement.dimension_type || '-'}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary" className="text-xs">Instrument</Text>
                <div className="text-base font-medium">{selectedMeasurement.measured_instrument || '-'}</div>
              </Col>
            </Row>
          </div>

          {/* Measurements */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Title level={5}>Measurements</Title>
            <Row gutter={[16, 16]} className="mt-2">
              <Col span={8}>
                <Card size="small" title="Nominal Value">
                  <Text strong>{selectedMeasurement.nominal_value || '-'}</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Upper Tolerance">
                  <Text type="success">+{selectedMeasurement.uppertol || '0'}</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Lower Tolerance">
                  <Text type="danger">{selectedMeasurement.lowertol || '0'}</Text>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Actual Measurements */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Title level={5}>Actual Measurements</Title>
            <Row gutter={[16, 16]} className="mt-2">
              <Col span={8}>
                <Card size="small" title="Measurement #1">
                  <Text>{selectedMeasurement.measured_1 || '-'}</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Measurement #2">
                  <Text>{selectedMeasurement.measured_2 || '-'}</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Measurement #3">
                  <Text>{selectedMeasurement.measured_3 || '-'}</Text>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Mean and Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Mean Value">
                  <div className="flex items-center gap-2">
                    <Text strong className={selectedMeasurement.isWithinTolerance ? 'text-green-600' : 'text-red-600'}>
                      {selectedMeasurement.measured_mean || '-'}
                    </Text>
                    {selectedMeasurement.isWithinTolerance ? 
                      <CheckCircleOutlined className="text-green-500" /> : 
                      <CloseCircleOutlined className="text-red-500" />
                    }
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Status">
                  <div className="flex items-center gap-2">
                    <Badge 
                      status={selectedMeasurement.isWithinTolerance ? 'success' : 'error'} 
                      text={
                        selectedMeasurement.isWithinTolerance ? 
                          'Within Tolerance' : 
                          'Out of Tolerance'
                      } 
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text type="secondary" className="text-xs">Operator</Text>
                <div className="text-base">
                  {selectedMeasurement.operator?.username || '-'}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs">Date & Time</Text>
                <div className="text-base">
                  {selectedMeasurement.created_at ? 
                    moment(selectedMeasurement.created_at).format('DD-MM-YYYY HH:mm') : 
                    '-'
                  }
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>
    );
  };

  // Render the final inspection modal
  const renderFinalInspectionModal = () => {
    const finalInspectionData = getFinalInspectionData();
    
    const columns = [
      {
        title: 'S.No',
        key: 'sno',
        width: 60,
        render: (_, record, index) => index + 1, // Display sequential serial number
      },
      {
        title: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        width: 100,
      },
      {
        title: 'Description',
        dataIndex: 'dimension_type',
        key: 'dimension_type',
        width: 150,
      },
      {
        title: 'Nominal',
        dataIndex: 'nominal',
        key: 'nominal',
        width: 100,
      },
      {
        title: 'Upper Tol',
        dataIndex: 'uppertol',
        key: 'uppertol',
        width: 100,
      },
      {
        title: 'Lower Tol',
        dataIndex: 'lowertol',
        key: 'lowertol',
        width: 100,
      },
      {
        title: 'Instrument',
        dataIndex: 'measured_instrument',
        key: 'measured_instrument',
        width: 150,
      },
      {
        title: 'Action',
        key: 'action',
        width: 100,
        render: (_, record) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleMeasurementClick(record)}
          >
            View
          </Button>
        ),
      }
    ];

    return (
      <>
        <Modal
          title={
            <div className="flex items-center gap-2">
              <FileSearchOutlined className="text-blue-500" />
              <span>Final Inspection Measurements</span>
            </div>
          }
          visible={isFinalInspectionModalVisible}
          onCancel={() => {
            setIsFinalInspectionModalVisible(false);
            setFinalInspectionDrawing(null);
          }}
          width={1600}
          footer={[
            <Button key="close" onClick={() => {
              setIsFinalInspectionModalVisible(false);
              setFinalInspectionDrawing(null);
            }}>
              Close
            </Button>
          ]}
        >
          {/* Rest of the existing modal content */}
          <div className="flex gap-6">
            {/* Left side - Measurements */}
            <div className="flex-1 min-w-[45%]">
              {/* Header section */}
              <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                <Row gutter={16} align="middle">
                  <Col span={24}>
                    <Row gutter={[16, 8]}>
                      <Col span={8}>
                        {/* <div className="flex flex-col">
                          <Text type="secondary" className="text-xs">Order ID</Text>
                          <Text strong className="text-base">{inspectionDetails?.order_id || '-'}</Text>
                        </div> */}
                      </Col>
                      <Col span={8}>
                        <div className="flex flex-col">
                          <Text type="secondary" className="text-xs">Production Order</Text>
                          <Text strong className="text-base">{inspectionDetails?.production_order || '-'}</Text>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="flex flex-col">
                          <Text type="secondary" className="text-xs">Part Number</Text>
                          <Text strong className="text-base">{inspectionDetails?.part_number || '-'}</Text>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <Text strong>Operation: 999</Text>
                <br />
                <Text strong>IPID: {inspectionDetails?.operation_groups?.[0]?.ipid || 'No IPID'}</Text>
              </div>
              <Table
                columns={columns}
                dataSource={finalInspectionData}
                pagination={false}
                scroll={{ x: 900, y: 400 }}
                size="small"
                onRow={(record) => ({
                  onClick: () => handleMeasurementClick(record),
                  style: { cursor: 'pointer' }
                })}
              />
            </div>

            {/* Right side - Drawing */}
            <div className="flex-1 min-w-[55%]">
              <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-240px)] flex flex-col">
                {/* Drawing Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <Typography.Title level={5} className="mb-0">
                      Ballooned Drawing
                    </Typography.Title>
                    <Space>
                      {finalInspectionDrawing && (
                        <Button
                          type="default"
                          icon={<DownloadOutlined />}
                          size="middle"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = finalInspectionDrawing.url;
                            link.download = finalInspectionDrawing.fileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Download Drawing
                        </Button>
                      )}
                    </Space>
                  </div>
                </div>

                {/* Drawing Content */}
                <div className="flex-1 p-4">
                  {loadingFinalDrawing ? (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Spin size="large" />
                        <div className="mt-4 text-gray-500">Loading drawing...</div>
                      </div>
                    </div>
                  ) : finalInspectionDrawing ? (
                    <div className="h-full rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        src={finalInspectionDrawing.url}
                        type="application/pdf"
                        className="w-full h-full"
                        style={{
                          backgroundColor: '#f8fafc',
                          border: 'none'
                        }}
                        title="Ballooned Drawing View"
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-gray-500">
                            No drawing available
                          </span>
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Add the measurement detail modal */}
        {renderMeasurementDetailModal()}
      </>
    );
  };

  // Update styles to include more specific styles for the measured data modal
  const styles = `
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

    /* Modal z-index fixes */
    .ant-modal-root {
      z-index: 1000;
    }

    .measured-data-modal {
      z-index: 1100 !important;
    }

    .measured-data-modal .ant-modal-wrap {
      z-index: 1100 !important;
    }

    .measured-data-modal .ant-modal-mask {
      z-index: 1099 !important;
    }

    .measured-data-modal .ant-modal {
      z-index: 1100 !important;
    }

    .qms-loading-modal .ant-modal-content {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .qms-loading-modal .ant-modal-body {
      padding: 24px;
    }

    .measurements-modal .ant-modal-content {
      padding: 0;
    }

    .measurements-modal .ant-modal-body {
      padding: 24px;
      max-height: 80vh;
      overflow: auto;
    }

    .measurements-modal .ant-modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    object, iframe {
      border: none;
      background: #fff;
    }

    /* Add smooth transition for the drawing */
    object, iframe {
      transition: all 0.3s ease;
    }

    .measurements-modal .ant-alert {
      margin-bottom: 16px;
    }

    .measurements-modal .ant-btn {
      margin-top: 8px;
    }

    iframe {
      border: none;
      background: white;
    }

    .measurements-modal .ant-modal-body {
      padding: 24px;
      max-height: 90vh;
      overflow: auto;
    }

    .measurements-modal .ant-modal-content {
      padding: 0;
      border-radius: 8px;
      overflow: hidden;
    }

    .measurements-modal .ant-modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
      background: #ffffff;
    }

    .measurements-modal .ant-modal-body {
      padding: 24px;
      background: #f8fafc;
    }

    .measurements-modal .ant-modal-close {
      top: 16px;
    }

    .measurements-modal .ant-table {
      background: white;
      border-radius: 8px;
    }

    .measurements-modal .ant-table-thead > tr > th {
      background: #f8fafc;
      border-bottom: 2px solid #e5e7eb;
    }

    .measurements-modal iframe {
      border: none;
      background: white;
      border-radius: 4px;
    }

    .measurements-modal .ant-spin {
      color: #1890ff;
    }

    .measurements-modal .ant-btn {
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .measurements-modal .ant-empty {
      color: #6b7280;
    }

    .measurements-modal .ant-btn-primary {
      background: #1890ff;
      border-color: #1890ff;
      color: white;
    }

    .measurements-modal .ant-btn-primary:hover {
      background: #40a9ff;
      border-color: #40a9ff;
    }

    .measurements-modal .ant-divider {
      margin: 16px 0;
      border-color: #e5e7eb;
    }

    .measurements-modal .ant-space {
      display: flex;
      gap: 8px;
    }

    .measured-data-modal .ant-modal-content {
      border-radius: 8px;
      overflow: hidden;
    }

    .measured-data-modal .ant-modal-header {
      background-color: #f0f2f5;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 24px;
    }
    
    .measured-data-modal .ant-modal-body {
      padding: 20px;
      background: #f8fafc;
    }

    .measured-data-modal .ant-table {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .measured-data-modal .ant-table-thead > tr > th {
      background: #f0f2f5;
      font-weight: 600;
    }
    
    .measured-data-modal .ant-tag {
      border-radius: 4px;
    }
    
    .measured-data-modal .ant-badge-status-dot {
      width: 8px;
      height: 8px;
    }

    /* Custom Switch Styling */
    .ant-switch {
      min-width: 70px;
    }
    
    .ant-switch-checked {
      background-color: #52c41a !important;
    }
    
    .ant-switch:not(.ant-switch-checked) {
      background-color: #ff4d4f !important;
    }
    
    .ant-switch-inner {
      color: white !important;
      font-weight: 500 !important;
    }

    /* Table row styling for tolerance status */
    .ant-table-row.bg-green-50 {
      background-color: #f0fdf4;
      transition: background-color 0.3s ease;
    }
    
    .ant-table-row.bg-green-50:hover > td {
      background-color: #dcfce7 !important;
    }
    
    .ant-table-row.bg-red-50 {
      background-color: #fef2f2;
      transition: background-color 0.3s ease;
    }
    
    .ant-table-row.bg-red-50:hover > td {
      background-color: #fee2e2 !important;
    }

    /* Enhanced table styling */
    .measured-data-modal .ant-table-thead > tr > th {
      background: #f0f7ff;
      font-weight: 600;
      color: #1f3a60;
      text-align: center;
      padding: 12px 8px;
    }
    
    .measured-data-modal .ant-table-container {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }
    
    .measured-data-modal .ant-table-thead > tr > th.ant-table-column-has-sorters:hover {
      background: #e6f0ff;
    }
    
    .measured-data-modal .ant-table-row:hover > td {
      transition: background 0.3s ease;
    }
    
    /* Row styling */
    .in-tolerance-row {
      background-color: #f0fdf4;
    }
    
    .in-tolerance-row:hover > td {
      background-color: #dcfce7 !important;
    }
    
    .out-of-tolerance-row {
      background-color: #fef2f2;
    }
    
    .out-of-tolerance-row:hover > td {
      background-color: #fee2e2 !important;
    }
    
    /* Tag styling */
    .op-tag {
      padding: 2px 10px;
      font-weight: 500;
    }
    
    .type-tag {
      padding: 2px 8px;
      width: auto;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }
    
    /* Value highlighting */
    .nominal-value,
    .limit-value,
    .mean-value {
      font-family: 'Courier New', monospace;
      letter-spacing: 0.5px;
    }
    
    .approve-all-btn {
      font-weight: 500;
      height: 40px;
      border-radius: 6px;
      box-shadow: 0 2px 0 rgba(0, 0, 0, 0.05);
    }
    
    /* Enhance the status switch */
    .status-switch-container {
      display: flex;
      justify-content: center;
    }
    
    .status-switch {
      min-width: 90px !important;
    }
    
    /* Filter button styling */
    .filter-btn {
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      height: 28px;
    }
    
    /* Summary row styling */
    .summary-row {
      background-color: #fafafa;
      font-size: 13px;
    }
    
    /* Nested column headers */
    .measured-data-modal .ant-table-thead > tr > th.ant-table-column-has-sorters {
      cursor: pointer;
    }
    
    .measured-data-modal .ant-table-thead > tr:first-child > th {
      background-color: #f5f8ff;
    }
    
    .measured-data-modal .ant-table-thead > tr:not(:first-child) > th {
      background-color: #f9fafc;
    }

    /* Enhanced filter button styling */
    .filter-btn {
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      height: 28px;
      transition: all 0.3s ease;
    }
    
    .filter-btn.active-filter {
      font-weight: 500;
      transform: translateY(-1px);
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.05);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="p-4">
        {/* Header row with Select and QMS button */}
        <div className="flex justify-between items-center mb-4">
          {/* Left: Select Part Number/Production Order (assume this is a prop or component) */}
          <div>
            {/* You may need to replace this with your actual select component/logic */}
            {/* Example: <Select ... /> */}
          </div>
          {/* Right: Open QMS Software button */}
          {/* <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={handleLaunchQMS}
          >
            Open QMS Software
          </Button> */}
        </div>
        <Tabs 
          defaultActiveKey="details" 
          type="card"
          className="bg-white rounded-lg shadow-sm"
          items={items}
        />

        {/* Add the final inspection modal */}
        {renderFinalInspectionModal()}

        {/* QMS Launch Modal */}
        {renderQmsModal()}

        {/* Updated Measurements Modal with Drawing Download */}
        <Modal
          title={
            <div className="flex items-center gap-3">
              <FileTextOutlined className="text-blue-500" />
              <span>Operation {selectedOperation} Details</span>
            </div>
          }
          visible={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setDrawingData(null);
          }}
          width={1600}
          footer={null}
          className="measurements-modal"
          style={{ top: 20 }}
        >
          {renderModalContent()}
        </Modal>

        {/* Measured Data Modal */}
        {renderMeasuredDataModal()}
      </div>
    </>
  );
};

// Enhanced styles
const styles = `
  /* Row styling for measurement status */
  .ant-table-tbody > tr.row-ok > td {
    background-color: #f6ffed !important; /* Light green background for G/Within Tolerance */
  }
  .ant-table-tbody > tr.row-ok:hover > td {
    background-color: #f0f9eb !important; /* Slightly darker green on hover */
  }
  .ant-table-tbody > tr.row-error > td {
    background-color: #fff2f0 !important; /* Light red background for NG/Out of Tolerance */
  }
  .ant-table-tbody > tr.row-error:hover > td {
    background-color: #ffebeb !important; /* Slightly darker red on hover */
  }
  
  .no-ipid-table .ant-table-cell {
    color: rgba(0, 0, 0, 0.45);
    transition: all 0.3s;
  }
  
  .no-ipid-table .ant-table-row:hover {
    cursor: not-allowed;
    background: rgba(0, 0, 0, 0.02);
  }

  .ant-table-row {
    transition: all 0.3s;
  }

  .ant-card {
    border-radius: 8px;
  }

  .ant-tag {
    border-radius: 4px;
  }

  .ant-btn {
    border-radius: 6px;
  }

  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
    border-radius: 6px 6px 0 0;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    margin-right: 2px;
    transition: all 0.3s;
  }

  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
    background: #ffffff;
    border-bottom-color: #ffffff;
  }

  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab:hover {
    background: #ffffff;
  }

  .ant-tabs-nav {
    margin-bottom: 0 !important;
  }

  .ant-tabs-content {
    background: #ffffff;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-top: none;
    border-radius: 0 0 8px 8px;
  }
  
  /* Remove cell padding from tables with no-cell-padding class */
  .no-cell-padding .ant-table-thead > tr > th,
  .no-cell-padding .ant-table-tbody > tr > td {
    padding: 0 !important;
  }
  
  /* Gridlines for the table */
  .with-gridlines .ant-table {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
  }
  
  .with-gridlines .ant-table-thead > tr > th,
  .with-gridlines .ant-table-tbody > tr > td {
    border-right: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    padding: 12px 16px;
  }
  
  .with-gridlines .ant-table-thead > tr > th {
    background-color: #fafafa;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .with-gridlines .ant-table-tbody > tr:last-child > td {
    border-bottom: 1px solid #f0f0f0;
  }
  
  .with-gridlines .ant-table-tbody > tr > td:last-child,
  .with-gridlines .ant-table-thead > tr > th:last-child {
    border-right: none;
  }
  
  .with-gridlines .ant-table-tbody > tr > td .ant-btn {
    border-radius: 0;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none !important;
    box-shadow: none !important;
  }
`;

export default QualityInspectionDetails;



