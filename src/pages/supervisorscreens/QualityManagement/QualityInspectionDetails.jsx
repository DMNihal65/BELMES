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
  Empty
} from 'antd';
import { EyeOutlined, FileSearchOutlined, FileTextOutlined, FilePdfOutlined, AppstoreOutlined, LoadingOutlined, DownloadOutlined } from '@ant-design/icons';
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
  openQMSSoftware 
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
      const response = await qualityStore.fetchInspectionByOrderId(inspectionDetails.order_id); // Pass the order_id instead of operation number
      setMeasuredData(response[0]); // Set the fetched data to state
      setIsMeasuredDataModalVisible(true); // Open the measured data modal
    } catch (error) {
      message.error('Failed to load measured data');
      console.error('Error loading measured data:', error);
    }
  };

  // Function to render the measured data modal
  const renderMeasuredDataModal = () => (
    <Modal
      title="Measured Data"
      visible={isMeasuredDataModalVisible}
      onCancel={() => setIsMeasuredDataModalVisible(false)}
      footer={null}
      width={800}
      className="measured-data-modal"
    >
      {measuredData ? (
        <Table
          columns={[
            { title: 'Operation Number', dataIndex: 'operation_number', key: 'operation_number' },
            { title: 'Nominal Value', dataIndex: 'nominal_value', key: 'nominal_value' },
            { title: 'Upper Tol', dataIndex: 'uppertol', key: 'uppertol' },
            { title: 'Lower Tol', dataIndex: 'lowertol', key: 'lowertol' },
            { title: 'Zone', dataIndex: 'zone', key: 'zone' },
            { title: 'Dimension Type', dataIndex: 'dimension_type', key: 'dimension_type' },
            { title: 'Measured Instrument', dataIndex: 'measured_instrument', key: 'measured_instrument' },
            { title: 'Measured 1', dataIndex: 'measured_1', key: 'measured_1' },
            { title: 'Measured 2', dataIndex: 'measured_2', key: 'measured_2' },
            { title: 'Measured 3', dataIndex: 'measured_3', key: 'measured_3' },
            { title: 'Measured Mean', dataIndex: 'measured_mean', key: 'measured_mean' },
          ]}
          dataSource={measuredData.inspection_data} // Assuming inspection_data contains the relevant data
          pagination={false}
          size="small"
        />
      ) : (
        <Empty description="No measured data available" />
      )}
    </Modal>
  );

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

  // Add these styles to your CSS
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
    }

    .measured-data-modal .ant-modal-header {
      background-color: #f0f2f5;
    }

    .measured-data-modal .ant-table {
      border-radius: 8px;
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



