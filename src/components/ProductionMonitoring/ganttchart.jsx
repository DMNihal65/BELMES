import React, { useEffect, useState, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { message, Spin } from 'antd';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

const ProductionGantt = ({ machineData, timeRange, dateRange }) => {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const timelineRef = useRef(null);

  // Helper function to get time range values
  const getTimeRangeValues = (range, customRange) => {
    const startTime = new Date();
    const endTime = new Date();

    switch (range) {
      case 'shift1':
        startTime.setHours(6, 0, 0);
        endTime.setHours(14, 0, 0);
        break;
      case 'shift2':
        startTime.setHours(14, 0, 0);
        endTime.setHours(22, 0, 0);
        break;
      case 'shift3':
        startTime.setHours(22, 0, 0);
        endTime.setHours(6, 0, 0);
        endTime.setDate(endTime.getDate() + 1);
        break;
      case 'custom':
        if (customRange && customRange.length === 2) {
          return [customRange[0].toDate(), customRange[1].toDate()];
        }
        // Fall through to default if custom range is invalid
      default:
        startTime.setHours(8, 0, 0);
        endTime.setHours(16, 0, 0);
    }
    return [startTime, endTime];
  };

  // Helper function to get status color
  const getStatusColor = (efficiency, status) => {
    if (status === 'idle') return '#d9d9d9';
    return efficiency >= 85 ? '#15803d' : efficiency >= 70 ? '#ca8a04' : '#dc2626';
  };

  useEffect(() => {
    if (!machineData || machineData.length === 0) return;

    try {
      const convertedItems = machineData.map((machine) => {
        const [startTime, endTime] = getTimeRangeValues(timeRange, dateRange);
        const progress = Math.min((machine.actualUnits / machine.plannedUnits) * 100, 100);

        return {
          id: machine.id,
          content: `${machine.name} - ${machine.currentJob}`,
          start: startTime,
          end: endTime,
          type: 'range',
          className: `status-${machine.status}`,
          style: `background-color: ${getStatusColor(machine.efficiency, machine.status)};`,
          ...machine,
        };
      });

      const convertedGroups = machineData.map((machine) => ({
        id: machine.id,
        content: machine.name,
      }));

      setItems(convertedItems);
      setGroups(convertedGroups);
    } catch (error) {
      console.error('Error converting machine data to items:', error);
      message.error('Error loading production schedule');
    }
  }, [machineData, timeRange, dateRange]);

  useEffect(() => {
    if (timelineRef.current && items.length > 0 && groups.length > 0) {
      const timeline = new Timeline(timelineRef.current, items, groups, {
        start: getTimeRangeValues(timeRange, dateRange)[0],
        end: getTimeRangeValues(timeRange, dateRange)[1],
        editable: false,
        selectable: false,
        showCurrentTime: true,
        zoomable: true,
        margin: {
          item: {
            horizontal: 0,
            vertical: 10,
          },
        },
      });

      timeline.on('select', (properties) => {
        message.warning('Schedule modifications are not allowed in view mode');
      });
    }
  }, [items, groups, timeRange, dateRange]);

  if (!machineData || machineData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading production schedule..." />
      </div>
    );
  }

  return (
    <div className="production-timeline">
      <div ref={timelineRef} style={{ height: '400px', width: '100%' }} />
    </div>
  );
};

export default ProductionGantt;