import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { Empty, Space, Select, DatePicker, Button, Tooltip, Spin, Alert, Badge, Radio } from 'antd';
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Pause, Play } from 'lucide-react';
import dayjs from 'dayjs';

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

const VIEW_MODES = {
  daily: {
    label: 'Daily',
    getRange: () => [dayjs().startOf('day'), dayjs().endOf('day')],
    scale: 'hour',
    step: 1
  },
  weekly: {
    label: 'Weekly',
    getRange: () => [dayjs().startOf('week'), dayjs().endOf('week')],
    scale: 'day',
    step: 1
  },
  monthly: {
    label: 'Monthly',
    getRange: () => [dayjs().startOf('month'), dayjs().endOf('month')],
    scale: 'day',
    step: 1
  }
};

const SimpleGanttChart = ({ 
  data = [], 
  dateRange, 
  selectedMachine,
  onDateChange,
  onMachineChange,
  onSubmit,
  onClear,
  isLoading,
  error
}) => {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [viewMode, setViewMode] = useState('daily');

  // Handle auto-refresh with countdown
  useEffect(() => {
    let countdownInterval;

    if (autoRefresh) {
      // Initial refresh
      onSubmit(false);
      setCountdown(60);

      // Set up countdown interval
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            onSubmit(false);
            console.log('Auto-refreshing data...', new Date().toLocaleString());
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      console.log('Auto-refresh enabled', new Date().toLocaleString());
    } else {
      setCountdown(60);
      console.log('Auto-refresh disabled', new Date().toLocaleString());
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [autoRefresh]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Handle view mode change
  const handleViewModeChange = (e) => {
    const newMode = e.target.value;
    setViewMode(newMode);
    const newRange = VIEW_MODES[newMode].getRange();
    onDateChange(newRange);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (timelineRef.current) {
        timelineRef.current.destroy();
      }

      if (data.length === 0) return;

      const uniqueMachines = [...new Set(data.map(item => item.machine))].sort();
      const groups = uniqueMachines.map(machine => ({
        id: machine,
        content: `<div class="machine-group">
          <span class="machine-name">${machine}</span>
        </div>`
      }));

      const items = data.map((item, index) => {
        const startTime = dayjs(item.start_time).toDate();
        const endTime = dayjs(item.end_time).toDate();

        return {
          id: item.id || `item-${index}`,
          group: item.machine,
          content: `
            <div class="timeline-item ${item.type}-item">
              <div class="item-content">
                ${item.component || 'No Part'} (${item.quantity || 0})
              </div>
            </div>
          `,
          title: `
            <div class="tooltip-content">
              <div class="tooltip-header">${item.type === 'production' ? 'Production' : 'Scheduled'}</div>
              <div><strong>Part Number:</strong> ${item.component || 'N/A'}</div>
              <div><strong>Description:</strong> ${item.description || 'N/A'}</div>
              <div><strong>Quantity:</strong> ${item.quantity || 'N/A'}</div>
              <div><strong>PO:</strong> ${item.po || 'N/A'}</div>
              ${item.operator ? `<div><strong>Operator:</strong> ${item.operator}</div>` : ''}
              ${item.notes ? `<div><strong>Notes:</strong> ${item.notes}</div>` : ''}
              <div class="tooltip-time">
                <div><strong>Start:</strong> ${dayjs(item.start_time).format('YYYY-MM-DD HH:mm')}</div>
                <div><strong>End:</strong> ${dayjs(item.end_time).format('YYYY-MM-DD HH:mm')}</div>
              </div>
            </div>
          `,
          start: startTime,
          end: endTime,
          className: `${item.type}-item`
        };
      });

      const options = {
        stack: true,
        start: dateRange?.[0]?.toDate() || dayjs().startOf('day').toDate(),
        end: dateRange?.[1]?.toDate() || dayjs().endOf('day').toDate(),
        editable: false,
        margin: { item: { horizontal: 10, vertical: 7 } },
        horizontalScroll: true,
        verticalScroll: true,
        zoomKey: 'ctrlKey',
        height: '600px',
        orientation: 'top',
        timeAxis: { 
          scale: VIEW_MODES[viewMode].scale, 
          step: VIEW_MODES[viewMode].step 
        },
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap'
        }
      };

      timelineRef.current = new Timeline(containerRef.current, items, groups, options);

    } catch (error) {
      console.error('Error initializing timeline:', error);
    }
  }, [data, dateRange, viewMode]);

  const handleZoomIn = () => timelineRef.current?.zoomIn(0.5);
  const handleZoomOut = () => timelineRef.current?.zoomOut(0.5);
  const handleFit = () => timelineRef.current?.fit();

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
            
            <Radio.Group 
              value={viewMode} 
              onChange={handleViewModeChange}
              disabled={isLoading}
              className="mr-4"
            >
              {Object.entries(VIEW_MODES).map(([key, { label }]) => (
                <Radio.Button key={key} value={key}>{label}</Radio.Button>
              ))}
            </Radio.Group>

            <RangePicker
              value={dateRange}
              onChange={onDateChange}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              className="min-w-[300px]"
              allowClear={false}
              disabled={isLoading}
            />
            
            <Space>
              <Button 
                type="primary" 
                onClick={() => onSubmit(false)}
                loading={isLoading}
              >
                Submit
              </Button>
              <Button 
                onClick={() => onSubmit(true)}
                disabled={isLoading}
              >
                Get All Data
              </Button>
              <Button 
                onClick={onClear} 
                disabled={isLoading}
              >
                Reset
              </Button>
            </Space>
          </div>

          <Space>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded">
              <Badge color="#10B981" text="Production" />
              <Badge color="#3B82F6" text="Scheduled" />
            </div>
            
            <Tooltip title={autoRefresh ? `Auto Refresh: ${countdown}s` : "Start Auto Refresh"}>
              <Button 
                icon={autoRefresh ? <Pause size={16} /> : <Play size={16} />}
                onClick={toggleAutoRefresh}
                type={autoRefresh ? "primary" : "default"}
                disabled={isLoading}
              >
                {autoRefresh && (
                  <span className="ml-1">{countdown}s</span>
                )}
              </Button>
            </Tooltip>

            <Tooltip title="Zoom In">
              <Button icon={<ZoomIn size={16} />} onClick={handleZoomIn} disabled={isLoading} />
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button icon={<ZoomOut size={16} />} onClick={handleZoomOut} disabled={isLoading} />
            </Tooltip>
            <Tooltip title="Fit View">
              <Button icon={<Maximize size={16} />} onClick={handleFit} disabled={isLoading} />
            </Tooltip>
            <Tooltip title="Refresh Now">
              <Button icon={<RefreshCw size={16} />} onClick={() => onSubmit(false)} disabled={isLoading} />
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* Status bar for auto-refresh */}
      {autoRefresh && (
        <div className="auto-refresh-status">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${(countdown / 60) * 100}%`,
              transition: 'width 1s linear'
            }} 
          />
        </div>
      )}

      {error && (
        <Alert message="Error" description={error} type="error" showIcon className="m-4" />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Loading data..." />
        </div>
      ) : data.length > 0 ? (
        <div ref={containerRef} className="timeline-container" />
      ) : (
        <Empty description="No data available" className="py-20" />
      )}

      <style jsx global>{`
        .gantt-chart {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .vis-timeline {
          border: none !important;
          font-family: inherit !important;
        }

        .vis-item {
          border-radius: 4px !important;
          border: none !important;
        }

        .production-item {
          background-color: #10B981 !important;
          color: white !important;
          border-color: #059669 !important;
        }

        .scheduled-item {
          background-color: #3B82F6 !important;
          color: white !important;
          border-color: #2563EB !important;
        }

        .timeline-item {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 4px 8px;
        }

        .item-content {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .machine-group {
          padding: 8px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .machine-name {
          font-weight: 600;
          color: #374151;
        }

        .tooltip-content {
          background: white;
          border-radius: 6px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          font-size: 12px;
          line-height: 1.5;
          max-width: 300px;
        }

        .tooltip-header {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tooltip-time {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
          color: #6B7280;
        }

        .vis-time-axis .vis-grid.vis-minor {
          border-color: #f0f0f0;
        }

        .vis-time-axis .vis-grid.vis-major {
          border-color: #e0e0e0;
        }

        .vis-panel.vis-center {
          border-left: 1px solid #f0f0f0;
        }

        .vis-group {
          border-bottom: 1px solid #f0f0f0;
          background: #fafafa;
        }

        .ant-radio-group {
          background: white;
          padding: 1px;
          border-radius: 6px;
          border: 1px solid #d9d9d9;
        }

        .ant-radio-button-wrapper {
          padding: 0 12px;
          height: 32px;
          line-height: 30px;
        }

        .auto-refresh-status {
          height: 2px;
          background-color: #f0f0f0;
          position: relative;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background-color: #10B981;
          position: absolute;
          left: 0;
          top: 0;
        }

        .ant-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  );
};

export default SimpleGanttChart;