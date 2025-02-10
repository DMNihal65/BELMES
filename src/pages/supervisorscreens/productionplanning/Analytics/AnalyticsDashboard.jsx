
// Component Status Component
import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Table, Badge, Tabs, Button  } from 'antd';
import ReactECharts from 'echarts-for-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ReactEcharts from 'echarts-for-react';
import {
   SearchOutlined
  } from '@ant-design/icons';
  import useScheduleStore from '../../../../store/schedule-store'; 

const { TabPane } = Tabs;

const ComponentStatusAnalytics = ({ data }) => {
    // Process data for visualization
    const components = data.delayed_complete.map(item => item.component);
    const delays = data.delayed_complete.map(item => {
      const match = item.delay.match(/(\d+)d/);
      return match ? parseInt(match[1]) : 0;
    });
    const quantities = data.delayed_complete.map(item => item.completed_quantity);
  
    // Calculate delay categories for each component
    const delayCategories = delays.map(delay => {
      if (delay > 500) return 'Critical Delay (>500 days)';
      if (delay > 180) return 'Severe Delay (181-500 days)';
      if (delay > 90) return 'Moderate Delay (91-180 days)';
      return 'Minor Delay (≤90 days)';
    });
  
    // Prepare data for scatter plot
    const scatterData = components.map((component, index) => ([
      delays[index],          // x: delay days
      quantities[index],      // y: quantity
      component,              // name
      delayCategories[index]  // category
    ]));
  
    const option = {
      title: {
        text: 'Component Delay Analysis',
        subtext: 'Bubble size represents quantity',
        left: 'center'
      },
      tooltip: {
        formatter: function(params) {
          return `Component: ${params.data[2]}<br/>` +
                 `Delay: ${params.data[0]} days<br/>` +
                 `Quantity: ${params.data[1]}<br/>` +
                 `Category: ${params.data[3]}`;
        }
      },
      xAxis: {
        type: 'value',
        name: 'Delay (Days)',
        nameLocation: 'middle',
        nameGap: 30,
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Quantity',
        nameLocation: 'middle',
        nameGap: 30,
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%'
      },
      series: [{
        type: 'scatter',
        symbolSize: function(data) {
          return Math.sqrt(data[1]) * 10; // Scale bubble size based on quantity
        },
        data: scatterData,
        itemStyle: {
          color: function(params) {
            // Color based on delay category
            const delay = params.data[0];
            if (delay > 500) return '#ff4d4f';      // Critical
            if (delay > 180) return '#ffa940';      // Severe
            if (delay > 90) return '#fadb14';       // Moderate
            return '#95de64';                       // Minor
          }
        },
        emphasis: {
          focus: 'series',
          label: {
            show: true,
            formatter: function(params) {
              return params.data[2];
            },
            position: 'top'
          }
        }
      }],
      legend: {
        data: ['Critical Delay (>500 days)', 'Severe Delay (181-500 days)', 
               'Moderate Delay (91-180 days)', 'Minor Delay (≤90 days)'],
        top: '5%',
        type: 'scroll'
      }
    };
  
    return (
      <div className="w-full h-[700px] p-4">
        <ReactEcharts 
          option={option}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    );
  };

  const parseDelayDays = (delay) => {
    const match = delay.match(/(\d+)d/);
    return match ? parseInt(match[1]) : 0;
  };

  const getStatusColor = (delay) => {
    const days = parseDelayDays(delay);
    if (days > 180) return 'bg-red-100 text-red-800';
    if (days > 90) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };


  const columns = [
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
      className: 'font-medium',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            autoFocus
            placeholder="Search Component"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Button
            type="link"
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: '100%' }}
          >
            Clear
          </Button>
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: '100%' }}
          >
            Filter
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value, record) => {
        // The filter works by matching the 'component' field with the search value
        return record.component.toLowerCase().includes(value.toLowerCase());
      },
      filters: [], // No static filters here, dynamic filtering will happen in the search input
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Badge className={`px-2 py-1 rounded-full ${getStatusColor(record.delay)}`}>
          Delayed ({record.delay})
        </Badge>
      ),
      filters: [
        { text: 'Critical Delay', value: 'Critical Delay' },
        { text: 'Severe Delay', value: 'Severe Delay' },
        { text: 'Moderate Delay', value: 'Moderate Delay' },
        { text: 'Minor Delay', value: 'Minor Delay' },
      ],
      onFilter: (value, record) => {
        const days = parseDelayDays(record.delay);
        if (value === 'Critical Delay') return days > 500;
        if (value === 'Severe Delay') return days > 180 && days <= 500;
        if (value === 'Moderate Delay') return days > 90 && days <= 180;
        return days <= 90;
      },
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => `${record.completed_quantity}/${record.total_quantity}`,
    },
    {
      title: 'Scheduled End',
      dataIndex: 'scheduled_end_time',
      key: 'scheduled_end_time',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.scheduled_end_time) - new Date(b.scheduled_end_time),
    },
    {
      title: 'Lead Time',
      dataIndex: 'lead_time',
      key: 'lead_time',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.lead_time) - new Date(b.lead_time),
    },
  ];

 const LeadTimeAnalytics = () => {
  const { 
    leadTimeData, 
    leadTimeLoading, 
    leadTimeError, 
    fetchLeadTimeData 
  } = useScheduleStore();

  useEffect(() => {
    fetchLeadTimeData();
  }, [fetchLeadTimeData]);

  if (leadTimeLoading) return <div className="p-4">Loading Lead Time Data...</div>;
  if (leadTimeError) return <div className="p-4 text-red-500">Error: {leadTimeError}</div>;

  const getOption = () => {
    const components = leadTimeData.map(item => item.component);
    const leadTimes = leadTimeData.map(item => item.leadTime);
    const scheduledEndTimes = leadTimeData.map(item => item.scheduledEndTime);

    
    return {
      title: {
        text: 'Lead Time and Scheduled End Time Graph'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          const component = params[0].axisValue;
          const scheduledEnd = new Date(params[0].data).toLocaleString();
          const leadTime = new Date(params[1].data).toLocaleString();
          const componentData = leadTimeData.find(item => item.component === component);
          
          // Format the delay value - show 0 if null
          const delay = componentData.delay === null ? '0' : componentData.delay;
          return `Component: ${component}<br/>` +
                 `Scheduled End Time: ${scheduledEnd}<br/>` +
                 `Lead Time: ${leadTime}<br/>` +
                 `On Time: ${componentData.onTime ? 'Yes' : 'No'}<br/>` +
                 `Completed Quantity: ${componentData.completed_quantity}<br/>` +
                 `Total Quantity: ${componentData.total_quantity}<br/>` +
                 `Lead Time Provided: ${componentData.lead_time_provided ? 'Yes' : 'No'}<br/>` +
                 `Delay: ${delay}`;
        }
      },
      legend: {
        data: ['Scheduled End Time', 'Lead Time']
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: components,
        axisLabel: {
          interval: 0,
          rotate: 45,
          formatter: (value) => {
            return value.length > 15 ? value.substring(0, 15) + '...' : value;
          },
          textStyle: {
            fontSize: 10
          }
        }
      },
      yAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value) => new Date(value).toLocaleDateString()
        }
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          name: 'Scheduled End Time',
          type: 'bar',
          data: scheduledEndTimes,
          itemStyle: {
            color: '#7ef1a1' // Pink for bars
          }
        },
        {
          name: 'Lead Time',
          type: 'line',
          data: leadTimes,
          lineStyle: {
            color: '#4169E1' // Blue for line
          },
          itemStyle: {
            color: '#4169E1' // Blue for line points
          }
        },
      ]
    };
  };

  return (
    <div className="w-full h-[700px] p-4">
      <ReactECharts
        option={getOption()}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

const ScheduleDetails = ({ data }) => {
  // Transform data for visualization
  const machines = Object.keys(data.machine_schedules);
  
  // Create series data for each machine
  const series = machines.map(machine => ({
    name: machine,
    type: 'bar',
    stack: 'total',
    emphasis: {
      focus: 'series'
    },
    data: data.machine_schedules[machine].map(schedule => ({
      name: schedule.part_number,
      value: schedule.duration_minutes,
      itemStyle: {
        borderRadius: [4, 4, 4, 4]
      },
      // Store additional data for tooltip
      schedule: schedule
    }))
  }));

  const option = {
    title: {
      text: 'Machine Schedule Overview',
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const schedule = params.data.schedule;
        return `
          <div style="padding: 3px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${params.seriesName}</div>
            <div>Part: ${schedule.part_number}</div>
            <div>Operation: ${schedule.operation}</div>
            <div>Start: ${new Date(schedule.start_time).toLocaleString()}</div>
            <div>End: ${new Date(schedule.end_time).toLocaleString()}</div>
            <div>Duration: ${Math.round(schedule.duration_minutes)} minutes</div>
          </div>
        `;
      }
    },
    legend: {
      data: machines,
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: 80
    },
    xAxis: {
      type: 'value',
      name: 'Duration (minutes)',
      axisLabel: {
        formatter: '{value} min'
      }
    },
    yAxis: {
      type: 'category',
      data: ['Schedule'],
      axisLabel: {
        show: false
      }
    },
    series: series,
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100
      }
    ]
  };

  return (
    <div className="space-y-4">
      
      {/* Add a detailed table view */}
      <div className="overflow-x-auto">
        <Table
          dataSource={machines.flatMap(machine => 
            data.machine_schedules[machine].map(schedule => ({
              ...schedule,
              machine: machine,
              key: `${machine}-${schedule.part_number}-${schedule.start_time}`
            }))
          )}
          columns={[
            {
              title: 'Machine',
              dataIndex: 'machine',
              key: 'machine',
              filters: machines.map(m => ({ text: m, value: m })),
              onFilter: (value, record) => record.machine === value,
            },
            {
              title: 'Part Number',
              dataIndex: 'part_number',
              key: 'part_number',
              sorter: (a, b) => a.part_number.localeCompare(b.part_number)
            },
            {
              title: 'Operation',
              dataIndex: 'operation',
              key: 'operation',
              ellipsis: true
            },
            {
              title: 'Start Time',
              dataIndex: 'start_time',
              key: 'start_time',
              render: (text) => new Date(text).toLocaleString(),
              sorter: (a, b) => new Date(a.start_time) - new Date(b.start_time)
            },
            {
              title: 'End Time',
              dataIndex: 'end_time',
              key: 'end_time',
              render: (text) => new Date(text).toLocaleString(),
              sorter: (a, b) => new Date(a.end_time) - new Date(b.end_time)
            },
            {
              title: 'Duration (min)',
              dataIndex: 'duration_minutes',
              key: 'duration_minutes',
              render: (value) => Math.round(value),
              sorter: (a, b) => a.duration_minutes - b.duration_minutes
            }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

// Main Analytics Dashboard Component
const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [componentResponse, scheduleResponse] = await Promise.all([
          fetch('http://172.18.7.88:7721/component_status/'),
          fetch('http://172.18.7.88:7721/operations/machine_schedules/')
        ]);
        
        const componentResult = await componentResponse.json();
        const scheduleResult = await scheduleResponse.json();
        
        setData(componentResult);
        setScheduleData(scheduleResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <Card className="mt-4">
      <Tabs defaultActiveKey="componentStatus">
        {/* <TabPane tab="Component Status" key="componentStatus">
          <ComponentStatusAnalytics data={data} />
          <div>
          <h3 className="text-xl font-semibold mb-4">Delayed Components Detail</h3>
          <Table
            columns={columns}
            dataSource={data.delayed_complete}
            pagination={{ pageSize: 5 }}
            rowKey="component"
            
          />
        </div>
        </TabPane> */}
        <TabPane tab="Delivery Date Analysis" key="leadTime">
          <LeadTimeAnalytics  />
        </TabPane>
        <TabPane tab="Schedule Details" key="scheduleDetails">
          <ScheduleDetails data={scheduleData} />
        </TabPane>
      </Tabs>

        
    </Card>
  );
};

export default AnalyticsDashboard;