import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, Select, Space, DatePicker } from 'antd';
import { BarChart } from 'lucide-react';

const { RangePicker } = DatePicker;

// Utility function to get shift time ranges
const getShiftTimeRange = (shiftType) => {
  const baseDate = new Date('2024-12-01');
  switch (shiftType) {
    case 'shift1':
      return {
        start: new Date(baseDate.setHours(6, 0, 0)),
        end: new Date(baseDate.setHours(14, 0, 0))
      };
    case 'shift2':
      return {
        start: new Date(baseDate.setHours(14, 0, 0)),
        end: new Date(baseDate.setHours(22, 0, 0))
      };
    case 'shift3':
      return {
        start: new Date(baseDate.setHours(22, 0, 0)),
        end: new Date(baseDate.setHours(30, 0, 0))
      };
    default:
      return {
        start: new Date(baseDate.setHours(6, 0, 0)),
        end: new Date(baseDate.setHours(14, 0, 0))
      };
  }
};

// Modified data generation to respect time ranges
const generatePlannedDataWithBreaks = (machineList, processes, batchSize, operationsPerMachine, breakTimeRange, timeRange) => {
  const randomTime = (baseDate, min, max) => {
    const start = new Date(baseDate).getTime() + min * 60 * 1000;
    const duration = Math.floor(Math.random() * (max - min + 1)) * 60 * 1000;
    return [start, start + duration];
  };

  const startTime = timeRange.start.getTime();
  const endTime = timeRange.end.getTime();

  return machineList.flatMap((machine) => {
    let baseStartTime = startTime;

    return Array.from({ length: operationsPerMachine }).map((_, index) => {
      const [start, end] = randomTime(baseStartTime, 30, 120);
      
      // Ensure times don't exceed shift end
      const adjustedEnd = Math.min(end, endTime);
      baseStartTime = adjustedEnd;

      let breakDuration = 0;
      if (index < operationsPerMachine - 1 && adjustedEnd + (breakTimeRange[1] * 60 * 1000) <= endTime) {
        breakDuration =
          Math.floor(Math.random() * (breakTimeRange[1] - breakTimeRange[0] + 1)) +
          breakTimeRange[0];
        baseStartTime += breakDuration * 60 * 1000;
      }

      const process = processes[Math.floor(Math.random() * processes.length)];
      return {
        x: machine,
        y: [start, adjustedEnd],
        breakTime: breakDuration * 60 * 1000,
        details: {
          component: `2128${Math.floor(Math.random() * 100000000)}`,
          description: process,
          machine: machine,
          start_time: new Date(start).toISOString(),
          end_time: new Date(adjustedEnd).toISOString(),
          quantity: `Batch(${batchSize})`,
        },
      };
    });
  });
};

// Previous utility functions remain the same
const generateActualDataWithBreaks = (plannedData, timeRange) => {
  const endTime = timeRange.end.getTime();
  
  return plannedData.map((item) => {
    const delay = Math.floor(Math.random() * 2 + 1) * 30 * 60 * 1000;
    const delayedEnd = Math.min(item.y[1] + delay, endTime);
    const breakDelay = Math.floor(Math.random() * 15) * 60 * 1000;
    const actualBreakTime = item.breakTime + breakDelay;

    return {
      ...item,
      y: [item.y[0], delayedEnd],
      breakTime: actualBreakTime,
      details: {
        ...item.details,
        end_time: new Date(delayedEnd).toISOString(),
      },
    };
  });
};

const calculateDelayData = (plannedData, actualData) => {
  return plannedData.map((plannedItem, index) => {
    const actualEndTime = actualData[index].y[1];
    const plannedEndTime = plannedItem.y[1];

    if (actualEndTime > plannedEndTime) {
      return {
        x: plannedItem.x,
        y: [plannedEndTime, actualEndTime],
        details: plannedItem.details,
      };
    }
    return null;
  }).filter(Boolean);
};

const ScheduleTimelineChart = () => {
  const machines = [
    { id: 'DMG-001', name: 'DMG DMU 60 eVo' },
    { id: 'DMG-002', name: 'DMG DMU 50' },
    { id: 'DMG-003', name: 'Makino A81' }
  ];
  const processes = ['cutting', 'sizing', 'drilling', 'top rough'];
  const batchSize = 10;
  const operationsPerMachine = 3;
  const breakTimeRange = [10, 30];

  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [timeRange, setTimeRange] = useState('shift1');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [chartData, setChartData] = useState({ series: [], options: {} });

  // Update chart data when selection or time range changes
  useEffect(() => {
    const filteredMachines = selectedMachines.includes('all')
      ? machines.map(m => m.name)
      : selectedMachines;
    
    // Determine time range based on shift or custom dates
    let timeRangeObj;
    if (timeRange === 'custom' && customDateRange) {
      timeRangeObj = {
        start: customDateRange[0].toDate(),
        end: customDateRange[1].toDate()
      };
    } else {
      timeRangeObj = getShiftTimeRange(timeRange);
    }

    const plannedData = generatePlannedDataWithBreaks(
      filteredMachines,
      processes,
      batchSize,
      operationsPerMachine,
      breakTimeRange,
      timeRangeObj
    );
    
    const actualData = generateActualDataWithBreaks(plannedData, timeRangeObj);
    const delayData = calculateDelayData(plannedData, actualData);

    setChartData({
      series: [
        {
          name: 'Planned',
          data: plannedData,
        },
      ],
      options: {
        chart: {
          height: 500,
          type: 'rangeBar',
          toolbar: { show: true },
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '80%',
          },
        },
        xaxis: {
          type: 'datetime',
          min: timeRangeObj.start.getTime(),
          max: timeRangeObj.end.getTime(),
        },
        stroke: {
          width: 1,
        },
        fill: {
          type: 'solid',
          opacity: 0.8,
        },
        colors: ['#0000FF'],
        tooltip: {
          custom: ({ seriesIndex, dataPointIndex, w }) => {
            const data = w.config.series[seriesIndex].data[dataPointIndex];
            const { component, description, machine, start_time, end_time, quantity } = data.details;
            const status = w.config.series[seriesIndex].name;
            const color = w.config.colors[seriesIndex];
            return `
              <div style="padding: 10px;">
                <div style="display: flex; align-items: center;">
                  <div style="width: 15px; height: 15px; background-color: ${color}; border-radius: 50%; margin-right: 10px;"></div>
                  <strong>${status}</strong>
                </div>
                <strong>Component:</strong> ${component}<br />
                <strong>Description:</strong> ${description}<br />
                <strong>Machine:</strong> ${machine}<br />
                <strong>Start Time:</strong> ${new Date(start_time).toLocaleString()}<br />
                <strong>End Time:</strong> ${new Date(end_time).toLocaleString()}<br />
                <strong>Quantity:</strong> ${quantity}
              </div>
            `;
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
        },
      },
    });    
  }, [selectedMachines, timeRange, customDateRange]);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setCustomDateRange(null);
    }
  };

  return (
    <div className="p-4">
      <Card 
        title={
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BarChart className="mr-2" /> 
              Schedule Timeline
            </div>
            <Space size="large">
              <Select
                mode="multiple"
                style={{ width: '300px' }}
                placeholder="Select Machines"
                defaultValue={['all']}
                onChange={setSelectedMachines}
                options={[{ value: 'all', label: 'All Machines' }, ...machines.map(m => ({ value: m.name, label: m.name }))]}
              />
              
              {timeRange === 'custom' && (
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  onChange={(dates) => setCustomDateRange(dates)}
                />
              )}
            </Space>
          </div>
        }
      >
        <ReactApexChart 
          options={chartData.options} 
          series={chartData.series} 
          type="rangeBar" 
          height={500} 
        />
      </Card>
    </div>
  );
};

export default ScheduleTimelineChart;
