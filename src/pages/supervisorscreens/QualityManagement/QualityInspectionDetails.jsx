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
  Divider 
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

const QualityInspectionDetails = ({ 
  selectedPart, 
  inspectionDetails, 
  loading
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);

  // Summary columns for the order details
  const summaryColumns = [
    {
      title: 'IPID No.',
      dataIndex: 'ipid_no',
      key: 'ipid_no',
      width: '12%',
      render: () => 'Null'  // or you can use '-' or 'N/A'
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: '12%',
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
      key: 'operations',
      width: '37%',
      render: (_, record) => (
        <Space wrap size="middle" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {record.operations.map(op => (
            <Button 
              key={op}
              type={selectedOperation === op ? 'primary' : 'default'}
              onClick={() => {
                setSelectedOperation(op);
                setIsModalVisible(true);
              }}
              style={{ marginBottom: 8 }}
            >
              Operation {op}
            </Button>
          ))}
        </Space>
      ),
    },
    {
      title: 'Inspection Details',
      key: 'inspection_details',
      width: '15%',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>Total Operations: {record.operations.length}</Text>
          <Text>
            Status: <Tag color="processing">In Progress</Tag>
          </Text>
        </Space>
      ),
    }
  ];

  // Create a single row of summary data
  const summaryData = inspectionDetails ? [{
    key: 'summary',
    ipid_no: null,  // Added IPID No field
    order_id: inspectionDetails.order_id,
    production_order: inspectionDetails.production_order,
    part_number: inspectionDetails.part_number,
    operations: inspectionDetails.operations
  }] : [];

  const getOperationDetails = () => {
    if (!selectedOperation || !inspectionDetails) return null;
    return inspectionDetails.inspection_data.find(
      op => op.operation_number === selectedOperation
    );
  };

  const renderInspectionDetails = () => {
    const operationData = getOperationDetails();
    if (!operationData) return null;

    const columns = [
      {
        title: 'Sl. No.',
        dataIndex: 'id',
        key: 'id',
        width: 80,
        fixed: 'left',
      },
      {
        title: 'Description',
        dataIndex: 'dimension_type',
        key: 'dimension_type',
        width: 150,
        fixed: 'left',
      },
      {
        title: 'Nominal',
        dataIndex: 'nominal_value',
        key: 'nominal_value',
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
        title: 'Zone',
        dataIndex: 'zone',
        key: 'zone',
        width: 100,
      },
      {
        title: 'Measurement 1',
        dataIndex: 'measured_1',
        key: 'measured_1',
        width: 120,
      },
      {
        title: 'Measurement 2',
        dataIndex: 'measured_2',
        key: 'measured_2',
        width: 120,
      },
      {
        title: 'Measurement 3',
        dataIndex: 'measured_3',
        key: 'measured_3',
        width: 120,
      },
      {
        title: 'Mean',
        dataIndex: 'measured_mean',
        key: 'measured_mean',
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
      <Table
        columns={columns}
        dataSource={operationData.inspections}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1500, y: 500 }}
        size="small"
      />
    );
  };

  const renderIPIDHeader = () => {
    return (
      <Card className="mb-4">
        <Title level={4}>FABRICATION COMPONENTS</Title>
        <Text type="secondary">IN PROCESS INSPECTION DOCUMENT (IPID)</Text>
        <Divider />
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <Row>
              <Col span={8}><Text strong>IPID No.:</Text></Col>
              <Col span={16}><Text>NULL</Text></Col>
            </Row>
            <Row>
              <Col span={8}><Text strong>Part No.:</Text></Col>
              <Col span={16}><Text>{inspectionDetails?.part_number || 'NULL'}</Text></Col>
            </Row>
            <Row>
              <Col span={8}><Text strong>Date:</Text></Col>
              <Col span={16}><Text>{new Date().toLocaleDateString()}</Text></Col>
            </Row>
            <Row>
              <Col span={8}><Text strong>Time:</Text></Col>
              <Col span={16}><Text>{new Date().toLocaleTimeString()}</Text></Col>
            </Row>
          </Col>
          <Col span={12}>
            <Row>
              <Col span={12}><Text strong>Order No. - Batch No.:</Text></Col>
              <Col span={12}><Text>{inspectionDetails?.order_id || 'NULL'}</Text></Col>
            </Row>
            <Row>
              <Col span={12}><Text strong>Operation No.:</Text></Col>
              <Col span={12}><Text>{selectedOperation || 'NULL'}</Text></Col>
            </Row>
            <Row>
              <Col span={12}><Text strong>Sheet No.:</Text></Col>
              <Col span={12}><Text>1</Text></Col>
            </Row>
          </Col>
        </Row>
        <Divider />
        <Text strong>Info:</Text>
        <ul>
          <li>Entry to be made in all the fields highlighted in yellow</li>
          <li>In Case of 3D PDF drawing or Drawing with '10 of' less dimensions, Drg. Zone is not Mandatory</li>
          <li>Additional observations can be noted in the designated area at the bottom of the page</li>
          <li>Text of OK measurement values turn to green colour & Not OK values turn to Red colour</li>
        </ul>
      </Card>
    );
  };

  return (
    <>
      <Card>
        <Table
          columns={summaryColumns}
          dataSource={summaryData}
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={1200}
        footer={null}
      >
        {renderIPIDHeader()}
        {renderInspectionDetails()}
      </Modal>
    </>
  );
};

export default QualityInspectionDetails;