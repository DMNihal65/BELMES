import React, { useState } from 'react';
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
  Tabs
} from 'antd';
import { EyeOutlined, FileSearchOutlined, FileTextOutlined, FilePdfOutlined, AppstoreOutlined, LoadingOutlined } from '@ant-design/icons';
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

  const hasIpid = inspectionDetails?.operation_groups?.length > 0;

  // Get IPID number from operation groups
  const getIpidNumber = () => {
    if (!hasIpid) return null;
    // Get the first operation group's IPID
    return inspectionDetails.operation_groups[0]?.ipid;
  };

  const handleOperationClick = async (op) => {
    setSelectedOperation(op);
    
    // Check if the operation has measurements in operation_groups
    const operationData = inspectionDetails?.operation_groups?.filter(
      group => group.op_no === op && group.details
    );

    if (operationData && operationData.length > 0) {
      // Operation has measurements, show measurements modal
      setOperationMeasurements(operationData);
      setIsModalVisible(true);
    } else {
      // Operation has no measurements, show QMS modal
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
      <div className="border-b pb-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div>
            <div className="mb-2 flex">
              <Text strong className="w-24">IPID No.:</Text>
              <Text>{data.ipid}</Text>
            </div>
            <div className="mb-2 flex">
              <Text strong className="w-24">Part No.:</Text>
              <Text>{inspectionDetails.part_number}</Text>
            </div>
            <div className="mb-2 flex">
              <Text strong className="w-24">Date:</Text>
              <Text>{moment().format('DD-MM-YYYY')}</Text>
            </div>
            <div className="mb-2 flex">
              <Text strong className="w-24">Time:</Text>
              <Text>{moment().format('HH:mm A')}</Text>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="mb-2 flex">
              <Text strong className="w-32">Order No. - Batch No.:</Text>
              <Text>{inspectionDetails.production_order}</Text>
            </div>
            <div className="mb-2 flex">
              <Text strong className="w-32">Operation No.:</Text>
              <Text>{data.operation_number}</Text>
            </div>
            <div className="mb-2 flex">
              <Text strong className="w-32">Sheet No.:</Text>
              <Text>1</Text>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-4">
          <Text strong className="block mb-2">Info:</Text>
          <ul className="list-disc pl-5 text-sm">
            <li>Entry to be made in all the fields highlighted in yellow</li>
            <li>In Case of 3D PDF drawing or Drawing with '10 off' less dimensions, Drg. Zone is not Mandatory</li>
            <li>Additional observations can be noted in the designated area at the bottom of the page</li>
            <li>Text of OK measurement values turn to green colour & Not OK values turn to Red colour</li>
          </ul>
        </div>
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

        {/* Existing Measurements Modal */}
        <Modal
          title={`Operation ${selectedOperation} Measurements`}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          width={1000}
          footer={null}
        >
          {renderModalHeader()}
          {renderOperationDetails()}
        </Modal>
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