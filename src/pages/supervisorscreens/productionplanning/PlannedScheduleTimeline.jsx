import React, { useEffect, useRef, useState } from 'react';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data/esnext";
import "vis-timeline/dist/vis-timeline-graph2d.css";
import { Button, Select, DatePicker, Card, Space, Tooltip, Spin, Alert, Badge, Empty } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  FullscreenOutlined,
  SyncOutlined,
  ReloadOutlined,
  WarningOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import useSchedulePlannedStore from '../../../store/scheduleplanned-store';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Helper function to get the next Monday if date is Sunday
const getNextMondayIfSunday = (date) => {
  const momentDate = moment(date);
  if (momentDate.day() === 0) { // If Sunday (0)
    return momentDate.add(1, 'day'); // Move to Monday
  }
  return momentDate;
};

// Helper function to get the previous Saturday if date is Sunday
const getPreviousSaturdayIfSunday = (date) => {
  const momentDate = moment(date);
  if (momentDate.day() === 0) { // If Sunday (0)
    return momentDate.subtract(1, 'day'); // Move to Saturday
  }
  return momentDate;
};

const ProductionTimelineChart = () => {
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const [timelineInstance, setTimelineInstance] = useState(null);

  // Store state and actions
  const {
    scheduleData,
    loading,
    error,
    machines,
    workCenters,
    productionOrders,
    components,
    selectedMachines,
    selectedProductionOrders,
    selectedComponents,
    dateRange,
    viewType,
    fetchScheduleData,
    setSelectedMachines,
    setSelectedProductionOrders,
    setSelectedComponents,
    setDateRange,
    setViewType,
    clearFilters,
    refreshData,
    getTimelineItems,
    getTimelineGroups,
    generateProductionOrderColors,
    getOperationConflicts,
    getOverallMetrics
  } = useSchedulePlannedStore();

  // Load data on component mount
  useEffect(() => {
    fetchScheduleData();
  }, []);

  // Filter out "Default" machines from work centers
  const filteredWorkCenters = workCenters.map(workCenter => ({
    ...workCenter,
    machines: workCenter.machines.filter(machine => 
      machine.name !== "Default" && 
      machine.model !== "Default" && 
      machine.type !== "Default"
    )
  })).filter(workCenter => workCenter.machines.length > 0); // Only show work centers that have non-default machines

  // Check if production orders are selected
  const hasSelectedProductionOrders = selectedProductionOrders && selectedProductionOrders.length > 0;

  // Initialize/update timeline when data changes - only if production orders are selected
  useEffect(() => {
    if (!timelineContainerRef.current || !scheduleData || !hasSelectedProductionOrders) {
      // Clean up timeline if no production orders selected
      if (timelineInstance && !hasSelectedProductionOrders) {
        timelineInstance.destroy();
        setTimelineInstance(null);
      }
      return;
    }

    try {
      // Get timeline data
      const items = new DataSet(getTimelineItems());
      const allGroups = getTimelineGroups();
      
      // Filter out Default machines from timeline groups
      const filteredGroups = allGroups.filter(group => {
        // Check if the group represents a machine and if it's a default machine
        const isDefaultMachine = group.id && (
          group.id.includes('Default') || 
          group.content && (
            group.content.includes('Default (') || 
            group.content.includes('- Default ')
          )
        );
        return !isDefaultMachine;
      });
      
      const groups = new DataSet(filteredGroups);

      // Calculate time range with Sunday exclusion
      let start, end;

      if (dateRange && dateRange[0] && dateRange[1]) {
        // Use date range but adjust if it falls on Sunday
        start = getNextMondayIfSunday(dateRange[0].clone()).hour(6).minute(0).second(0).toDate();
        end = getPreviousSaturdayIfSunday(dateRange[1].clone()).hour(22).minute(0).second(0).toDate();
      } else {
        // Default to current week, ensuring it starts on Monday and ends on Saturday
        let startOfWeek = moment().startOf('isoWeek'); // ISO week starts on Monday
        start = startOfWeek.hour(6).minute(0).second(0).toDate();
        end = startOfWeek.clone().add(5, 'days').hour(22).minute(0).second(0).toDate(); // End on Saturday
      }

      // Timeline options with Sunday exclusion
      const options = {
        stack: false,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        orientation: 'top',
        height: '600px',
        margin: {
          item: { horizontal: 10, vertical: 5 },
          axis: 5
        },
        start: start,
        end: end,
        zoomMin: 1000 * 60 * 60, // 1 hour
        zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 year
        editable: false,
        groupOrder: 'order',
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap',
          template: function(item) {
            const op = item.operation;
            if (!op) return '';
            
            const startTime = new Date(op.start_time).toLocaleString();
            const endTime = new Date(op.end_time).toLocaleString();
            const duration = ((new Date(op.end_time) - new Date(op.start_time)) / (1000 * 60 * 60)).toFixed(1);
            
            return `
              <div style="padding: 12px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); max-width: 300px;">
                <div style="font-weight: bold; margin-bottom: 8px; color: #1890ff;">${op.production_order}</div>
                <div style="margin-bottom: 4px;"><strong>Component:</strong> ${op.component}</div>
                <div style="margin-bottom: 4px;"><strong>Part:</strong> ${op.part_description || 'N/A'}</div>
                <div style="margin-bottom: 4px;"><strong>Machine:</strong> ${op.machine}</div>
                <div style="margin-bottom: 4px;"><strong>Operation:</strong> ${op.description}</div>
                <div style="margin-bottom: 4px;"><strong>Quantity:</strong> ${op.quantity}</div>
                <div style="margin-bottom: 4px;"><strong>Start:</strong> ${startTime}</div>
                <div style="margin-bottom: 4px;"><strong>End:</strong> ${endTime}</div>
                <div><strong>Duration:</strong> ${duration} hours</div>
              </div>
            `;
          }
        },
        timeAxis: { 
          scale: getTimeAxisScale(viewType),
          step: getTimeAxisStep(viewType),
          // Filter function to exclude Sundays from the timeline
          filter: function (date) {
            return date.getDay() !== 0; // Exclude Sundays (0 is Sunday)
          }
        },
        format: {
          minorLabels: {
            hour: 'HH:00',
            minute: 'HH:mm',
            day: function (date, scale, step) {
              return date.getDay() === 0 ? '' : moment(date).format('D');
            },
            month: 'MMM',
            year: 'YYYY'
          },
          majorLabels: {
            hour: 'ddd D MMM',
            day: function (date, scale, step) {
              return date.getDay() === 0 ? '' : moment(date).format('ddd D MMM');
            },
            month: 'YYYY',
            year: ''
          }
        },
        // Hide Sundays and non-working hours
        hiddenDates: [
          // Hide Sunday completely
          {
            start: '1970-01-04 00:00:00', // Sunday (Jan 4, 1970 was a Sunday)
            end: '1970-01-05 00:00:00',   // End at Monday 00:00:00
            repeat: 'weekly' // Repeat every week
          },
          // Hide early morning hours (before 6 AM)
          {
            start: '1970-01-01 00:00:00',
            end: '1970-01-01 06:00:00',
            repeat: 'daily'
          },
          // Hide late evening hours (after 10 PM)
          {
            start: '1970-01-01 22:00:00',
            end: '1970-01-01 23:59:59',
            repeat: 'daily'
          }
        ],
      };

      // Cleanup previous timeline
      if (timelineInstance) {
        timelineInstance.destroy();
      }

      // Create new timeline
      const timeline = new Timeline(
        timelineContainerRef.current,
        items,
        groups,
        options
      );

      setTimelineInstance(timeline);

      // Add dynamic styles for production orders
      const productionOrderColors = generateProductionOrderColors();
      const styles = Object.entries(productionOrderColors).map(([order, color]) => `
        .vis-item.order-${order.replace(/[^a-zA-Z0-9]/g, '-')} {
          background-color: ${color} !important;
          border-color: ${color} !important;
        }
      `).join('\n');

      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);

      return () => {
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      };

    } catch (error) {
      console.error('Timeline initialization error:', error);
    }
  }, [scheduleData, selectedMachines, selectedProductionOrders, selectedComponents, dateRange, viewType, hasSelectedProductionOrders]);

  // Helper functions for time axis - Same as main scheduling component
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

  // Updated timeline navigation to skip Sundays
  const handleTimelineNavigation = (direction) => {
    if (!timelineInstance) return;

    const currentWindow = timelineInstance.getWindow();
    const start = moment(currentWindow.start);
    const end = moment(currentWindow.end);

    let newStart, newEnd;
    
    switch (viewType) {
      case 'day':
        switch (direction) {
          case 'left':
            newStart = start.clone().subtract(1, 'day');
            newEnd = end.clone().subtract(1, 'day');
            // Skip Sunday
            if (newStart.day() === 0) {
              newStart = newStart.subtract(1, 'day'); // Move to Saturday
              newEnd = newEnd.subtract(1, 'day');
            }
            newStart = newStart.hour(6).minute(0).second(0);
            newEnd = newEnd.hour(22).minute(0).second(0);
            break;
          case 'right':
            newStart = start.clone().add(1, 'day');
            newEnd = end.clone().add(1, 'day');
            // Skip Sunday
            if (newStart.day() === 0) {
              newStart = newStart.add(1, 'day'); // Move to Monday
              newEnd = newEnd.add(1, 'day');
            }
            newStart = newStart.hour(6).minute(0).second(0);
            newEnd = newEnd.hour(22).minute(0).second(0);
            break;
          case 'today':
            let today = moment();
            if (today.day() === 0) { // If today is Sunday, show Monday
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
            newEnd = start.clone().subtract(1, 'week').add(5, 'days'); // Monday to Saturday
            break;
          case 'right':
            newStart = start.clone().add(1, 'week');
            newEnd = start.clone().add(1, 'week').add(5, 'days'); // Monday to Saturday
            break;
          case 'today':
            newStart = moment().startOf('isoWeek'); // Monday
            newEnd = moment().startOf('isoWeek').add(5, 'days'); // Saturday
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

    timelineInstance.setWindow(newStart.toDate(), newEnd.toDate(), { animation: true });
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  // Get conflicts and metrics for display - only if production orders are selected
  const conflicts = hasSelectedProductionOrders ? getOperationConflicts() : [];
  const metrics = hasSelectedProductionOrders ? getOverallMetrics() : null;
  const productionOrderColors = generateProductionOrderColors();

  if (loading) {
    return (
        <Card style={{ margin: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#262626', marginBottom: '8px' }}>
              Data is being Loaded.
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Loading schedule data...
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ margin: '20px', borderRadius: '8px' }}>
        <Alert
          message="Error Loading Schedule Data"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={handleRefresh}>
              <ReloadOutlined /> Retry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card style={{ margin: '20px', borderRadius: '8px' }}>
      {/* Header with metrics - only show if production orders are selected */}
      {/* {metrics && hasSelectedProductionOrders && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fafafa', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{metrics.totalOperations}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Operations</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{metrics.totalMachines}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Machines</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>{metrics.totalProductionOrders}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Production Orders</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>{metrics.totalDurationHours}h</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Duration</div>
              </div>
            </div>
            {conflicts.length > 0 && (
              <Badge count={conflicts.length} offset={[10, 0]}>
                <Button icon={<WarningOutlined />} type="text" danger>
                  Conflicts Detected
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )} */}

      {/* Controls */}
      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <Select 
          value={viewType}
          onChange={setViewType}
          style={{ width: 120 }}
        >
          <Option value="day">Daily</Option>
          <Option value="week">Weekly</Option>
          {/* <Option value="month">Monthly</Option> */}
          <Option value="year">Yearly</Option>
        </Select>

        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          style={{ width: 280 }}
          placeholder={['Start Date', 'End Date']}
        />

        {/* <Select 
          mode="multiple" 
          placeholder="Select Machines"
          value={selectedMachines}
          onChange={setSelectedMachines}
          style={{ minWidth: 200, maxWidth: 300 }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {machines
            .filter(machine => 
              machine.name !== "Default" && 
              machine.model !== "Default" && 
              machine.type !== "Default" &&
              !machine.fullName?.includes("Default")
            )
            .map(machine => (
              <Option key={machine.id} value={machine.id}>
                {machine.fullName}
              </Option>
            ))}
        </Select> */}


<Select
  placeholder="Select Production Order"
  value={selectedProductionOrders?.[0]} // Take only the first element or undefined
  onChange={(value) => setSelectedProductionOrders(value ? [value] : [])} // Convert single value to array format
  style={{ minWidth: 180 }}
  allowClear
  showSearch
  filterOption={(input, option) =>
    option.children.props.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0
  }
>
  {productionOrders.map(order => {
    const color = productionOrderColors[order.id];
    return (
      <Option key={order.id} value={order.id}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: color,
            borderRadius: '4px'
          }} />
          {order.name}
        </div>
      </Option>
    );
  })}
</Select>

        {/* <Select
          mode="multiple"
          placeholder="Select Components"
          value={selectedComponents}
          onChange={setSelectedComponents}
          style={{ minWidth: 180 }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {components.map(component => (
            <Option key={component.id} value={component.id}>
              {component.name} - {component.description}
            </Option>
          ))}
        </Select> */}

        <Space>
          <Tooltip title="Zoom In">
            <Button 
              icon={<ZoomInOutlined />} 
              onClick={() => timelineInstance?.zoomIn(0.5)} 
              disabled={!hasSelectedProductionOrders || !timelineInstance}
            />
          </Tooltip>
          <Tooltip title="Zoom Out">
            <Button 
              icon={<ZoomOutOutlined />} 
              onClick={() => timelineInstance?.zoomOut(0.5)} 
              disabled={!hasSelectedProductionOrders || !timelineInstance}
            />
          </Tooltip>
          <Tooltip title="Fit Timeline">
            <Button 
              icon={<FullscreenOutlined />} 
              onClick={() => timelineInstance?.fit()} 
              disabled={!hasSelectedProductionOrders || !timelineInstance}
            />
          </Tooltip>
          <Tooltip title="Clear Filters">
            <Button 
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Tooltip>
          <Button 
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleRefresh} 
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Conditional rendering: Show message if no production orders selected, otherwise show timeline */}
      {!hasSelectedProductionOrders ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          backgroundColor: '#fafafa',
          border: '1px solid #f0f0f0',
          borderRadius: '8px'
        }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            imageStyle={{ height: 60 }}
            description={
              <div style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#262626', marginBottom: '8px' }}>
                  Please Select Production Orders
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Choose one or more production orders from the dropdown above to view the production timeline chart.
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Navigation */}
          <div style={{ position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              top: '10px', 
              left: '10px', 
              right: '10px', 
              zIndex: 10,
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Button
                icon={<LeftOutlined />}
                onClick={() => handleTimelineNavigation('left')}
                disabled={!timelineInstance}
              />
              {/* <Button
                onClick={() => handleTimelineNavigation('today')}
                disabled={!timelineInstance}
              >
                Today
              </Button> */}
              <Button
                icon={<RightOutlined />}
                onClick={() => handleTimelineNavigation('right')}
                disabled={!timelineInstance}
              />
            </div>

            {/* Timeline Container */}
            <div 
              ref={timelineContainerRef}
              style={{ 
                height: '600px',
                backgroundColor: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <Alert
              message="Operation Conflicts Detected"
              description={`${conflicts.length} scheduling conflicts found where operations overlap on the same machine.`}
              type="warning"
              showIcon
              style={{ marginTop: '16px' }}
              closable
            />
          )}

          {/* Legend */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
              Production Orders Legend
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {Object.entries(productionOrderColors).map(([order, color]) => (
                <div 
                  key={order}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#fafafa',
                    borderRadius: '6px',
                    border: '1px solid #f0f0f0',
                    fontSize: '13px'
                  }}
                >
                  <div 
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: color,
                      borderRadius: '4px'
                    }}
                  />
                  <span>{order}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .vis-timeline {
          border: none !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        .vis-item {
          border-radius: 4px !important;
          border-width: 2px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        
        .vis-item.vis-selected {
          border-color: #1890ff !important;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
        }
        
        .vis-time-axis .vis-grid.vis-minor {
          border-color: rgba(0,0,0,0.06) !important;
        }
        
        .vis-time-axis .vis-grid.vis-major {
          border-color: rgba(0,0,0,0.12) !important;
        }
        
        .vis-labelset .vis-label {
          color: #262626 !important;
          font-weight: 500 !important;
        }
        
        .vis-group {
          border-bottom: 1px solid #f0f0f0 !important;
        }
        
        .machine-group {
     
          border-radius: 4px;
        }
        
        .vis-time-axis {
          border-top: 1px solid #f0f0f0 !important;
        }
        
        .vis-panel.vis-bottom {
          border-top: 1px solid #f0f0f0 !important;
        }

        .timeline-item {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .vis-item .vis-item-overflow {
          overflow: visible;
        }

        
      `}</style>
    </Card>
  );
};

export default ProductionTimelineChart;