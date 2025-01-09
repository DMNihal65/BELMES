import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Select, Card } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const ProductionMonitor = () => {
  // Sample production data
  const productionData = [
    {
      machineName: 'Machine 5',
      operations: [
        {
          operationNo: 'OP10',
          partNumber: 'P123',
          plannedStart: '08:00',
          plannedEnd: '10:00',
          actualStart: '08:15',
          actualEnd: '10:30',
          plannedQuantity: 100,
          completedQuantity: 95,
          status: 'delayed' // delayed, onTime, ahead
        },
        {
          operationNo: 'OP20',
          partNumber: 'P123',
          plannedStart: '10:00',
          plannedEnd: '12:00',
          actualStart: '10:30',
          actualEnd: '12:45',
          plannedQuantity: 100,
          completedQuantity: 88,
          status: 'delayed'
        },
        {
          operationNo: 'OP30',
          partNumber: 'P123',
          plannedStart: '13:00',
          plannedEnd: '15:00',
          actualStart: '13:15',
          actualEnd: '15:30',
          plannedQuantity: 100,
          completedQuantity: 92,
          status: 'onTime'
        }
      ]
    },
    // Add more machines here with their operations
  ];

  const [selectedMachine, setSelectedMachine] = useState('all');
  const [selectedPart, setSelectedPart] = useState('all');
  const [selectedOperation, setSelectedOperation] = useState('all');

  // Prepare data for the timeline chart
  const timelineOptions = {
    chart: {
      type: 'rangeBar',
      height: 350,
      animations: {
        speed: 500
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '80%',
        rangeBarGroupRows: true
      }
    },
    colors: ['#91cc75', '#5470c6'], // Green for planned, Blue for actual
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        format: 'HH:mm',
      },
      title: {
        text: 'Timeline'
      }
    },
    yaxis: {
      title: {
        text: 'Machines & Operations'
      }
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        return `
          <div style="padding: 10px;">
            <div style="margin-bottom: 5px;"><b>${data.machine}</b></div>
            <div>Operation: ${data.operation}</div>
            <div>Part: ${data.partNumber}</div>
            <div>Time: ${new Date(data.y[0]).toLocaleTimeString()} - ${new Date(data.y[1]).toLocaleTimeString()}</div>
            <div>Status: ${data.status}</div>
            <div>Progress: ${data.progress}%</div>
          </div>
        `;
      }
    },
    legend: {
      position: 'top'
    },
    annotations: {
      xaxis: [
        {
          x: new Date().getTime(),
          borderColor: '#775DD0',
          label: {
            text: 'Current Time'
          }
        }
      ]
    }
  };

  // Transform data for the chart
  const generateTimelineSeries = () => {
    const series = [];
    
    // Planned series
    series.push({
      name: 'Planned',
      data: productionData.flatMap(machine => 
        machine.operations.map(op => ({
          x: `${machine.machineName} - ${op.operationNo}`,
          y: [
            new Date(`2024-01-01 ${op.plannedStart}`).getTime(),
            new Date(`2024-01-01 ${op.plannedEnd}`).getTime()
          ],
          machine: machine.machineName,
          operation: op.operationNo,
          partNumber: op.partNumber,
          status: op.status,
          progress: Math.round((op.completedQuantity / op.plannedQuantity) * 100),
          fillColor: '#91cc75'
        }))
      )
    });

    // Actual series
    series.push({
      name: 'Actual',
      data: productionData.flatMap(machine => 
        machine.operations.map(op => ({
          x: `${machine.machineName} - ${op.operationNo}`,
          y: [
            new Date(`2024-01-01 ${op.actualStart}`).getTime(),
            new Date(`2024-01-01 ${op.actualEnd}`).getTime()
          ],
          machine: machine.machineName,
          operation: op.operationNo,
          partNumber: op.partNumber,
          status: op.status,
          progress: Math.round((op.completedQuantity / op.plannedQuantity) * 100),
          fillColor: op.status === 'delayed' ? '#ee6666' : '#5470c6'
        }))
      )
    });

    return series;
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined />
          Production Timeline Monitor
        </div>
      }
    >
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
        <Select
          style={{ width: '200px' }}
          placeholder="Select Machine"
          value={selectedMachine}
          onChange={setSelectedMachine}
          options={[
            { value: 'all', label: 'All Machines' },
            ...productionData.map(m => ({ value: m.machineName, label: m.machineName }))
          ]}
        />
        <Select
          style={{ width: '200px' }}
          placeholder="Select Part Number"
          value={selectedPart}
          onChange={setSelectedPart}
          options={[
            { value: 'all', label: 'All Parts' },
            { value: 'P123', label: 'P123' }
          ]}
        />
        <Select
          style={{ width: '200px' }}
          placeholder="Select Operation"
          value={selectedOperation}
          onChange={setSelectedOperation}
          options={[
            { value: 'all', label: 'All Operations' },
            { value: 'OP10', label: 'OP10' },
            { value: 'OP20', label: 'OP20' },
            { value: 'OP30', label: 'OP30' }
          ]}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <ReactApexChart
          options={timelineOptions}
          series={generateTimelineSeries()}
          type="rangeBar"
          height={400}
        />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#91cc75', borderRadius: '2px' }}></div>
          <span>Planned</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#5470c6', borderRadius: '2px' }}></div>
          <span>On Time</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#ee6666', borderRadius: '2px' }}></div>
          <span>Delayed</span>
        </div>
      </div>
    </Card>
  );
};

export default ProductionMonitor;