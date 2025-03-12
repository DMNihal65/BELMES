import React, { useEffect, useRef, useState } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { Card, Space, Button, Tooltip } from 'antd';
import { ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';
import useProductionStore from '../../store/productionStore';
import moment from 'moment';
import dayjs from 'dayjs';

const ProductionGanttChart = ({ data = [], dateRange }) => {
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const [timeline, setTimeline] = useState(null);

  // Ensure data is an array and has required properties
  const validData = Array.isArray(data) ? data : [];

  // Group data by machine with null checks
  const groupedData = validData.reduce((acc, item) => {
    if (!item || !item.machine_name) return acc;
    
    if (!acc[item.machine_name]) {
      acc[item.machine_name] = [];
    }
    acc[item.machine_name].push(item);
    return acc;
  }, {});

  const startDate = dateRange?.[0] || dayjs().subtract(7, 'day');
  const endDate = dateRange?.[1] || dayjs();

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const items = [];
      const groups = [];

      // Create timeline items
      Object.entries(groupedData).forEach(([machineName, machineData]) => {
        groups.push({
          id: machineName,
          content: machineName
        });

        machineData.forEach((item, index) => {
          const start = dayjs(item.start_time || item.last_updated);
          const end = dayjs(item.end_time || start.add(1, 'hour'));

          items.push({
            id: `${machineName}-${index}`,
            group: machineName,
            content: item.program_number || item.active_program || 'No Program',
            start: start.toDate(),
            end: end.toDate(),
            className: `status-${item.status?.toLowerCase()}`,
            type: 'range'
          });
        });
      });

      const options = {
        stack: true,
        horizontalScroll: true,
        verticalScroll: true,
        zoomKey: 'ctrlKey',
        start: startDate.toDate(),
        end: endDate.toDate(),
        min: startDate.subtract(1, 'day').toDate(),
        max: endDate.add(1, 'day').toDate(),
        zoomMin: 1000 * 60 * 60, // 1 hour
        zoomMax: 1000 * 60 * 60 * 24 * 31, // 31 days
        height: '400px',
        snap: null, // Disable snapping
        editable: false,
        margin: {
          item: {
            horizontal: 0,
            vertical: 5
          }
        }
      };

      // Destroy existing timeline if it exists
      if (timelineRef.current) {
        timelineRef.current.destroy();
      }

      // Create new timeline
      const newTimeline = new Timeline(
        containerRef.current,
        items,
        groups,
        options
      );

      timelineRef.current = newTimeline;
      setTimeline(newTimeline);

      return () => {
        if (timelineRef.current) {
          timelineRef.current.destroy();
          timelineRef.current = null;
          setTimeline(null);
        }
      };
    } catch (error) {
      console.error('Error initializing timeline:', error);
    }
  }, [groupedData, startDate, endDate]);

  const handleZoomIn = () => {
    if (timeline) timeline.zoomIn(0.5);
  };

  const handleZoomOut = () => {
    if (timeline) timeline.zoomOut(0.5);
  };

  const handleFit = () => {
    if (timeline) timeline.fit();
  };

  const handleCenter = () => {
    if (timeline) {
      const currentDate = dayjs();
      timeline.moveTo(currentDate.toDate());
    }
  };

  return (
    <div className="production-gantt">
      <Space className="mb-4">
        <Tooltip title="Zoom In">
          <Button 
            icon={<ZoomIn size={16} />} 
            onClick={handleZoomIn}
            disabled={!timeline}
          />
        </Tooltip>
        <Tooltip title="Zoom Out">
          <Button 
            icon={<ZoomOut size={16} />} 
            onClick={handleZoomOut}
            disabled={!timeline}
          />
        </Tooltip>
        <Tooltip title="Fit All">
          <Button 
            icon={<Maximize size={16} />} 
            onClick={handleFit}
            disabled={!timeline}
          />
        </Tooltip>
        <Tooltip title="Center Timeline">
          <Button 
            icon={<RefreshCw size={16} />} 
            onClick={handleCenter}
            disabled={!timeline}
          />
        </Tooltip>
      </Space>

      <div 
        ref={containerRef} 
        className="timeline-container border rounded-lg"
        style={{ background: 'white' }}
      />

      <style jsx>{`
        .timeline-container {
          padding: 1rem;
          min-height: 400px;
        }
        
        /* Status-based colors */
        .status-on { background-color: #10B981 !important; }
        .status-off { background-color: #EF4444 !important; }
        .status-production { background-color: #3B82F6 !important; }
        .status-maintenance { background-color: #8B5CF6 !important; }
        
        /* Remove sticky behavior */
        .vis-timeline {
          overflow: visible !important;
        }
        
        .vis-item {
          color: white;
          border-radius: 4px;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default ProductionGanttChart; 