import React, { useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { Card, Row, Col, Typography } from 'antd';
import ReactApexChart from 'react-apexcharts';
import { format } from 'date-fns';

const { Title } = Typography;

const sampleData = [
  {
    machineId: 'M1',
    machineName: 'Machine 1',
    tasks: [
      {
        taskId: 'T1',
        partNumber: 'P001',
        operationNumber: 'OP1',
        plannedStart: new Date('2024-12-27T08:00'),
        plannedEnd: new Date('2024-12-27T10:00'),
        actualStart: new Date('2024-12-27T08:00'),
        actualEnd: new Date('2024-12-27T09:45'),
        plannedQty: 100,
        actualQty: 95,
        delays: [{
          start: new Date('2024-12-27T09:45'),
          end: new Date('2024-12-27T10:00'),
          reason: 'Material Change'
        }]
      },
      {
        taskId: 'T2',
        partNumber: 'P002',
        operationNumber: 'OP2',
        plannedStart: new Date('2024-12-27T10:00'),
        plannedEnd: new Date('2024-12-27T12:00'),
        actualStart: new Date('2024-12-27T10:15'),
        actualEnd: new Date('2024-12-27T12:00'),
        plannedQty: 150,
        actualQty: 140,
        delays: []
      }
    ]
  }
];

const ProductionTimeline = ({ machine }) => {
  const ganttOptions = {
    chart: {
      height: 200,
      type: 'rangeBar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        rangeBarGroupRows: true
      }
    },
    xaxis: {
      type: 'datetime',
      min: new Date('2024-12-27T08:00').getTime(),
      max: new Date('2024-12-27T16:00').getTime()
    },
    yaxis: {
      labels: {
        formatter: (val) => `${val}`
      }
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const series = w.globals.initialSeries[seriesIndex];
        const data = series.data[dataPointIndex];
        return `
          <div class="p-2">
            <div class="font-bold">${data.x}</div>
            <div>Start: ${format(data.y[0], 'HH:mm')}</div>
            <div>End: ${format(data.y[1], 'HH:mm')}</div>
            <div>Quantity: ${data.qty || 'N/A'}</div>
          </div>
        `;
      }
    },
    colors: ['#9CA3AF', '#10B981', '#EF4444'],
    legend: {
      position: 'top'
    }
  };

  const ganttSeries = machine.tasks.flatMap(task => [
    {
      name: 'Planned',
      data: [{
        x: `${task.partNumber} - ${task.operationNumber}`,
        y: [task.plannedStart.getTime(), task.plannedEnd.getTime()],
        qty: task.plannedQty
      }]
    },
    {
      name: 'Actual',
      data: [{
        x: `${task.partNumber} - ${task.operationNumber}`,
        y: [task.actualStart.getTime(), task.actualEnd.getTime()],
        qty: task.actualQty
      }]
    },
    ...task.delays.map((delay, index) => ({
      name: 'Delay',
      data: [{
        x: `${task.partNumber} - ${task.operationNumber}`,
        y: [delay.start.getTime(), delay.end.getTime()],
        reason: delay.reason
      }]
    }))
  ]);

  const quantityOptions = {
    chart: {
      type: 'bar',
      height: 200,
      stacked: false,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: true
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: machine.tasks.map(task => `${task.partNumber}\n${task.operationNumber}`),
    },
    yaxis: {
      title: {
        text: 'Quantity'
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " units"
        }
      }
    },
    colors: ['#9CA3AF', '#10B981'],
    legend: {
      position: 'top'
    }
  };

  const quantitySeries = [
    {
      name: 'Planned',
      data: machine.tasks.map(task => task.plannedQty)
    },
    {
      name: 'Actual',
      data: machine.tasks.map(task => task.actualQty)
    }
  ];

  const progressOptions = {
    chart: {
      type: 'radialBar',
      height: 200
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '70%',
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: '#888',
            fontSize: '13px'
          },
          value: {
            formatter: function(val) {
              return val + "%"
            },
            color: '#111',
            fontSize: '30px',
            show: true,
          }
        }
      }
    },
    colors: ['#10B981'],
    labels: ['Efficiency']
  };

  const efficiency = Math.round(
    (machine.tasks.reduce((acc, task) => acc + task.actualQty, 0) / 
     machine.tasks.reduce((acc, task) => acc + task.plannedQty, 0)) * 100
  );

  const progressSeries = [efficiency];

  return (
    <Card 
      title={
        <span>
          <Activity className="inline-block mr-2" />
          {machine.machineName}
        </span>
      }
      className="mb-4"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Title level={5}>Timeline</Title>
          <ReactApexChart
            options={ganttOptions}
            series={ganttSeries}
            type="rangeBar"
            height={200}
          />
        </Col>
        <Col xs={24} lg={12}>
          <Title level={5}>Quantity Comparison</Title>
          <ReactApexChart
            options={quantityOptions}
            series={quantitySeries}
            type="bar"
            height={200}
          />
        </Col>
        <Col xs={24}>
          <Title level={5}>Overall Efficiency</Title>
          <ReactApexChart
            options={progressOptions}
            series={progressSeries}
            type="radialBar"
            height={200}
          />
        </Col>
      </Row>
    </Card>
  );
};

const ProductionDashboard = () => {
  return (
    <div className="p-6">
      <Title level={2} className="mb-6">Production Monitoring</Title>
      {sampleData.map((machine) => (
        <ProductionTimeline key={machine.machineId} machine={machine} />
      ))}
    </div>
  );
};

export default ProductionDashboard;