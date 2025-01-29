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
  ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined
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
    case 'day': return 'hour';   // Scale for day: hours (changed from 'minute')
    default: return 'hour';      // Default scale: hours
  }
};

const getTimeAxisStep = (viewType) => {
  switch (viewType) {
    case 'year': return 1;  // Step for year: 1 month
    case 'month': return 1; // Step for month: 1 day
    case 'week': return 6;  // Step for week: 6 hours
    case 'day': return 1;   // Step for day: 1 hour (changed from 30)
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
  const [viewType, setViewType] = useState('month');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCompleted, setShowCompleted] = useState(true);
  const [componentColors, setComponentColors] = useState(null);
  const styleElementRef = useRef(null);
  const componentStatus = scheduleData?.component_status || {};
  const dailyProduction = scheduleData?.daily_production || {};

  const [visibleRange, setVisibleRange] = useState(() => {

    const now = moment();

    return [
      now.clone().startOf('month'),
      now.clone().endOf('month')
    ];

  });

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
      now.clone().startOf('month'),
      now.clone().endOf('month')
    ];
  });
  


  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);
  

  // Initialize timeline
  useEffect(() => {
    const initializeTimeline = () => {
      if (!scheduleData || !timelineContainerRef.current) return;

      try {
        let operations = scheduleData.scheduled_operations;
        
        // Apply filters
        if (selectedMachines.length > 0) {
          operations = operations.filter(op => selectedMachines.includes(op.machine));
        }

        if (selectedComponents.length > 0) {
          operations = operations.filter(op => selectedComponents.includes(op.component));
        }

        if (selectedProductionOrders.length > 0) {
          operations = operations.filter(op => selectedProductionOrders.includes(op.production_order));
        }

          // Create groups based on available machines in filtered operations
      const filteredMachines = [...new Set(operations.map(op => op.machine))];
      const groups = new DataSet(
        filteredMachines.map(machine => ({
          id: machine,
          content: machine
        }))
      );
        
        if (dateRange && dateRange[0] && dateRange[1]) {
          operations = operations.filter(op => {
            const opStart = new Date(op.start_time);
            const opEnd = new Date(op.end_time);
            return opStart >= dateRange[0] && opEnd <= dateRange[1];
          });
        }

         // Filter by selected components
         if (selectedComponents.length > 0) {
          operations = operations.filter(op => selectedComponents.includes(op.component));
        }
        

        // Generate and store component colors
        const colors = getComponentColors(operations);
        setComponentColors(colors);

        // Create items with proper date handling
        const items = new DataSet(
          operations.map((op, index) => ({
            id: index,
            group: op.machine,
            content: `
              <div class="timeline-item">
                <div class="item-header">${op.component}</div>
                <!-- <div class="item-desc">${op.description}</div> -->
                <!-- <div class="item-qty">${op.quantity}</div> -->
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

        // Create groups
        // const groups = new DataSet(
        //   availableMachines.map(machine => ({
        //     id: machine,
        //     content: machine
        //   }))
        // );
        // const groups = new DataSet(
        //   (selectedMachines.length > 0 ? selectedMachines : availableMachines).map(machine => ({
        //     id: machine,
        //     content: machine
        //   }))
        // );
        // Get time range based on view type
        const timeRange = getTimeRange(viewType, dateRange, selectedComponents, scheduleData);


        // Configure options
        const options = {
          stack: false,
          horizontalScroll: true,
          zoomKey: 'ctrlKey',
          orientation: 'top',
          height: '560px',
          margin: {
            item: { horizontal: 10, vertical: selectedMachines.length === 1 ? 20 : 5 },
            axis: 5
          },
          // start: visibleRange[0].toDate(),  // Use visibleRange for initial view
          // end: visibleRange[1].toDate(),
          start: timeRange.start,
          end: timeRange.end,

          min: dateRange[0].toDate(),       // Use dateRange for scrollable bounds
          max: dateRange[1].toDate(),
          zoomMin: 1000 * 60 * 60 * 24,
          zoomMax: 1000 * 60 * 60 * 24 * 365,
          editable: false,
          tooltip: {
            followMouse: true,
            overflowMethod: 'cap',
            template: function(item) {
              const op = item.operation;
              if (!op) return ''; // Add null check
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
            step: getTimeAxisStep(viewType) // Step by month for yearly view
          },
          format: {
            minorLabels: {
              hour: 'HH:mm',
              minute: 'HH:mm'
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

        // Add event handlers
        timeline.on('select', (properties) => {
          const selectedItem = items.get(properties.items?.[0]);
          if (selectedItem?.operation) {
            showOperationDetails(selectedItem.operation);
          }
        });

        timelineRef.current = timeline;
        // Initial fit with delay to ensure proper rendering
        timelineRef.current.setWindow(
          visibleRange[0].toDate(),
          visibleRange[1].toDate(),
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
  }, [scheduleData, selectedMachines, selectedComponents,selectedProductionOrders, dateRange, viewType, visibleRange]);

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
    // Use Set to get unique machines while preserving the order they first appear
    return Array.from(new Set(scheduleData.scheduled_operations
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map(op => op.machine)
    ));
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
    const now = moment();
    
    switch (newViewType) {
      case 'year': // New case for yearly view
        setDateRange([
          now.clone().startOf('year'),
          now.clone().endOf('year')
        ]);
        break;
      case 'month':
        setDateRange([
          now.clone().startOf('month'),
          now.clone().endOf('month')
        ]);
        break;
      case 'week':
        // Set date range to 3 days before and after current day
        setDateRange([
          now.clone().subtract(3, 'days').startOf('day'),
          now.clone().add(3, 'days').endOf('day')
        ]);
        break;
      default: // day
        setDateRange([
          now.clone().startOf('day'),
          now.clone().endOf('day')
        ]);
    }
  };

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
              <div className="flex justify-between items-center mb-4">
                <Space>
                  <Title level={4}>Production Schedule</Title>
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
                </Space>
                <Space>
                <DatePicker.RangePicker
                  // value={dateRange}
                  onChange={(dates, dateStrings) => {
                    if (dates) {
                      const [start, end] = dates;
                      switch (viewType) {
                        case 'year':
                          setDateRange([
                            start.startOf('year'),
                            end.endOf('year')
                          ]);
                          break;
                        case 'month':
                          // Set to first and last day of selected months
                          setDateRange([
                            start.startOf('month'),
                            end.endOf('month')
                          ]);
                          break;
                        case 'week':
                          // Allow day-to-day selection within weeks
                          setDateRange([
                            start.startOf('day'),  // Changed from startOf('week')
                            end.endOf('day')       // Changed from endOf('week')
                          ]);
                          break;
                          default:
                          // Set to start and end of selected days
                          setDateRange([
                            start.startOf('day'),
                            end.endOf('day')
                          ]);
                          // break;
                      }
                    }
                    //  else {
                    //   setDateRange(null);
                    // }
                  }}
                  placeholder={['Start Date', 'End Date']}
                  picker={viewType === 'month' ? 'month' : 'date'}  // Changed: always use 'date' for week view
                  showTime={false}
                  format={
                    viewType === 'month' 
                      ? 'YYYY MMM'
                      : 'YYYY-MM-DD'  // Changed: use same format for week and day views
                  }
                  allowClear={true}
                  ranges={{
                    'Today': [moment().startOf('day'), moment().endOf('day')],
                    'This Week': [moment().startOf('week'), moment().endOf('week')],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Next Month': [
                      moment().add(1, 'month').startOf('month'),
                      moment().add(1, 'month').endOf('month')
                    ]
                  }}
                  onOpenChange={(open) => {
                    // Reset to current date range if cleared
                    if (!open && !dateRange) {
                      const now = moment();
                      switch (viewType) {
                        case 'month':
                          setDateRange([
                            now.clone().startOf('month'),
                            now.clone().endOf('month')
                          ]);
                          break;
                        case 'week':
                          setDateRange([
                            now.clone().startOf('day'),  // Changed from startOf('week')
                            now.clone().endOf('day')     // Changed from endOf('week')
                          ]);
                          break;
                        case 'day':
                          setDateRange([
                            now.clone().startOf('day'),
                            now.clone().endOf('day')
                          ]);
                          break;
                      }
                    }
                  }}
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
                      placeholder="Select Component Number"
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
                  <Button 
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={handleRefresh} 
                  >
                    Refresh
                  </Button>
                </Space>
              </div>

              <div 
                ref={timelineContainerRef} 
                className="schedule-timeline"
                style={{ 
                  height: '580px',
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
              

              {scheduleData && (
                <ProductionGraphs 
                  componentStatus={componentStatus} 
                  dailyProduction={dailyProduction} 
                />
              )}


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

const getTimeRange = (viewType, dateRange, selectedComponents, scheduleData) => {
  if (selectedComponents?.length > 0 && scheduleData) {
    // When componentnumbers are selected, get the full range of their operations
    const filteredOps = scheduleData.scheduled_operations.filter(op => 
      selectedComponents.includes(op.component)
    );
    
    if (filteredOps.length > 0) {
      const startTimes = filteredOps.map(op => new Date(op.start_time));
      const endTimes = filteredOps.map(op => new Date(op.end_time));
      const earliestStart = moment(Math.min(...startTimes));
      const latestEnd = moment(Math.max(...endTimes));
      
      // Add padding before and after
      return {
        start: earliestStart.subtract(1, 'day').startOf('day').toDate(),
        end: latestEnd.add(1, 'day').endOf('day').toDate()
      };
    }
  }

  if (dateRange && dateRange[0] && dateRange[1]) {
    return {
      start: dateRange[0].toDate(),
      end: dateRange[1].toDate()
    };
  }

  const now = moment();
  let start, end;

  ////current data 
  // switch (viewType) {
  //   case 'month':
  //     // Set to current month's start and end
  //     start = now.clone().startOf('month');
  //     end = now.clone().endOf('month');
  //     break;
  //   case 'week':
  //     start = now.clone().startOf('week');
  //     end = now.clone().endOf('week');
  //     break;
  //   default: // day
  //     start = now.clone().startOf('day');
  //     end = now.clone().endOf('day');
  // }

      //past and future dates
      // Set to current month's start and end
      switch (viewType) {
        case 'year':
          start = now.clone().subtract(1, 'year').startOf('year');
          end = now.clone().add(1, 'year').endOf('year');
          break;
      case 'month':
        start = now.clone().subtract(3, 'months').startOf('month');
        end = now.clone().add(3, 'months').endOf('month');
        break;
      case 'week':
        // Show 3 days before and after current day
        start = now.clone().subtract(3, 'days').startOf('day');
        end = now.clone().add(3, 'days').endOf('day');
        break;
      default: // day
        start = now.clone().subtract(2, 'weeks').startOf('day');
        end = now.clone().add(2, 'weeks').endOf('day');
      }
      return { start: start.toDate(), end: end.toDate() };
};

export default Scheduling;