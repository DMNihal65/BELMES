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
  Switch
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
  CloseCircleOutlined
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

  const hasIpid = inspectionDetails?.operation_groups?.length > 0;

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
      const drawingId = '10582891'; // Your drawing ID
      const operationId = '10'; // Your operation ID
      const data = await qualityStore.fetchBalloonedDrawing(drawingId, operationId);
      setDrawingData(data);
    } catch (error) {
      message.error('Failed to load drawing');
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
      
      // Fetch and show drawing
      try {
        setLoadingDrawing(true);
        const data = await qualityStore.fetchBalloonedDrawing(
          inspectionDetails.production_order, 
          op
        );
        setDrawingData(data);
      } catch (error) {
        message.error('Failed to load drawing');
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

  // Create summary data from the response
  const summaryData = hasData ? [{
    key: 'summary',
    order_id: inspectionDetails.order_id,
    production_order: inspectionDetails.production_order,
    part_number: inspectionDetails.part_number,
    operations: inspectionDetails.operations || []
  }] : [];

  const summaryColumns = [
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: '15%',
      render: (text) => (
        <Tag color="blue" className="text-md px-3 py-1">
          {text}
        </Tag>
      )
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: '20%',
      render: (text) => (
        <Typography.Text strong>
          {text}
        </Typography.Text>
      )
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: '20%'
    },
    {
      title: 'Operations',
      key: 'operations',
      width: '45%',
      render: (_, record) => (
        <Space wrap size="middle">
          {(record.operations || []).map(op => {
            // Check if operation has measurements in operation_groups
            const hasOperationData = inspectionDetails?.operation_groups?.some(
              group => group.op_no === op && group.details
            );

            return (
              <Button 
                key={op}
                type={selectedOperation === op ? 'primary' : 'default'}
                onClick={() => handleOperationClick(op)}
                icon={hasOperationData ? <EyeOutlined /> : <FileSearchOutlined />}
                className={`
                  transition-all duration-300
                  ${hasOperationData 
                    ? 'bg-green-100 hover:bg-green-200 border-green-200 hover:border-green-300 text-green-700' 
                    : 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200 hover:border-yellow-300 text-yellow-700'}
                `}
              >
                <span>OP {op}</span>
              </Button>
            );
          })}
        </Space>
      )
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
          title={
            <div className="flex justify-between items-center w-full">
              <Typography.Title level={4} className="mb-0">
                Inspection Details
              </Typography.Title>
              <Tag 
                color={hasData ? "success" : "error"} 
                className="px-3 py-1"
              >
                {hasData ? "Data Available" : "No Data"}
              </Tag>
            </div>
          }
        >
          <Table
            columns={summaryColumns}
            dataSource={summaryData}
            pagination={false}
            size="middle"
            loading={loading}
          />
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
      children: <InspectionReport />
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

    return {
      ipid: operationData[0]?.ipid || 'No IPID',
      operation_number: selectedOperation,
      details: operationData.map((item, index) => ({
        key: index,
        zone: item.details?.zone || '',
        dimension_type: item.details?.dimension_type || '',
        nominal: item.details?.nominal || '',
        uppertol: item.details?.uppertol || '',
        lowertol: item.details?.lowertol || '',
        measured_instrument: item.details?.measured_instrument || ''
      }))
    };
  };

  const renderOperationDetails = () => {
    const data = getOperationDetails();
    if (!data) return null;

    const columns = [
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
          scroll={{ x: 800, y: 400 }}
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
          <Text strong className="mr-4">IPID No.: {data.ipid}</Text>
          <Text strong className="mr-4">Part No.: {inspectionDetails.part_number}</Text>
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
    if (!inspectionDetails?.order_id) return;

    try {
      // Show loading indicator
      message.loading({ content: 'Loading measured data...', key: 'measuredDataLoading' });
      
      // Fetch inspection data using the quality store
      const response = await qualityStore.fetchInspectionByOrderId(inspectionDetails.order_id);
      
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

  // Function to prepare flat data from the nested structure
  const prepareInspectionData = () => {
    if (!measuredData || !measuredData.inspection_data) return [];
    
    // Flatten the nested structure for table display
    const flatData = [];
    
    measuredData.inspection_data.forEach(operationData => {
      const operationNumber = operationData.operation_number;
      
      if (operationData.inspections && operationData.inspections.length > 0) {
        operationData.inspections.forEach(inspection => {
          flatData.push({
            ...inspection,
            operation_number: operationNumber,
            key: `${operationNumber}-${inspection.id}`
          });
        });
      }
    });
    
    return flatData;
  };

  // Function to render the measured data modal
  const renderMeasuredDataModal = () => (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileSearchOutlined className="text-blue-500" />
          <span>Measured Inspection Data</span>
        </div>
      }
      visible={isMeasuredDataModalVisible}
      onCancel={() => setIsMeasuredDataModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setIsMeasuredDataModalVisible(false)}>
          Close
        </Button>
      ]}
      width={1200}
      className="measured-data-modal"
    >
      <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Order ID:</Text> {measuredData?.order_id || '-'}
          </Col>
          <Col span={8}>
            <Text strong>Production Order:</Text> {measuredData?.production_order || '-'}
          </Col>
          <Col span={8}>
            <Text strong>Part Number:</Text> {measuredData?.part_number || '-'}
          </Col>
        </Row>
      </div>

      {measuredData && measuredData.inspection_data && measuredData.inspection_data.length > 0 ? (
        <Table
          columns={[
            { 
              title: 'Operation',
              dataIndex: 'operation_number',
              key: 'operation_number',
              width: 90,
              fixed: 'left',
              render: (opNum) => <Tag color="purple">OP {opNum}</Tag>,
              filters: measuredData.inspection_data.map(op => ({
                text: `OP ${op.operation_number}`,
                value: op.operation_number
              })),
              onFilter: (value, record) => record.operation_number === value
            },
            { 
              title: 'ID',
              dataIndex: 'id',
              key: 'id',
              width: 70,
              render: (id) => <Tag color="blue">{id}</Tag>
            },
            { 
              title: 'Zone',
              dataIndex: 'zone',
              key: 'zone',
              width: 80,
              render: (zone) => zone || '-'
            },
            { 
              title: 'Type',
              dataIndex: 'dimension_type',
              key: 'dimension_type',
              width: 120,
              render: (type) => <Tag color="cyan">{type || 'Unknown'}</Tag>
            },
            { 
              title: 'Nominal',
              dataIndex: 'nominal_value',
              key: 'nominal_value',
              width: 100,
              render: (value) => <Text strong>{value || '-'}</Text>
            },
            { 
              title: 'Upper Tol',
              dataIndex: 'uppertol',
              key: 'uppertol',
              width: 90,
              render: (value) => <Text type="success">+{value || '0'}</Text>
            },
            { 
              title: 'Lower Tol',
              dataIndex: 'lowertol',
              key: 'lowertol',
              width: 90,
              render: (value) => <Text type="danger">{value || '0'}</Text>
            },
            { 
              title: 'Measured 1',
              dataIndex: 'measured_1',
              key: 'measured_1',
              width: 100,
              render: (value) => value || '-'
            },
            { 
              title: 'Measured 2',
              dataIndex: 'measured_2',
              key: 'measured_2',
              width: 100,
              render: (value) => value || '-'
            },
            { 
              title: 'Measured 3',
              dataIndex: 'measured_3',
              key: 'measured_3',
              width: 100,
              render: (value) => value || '-'
            },
            { 
              title: 'Mean',
              dataIndex: 'measured_mean',
              key: 'measured_mean',
              width: 100,
              render: (value) => <Text strong type="warning">{value || '-'}</Text>
            },
            { 
              title: 'Instrument',
              dataIndex: 'measured_instrument',
              key: 'measured_instrument',
              width: 120,
              render: (value) => value || '-'
            },
            {
              title: 'Quantity',
              dataIndex: 'quantity_no',
              key: 'quantity_no',
              width: 90,
              render: (value) => <Tag color="orange">{value || '1'}</Tag>
            },
            {
              title: 'Date',
              dataIndex: 'created_at',
              key: 'created_at',
              width: 160,
              render: (value) => value ? moment(value).format('DD-MM-YYYY HH:mm') : '-'
            },
            { 
              title: 'Status',
              key: 'status',
              width: 100,
              render: (_, record) => {
                // First check if the measurement is done
                if (record.is_done === true) {
                  const nominal = parseFloat(record.nominal_value) || 0;
                  const mean = parseFloat(record.measured_mean) || 0;
                  const upperTol = parseFloat(record.uppertol) || 0;
                  const lowerTol = parseFloat(record.lowertol) || 0;
                  
                  // Special handling for non-numeric nominal values (like threads "M5")
                  if (isNaN(nominal)) {
                    return <Badge status="processing" text="Inspected" />;
                  }
                  
                  // Check if measurement is within tolerance
                  const inTolerance = mean >= (nominal + lowerTol) && mean <= (nominal + upperTol);
                  
                  return inTolerance ? 
                    <Badge status="success" text="Within Spec" /> : 
                    <Badge status="error" text="Out of Spec" />;
                } else if (record.is_done === false) {
                  return <Badge status="error" text="Not Approved" />;
                } else {
                  return <Badge status="warning" text="Pending" />;
                }
              }
            },
            { 
              title: 'Operator',
              dataIndex: 'operator',
              key: 'operator',
              width: 120,
              fixed: 'right',
              render: (operator) => operator?.username || '-'
            },
            {
              title: 'Approve',
              key: 'action',
              width: 120,
              fixed: 'right',
              render: (_, record) => {
                // Check if we already have a status for this record
                const status = approvedStatus[record.id];
                const isLoading = approvingIds[record.id];
                
                // If item is loading, show loading spinner
                if (isLoading) {
                  return <Spin size="small" />;
                }
                
                // Get the correct checked state based on record data or local state
                let isChecked = false;
                
                // First check if record has direct is_done value
                if (record.is_done === true) {
                  isChecked = true;
                } else if (record.is_done === false) {
                  isChecked = false;
                } 
                // Then check local state if no direct value
                else if (status === 'approved') {
                  isChecked = true;
                } else if (status === 'rejected') {
                  isChecked = false;
                }
                
                // Return a single switch with appropriate checked state
                return (
                  <Switch
                    checked={isChecked}
                    onChange={(checked) => handleApproveReject(record.id, checked)}
                    checkedChildren="Done"
                    unCheckedChildren="Not Done"
                  />
                );
              }
            }
          ]}
          dataSource={prepareInspectionData()}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 1300, y: 500 }}
          bordered
        />
      ) : (
        <Empty 
          description={
            <div>
              <p>No measurement data available</p>
              <small>No data has been recorded for this inspection yet</small>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      )}
    </Modal>
  );

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
            <Space>
              <Button
                type="primary"
                icon={<FileSearchOutlined />}
                onClick={handleViewMeasuredData} // Call the new function
              >
                View Measured Data
              </Button>
            </Space>
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
            {loadingDrawing ? (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Spin size="large" />
                  <div className="mt-4 text-gray-500">Loading drawing...</div>
                </div>
              </div>
            ) : drawingData ? (
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
  );

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
    }
  }, [orderId]);

  // Add missing fetchMeasuredData function
  const fetchMeasuredData = async () => {
    if (!orderId) return;
    
    try {
      const response = await qualityStore.fetchInspectionByOrderId(orderId);
      if (response && response.inspection_data && response.inspection_data.length > 0) {
        setMeasuredData(response);
        
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
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="p-4">
        <Tabs 
          defaultActiveKey="details" 
          type="card"
          className="bg-white rounded-lg shadow-sm"
          items={items}
        />

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
`;

export default QualityInspectionDetails;



