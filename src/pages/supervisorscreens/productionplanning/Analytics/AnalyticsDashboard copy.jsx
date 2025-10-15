
// Component Status Component
import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Table, Badge, Tabs, Button  } from 'antd';
import ReactECharts from 'echarts-for-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ReactEcharts from 'echarts-for-react';
import {
   SearchOutlined
  } from '@ant-design/icons';

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
  
// Lead Time Analysis Component
const LeadTimeAnalytics = () => {
  // Sample data structure for lead time analysis
  const leadTimeTrends = [
    { component: 'Component A', plannedLeadTime: 30, actualLeadTime: 35 },
    { component: 'Component B', plannedLeadTime: 45, actualLeadTime: 42 },
    { component: 'Component C', plannedLeadTime: 60, actualLeadTime: 75 },
    // Add more sample data as needed
  ];

  return (
    <Card title="Lead Time Comparison">
      <div className="h-96">
        <BarChart
          width={800}
          height={400}
          data={leadTimeTrends}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="component" />
          <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="plannedLeadTime" fill="#1890ff" name="Planned Lead Time" />
          <Bar dataKey="actualLeadTime" fill="#52c41a" name="Actual Lead Time" />
        </BarChart>
      </div>
    </Card>
  );
};

// Main Analytics Dashboard Component
const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://172.19.224.1:8002/api/v1/component_status/');
        const result = await response.json();
        setData(result);
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
        <TabPane tab="Component Status" key="componentStatus">
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
        </TabPane>
        <TabPane tab="Lead Time Analysis" key="leadTime">
          <LeadTimeAnalytics />
        </TabPane>
      </Tabs>

        
    </Card>
  );
};

export default AnalyticsDashboard;