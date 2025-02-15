import React, { useEffect, useState, useRef } from 'react';
import { Card, Typography, Space, Button, Select, DatePicker, message, Spin } from 'antd';
import { BarChartOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SyncOutlined } from '@ant-design/icons';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import useDynamicStore from '../../../../store/dynamic-store';

const { Title, Text } = Typography;
const { Option } = Select;

// Constants for timeline colors
const COLORS = {
  SCHEDULED: '#1890ff', // Blue for scheduled operations
  PRODUCTION: '#52c41a', // Green for production logs
  UPDATES: '#ff4d4f'    // Red for updates
};

const ROW_TYPES = {
  PLANNED: 'planned',
  ACTUAL: 'actual',
  UPDATES: 'updates'
};

const DynamicSchedulingGraph = () => {
  const { scheduleData, loading, error, fetchDynamicScheduleData, getUniqueMachines } = useDynamicStore();
  const [viewType, setViewType] = useState('week');
  const [dateRange, setDateRange] = useState(null);
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);

  useEffect(() => {
    fetchDynamicScheduleData();
  }, [fetchDynamicScheduleData]);

  useEffect(() => {
    if (!scheduleData || !timelineContainerRef.current) return;

    try {
      const machines = getUniqueMachines();
      let itemId = 0;
      
      // Create timeline items
      const items = new DataSet();
      const groups = new DataSet();
      
      // Create groups with subgroups for each machine
      machines.forEach((machine, machineIndex) => {
        // Create parent group for machine
        groups.add({
          id: `${machine}`,
          content: machine,
          nestedGroups: [
            `${machine}_${ROW_TYPES.PLANNED}`,
            `${machine}_${ROW_TYPES.ACTUAL}`,
            `${machine}_${ROW_TYPES.UPDATES}`
          ],
          showNested: true
        });
        
        // Add subgroups for planned, actual, and updates
        groups.add({
          id: `${machine}_${ROW_TYPES.PLANNED}`,
          content: 'Planned',
          className: 'planned-row',
          style: 'border-left: 3px solid ' + COLORS.SCHEDULED
        });
        groups.add({
          id: `${machine}_${ROW_TYPES.ACTUAL}`,
          content: 'Actual',
          className: 'actual-row',
          style: 'border-left: 3px solid ' + COLORS.PRODUCTION
        });
        groups.add({
          id: `${machine}_${ROW_TYPES.UPDATES}`,
          content: 'Updates',
          className: 'updates-row',
          style: 'border-left: 3px solid ' + COLORS.UPDATES
        });
      });
      
      // Process scheduled operations (Blue)
      scheduleData.scheduled_operations.forEach(op => {
        items.add({
          id: itemId++,
          group: `${op.machine}_${ROW_TYPES.PLANNED}`,
          content: `
            <div class="timeline-item scheduled">
              <div class="item-header">${op.component}</div>
              <div class="item-desc">${op.description}</div>
              <div class="item-order">${op.production_order}</div>
            </div>
          `,
          start: new Date(op.start_time),
          end: new Date(op.end_time),
          type: 'range',
          className: 'scheduled-operation',
          style: `background-color: ${COLORS.SCHEDULED}; border-color: ${COLORS.SCHEDULED}; color: white;`
        });
      });

      // Process production logs (Green)
      scheduleData.production_logs.forEach(log => {
        items.add({
          id: itemId++,
          group: `${log.machine_name}_${ROW_TYPES.ACTUAL}`,
          content: `
            <div class="timeline-item production">
              <div class="item-header">${log.part_number}</div>
              <div class="item-desc">${log.operation_description}</div>
              <div class="item-qty">Completed: ${log.quantity_completed}</div>
            </div>
          `,
          start: new Date(log.start_time),
          end: new Date(log.end_time),
          type: 'range',
          className: 'production-log',
          style: `background-color: ${COLORS.PRODUCTION}; border-color: ${COLORS.PRODUCTION}; color: white;`
        });
      });

      // Process updates (Red)
      scheduleData.updates.forEach(update => {
        items.add({
          id: itemId++,
          group: `${update.machine_id}_${ROW_TYPES.UPDATES}`,
          content: `
            <div class="timeline-item update">
              <div class="item-header">v${update.new_version}</div>
              <div class="item-qty">Remaining: ${update.remaining_qty}</div>
            </div>
          `,
          start: new Date(update.start_time),
          end: new Date(update.end_time),
          type: 'range',
          className: 'update-item',
          style: `background-color: ${COLORS.UPDATES}; border-color: ${COLORS.UPDATES}; color: white;`
        });
      });

      // Configure timeline options
      const options = {
        stack: false,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        orientation: 'top',
        height: '670px',
        groupHeightMode: 'fixed',
        groupMinHeight: 50,
        margin: {
          item: { horizontal: 10, vertical: 5 },
          axis: 5
        },
        start: getTimeRange(viewType, dateRange).start,
        end: getTimeRange(viewType, dateRange).end,
        zoomMin: 1000 * 60 * 30,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 2,
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap'
        }
      };

      // Cleanup previous timeline
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
            height: '670px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        />

        {/* Legend */}
        <div className="timeline-legend">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: COLORS.SCHEDULED }}></div>
            <span>Planned</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: COLORS.PRODUCTION }}></div>
            <span>Actual</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: COLORS.UPDATES }}></div>
            <span>Updates</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .timeline-item {
          padding: 4px 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .item-header {
          font-weight: 500;
          font-size: 14px;
        }
        .item-desc, .item-order, .item-qty {
          font-size: 12px;
          opacity: 0.8;
        }
        .timeline-legend {
          display: flex;
          gap: 20px;
          margin-top: 16px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .color-box {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        .vis-timeline {
          border: none;
        }
        .vis-item {
          border-radius: 4px;
          border-width: 1px;
        }
        .vis-group {
          border-bottom: 1px solid #f0f0f0;
        }
        .vis-nested-group {
          background: #fafafa;
        }
        .planned-row, .actual-row, .updates-row {
          padding: 4px 8px;
          font-size: 12px;
          color: #666;
          background: #fff;
        }
        .vis-label {
          padding: 4px 8px;
          font-weight: 500;
        }
        .vis-label.vis-nested-group {
          padding-left: 24px;
        }
      `}</style>
    </Card>
  );
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
      end.setMonth(11, 31);
      end.setHours(23, 59, 59);
      break;
  }

  return { start, end };
};

export default DynamicSchedulingGraph; 