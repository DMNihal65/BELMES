import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Button, Modal, Form, Input, TimePicker, InputNumber, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const FIXED_MACHINES = [
  { id: 'DMG-001', name: 'DMG DMU 60 eVo linear' },
  { id: 'DMG-002', name: 'DMG DMU 60T mB' },
  { id: 'DMG-003', name: 'DMG CTX BETA 1250TC' }
];

const ProductionTimeline = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [productionData, setProductionData] = useState([
    {
      machine: 'DMG-001',
      operations: [
        {
          id: 1,
          partNumber: 'PART-001',
          operation: 'Roughing',
          plannedStart: '08:00',
          plannedEnd: '10:00',
          actualStart: '08:00',
          actualEnd: '10:30',
          quantity: 10
        },
        {
            id: 2,
            partNumber: 'PART-001',
            operation: 'cutting',
            plannedStart: '11:00',
            plannedEnd: '13:00',
            actualStart: '11:00',
            actualEnd: '14:00',
            quantity: 10
          },
          {
            id: 3,
            partNumber: 'PART-001',
            operation: 'milling',
            plannedStart: '14:00',
            plannedEnd: '17:00',
            actualStart: '14:30',
            actualEnd: '19:30',
            quantity: 10
          }
      ]
    },
    {
      machine: 'DMG-002',
      operations: [
        {
            id: 1,
            partNumber: 'PART-001',
            operation: 'Roughing',
            plannedStart: '08:00',
            plannedEnd: '10:00',
            actualStart: '08:00',
            actualEnd: '10:30',
            quantity: 10
          },
      ]
    },
    {
      machine: 'DMG-003',
      operations: [
                {
          id: 1,
          partNumber: 'PART-001',
          operation: 'Roughing',
          plannedStart: '08:00',
          plannedEnd: '10:00',
          actualStart: '08:00',
          actualEnd: '10:30',
          quantity: 10
        },
        {
            id: 2,
            partNumber: 'PART-001',
            operation: 'cutting',
            plannedStart: '11:00',
            plannedEnd: '13:00',
            actualStart: '11:00',
            actualEnd: '14:00',
            quantity: 10
          },
          {
            id: 3,
            partNumber: 'PART-001',
            operation: 'milling',
            plannedStart: '14:00',
            plannedEnd: '17:00',
            actualStart: '14:30',
            actualEnd: '19:0',
            quantity: 10
          },
          {
            id: 3,
            partNumber: 'PART-001',
            operation: 'milling',
            plannedStart: '19:00',
            plannedEnd: '21:00',
            actualStart: '19:30',
            actualEnd: '22:30',
            quantity: 10
          }
      ]
    }
  ]);

  const getChartOptions = () => ({
    chart: {
      height: 600,
      type: 'rangeBar',
      animations: {
        enabled: false
      },
      toolbar: {
        show: true,
        tools: {
          pan: true,
          zoom: true,
          zoomin: false,
          zoomout: false,
          reset: true
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '30%',
        rangeBarOverlap: true,
        rangeBarGroupRows: false
      }
    },
    xaxis: {
      type: 'datetime',
      position: 'top',
      labels: {
        format: 'HH:mm',
        style: {
          fontSize: '12px'
        },
        rotateAlways: false
      },
      tickAmount: 24,
      axisBorder: {
        show: true
      },
      axisTicks: {
        show: true
      },
      scrollable: true,
      min: new Date().setHours(0, 0, 0),
      max: new Date().setHours(24, 0, 0),
      range: 1000 * 60 * 60 * 24,
    },
    yaxis: {
      categories: FIXED_MACHINES.map(m => m.name),
      labels: {
        style: {
          fontSize: '14px',
          fontWeight: 500
        }
      }
    },
    stroke: {
      width: 1
    },
    fill: {
      type: 'solid',
      opacity: [0.3, 0.7, 0.7]
    },
    colors: ['#1890ff', '#52c41a', '#f5222d'],
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      offsetY: -8
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const series = w.globals.initialSeries[seriesIndex];
        const data = series.data[dataPointIndex];
        return `
          <div class="p-2 bg-white shadow rounded">
            <div class="font-bold">${data.partNumber}</div>
            <div>${data.operation}</div>
            <div>Quantity: ${data.quantity}</div>
            <div>Time: ${data.timeRange}</div>
          </div>
        `;
      }
    },
    grid: {
      show: true,
      xaxis: {
        lines: {
          show: true
        }
      }
    }
  });

  const getSeriesData = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const series = [
      {
        name: 'Planned',
        data: []
      },
      {
        name: 'Actual (On Time)',
        data: []
      },
      {
        name: 'Actual (Overrun)',
        data: []
      }
    ];

    productionData.forEach(machine => {
      machine.operations.forEach((op, index) => {
        const yAxisOffset = index * 0.3; // Add offset for stacking

        // Add planned timeline
        series[0].data.push({
          x: machine.machine,
          y: [
            new Date(`${today} ${op.plannedStart}`).getTime(),
            new Date(`${today} ${op.plannedEnd}`).getTime()
          ],
          fillColor: '#1890ff',
          opacity: 0.3,
          partNumber: op.partNumber,
          operation: op.operation,
          quantity: op.quantity,
          timeRange: `${op.plannedStart} - ${op.plannedEnd}`,
          strokeColor: '#1890ff',
          borderRadius: 4
        });

        const actualStartTime = new Date(`${today} ${op.actualStart}`).getTime();
        const actualEndTime = new Date(`${today} ${op.actualEnd}`).getTime();
        const plannedEndTime = new Date(`${today} ${op.plannedEnd}`).getTime();

        // Add on-time portion
        series[1].data.push({
          x: machine.machine,
          y: [
            actualStartTime,
            Math.min(actualEndTime, plannedEndTime)
          ],
          fillColor: '#52c41a',
          partNumber: op.partNumber,
          operation: op.operation,
          quantity: op.quantity,
          timeRange: `${op.actualStart} - ${op.actualEnd}`,
          strokeColor: '#52c41a',
          borderRadius: 4
        });

        // Add overrun portion if exists
        if (actualEndTime > plannedEndTime) {
          series[2].data.push({
            x: machine.machine,
            y: [
              plannedEndTime,
              actualEndTime
            ],
            fillColor: '#f5222d',
            partNumber: op.partNumber,
            operation: op.operation,
            quantity: op.quantity,
            timeRange: `${op.actualStart} - ${op.actualEnd}`,
            strokeColor: '#f5222d',
            borderRadius: 4
          });
        }
      });
    });

    return series;
  };

  const handleAddProduction = (values) => {
    const { machine, partNumber, operation, plannedTime, actualTime, quantity } = values;
    
    const newOperation = {
      id: Date.now(),
      partNumber,
      operation,
      plannedStart: plannedTime[0].format('HH:mm'),
      plannedEnd: plannedTime[1].format('HH:mm'),
      actualStart: actualTime[0].format('HH:mm'),
      actualEnd: actualTime[1].format('HH:mm'),
      quantity
    };

    setProductionData(prev => prev.map(m => 
      m.machine === machine 
        ? { ...m, operations: [...m.operations, newOperation] }
        : m
    ));

    form.resetFields();
    setIsModalVisible(false);
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Production Timeline (Gantt View)</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Add Production
          </Button>
        </div>

        <div className="p-4">
          <div style={{ height: '700px' }}>
            <ReactApexChart
              options={getChartOptions()}
              series={getSeriesData()}
              type="rangeBar"
              height="100%"
            />
          </div>
        </div>
      </div>

      <Modal
        title="Add Production"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddProduction}
        >
          <Form.Item
            name="machine"
            label="Machine"
            rules={[{ required: true }]}
          >
            <Select
              options={FIXED_MACHINES.map(m => ({
                value: m.id,
                label: m.name
              }))}
            />
          </Form.Item>

          <Form.Item
            name="partNumber"
            label="Part Number"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="operation"
            label="Operation"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="plannedTime"
            label="Planned Time Range"
            rules={[{ required: true }]}
          >
            <TimePicker.RangePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="actualTime"
            label="Actual Time Range"
            rules={[{ required: true }]}
          >
            <TimePicker.RangePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Production
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const styles = {
  cardContainer: {
    height: '800px',
    overflow: 'auto'
  },
  chartContainer: {
    minHeight: '700px'
  }
};

export default ProductionTimeline;