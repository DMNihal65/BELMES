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
import { EyeOutlined, FileSearchOutlined, FileTextOutlined, FilePdfOutlined, AppstoreOutlined } from '@ant-design/icons';
import moment from 'moment';
import InspectionReport from './InspectionReport';
// import { launchQMSApplication } from '../../../utils/qmsLauncher';

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

  const handleLaunchQMS = () => {
    try {
      // Using the registered protocol to launch QMS from the correct path
      window.location.href = `myapp://launch-qms?path=D:\\BEL\\BELMES\\quality\\qms.exe`;
      
      message.info({
        content: 'Launching QMS application...',
        duration: 3
      });

      // Close the modal after launching
      setIsQmsModalVisible(false);
    } catch (error) {
      console.error('Failed to launch QMS:', error);
      message.error({
        content: 'Failed to launch QMS. Please ensure the application is properly installed.',
        duration: 5
      });
    }
  };

  const summaryColumns = [
    {
      title: 'IPID No.',
      dataIndex: 'ipid_no',
      key: 'ipid_no',
      width: '15%',
      render: () => {
        const ipidNumber = getIpidNumber();
        return (
          <Tag color={hasIpid ? 'blue' : 'default'} className="text-md px-3 py-1">
            {ipidNumber || 'No IPID'}
          </Tag>
        );
      }
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: '20%',
      render: (text) => (
        <Typography.Text disabled={!hasIpid} strong>
          {text}
        </Typography.Text>
      )
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: '20%',
      render: (text) => (
        <Typography.Text disabled={!hasIpid}>
          {text}
        </Typography.Text>
      )
    },
    {
      title: 'Operations',
      key: 'operations',
      width: '30%',
      render: (_, record) => (
        <Space wrap size="middle">
          {(record.operations || []).map(op => {
            // Check if operation has measurements
            const hasOperationMeasurements = inspectionDetails?.operation_groups?.some(
              group => group.op_no === op && group.details
            );

            return (
              <Button 
                key={op}
                type={selectedOperation === op ? 'primary' : 'default'}
                onClick={() => handleOperationClick(op)}
                icon={hasOperationMeasurements ? <EyeOutlined /> : <FileSearchOutlined />}
                className={`
                  transition-all duration-300
                  ${hasOperationMeasurements 
                    ? 'bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700' 
                    : 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200 hover:border-yellow-300'}
                  ${selectedOperation === op ? 'shadow-md' : 'hover:shadow-sm'}
                `}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '32px',
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: hasOperationMeasurements ? '500' : 'normal'
                }}
              >
                <span>Operation {op}</span>
                {hasOperationMeasurements && (
                  <Badge 
                    count={inspectionDetails?.operation_groups?.filter(group => group.op_no === op).length} 
                    className="ml-1"
                    style={{ 
                      backgroundColor: '#fff',
                      color: '#16a34a',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                )}
              </Button>
            );
          })}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space>
          {!hasIpid ? (
            <Button 
              type="primary"
              icon={<FileSearchOutlined />}
              onClick={() => setIsQmsModalVisible(true)}
              className="hover:shadow-md transition-all duration-300"
            >
              Open QMS
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={() => generatePDF(record)}
              className="bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600 hover:shadow-md transition-all duration-300"
            >
              Report
            </Button>
          )}
        </Space>
      )
    }
  ];

  // Create summary data with IPID number
  const summaryData = inspectionDetails ? [{
    key: 'summary',
    ipid_no: getIpidNumber() || 'No IPID',
    order_id: inspectionDetails.order_id || selectedPart?.value || '',
    production_order: inspectionDetails.production_order || selectedPart?.partDetails?.production_order || '',
    part_number: inspectionDetails.part_number || selectedPart?.partDetails?.part_number || '',
    operations: inspectionDetails.operations || selectedPart?.partDetails?.operations || []
  }] : [];

  // Style for the entire table when no IPID
  const tableStyle = !hasIpid ? {
    opacity: 0.8,
    backgroundColor: '#f5f5f5'
  } : {};

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
      open={isQmsModalVisible}
      onCancel={() => setIsQmsModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setIsQmsModalVisible(false)}>
          Cancel
        </Button>,
        <Button 
          key="launch" 
          type="primary" 
          onClick={handleLaunchQMS}
          icon={<AppstoreOutlined />}
        >
          Open QMS Software
        </Button>
      ]}
    >
      <div className="space-y-4">
        <p>No measurement data is available for Operation {selectedOperation}.</p>
        <p>Would you like to open the QMS software to view or add measurements?</p>
        <Alert
          message="Note"
          description="This will launch the QMS application installed on your system."
          type="info"
          showIcon
        />
      </div>
    </Modal>
  );

  return (
    <div className="p-4">
      <Tabs 
        defaultActiveKey="details" 
        type="card"
        className="bg-white rounded-lg shadow-sm"
      >
        <TabPane 
          tab={
            <span className="px-2">
              <FileTextOutlined /> Inspection Details
            </span>
          } 
          key="details"
        >
          <Card 
            className={`
              ${!hasIpid ? 'bg-gray-50' : 'bg-white'} 
              transition-all duration-300 hover:shadow-md
            `}
            title={
              <div className="flex justify-between items-center">
                <Typography.Title level={4} className="mb-0">
                  Inspection Details
                </Typography.Title>
                {hasIpid && (
                  <Tag color="green" className="px-3 py-1">
                    IPID Available
                  </Tag>
                )}
              </div>
            }
          >
            <Table
              columns={summaryColumns}
              dataSource={summaryData}
              pagination={false}
              size="middle"
              loading={loading}
              className={!hasIpid ? 'no-ipid-table' : ''}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span className="px-2">
              <FilePdfOutlined /> Inspection Report
            </span>
          } 
          key="report"
        >
          <InspectionReport />
        </TabPane>
      </Tabs>

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