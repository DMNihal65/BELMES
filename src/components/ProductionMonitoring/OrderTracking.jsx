import React, { useState, useEffect } from 'react';
import { Select, Card, Spin, Alert, Row, Col, Typography, Descriptions, Table, Button, Statistic, Space, Modal, Form, InputNumber, DatePicker, Input, message, Progress } from 'antd';
import { ReloadOutlined, FileTextOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [dailyReportData, setDailyReportData] = useState(null);
  const [dailyReportLoading, setDailyReportLoading] = useState(false);


  const downloadExcel = () => {
    if (!dailyReportData) return;
  
    // Create header rows with production order details
    const headerRows = [
      ['Production Order', dailyReportData.production_order || selectedOrder.production_order],
      ['Sale Order', dailyReportData.sale_order || selectedOrder.sale_order || '-'],
      [], // Empty row for spacing
      // Column headers
      ['Date', 'Part Number', 'Part Description', 'Operation Number', 'Accepted Quantity', 'Rejected Quantity', 'Total Hours', 'Machines', 'Operators']
    ];
  
    // Prepare data rows
    const dataRows = dailyReportTableData.map(item => [
      item.date,
      item.part_number,
      item.part_description,
      item.operation_number,
      item.accepted_quantity,
      item.rejected_quantity,
      item.total_hours,
      item.machines?.join(', ') || '-',
      item.operators?.join(', ') || '-'
    ]);
  
    // Combine headers and data
    const allData = [...headerRows, ...dataRows];
  
    // Create worksheet from array of arrays
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Report');
  
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `DailyProductionReport_${selectedOrder.production_order}.xlsx`);
  };

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    setSelectedOrder(null);
    setOperationStatus(null);
    try {
      const response = await axios.get('http://172.19.224.1:8002/api/v1/planning/all_orders');
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
        const res = await axios.get('http://172.19.224.1:8002/api/v1/auth/api/v1/auth/users-get?active_only=true');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  const downloadReportExcel = () => {
    if (!reportData) return;

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Common header rows for production order details
    const commonHeaderRows = [
      ['Production Order', reportData.production_order],
      ['Part Number', reportData.part_number],
      ['Project', reportData.project],
      ['Sale Order', reportData.sale_order],
      [], // Empty row for spacing
    ];

    // Operations sheet
    const operationsHeaders = [...commonHeaderRows, ['Operation Number','Operation Description', 'Machine Name', 'Operator', 'Total Time', 'Required Quantity', 'Completed Quantity', 'Rejected Quantity']];
    const operationsData = reportData.operations.map(op => [
      op.operation_number || '-',
      op.description || '-',
      op.machines_used?.join(', ') || '-',
      op.operators?.join(', ') || '-',
      op.total_time_invested_hours || '0 min',
      op.required_quantity || 0,
      op.completed_quantity || 0,
      op.rejected_quantity || 0
    ]);
    const operationsSheet = XLSX.utils.aoa_to_sheet([...operationsHeaders, ...operationsData]);
    XLSX.utils.book_append_sheet(workbook, operationsSheet, 'Operations');

    // Operators sheet
    const operatorsHeaders = [...commonHeaderRows, ['Operator Name', 'Operation Number', 'Description', 'Machine', 'Total Time', 'Completed Quantity', 'Rejected Quantity']];
    const operatorsData = reportData.operators.flatMap(operator =>
      operator.operations.map(op => [
        operator.operator || '-',
        op.operation_number || '-',
        op.operation_description || '-',
        op.machine || '-',
        op.time_invested_hours || '0 min',
        op.completed_quantity || 0,
        op.rejected_quantity || 0
      ])
    );
    const operatorsSheet = XLSX.utils.aoa_to_sheet([...operatorsHeaders, ...operatorsData]);
    XLSX.utils.book_append_sheet(workbook, operatorsSheet, 'Operators');

    // Machines sheet
    const machinesHeaders = [...commonHeaderRows, ['Machine Name', 'Operation Number', 'Description', 'Total Time', 'Completed Quantity', 'Rejected Quantity']];
    const machinesData = reportData.machines.map(machine => [
      machine.machine || '-',
      machine.operation_number || '-',
      machine.operation_description || '-',
      machine.time_invested_hours || '0 min',
      machine.completed_quantity || 0,
      machine.rejected_quantity || 0
    ]);
    const machinesSheet = XLSX.utils.aoa_to_sheet([...machinesHeaders, ...machinesData]);
    XLSX.utils.book_append_sheet(workbook, machinesSheet, 'Machines');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `ProductionOrderReport_${reportData.production_order}.xlsx`);
  };

  const handleOrderSelect = async (value) => {
    const selected = orders.find(order => order.production_order === value);
    if (!selected) return;

    setSelectedOrder(selected);
    setLoading(true);
    setError(null);
    setOperationStatus(null);

    try {
      const productionOrder = selected.production_order;
      const { data } = await axios.get(`http://172.19.224.1:8002/api/v1/operatorlogs2/production-order-operations-status/${productionOrder}`);
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
      await axios.post('http://172.19.224.1:8002/api/v1/operatorlogs2/operator-log', payload);
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
        axios.get(`http://172.19.224.1:8002/api/v1/operatorlogs2/production-order-report/${selectedOrder.production_order}`),
        axios.get(`http://172.19.224.1:8002/api/v1/operatorlogs2/production-order-report-operators/${selectedOrder.production_order}`),
        axios.get(`http://172.19.224.1:8002/api/v1/operatorlogs2/production-order-report-machines/${selectedOrder.production_order}`)
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

  // Fetch daily report data
  const fetchDailyReportData = async () => {
    if (!selectedOrder) return;

    setDailyReportLoading(true);
    try {
      const response = await axios.get(`http://172.19.224.1:8002/api/v1/operatorlogs2/production-order-daily-report/${selectedOrder.production_order}`);
      setDailyReportData(response.data);
    } catch (err) {
      message.error('Failed to fetch daily report data');
      console.error(err);
    }
    setDailyReportLoading(false);
  };


  // Handle view report button click
  const handleViewReport = () => {
    setShowReportModal(true);
    fetchReportData();
  };

  // Handle view daily report button click
  const handleViewDailyReport = () => {
    setShowDailyReportModal(true);
    fetchDailyReportData();
  };




  const columns = [
    { title: 'Operation No', dataIndex: 'operation_number', key: 'operation_number', sorter: (a, b) => a.operation_number - b.operation_number },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Work Center', dataIndex: 'work_center', key: 'work_center' },
    { title: 'Required Qty', dataIndex: 'required_quantity', key: 'required_quantity' },
    { title: 'Completed Qty', dataIndex: 'completed_quantity', key: 'completed_quantity' },
    
    
    { 
      title: 'Accepted Qty', 
      key: 'accepted_quantity',
      render: (_, record) => {
        const acceptedQty = (record.completed_quantity || 0) - (record.rejected_quantity || 0);
        return acceptedQty;
      }
    },
    { title: 'Rejected Qty', dataIndex: 'rejected_quantity', key: 'rejected_quantity' },
    { 
      title: 'Yield %', 
      key: 'yield_percentage',
      render: (_, record) => {
        const acceptedQty = (record.completed_quantity || 0) - (record.rejected_quantity || 0);
        const requiredQty = record.required_quantity || 0;
        const yieldPercentage = requiredQty > 0 ? ((acceptedQty / requiredQty) * 100).toFixed(2) : 0;
        return `${yieldPercentage}%`;
      }
    },
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

  const dailyReportColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text, record, index) => {
        const rowSpan = dailyReportTableData.filter(item => item.date === record.date).length;
        return index === dailyReportTableData.findIndex(item => item.date === record.date)
          ? { children: text, props: { rowSpan } }
          : { props: { rowSpan: 0 } };
      },
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      render: (text, record, index) => {
        const rowSpan = dailyReportTableData.filter(item => item.date === record.date).length;
        return index === dailyReportTableData.findIndex(item => item.date === record.date)
          ? { children: text, props: { rowSpan } }
          : { props: { rowSpan: 0 } };
      },
    },
    {
      title: 'Part Description',
      dataIndex: 'part_description',
      key: 'part_description',
      render: (text, record, index) => {
        const rowSpan = dailyReportTableData.filter(item => item.date === record.date).length;
        return index === dailyReportTableData.findIndex(item => item.date === record.date)
          ? { children: text, props: { rowSpan } }
          : { props: { rowSpan: 0 } };
      },
    },
    {
      title: 'Operation Number',
      dataIndex: 'operation_number',
      key: 'operation_number',
    },
    { title: 'Accepted Quantity', dataIndex: 'accepted_quantity', key: 'accepted_quantity' },
    { title: 'Rejected Quantity', dataIndex: 'rejected_quantity', key: 'rejected_quantity' },
    { title: 'Total Hours', dataIndex: 'total_hours', key: 'total_hours' },
    { title: 'Machine Name', dataIndex: 'machines', key: 'machines', render: (machines) => machines?.join(', ') || '-' },
    { title: 'Operator', dataIndex: 'operators', key: 'operators', render: (operators) => operators?.join(', ') || '-' },
  ];

  const totalOps = operationStatus?.operations?.length || 0;
  const completedOps = operationStatus?.operations?.filter(op => op.is_complete).length || 0;
  const overallPercent = operationStatus ? (operationStatus.completion_percentage ?? Math.round((completedOps / totalOps) * 100)) : 0;

  // Prepare daily report table data
  const dailyReportTableData = dailyReportData?.daily_reports?.flatMap(report =>
    report.operations.map((op, index) => ({
      key: `${report.date}-${op.operation_number}`,
      date: report.date,
      part_number: dailyReportData.part_number,
      part_description: dailyReportData.part_description,
      operation_number: op.operation_number,
      accepted_quantity: op.accepted_quantity,
      rejected_quantity: op.rejected_quantity,
      total_hours: op.total_hours,
      machines: op.machines,
      operators: op.operators,
    }))
  ) || [];

  return (
    <div className="p-6">
      <Title level={2}>Order Tracking </Title>
      <Card
        className="mb-6"
        title="Select Production Order"
        extra={<Button icon={<ReloadOutlined />} onClick={fetchOrders} disabled={loading} />}
      >
        <Spin spinning={loading && !orders.length}>
          <Select
            key={selectedOrder ? 'selected' : 'empty'}
            showSearch
            className="w-full"
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

      {error && <Alert message="Error" description={error} type="error" showIcon className="mb-6" />}

      <Spin spinning={loading && !!selectedOrder}>
        {operationStatus && (
          <Card
            className="mb-6"
            title="Order Overview"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={handleViewReport}
                >
                  View Report
                </Button>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={handleViewDailyReport}
                >
                  View Daily Report
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8} className="text-center">
                <Progress
                  type="dashboard"
                  percent={overallPercent}
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                  format={percent => `${percent}%`}
                />
              </Col>
              <Col xs={24} md={12} lg={16}>
                <Space size="large" className="mb-4">
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
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="quantity_rejected" label="Quantity Rejected" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="start_time" label="Start Time" rules={[{ required: true }]}>
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item name="end_time" label="End Time" rules={[{ required: true }]}>
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item name="machine_id" label="Machine ID (optional)">
            <InputNumber className="w-full" />
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
        width="80%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setShowReportModal(false)}>
            Close
          </Button>,
          <Button
            key="download-excel"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadReportExcel}
            disabled={!reportData}
          >
            Download Excel
          </Button>

        ]}
      >
        <Spin spinning={reportLoading}>
          <div id="report-content" className="min-h-[297mm] p-5 bg-white">
            {reportData && (
              <>
                <div className="report-header text-center mb-8">
                  <Title level={2} className="m-0">PO Summary</Title>
                </div>

                <div className="report-subheader mb-5">
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

                <Title level={4} className="mb-4">Operations</Title>
                <Table
                  dataSource={reportData.operations}
                  columns={reportColumns}
                  rowKey="operation_id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  className="report-table"
                />
                <Title level={4} className="mt-6 mb-4">Operators</Title>
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
                <Title level={4} className="mt-6 mb-4">Machines</Title>
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

      {/* Daily Report Modal */}
      <Modal
        title="Daily Production Report"
        open={showDailyReportModal}
        onCancel={() => setShowDailyReportModal(false)}
        width="80%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setShowDailyReportModal(false)}>
            Close
          </Button>,
          <Button
            key="download-excel"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadExcel}
            disabled={!dailyReportData}
          >
            Download Excel
          </Button>
        ]}
      >
        <Spin spinning={dailyReportLoading}>
          <div className="p-5">
            {dailyReportData && (
              <>
                <Table
                  dataSource={dailyReportTableData}
                  columns={dailyReportColumns}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  className="report-table border border-gray-300"
                  rowClassName="border-b border-gray-300"
                  components={{
                    header: {
                      cell: (props) => (
                        <th {...props} style={{ border: '1px solid #d9d9d9', padding: '8px' }} />
                      ),
                    },
                    body: {
                      cell: (props) => (
                        <td {...props} style={{ border: '1px solid #d9d9d9', padding: '8px' }} />
                      ),
                    },
                  }}
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