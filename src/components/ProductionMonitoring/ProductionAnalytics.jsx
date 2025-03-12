import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Tabs, 
  DatePicker, 
  Spin, 
  Alert, 
  Empty, 
  Switch, 
  Select, 
  Tooltip, 
  Radio, 
  Button,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd';
import { ReloadOutlined, FullscreenOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import useProductionStore from '../../stores/productionStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// Status colors matching the store definition
const statusColors = {
  'RUNNING': '#52c41a',
  'IDLE': '#faad14',
  'STOPPED': '#ff4d4f',
  'MAINTENANCE': '#1890ff',
  'OFFLINE': '#d9d9d9',
  // Add legacy status mappings for backward compatibility
  'PRODUCTION': '#52c41a',
  'ON': '#1890ff',
  'OFF': '#ff4d4f'
};

// Custom title component with info tooltip
const TabTitle = ({ icon, title, tooltip }) => (
  <span className="flex items-center gap-2">
    {icon}
    {title}
    {tooltip && (
      <Tooltip title={tooltip}>
        <InfoCircleOutlined style={{ cursor: 'pointer' }} />
      </Tooltip>
    )}
  </span>
);

function ProductionAnalytics() {
  const {
    analyticsData,
    fetchMachineStatusTimeline,
    fetchDailyProduction,
    setAnalyticsDateRange
  } = useProductionStore();

  const [activeTab, setActiveTab] = useState('1');
  const [chartInstance, setChartInstance] = useState(null);
  const [timelineView, setTimelineView] = useState('timeline'); // 'timeline', 'percentage', or 'hours'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [timelineGrouping, setTimelineGrouping] = useState('machine'); // 'machine' or 'date'

  useEffect(() => {
    // Initial data fetch
    const [startDate, endDate] = analyticsData.dateRange;
    fetchMachineStatusTimeline(startDate, endDate);
    fetchDailyProduction(startDate, endDate);
  }, []);

  // Update available machines list for filtering
  useEffect(() => {
    if (analyticsData.timelineData?.machines?.length > 0 && selectedMachines.length === 0) {
      setSelectedMachines(analyticsData.timelineData.machines.map(m => m.name));
    } else if (analyticsData.machineTimelines?.length > 0 && selectedMachines.length === 0) {
      setSelectedMachines(analyticsData.machineTimelines.map(m => m.machine_name));
    }
  }, [analyticsData.timelineData, analyticsData.machineTimelines]);

  const handleDateRangeChange = (range) => {
    if (range) {
      setAnalyticsDateRange(range);
    }
  };

  const refreshData = () => {
    const [startDate, endDate] = analyticsData.dateRange;
    fetchMachineStatusTimeline(startDate, endDate);
    fetchDailyProduction(startDate, endDate);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('analytics-container').requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
    }
  };

  const downloadChart = () => {
    if (chartInstance) {
      const base64 = chartInstance.getDataURL();
      const a = document.createElement('a');
      a.href = base64;
      a.download = `production-analytics-${activeTab === '1' ? 'timeline' : 'daily'}-${dayjs().format('YYYY-MM-DD')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleMachineFilter = (values) => {
    setSelectedMachines(values);
  };

  // Filter machine timelines based on selected machines
  const getFilteredMachineTimelines = () => {
    if (!analyticsData.machineTimelines) return [];
    return analyticsData.machineTimelines.filter(m => 
      selectedMachines.includes(m.machine_name)
    );
  };
  
  // Determine which view to display
  const getTimelineDisplayMode = () => {
    if (timelineView === 'timeline' && analyticsData.timelineData?.timeline_data?.length > 0) {
      return 'timeline';
    } else if (analyticsData.machineTimelines?.length > 0) {
      return timelineView; // 'percentage' or 'hours'
    } else if (analyticsData.timelineData?.timeline_data?.length > 0) {
      return 'timeline'; // Fallback to timeline if only this data is available
    }
    return 'empty'; // No data available
  };

  // Calculate summary statistics for the status timeline (from either data format)
  const calculateStatusSummary = () => {
    // For the legacy data format
    if (analyticsData.machineTimelines?.length > 0) {
      const timelines = getFilteredMachineTimelines();
      if (!timelines.length) return {};
      
      const summary = {};
      const statuses = Object.keys(statusColors);
      
      for (const status of statuses) {
        let totalPercent = 0;
        let totalHours = 0;
        let count = 0;
        
        for (const machine of timelines) {
          if (machine.status_distribution && machine.status_distribution[status] !== undefined) {
            totalPercent += machine.status_distribution[status];
            totalHours += (machine.status_hours ? (machine.status_hours[status] || 0) : 0);
            count++;
          }
        }
        
        if (count > 0) {
          summary[status] = {
            avgPercent: Math.round((totalPercent / count) * 10) / 10,
            totalHours: Math.round(totalHours * 10) / 10
          };
        }
      }
      
      return summary;
    } 
    // For the new timeline data format
    else if (analyticsData.timelineData?.timeline_data?.length > 0) {
      const timelineData = analyticsData.timelineData;
      const filteredTimelineData = timelineData.timeline_data.filter(item => 
        selectedMachines.includes(item.machine_name)
      );
      
      if (!filteredTimelineData.length) return {};
      
      // Calculate total duration of the time range
      const startTime = new Date(timelineData.time_range.start);
      const endTime = new Date(timelineData.time_range.end);
      const totalRangeHours = (endTime - startTime) / (1000 * 60 * 60);
      
      // Group data by status
      const statusSummary = {};
      
      for (const item of filteredTimelineData) {
        const status = item.status;
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        const duration = (end - start) / (1000 * 60 * 60);
        
        if (!statusSummary[status]) {
          statusSummary[status] = { totalHours: 0, machines: new Set() };
        }
        
        statusSummary[status].totalHours += duration;
        statusSummary[status].machines.add(item.machine_id);
      }
      
      // Calculate percentages
      const uniqueMachines = new Set(filteredTimelineData.map(item => item.machine_id));
      const machineCount = uniqueMachines.size;
      
      const summary = {};
      for (const [status, data] of Object.entries(statusSummary)) {
        const avgHoursPerMachine = data.totalHours / data.machines.size;
        const avgPercent = (avgHoursPerMachine / totalRangeHours) * 100;
        
        summary[status] = {
          avgPercent: Math.round(avgPercent * 10) / 10,
          totalHours: Math.round(data.totalHours * 10) / 10
        };
      }
      
      return summary;
    }
    
    return {};
  };
  
  // Get options for the status distribution chart (percentage or hours)
  const getStatusDistributionOptions = (mode) => {
    const timelines = getFilteredMachineTimelines();
    
    // If there's no data, return empty options
    if (!timelines || timelines.length === 0) {
      return {
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center'
        }
      };
    }
    
    // Get all statuses that have data
    const allStatuses = new Set();
    timelines.forEach(machine => {
      Object.keys(machine.status_distribution || {}).forEach(status => {
        allStatuses.add(status);
      });
    });
    
    // Convert Set to Array and sort so statuses appear in consistent order
    const statuses = Array.from(allStatuses).sort();
    
    // For percentage view
    if (mode === 'percentage') {
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            let tooltip = `<div style="font-weight:bold">${params[0].name}</div>`;
            
            params.forEach(param => {
              tooltip += `<div style="display:flex;align-items:center;margin:5px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:5px;"></span>
                <span>${param.seriesName}: ${param.value.toFixed(1)}%</span>
              </div>`;
            });
            
            return tooltip;
          }
        },
        legend: {
          data: statuses,
          bottom: 10,
          icon: 'circle',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: {
            fontSize: 12
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Distribution (%)',
          nameLocation: 'middle',
          nameGap: 30,
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        yAxis: {
          type: 'category',
          data: timelines.map(m => m.machine_name),
          axisLabel: {
            formatter: (value) => {
              // Truncate long machine names
              return value.length > 15 ? value.substring(0, 15) + '...' : value;
            },
            tooltip: {
              show: true
            }
          }
        },
        series: statuses.map(status => ({
          name: status,
          type: 'bar',
          stack: 'total',
          label: {
            show: true,
            formatter: (params) => {
              return params.value > 5 ? `${params.value.toFixed(1)}%` : '';
            },
            position: 'inside'
          },
          data: timelines.map(machine => 
            machine.status_distribution[status] !== undefined ? 
            machine.status_distribution[status] : 0
          ),
          itemStyle: {
            color: statusColors[status] || '#8884d8' // Default color if not defined
          }
        }))
      };
    } 
    // For hours view
    else {
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            let tooltip = `<div style="font-weight:bold">${params[0].name}</div>`;
            
            let total = 0;
            params.forEach(param => {
              total += param.value || 0;
              tooltip += `<div style="display:flex;align-items:center;margin:5px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:5px;"></span>
                <span>${param.seriesName}: ${param.value ? param.value.toFixed(1) : 0} hrs</span>
              </div>`;
            });
            
            tooltip += `<div style="margin-top:5px;font-weight:bold">Total: ${total.toFixed(1)} hrs</div>`;
            
            return tooltip;
          }
        },
        legend: {
          data: statuses,
          bottom: 10,
          icon: 'circle',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: {
            fontSize: 12
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Hours',
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: {
            formatter: '{value} hrs'
          }
        },
        yAxis: {
          type: 'category',
          data: timelines.map(m => m.machine_name),
          axisLabel: {
            formatter: (value) => {
              // Truncate long machine names
              return value.length > 15 ? value.substring(0, 15) + '...' : value;
            },
            tooltip: {
              show: true
            }
          }
        },
        series: statuses.map(status => ({
          name: status,
          type: 'bar',
          stack: 'total',
          label: {
            show: true,
            formatter: (params) => {
              return params.value > 2 ? `${params.value.toFixed(1)}` : '';
            },
            position: 'inside'
          },
          data: timelines.map(machine => 
            machine.status_hours && machine.status_hours[status] !== undefined ? 
            machine.status_hours[status] : 0
          ),
          itemStyle: {
            color: statusColors[status] || '#8884d8' // Default color if not defined
          }
        }))
      };
    }
  };

  const getMachineTimelineOptions = () => {
    // For the new timeline view, we need to work with the new data format
    const timelineData = analyticsData.timelineData || { machines: [], timeline_data: [] };
    
    // If there's no data, return empty options
    if (!timelineData.timeline_data || timelineData.timeline_data.length === 0) {
      return {
        title: {
          text: 'No timeline data available',
          left: 'center',
          top: 'center'
        }
      };
    }
    
    // Extract all unique machine names that are selected by the user
    const filteredMachines = selectedMachines.length > 0 ? 
      timelineData.machines.filter(m => selectedMachines.includes(m.name)) : 
      timelineData.machines;
    
    if (filteredMachines.length === 0) {
      return {
        title: {
          text: 'No machines selected',
          left: 'center',
          top: 'center'
        }
      };
    }
    
    // Filter timeline data to only include selected machines
    const filteredTimelineData = timelineData.timeline_data.filter(
      item => filteredMachines.some(m => m.id === item.machine_id)
    );
    
    // Get all unique statuses
    const allStatuses = new Set(filteredTimelineData.map(item => item.status));
    const statuses = Array.from(allStatuses).sort();
    
    // Parse the time range from the data
    const timeRange = timelineData.time_range || {
      start: filteredTimelineData.length > 0 ? 
        filteredTimelineData.reduce((min, item) => 
          item.start_time < min ? item.start_time : min, filteredTimelineData[0].start_time) : 
        null,
      end: filteredTimelineData.length > 0 ? 
        filteredTimelineData.reduce((max, item) => 
          item.end_time > max ? item.end_time : max, filteredTimelineData[0].end_time) : 
        null
    };
    
    // Prepare the data for ECharts
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const { data } = params;
          return `
            <div style="font-weight:bold">${data.machine_name}</div>
            <div>Status: <span style="color:${statusColors[data.status] || '#8884d8'}">${data.status}</span></div>
            <div>Start: ${dayjs(data.start_time).format('MMM D, YYYY HH:mm')}</div>
            <div>End: ${dayjs(data.end_time).format('MMM D, YYYY HH:mm')}</div>
            <div>Duration: ${dayjs(data.end_time).diff(dayjs(data.start_time), 'hour', true).toFixed(1)} hrs</div>
            ${data.program ? `<div>Program: ${data.program}</div>` : ''}
          `;
        }
      },
      legend: {
        data: statuses,
        bottom: 10,
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        min: timeRange.start,
        max: timeRange.end,
        axisLabel: {
          formatter: '{yyyy}-{MM}-{dd} {HH}:{mm}',
          rotate: 45
        }
      },
      yAxis: {
        type: 'category',
        data: filteredMachines.map(m => m.name),
        axisLabel: {
          formatter: (value) => {
            // Truncate long machine names
            return value.length > 15 ? value.substring(0, 15) + '...' : value;
          },
          tooltip: {
            show: true
          }
        }
      },
      series: [
        {
          type: 'custom',
          renderItem: (params, api) => {
            const categoryIndex = api.value(0);
            const start = api.coord([api.value(1), categoryIndex]);
            const end = api.coord([api.value(2), categoryIndex]);
            const height = api.size([0, 1])[1] * 0.6;
            const width = end[0] - start[0];
            
            const status = api.value(3);
            const color = statusColors[status] || '#8884d8';
            
            // Only render if width is positive (valid time range)
            if (width < 1) return;
            
            return {
              type: 'rect',
              shape: {
                x: start[0],
                y: start[1] - height / 2,
                width: width,
                height: height
              },
              style: {
                fill: color,
                stroke: '#fff',
                lineWidth: 1
              }
            };
          },
          encode: {
            x: [1, 2], // start_time, end_time
            y: 0,      // machine index
          },
          data: filteredTimelineData.map(item => {
            const machineIndex = filteredMachines.findIndex(m => m.id === item.machine_id);
            return [
              machineIndex, 
              item.start_time,
              item.end_time,
              item.status,
              item.machine_name,
              item.program
            ];
          })
        }
      ]
    };
  };

  const getDailyProductionOptions = () => {
    const dailyData = analyticsData.dailyProduction || [];
    
    if (!dailyData || dailyData.length === 0) {
      return {
        title: {
          text: 'No daily production data available',
          left: 'center',
          top: 'center'
        }
      };
    }
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Total Parts', 'Target Parts'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dailyData.map(day => day.date),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: 'Parts Count',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: [
        {
          name: 'Total Parts',
          type: 'bar',
          data: dailyData.map(day => day.total_parts),
          itemStyle: {
            color: '#1890ff'
          }
        },
        {
          name: 'Target Parts',
          type: 'line',
          data: dailyData.map(day => day.target_parts),
          itemStyle: {
            color: '#ff4d4f'
          },
          lineStyle: {
            type: 'dashed'
          },
          symbol: 'circle',
          symbolSize: 6
        }
      ]
    };
  };

  // Render status summary statistics
  const renderStatusSummary = () => {
    const summary = calculateStatusSummary();
    const statuses = Object.keys(summary);
    
    if (statuses.length === 0) return null;

  return (
      <div className="mb-6">
        <Divider orientation="left">Status Summary</Divider>
        <Row gutter={[16, 16]}>
          {statuses.map(status => (
            <Col xs={12} sm={8} md={6} lg={4} key={status}>
              <Card size="small" style={{ textAlign: 'center', borderTop: `2px solid ${statusColors[status] || '#8884d8'}` }}>
                <Statistic 
                  title={status}
                  value={timelineView === 'percentage' ? summary[status].avgPercent : summary[status].totalHours}
                  suffix={timelineView === 'percentage' ? '%' : ' hrs'}
                  precision={1}
                  valueStyle={{ color: statusColors[status] || '#8884d8' }}
                />
            </Card>
          </Col>
          ))}
        </Row>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6" id="analytics-container">
      <Card className="shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold m-0">Production Analytics</h1>
          
          <div className="flex flex-wrap gap-2 items-center">
            <RangePicker
              value={analyticsData.dateRange}
              onChange={handleDateRangeChange}
              className="w-full sm:w-auto"
              allowClear={false}
            />
            
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              loading={analyticsData.isLoading}
              title="Refresh data"
            />
            
            <Button
              icon={<FullscreenOutlined />}
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
            />
            
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadChart}
              disabled={!chartInstance}
              title="Download chart as image"
            />
          </div>
        </div>

        {analyticsData.error && (
          <Alert
            message="Error"
            description={analyticsData.error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="analytics-tabs"
        >
          <Tabs.TabPane 
            tab={
              <TabTitle 
                icon={<i className="fas fa-chart-bar mr-1" />}
                title="Machine Status Timeline" 
                tooltip="View machine status distribution over the selected period"
              />
            } 
            key="1"
          >
            {analyticsData.isLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Spin size="large" />
              </div>
            ) : (analyticsData.machineTimelines?.length > 0 || analyticsData.timelineData?.timeline_data?.length > 0) ? (
              <>
                <div className="flex flex-wrap gap-4 mb-4 items-center">
                  <div className="flex items-center gap-2">
                    <span>View:</span>
                    <Radio.Group 
                      value={timelineView} 
                      onChange={(e) => setTimelineView(e.target.value)}
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="timeline">Timeline</Radio.Button>
                      <Radio.Button value="percentage">Percentage</Radio.Button>
                      <Radio.Button value="hours">Hours</Radio.Button>
                    </Radio.Group>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>Machines:</span>
                    <Select
                      mode="multiple"
                      allowClear
                      style={{ minWidth: 200 }}
                      placeholder="Select machines"
                      value={selectedMachines}
                      onChange={handleMachineFilter}
                      maxTagCount="responsive"
                      options={analyticsData.timelineData?.machines?.map(machine => ({
                        label: machine.name,
                        value: machine.name
                      })) || analyticsData.machineTimelines?.map(machine => ({
                        label: machine.machine_name,
                        value: machine.machine_name
                      })) || []}
                    />
                  </div>
                </div>
                
                {getTimelineDisplayMode() !== 'timeline' && renderStatusSummary()}
                
                <ReactECharts
                  option={
                    getTimelineDisplayMode() === 'timeline' ? 
                      getMachineTimelineOptions() : 
                      getTimelineDisplayMode() === 'percentage' ? 
                        getStatusDistributionOptions('percentage') : 
                        getTimelineDisplayMode() === 'hours' ? 
                          getStatusDistributionOptions('hours') : 
                          { title: { text: 'No data available', left: 'center', top: 'center' } }
                  }
                  style={{ height: '500px', width: '100%' }}
                  onChartReady={instance => setChartInstance(instance)}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </>
            ) : (
              <Empty description="No machine timeline data available" />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <TabTitle 
                icon={<i className="fas fa-chart-line mr-1" />}
                title="Daily Production" 
                tooltip="View daily production metrics over time"
              />
            } 
            key="2"
          >
            {analyticsData.isLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Spin size="large" />
              </div>
            ) : analyticsData.dailyProduction?.length > 0 ? (
              <ReactECharts
                option={getDailyProductionOptions()}
                style={{ height: '500px', width: '100%' }}
                onChartReady={instance => setChartInstance(instance)}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <Empty description="No daily production data available" />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default ProductionAnalytics; 