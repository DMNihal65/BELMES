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
    case 'month': return 'day';
    case 'week': return 'hour';
    default: return 'minute';
  }
};

const getTimeAxisStep = (viewType) => {
  switch (viewType) {
    case 'month': return 1;
    case 'week': return 6;
    default: return 30;
  }
};

const getDurationByViewType = (viewType) => {
  switch (viewType) { 
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
  const hours = duration / (1000 * 60 * 60);
  if (hours <= 24) return 'day';
  if (hours <= 168) return 'week';
  return 'month';
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

const ComponentLegend = ({ componentColors }) => {
  return (
    <div className="component-legend">
      <div className="legend-title">Components</div>
      <div className="legend-items">
        {Object.entries(componentColors).map(([component, colors]) => (
          <div key={component} className="legend-item">
            <span 
              className="color-box" 
              style={{ backgroundColor: colors.backgroundColor }}
            />
            <span className="component-name">{component}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .component-legend {
          margin-top: 16px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .legend-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .color-box {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        .component-name {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

const Scheduling = () => {
  const [form] = Form.useForm();
  const { 
    scheduleData, 
    loading, 
    error, 
    fetchScheduleData,
    setViewMode,
    setDateRange,
    viewMode,
    dateRange,
    filterScheduleByMachines,
    filterScheduleByDateRange,
    getMachineUtilization,
    conflicts
  } = useScheduleStore();

  const [selectedMachines, setSelectedMachines] = useState([]);
  const [timelineData, setTimelineData] = useState(null);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [scheduleView, setScheduleView] = useState('timeline');
  const [filteredData, setFilteredData] = useState(null);
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const [viewType, setViewType] = useState('day');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCompleted, setShowCompleted] = useState(true);
  const [componentColors, setComponentColors] = useState(null);
  const styleElementRef = useRef(null);

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
        
        if (dateRange && dateRange[0] && dateRange[1]) {
          operations = operations.filter(op => {
            const opStart = new Date(op.start_time);
            const opEnd = new Date(op.end_time);
            return opStart >= dateRange[0] && opEnd <= dateRange[1];
          });
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
                <div class="item-desc">${op.description}</div>
                <div class="item-qty">${op.quantity}</div>
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
        const groups = new DataSet(
          [...new Set(operations.map(op => op.machine))].map(machine => ({
            id: machine,
            content: machine
          }))
        );

        // Get time range based on view type
        const timeRange = getTimeRange(viewType, dateRange);

        // Configure options
        const options = {
          stack: false,
          horizontalScroll: true,
          zoomKey: 'ctrlKey',
          orientation: 'top',
          height: '450px',
          margin: {
            item: { horizontal: 10, vertical: 5 },
            axis: 5
          },
          start: timeRange.start,
          end: timeRange.end,
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
                    <span class="component">${op.component}</span>
                    <span class="machine">${op.machine}</span>
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
            step: getTimeAxisStep(viewType)
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
        setTimeout(() => {
          if (timelineRef.current) {
            timelineRef.current.fit();
          }
        }, 100);

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
  }, [scheduleData, selectedMachines, dateRange, viewType]);

  // Helper function to get operation class name
  const getOperationClassName = (operation, status) => {
    if (!status) return 'timeline-item-normal';
    if (status.on_time) return 'timeline-item-ontime';
    return new Date(operation.end_time) > new Date(status.lead_time) 
      ? 'timeline-item-delayed' 
      : 'timeline-item-warning';
  };

  // Get unique machines from schedule data
  const availableMachines = React.useMemo(() => {
    if (!scheduleData) return [];
    return [...new Set(scheduleData.scheduled_operations.map(op => op.machine))];
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
      
      setFilteredData(filtered);
    }
  }, [scheduleData, selectedMachines, dateRange]);

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

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-8">
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
                    onChange={setViewType}
                    style={{ width: 120 }}
                  >
                    <Option value="day">Daily</Option>
                    <Option value="week">Weekly</Option>
                    <Option value="month">Monthly</Option>
                  </Select>
                </Space>
                <Space>
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
                      <Option key={machine} value={machine}>{machine}</Option>
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
                    onClick={fetchScheduleData}
                  >
                    Refresh
                  </Button>
                </Space>
              </div>

              <div 
                ref={timelineContainerRef} 
                className="schedule-timeline"
                style={{ 
                  height: '500px',
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              />
              {scheduleData && componentColors && (
                <ComponentLegend componentColors={componentColors} />
              )}

              <style jsx global>
                {Object.entries(timelineStyles).map(([selector, styles]) => `
                  ${selector} {
                    ${Object.entries(styles).map(([prop, value]) => `${prop}: ${value};`).join('\n')}
                  }
                `).join('\n')}
              </style>

              {/* Machine Status Cards */}
              <Row gutter={[16, 16]} className="mt-6">
                {availableMachines.map(machine => (
                  <Col span={8} key={machine}>
                    <MachineStatusCard
                      machine={machine}
                      operations={scheduleData.scheduled_operations.filter(op => op.machine === machine)}
                      componentStatus={scheduleData.component_status}
                    />
                  </Col>
                ))}
              </Row>
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
const MachineStatusCard = ({ machine, operations, componentStatus }) => {
  const currentOperation = operations.find(op => 
    new Date(op.start_time) <= new Date() && 
    new Date(op.end_time) >= new Date()
  );
  const status = currentOperation ? 'running' : 'idle';
  
  return (
    <Card 
      size="small" 
      className={`hover:shadow-md transition-shadow border-l-4 ${
        status === 'running' ? 'border-green-500' : 'border-yellow-500'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{machine}</div>
          <div className="text-sm text-gray-500">
            {currentOperation ? `Processing: ${currentOperation.component}` : 'No active operation'}
          </div>
        </div>
        <Badge 
          status={status === 'running' ? 'success' : 'warning'} 
          text={status.toUpperCase()}
        />
      </div>
      
      {currentOperation && componentStatus && (
        <div className="mt-2">
          <div className="text-sm flex justify-between">
            <span>{currentOperation.description}</span>
            <Tag color={componentStatus.on_time ? 'success' : 'error'}>
              {Math.round((componentStatus.completed_quantity / componentStatus.total_quantity) * 100)}%
            </Tag>
          </div>
          <Progress 
            percent={Math.round((componentStatus.completed_quantity / componentStatus.total_quantity) * 100)}
            size="small"
            status={componentStatus.on_time ? 'success' : 'exception'}
          />
        </div>
      )}
    </Card>
  );
};

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
const getTimeRange = (viewType, dateRange) => {
  if (dateRange && dateRange[0] && dateRange[1]) {
    return {
      start: dateRange[0].toDate(),
      end: dateRange[1].toDate()
    };
  }

  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (viewType) {
    case 'month':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - start.getDay());
      end.setDate(end.getDate() + (6 - end.getDay()));
      break;
    default: // day
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

export default Scheduling;
