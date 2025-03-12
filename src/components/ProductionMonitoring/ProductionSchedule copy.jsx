import React, { useEffect, useRef, useState } from 'react';
import { Card, Space, Button, DatePicker, Select, Tooltip, Empty, Spin, Radio } from 'antd';
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Calendar } from 'lucide-react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import useProductionStore from '../../stores/productionStore';
import moment from 'moment';
import dayjs from 'dayjs';
import ProductionGanttChart from './ProductionGanttChart';
import SimpleGanttChart from './SimpleGanttChart';
import useGanttStore from '../../stores/ganttChartStore';

const { RangePicker } = DatePicker;
const { Option } = Select;

const VIEW_MODES = {
  daily: {
    label: 'Daily View',
    range: () => [dayjs().startOf('day'), dayjs().endOf('day')]
  },
  weekly: {
    label: 'Weekly View',
    range: () => [dayjs().startOf('week'), dayjs().endOf('week')]
  },
  monthly: {
    label: 'Monthly View',
    range: () => [dayjs().startOf('month'), dayjs().endOf('month')]
  }
};

// Sample machines data
const MACHINES = [
  { id: 'MMC1-M1', name: 'MMC1-M1' },
  { id: 'CNCT-m2', name: 'CNCT-m2' },
  { id: 'CNCM-m3', name: 'CNCM-m3' },
  { id: 'SMFD-m4', name: 'SMFD-m4' },
  { id: 'SMPD-m5', name: 'SMPD-m5' },
  { id: 'QFAB-m6', name: 'QFAB-m6' },
  { id: 'FAB-C-PC-m9', name: 'FAB-C-PC-m9' }
];

// Generate sample data function
const generateSampleData = (startDate, endDate) => {
  const data = [];
  const programs = ['213511100114', '211071570096', '210227380163'];
  
  MACHINES.forEach(machine => {
    // Generate 2-3 production entries per machine
    const numEntries = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numEntries; i++) {
      const startHour = Math.floor(Math.random() * 8) * 3; // Random start hour (0-24)
      const duration = Math.floor(Math.random() * 4) + 2; // Random duration (2-6 hours)
      
      // Production entry
      data.push({
        id: `prod-${machine.id}-${i}`,
        machine: machine.id,
        type: 'production',
        program: programs[Math.floor(Math.random() * programs.length)],
        start: dayjs(startDate).add(startHour, 'hour').toDate(),
        end: dayjs(startDate).add(startHour + duration, 'hour').toDate()
      });

      // Scheduled entry (starts after production)
      data.push({
        id: `sch-${machine.id}-${i}`,
        machine: machine.id,
        type: 'scheduled',
        program: programs[Math.floor(Math.random() * programs.length)],
        start: dayjs(startDate).add(startHour + duration + 1, 'hour').toDate(),
        end: dayjs(startDate).add(startHour + duration + 4, 'hour').toDate()
      });
    }
  });

  return data;
};

const ProductionSchedule = () => {
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('daily');
  const { 
    productionLogs, 
    scheduledOperations,
    machines,
    selectedDateRange,
    setDateRange,
    fetchProductionSchedule,
    isLoading,
    productionData
  } = useProductionStore();
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [selectedMachine, setSelectedMachine] = useState('all');
  const {
    dateRange,
    selectedMachine: ganttSelectedMachine,
    ganttData,
    setDateRange: setGanttDateRange,
    setSelectedMachine: setGanttSelectedMachine,
    generateGanttData,
    resetData,
    fetchGanttData,
    error,
    submitQuery
  } = useGanttStore();

  // Debug logs for data
  useEffect(() => {
    console.log('Production Logs:', productionLogs);
    console.log('Scheduled Operations:', scheduledOperations);
    console.log('Machines:', machines);
  }, [productionLogs, scheduledOperations, machines]);

  // Set initial date range
  useEffect(() => {
    const initialRange = VIEW_MODES.daily.range();
    setDateRange(initialRange);
  }, []);

  // Initialize timeline when data changes
  useEffect(() => {
    if (!containerRef.current) return;
    initializeTimeline();
  }, [productionLogs, scheduledOperations, selectedMachines, viewMode]);

  useEffect(() => {
    if (dateRange) {
      fetchProductionSchedule(dateRange[0], dateRange[1], selectedMachine);
    }
  }, [dateRange, selectedMachine]);

  // Initialize data on component mount
  useEffect(() => {
    fetchGanttData();
  }, []);

  const handleViewChange = (e) => {
    const newMode = e.target.value;
    setViewMode(newMode);
    setDateRange(VIEW_MODES[newMode].range());
  };

  const createTimelineData = () => {
    const filteredMachineIds = selectedMachines.includes('all')
      ? machines.map(m => m.machine_name)
      : selectedMachines;

    const items = [];

    // Add scheduled operations
    scheduledOperations?.forEach((op, index) => {
      if (filteredMachineIds.includes(op.machine)) {
        try {
          const startTime = moment(op.start_time);
          const endTime = moment(op.end_time);

          if (startTime.isValid() && endTime.isValid()) {
            items.push({
              id: `scheduled-${index}`,
              group: op.machine,
              content: `
                <div class="timeline-item-content planned">
                  ${op.component} (${op.quantity || 'N/A'})
                </div>
              `,
              title: `
                <div class="timeline-tooltip">
                  <div class="font-bold">${op.component}</div>
                  <div>${op.description}</div>
                  <div>PO: ${op.production_order || 'N/A'}</div>
                  <div>Quantity: ${op.quantity}</div>
                </div>
              `,
              start: startTime.toDate(),
              end: endTime.toDate(),
              type: 'range',
              className: 'timeline-planned'
            });
          }
        } catch (error) {
          console.error('Error processing scheduled operation:', error);
        }
      }
    });

    // Add production logs
    productionLogs?.forEach((log, index) => {
      if (filteredMachineIds.includes(log.machine_name)) {
        try {
          const startTime = moment(log.start_time);
          const endTime = moment(log.end_time);

          if (startTime.isValid() && endTime.isValid()) {
            items.push({
              id: `actual-${index}`,
              group: log.machine_name,
              content: `
                <div class="timeline-item-content actual">
                  ${log.part_number} (${log.quantity_completed}pcs)
                </div>
              `,
              title: `
                <div class="timeline-tooltip">
                  <div class="font-bold">${log.part_number}</div>
                  <div>${log.operation_description}</div>
                  <div>PO: ${log.production_order}</div>
                  <div>Completed: ${log.quantity_completed}pcs</div>
                  ${log.quantity_rejected > 0 ? `<div>Rejected: ${log.quantity_rejected}pcs</div>` : ''}
                </div>
              `,
              start: startTime.toDate(),
              end: endTime.toDate(),
              type: 'range',
              className: 'timeline-actual'
            });
          }
        } catch (error) {
          console.error('Error processing production log:', error);
        }
      }
    });

    const groups = filteredMachineIds.map(machineId => ({
      id: machineId,
      content: `<div class="machine-label">${machineId}</div>`
    }));

    return { items, groups };
  };

  const initializeTimeline = () => {
    try {
      const { items, groups } = createTimelineData();
      
      if (!items.length || !groups.length) return;

      const currentView = VIEW_MODES[viewMode];
      const options = {
        stack: true,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        orientation: 'top',
        height: '600px',
        start: selectedDateRange[0]?.toDate(),
        end: selectedDateRange[1]?.toDate(),
        editable: false,
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap',
          delay: 100
        },
        timeAxis: { 
          scale: currentView.scale, 
          step: currentView.step 
        },
        verticalScroll: true,
        zoomMin: 1000 * 60 * 60, // 1 hour
        zoomMax: 1000 * 60 * 60 * 24 * 31, // 31 days
        margin: { item: { horizontal: 10, vertical: 5 } },
        snap: null // Remove sticky dates
      };

      if (timelineRef.current) {
        timelineRef.current.destroy();
      }

      timelineRef.current = new Timeline(containerRef.current, items, groups, options);
      timelineRef.current.fit();
    } catch (error) {
      console.error('Error initializing timeline:', error);
    }
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleMachineChange = (value) => {
    setSelectedMachine(value);
  };

  const handleClearDates = () => {
    resetData();
  };

  const machineOptions = [
    { value: 'all', label: 'All Machines' },
    ...machines.map(m => ({
      value: m.machine_name,
      label: m.machine_name
    }))
  ];

  return (
    <div className="space-y-6">
      <Card 
        className="shadow-lg rounded-lg border-0"
        bodyStyle={{ padding: 0 }}
      >
        <SimpleGanttChart
          data={ganttData}
          dateRange={dateRange}
          selectedMachine={selectedMachine}
          onDateChange={handleDateChange}
          onMachineChange={handleMachineChange}
          onClear={resetData}
          onSubmit={submitQuery}
          isLoading={isLoading}
          error={error}
        />
      </Card>
    </div>
  );
};

export default ProductionSchedule; 