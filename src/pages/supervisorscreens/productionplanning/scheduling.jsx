import React, { useEffect, useState, useRef } from 'react';
import {
  Layout, Card, Row, Col, Button, Space, Input, Select, 
  DatePicker, Table, Tag, Form, Modal, Typography, Divider,
  Tabs, Badge, Alert, Tooltip, Progress, Statistic,
  message, Spin, Switch
} from 'antd';

import {
  ScheduleOutlined, SyncOutlined, SearchOutlined,
  HistoryOutlined, CalendarOutlined, ClockCircleOutlined,
  BarChartOutlined, WarningOutlined, SwapOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined,
  ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, LeftOutlined, 
  RightOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data/esnext";
import "vis-timeline/dist/vis-timeline-graph2d.css";
import useScheduleStore from '../../../store/schedule-store';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LineChart,
  Line } from 'recharts';
import AnalyticsDashboard from './Analytics/AnalyticsDashboard';
import { ComponentLegend, MachineStatusCards } from './Schedule/ComponentsAndStatus';
import ReactECharts from "echarts-for-react";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;


const { Option } = Select;
const { TabPane } = Tabs;

// Add styles
const timelineStyles = {
  '.vis-timeline': {
    border: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  '.vis-item': {
    borderRadius: '4px',
    borderWidth: '1px',
    fontSize: '12px',
    color: '#fff',
    height: '34px !important',
  },
  '.vis-item.single-machine': {
    height: '80px !important', // Increased height when single machine selected
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '.vis-item .timeline-item': {
    padding: '4px 8px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '.vis-item .item-header': {
    fontWeight: '500',
    fontSize: '14px',
  },
  '.vis-item.vis-selected': {
    borderColor: '#1890ff',
    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
  },
  '.timeline-item-normal': {
    backgroundColor: '#1890ff',
    borderColor: '#096dd9',
  },
  '.timeline-item-ontime': {
    backgroundColor: '#52c41a',
    borderColor: '#389e0d',
  },
  '.timeline-item-delayed': {
    backgroundColor: '#ff4d4f',
    borderColor: '#cf1322',
  },
  '.timeline-item-warning': {
    backgroundColor: '#faad14',
    borderColor: '#d48806',
  },
  '.vis-time-axis .vis-grid.vis-minor': {
    borderWidth: '1px',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  '.vis-time-axis .vis-grid.vis-major': {
    borderWidth: '1px',
    borderColor: 'rgba(0,0,0,0.1)',
  },
};

// Helper functions for timeline
const getTimeAxisScale = (viewType) => {
  switch (viewType) {
    case 'year': return 'month'; // Scale for year: months (Jan-Dec)
    case 'month': return 'day';  // Scale for month: days
    case 'week': return 'hour';  // Scale for week: hours
    case 'day': return 'hour';   // Scale for day: hours
    default: return 'hour';      // Default scale: hours
  }
};

const getTimeAxisStep = (viewType) => {
  switch (viewType) {
    case 'year': return 1;  // Step for year: 1 month
    case 'month': return 1; // Step for month: 1 day
    case 'week': return 4;  // Step for week: 4 hours
    case 'day': return 1;   // Step for day: 1 hour (changed from 15)
    default: return 1;      // Default step: 1 hour
  }
};

const getDurationByViewType = (viewType) => {
  switch (viewType) {
    case 'year': return 1000 * 60 * 60 * 24 * 365; // Duration for 1 year (365 days)
    case 'month': return 1000 * 60 * 60 * 24 * 31; // Approximate duration for 1 month
    case 'week': return 1000 * 60 * 60 * 24 * 7;   // Duration for 1 week
    default: return 1000 * 60 * 60 * 24;           // Default duration: 1 day
  }
};

const getMachineStatus = (machine, operations) => {
  const currentOp = operations.find(op => {
    const now = new Date();
    return new Date(op.start_time) <= now && new Date(op.end_time) >= now;
  });
  return currentOp ? 'RUNNING' : 'IDLE';
};

const calculateZoomLevel = (duration) => {
  const days = duration / (1000 * 60 * 60 * 24);
  if (days <= 1) return 'day';           // Zoom level for 1 day
  if (days <= 7) return 'week';          // Zoom level for up to 7 days
  if (days <= 31) return 'month';        // Zoom level for up to 31 days
  if (days <= 365) return 'year';        // Zoom level for up to 1 year
  return 'month';                         // Default to year for anything longer
};


const generateDistinctColors = (count) => {
  const colors = [
    '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#eb2f96', '#fa8c16', '#a0d911', '#fadb14',
    '#2f54eb', '#fa541c', '#52c41a', '#1890ff', '#13c2c2'
  ];

  // If we need more colors than our predefined set
  while (colors.length < count) {
    const hue = (colors.length * 137.508) % 360; // Use golden angle approximation
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }

  return colors;
};

const getComponentColors = (operations) => {
  const uniqueComponents = [...new Set(operations.map(op => op.component))];
  const colors = generateDistinctColors(uniqueComponents.length);
  
  return uniqueComponents.reduce((acc, component, index) => {
    acc[component] = {
      backgroundColor: colors[index],
      borderColor: colors[index],
      // Generate a lighter version for hover state
      hoverColor: colors[index] + '80' // 80 is hex for 50% opacity
    };
    return acc;
  }, {});
};



const Scheduling = () => {
  const [form] = Form.useForm();
  const { 
    scheduleData, 
    loading, 
    error, 
    fetchScheduleData,
    setViewMode,
    viewMode,
    filterScheduleByMachines,
    filterScheduleByDateRange,
    getMachineUtilization,
    availableProductionOrders,
    conflicts
  } = useScheduleStore();

  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]); 
  const [selectedProductionOrders, setSelectedProductionOrders] = useState([]);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [scheduleView, setScheduleView] = useState('timeline');
  const [filteredData, setFilteredData] = useState(null);
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const [viewType, setViewType] = useState('week');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCompleted, setShowCompleted] = useState(true);
  const [componentColors, setComponentColors] = useState(null);
  const styleElementRef = useRef(null);
  const componentStatus = scheduleData?.component_status || {};
  const dailyProduction = scheduleData?.daily_production || {};

  const [visibleRange, setVisibleRange] = useState(() => {
    const now = moment();
    return [
      now.clone().subtract(3, 'days').startOf('day'),
      now.clone().add(3, 'days').endOf('day')
    ];
  });;

  // const [dateRange, setDateRange] = useState(() => {
  //   const now = moment();
  //   // Set visible range to current month but load more data
  //   return [
  //     now.clone().subtract(12, 'months').startOf('month'),
  //     now.clone().add(12, 'months').endOf('month')
  //   ];

  // });

  const [dateRange, setDateRange] = useState(() => {
    const now = moment();
    return [
      now.clone().subtract(3, 'days').startOf('day'),
      now.clone().add(3, 'days').endOf('day')
    ];
  });
  
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);
  

  // Initialize timeline
  useEffect(() => {
    const initializeTimeline = () => {
      if (!scheduleData || !timelineContainerRef.current) return;

      try {
        let operations = scheduleData.scheduled_operations;
        
        // Apply all filters once
        operations = operations.filter(op => {
          const matchesComponent = selectedComponents.length === 0 || selectedComponents.includes(op.component);
          const matchesOrder = selectedProductionOrders.length === 0 || selectedProductionOrders.includes(op.production_order);
          const matchesMachine = selectedMachines.length === 0 || selectedMachines.includes(op.machine);
          
          // Apply date range filter if exists
          const withinDateRange = !dateRange || !dateRange[0] || !dateRange[1] || (
            new Date(op.start_time) >= dateRange[0] && 
            new Date(op.end_time) <= dateRange[1]
          );

          return matchesComponent && matchesOrder && matchesMachine && withinDateRange;
        });

        // Generate and store component colors for filtered operations
        const colors = getComponentColors(operations);
        setComponentColors(colors);

        // Create items from filtered operations
        const items = new DataSet(
          operations.map((op, index) => ({
            id: index,
            group: op.machine,
            content: `
              <div class="timeline-item">
                <div class="item-header">${op.component}</div>
                <div class="item-desc">${op.description}</div>
                <div class="item-order">${op.production_order}</div>
              </div>
            `,
            start: new Date(op.start_time),
            end: new Date(op.end_time),
            className: `component-${op.component.replace(/[^a-zA-Z0-9]/g, '-')}`,
            operation: op,
            style: `
              background-color: ${colors[op.component].backgroundColor};
              border-color: ${colors[op.component].borderColor};
              color: white;
            `
          }))
        );

        // Remove previous dynamic styles
        if (styleElementRef.current) {
          styleElementRef.current.remove();
        }

        // Add dynamic styles for components
        const componentStyles = Object.entries(colors).map(([component, colors]) => `
          .component-${component.replace(/[^a-zA-Z0-9]/g, '-')} {
            background-color: ${colors.backgroundColor} !important;
            border-color: ${colors.borderColor} !important;
          }
          .component-${component.replace(/[^a-zA-Z0-9]/g, '-')}:hover {
            background-color: ${colors.hoverColor} !important;
          }
        `).join('\n');

        // Create and add new style element
        const styleElement = document.createElement('style');
        styleElement.textContent = componentStyles;
        document.head.appendChild(styleElement);
        styleElementRef.current = styleElement;

        // Create groups with all available machines, regardless of operations
        const groups = new DataSet(
          availableMachines.map(machine => ({
            id: machine,
            content: machine
          }))
        );

        // Get time range based on view type
        const timeRange = getTimeRange(viewType, dateRange, selectedComponents, selectedMachines, selectedProductionOrders, scheduleData);

        // Configure options
        const options = {
          stack: false,
          horizontalScroll: true,
          zoomKey: 'ctrlKey',
          orientation: 'top',
          height: '570px',
          margin: {
            item: { horizontal: 10, vertical: selectedMachines.length === 1 ? 20 : 5 },
            axis: 5
          },
          start: timeRange.start,
          end: timeRange.end,
          min: timeRange.min,
          max: timeRange.max,
          zoomMin: 1000 * 60 * 30,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 2,
          mousewheel: {
            zoom: false,
            scroll: true
          },
          editable: false,
          tooltip: {
            followMouse: true,
            overflowMethod: 'cap',
            template: function(item) {
              const op = item.operation;
              if (!op) return '';
              const status = scheduleData.component_status[op.component];
              return `
                <div class="timeline-tooltip">
                  <div class="tooltip-header">
                    <div class="info-row">
                      <span class="label">Component:</span>
                      <span class="component">${op.component}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Machine:</span>
                      <span class="value">${op.machine}</span>
                    </div>
                  </div>
                  <div class="tooltip-body">
                    <div class="info-row">
                      <span class="label">Production Order:</span>
                      <span class="value">${op.production_order}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Operation:</span>
                      <span class="value">${op.description}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Quantity:</span>
                      <span class="value">${op.quantity}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Start:</span>
                      <span class="value">${new Date(op.start_time).toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">End:</span>
                      <span class="value">${new Date(op.end_time).toLocaleString()}</span>
                    </div>
                    ${status ? `
                      <div class="progress-section">
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${Math.round((status.completed_quantity / status.total_quantity) * 100)}%"></div>
                        </div>
                        <span class="progress-text">${Math.round((status.completed_quantity / status.total_quantity) * 100)}% Complete</span>
                        <span class="status-badge ${status.on_time ? 'on-time' : 'delayed'}">
                          ${status.on_time ? 'On Time' : 'Delayed'}
                        </span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }
          },
          timeAxis: { 
            scale: getTimeAxisScale(viewType),
            step: getTimeAxisStep(viewType)
          },
          format: {
            minorLabels: {
              hour: 'HH:00',
              minute: 'HH:mm'
            },
            majorLabels: {
              hour: 'ddd D MMM',
              minute: 'HH:00'
            }
          }
        };

        // Cleanup previous timeline instance
        if (timelineRef.current) {
          timelineRef.current.destroy();
        }

        // Create new timeline
        const timeline = new Timeline(
          timelineContainerRef.current,
          items,
          groups,
          options
        );

        timelineRef.current = timeline;

        // Set the window to show the filtered operations
        timelineRef.current.setWindow(
          timeRange.start,
          timeRange.end,
          { animation: false }
        );

      } catch (error) {
        console.error('Timeline initialization error:', error);
        message.error('Failed to initialize timeline');
      }
    };

    initializeTimeline();

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
    };
  }, [scheduleData, selectedMachines, selectedComponents, selectedProductionOrders, dateRange, viewType]);

  // Helper function to get operation class name
  const getOperationClassName = (operation, status) => {
    if (!status) return 'timeline-item-normal';
    if (status.on_time) return 'timeline-item-ontime';
    return new Date(operation.end_time) > new Date(status.lead_time) 
      ? 'timeline-item-delayed' 
      : 'timeline-item-warning';
  };

  // Get unique machines from schedule data
  // const availableMachines = React.useMemo(() => {
  //   if (!scheduleData) return [];
  //   return [...new Set(scheduleData.scheduled_operations.map(op => op.machine))];
  // }, [scheduleData]);

  const availableMachines = React.useMemo(() => {
    if (!scheduleData) return [];
    
    // Helper function to check if machine is running
    const getMachineStatus = (machine) => {
      const now = new Date();
      const isRunning = scheduleData.scheduled_operations.some(op => {
        const startTime = new Date(op.start_time);
        const endTime = new Date(op.end_time);
        return op.machine === machine && startTime <= now && endTime >= now;
      });
      return isRunning;
    };

    // Get unique machines and sort by running status
    return Array.from(new Set(scheduleData.scheduled_operations.map(op => op.machine)))
      .sort((a, b) => {
        const isRunningA = getMachineStatus(a);
        const isRunningB = getMachineStatus(b);
        
        if (isRunningA && !isRunningB) return -1; // Running machines first
        if (!isRunningA && isRunningB) return 1;  // Running machines first
        return a.localeCompare(b); // Alphabetical order for same status
      });
  }, [scheduleData]);

  const availableComponents = React.useMemo(() => {
    if (!scheduleData) return [];
    return [...new Set(scheduleData.scheduled_operations
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map(op => op.component)
    )];
  }, [scheduleData]);

  // Add this effect to handle filtering
  useEffect(() => {
    if (scheduleData) {
      let filtered = scheduleData;
      
      if (selectedMachines.length > 0) {
        filtered = filterScheduleByMachines(selectedMachines);
      }
      
      if (dateRange) {
        filtered = filterScheduleByDateRange(dateRange[0], dateRange[1]);
      }

      if (selectedComponents.length > 0) {
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => 
            selectedComponents.includes(op.component)
          )
        };
      }
  
      // Add production order filtering
      if (selectedProductionOrders.length > 0) {
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => 
            selectedProductionOrders.includes(op.production_order)
          )
        };
      }
      
      setFilteredData(filtered);
    }
  }, [scheduleData, selectedMachines, selectedComponents, selectedProductionOrders, dateRange]);

  // Calculate schedule analytics
  const scheduleAnalytics = React.useMemo(() => {
    if (!scheduleData) return {
      scheduledJobs: 0,
      machineUtilization: 0,
      delayedJobs: 0
    };

    const now = new Date();
    return {
      scheduledJobs: scheduleData.scheduled_operations.length,
      machineUtilization: selectedMachines.length === 1 ? 
        getMachineUtilization(selectedMachines[0]) : 
        availableMachines.reduce((acc, machine) => acc + getMachineUtilization(machine), 0) / availableMachines.length,
      delayedJobs: scheduleData.scheduled_operations.filter(op => 
        new Date(op.end_time) > new Date(scheduleData.component_status[op.component]?.lead_time)
      ).length
    };
  }, [scheduleData, selectedMachines]);

  // Handle apply filters
  const handleApplyFilters = () => {
    const values = form.getFieldsValue();
    setSelectedMachines(values.machines || []);
    setDateRange(values.dateRange);
    setViewMode(values.viewMode);
    setScheduleView(values.scheduleView);
  };

  const handleReschedule = async (values) => {
    try {
      const { reason, newTimeSlot, notes } = values;
      const [startTime, endTime] = newTimeSlot;

      // Get the selected operation from the store
      const { scheduleData, rescheduleOperation } = useScheduleStore.getState();
      
      // Call the reschedule function from the store
      const success = await rescheduleOperation(
        values.operationId,
        startTime.toISOString(),
        endTime.toISOString(),
        reason
      );

      if (success) {
        message.success('Operation rescheduled successfully');
        setIsRescheduleModalVisible(false);
        // Refresh the schedule data
        fetchScheduleData();
      } else {
        message.error('Failed to reschedule operation');
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      message.error('An error occurred while rescheduling');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Loading schedule data..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Schedule"
        description={error}
        type="error"
        showIcon
      />
    );
  }
  
  const handleViewTypeChange = (newViewType) => {
    setViewType(newViewType);
    
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      const timeRange = getTimeRange(newViewType, null, selectedComponents, selectedMachines, selectedProductionOrders, scheduleData);
      
      setVisibleRange([
        moment(timeRange.start),
        moment(timeRange.end)
      ]);
      
      if (timelineRef.current) {
        timelineRef.current.setWindow(
          timeRange.start,
          timeRange.end,
          { animation: false }
        );
      }
    }
  };

  const handleTimelineNavigation = (direction) => {
    if (!timelineRef.current) return;

    const currentWindow = timelineRef.current.getWindow();
    const start = moment(currentWindow.start);
    const end = moment(currentWindow.end);
    const duration = moment.duration(end.diff(start));

    let newStart, newEnd;
    switch (direction) {
      case 'left':
        newStart = start.clone().subtract(duration);
        newEnd = end.clone().subtract(duration);
        break;
      case 'right':
        newStart = start.clone().add(duration);
        newEnd = end.clone().add(duration);
        break;
      case 'today':
        const now = moment();
        const halfDuration = duration.asMilliseconds() / 2;
        newStart = now.clone().subtract(halfDuration, 'milliseconds');
        newEnd = now.clone().add(halfDuration, 'milliseconds');
        break;
    }

    timelineRef.current.setWindow(newStart.toDate(), newEnd.toDate(), { animation: true });
  };

  const renderTimelineControls = () => (
    <Space>
      <Button 
        icon={<LeftOutlined />} 
        onClick={() => handleTimelineNavigation('left')}
        tooltip="Previous Period"
      />
      <Button 
        icon={<CalendarOutlined />} 
        onClick={() => handleTimelineNavigation('today')}
        tooltip="Go to Today"
      />
      <Button 
        icon={<RightOutlined />} 
        onClick={() => handleTimelineNavigation('right')}
        tooltip="Next Period"
      />
    </Space>
  );

  const handleRefresh = () => {
    // Reset all filters
    setSelectedMachines([]);
    setSelectedComponents([]);
    setDateRange([
      moment().startOf('month'),
      moment().endOf('month')
    ]);
    // Fetch fresh data
    fetchScheduleData();
  };
  
  

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-3">
        <Tabs defaultActiveKey="schedule" type="card">
          <TabPane 
            tab={ 
              <span>
                <ScheduleOutlined /> Production Schedule
              </span>
            } 
            key="schedule"
          >
            <Card>
            <Title level={4}>Production Schedule</Title>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <Select 
                    value={viewType}
                    onChange={handleViewTypeChange}
                    style={{ width: 120 }}
                  >
                    <Option value="day">Daily</Option>
                    <Option value="week">Weekly</Option>
                    <Option value="month">Monthly</Option>
                    <Option value="year">Yearly</Option>
                  </Select>
                  <DatePicker.RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder={['Start Date', 'End Date']}
                  />
                  <Select 
                    mode="multiple" 
                    placeholder="Select Machines"
                    value={selectedMachines}
                    onChange={setSelectedMachines}
                    style={{ minWidth: 200 }}
                    allowClear
                  >
                    {availableMachines.map(machine => (
                      <Option key={machine} value={machine}>{machine}</Option>
                    ))}
                  </Select>

                  <Select
                      mode="multiple"
                      placeholder="Select Part Number"
                      value={selectedComponents}
                      onChange={setSelectedComponents}
                      style={{ minWidth: 200 }}
                      allowClear
                    >
                      {availableComponents.map(component => (
                        <Option key={component} value={component}>{component}</Option>
                      ))}
                    </Select>
                
                    <Select
                    mode="multiple"
                    placeholder="Select Production Orders"
                    value={selectedProductionOrders}
                    onChange={setSelectedProductionOrders}
                    style={{ minWidth: 200 }}
                    allowClear
                  >
                    {availableProductionOrders.map(order => (
                      <Option key={order} value={order}>{order}</Option>
                    ))}
                  </Select>

                  <Button.Group>
                    <Tooltip title="Zoom In">
                      <Button 
                        icon={<ZoomInOutlined />} 
                        onClick={() => timelineRef.current?.zoomIn(0.5)} 
                      />
                    </Tooltip>
                    <Tooltip title="Zoom Out">
                      <Button 
                        icon={<ZoomOutOutlined />} 
                        onClick={() => timelineRef.current?.zoomOut(0.5)} 
                      />
                    </Tooltip>
                    <Tooltip title="Fit Timeline">
                      <Button 
                        icon={<FullscreenOutlined />} 
                        onClick={() => timelineRef.current?.fit()} 
                      />
                    </Tooltip>
                  </Button.Group>
                  <Tooltip title="How to use timeline">
                    <Button
                      className="bg-blue-500 text-white"
                      icon={<InfoCircleOutlined />}
                      onClick={() => setIsHelpModalVisible(true)}
                    />
                  </Tooltip>
                  <Button 
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={handleRefresh} 
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              <div 
                ref={timelineContainerRef} 
                className="schedule-timeline"
                style={{ 
                  height: '590px',
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              />

              {scheduleData && componentColors && (
                <>
                  <ComponentLegend componentColors={componentColors} />
                  <MachineStatusCards 
                    machines={availableMachines}
                    operations={scheduleData.scheduled_operations}
                    componentStatus={scheduleData.component_status}
                    componentColors={componentColors}
                  />
                </>
              )}
              <style jsx global>
                {Object.entries(timelineStyles).map(([selector, styles]) => `
                  ${selector} {
                    ${Object.entries(styles).map(([prop, value]) => `${prop}: ${value};`).join('\n')}
                  }
                `).join('\n')}
              </style>

              {/* Machine Status Cards */}
              

              {/* {scheduleData && (
                <ProductionGraphs 
                  componentStatus={componentStatus} 
                  dailyProduction={dailyProduction} 
                />
              )} */}


            </Card>
          </TabPane>

          <TabPane 
            tab={ 
              <span>
                <HistoryOutlined /> Schedule History
              </span>
            } 
            key="history"
          >
            <ScheduleHistory />
          </TabPane>

          <TabPane 
            tab={ 
              <span>
                <HistoryOutlined /> Analytics
              </span>
            } 
            key="analytics"
          >
            <AnalyticsDashboard  />
          </TabPane>
        </Tabs>
      </Content>

      {/* Reschedule Modal */}
      <Modal
        title={
          <div>
            <h3 className="text-lg font-semibold">Reschedule Job</h3>
            <p className="text-sm text-gray-500">
              Provide details for rescheduling
            </p>
          </div>
        }
        open={isRescheduleModalVisible}
        onCancel={() => setIsRescheduleModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleReschedule} layout="vertical">
          <Form.Item
            name="operationId"
            label="Select Operation"
            rules={[{ required: true, message: 'Please select an operation' }]}
          >
            <Select
              placeholder="Select operation to reschedule"
              showSearch
              optionFilterProp="children"
            >
              {scheduleData?.scheduled_operations.map((op, index) => (
                <Option 
                  key={`${op.component}-${op.description}-${index}`}
                  value={`${op.component}-${op.description}-${index}`}
                >
                  {`${op.machine} - ${op.component} - ${op.description}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Rescheduling"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select placeholder="Select reason">
              <Option value="maintenance">Machine Maintenance</Option>
              <Option value="breakdown">Machine Breakdown</Option>
              <Option value="operator">Operator Unavailable</Option>
              <Option value="material">Material Shortage</Option>
              <Option value="priority">Priority Change</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="newTimeSlot"
            label="New Time Slot"
            rules={[{ required: true, message: 'Please select new time slot' }]}
          >
            <DatePicker.RangePicker 
              showTime 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item 
            name="notes" 
            label="Additional Notes"
            rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter any additional notes or comments"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsRescheduleModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Confirm Reschedule
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Timeline Help Modal */}
      <Modal
        title="How to Use Timeline"
        open={isHelpModalVisible}
        onCancel={() => setIsHelpModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsHelpModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <div className="timeline-help">
          <h4>Navigation</h4>
          <ul>
            <li>
              <LeftOutlined /> <RightOutlined /> Use arrow buttons or drag horizontally to navigate through days
            </li>
            <li>
              <CalendarOutlined /> Click "Today" button to return to current date
            </li>
          </ul>

          <h4>Zooming</h4>
          <ul>
            <li>
              <ZoomInOutlined /> Click "+" button to zoom in
            </li>
            <li>
              <ZoomOutOutlined /> Click "-" button to zoom out
            </li>
            <li>
              <FullscreenOutlined /> Click "Fit" button to fit all content
            </li>
            <li>
              Hold CTRL + Mouse wheel to zoom in/out at cursor position
            </li>
          </ul>

          <h4>Interaction</h4>
          <ul>
            <li>Click and drag timeline to move left/right</li>
            <li>Click on any task to see its details</li>
            <li>Use the date picker to jump to specific dates</li>
            <li>Select view type (Day/Week/Month/Year) to change time scale</li>
          </ul>

          <div className="timeline-help-note">
            <InfoCircleOutlined /> <strong>Note:</strong> For best experience, use CTRL + Mouse wheel for precise zooming at cursor position.
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .schedule-tabs .ant-tabs-nav {
          margin-bottom: 16px;
        }
        
        .ant-card-actions {
          background: #fafafa;
        }
        
        .hover\:shadow-md:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .timeline-help h4 {
          margin-top: 16px;
          margin-bottom: 8px;
          color: #1890ff;
        }
        .timeline-help ul {
          list-style-type: none;
          padding-left: 0;
        }
        .timeline-help li {
          margin: 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .timeline-help-note {
          margin-top: 16px;
          padding: 12px;
          background-color: #f0f5ff;
          border-radius: 4px;
          border: 1px solid #d6e4ff;
        }
        .timeline-help .anticon {
          color: #1890ff;
        }
      `}</style>
    </Layout>
  );
};

// New MachineStatusCard component


const ScheduleHistory = () => {
  const [activeTab, setActiveTab] = useState('operations');
  const [searchText, setSearchText] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const operationsColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      filters: [...new Set(historyData.map(item => item.machine))].map(machine => ({
        text: machine,
        value: machine,
      })),
      onFilter: (value, record) => record.machine === value,
    },
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
      filterable: true,
    },
    {
      title: 'Operation',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.on_time ? 'success' : 'error'}>
          {record.on_time ? 'Completed On Time' : 'Delayed'}
        </Tag>
      ),
    }
  ];

  const rescheduleColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
    },
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Old Time Slot',
      dataIndex: 'oldTimeSlot',
      key: 'oldTimeSlot',
    },
    {
      title: 'New Time Slot',
      dataIndex: 'newTimeSlot',
      key: 'newTimeSlot',
    },
    {
      title: 'Changed By',
      dataIndex: 'changedBy',
      key: 'changedBy',
    }
  ];

  return (
    <Card>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Operations History" key="operations">
          <div className="mb-4">
            <Input.Search
              placeholder="Search operations..."
              onSearch={value => setSearchText(value)}
              style={{ width: 300 }}
            />
          </div>
          <Table
            columns={operationsColumns}
            dataSource={historyData}
            loading={loading}
            rowKey="id"
            scroll={{ x: true }}
          />
        </TabPane>
        <TabPane tab="Reschedule History" key="reschedule">
          <Table
            columns={rescheduleColumns}
            dataSource={[]} // Add reschedule history data here
            loading={loading}
            rowKey="id"
            scroll={{ x: true }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

const ProductionGraphs = ({ componentStatus, dailyProduction }) => {
  // Default values in case of undefined or null data
  const validComponentStatus = componentStatus || {};
  const validDailyProduction = dailyProduction || {};

  // Prepare Component Status data for ECharts (Bar chart)
  const componentStatusData = Object.entries(validComponentStatus).map(([partno, data]) => {
    const completedQuantity = data?.completed_quantity || 0;
    const totalQuantity = data?.total_quantity || 0;
    const onTime = data?.on_time ? 'Yes' : 'No';
    const completionRate = totalQuantity > 0 ? ((completedQuantity / totalQuantity) * 100).toFixed(1) : 0;

    return {
      partno,
      completed: completedQuantity,
      total: totalQuantity,
      onTime,
      completionRate,
      scheduledEndTime: data.scheduled_end_time, // Add scheduled end time
      leadTime: data.lead_time // Add lead time
    };
  });

  // ECharts Option for Component Status (Bar chart)
  const componentStatusOption = {
    title: {
      text: "Component Status",
      left: "center",
      top: "10",
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const data = params.data;
        if (!data) {
          return '<div>No data available</div>';
        }

        const partno = data.partno || 'N/A';
        const completed = data.completed || 'N/A';
        const total = data.total || 'N/A';
        const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        const onTime = data.onTime || 'N/A';
        const scheduledEndTime = data.scheduledEndTime || 'N/A';
        const leadTime = data.leadTime || 'N/A';

        return `
          <div>
            <strong>Part Number: ${partno}</strong><br>
            Completed: ${completed}<br>
            Total: ${total}<br>
            Completion Rate: ${completionRate}%<br>
            On Time: ${onTime}<br>
            Scheduled End Time: ${new Date(scheduledEndTime).toLocaleString()}<br>
            Lead Time: ${new Date(leadTime).toLocaleString()}
          </div>`;
      }
    },
    xAxis: {
      type: "category",
      data: componentStatusData.map((item) => item.partno),
      axisLabel: {
        rotate: 45,
        textStyle: { fontSize: 12 }
      }
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        name: "Completed",
        type: "bar",
        data: componentStatusData.map((item) => item.completed),
        itemStyle: { color: "#4CAF50" }
      },
      {
        name: "Total Required",
        type: "bar",
        data: componentStatusData.map((item) => item.total),
        itemStyle: { color: "#2196F3" }
      }
    ]
  };

  // Prepare Daily Production data for ECharts (Line chart)
  const dailyProductionData = [];
  Object.entries(validDailyProduction).forEach(([partno, dateData]) => {
    Object.entries(dateData).forEach(([date, quantity]) => {
      const formattedDate = new Date(date).toLocaleDateString();
      const existingEntry = dailyProductionData.find(entry => entry.date === formattedDate);
      if (existingEntry) {
        existingEntry.quantity += quantity;
      } else {
        dailyProductionData.push({
          date: formattedDate,
          quantity,
          partno
        });
      }
    });
  });

  // Sort the daily production data by date
  dailyProductionData.sort((a, b) => new Date(a.date) - new Date(b.date));

  // ECharts Option for Daily Production (Line chart)
  const dailyProductionOption = {
    title: {
      text: "Daily Production Schedule",
      left: "center",
      top: "10",
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const data = params.data;
        if (!data) {
          return '<div>No data available</div>';
        }

        const date = data.date || 'N/A';
        const partno = data.partno || 'N/A';
        const quantity = data.quantity || 'N/A';

        return `
          <div>
            <strong>Date: ${date}</strong><br>
            Part Number: ${partno}<br>
            Quantity: ${quantity}
          </div>`;
      }
    },
    xAxis: {
      type: "category",
      data: dailyProductionData.map((item) => item.date),
      axisLabel: {
        rotate: 45,
        textStyle: { fontSize: 12 }
      }
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        name: "Production Quantity",
        type: "line",
        data: dailyProductionData.map((item) => item.quantity),
        smooth: true,
        lineStyle: { color: "#FF5722" },
        itemStyle: { color: "#FF5722" }
      }
    ]
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Component Status Graph */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Component Status</h3>
        <div style={{ height: "400px" }}>
          <ReactECharts option={componentStatusOption} />
        </div>
      </div>

      {/* Daily Production Graph */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Production Schedule</h3>
        <div style={{ height: "400px" }}>
          <ReactECharts option={dailyProductionOption} />
        </div>
      </div>
    </div>
  );
};


const styles = {
  wrapper: `
    .machine-status-card {
      transition: all 0.3s ease;
    }
    .machine-status-card:hover {
      transform: translateY(-2px);
    }
    .ant-timeline-item-content {
      margin-left: 20px !important;
    }
    .ant-card {
      border-radius: 8px;
    }
    .ant-select-selector {
      border-radius: 6px !important;
    }
    .ant-btn {
      border-radius: 6px;
    }
    .schedule-chart {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  `
};

// Add helper function for time range calculation
// const getTimeRange = (viewType, dateRange) => {
//   if (dateRange && dateRange[0] && dateRange[1]) {
//     return {
//       start: dateRange[0].toDate(),
//       end: dateRange[1].toDate()
//     };
//   }

//   const now = new Date();
//   let start = new Date(now);
//   let end = new Date(now);

//   switch (viewType) {
//     case 'month':
//       start.setDate(1);
//       end.setMonth(end.getMonth() + 1, 0);
//       break;
//     case 'week':
//       start.setDate(start.getDate() - start.getDay());
//       end.setDate(end.getDate() + (6 - end.getDay()));
//       break;
//     default: // day
//       start.setHours(0, 0, 0, 0);
//       end.setHours(23, 59, 59, 999);
//   }

//   return { start, end };
// };

const getTimeRange = (viewType, dateRange, selectedComponents, selectedMachines, selectedProductionOrders, scheduleData) => {
  // If date range is selected, use it as the primary window
  if (dateRange && dateRange[0] && dateRange[1]) {
    return {
      start: dateRange[0].toDate(),
      end: dateRange[1].toDate(),
      min: dateRange[0].clone().subtract(1, 'year').toDate(),
      max: dateRange[1].clone().add(1, 'year').toDate()
    };
  }

  // If any filters are applied, find the earliest operation start date
  if ((selectedComponents?.length > 0 || selectedMachines?.length > 0 || selectedProductionOrders?.length > 0) && scheduleData) {
    const filteredOps = scheduleData.scheduled_operations.filter(op => {
      const matchesComponent = selectedComponents.length === 0 || selectedComponents.includes(op.component);
      const matchesMachine = selectedMachines.length === 0 || selectedMachines.includes(op.machine);
      const matchesOrder = selectedProductionOrders.length === 0 || selectedProductionOrders.includes(op.production_order);
      return matchesComponent && matchesMachine && matchesOrder;
    });

    if (filteredOps.length > 0) {
      const startTimes = filteredOps.map(op => new Date(op.start_time));
      const endTimes = filteredOps.map(op => new Date(op.end_time));
      const earliestStart = moment(Math.min(...startTimes));
      const latestEnd = moment(Math.max(...endTimes));

      // Add some padding before and after
      return {
        start: earliestStart.subtract(12, 'hours').startOf('hour').toDate(),
        end: latestEnd.add(12, 'hours').endOf('hour').toDate(),
        min: earliestStart.clone().subtract(1, 'month').toDate(),
        max: latestEnd.clone().add(1, 'month').toDate()
      };
    }
  }

  // Default ranges based on view type
  const now = moment();
  let start, end, min, max;
  
  switch (viewType) {
    case 'year':
      start = now.clone().startOf('year');
      end = now.clone().endOf('year');
      min = start.clone().subtract(1, 'year');
      max = end.clone().add(1, 'year');
      break;
    case 'month':
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
      min = start.clone().subtract(6, 'months');
      max = end.clone().add(6, 'months');
      break;
    case 'week':
      start = now.clone().startOf('week');
      end = now.clone().endOf('week');
      min = start.clone().subtract(1, 'month');
      max = end.clone().add(1, 'month');
      break;
    default: // day
      start = now.clone().startOf('day');
      end = now.clone().endOf('day');
      min = start.clone().subtract(2, 'weeks');
      max = end.clone().add(2, 'weeks');
  }

  return {
    start: start.toDate(),
    end: end.toDate(),
    min: min.toDate(),
    max: max.toDate()
  };
};

export default Scheduling;