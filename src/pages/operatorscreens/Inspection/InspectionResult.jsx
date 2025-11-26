
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Table, Typography, Space, Button, Row, Col, Statistic, Progress, Select, DatePicker, Tooltip, Tag, Badge, Empty, Spin, Modal, Divider, Alert, message, Switch, Input } from 'antd';

// FTP Status Cell Component
const FTPStatusCell = ({ record, viewMode }) => {
  const [ftpStatuses, setFtpStatuses] = useState({});
  const [loading, setLoading] = useState({});

  // Get current operation from localStorage
  const getCurrentOperationNumber = () => {
    try {
      const activeOpStr = localStorage.getItem('activeOperation');
      if (activeOpStr) {
        const activeOp = JSON.parse(activeOpStr);
        return activeOp.operation_number?.toString();
      }
    } catch (error) {
      console.error('Error getting current operation:', error);
    }
    return null;
  };

  const currentOpNumber = getCurrentOperationNumber();
  const operations = record.operations || [];
  
  // If in current operation view, filter to show only the current operation
  const opsToShow = viewMode === 'current' ? 
    operations.filter(op => op.toString() === currentOpNumber) : 
    operations;

  // Function to fetch FTP status
  const fetchFtpStatus = useCallback(async (orderId, opNumber) => {
    const opKey = `${orderId}-${opNumber}`;
    
    // Don't fetch if already loading or already has data
    if (loading[opKey] || ftpStatuses[opKey]) return;
    
    setLoading(prev => ({ ...prev, [opKey]: true }));
    
    try {
      // Construct IPID in the format: IPID-{part_number}-{operation_number}
      const ipid = `IPID-${record.part_number}-${opNumber}`;
      const response = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
      
      setFtpStatuses(prev => ({
        ...prev,
        [opKey]: response.status?.toLowerCase() || 'pending'
      }));
    } catch (error) {
      console.error(`Error fetching FTP status for operation ${opNumber}:`, error);
      setFtpStatuses(prev => ({
        ...prev,
        [opKey]: 'error'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [opKey]: false }));
    }
  }, [ftpStatuses, loading, record.part_number]);

  // Fetch statuses when component mounts or when opsToShow changes
  useEffect(() => {
    if (record.order_id) {
      opsToShow.forEach(op => {
        fetchFtpStatus(record.order_id, op);
      });
    }
  }, [record.order_id, JSON.stringify(opsToShow), fetchFtpStatus]);

  const getStatusInfo = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    
    switch(statusLower) {
      case 'approved':
        return { text: 'Approved', color: 'success' };
      case 'rejected':
        return { text: 'Rejected', color: 'error' };
      case 'pending':
        return { text: 'Pending', color: 'warning' };
      case 'error':
        return { text: 'Error', color: 'default' };
      default:
        return { text: 'Pending', color: 'warning' };
    }
  };

  return (
    <Space direction="vertical" size="small">
      {opsToShow.map((op) => {
        const opNumber = op;
        const opKey = `${record.order_id}-${opNumber}`;
        const status = ftpStatuses[opKey] || 'pending';
        const statusInfo = getStatusInfo(status);
        
        return (
          <div key={opKey} style={{ minWidth: '80px' }}>
            {loading[opKey] ? (
              <div style={{ textAlign: 'center' }}>
                <Spin size="small" />
              </div>
            ) : (
              <Tag 
                color={statusInfo.color}
                style={{ 
                  margin: 0, 
                  width: '100%',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  opacity: loading[opKey] ? 0.6 : 1
                }}
                onClick={() => fetchFtpStatus(record.order_id, opNumber)}
              >
                {statusInfo.text}
              </Tag>
            )}
          </div>
        );
      })}
    </Space>
  );
};
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, DownloadOutlined, EyeOutlined, FileSearchOutlined, PlusCircleOutlined, CloseOutlined, DatabaseOutlined, UserOutlined, ClockCircleOutlined, LoadingOutlined, LinkOutlined, RocketOutlined } from '@ant-design/icons';
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
  const [viewMode, setViewMode] = useState('current');
  const [currentOperationData, setCurrentOperationData] = useState(null);
  
  // Add states for pre-loading ballooned drawings
  const [preloadedDrawings, setPreloadedDrawings] = useState({});
  const [loadingDrawings, setLoadingDrawings] = useState({});
  
  // Add state for quantity input
  const [quantity, setQuantity] = useState('');
  const [pagination, setPagination] = useState({ 
    current: 1, 
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
    onChange: (page, pageSize) => {
      setPagination(prev => ({ ...prev, current: page, pageSize }));
    },
    onShowSizeChange: (current, size) => {
      setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
    }
  });
  
  // State for no measurements popup
  const [noMeasurementsModal, setNoMeasurementsModal] = useState({
    visible: false,
    quantity: null,
    operation: null
  });

  // Track if we've shown the no measurements popup for the current operation
  const [hasShownNoMeasurements, setHasShownNoMeasurements] = useState(false);

  // Track the last loaded operation to prevent unnecessary reloads
  const [lastLoadedOperation, setLastLoadedOperation] = useState(null);
  
  // Function to handle quantity change and fetch stage inspection data
  const handleQuantityChange = async (newQuantity) => {
    // Prevent default form submission
    if (newQuantity && typeof newQuantity.preventDefault === 'function') {
      newQuantity.preventDefault();
      return;
    }
    
    const quantityValue = typeof newQuantity === 'object' ? newQuantity.target?.value : newQuantity;
    
    if (!quantityValue || isNaN(quantityValue) || quantityValue < 1) {
      setQuantity(quantityValue);
      return;
    }

    // Only update quantity if it has changed
    if (quantityValue !== quantity) {
      setQuantity(quantityValue);
    } else if (lastLoadedOperation === selectedOperation) {
      // If we've already loaded data for this operation and quantity, don't fetch again
      return;
    }

    // Only proceed if we have an active operation modal
    if (!isOperationModalVisible || !selectedOperation || !selectedOrderId) {
      return;
    }

    try {
      setLoadingDetailedMeasurements(true);
      
      console.log(`Fetching stage inspection for order ID: ${selectedOrderId}, operation: ${selectedOperation}, quantity: ${quantityValue}`);
      
      // Call the fetchStageInspectionByOperation method with the new quantity
      const response = await qualityStore.fetchStageInspectionByOperation(selectedOrderId, selectedOperation, parseInt(quantityValue));
      console.log('Stage inspection data received for quantity:', quantityValue, response);

      // Update the last loaded operation
      setLastLoadedOperation(selectedOperation);

      // Check for error response or empty data
      if (response?.detail || !response || !Array.isArray(response) || response.length === 0 || !response.some(item => item.measured_mean !== null && item.measured_mean !== undefined)) {
        // Only show the no measurements popup if we haven't shown it before for this operation
        if (!hasShownNoMeasurements) {
          setNoMeasurementsModal({
            visible: true,
            quantity: quantityValue,
            operation: selectedOperation
          });
          setHasShownNoMeasurements(true);
        }
        setDetailedMeasurements(null);
        setLoadingDetailedMeasurements(false);
        return;
      }

      // Check FTP approval status
      const orderId = selectedOrderId;
      const ipid = `IPID-${inspectionData?.[0]?.part_number}-${selectedOperation}`;
      
      if (ipid) {
        try {
          const ftpStatus = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
          setFtpApprovalStatus(ftpStatus);
        } catch (error) {
          console.error('Error checking FTP status:', error);
          setFtpApprovalStatus({ is_completed: false });
        }
      }
      
      // Sort the response data by ID in ascending order
      const sortedResponse = [...response].sort((a, b) => a.id - b.id);
      
      // Transform the sorted response data to match the expected format
      const transformedData = {
        order_id: selectedOrderId,
        production_order: inspectionData?.[0]?.production_order || '',
        part_number: inspectionData?.[0]?.part_number || '',
        inspection_data: [{
          operation_number: selectedOperation,
          inspections: sortedResponse.map(item => ({
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
            used_inst: item.used_inst,
            operator: item.operator,
            created_at: item.created_at,
            is_done: ftpApprovalStatus?.is_completed === true ? true : item.measured_mean !== 0
          }))
        }]
      };
      
      console.log('Sorted measurements by ID:', transformedData.inspection_data[0].inspections.map(i => i.id));
      
      setDetailedMeasurements(transformedData);
      setIsDetailedMeasurementsVisible(true);
      
    } catch (error) {
      console.error('Error fetching stage inspection data for quantity:', quantityValue, error);
      
      // Show the no measurements modal instead of the error message
      setNoMeasurementsModal({
        visible: true,
        quantity: quantityValue,
        operation: selectedOperation
      });
      setDetailedMeasurements(null);
    } finally {
      setLoadingDetailedMeasurements(false);
    }
  };

  // Function to pre-load ballooned drawings for faster display
  const preloadBalloonedDrawings = async (partNumber, operations) => {
    if (!partNumber || !operations || operations.length === 0) return;
    
    console.log('Pre-loading ballooned drawings for operations:', operations);
    
    // Pre-load drawings for all available operations
    operations.forEach(async (opNumber) => {
      const opKey = `${partNumber}-${opNumber}`;
      
      // Skip if already loaded or loading
      if (preloadedDrawings[opKey] || loadingDrawings[opKey]) return;
      
      // Set loading state
      setLoadingDrawings(prev => ({ ...prev, [opKey]: true }));
      
      try {
        const response = await qualityStore.fetchBalloonedDrawing(partNumber, opNumber);
        
        // Store the preloaded drawing
        setPreloadedDrawings(prev => ({
          ...prev,
          [opKey]: response
        }));
        
        console.log(`Pre-loaded drawing for operation ${opNumber}`);
      } catch (error) {
        console.error(`Error pre-loading drawing for operation ${opNumber}:`, error);
      } finally {
        // Clear loading state
        setLoadingDrawings(prev => ({ ...prev, [opKey]: false }));
      }
    });
  };

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
    const loadCurrentOperation = async () => {
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

          // Get the order ID from the correct location in the data structure
          // Check multiple possible locations for order_id
          const orderId = currentJob.order_id || 
                          currentJob.id || 
                          currentJob.project?.id || 
                          activeOp.operation_id;

          // Format the data to match inspection data structure
          const formattedData = {
            key: orderId,
            order_id: orderId,
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
          
          // Automatically load inspection data for the active operation
          if (orderId) {
            console.log('Auto-loading inspection data for order ID:', orderId);
            
            // Set the selected part number first
            setSelectedPartNumber(orderId);
            setSelectedOrderId(orderId);
            
            try {
              setLoading(true);
              
              // Call the master-boc endpoint to get inspection details
              const inspectionDetails = await qualityStore.fetchInspectionDetails(orderId);
              console.log('Auto-loaded inspection details:', inspectionDetails);
              
              // Format the data for the table display
              const formattedInspectionData = [{
                key: orderId,
                order_id: inspectionDetails.order_id || orderId,
                production_order: inspectionDetails.production_order || currentJob.production_order || '',
                part_number: inspectionDetails.part_number || currentJob.part_number || '',
                part_description: inspectionDetails.part_description || currentJob.part_description || '',
                operations: inspectionDetails.operations || [],
                operation_groups: inspectionDetails.operation_groups || [],
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
                formattedInspectionData[0].inspection_data = Object.values(groupedByOperation);
              }
              
              setInspectionData(formattedInspectionData);
              
              // Also update the currentOperationData to include inspection data
              const updatedCurrentOperationData = {
                ...formattedData,
                inspection_data: formattedInspectionData[0].inspection_data,
                operations: inspectionDetails.operations || formattedData.operations
              };
              setCurrentOperationData(updatedCurrentOperationData);
              
              // Pre-load ballooned drawings for faster display
              const partNumber = inspectionDetails.part_number;
              
              // Since we're in current operation mode, only preload drawing for current operation
              const currentOpStr = localStorage.getItem('activeOperation');
              if (partNumber && currentOpStr) {
                try {
                  const activeOp = JSON.parse(currentOpStr);
                  const currentOpNumber = activeOp.operation_number;
                  console.log('Pre-loading drawing only for current operation:', currentOpNumber);
                  preloadBalloonedDrawings(partNumber, [currentOpNumber]);
                } catch (error) {
                  console.error('Error parsing active operation for preloading:', error);
                }
              }
              
              console.log('Auto-loaded inspection data successfully');
              
            } catch (error) {
              console.error('Error auto-loading inspection details:', error);
              
              // Set empty data with the structure even if API call fails
              setInspectionData([{
                key: orderId,
                order_id: orderId,
                production_order: currentJob.production_order || '',
                part_number: currentJob.part_number || '',
                operations: [],
                inspection_data: []
              }]);
            } finally {
              setLoading(false);
            }
          }
        } else {
          console.log('No current job or active operation found in localStorage');
        }
      } catch (error) {
        console.error('Error loading current job data:', error);
      }
    };

    loadCurrentOperation();
  }, []); // Remove selectedPartNumber dependency to prevent loops

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
        part_description: inspectionDetails.part_description || '',
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
      
      // Pre-load ballooned drawings for faster display
      const partNumber = inspectionDetails.part_number;
      
      // Since we're in current operation mode, only preload drawing for current operation
      const currentOpStr = localStorage.getItem('activeOperation');
      if (partNumber && currentOpStr) {
        try {
          const activeOp = JSON.parse(currentOpStr);
          const currentOpNumber = activeOp.operation_number;
          console.log('Pre-loading drawing only for current operation:', currentOpNumber);
          preloadBalloonedDrawings(partNumber, [currentOpNumber]);
        } catch (error) {
          console.error('Error parsing active operation for preloading:', error);
        }
      }
      
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
            setQuantity('1'); // Initialize quantity to 1 when modal opens
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
            setQuantity('1'); // Initialize quantity to 1 when modal opens
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
        setQuantity('1'); // Initialize quantity to 1 when modal opens
        setIsOperationModalVisible(true);
      } else {
        setIsQmsModalVisible(true);
      }
    }
  };

  const handleLaunchQMS = async () => {
    try {
      setIsLaunching(true);
      
      // Close the no measurements modal first
      setNoMeasurementsModal({
        visible: false,
        quantity: null,
        operation: null
      });
      
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

  // // Mock data for inspection history
  // const inspectionHistory = [
  //   {
  //     key: '1',
  //     date: '2024-12-19',
  //     partNumber: 'PA-0678',
  //     operator: 'John Doe',
  //     operationNumber: 'OP-101',
  //     result: 'Pass',
  //     deviations: 0,
  //     remarks: 'All parameters within specification',
  //   },
  //   {
  //     key: '2',
  //     date: '2024-12-19',
  //     partNumber: 'PA-0678',
  //     operator: 'John Doe',
  //     operationNumber: 'OP-102',
  //     result: 'Fail',
  //     deviations: 2,
  //     remarks: 'Dimension out of tolerance',
  //   },
  //   {
  //     key: '3',
  //     date: '2024-12-18',
  //     partNumber: 'PA-0678',
  //     operator: 'Jane Smith',
  //     operationNumber: 'OP-101',
  //     result: 'Pass',
  //     deviations: 1,
  //     remarks: 'Minor surface finish variation',
  //   },
  // ];

  // Update the columns definition to handle current view
  const columns = useMemo(() => [
    // {
    //   title: 'Order ID',
    //   dataIndex: 'order_id',
    //   key: 'order_id',
    //   width: '8%',
    //   fixed: 'left',
    // },
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
      title: 'Part Description',
      dataIndex: 'part_description',
      key: 'part_description',
      width: '15%',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Operations',
      dataIndex: 'operations',
      key: 'operations',
      width: '25%',
      render: (operations, record) => {
        // Get current operation from localStorage to highlight it
        const getCurrentOperationNumber = () => {
          try {
            const activeOpStr = localStorage.getItem('activeOperation');
            if (activeOpStr) {
              const activeOp = JSON.parse(activeOpStr);
              return activeOp.operation_number?.toString();
            }
          } catch (error) {
            console.error('Error getting current operation:', error);
          }
          return null;
        };

        const currentOpNumber = getCurrentOperationNumber();

        // If in current operation view, filter to show only the current operation
        const opsToShow = viewMode === 'current' ? 
          (operations || []).filter(op => op.toString() === currentOpNumber) : 
          (operations || []);

        return (
          <Space wrap>
            {opsToShow.map((op) => {
              // For both views, op is the operation number
              const opNumber = op;
              const opNumberStr = opNumber?.toString();
              
              // Check if this operation exists in operation_groups
              const hasOperationData = record.operation_groups?.some(
                group => group.op_no === opNumber
              );

              // Check if this is the current operation
              const isCurrentOperation = currentOpNumber === opNumberStr;

              // Determine button styling based on conditions
              let buttonType = 'default';
              let buttonClass = 'hover:scale-105 transition-transform';

              if (hasOperationData) {
                if (isCurrentOperation) {
                  // Current operation with data - blue color
                  buttonType = 'primary';
                  buttonClass += ' bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600';
                } else {
                  // Has data but not current - green color
                  buttonType = 'primary';
                  buttonClass += ' bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600';
                }
              }

              return (
                <Button
                  key={opNumber}
                  type={buttonType}
                  icon={hasOperationData ? <CheckCircleOutlined /> : <PlusCircleOutlined />}
                  onClick={() => handleOperationClick(opNumber, record)}
                  className={buttonClass}
                >
                  {opNumber}
                </Button>
              );
            })}
          </Space>
        );
      }
    },
    {
      title: 'FTP Status',
      key: 'ftp_status',
      width: '15%',
      render: (_, record) => {
        // Create a unique key for this cell to force re-render when record changes
        const cellKey = `ftp-status-${record.order_id}-${record.operations?.join('-') || 'none'}`;
        
        return (
          <FTPStatusCell 
            key={cellKey}
            record={record}
            viewMode={viewMode}
          />
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
        loadDrawingFromPreloaded();
      }
      
      return () => {
        // Clean up blob URL when component unmounts
        if (drawingData?.url && !isPreloadedDrawing()) {
          URL.revokeObjectURL(drawingData.url);
        }
      };
    }, [isOperationModalVisible, selectedOperation]);
    
    // Check if current drawing is preloaded
    const isPreloadedDrawing = () => {
      const partNumber = inspectionData?.[0]?.part_number;
      const opKey = `${partNumber}-${selectedOperation}`;
      return preloadedDrawings[opKey] ? true : false;
    };
    
    // Function to load drawing from preloaded cache or fetch fresh
    const loadDrawingFromPreloaded = async () => {
      try {
        const partNumber = inspectionData?.[0]?.part_number;
        if (!partNumber) {
          throw new Error('No part number found');
        }
        
        const opKey = `${partNumber}-${selectedOperation}`;
        
        // Check if drawing is preloaded
        if (preloadedDrawings[opKey]) {
          console.log('Using preloaded drawing for operation', selectedOperation);
          setDrawingData(preloadedDrawings[opKey]);
          setLoadingDrawing(false);
          return;
        }
        
        // If not preloaded, check if it's currently loading
        if (loadingDrawings[opKey]) {
          console.log('Drawing is being preloaded, waiting...');
          setLoadingDrawing(true);
          
          // Wait for preloading to complete
          const checkPreloaded = setInterval(() => {
            if (preloadedDrawings[opKey]) {
              setDrawingData(preloadedDrawings[opKey]);
              setLoadingDrawing(false);
              clearInterval(checkPreloaded);
            } else if (!loadingDrawings[opKey]) {
              // Preloading failed, fetch fresh
              clearInterval(checkPreloaded);
              fetchBalloonedDrawingFresh();
            }
          }, 100);
          
          return;
        }
        
        // Fall back to fresh fetch
        console.log('Drawing not preloaded, fetching fresh for operation', selectedOperation);
        fetchBalloonedDrawingFresh();
        
      } catch (error) {
        console.error('Error loading drawing:', error);
        fetchBalloonedDrawingFresh();
      }
    };
    
    // Function to fetch ballooned drawing fresh (fallback)
    const fetchBalloonedDrawingFresh = async () => {
      try {
        setLoadingDrawing(true);
        
        // Get the part number from the inspection data
        const partNumber = inspectionData?.[0]?.part_number;
        if (!partNumber) {
          throw new Error('No part number found');
        }
        
        // Use the part number as the drawing ID and the selected operation
        const response = await qualityStore.fetchBalloonedDrawing(partNumber, selectedOperation);
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
        
        console.log(`Fetching stage inspection for order ID: ${inspectionId}, operation: ${selectedOperation}`);
        
        // Call the fetchStageInspectionByOperation method from quality-store.js
        const response = await qualityStore.fetchStageInspectionByOperation(inspectionId, selectedOperation);
        console.log('Stage inspection data received:', response);

        // Check FTP approval status
        const orderId = inspectionId;
        const ipid = `IPID-${inspectionData?.[0]?.part_number}-${selectedOperation}`;
        
        if (ipid) {
          console.log('Checking FTP status for orderId:', orderId, 'ipid:', ipid);
          
          try {
            const ftpStatus = await qualityStore.checkFTPApprovalStatus(orderId, ipid);
            console.log('FTP Status received:', ftpStatus);
            setFtpApprovalStatus(ftpStatus);
          } catch (error) {
            console.error('Error checking FTP status:', error);
            // Remove the error message popup
            setFtpApprovalStatus({ is_completed: false });
          }
        }
        
        // Sort the response data by ID in ascending order
        const sortedResponse = [...response].sort((a, b) => a.id - b.id);
        
        // Transform the sorted response data to match the expected format
        const transformedData = {
          order_id: inspectionId,
          production_order: inspectionData?.[0]?.production_order || '',
          part_number: inspectionData?.[0]?.part_number || '',
          inspection_data: [{
            operation_number: selectedOperation,
            inspections: sortedResponse.map(item => ({
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
        
        console.log('Sorted measurements by ID in fetchDetailedMeasurements:', transformedData.inspection_data[0].inspections.map(i => i.id));
        
        setDetailedMeasurements(transformedData);
        setIsDetailedMeasurementsVisible(true);
        
      } catch (error) {
        console.error('Error fetching stage inspection data:', error);
        message.error(`Failed to load measurements: ${error.message}`);
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
      }
    ];
    
    // Detailed columns for View Measurements modal
    const detailedColumns = [
      {
        title: 'S.No',
        key: 'sno',
        width: '5%',
        fixed: 'left',
        render: (text, record, index) => {
          const current = pagination.current || 1;
          const pageSize = pagination.pageSize || 10;
          return (current - 1) * pageSize + index + 1;
        },
      },
      {
        title: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        width: '8%',
        fixed: 'left',
        render: (zone) => (
          <Tag color="blue" className="zone-tag">{zone || 'N/A'}</Tag>
        )
      },
      {
        title: 'Description',
        dataIndex: 'dimension_type',
        key: 'dimension_type',
        width: '15%',
        render: (type) => {
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
        width: '10%',
        render: (value) => (
          <span className="font-mono font-medium">{value || '-'}</span>
        )
      },
      {
        title: 'Upper Tol',
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
        title: 'Lower Tol',
        dataIndex: 'lowertol',
        key: 'lowertol',
        width: '8%',
        render: (value) => (
          <span className="font-mono text-red-600 font-medium">
            {value}
          </span>
        )
      },
      {
        title: 'Measured 1',
        dataIndex: 'measured_1',
        key: 'measured_1',
        width: '8%',
        render: (value) => (
          <span className="font-mono">{value || '-'}</span>
        )
      },
      {
        title: 'Measured 2',
        dataIndex: 'measured_2',
        key: 'measured_2',
        width: '8%',
        render: (value) => (
          <span className="font-mono">{value || '-'}</span>
        )
      },
      {
        title: 'Measured 3',
        dataIndex: 'measured_3',
        key: 'measured_3',
        width: '8%',
        render: (value) => (
          <span className="font-mono">{value || '-'}</span>
        )
      },
      {
        title: 'Mean',
        dataIndex: 'measured_mean',
        key: 'measured_mean',
        width: '8%',
        render: (value) => (
          <span className="font-mono font-semibold">{value || '-'}</span>
        )
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
        title: 'Used Instrument',
        dataIndex: 'used_inst',
        key: 'used_inst',
        width: '15%',
        render: (value, record) => {
          console.log('Record:', record);
          const usedInstrument = record.used_inst || record.instrument_used;
          return (
            <Tag color="purple">
              {usedInstrument || 'N/A'}
            </Tag>
          );
        }
      },
      {
        title: 'Operator',
        dataIndex: 'operator',
        key: 'operator',
        width: '12%',
        render: (operator) => (
          <div className="text-sm">
            <div>{operator?.username || 'N/A'}</div>
            <div className="text-gray-500 text-xs">{operator?.email || ''}</div>
          </div>
        )
      },
      {
        title: 'Date',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '12%',
        render: (date) => {
          if (!date) return <div className="text-sm">N/A</div>;
          
          const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          };
          
          return <div className="text-sm">{formatDate(date)}</div>;
        }
      },
      // {
      //   title: 'Status',
      //   key: 'status',
      //   width: '10%',
      //   fixed: 'right',
      //   render: (_, record) => {
      //     const mean = parseFloat(record.measured_mean);
      //     const nominal = parseFloat(record.nominal_value);
      //     const upperTol = parseFloat(record.uppertol) || 0;
      //     const lowerTol = parseFloat(record.lowertol) || 0;
          
      //     if (isNaN(mean)) {
      //       return <Tag color="default">Not Measured</Tag>;
      //     }
          
      //     const upperLimit = nominal + upperTol;
      //     const lowerLimit = nominal + lowerTol;
          
      //     if (mean >= lowerLimit && mean <= upperLimit) {
      //       return <Tag color="success" icon={<CheckCircleOutlined />}>OK</Tag>;
      //     } else {
      //       return <Tag color="error" icon={<CloseCircleOutlined />}>NG</Tag>;
      //     }
      //   }
      // }
    ];

    // Simplified columns for the left side table (Measurement Details popup)
    const simplifiedColumns = [
      {
        title: 'S.No',
        key: 'sno',
        width: '8%',
        fixed: 'left',
        render: (text, record, index) => {
          const current = pagination.current || 1;
          const pageSize = pagination.pageSize || 10;
          return (current - 1) * pageSize + index + 1;
        },
      },
      {
        title: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        width: '12%',
        fixed: 'left',
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
        width: '15%',
        render: (value) => (
          <span className="font-mono font-medium">{value || '-'}</span>
        )
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

  const DetailedMeasurementsModal = () => {
    const getOperationMeasurements = () => {
      if (!detailedMeasurements || !detailedMeasurements.inspection_data) {
        return [];
      }
      
      const operationData = detailedMeasurements.inspection_data.find(
        data => data.operation_number === parseInt(selectedOperation, 10) || 
               data.operation_number === selectedOperation
      );
      
      // Ensure measurements are always sorted by ID in ascending order
      const measurements = operationData?.inspections || [];
      return [...measurements].sort((a, b) => a.id - b.id);
    };
    
    const measurements = getOperationMeasurements();
    console.log('Measurements data:', measurements);
    
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
                {inspectionData?.[0]?.production_order || detailedMeasurements?.production_order || 'N/A'} | 
                {inspectionData?.[0]?.part_number || detailedMeasurements?.part_number || 'N/A'}
              </Text>
            </div>
          </div>
        }
        open={isDetailedMeasurementsVisible}
        onCancel={() => setIsDetailedMeasurementsVisible(false)}
        width={1800}
        style={{ top: 20 }}
        bodyStyle={{ padding: '24px', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
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
          ) : (
            <div>
              {/* Quantity input always present */}
              <div className="mb-4">
                <Text strong className="mr-3">Qty:</Text>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    e.preventDefault();
                    handleQuantityChange(e.target.value);
                  }}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    if (quantity) {
                      handleQuantityChange(quantity);
                    }
                  }}
                  placeholder="Enter quantity"
                  style={{ width: '150px' }}
                  className="ml-2"
                  min={1}
                />
              </div>

              {measurements && measurements.length > 0 ? (
                <div>
                  <div className="mb-4 p-4 rounded" style={{
                    backgroundColor: !ftpApprovalStatus 
                      ? '#fffbeb' 
                      : ['rejected', 'Rejected'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status)
                        ? '#fef2f2'
                        : ['approved', 'Approved'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status)
                          ? '#f0fdf4'
                          : '#fffbeb',
                    borderLeft: '4px solid ' + (
                      !ftpApprovalStatus 
                        ? '#f59e0b' 
                        : ['rejected', 'Rejected'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status)
                          ? '#ef4444'
                          : ['approved', 'Approved'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status)
                            ? '#10b981'
                            : '#f59e0b'
                    )
                  }}>
                    <div className="flex items-center gap-2">
                      <Text strong style={{
                        color: !ftpApprovalStatus 
                          ? '#92400e' 
                          : ['rejected', 'Rejected'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status)
                            ? '#991b1b'
                            : ['approved', 'Approved'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status)
                              ? '#065f46'
                              : '#92400e'
                      }}>Operation Status: </Text>
                      {!ftpApprovalStatus ? (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                          Loading...
                        </Tag>
                      ) : (
                        <>
                          {['rejected', 'Rejected'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status) ? (
                            <Tag color="error" icon={<CloseCircleOutlined />}>
                              Rejected
                            </Tag>
                          ) : ['approved', 'Approved'].includes(ftpApprovalStatus.Status || ftpApprovalStatus.status) ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              Approved
                            </Tag>
                          ) : (
                            <Tag color="warning" icon={<ClockCircleOutlined />}>
                              {['na', 'NA', null, undefined, ''].includes(ftpApprovalStatus?.Status || ftpApprovalStatus?.status) 
                                ? 'Pending' 
                                : ftpApprovalStatus?.Status || ftpApprovalStatus?.status || 'Pending'}
                            </Tag>
                          )}
                          {ftpApprovalStatus?.updated_at && (
                            <Text type="secondary" className="ml-4">
                              Last Updated: {new Date(ftpApprovalStatus.updated_at).toLocaleString()}
                            </Text>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Table
                    columns={isDetailedMeasurementsVisible ? detailedColumns : simplifiedColumns}
                    dataSource={measurements}
                    rowKey={record => record.id || `${record.zone}-${record.dimension_type}`}
                    bordered
                    size="middle"
                    scroll={{ x: 'max-content', y: 600 }}
                    pagination={{
                      ...pagination,
                      total: measurements.length,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} items`,
                      onChange: (page, pageSize) => {
                        setPagination(prev => ({ ...prev, current: page, pageSize }));
                      },
                      onShowSizeChange: (current, size) => {
                        setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                      }
                    }}
                    className="detailed-measurements-table"
                    style={{ 
                      width: '100%',
                      overflowX: 'auto'
                    }}
                  />
                </div>
              ) : (
                <Empty 
                  description={
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">No measurements found for Operation {selectedOperation} , quantity {quantity}</p>
                      <div className="flex justify-center gap-4 mt-8">
            <Button 
              onClick={() => setNoMeasurementsModal({...noMeasurementsModal, visible: false})}
              className="px-6"
            >
              Close
            </Button>
            <Button 
              type="primary" 
              onClick={handleLaunchQMS}
              loading={isLaunching}
              icon={<RocketOutlined />}
              className="px-6"
            >
              Launch QMS
            </Button>
          </div>
                    </div>
                  }
                  className="my-12"
                />
              )}
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
          setQuantity(''); // Reset quantity when modal closes
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
              setQuantity(''); // Reset quantity when modal closes
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
                        onClick={() => handleQuantityChange(1)}
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
          
          // Get the order ID from the correct location in the data structure
          // Check multiple possible locations for order_id
          const orderId = currentJob.order_id || 
                          currentJob.id || 
                          currentJob.project?.id || 
                          activeOp.operation_id;
          
          const formattedData = {
            key: orderId,
            order_id: orderId,
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
            {/* <Space wrap className="w-full md:w-auto">
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
            </Space> */}
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
                {/* Hide the toggle switch - show only current operation mode */}
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
            ) : inspectionData && inspectionData.length > 0 ? (
              <div style={{ maxWidth: '95%', margin: '0 auto' }}>
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
                    <p>No inspection data available for the current operation</p>
                    <p className="text-sm">Please make sure inspection data is loaded</p>
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
      
      {/* No Measurements Found Modal */}
      
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