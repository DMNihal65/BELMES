import React, { useEffect, useState, useRef } from 'react';
import {
  Layout, Card, Row, Col, Button, Space, Input, Select, 
  DatePicker, Table, Tag, Form, Modal, Typography, Divider,
  Tabs, Badge, Alert, Tooltip, Progress, Statistic,
  message, Spin, Switch
} from 'antd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  ScheduleOutlined, SyncOutlined, HistoryOutlined, CalendarOutlined, 
  ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, LeftOutlined, 
  RightOutlined, InfoCircleOutlined, UserOutlined ,   
} from '@ant-design/icons';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data/esnext";
import "vis-timeline/dist/vis-timeline-graph2d.css";
import useScheduleStore from '../../../store/schedule-store';
import moment from 'moment';
import AnalyticsDashboard from './Analytics/AnalyticsDashboard';
import { ComponentLegend, MachineStatusCards } from './Schedule/ComponentsAndStatus';
import OrderStatusDashboard from './OrderStatus/OrderStatusDashboard';
// import DynamicSchedulingGraphCopy from './DynamicScheduling/DynamicSchedulingGraphCopy';
import DynamicSchedulingGraph from './DynamicScheduling/DynamicSchedulingGraph';


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

  const [dateRange, setDateRange] = useState(null);

  const [visibleRange, setVisibleRange] = useState(() => {
    const now = moment();
    return [
      now.clone().subtract(3, 'days').startOf('day'),
      now.clone().add(3, 'days').endOf('day')
    ];
  });
  
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  // Get unique machines from schedule data
  const availableMachines = React.useMemo(() => {
    if (!scheduleData?.work_centers) return [];
    
    // Get all machines from work_centers in the order they appear in the API
    const workCenterMachines = scheduleData.work_centers.flatMap(wc => 
      wc.machines.map(machine => ({
        id: machine.id,  // Original machine ID
        machineId: `${wc.work_center_code}-${machine.id}`,  // Unique identifier using work centre code and machine ID
        name: machine.name,
        work_center_code: wc.work_center_code,
        work_center_name: wc.work_center_name,
        displayName: `${wc.work_center_code} - ${machine.name}`,  // Display format
        order: scheduleData.work_centers.indexOf(wc) * 100 + wc.machines.indexOf(machine) // Preserve order
      }))
    );
    
    // Get machines from scheduled operations to check which ones are running
    const scheduledMachines = new Set(scheduleData.scheduled_operations?.map(op => op.machine) || []);
    
    // Helper function to check if machine is running
    const getMachineStatus = (machineId) => {
      const now = new Date();
      const isRunning = scheduleData.scheduled_operations?.some(op => {
        const startTime = new Date(op.start_time);
        const endTime = new Date(op.end_time);
        return op.machine === machineId && startTime <= now && endTime >= now;
      });
      return isRunning;
    };

    // Sort machines: first by their original order, then by running status
    return workCenterMachines.sort((a, b) => {
      // First sort by the original order from the API
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      
      // If order is the same, sort by running status
      const isRunningA = getMachineStatus(a.machineId);
      const isRunningB = getMachineStatus(b.machineId);
      
      if (isRunningA && !isRunningB) return -1;
      if (!isRunningA && isRunningB) return 1;
      
      return 0;
    });
  }, [scheduleData]);

  // Create machine mapping at component level
  const machineMapping = React.useMemo(() => {
    if (!scheduleData?.work_centers || !availableMachines) return new Map();
    
    const mapping = new Map();
    availableMachines.forEach(machine => {
      mapping.set(machine.machineId, machine.machineId);
      mapping.set(`${machine.work_center_code}-${machine.name}`, machine.machineId);
    });
    return mapping;
  }, [scheduleData?.work_centers, availableMachines]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);
  

  // Initialize timeline
  useEffect(() => {
    const initializeTimeline = () => {
      if (!scheduleData || !timelineContainerRef.current) return;

      try {
        let operations = scheduleData.scheduled_operations;
        
        // Only filter by components, machines, and production orders
        operations = operations.filter(op => {
          const matchesComponent = selectedComponents.length === 0 || selectedComponents.includes(op.component);
          const matchesOrder = selectedProductionOrders.length === 0 || selectedProductionOrders.includes(op.production_order);
          const matchesMachine = selectedMachines.length === 0 || selectedMachines.includes(machineMapping.get(op.machine));
          
          return matchesComponent && matchesOrder && matchesMachine;
        });

        // Generate and store component colors for filtered operations
        const colors = getComponentColors(operations);
        setComponentColors(colors);

        // Create items from filtered operations
        const items = new DataSet(
          operations.map((op, index) => ({
            id: index,
            group: machineMapping.get(op.machine) || op.machine,  // Map to our internal machine ID
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

        // Create groups with all available machines in the correct order
        const groups = new DataSet(
          availableMachines.map(machine => ({
            id: machine.machineId,  // Use our unique internal machine ID
            content: `
              <div class="machine-group">
                <span class="machine-name">
                  ${machine.displayName}
                </span>
              </div>
            `,
            className: operations.some(op => machineMapping.get(op.machine) === machine.machineId) ? 'machine-with-ops' : 'machine-without-ops',
            order: machine.order // Add order property to maintain sorting
          }))
        );

        // Remove previous dynamic styles
        if (styleElementRef.current) {
          styleElementRef.current.remove();
        }

        // Add dynamic styles for components and machines
        const styles = `
          ${Object.entries(colors).map(([component, colors]) => `
            .component-${component.replace(/[^a-zA-Z0-9]/g, '-')} {
              background-color: ${colors.backgroundColor} !important;
              border-color: ${colors.borderColor} !important;
            }
            .component-${component.replace(/[^a-zA-Z0-9]/g, '-')}:hover {
              background-color: ${colors.hoverColor} !important;
            }
          `).join('\n')}
          
          .machine-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px;
          }
          .machine-status {
            margin-left: 8px;
          }
          .machine-status.has-ops {
            color: #52c41a;
          }
          .machine-status.no-ops {
            color: #d9d9d9;
          }
          .machine-with-ops {
            font-weight: 500;
          }
          .machine-without-ops {
            color: #8c8c8c;
          }
        `;

        // Create and add new style element
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
        styleElementRef.current = styleElement;

        // Get time range based on view type and date range
        const timeRange = getTimeRange(viewType, dateRange, selectedComponents, selectedMachines, selectedProductionOrders, scheduleData);

        // Configure options
        const options = {
          stack: false,
          horizontalScroll: true,
          zoomKey: 'ctrlKey',
          orientation: 'top',
          height: '670px',
          margin: {
            item: { horizontal: 10, vertical: selectedMachines.length === 1 ? 20 : 5 },
            axis: 5
          },
          start: timeRange.start,
          end: timeRange.end,
          min: timeRange.dataMin,
          max: timeRange.dataMax,
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
                      <span class="label">Part Number:</span>
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
          },
          hiddenDates: [
            {
              start: '1970-01-01 00:00:00',
              end: '1970-01-01 09:00:00',
              repeat: 'daily'
            },
            {
              start: '1970-01-01 17:00:00',
              end: '1970-01-01 23:59:59',
              repeat: 'daily'
            }
          ]
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
        toast.success('Operation rescheduled successfully');
        setIsRescheduleModalVisible(false);
        // Refresh the schedule data
        fetchScheduleData();
      } else {
        toast.error('Failed to reschedule operation');
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('An error occurred while rescheduling');
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
  
    let newStart, newEnd;
    
    // Handle navigation based on viewType without limitations
    switch (viewType) {
      case 'day':
        // For daily view, move exactly one day at a time
        switch (direction) {
          case 'left':
            newStart = start.clone().subtract(1, 'day').hour(9).minute(0).second(0);
            newEnd = end.clone().subtract(1, 'day').hour(17).minute(0).second(0);
            break;
          case 'right':
            newStart = start.clone().add(1, 'day').hour(9).minute(0).second(0);
            newEnd = end.clone().add(1, 'day').hour(17).minute(0).second(0);
            break;
          case 'today':
            newStart = moment().startOf('day').hour(9).minute(0).second(0);
            newEnd = moment().endOf('day').hour(17).minute(0).second(0);
            break;
        }
        break;
      
      case 'week':
        // For weekly view, move exactly one week at a time
        switch (direction) {
          case 'left':
            newStart = start.clone().subtract(1, 'week');
            newEnd = end.clone().subtract(1, 'week');
            break;
          case 'right':
            newStart = start.clone().add(1, 'week');
            newEnd = end.clone().add(1, 'week');
            break;
          case 'today':
            newStart = moment().startOf('week');
            newEnd = moment().endOf('week');
            break;
        }
        break;
  
      case 'month':
        // For monthly view, move exactly one month at a time
        switch (direction) {
          case 'left':
            newStart = start.clone().subtract(1, 'month');
            newEnd = end.clone().subtract(1, 'month');
            break;
          case 'right':
            newStart = start.clone().add(1, 'month');
            newEnd = end.clone().add(1, 'month');
            break;
          case 'today':
            newStart = moment().startOf('month');
            newEnd = moment().endOf('month');
            break;
        }
        break;
  
      case 'year':
        // For yearly view, move exactly one year at a time
        switch (direction) {
          case 'left':
            newStart = start.clone().subtract(1, 'year');
            newEnd = end.clone().subtract(1, 'year');
            break;
          case 'right':
            newStart = start.clone().add(1, 'year');
            newEnd = end.clone().add(1, 'year');
            break;
          case 'today':
            newStart = moment().startOf('year');
            newEnd = moment().endOf('year');
            break;
        }
        break;
    }
  
    // Set the new window with animation
    timelineRef.current.setWindow(newStart.toDate(), newEnd.toDate(), { animation: true });
  };

  const handleRefresh = () => {
    // Reset all filters
    setSelectedMachines([]);
    setSelectedComponents([]);
    setDateRange(null);
    // Fetch fresh data
    fetchScheduleData();
  };
  
  

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content >
      <ToastContainer position="top-right" autoClose={5000} />
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
              <Tabs defaultActiveKey="schedule-graph" className="compact-tabs">
                <TabPane 
                  tab="Machine Schedule" 
                  key="schedule-graph"
                >
                  {/* <Title level={4}>Production Schedule</Title> */}
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
                            <Option key={machine.machineId} value={machine.machineId}>
                              {machine.displayName}
                            </Option>
                          )) || []}
                        </Select>

                        <Select
                            mode="multiple"
                            placeholder="Select Part Number"
                            value={selectedComponents}
                            onChange={setSelectedComponents}
                            style={{ minWidth: 200 }}
                            allowClear
                            optionLabelProp="label"
                          >
                            {availableComponents.map(component => {
                              const color = componentColors?.[component]?.backgroundColor || '#1890ff';
                              return (
                                <Option 
                                  key={component} 
                                  value={component}
                                  label={component}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ 
                                      width: '16px', 
                                      height: '16px', 
                                      backgroundColor: color,
                                      borderRadius: '4px'
                                    }} />
                                    {component}
                                  </div>
                                </Option>
                              );
                            })}
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
                  <div className="relative">
                    <div className="absolute top-2 left-0 right-0 flex justify-between px-2 z-10">
                      <Button
                        icon={<LeftOutlined />}
                        onClick={() => handleTimelineNavigation('left')}
                      />
                      <Button
                        icon={<RightOutlined />}
                        onClick={() => handleTimelineNavigation('right')}
                      />
                    </div>
                    <div 
                      ref={timelineContainerRef} 
                      className="schedule-timeline"
                      style={{ 
                        height: '690px',
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>

                  {scheduleData && componentColors && (
                    <ComponentLegend componentColors={componentColors} />
                  )}
             

             
                </TabPane>
                {/* <TabPane 
                  tab="Dynamic Scheduling Graph" 
                  key="dynamic-scheduling"
                >
                  <DynamicSchedulingGraph />
                </TabPane> */}
                <TabPane 
                  tab="Dynamic Scheduling Graph" 
                  key="dynamic-scheduling"
                >
                  <DynamicSchedulingGraph />
                </TabPane>
                <TabPane 
                  tab="Machine Status" 
                  key="machine-status"
                >
                  {scheduleData && componentColors && availableMachines && (
                    <MachineStatusCards 
                      machines={availableMachines}
                      operations={scheduleData.scheduled_operations.map(op => ({
                        ...op,
                        machine: machineMapping.get(op.machine) || op.machine
                      }))}
                      componentStatus={scheduleData.component_status}
                      componentColors={componentColors}
                    />
                  )}
                </TabPane>
              </Tabs>

              <style jsx global>
                {Object.entries(timelineStyles).map(([selector, styles]) => `
                  ${selector} {
                    ${Object.entries(styles).map(([prop, value]) => `${prop}: ${value};`).join('\n')}
                  }
                `).join('\n')}
              </style>
            </Card>
          </TabPane>

          {/* <TabPane 
            tab={ 
              <span>
                <HistoryOutlined /> Schedule History
              </span>
            } 
            key="history"
          >
            <ScheduleHistory />
          </TabPane> */}


          

          {/* <TabPane 
            tab={ 
              <span>
                <HistoryOutlined /> Analytics
              </span>
            } 
            key="analytics"
          >
            <AnalyticsDashboard  />
          </TabPane> */}
          {/* <TabPane 
            tab={ 
              <span>
                <UserOutlined /> Production Order Statuss
              </span>
            } 
            key="order-status"
          >
            <OrderStatusDashboard scheduleData={scheduleData} />
          </TabPane> */}
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
                  value={`${op.machine} - ${op.component} - ${op.description}`}
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
            {/* <li>Click and drag timeline to move left/right</li> */}
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
          margin-top: 2px;
          margin-bottom: 2px;
          color: #1890ff;
        }

        /* Add these new styles for compact tabs */
        .compact-tabs .ant-tabs-nav {
          margin-bottom: 8px !important;
        }

        .compact-tabs .ant-tabs-tab {
          padding: 4px 12px !important;
        }

        .compact-tabs .ant-tabs-nav-list {
          gap: 4px;
        }

        .compact-tabs .ant-tabs-content-holder {
          margin-top: 8px;
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

const getTimeRange = (viewType, dateRange, selectedComponents, selectedMachines, selectedProductionOrders, scheduleData) => {
  let start, end, dataMin, dataMax;
  const now = moment();

  // Calculate the full data range first
  if (scheduleData && scheduleData.scheduled_operations.length > 0) {
    const allStartTimes = scheduleData.scheduled_operations.map(op => new Date(op.start_time));
    const allEndTimes = scheduleData.scheduled_operations.map(op => new Date(op.end_time));
    
    // Get the earliest and latest dates from the data
    const earliestDate = moment(Math.min(...allStartTimes));
    const latestDate = moment(Math.max(...allEndTimes));
    
    // Set data range without limitations
    dataMin = earliestDate.clone().subtract(10, 'years').toDate();
    dataMax = latestDate.clone().add(10, 'years').toDate();
  } else {
    // If no data, provide wide default ranges
    dataMin = now.clone().subtract(10, 'years').toDate();
    dataMax = now.clone().add(10, 'years').toDate();
  }

  // Set the visible window based on date range or view type
  if (dateRange && dateRange[0] && dateRange[1]) {
    // Use date range for visible window
    start = dateRange[0].clone().hour(9).minute(0).second(0).toDate();
    end = dateRange[1].clone().hour(17).minute(0).second(0).toDate();
  } else {
    // Use view type for visible window
    switch (viewType) {
      case 'year':
        start = now.clone().startOf('year').hour(9).minute(0).second(0).toDate();
        end = now.clone().endOf('year').hour(17).minute(0).second(0).toDate();
        break;
      case 'month':
        start = now.clone().startOf('month').hour(9).minute(0).second(0).toDate();
        end = now.clone().endOf('month').hour(17).minute(0).second(0).toDate();
        break;
      case 'week':
        start = now.clone().startOf('week').hour(9).minute(0).second(0).toDate();
        end = now.clone().endOf('week').hour(17).minute(0).second(0).toDate();
        break;
      default: // day
        start = now.clone().startOf('day').hour(9).minute(0).second(0).toDate();
        end = now.clone().endOf('day').hour(17).minute(0).second(0).toDate();
    }
  }

  return {
    start,
    end,
    dataMin,
    dataMax
  };
};

export default Scheduling;