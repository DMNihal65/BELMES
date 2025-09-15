import React, { useState, useEffect } from 'react';
import { Select, Card, Spin, Alert, Row, Col, Typography, Descriptions, Table, Button, Statistic, Space, Modal, Form, InputNumber, DatePicker, Input, message,Progress } from 'antd';
import { ReloadOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const { Title, Text } = Typography;

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [operationStatus, setOperationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateOperation, setUpdateOperation] = useState(null);
  const [updateForm] = Form.useForm();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    setSelectedOrder(null);
    setOperationStatus(null);
    try {
      const response = await axios.get('http://172.18.7.89:8008/api/v1/planning/all_orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch production orders. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch active users for operator dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://172.18.7.89:8008/api/v1/auth/api/v1/auth/users-get?active_only=true');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  const handleOrderSelect = async (value) => {
    const selected = orders.find(order => order.production_order === value);
    if (!selected) return;

    setSelectedOrder(selected);
    setLoading(true);
    setError(null);
    setOperationStatus(null);

    try {
      const productionOrder = selected.production_order;
      const { data } = await axios.get(`http://172.18.7.89:8008/api/v1/operatorlogs2/production-order-operations-status/${productionOrder}`);
      setOperationStatus(data);
    } catch (err) {
      setError('Failed to fetch order details. Please check the order and try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const openUpdateModal = (record) => {
    setUpdateOperation(record);
    updateForm.resetFields();
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      const values = await updateForm.validateFields();
      const payload = {
        operation_id: updateOperation.operation_id || updateOperation.id,
        operator_id: values.operator_id,
        quantity_completed: values.quantity_completed,
        quantity_rejected: values.quantity_rejected,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        notes: values.notes || '',
        machine_id: values.machine_id || null,
      };
      await axios.post('http://172.18.7.89:8008/api/v1/operatorlogs2/operator-log', payload);
      message.success('Quantity updated successfully');
      setShowUpdateModal(false);
      if (selectedOrder) {
        handleOrderSelect(selectedOrder.production_order);
      }
    } catch (err) {
      if (err?.errorFields) return; // Validation errors
      console.error(err);
      message.error(err.message || 'Failed to update');
    }
  };

  // Fetch report data
  const fetchReportData = async () => {
    if (!selectedOrder) return;

    setReportLoading(true);
    try {
      const [orderResponse, operatorsResponse, machinesResponse] = await Promise.all([
        axios.get(`http://172.18.7.89:8008/api/v1/operatorlogs2/production-order-report/${selectedOrder.production_order}`),
        axios.get(`http://172.18.7.89:8008/api/v1/operatorlogs2/production-order-report-operators/${selectedOrder.production_order}`),
        axios.get(`http://172.18.7.89:8008/api/v1/operatorlogs2/production-order-report-machines/${selectedOrder.production_order}`)
      ]);
      setReportData({
        ...orderResponse.data,
        operators: operatorsResponse.data.operators,
        machines: machinesResponse.data.machines
      });
    } catch (err) {
      message.error('Failed to fetch report data');
      console.error(err);
    }
    setReportLoading(false);
  };

  // Handle view report button click
  const handleViewReport = () => {
    setShowReportModal(true);
    fetchReportData();
  };

  const downloadPDF = async () => {
    const input = document.getElementById('report-content');
    if (!input) return;

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ProductionOrderReport_${reportData.production_order}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      message.error('Failed to generate PDF');
    }
  };

  const columns = [
    { title: 'Operation No', dataIndex: 'operation_number', key: 'operation_number', sorter: (a, b) => a.operation_number - b.operation_number },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Work Center', dataIndex: 'work_center', key: 'work_center' },
    { title: 'Completed Qty', dataIndex: 'completed_quantity', key: 'completed_quantity' },
    { title: 'Rejected Qty', dataIndex: 'rejected_quantity', key: 'rejected_quantity' },
    { title: 'Required Qty', dataIndex: 'required_quantity', key: 'required_quantity' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) =>
        record.completed_quantity < record.required_quantity ? (
          <Button type="link" size="small" onClick={() => openUpdateModal(record)}>
            Update
          </Button>
        ) : null,
    },
  ];

  const reportColumns = [
    { title: 'Operation Number', dataIndex: 'operation_number', key: 'operation_number' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Machine Name', dataIndex: 'machines_used', key: 'machines_used', render: (machines) => machines?.join(', ') || '-' },
    { title: 'Operator', dataIndex: 'operators', key: 'operators', render: (operators) => operators?.join(', ') || '-' },
    { title: 'Total Time', dataIndex: 'total_time_invested_hours', key: 'total_time_invested_hours' },
    { title: 'Required Quantity', dataIndex: 'required_quantity', key: 'required_quantity' },
    { title: 'Completed Quantity', dataIndex: 'completed_quantity', key: 'completed_quantity' },
    { title: 'Rejected Quantity', dataIndex: 'rejected_quantity', key: 'rejected_quantity' },
  ];

  const totalOps = operationStatus?.operations?.length || 0;
  const completedOps = operationStatus?.operations?.filter(op => op.is_complete).length || 0;
  const overallPercent = operationStatus ? (operationStatus.completion_percentage ?? Math.round((completedOps / totalOps) * 100)) : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Order Tracking (BETA)</Title>
      <Card
        style={{ marginBottom: 24 }}
        title="Select Production Order"
        extra={<Button icon={<ReloadOutlined />} onClick={fetchOrders} disabled={loading} />}
      >
        <Spin spinning={loading && !orders.length}>
          <Select
            key={selectedOrder ? 'selected' : 'empty'}
            showSearch
            style={{ width: '100%' }}
            placeholder="Select a Production Order or Part Number"
            onChange={handleOrderSelect}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            disabled={loading}
            value={selectedOrder ? selectedOrder.production_order : undefined}
          >
            {orders.map(order => (
              <Select.Option key={order.id} value={order.production_order}>
                {`${order.production_order} - ${order.part_number} (${order.part_description})`}
              </Select.Option>
            ))}
          </Select>
        </Spin>
      </Card>

      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Spin spinning={loading && !!selectedOrder}>
        {operationStatus && (
          <Card
            style={{ marginBottom: 24 }}
            title="Order Overview"
            extra={
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={handleViewReport}
              >
                View Report
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8} style={{ textAlign: 'center' }}>
                <Progress
                  type="dashboard"
                  percent={overallPercent}
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                  format={percent => `${percent}%`}
                />
              </Col>
              <Col xs={24} md={12} lg={16}>
                <Space size="large" style={{ marginBottom: 16 }}>
                  <Statistic title="Completed Ops" value={completedOps} suffix={`/ ${totalOps}`} />
                  <Statistic title="Required Qty" value={operationStatus.required_quantity} />
                  <Statistic title="Priority" value={operationStatus.priority} />
                </Space>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Production Order">{operationStatus.production_order}</Descriptions.Item>
                  <Descriptions.Item label="Part Number">{operationStatus.part_number}</Descriptions.Item>
                  <Descriptions.Item label="Project">{operationStatus.project}</Descriptions.Item>
                  <Descriptions.Item label="Sale Order">{operationStatus.sale_order}</Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        )}

        {operationStatus && (
          <Card title="Operation Details">
            <Table
              dataSource={operationStatus.operations}
              columns={columns}
              rowKey="operation_id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        )}
      </Spin>

      {/* Update Quantity Modal */}
      <Modal
        title="Update Quantity"
        open={showUpdateModal}
        onOk={handleUpdateSubmit}
        onCancel={() => setShowUpdateModal(false)}
        okText="Submit"
        destroyOnClose
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item name="operator_id" label="Operator" rules={[{ required: true, message: 'Please select operator' }]}>
            <Select placeholder="Select operator">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.username}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity_completed" label="Quantity Completed" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="quantity_rejected" label="Quantity Rejected" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="start_time" label="Start Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_time" label="End Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="machine_id" label="Machine ID (optional)">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Report Modal */}
      <Modal
        title="Production Order Report"
        open={showReportModal}
        onCancel={() => setShowReportModal(false)}
        width="50%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setShowReportModal(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadPDF}
            disabled={!reportData}
          >
            Download PDF
          </Button>
        ]}
      >
        <Spin spinning={reportLoading}>
          <div id="report-content" style={{ minHeight: '297mm', padding: '20px', backgroundColor: 'white' }}>
            {reportData && (
              <>
                <div className="report-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <Title level={2} style={{ margin: 0 }}>PO Summary</Title>
                </div>

                <div className="report-subheader" style={{ marginBottom: '20px' }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text strong>Production Order: </Text>
                      <Text>{reportData.production_order}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Part Number: </Text>
                      <Text>{reportData.part_number}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Project: </Text>
                      <Text>{reportData.project}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Sale Order: </Text>
                      <Text>{reportData.sale_order}</Text>
                    </Col>
                  </Row>
                </div>

                <Title level={4} style={{ marginBottom: '16px' }}>Operations</Title>
                <Table
                  dataSource={reportData.operations}
                  columns={reportColumns}
                  rowKey="operation_id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  className="report-table"
                />
                <Title level={4} style={{ marginTop: '24px', marginBottom: '16px' }}>Operators</Title>
                <Table
                  dataSource={reportData?.operators?.flatMap(operator =>
                    operator.operations.map(op => ({
                      key: `${operator.operator}-${op.operation_id}`,
                      operator_name: operator.operator,
                      operation_number: op.operation_number,
                      operation_description: op.operation_description,
                      machine: op.machine || '-',
                      total_time: op.time_invested_hours,
                      completed_quantity: op.completed_quantity,
                      rejected_quantity: op.rejected_quantity
                    }))
                  )}
                  columns={[
                    { title: 'Operator Name', dataIndex: 'operator_name', key: 'operator_name' },
                    { title: 'Operation Number', dataIndex: 'operation_number', key: 'operation_number' },
                    { title: 'Description', dataIndex: 'operation_description', key: 'operation_description' },
                    { title: 'Machine', dataIndex: 'machine', key: 'machine' },
                    { title: 'Total Time', dataIndex: 'total_time', key: 'total_time' },
                    { title: 'Completed Quantity', dataIndex: 'completed_quantity', key: 'completed_quantity' },
                    { title: 'Rejected Quantity', dataIndex: 'rejected_quantity', key: 'rejected_quantity' }
                  ]}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  className="report-table"
                />
                <Title level={4} style={{ marginTop: '24px', marginBottom: '16px' }}>Machines</Title>
                <Table
                  dataSource={reportData?.machines?.map(machine => ({
                    key: `${machine.machine}-${machine.operation_id}`,
                    machine_name: machine.machine,
                    operation_number: machine.operation_number,
                    operation_description: machine.operation_description,
                    total_time: machine.time_invested_hours,
                    completed_quantity: machine.completed_quantity,
                    rejected_quantity: machine.rejected_quantity
                  }))}
                  columns={[
                    { title: 'Machine Name', dataIndex: 'machine_name', key: 'machine_name' },
                    { title: 'Operation Number', dataIndex: 'operation_number', key: 'operation_number' },
                    { title: 'Operation Description', dataIndex: 'operation_description', key: 'operation_description' },
                    { title: 'Total Time', dataIndex: 'total_time', key: 'total_time' },
                    { title: 'Completed Quantity', dataIndex: 'completed_quantity', key: 'completed_quantity' },
                    { title: 'Rejected Quantity', dataIndex: 'rejected_quantity', key: 'rejected_quantity' }
                  ]}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  className="report-table"
                />
              </>
            )}
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default OrderTracking;