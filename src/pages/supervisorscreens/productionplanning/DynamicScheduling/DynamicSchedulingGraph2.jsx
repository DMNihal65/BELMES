import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Tooltip, message, Spin, Alert } from 'antd';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data/esnext";
import "vis-timeline/dist/vis-timeline-graph2d.css";
import {
  ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined,
  InfoCircleOutlined, SyncOutlined, LeftOutlined, RightOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';

const { Option } = Select;

// Add timeline styles
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
    height: '80px !important',
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
    case 'week': return 4;
    case 'day': return 1;
    default: return 1;
  }
};

const getTimeRange = (viewType, dateRange) => {
  let start, end;
  const now = moment();

  if (dateRange && dateRange[0] && dateRange[1]) {
    start = dateRange[0].clone().hour(9).minute(0).second(0).toDate();
    end = dateRange[1].clone().hour(17).minute(0).second(0).toDate();
  } else {
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
      default:
        start = now.clone().startOf('day').hour(9).minute(0).second(0).toDate();
        end = now.clone().endOf('day').hour(17).minute(0).second(0).toDate();
    }
  }

  return { start, end };
};

const DynamicSchedulingGraph2 = () => {
  const [timelineRef, setTimelineRef] = useState(null);
  const [timelineContainerRef, setTimelineContainerRef] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [viewType, setViewType] = useState('week');

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://172.19.224.1:8002/api/v1/rescheduling/reschedule-actual-planned-combined');
      setScheduleData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch schedule data');
      setLoading(false);
    }
  };

  // Initialize timeline container ref
  useEffect(() => {
    setTimelineContainerRef(document.createElement('div'));
    fetchScheduleData();
  }, []);

  // Initialize timeline when container is ready
  useEffect(() => {
    if (!timelineContainerRef || !scheduleData) return;

    const container = timelineContainerRef;
    container.style.height = '690px';
    container.style.backgroundColor = '#fff';
    container.style.padding = '20px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

    // Create items for planned, actual, and rescheduled operations
    const items = new DataSet();
    const groups = new DataSet();

    
    
    // Create a mapping of machine IDs to their full names
    const machineMapping = {};
    scheduleData.work_centers.forEach(wc => {
      wc.machines.forEach(machine => {
        const machineFullName = `${wc.work_center_code}-${machine.name}`;
        machineMapping[machine.id] = machineFullName;
      });
    });

    // Add groups for each machine with subgroups
    scheduleData.work_centers.forEach(wc => {
      wc.machines.forEach(machine => {
        const machineFullName = `${wc.work_center_code}-${machine.name}`;
        const machineLabel = `${wc.work_center_code} - ${machine.name}`;
        
        // Add machine header group
        groups.add({
          id: machineFullName,
          content: `<strong>${machineLabel}</strong>`,
          title: wc.work_center_name,
          nestedGroups: [
            `${machineFullName}-planned`,
            `${machineFullName}-actual`,
            `${machineFullName}-rescheduled`
          ],
          showNested: true
        });

        // Add subgroups for each type in order
        groups.add({
          id: `${machineFullName}-planned`,
          content: 'Planned',
          className: 'planned-group',
          title: 'Planned Operations',
          order: 1
        });
        groups.add({
          id: `${machineFullName}-actual`,
          content: 'Actual',
          className: 'actual-group',
          title: 'Actual Production',
          order: 2
        });
        groups.add({
          id: `${machineFullName}-rescheduled`,
          content: 'Rescheduled',
          className: 'rescheduled-group',
          title: 'Rescheduled Operations',
          order: 3
        });
      });
    });

    // Add scheduled operations (Planned)
    scheduleData.scheduled_operations.forEach((op, index) => {
      items.add({
        id: `planned-${index}`,
        group: `${op.machine}-planned`,
        start: new Date(op.start_time),
        end: new Date(op.end_time),
        content: '',
        className: 'planned-bar',
        title: `
          <div>
            <strong>Planned Operation</strong><br/>
            Component: ${op.component}<br/>
            Description: ${op.description}<br/>
            Quantity: ${op.quantity}<br/>
            Production Order: ${op.production_order}<br/>
            Start: ${moment(op.start_time).format('DD/MM/YYYY HH:mm')}<br/>
            End: ${moment(op.end_time).format('DD/MM/YYYY HH:mm')}
          </div>
        `
      });
    });

    // Add production logs (Actual)
    scheduleData.production_logs.forEach((log, index) => {
      items.add({
        id: `actual-${index}`,
        group: `${log.machine_name}-actual`,
        start: new Date(log.start_time),
        end: new Date(log.end_time),
        content: '',
        className: 'actual-bar',
        title: `
          <div>
            <strong>Actual Production</strong><br/>
            Part: ${log.part_number}<br/>
            Operation: ${log.operation_description}<br/>
            Completed: ${log.quantity_completed}<br/>
            Rejected: ${log.quantity_rejected}<br/>
            Notes: ${log.notes}<br/>
            Start: ${moment(log.start_time).format('DD/MM/YYYY HH:mm')}<br/>
            End: ${moment(log.end_time).format('DD/MM/YYYY HH:mm')}
          </div>
        `
      });
    });

    // Add rescheduled operations
    scheduleData.reschedule.forEach((reschedule, index) => {
      const machineName = machineMapping[reschedule.machine_id.toString()];
      if (machineName) {
        items.add({
          id: `rescheduled-${index}`,
          group: `${machineName}-rescheduled`,
          start: new Date(reschedule.start_time),
          end: new Date(reschedule.end_time),
          content: '',
          className: 'rescheduled-bar',
          title: `
            <div>
              <strong>Rescheduled Operation</strong><br/>
              Version: ${reschedule.new_version} (from ${reschedule.old_version})<br/>
              Completed Qty: ${reschedule.completed_qty}<br/>
              Remaining Qty: ${reschedule.remaining_qty}<br/>
              Raw Material: ${reschedule.raw_material_status}<br/>
              Operation #: ${reschedule.operation_number}<br/>
              Start: ${moment(reschedule.start_time).format('DD/MM/YYYY HH:mm')}<br/>
              End: ${moment(reschedule.end_time).format('DD/MM/YYYY HH:mm')}
            </div>
          `
        });
      }
    });

    // Get time range based on view type and date range
    const timeRange = getTimeRange(viewType, dateRange);

    // Initialize timeline with updated options
    const timeline = new Timeline(
      container,
      items,
      groups,
      {
        stack: false,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        orientation: 'top',
        height: '670px',
        groupOrder: function(a, b) {
          const aOrder = a.order || 0;
          const bOrder = b.order || 0;
          return aOrder - bOrder;
        },
        start: timeRange.start,
        end: timeRange.end,
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
      }
    );

    setTimelineRef(timeline);

    // Add custom styles for the bars and timeline
    const style = document.createElement('style');
    style.textContent = `
      .planned-bar {
        background-color: #1890ff !important;
        border-color: #1890ff !important;
      }
      .actual-bar {
        background-color: #52c41a !important;
        border-color: #52c41a !important;
      }
      .rescheduled-bar {
        background-color: #f5222d !important;
        border-color: #f5222d !important;
      }
      .vis-item {
        height: 20px;
        border-width: 1px;
        border-radius: 2px;
      }
      .vis-nested-group {
        background-color: #f5f5f5;
      }
      .planned-group {
        border-left: 4px solid #1890ff;
        background-color: rgba(24, 144, 255, 0.05);
        font-weight: 500;
      }
      .actual-group {
        border-left: 4px solid #52c41a;
        background-color: rgba(82, 196, 26, 0.05);
        font-weight: 500;
      }
      .rescheduled-group {
        border-left: 4px solid #f5222d;
        background-color: rgba(245, 34, 45, 0.05);
        font-weight: 500;
      }
      .vis-label {
        padding: 4px 8px;
      }
      ${Object.entries(timelineStyles).map(([selector, styles]) => `
        ${selector} {
          ${Object.entries(styles).map(([prop, value]) => `${prop}: ${value};`).join('\n')}
        }
      `).join('\n')}
    `;
    document.head.appendChild(style);

    return () => {
      timeline.destroy();
      document.head.removeChild(style);
    };
  }, [timelineContainerRef, scheduleData, viewType, dateRange]);

  const handleViewTypeChange = (newViewType) => {
    setViewType(newViewType);
    if (timelineRef) {
      const timeRange = getTimeRange(newViewType, dateRange);
      timelineRef.setWindow(timeRange.start, timeRange.end, { animation: true });
      
      // Update time axis
      timelineRef.setOptions({
        timeAxis: { 
          scale: getTimeAxisScale(newViewType),
          step: getTimeAxisStep(newViewType)
        }
      });
    }
  };

  const handleTimelineNavigation = (direction) => {
    if (!timelineRef) return;
    const window = timelineRef.getWindow();

    // Handle 'today' case separately
    if (direction === 'today') {
      const now = moment();
      const currentWindow = timelineRef.getWindow();
      const duration = moment.duration(moment(currentWindow.end).diff(moment(currentWindow.start)));
      const halfDuration = duration.asMilliseconds() / 2;
      
      timelineRef.setWindow(
        moment(now).subtract(halfDuration, 'milliseconds').toDate(),
        moment(now).add(halfDuration, 'milliseconds').toDate(),
        { animation: { duration: 500, easingFunction: 'easeInOutQuad' } }
      );
      return;
    }

    // Move window based on view type
    const start = moment(window.start);
    const end = moment(window.end);
    let newStart, newEnd;

    switch (viewType) {
      case 'year':
        if (direction === 'left') {
          newStart = start.clone().subtract(1, 'year');
          newEnd = end.clone().subtract(1, 'year');
        } else {
          newStart = start.clone().add(1, 'year');
          newEnd = end.clone().add(1, 'year');
        }
        break;
      case 'month':
        if (direction === 'left') {
          newStart = start.clone().subtract(1, 'month');
          newEnd = end.clone().subtract(1, 'month');
        } else {
          newStart = start.clone().add(1, 'month');
          newEnd = end.clone().add(1, 'month');
        }
        break;
      case 'week':
        if (direction === 'left') {
          newStart = start.clone().subtract(1, 'week');
          newEnd = end.clone().subtract(1, 'week');
        } else {
          newStart = start.clone().add(1, 'week');
          newEnd = end.clone().add(1, 'week');
        }
        break;
      case 'day':
        if (direction === 'left') {
          newStart = start.clone().subtract(1, 'day');
          newEnd = end.clone().subtract(1, 'day');
        } else {
          newStart = start.clone().add(1, 'day');
          newEnd = end.clone().add(1, 'day');
        }
        break;
      default:
        if (direction === 'left') {
          newStart = start.clone().subtract(1, 'day');
          newEnd = end.clone().subtract(1, 'day');
        } else {
          newStart = start.clone().add(1, 'day');
          newEnd = end.clone().add(1, 'day');
        }
    }

    timelineRef.setWindow(
      newStart.toDate(),
      newEnd.toDate(),
      { animation: { duration: 500, easingFunction: 'easeInOutQuad' } }
    );
  };

  const handleRefresh = () => {
    setDateRange(null);
    fetchScheduleData();
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

  return (
    <Card>
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

          <Button.Group>
            <Tooltip title="Zoom In">
              <Button 
                icon={<ZoomInOutlined />} 
                onClick={() => timelineRef?.zoomIn(0.5)} 
              />
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button 
                icon={<ZoomOutOutlined />} 
                onClick={() => timelineRef?.zoomOut(0.5)} 
              />
            </Tooltip>
            <Tooltip title="Fit Timeline">
              <Button 
                icon={<FullscreenOutlined />} 
                onClick={() => timelineRef?.fit()} 
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
        </div>
      </div>

      <div className="relative mt-4">
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
        {timelineContainerRef && <div ref={node => node?.appendChild(timelineContainerRef)} />}
      </div>

      <div className="mt-4 flex gap-4 justify-end">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#1890ff]"></div>
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#52c41a]"></div>
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#f5222d]"></div>
          <span>Rescheduled</span>
        </div>
      </div>
    </Card>
  );
};

export default DynamicSchedulingGraph2;