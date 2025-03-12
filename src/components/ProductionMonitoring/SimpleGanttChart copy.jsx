import React, { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { Empty, Space, Select, DatePicker, Button, Tooltip, Spin, Alert } from 'antd';
import { ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';

const { RangePicker } = DatePicker;

const MACHINES = [
  { id: 'MMC1-M1', name: 'MMC1-M1' },
  { id: 'CNCT-m2', name: 'CNCT-m2' },
  { id: 'CNCM-m3', name: 'CNCM-m3' },
  { id: 'SMFD-m4', name: 'SMFD-m4' },
  { id: 'SMPD-m5', name: 'SMPD-m5' },
  { id: 'QFAB-m6', name: 'QFAB-m6' },
  { id: 'FAB-C-PC-m9', name: 'FAB-C-PC-m9' }
];

const SimpleGanttChart = ({ 
  data = [], 
  dateRange, 
  selectedMachine,
  onDateChange,
  onMachineChange,
  onClear,
  onSubmit,
  isLoading,
  error
}) => {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !dateRange) return;

    try {
      // Cleanup previous timeline
      if (timelineRef.current) {
        timelineRef.current.destroy();
      }

      // Create groups from unique machines
      const uniqueMachines = [...new Set(data.map(item => 
        item.machine || item.machine_name || 'Unknown Machine'
      ))];

      const groups = uniqueMachines.map(machine => ({
        id: machine,
        content: machine
      }));

      // Transform items for timeline
      const items = data.map((item, index) => {
        const isProduction = item.type === 'production';
        const startTime = isProduction ? item.start_time : item.start_time;
        const endTime = isProduction ? item.end_time : item.end_time;

        return {
          id: item.id || `item-${index}`,
          group: item.machine || item.machine_name || 'Unknown Machine',
          content: isProduction ? 
            `${item.part_number || 'No Part'}` : 
            `${item.component || 'No Component'}`,
          start: new Date(startTime),
          end: new Date(endTime),
          className: isProduction ? 'production-item' : 'scheduled-item',
          title: isProduction ? 
            `<div class="tooltip-content">
              <div><strong>Part Number:</strong> ${item.part_number || 'N/A'}</div>
              <div><strong>Operation:</strong> ${item.operation_description || 'N/A'}</div>
              <div><strong>Operator:</strong> ${item.operator_name || 'N/A'}</div>
              <div><strong>Quantity:</strong> ${item.quantity_completed || 0}</div>
              <div><strong>PO:</strong> ${item.production_order || 'N/A'}</div>
            </div>` :
            `<div class="tooltip-content">
              <div><strong>Component:</strong> ${item.component || 'N/A'}</div>
              <div><strong>Description:</strong> ${item.description || 'N/A'}</div>
              <div><strong>Quantity:</strong> ${item.quantity || 'N/A'}</div>
              <div><strong>PO:</strong> ${item.production_order || 'N/A'}</div>
            </div>`
        };
      });

      // Timeline options
      const options = {
        start: dateRange[0].toDate(),
        end: dateRange[1].toDate(),
        stack: true,
        verticalScroll: true,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        height: '500px',
        editable: false,
        margin: {
          item: {
            horizontal: -1,
            vertical: 10
          }
        },
        orientation: 'top'
      };

      // Create new timeline
      timelineRef.current = new Timeline(
        containerRef.current,
        items,
        groups,
        options
      );

      // Add event listeners
      timelineRef.current.on('click', (properties) => {
        if (properties.item) {
          const item = items.find(i => i.id === properties.item);
          console.log('Clicked item:', item);
        }
      });

    } catch (error) {
      console.error('Error creating timeline:', error);
    }
  }, [data, dateRange, selectedMachine]);

  const handleZoomIn = () => {
    if (timelineRef.current) {
      timelineRef.current.zoomIn(0.5);
    }
  };

  const handleZoomOut = () => {
    if (timelineRef.current) {
      timelineRef.current.zoomOut(0.5);
    }
  };

  const handleFit = () => {
    if (timelineRef.current) {
      timelineRef.current.fit();
    }
  };

  return (
    <div className="gantt-chart">
      <div className="gantt-controls">
        <div className="flex items-center justify-between gap-4 p-4 border-b">
          <div className="flex items-center gap-4">
            <Select
              value={selectedMachine}
              onChange={onMachineChange}
              style={{ width: 200 }}
              options={[
                { value: 'all', label: 'All Machines' },
                ...MACHINES.map(m => ({ value: m.id, label: m.name }))
              ]}
              placeholder="Select Machine"
              disabled={isLoading}
            />
            <RangePicker
              value={dateRange}
              onChange={onDateChange}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              className="min-w-[300px]"
              allowClear={true}
              disabled={isLoading}
            />
            <Space>
              <Button 
                type="primary"
                onClick={onSubmit}
                loading={isLoading}
              >
                Submit
              </Button>
              <Button 
                onClick={onClear}
                disabled={isLoading}
              >
                Clear Dates
              </Button>
            </Space>
          </div>
          <Space>
            <Tooltip title="Zoom In">
              <Button icon={<ZoomIn size={16} />} onClick={handleZoomIn} disabled={isLoading} />
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button icon={<ZoomOut size={16} />} onClick={handleZoomOut} disabled={isLoading} />
            </Tooltip>
            <Tooltip title="Fit View">
              <Button icon={<Maximize size={16} />} onClick={handleFit} disabled={isLoading} />
            </Tooltip>
            <Tooltip title="Refresh">
              <Button icon={<RefreshCw size={16} />} onClick={onSubmit} disabled={isLoading} />
            </Tooltip>
          </Space>
        </div>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="m-4"
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Loading data..." />
        </div>
      ) : data.length > 0 ? (
        <div ref={containerRef} className="timeline-container" />
      ) : (
        <div className="flex justify-center items-center h-[500px]">
          <Empty description="No data available" />
        </div>
      )}

      <style jsx>{`
        .gantt-chart {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .gantt-controls {
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
        }

        .timeline-container {
          height: 500px;
          padding: 1rem;
        }

        :global(.vis-timeline) {
          border: none !important;
        }

        :global(.vis-item) {
          border: none !important;
          border-radius: 4px !important;
        }

        :global(.production-item) {
          background-color: #10B981 !important;
          color: white !important;
          border-radius: 4px !important;
        }

        :global(.scheduled-item) {
          background-color: #3B82F6 !important;
          color: white !important;
          border-radius: 4px !important;
        }

        :global(.vis-time-axis .vis-grid.vis-minor) {
          border-width: 1px;
          border-color: #f0f0f0;
        }

        :global(.vis-time-axis .vis-grid.vis-major) {
          border-width: 1px;
          border-color: #e0e0e0;
        }

        :global(.vis-timeline .vis-item .vis-item-content) {
          padding: 4px 8px;
          font-size: 12px;
        }

        :global(.vis-panel.vis-center) {
          border-left: 1px solid #f0f0f0;
        }

        :global(.tooltip-content) {
          padding: 8px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default SimpleGanttChart; 