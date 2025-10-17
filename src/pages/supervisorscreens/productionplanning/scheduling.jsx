import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  RightOutlined, InfoCircleOutlined, UserOutlined, ReloadOutlined,
  ExclamationCircleOutlined   
} from '@ant-design/icons';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data/esnext";
import "vis-timeline/dist/vis-timeline-graph2d.css";
import useScheduleStore from '../../../store/schedule-store';
import moment from 'moment';
// Explicitly set Monday as the start of the week
moment.updateLocale('en', {
  week: {
    dow: 1, // Monday is the first day of the week
    doy: 4  // The week containing Jan 4 is the first week of the year.
  }
});
import AnalyticsDashboard from './Analytics/AnalyticsDashboard';
import { ComponentLegend, MachineStatusCards } from './Schedule/ComponentsAndStatus';
import OrderStatusDashboard from './OrderStatus/OrderStatusDashboard';
// import DynamicSchedulingGraphCopy from './DynamicScheduling/DynamicSchedulingGraphCopy';
import DynamicSchedulingGraph from './DynamicScheduling/DynamicSchedulingGraph';
import ScheduleTimelineChart from './ScheduleTimeline';
import PlannedScheduleTimeline from './PlannedScheduleTimeline';


const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

// Add styles (keeping existing styles)
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

// Helper functions for timeline (keeping existing functions)
const getTimeAxisScale = (viewType) => {
  switch (viewType) {
    case 'year': return 'month';
    case 'month': return 'day';
    case 'week': return 'hour';
    case 'day': return 'hour';
    default: return 'hour';
  }
};

const getTimeAxisStep = (viewType) => {
  switch (viewType) {
    case 'year': return 1;
    case 'month': return 1;
    case 'week': return 6;
    case 'day': return 1;
    default: return 1;
  }
};

const getDurationByViewType = (viewType) => {
  switch (viewType) {
    case 'year': return 1000 * 60 * 60 * 24 * 365;
    case 'month': return 1000 * 60 * 60 * 24 * 31;
    case 'week': return 1000 * 60 * 60 * 24 * 7;
    default: return 1000 * 60 * 60 * 24;
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
  if (days <= 1) return 'day';
  if (days <= 7) return 'week';
  if (days <= 31) return 'month';
  if (days <= 365) return 'year';
  return 'month';
};

const generateDistinctColors = (count) => {
  const colors = [
    '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#eb2f96', '#fa8c16', '#a0d911', '#fadb14',
    '#2f54eb', '#fa541c', '#52c41a', '#1890ff', '#13c2c2'
  ];

  while (colors.length < count) {
    const hue = (colors.length * 137.508) % 360;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }

  return colors;
};

const getComponentColors = (operations) => {
  if (!operations || operations.length === 0) return {};
  
  const uniqueProductionOrders = [...new Set(operations.map(op => op.production_order))];
  const colors = generateDistinctColors(uniqueProductionOrders.length);
  
  return uniqueProductionOrders.reduce((acc, order, index) => {
    acc[order] = {
      backgroundColor: colors[index],
      borderColor: colors[index],
      hoverColor: colors[index] + '80'
    };
    return acc;
  }, {});
};

const getNextMondayIfSunday = (date) => {
  const momentDate = moment(date);
  if (momentDate.day() === 0) {
    return momentDate.add(1, 'day');
  }
  return momentDate;
};

const getPreviousSaturdayIfSunday = (date) => {
  const momentDate = moment(date);
  if (momentDate.day() === 0) {
    return momentDate.subtract(1, 'day');
  }
  return momentDate;
};

const getTimeRange = (viewType, dateRange, selectedComponents, selectedMachines, selectedProductionOrders, scheduleData) => {
  let start, end, dataMin, dataMax;
  const now = moment();

  if (scheduleData && scheduleData.scheduled_operations?.length > 0) {
    const allStartTimes = scheduleData.scheduled_operations.map(op => new Date(op.start_time));
    const allEndTimes = scheduleData.scheduled_operations.map(op => new Date(op.end_time));
    
    const earliestDate = moment(Math.min(...allStartTimes));
    const latestDate = moment(Math.max(...allEndTimes));
    
    dataMin = getNextMondayIfSunday(earliestDate.clone().subtract(10, 'years')).toDate();
    dataMax = getPreviousSaturdayIfSunday(latestDate.clone().add(10, 'years')).toDate();
  } else {
    dataMin = getNextMondayIfSunday(now.clone().subtract(10, 'years')).toDate();
    dataMax = getPreviousSaturdayIfSunday(now.clone().add(10, 'years')).toDate();
  }

  if (dateRange && dateRange[0] && dateRange[1]) {
    start = getNextMondayIfSunday(dateRange[0].clone()).hour(6).minute(0).second(0).toDate();
    end = getPreviousSaturdayIfSunday(dateRange[1].clone()).hour(22).minute(0).second(0).toDate();
  } else {
    switch (viewType) {
      case 'year':
        start = getNextMondayIfSunday(now.clone().startOf('year')).hour(6).minute(0).second(0).toDate();
        end = getPreviousSaturdayIfSunday(now.clone().endOf('year')).hour(22).minute(0).second(0).toDate();
        break;
      case 'month':
        start = getNextMondayIfSunday(now.clone().startOf('month')).hour(6).minute(0).second(0).toDate();
        end = getPreviousSaturdayIfSunday(now.clone().endOf('month')).hour(22).minute(0).second(0).toDate();
        break;
      case 'week':
        let startOfWeek = now.clone().startOf('isoWeek');
        start = startOfWeek.hour(6).minute(0).second(0).toDate();
        end = startOfWeek.clone().add(5, 'days').hour(22).minute(0).second(0).toDate();
        break;
      default:
        let currentDay = now.clone();
        if (currentDay.day() === 0) {
          currentDay = currentDay.add(1, 'day');
        }
        start = currentDay.startOf('day').hour(6).minute(0).second(0).toDate();
        end = currentDay.endOf('day').hour(22).minute(0).second(0).toDate();
    }
  }

  return {
    start,
    end,
    dataMin,
    dataMax
  };
};

// Timeline Chart Component
const TimelineChart = React.forwardRef((props, ref) => {
  const {
    scheduleData,
    selectedMachines,
    selectedComponents,
    selectedProductionOrders,
    dateRange,
    viewType,
    machineMapping,
    memoizedComponentColors
  } = props;

  const timelineContainerRef = useRef(null);
  const timelineRef = useRef(null);
  const styleElementRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update availableMachines to use scheduleData directly
  const availableMachines = React.useMemo(() => {
    if (!scheduleData?.work_centers) return [];
    
    const workCenterMachines = scheduleData.work_centers
      .filter(wc => wc.is_schedulable === true)
      .flatMap(wc => 
        wc.machines
          .filter(machine => !machine.name.includes('Default'))
          .map(machine => ({
            id: machine.id,
            machineId: `${wc.work_center_code}-${machine.id}`,
            name: machine.name,
            work_center_code: wc.work_center_code,
            work_center_name: wc.work_center_name,
            displayName: `${wc.work_center_code} - ${machine.name}`,
            order: scheduleData.work_centers.indexOf(wc) * 100 + wc.machines.indexOf(machine)
          }))
    );
    
    const scheduledMachines = new Set((scheduleData?.scheduled_operations || []).map(op => op.machine));
    
    const getMachineStatus = (machineId) => {
      const now = new Date();
      const isRunning = (scheduleData?.scheduled_operations || []).some(op => {
        const startTime = new Date(op.start_time);
        const endTime = new Date(op.end_time);
        return op.machine === machineId && startTime <= now && endTime >= now;
      });
      return isRunning;
    };

    return workCenterMachines.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      
      const isRunningA = getMachineStatus(a.machineId);
      const isRunningB = getMachineStatus(b.machineId);
      
      if (isRunningA && !isRunningB) return -1;
      if (!isRunningA && isRunningB) return 1;
      
      return 0;
    });
  }, [scheduleData]);

  const initializeTimeline = useCallback(() => {
    try {
      if (!timelineContainerRef.current || !scheduleData) return;

      const operations = scheduleData.scheduled_operations || [];
      const colors = memoizedComponentColors;

      // Build items with guaranteed-unique IDs to prevent DataSet duplicate key errors
      const filteredOperations = operations.filter(op => {
        const isComponentSelected = selectedComponents.length === 0 || selectedComponents.includes(op.component);
        const isOrderSelected = selectedProductionOrders.length === 0 || selectedProductionOrders.includes(op.production_order);
        const isMachineSelected = selectedMachines.length === 0 || selectedMachines.includes(machineMapping.get(op.machine));
        return isComponentSelected && isOrderSelected && isMachineSelected;
      });

      const idOccurrences = new Map();
      const items = new DataSet(
        filteredOperations.map(op => {
          // Use a stable base id; include end_time to reduce natural collisions
          const baseId = op.id || `${machineMapping.get(op.machine)}-${op.component}-${op.production_order}-${op.description}-${op.start_time}-${op.end_time}`;
          const seen = idOccurrences.get(baseId) || 0;
          idOccurrences.set(baseId, seen + 1);
          const uniqueId = seen === 0 ? baseId : `${baseId}__${seen}`;

          return ({
            id: uniqueId,
            group: machineMapping.get(op.machine),
            content: `
              <div class="timeline-item">
                <div class="item-header">${op.production_order}</div>
                <div class="item-desc">${op.component} - ${op.description}</div>
              </div>
            `,
            start: new Date(op.start_time),
            end: new Date(op.end_time),
            className: `order-${op.production_order.replace(/[^a-zA-Z0-9]/g, '-')}`,
            operation: op,
            style: `
              background-color: ${colors[op.production_order]?.backgroundColor || '#1890ff'};
              border-color: ${colors[op.production_order]?.borderColor || '#096dd9'};
              color: white;
            `
          });
        })
      );

      const groups = new DataSet(
        availableMachines
          .filter(machine => {
            if (!scheduleData || !scheduleData.scheduled_operations || scheduleData.scheduled_operations.length === 0) {
              return selectedMachines.length === 0 || selectedMachines.includes(machine.machineId);
            }
            
            if (selectedComponents.length === 0 && selectedProductionOrders.length === 0) {
              return selectedMachines.length === 0 || selectedMachines.includes(machine.machineId);
            }
            
            const hasSelectedComponentOperations = selectedComponents.length === 0 || 
              operations.some(op => 
                selectedComponents.includes(op.component) && 
                machineMapping.get(op.machine) === machine.machineId
              );
            
            const hasSelectedOrderOperations = selectedProductionOrders.length === 0 || 
              operations.some(op => 
                selectedProductionOrders.includes(op.production_order) && 
                machineMapping.get(op.machine) === machine.machineId
              );
            
            return hasSelectedComponentOperations && 
                   hasSelectedOrderOperations && 
                   (selectedMachines.length === 0 || selectedMachines.includes(machine.machineId));
          })
          .map(machine => ({
            id: machine.machineId,
            content: `
              <div class="machine-group">
                <span class="machine-name">
                  ${machine.displayName}
                </span>
              </div>
            `,
            className: operations.some(op => machineMapping.get(op.machine) === machine.machineId) ? 'machine-with-ops' : 'machine-without-ops',
            order: machine.order
          }))
      );

      if (styleElementRef.current) {
        styleElementRef.current.remove();
      }

      const styles = `
        ${Object.entries(colors).map(([order, colors]) => `
          .order-${order.replace(/[^a-zA-Z0-9]/g, '-')} {
            background-color: ${colors.backgroundColor} !important;
            border-color: ${colors.borderColor} !important;
          }
          .order-${order.replace(/[^a-zA-Z0-9]/g, '-')}:hover {
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

      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
      styleElementRef.current = styleElement;

      const timeRange = getTimeRange(viewType, dateRange, selectedComponents, selectedMachines, selectedProductionOrders, scheduleData);

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
        zoomMin: 1000 * 60 * 30, // 30 minutes minimum zoom
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 2, // 2 years maximum zoom
        mousewheel: {
          zoom: true,
          scroll: false
        },
        moveable: true,
        zoomable: true,
        editable: false,
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap',
          template: function(item) {
            const op = item.operation;
            if (!op || !scheduleData) return '';
          
            const opId = op.id || `${op.machine}-${op.component}-${op.production_order}-${op.description}-${op.start_time}`;
          
            const groupOperations = scheduleData.scheduled_operations
              .filter(o =>
                o.component === op.component &&
                o.machine === op.machine &&
                o.production_order === op.production_order &&
                o.description === op.description
              )
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
          
            const firstOp = groupOperations[0];
            const lastOp = groupOperations[groupOperations.length - 1];
            const firstOpId = firstOp?.id || `${firstOp?.machine}-${firstOp?.component}-${firstOp?.production_order}-${firstOp?.description}-${firstOp?.start_time}`;
            const lastOpId = lastOp?.id || `${lastOp?.machine}-${lastOp?.component}-${lastOp?.production_order}-${lastOp?.description}-${lastOp?.start_time}`;
          
            const isFirstOperation = opId === firstOpId;
            const isLastOperation = opId === lastOpId;
          
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
                  <div class="info-row">
                    <span class="label">Production Order:</span>
                    <span class="value">${op.production_order}</span>
                  </div>
                </div>
                <div class="tooltip-body">
                  <div class="info-row">
                    <span class="label">Operation:</span>
                    <span class="value">${op.description}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Quantity:</span>
                    <span class="value">${op.quantity}</span>
                  </div>
                  ${
                    isLastOperation
                      ? `<div class="info-row">
                          <span class="label">End:</span>
                          <span class="value">${new Date(op.end_time).toLocaleString()}</span>
                        </div>`
                      : `
                          <div class="info-row">
                            <span class="label">Start:</span>
                            <span class="value">${new Date(firstOp.start_time).toLocaleString()}</span>
                          </div>
                          <div class="info-row">
                            <span class="label">PDC of Operation:</span>
                            <span class="value">${new Date(groupOperations[groupOperations.length - 1].end_time).toLocaleString()}</span>
                          </div>
                        `
                  }
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
            minute: 'HH:mm',
            day: 'D',
            week: 'w',
            month: 'MMM',
            year: 'YYYY'
          },
          majorLabels: {
            hour: 'ddd D MMM',
            minute: 'HH:00',
            day: 'ddd D MMM',
            week: 'MMM YYYY',
            month: 'YYYY',
            year: ''
          }
        },
        hiddenDates: [
          {
            start: '1970-01-04 00:00:00',
            end: '1970-01-05 00:00:00',
            repeat: 'weekly'
          },
          {
            start: '1970-01-01 00:00:00',
            end: '1970-01-01 06:00:00',
            repeat: 'daily'
          },
          {
            start: '1970-01-01 22:00:00',
            end: '1970-01-01 23:59:59',
            repeat: 'daily'
          }
        ]
      };

      if (timelineRef.current) {
        timelineRef.current.destroy();
      }

      const timeline = new Timeline(
        timelineContainerRef.current,
        items,
        groups,
        options
      );

      // Add event listeners for zoom
      timeline.on('rangechange', function(properties) {
        if (properties.byZoom) {
          const window = timeline.getWindow();
          const duration = moment.duration(moment(window.end).diff(moment(window.start)));
          console.log('Zoom level changed:', duration.asHours(), 'hours');
        }
      });

      timelineRef.current = timeline;
      setIsInitialized(true);

      timelineRef.current.setWindow(
        timeRange.start,
        timeRange.end,
        { animation: false }
      );

    } catch (error) {
      console.error('Timeline initialization error:', error);
      message.error('Failed to initialize timeline');
      setIsInitialized(false);
    }
  }, [
    scheduleData,
    selectedMachines,
    selectedComponents,
    selectedProductionOrders,
    dateRange,
    viewType,
    availableMachines,
    machineMapping,
    memoizedComponentColors,
    isInitialized
  ]);

  useEffect(() => {
    initializeTimeline();

    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [initializeTimeline]);

  // Expose the timeline instance and methods via ref
  React.useImperativeHandle(ref, () => ({
    timeline: timelineRef.current,
    getWindow: () => timelineRef.current?.getWindow(),
    setWindow: (start, end, options) => timelineRef.current?.setWindow(start, end, options),
    zoomIn: (amount = 0.5) => timelineRef.current?.zoomIn(amount),
    zoomOut: (amount = 0.5) => timelineRef.current?.zoomOut(amount),
    fit: () => timelineRef.current?.fit()
  }), [timelineRef.current]);

  return (
    <div 
      ref={timelineContainerRef} 
      style={{
        width: '100%',
        height: '670px',
        position: 'relative',
        minHeight: '690px'
      }}
    >
      {!isInitialized && (
        <div className="flex justify-center items-center h-full">
          <Spin size="large" tip="Loading timeline..." />
        </div>
      )}
    </div>
  );
});

const Scheduling = () => {
  const [form] = Form.useForm();
  const { 
    scheduleData, 
    loading, 
    error, 
    fetchScheduleData,
    updateSchedule, // Add the new updateSchedule function
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
  const [viewType, setViewType] = useState('week');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCompleted, setShowCompleted] = useState(true);
  const componentStatus = scheduleData?.component_status || {};
  const dailyProduction = scheduleData?.daily_production || {};
  const [partDescriptions, setPartDescriptions] = useState({});
  const [dateRange, setDateRange] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [activeScheduleTab, setActiveScheduleTab] = useState('schedule-graph');
  
  // Remove displayScheduleData state since we'll use scheduleData directly now
  const timelineRef = useRef(null);

  // Update memoized component colors to use scheduleData directly
  const memoizedComponentColors = React.useMemo(() => {
    if (!scheduleData?.scheduled_operations) return {};
    return getComponentColors(scheduleData.scheduled_operations);
  }, [scheduleData?.scheduled_operations]);

  const [visibleRange, setVisibleRange] = useState(() => {
    const now = moment();
    return [
      now.clone().subtract(3, 'days').startOf('day'),
      now.clone().add(3, 'days').endOf('day')
    ];
  });
  
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  // Update availableMachines to use scheduleData directly
  const availableMachines = React.useMemo(() => {
    if (!scheduleData?.work_centers) return [];
    
    const workCenterMachines = scheduleData.work_centers
      .filter(wc => wc.is_schedulable === true)
      .flatMap(wc => 
        wc.machines
          .filter(machine => !machine.name.includes('Default'))
          .map(machine => ({
            id: machine.id,
            machineId: `${wc.work_center_code}-${machine.id}`,
            name: machine.name,
            work_center_code: wc.work_center_code,
            work_center_name: wc.work_center_name,
            displayName: `${wc.work_center_code} - ${machine.name}`,
            order: scheduleData.work_centers.indexOf(wc) * 100 + wc.machines.indexOf(machine)
          }))
    );
    
    const scheduledMachines = new Set((scheduleData?.scheduled_operations || []).map(op => op.machine));
    
    const getMachineStatus = (machineId) => {
      const now = new Date();
      const isRunning = (scheduleData?.scheduled_operations || []).some(op => {
        const startTime = new Date(op.start_time);
        const endTime = new Date(op.end_time);
        return op.machine === machineId && startTime <= now && endTime >= now;
      });
      return isRunning;
    };

    return workCenterMachines.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      
      const isRunningA = getMachineStatus(a.machineId);
      const isRunningB = getMachineStatus(b.machineId);
      
      if (isRunningA && !isRunningB) return -1;
      if (!isRunningA && isRunningB) return 1;
      
      return 0;
    });
  }, [scheduleData]);

  // Update machine mapping to use scheduleData
  const machineMapping = React.useMemo(() => {
    if (!scheduleData?.work_centers || !availableMachines) return new Map();
    
    const mapping = new Map();
    availableMachines.forEach(machine => {
      mapping.set(machine.machineId, machine.machineId);
      mapping.set(`${machine.work_center_code}-${machine.name}`, machine.machineId);
    });
    return mapping;
  }, [scheduleData?.work_centers, availableMachines]);

  // Load initial data when component mounts
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // Update available components to use scheduleData directly
  const availableComponents = React.useMemo(() => {
    if (!scheduleData?.scheduled_operations) return [];
    return [...new Set(scheduleData.scheduled_operations
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map(op => op.component)
    )];
  }, [scheduleData]);

  // Update filteredData effect to use scheduleData directly
  useEffect(() => {
    if (scheduleData) {
      let filtered = scheduleData;
      
      if (selectedMachines.length > 0) {
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => 
            selectedMachines.includes(machineMapping.get(op.machine))
          )
        };
      }
      
      if (dateRange) {
        const startDate = new Date(dateRange[0]);
        const endDate = new Date(dateRange[1]);
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => {
            const opStart = new Date(op.start_time);
            const opEnd = new Date(op.end_time);
            return (opStart <= endDate && opEnd >= startDate);
          })
        };
      }

      if (selectedComponents.length > 0) {
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => 
            selectedComponents.includes(op.component)
          )
        };
      }
  
      if (selectedProductionOrders.length > 0) {
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => 
            selectedProductionOrders.includes(op.production_order)
          )
        };
      }
      
      setFilteredData(filtered);
    } else {
      setFilteredData(null);
    }
  }, [scheduleData, selectedMachines, selectedComponents, selectedProductionOrders, dateRange, machineMapping]);

  // Update schedule analytics to use scheduleData directly
  const scheduleAnalytics = React.useMemo(() => {
    if (!scheduleData?.scheduled_operations) return {
      scheduledJobs: 0,
      machineUtilization: 0,
      delayedJobs: 0
    };

    const now = new Date();
    return {
      scheduledJobs: scheduleData.scheduled_operations.length,
      machineUtilization: selectedMachines.length === 1 ? 
        (scheduleData.scheduled_operations.filter(op => selectedMachines.includes(machineMapping.get(op.machine))).length / scheduleData.scheduled_operations.length * 100) : 
        100,
      delayedJobs: scheduleData.scheduled_operations.filter(op => 
        new Date(op.end_time) > new Date(scheduleData.component_status?.[op.component]?.lead_time)
      ).length
    };
  }, [scheduleData, selectedMachines, machineMapping]);

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

      const { scheduleData, rescheduleOperation } = useScheduleStore.getState();
      
      const success = await rescheduleOperation(
        values.operationId,
        startTime.toISOString(),
        endTime.toISOString(),
        reason
      );

      if (success) {
        toast.success('Operation rescheduled successfully');
        setIsRescheduleModalVisible(false);
        fetchScheduleData();
      } else {
        toast.error('Failed to reschedule operation');
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('An error occurred while rescheduling');
    }
  };

  // Add useEffect to fetch part descriptions
  useEffect(() => {
    const fetchPartDescriptions = async () => {
      try {
        const response = await fetch('http://172.18.7.91:8008/api/v1/planning/all_orders');
        const data = await response.json();
        
        const descriptions = data.reduce((acc, order) => {
          acc[order.part_number] = order.part_description;
          return acc;
        }, {});
        
        setPartDescriptions(descriptions);
      } catch (error) {
        console.error('Error fetching part descriptions:', error);
      }
    };

    fetchPartDescriptions();
  }, []);

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
    }
  };

  const handleTimelineNavigation = (direction) => {
    if (timelineRef.current) {
      const currentWindow = timelineRef.current.getWindow();
      const start = moment(currentWindow.start);
      const end = moment(currentWindow.end);

      let newStart, newEnd;
      
      switch (viewType) {
        case 'day':
          switch (direction) {
            case 'left':
              newStart = start.clone().subtract(1, 'day');
              newEnd = end.clone().subtract(1, 'day');
              if (newStart.day() === 0) {
                newStart = newStart.subtract(1, 'day');
                newEnd = newEnd.subtract(1, 'day');
              }
              newStart = newStart.hour(6).minute(0).second(0);
              newEnd = newEnd.hour(22).minute(0).second(0);
              break;
            case 'right':
              newStart = start.clone().add(1, 'day');
              newEnd = end.clone().add(1, 'day');
              if (newStart.day() === 0) {
                newStart = newStart.add(1, 'day');
                newEnd = newEnd.add(1, 'day');
              }
              newStart = newStart.hour(6).minute(0).second(0);
              newEnd = newEnd.hour(22).minute(0).second(0);
              break;
            case 'today':
              let today = moment();
              if (today.day() === 0) {
                today = today.add(1, 'day');
              }
              newStart = today.startOf('day').hour(6).minute(0).second(0);
              newEnd = today.endOf('day').hour(22).minute(0).second(0);
              break;
          }
          break;
        
        case 'week':
          switch (direction) {
            case 'left':
              newStart = start.clone().subtract(1, 'week');
              newEnd = start.clone().subtract(1, 'week').add(5, 'days');
              break;
            case 'right':
              newStart = start.clone().add(1, 'week');
              newEnd = start.clone().add(1, 'week').add(5, 'days');
              break;
            case 'today':
              newStart = moment().startOf('isoWeek');
              newEnd = moment().startOf('isoWeek').add(5, 'days');
              break;
          }
          break;

        case 'month':
          switch (direction) {
            case 'left':
              newStart = getNextMondayIfSunday(start.clone().subtract(1, 'month'));
              newEnd = getPreviousSaturdayIfSunday(end.clone().subtract(1, 'month'));
              break;
            case 'right':
              newStart = getNextMondayIfSunday(start.clone().add(1, 'month'));
              newEnd = getPreviousSaturdayIfSunday(end.clone().add(1, 'month'));
              break;
            case 'today':
              newStart = getNextMondayIfSunday(moment().startOf('month'));
              newEnd = getPreviousSaturdayIfSunday(moment().endOf('month'));
              break;
          }
          break;

        case 'year':
          switch (direction) {
            case 'left':
              newStart = getNextMondayIfSunday(start.clone().subtract(1, 'year'));
              newEnd = getPreviousSaturdayIfSunday(end.clone().subtract(1, 'year'));
              break;
            case 'right':
              newStart = getNextMondayIfSunday(start.clone().add(1, 'year'));
              newEnd = getPreviousSaturdayIfSunday(end.clone().add(1, 'year'));
              break;
            case 'today':
              newStart = getNextMondayIfSunday(moment().startOf('year'));
              newEnd = getPreviousSaturdayIfSunday(moment().endOf('year'));
              break;
          }
          break;
      }

      timelineRef.current.setWindow(newStart.toDate(), newEnd.toDate(), { animation: true });
    }
  };

  const handleUpdate = () => {
    confirm({
      title: 'Update Schedule',
      icon: <ExclamationCircleOutlined />,
      content: 'Do you want to generate a new schedule? Please wait while we generate the new schedule.',
      onOk: async () => {
        const success = await updateSchedule();
        if (success) {
          message.success('Schedule updated successfully!');
        } else {
          message.error('Failed to update schedule. Please try again.');
        }
      },
      onCancel() {
        console.log('Schedule update cancelled');
      },
    });
  };

  const handleRefresh = () => {
    setSelectedMachines([]);
    setSelectedComponents([]);
    setSelectedProductionOrders([]);
    setDateRange(null);
    fetchScheduleData();
  };

  // Enhanced TimelineChart component with ref forwarding
  const TimelineChartWithRef = React.forwardRef((props, ref) => (
    <TimelineChart {...props} ref={ref} />
  ));

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content>
        <ToastContainer position="top-right" autoClose={5000} />
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          type="card" 
          destroyInactiveTabPane={true}
        >
          <TabPane 
            tab={ 
              <span>
                <ScheduleOutlined /> Production Schedule
              </span>
            } 
            key="schedule"
          >
            <Card>
              <Tabs 
                activeKey={activeScheduleTab} 
                onChange={setActiveScheduleTab} 
                className="compact-tabs" 
                destroyInactiveTabPane={true}
              >
                <TabPane 
                  tab="Machine Schedule" 
                  key="schedule-graph"
                >
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
                          const description = partDescriptions[component] || '';
                          return (
                            <Option 
                              key={component} 
                              value={component}
                              label={component}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{component}</span>
                                <span style={{ fontSize: '12px', color: '#666' }}>{description}</span>
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
                        optionLabelProp="label"
                      >
                        {(scheduleData ? [...new Set(scheduleData.scheduled_operations?.map(op => op.production_order) || [])] : []).map(order => {
                          const color = memoizedComponentColors?.[order]?.backgroundColor || '#1890ff';
                          return (
                            <Option 
                              key={order} 
                              value={order}
                              label={order}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  backgroundColor: color,
                                  borderRadius: '4px'
                                }} />
                                {order}
                              </div>
                            </Option>
                          );
                        })}
                      </Select>

                      {/* <Button.Group>
                        <Tooltip title="Zoom In">
                          <Button 
                            icon={<ZoomInOutlined />} 
                            onClick={() => timelineRef.current?.timeline?.zoomIn(0.5)} 
                          />
                        </Tooltip>
                        <Tooltip title="Zoom Out">
                          <Button 
                            icon={<ZoomOutOutlined />} 
                            onClick={() => timelineRef.current?.timeline?.zoomOut(0.5)} 
                          />
                        </Tooltip>
                        <Tooltip title="Fit Timeline">
                          <Button 
                            icon={<FullscreenOutlined />} 
                            onClick={() => timelineRef.current?.timeline?.fit()} 
                          />
                        </Tooltip>
                      </Button.Group> */}
                      
                      <Tooltip title="How to use timeline">
                        <Button
                          className="bg-blue-500 text-white"
                          icon={<InfoCircleOutlined />}
                          onClick={() => setIsHelpModalVisible(true)}
                        />
                      </Tooltip>
                      
                      <Button 
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleUpdate}
                        loading={loading}
                      >
                        Update
                      </Button>
                      
                      <Button 
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
                    
                    {activeScheduleTab === 'schedule-graph' && (
                      <TimelineChart
                        ref={timelineRef}
                        scheduleData={scheduleData}
                        selectedMachines={selectedMachines}
                        selectedComponents={selectedComponents}
                        selectedProductionOrders={selectedProductionOrders}
                        dateRange={dateRange}
                        viewType={viewType}
                        availableMachines={availableMachines}
                        machineMapping={machineMapping}
                        memoizedComponentColors={memoizedComponentColors}
                      />
                    )}
                  </div>

                  {scheduleData && memoizedComponentColors && Object.keys(memoizedComponentColors).length > 0 && (
                    <ComponentLegend 
                      componentColors={memoizedComponentColors} 
                      title="Production Orders"
                    />
                  )}
                </TabPane>
                
                {/* <TabPane 
                  tab="Dynamic Scheduling Graph" 
                  key="dynamic-scheduling"
                >
                  {activeScheduleTab === 'dynamic-scheduling' && (
                    <DynamicSchedulingGraph />
                  )}
                </TabPane> */}
                
                {/* <TabPane 
                  tab="Machine Status" 
                  key="machine-status"
                >
                  {activeScheduleTab === 'machine-status' && scheduleData && memoizedComponentColors && availableMachines && (
                    <MachineStatusCards 
                      machines={availableMachines}
                      operations={scheduleData.scheduled_operations.map(op => ({
                        ...op,
                        machine: machineMapping.get(op.machine) || op.machine
                      }))}
                      componentStatus={scheduleData.component_status}
                      componentColors={memoizedComponentColors}
                    />
                  )}
                </TabPane> */}
                
                <TabPane tab="Planned Schedule" key="planned-schedule">
                  {activeScheduleTab === 'planned-schedule' && (
                    <PlannedScheduleTimeline />
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

// Schedule History Component (keeping existing)
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
            dataSource={[]}
            loading={loading}
            rowKey="id"
            scroll={{ x: true }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default Scheduling;