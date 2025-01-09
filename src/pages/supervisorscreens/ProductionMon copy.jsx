import React, { useState } from 'react';
import { Card, Form, Select, Input, DatePicker, InputNumber, Button, Space, Tag, Modal, Table } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { RangePicker } = DatePicker;

const ProductionMonitoring = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  
  // Sample production data
  const [productionData, setProductionData] = useState([
    {
      id: 1,
      machine: 'DMG-001',
      partNumber: 'PART-001',
      Operation: 'Motor Casing',
      quantity: 10,
      completedUnits: 7,
      startTime: '08:00',
      endTime: '12:00',
      plannedTime: 240,
      actualTime: 255,
      status: 'In Progress'
    },
    {
      id: 2,
      machine: 'DMG-002',
      partNumber: 'PART-002',
      Operation: 'Top Cover',
      quantity: 15,
      completedUnits: 10,
      startTime: '09:00',
      endTime: '14:00',
      plannedTime: 300,
      actualTime: 280,
      status: 'In Progress'
    },
    {
      id: 3,
      machine: 'DMG-003',
      partNumber: 'PART-003',
      Operation: 'Valve Body',
      quantity: 8,
      completedUnits: 4,
      startTime: '10:00',
      endTime: '15:00',
      plannedTime: 270,
      actualTime: 290,
      status: 'In Progress'
    }
  ]);

  const machines = [
    { value: 'DMG-001', label: 'DMG DMU 60 eVo linear' },
    { value: 'DMG-002', label: 'DMG DMU 60T mB' },
    { value: 'DMG-003', label: 'DMG CTX BETA 1250TC' }
  ];

  const handleSubmit = (values) => {
    setLoading(true);
    const { timeRange, ...rest } = values;
    const [start, end] = timeRange;

    // Simulate getting planned data from backend
    const plannedTimePerUnit = 30; // 30 minutes per unit
    const plannedTotalTime = rest.quantity * plannedTimePerUnit;
    const actualTotalTime = plannedTotalTime * (1 + Math.random() * 0.4 - 0.2); // ±20% variation

    const newEntry = {
      id: Date.now(),
      ...rest,
      startTime: start.format('HH:mm'),
      endTime: end.format('HH:mm'),
      plannedTime: plannedTotalTime,
      actualTime: actualTotalTime,
      status: 'In Progress',
      completedUnits: Math.floor(rest.quantity * 0.7)
    };

    setProductionData(prev => [...prev, newEntry]);
    setLoading(false);
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      width: 120,
      fixed: 'left',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Part Number',
      dataIndex: 'partNumber',
      width: 120,
    },
    {
      title: 'Operation',
      dataIndex: 'Operation',
      width: 200,
    },
    {
      title: 'Progress',
      width: 120,
      render: (_, record) => (
        <Space>
          <span>{record.completedUnits}</span>
          <span className="text-gray-400">/</span>
          <span>{record.quantity}</span>
        </Space>
      )
    },
    {
      title: 'Time',
      width: 150,
      render: (_, record) => (
        `${record.startTime} - ${record.endTime}`
      )
    },
    {
      title: 'Status',
      width: 120,
      render: (_, record) => {
        const progress = (record.actualTime / record.plannedTime) * 100;
        const color = progress > 100 ? 'red' : 'green';
        return <Tag color={color}>{`${progress.toFixed(1)}%`}</Tag>;
      }
    }
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Timeline Card */}
        <Card 
          title="Production Timeline"
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Add Production
            </Button>
          }
          style={{ height: '400px' }}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={productionData}
              layout="vertical"
              barGap={0}
              barSize={20}
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                domain={[0, 'dataMax']}
                ticks={Array.from({ length: 10 }, (_, i) => (8 + i) * 60)}
                tickFormatter={(value) => `${Math.floor(value/60)}:00`}
                label={{ value: 'Time (hours)', position: 'bottom' }}
              />
              <YAxis type="category" dataKey="machine" width={80} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded shadow border">
                        <p className="font-semibold">{data.partNumber}</p>
                        <p>{data.Operation}</p>
                        <p>{data.completedUnits}/{data.quantity} units</p>
                        <div className="mt-2">
                          <p>Planned: {data.plannedTime} min</p>
                          <p>Actual: {data.actualTime} min</p>
                          <p>Time: {data.startTime} - {data.endTime}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {/* Planned time bar */}
              <Bar
                dataKey="plannedTime"
                fill="#1890ff"
                name="Planned Time"
                opacity={0.4}
              />
              {/* On-time portion of actual time */}
              <Bar
                dataKey={(data) => Math.min(data.actualTime, data.plannedTime)}
                name="Actual Time"
                fill="#52c41a"
                stackId="actual"
              />
              {/* Overrun portion of actual time */}
              <Bar
                dataKey={(data) => 
                  data.actualTime > data.plannedTime 
                    ? data.actualTime - data.plannedTime 
                    : 0
                }
                name="Overrun Time"
                fill="#f5222d"
                stackId="actual"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Details Card */}
        <Card 
          title="Production Details"
          style={{ height: '400px' }}
          bodyStyle={{ height: '340px', overflow: 'auto' }}
        >
          <Table
            columns={columns}
            dataSource={productionData}
            rowKey="id"
            pagination={false}
            scroll={{ y: 240 }}
          />
        </Card>
      </div>

      {/* Add Production Modal */}
      <Modal
        title="Add Production Task"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="machine"
            label="Machine"
            rules={[{ required: true }]}
          >
            <Select options={machines} placeholder="Select Machine" />
          </Form.Item>

          <Form.Item
            name="partNumber"
            label="Part Number"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter Part Number" />
          </Form.Item>

          <Form.Item
            name="Operation"
            label="Operation"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter Operation" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter Quantity" />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Time Range"
            rules={[{ required: true }]}
          >
            <RangePicker 
              showTime 
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }} 
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={loading ? <LoadingOutlined /> : <PlusOutlined />}
              disabled={loading}
              block
            >
              Add Production Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionMonitoring;