import React, { useEffect, useState, useRef } from 'react';
import { Card, Typography, Space, Button, Select, DatePicker, message, Spin } from 'antd';
import { BarChartOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SyncOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data/esnext";
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import useDynamicStore from '../../../../store/dynamic-store';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

// Constants for timeline colors and status
const COLORS = {
  PLANNED: '#1890ff',  // Blue for planned operations
  ACTUAL: '#52c41a',   // Green for actual operations
  RESCHEDULE: '#ff4d4f', // Red for rescheduled operations
  ON_TIME: '#52c41a',    // Green for on-time status
  DELAYED: '#ff4d4f',    // Red for delayed status
  WARNING: '#faad14'     // Yellow for warning status
};

const STATUS = {
  ON_TIME: 'on-time',
  DELAYED: 'delayed',
  WARNING: 'warning'
};

const ROW_TYPES = {
  PLANNED: 'planned',
  ACTUAL: 'actual',
  RESCHEDULE: 'reschedule'
};

// Helper function to get time range
const getTimeRange = (viewType, dateRange) => {
  if (dateRange && dateRange[0] && dateRange[1]) {
    return {
      start: dateRange[0].toDate(),
      end: dateRange[1].toDate()
    };
  }

  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (viewType) {
    case 'day':
      start.setHours(0, 0, 0);
      end.setHours(23, 59, 59);
      break;
    case 'week':
      start.setDate(now.getDate() - now.getDay());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59);
      break;
    case 'month':
      start.setDate(1);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0);
      start.setMinutes(0);
      start.setSeconds(0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59);
      break;
  }

  return { start, end };
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

// Helper function to calculate operation status
const getOperationStatus = (operation) => {
  if (!operation.start_time || !operation.end_time) return null;
  
  const now = moment();
  const start = moment(operation.start_time);
  const end = moment(operation.end_time);
  const duration = moment.duration(end.diff(start));
  const threshold = duration.asHours() * 0.1; // 10% of total duration

  if (now.isBefore(start)) {
    return STATUS.ON_TIME;
  } else if (now.isAfter(end)) {
    return STATUS.DELAYED;
  } else {
    const progress = moment.duration(now.diff(start)).asHours();
    const shouldBeComplete = progress / duration.asHours();
    const actualComplete = (operation.quantity_completed || 0) / (operation.quantity || 1);

    if (actualComplete < shouldBeComplete - threshold) {
      return STATUS.WARNING;
    }
    return STATUS.ON_TIME;
  }
};

// Helper function to format duration
const formatDuration = (start, end) => {
  const duration = moment.duration(moment(end).diff(moment(start)));
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  return `${hours}h ${minutes}m`;
};

const DynamicSchedulingGraph = () => {
  const { scheduleData, loading, error, fetchDynamicScheduleData, clearScheduleData } = useDynamicStore();
  const [viewType, setViewType] = useState('week');
  const [dateRange, setDateRange] = useState(null);
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);

  // Initial data fetch and cleanup
  useEffect(() => {
    fetchDynamicScheduleData();

    // Cleanup function when component unmounts
    return () => {
      if (timelineRef.current) {
        try {
          timelineRef.current.destroy();
          timelineRef.current = null;
        } catch (error) {
          console.error('Error destroying timeline:', error);
        }
      }
      // Clear the schedule data from store when unmounting
      clearScheduleData();
      
      // Clean up the container
      if (timelineContainerRef.current) {
        timelineContainerRef.current.innerHTML = '';
      }
    };
  }, [fetchDynamicScheduleData, clearScheduleData]);

  // Timeline creation and update
  useEffect(() => {
    if (!scheduleData || !timelineContainerRef.current) return;

    // Safety cleanup of previous timeline
    if (timelineRef.current) {
      try {
        timelineRef.current.destroy();
        timelineRef.current = null;
      } catch (error) {
        console.error('Error cleaning up previous timeline:', error);
      }
    }

    // Clean container before creating new timeline
    timelineContainerRef.current.innerHTML = '';

    try {
      let itemId = 0;
      const items = new DataSet();
      const groups = new DataSet();
      
      // Track unique machine combinations to prevent duplicates
      const processedMachines = new Set();
      
      // Create groups for each workcenter and its machines
      scheduleData.work_centers?.forEach((workCenter) => {
        workCenter.machines?.forEach((machine) => {
          if (!workCenter.work_center_code || !machine.name) return;
          
          const machineKey = `${workCenter.work_center_code}_${machine.name}`;
          
          // Skip if we've already processed this machine combination
          if (processedMachines.has(machineKey)) return;
          processedMachines.add(machineKey);
          
          // Create a nested structure for machine and its operations
          groups.add({
            id: `${machineKey}`,
            content: `
              <div class="machine-row">
                <div class="machine-name">${workCenter.work_center_code} - ${machine.name}</div>
              </div>
            `,
            className: 'machine-group'
          });

          // Add operation rows
          groups.add({
            id: `${machineKey}_planned`,
            content: `
              <div class="operation-row planned">
                <div class="operation-label">Planned</div>
              </div>
            `,
            className: 'operation-group'
          });

          groups.add({
            id: `${machineKey}_actual`,
            content: `
              <div class="operation-row actual">
                <div class="operation-label">Actual</div>
              </div>
            `,
            className: 'operation-group'
          });

          groups.add({
            id: `${machineKey}_reschedule`,
            content: `
              <div class="operation-row reschedule">
                <div class="operation-label">Reschedule</div>
              </div>
            `,
            className: 'operation-group'
          });
        });
      });

      // Process scheduled operations (Blue)
      scheduleData.scheduled_operations?.forEach(op => {
        if (!op.machine) return;
        
        const workCenter = scheduleData.work_centers?.find(wc => 
          wc.machines?.some(m => m.name === op.machine)
        );
        
        if (!workCenter?.work_center_code) return;
        
        const machineKey = `${workCenter.work_center_code}_${op.machine}`;
        
        items.add({
          id: `item_planned_${itemId++}`,
          group: `${machineKey}_planned`,
          content: `
            <div class="timeline-item">
              <div class="item-header">
                <span>${op.component || ''}</span>
                ${op.priority ? `<span class="priority-badge">${op.priority}</span>` : ''}
              </div>
              <div class="item-body">
                <div class="item-desc">${op.description || ''}</div>
                <div class="item-order">${op.production_order || ''}</div>
                <div class="item-stats">
                  <span class="item-qty">Qty: ${op.quantity || '0'}</span>
                  <span class="item-duration">${formatDuration(op.start_time, op.end_time)}</span>
                </div>
              </div>
            </div>
          `,
          start: new Date(op.start_time),
          end: new Date(op.end_time),
          type: 'range',
          className: `planned-operation ${getOperationStatus(op)}`,
          style: `background-color: ${COLORS.PLANNED}; border-color: ${COLORS.PLANNED}; color: white;`
        });
      });

      // Process production logs (Green)
      scheduleData.production_logs?.forEach(log => {
        if (!log.machine_name) return;
        
        const workCenter = scheduleData.work_centers?.find(wc => 
          wc.machines?.some(m => m.name === log.machine_name)
        );
        
        if (!workCenter?.work_center_code) return;
        
        const machineKey = `${workCenter.work_center_code}_${log.machine_name}`;
        
        items.add({
          id: `item_actual_${itemId++}`,
          group: `${machineKey}_actual`,
          content: `
            <div class="timeline-item">
              <div class="item-header">
                <span>${log.part_number || ''}</span>
                <span class="status-badge ${getOperationStatus(log)}">${getOperationStatus(log)}</span>
              </div>
              <div class="item-body">
                <div class="item-desc">${log.operation_description || ''}</div>
                <div class="item-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(log.quantity_completed / log.quantity) * 100}%"></div>
                  </div>
                  <div class="progress-text">
                    <span>Completed: ${log.quantity_completed || 0}</span>
                    <span>Rejected: ${log.quantity_rejected || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          `,
          start: new Date(log.start_time),
          end: new Date(log.end_time),
          type: 'range',
          className: `actual-operation ${getOperationStatus(log)}`,
          style: `background-color: ${COLORS.ACTUAL}; border-color: ${COLORS.ACTUAL}; color: white;`
        });
      });

      // Process rescheduled operations (Red)
      scheduleData.reschedule?.forEach(update => {
        if (!update.machine_id) return;
        
        const workCenter = scheduleData.work_centers?.find(wc => 
          wc.machines?.some(m => m.id === update.machine_id.toString())
        );
        
        if (!workCenter?.work_center_code) return;
        
        const machine = workCenter.machines?.find(m => m.id === update.machine_id.toString());
        if (!machine?.name) return;
        
        const machineKey = `${workCenter.work_center_code}_${machine.name}`;
        
        items.add({
          id: `item_reschedule_${itemId++}`,
          group: `${machineKey}_reschedule`,
          content: `
            <div class="timeline-item">
              <div class="item-header">v${update.new_version || '1'}</div>
              <div class="item-qty">Completed: ${update.completed_qty || 0}</div>
              <div class="item-remaining">Remaining: ${update.remaining_qty || 0}</div>
              <div class="item-op">Op: ${update.operation_number || 0}</div>
            </div>
          `,
          start: new Date(update.start_time),
          end: new Date(update.end_time),
          type: 'range',
          className: 'reschedule-operation',
          style: `background-color: ${COLORS.RESCHEDULE}; border-color: ${COLORS.RESCHEDULE}; color: white;`
        });
      });

      // Configure timeline options with enhanced features
      const options = {
        stack: false,
        horizontalScroll: true,
        verticalScroll: true,
        zoomKey: 'ctrlKey',
        orientation: 'top',
        height: '670px',
        groupHeightMode: 'fixed',
        groupMinHeight: 35,
        margin: {
          item: { horizontal: 10, vertical: 5 },
          axis: 5
        },
        start: getTimeRange(viewType, dateRange).start,
        end: getTimeRange(viewType, dateRange).end,
        zoomMin: viewType === 'year' ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 30,
        zoomMax: viewType === 'year' ? 1000 * 60 * 60 * 24 * 366 : 1000 * 60 * 60 * 24 * 31,
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap',
          template: function(item) {
            const data = item.data || {};
            const status = getOperationStatus(data);
            return `
              <div class="timeline-tooltip">
                <div class="tooltip-header">
                  <div class="info-row">
                    <span class="label">Part Number:</span>
                    <span class="value">${data.component || data.part_number || ''}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Machine:</span>
                    <span class="value">${data.machine || data.machine_name || ''}</span>
                  </div>
                  ${status ? `
                    <div class="info-row">
                      <span class="label">Status:</span>
                      <span class="status-badge ${status}">${status}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="tooltip-body">
                  <div class="info-row">
                    <span class="label">Production Order:</span>
                    <span class="value">${data.production_order || ''}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Operation:</span>
                    <span class="value">${data.description || data.operation_description || ''}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Duration:</span>
                    <span class="value">${formatDuration(data.start_time, data.end_time)}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Quantity:</span>
                    <span class="value">${data.quantity || data.quantity_completed || '0'}</span>
                  </div>
                  ${data.quantity_completed ? `
                    <div class="progress-section">
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(data.quantity_completed / data.quantity) * 100}%"></div>
                      </div>
                      <div class="progress-text">
                        <span>Progress: ${Math.round((data.quantity_completed / data.quantity) * 100)}%</span>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }
        },
        timeAxis: {
          scale: getTimeAxisScale(viewType),
          step: getTimeAxisStep(viewType),
          format: {
            minorLabels: {
              millisecond: 'SSS',
              second: 'HH:mm:ss',
              minute: 'HH:mm',
              hour: 'HH:mm',
              weekday: 'ddd D',
              day: 'D',
              week: 'w',
              month: 'MMM',
              year: 'YYYY'
            },
            majorLabels: {
              millisecond: 'HH:mm:ss',
              second: 'D MMMM HH:mm',
              minute: 'ddd D MMMM',
              hour: 'ddd D MMMM',
              weekday: 'MMMM YYYY',
              day: 'MMMM YYYY',
              week: 'MMMM YYYY',
              month: 'YYYY',
              year: ''
            }
          }
        }
      };

      // Create new timeline
      const timeline = new Timeline(
        timelineContainerRef.current,
        items,
        groups,
        options
      );

      timelineRef.current = timeline;

    } catch (error) {
      console.error('Timeline initialization error:', error);
      message.error('Failed to initialize timeline');
    }
  }, [scheduleData, viewType, dateRange]);

  const handleViewTypeChange = (newViewType) => {
    setViewType(newViewType);
    if (timelineRef.current) {
      const timeRange = getTimeRange(newViewType, dateRange);
      timelineRef.current.setWindow(timeRange.start, timeRange.end, { animation: true });
    }
  };

  const handleZoom = (direction) => {
    if (!timelineRef.current) return;
    if (direction === 'in') {
      timelineRef.current.zoomIn(0.5);
    } else {
      timelineRef.current.zoomOut(0.5);
    }
  };

  const handleFit = () => {
    if (timelineRef.current) {
      timelineRef.current.fit();
    }
  };

  const handleRefresh = () => {
    fetchDynamicScheduleData();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Loading schedule data..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-8">
        <Space direction="vertical" size="large" className="w-full">
          <Title level={2}>Error Loading Schedule</Title>
          <Text className="text-lg text-red-500">{error}</Text>
          <Button type="primary" onClick={handleRefresh}>
            Retry
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card className="dynamic-schedule">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <Space>
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
              <Button onClick={() => handleTimelineNavigation('left')} icon={<LeftOutlined />} />
              <Button onClick={() => handleTimelineNavigation('today')}>Today</Button>
              <Button onClick={() => handleTimelineNavigation('right')} icon={<RightOutlined />} />
            </Button.Group>
          </Space>
          <Space>
            <Button.Group>
              <Button icon={<ZoomOutOutlined />} onClick={() => handleZoom('out')} />
              <Button icon={<ZoomInOutlined />} onClick={() => handleZoom('in')} />
              <Button icon={<FullscreenOutlined />} onClick={handleFit} />
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
            height: '690px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        />

        {/* Legend */}
        <div className="timeline-legend">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: COLORS.PLANNED }}></div>
            <span>Planned</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: COLORS.ACTUAL }}></div>
            <span>Actual</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: COLORS.RESCHEDULE }}></div>
            <span>Reschedule</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .timeline-header {
          display: flex;
          width: 100%;
          height: 40px;
          background: #f5f5f5;
          border-bottom: 2px solid #e8e8e8;
        }

        .machine-column {
          width: 200px;
          padding: 8px 16px;
          font-weight: 600;
          border-right: 2px solid #e8e8e8;
        }

        .operations-column {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .operation-header {
          height: 35px;
          padding: 8px 16px;
          font-weight: 600;
          border-bottom: 1px solid #e8e8e8;
        }

        .machine-container {
          display: flex;
          width: 100%;
          height: 105px;
        }

        .machine-name {
          width: 200px;
          padding: 8px 16px;
          font-weight: 500;
          background: #fafafa;
          border-right: 2px solid #e8e8e8;
        }

        .operations-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .operation-row {
          height: 35px;
          padding: 8px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .operation-row.planned {
          border-left: 3px solid ${COLORS.PLANNED};
          background: rgba(24, 144, 255, 0.05);
        }

        .operation-row.actual {
          border-left: 3px solid ${COLORS.ACTUAL};
          background: rgba(82, 196, 26, 0.05);
        }

        .operation-row.reschedule {
          border-left: 3px solid ${COLORS.RESCHEDULE};
          background: rgba(255, 77, 79, 0.05);
        }

        .timeline-item {
          padding: 4px 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .item-header {
          font-weight: 500;
          font-size: 12px;
        }

        .item-desc, .item-order, .item-qty {
          font-size: 11px;
          opacity: 0.8;
        }

        /* Timeline Specific Styles */
        .vis-timeline {
          border: none !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #ffffff;
        }

        .vis-panel.vis-center {
          border-left: 1px solid #e8e8e8;
          border-right: 1px solid #e8e8e8;
        }

        .vis-grid.vis-vertical {
          border-left: 1px solid #f0f0f0;
        }

        .vis-grid.vis-horizontal {
          border-bottom: 1px solid #f0f0f0;
        }

        .vis-time-axis .vis-grid.vis-minor {
          border-color: #f5f5f5;
          border-width: 1px;
        }

        .vis-time-axis .vis-grid.vis-major {
          border-color: #e8e8e8;
          border-width: 1px;
        }

        .vis-time-axis .vis-text {
          color: #666;
          padding: 3px;
          font-size: 12px;
        }

        .vis-time-axis .vis-text.vis-major {
          font-weight: bold;
        }

        .vis-item {
          border-radius: 4px;
          border-width: 1px;
          font-size: 12px;
          color: #fff;
          height: 34px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .vis-item.vis-selected {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        .vis-labelset .vis-label {
          border-bottom: 1px solid #e8e8e8;
          background-color: #fafafa;
          padding: 8px;
        }

        .vis-labelset .vis-label.machine-group {
          font-weight: 500;
          background-color: #f5f5f5;
        }

        .vis-foreground .vis-group {
          border-bottom: 1px solid #f0f0f0;
        }

        .machine-row {
          padding: 8px;
          background: #f5f5f5;
          border-bottom: 1px solid #e8e8e8;
        }

        .machine-name {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .timeline-item {
          padding: 6px 10px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .timeline-item.planned {
          background-color: ${COLORS.PLANNED};
          border-color: ${COLORS.PLANNED};
        }

        .timeline-item.actual {
          background-color: ${COLORS.ACTUAL};
          border-color: ${COLORS.ACTUAL};
        }

        .timeline-item.reschedule {
          background-color: ${COLORS.RESCHEDULE};
          border-color: ${COLORS.RESCHEDULE};
        }

        .item-header {
          font-weight: 500;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-body {
          font-size: 11px;
          opacity: 0.85;
        }

        .status-badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          margin-left: 4px;
        }

        .status-badge.on-time {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
          color: #52c41a;
        }

        .status-badge.delayed {
          background: #fff1f0;
          border: 1px solid #ffa39e;
          color: #f5222d;
        }

        .status-badge.warning {
          background: #fffbe6;
          border: 1px solid #ffe58f;
          color: #faad14;
        }

        .priority-badge {
          background: #faad14;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          margin-left: 4px;
        }

        .item-stats {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          opacity: 0.9;
        }

        .item-duration {
          font-family: monospace;
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
          margin: 4px 0;
        }

        .progress-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          transition: width 0.3s ease;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          opacity: 0.9;
        }

        /* Timeline tooltip styles */
        .timeline-tooltip {
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          padding: 12px;
          max-width: 300px;
        }

        .tooltip-header {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .info-row .label {
          color: #666;
          font-weight: 500;
        }

        .info-row .value {
          color: #333;
        }

        .progress-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }

        .vis-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </Card>
  );
};

export default DynamicSchedulingGraph; 