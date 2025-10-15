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
import ProductionStatus from '../ProductionStatus/ProductionStatus';

const { TabPane } = Tabs;

// const ComponentStatusAnalytics = ({ data }) => {
//     // Process data for visualization
//     const components = data.delayed_complete.map(item => item.component);
//     const delays = data.delayed_complete.map(item => {
//       const match = item.delay.match(/(\d+)d/);
//       return match ? parseInt(match[1]) : 0;
//     });
//     const quantities = data.delayed_complete.map(item => item.completed_quantity);
  
//     // Calculate delay categories for each component
//     const delayCategories = delays.map(delay => {
//       if (delay > 500) return 'Critical Delay (>500 days)';
//       if (delay > 180) return 'Severe Delay (181-500 days)';
//       if (delay > 90) return 'Moderate Delay (91-180 days)';
//       return 'Minor Delay (≤90 days)';
//     });
  
//     // Prepare data for scatter plot
//     const scatterData = components.map((component, index) => ([
//       delays[index],          // x: delay days
//       quantities[index],      // y: quantity
//       component,              // name
//       delayCategories[index]  // category
//     ]));
  
//     const option = {
//       title: {
//         text: 'Component Delay Analysis',
//         subtext: 'Bubble size represents quantity',
//         left: 'center'
//       },
//       tooltip: {
//         formatter: function(params) {
//           return `Component: ${params.data[2]}<br/>` +
//                  `Delay: ${params.data[0]} days<br/>` +
//                  `Quantity: ${params.data[1]}<br/>` +
//                  `Category: ${params.data[3]}`;
//         }
//       },
//       xAxis: {
//         type: 'value',
//         name: 'Delay (Days)',
//         nameLocation: 'middle',
//         nameGap: 30,
//         splitLine: {
//           show: true,
//           lineStyle: {
//             type: 'dashed'
//           }
//         }
//       },
//       yAxis: {
//         type: 'value',
//         name: 'Quantity',
//         nameLocation: 'middle',
//         nameGap: 30,
//         splitLine: {
//           show: true,
//           lineStyle: {
//             type: 'dashed'
//           }
//         }
//       },
//       grid: {
//         left: '10%',
//         right: '10%',
//         top: '15%',
//         bottom: '15%'
//       },
//       series: [{
//         type: 'scatter',
//         symbolSize: function(data) {
//           return Math.sqrt(data[1]) * 10; // Scale bubble size based on quantity
//         },
//         data: scatterData,
//         itemStyle: {
//           color: function(params) {
//             // Color based on delay category
//             const delay = params.data[0];
//             if (delay > 500) return '#ff4d4f';      // Critical
//             if (delay > 180) return '#ffa940';      // Severe
//             if (delay > 90) return '#fadb14';       // Moderate
//             return '#95de64';                       // Minor
//           }
//         },
//         emphasis: {
//           focus: 'series',
//           label: {
//             show: true,
//             formatter: function(params) {
//               return params.data[2];
//             },
//             position: 'top'
//           }
//         }
//       }],
//       legend: {
//         data: ['Critical Delay (>500 days)', 'Severe Delay (181-500 days)', 
//                'Moderate Delay (91-180 days)', 'Minor Delay (≤90 days)'],
//         top: '5%',
//         type: 'scroll'
//       }
//     };
  
//     return (
//       <div className="w-full h-[700px] p-4">
//         <ReactEcharts 
//           option={option}
//           style={{ height: '100%', width: '100%' }}
//         />
//       </div>
//     );
//   };

//   const parseDelayDays = (delay) => {
//     const match = delay.match(/(\d+)d/);
//     return match ? parseInt(match[1]) : 0;
//   };

//   const getStatusColor = (delay) => {
//     const days = parseDelayDays(delay);
//     if (days > 180) return 'bg-red-100 text-red-800';
//     if (days > 90) return 'bg-yellow-100 text-yellow-800';
//     return 'bg-orange-100 text-orange-800';
//   };


//   const columns = [
//     {
//       title: 'Component',
//       dataIndex: 'component',
//       key: 'component',
//       className: 'font-medium',
//       filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
//         <div style={{ padding: 8 }}>
//           <Input
//             autoFocus
//             placeholder="Search Component"
//             value={selectedKeys[0]}
//             onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
//             onPressEnter={() => confirm()}
//             style={{ marginBottom: 8, display: 'block' }}
//           />
//           <Button
//             type="link"
//             onClick={() => clearFilters && clearFilters()}
//             size="small"
//             style={{ width: '100%' }}
//           >
//             Clear
//           </Button>
//           <Button
//             type="primary"
//             onClick={() => confirm()}
//             size="small"
//             style={{ width: '100%' }}
//           >
//             Filter
//           </Button>
//         </div>
//       ),
//       filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
//       onFilter: (value, record) => {
//         // The filter works by matching the 'component' field with the search value
//         return record.component.toLowerCase().includes(value.toLowerCase());
//       },
//       filters: [], // No static filters here, dynamic filtering will happen in the search input
//     },
//     {
//       title: 'Status',
//       key: 'status',
//       render: (_, record) => (
//         <Badge className={`px-2 py-1 rounded-full ${getStatusColor(record.delay)}`}>
//           Delayed ({record.delay})
//         </Badge>
//       ),
//       filters: [
//         { text: 'Critical Delay', value: 'Critical Delay' },
//         { text: 'Severe Delay', value: 'Severe Delay' },
//         { text: 'Moderate Delay', value: 'Moderate Delay' },
//         { text: 'Minor Delay', value: 'Minor Delay' },
//       ],
//       onFilter: (value, record) => {
//         const days = parseDelayDays(record.delay);
//         if (value === 'Critical Delay') return days > 500;
//         if (value === 'Severe Delay') return days > 180 && days <= 500;
//         if (value === 'Moderate Delay') return days > 90 && days <= 180;
//         return days <= 90;
//       },
//     },
//     {
//       title: 'Quantity',
//       key: 'quantity',
//       render: (_, record) => `${record.completed_quantity}/${record.total_quantity}`,
//     },
//     {
//       title: 'Scheduled End',
//       dataIndex: 'scheduled_end_time',
//       key: 'scheduled_end_time',
//       render: (date) => new Date(date).toLocaleDateString(),
//       sorter: (a, b) => new Date(a.scheduled_end_time) - new Date(b.scheduled_end_time),
//     },
//     {
//       title: 'Lead Time',
//       dataIndex: 'lead_time',
//       key: 'lead_time',
//       render: (date) => new Date(date).toLocaleDateString(),
//       sorter: (a, b) => new Date(a.lead_time) - new Date(b.lead_time),
//     },
//   ];

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
        <div className="flex justify-between">
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
        {selectedKeys[0] && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 'bold' }}>Matching Components:</div>
            {data?.delayed_complete
              ?.filter(item => item.component.toLowerCase().includes(selectedKeys[0].toLowerCase()))
              .map(item => (
                <div key={item.component} style={{ padding: '4px 0' }}>
                  {item.component}
                </div>
              ))}
          </div>
        )}
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => record.component.toLowerCase().includes(value.toLowerCase()),
  },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => (
      <Badge className={`px-2 py-1 rounded-full ${record.delay ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        {record.delay ? `Delayed (${record.delay})` : 'Early'}
      </Badge>
    ),
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Select
          style={{ width: 200, marginBottom: 8 }}
          value={selectedKeys[0]}
          onChange={(value) => setSelectedKeys(value ? [value] : [])}
          options={[
            { value: 'delayed', label: 'Delayed' },
            { value: 'early', label: 'Early' }
          ]}
        />
        <div className="flex justify-between">
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Filter
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
        {selectedKeys[0] && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 'bold' }}>Matching Status:</div>
            {data?.delayed_complete
              ?.filter(item => selectedKeys[0] === 'delayed' ? item.delay : !item.delay)
              .map(item => (
                <div key={item.component} style={{ padding: '4px 0' }}>
                  {item.component}: {item.delay ? `Delayed (${item.delay})` : 'Early'}
                </div>
              ))}
          </div>
        )}
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => value === 'delayed' ? record.delay : !record.delay,
  },
  {
    title: 'Quantity',
    key: 'quantity',
    render: (_, record) => `${record.completed_quantity}/${record.total_quantity}`,
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          autoFocus
          placeholder="Search Quantity"
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <div className="flex justify-between">
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
        {selectedKeys[0] && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 'bold' }}>Matching Quantities:</div>
            {data?.delayed_complete
              ?.filter(item => `${item.completed_quantity}/${item.total_quantity}`.includes(selectedKeys[0]))
              .map(item => (
                <div key={item.component} style={{ padding: '4px 0' }}>
                  {item.component}: {item.completed_quantity}/{item.total_quantity}
                </div>
              ))}
          </div>
        )}
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => `${record.completed_quantity}/${record.total_quantity}`.includes(value),
  },
  {
    title: 'Scheduled End',
    dataIndex: 'scheduled_end_time',
    key: 'scheduled_end_time',
    render: (date) => new Date(date).toLocaleDateString(),
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          autoFocus
          placeholder="Search Date (MM/DD/YYYY)"
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <div className="flex justify-between">
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
        {selectedKeys[0] && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 'bold' }}>Matching Dates:</div>
            {data?.delayed_complete
              ?.filter(item => new Date(item.scheduled_end_time).toLocaleDateString().includes(selectedKeys[0]))
              .map(item => (
                <div key={item.component} style={{ padding: '4px 0' }}>
                  {item.component}: {new Date(item.scheduled_end_time).toLocaleDateString()}
                </div>
              ))}
          </div>
        )}
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => new Date(record.scheduled_end_time).toLocaleDateString().includes(value),
    sorter: (a, b) => new Date(a.scheduled_end_time) - new Date(b.scheduled_end_time),
  },
  {
    title: 'Lead Time',
    dataIndex: 'lead_time',
    key: 'lead_time',
    render: (date) => new Date(date).toLocaleDateString(),
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          autoFocus
          placeholder="Search Date (MM/DD/YYYY)"
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <div className="flex justify-between">
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
        {selectedKeys[0] && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 'bold' }}>Matching Dates:</div>
            {data?.delayed_complete
              ?.filter(item => new Date(item.lead_time).toLocaleDateString().includes(selectedKeys[0]))
              .map(item => (
                <div key={item.component} style={{ padding: '4px 0' }}>
                  {item.component}: {new Date(item.lead_time).toLocaleDateString()}
                </div>
              ))}
          </div>
        )}
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => new Date(record.lead_time).toLocaleDateString().includes(value),
    sorter: (a, b) => new Date(a.lead_time) - new Date(b.lead_time),
  },
];

const ComponentStatusAnalytics = ({ data }) => {
  // Combine all component data
  const allComponents = [
    ...data.early_complete,
    ...data.on_time_complete,
    ...data.delayed_complete
  ];

  // Prepare data for visualization and find min/max dates
  let minDate = Infinity;
  let maxDate = -Infinity;

  const chartData = allComponents.map(item => {
    const scheduledEndTime = new Date(item.scheduled_end_time).getTime();
    const leadTime = new Date(item.lead_time).getTime();
    
    // Update min and max dates
    minDate = Math.min(minDate, scheduledEndTime, leadTime);
    maxDate = Math.max(maxDate, scheduledEndTime, leadTime);

    return {
      component: item.component,
      scheduledEndTime,
      leadTime,
      completionStatus: item.delay ? 'Delayed' : 'Early',
      completedQuantity: item.completed_quantity,
      totalQuantity: item.total_quantity,
    };
  });

  // Add padding to the date range (1 month before and after)
  const paddedMinDate = new Date(minDate);
  paddedMinDate.setMonth(paddedMinDate.getMonth() - 1);
  const paddedMaxDate = new Date(maxDate);
  paddedMaxDate.setMonth(paddedMaxDate.getMonth() + 1);

  const option = {
    title: {
      text: 'Part Number Completion Timeline',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const component = params[0].name;
        const item = allComponents.find(i => i.component === component);
        return `Part Number: ${component}<br/>` +
               `Scheduled End: ${new Date(item.scheduled_end_time).toLocaleDateString()}<br/>` +
               `Lead Time: ${new Date(item.lead_time).toLocaleDateString()}<br/>` +
               `Status: ${item.delay ? 'Delayed' : 'Early'}<br/>` +
               `Progress: ${item.completed_quantity}/${item.total_quantity}`;
      }
    },
    legend: {
      data: ['Scheduled End Time', 'Lead Time'],
      top: 30
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.component),
      axisLabel: {
        interval: 0,
        rotate: 45,
        formatter: (value) => {
          return value.length > 15 ? value.substring(0, 15) + '...' : value;
        }
      }
    },
    yAxis: {
      type: 'time',
      min: paddedMinDate.getTime(),
      max: paddedMaxDate.getTime(),
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
        data: chartData.map(item => ({
          value: item.scheduledEndTime,
          itemStyle: {
            color: item.completionStatus === 'Delayed' ? '#ff4d4f' : '#52c41a'
          }
        })),
        barWidth: '40%'
      },
      {
        name: 'Lead Time',
        type: 'line',
        data: chartData.map(item => item.leadTime),
        lineStyle: {
          color: '#1890ff',
          width: 2
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  };

  // Rest of the component remains the same...
  return (
    <div className="space-y-6">
      <div className="w-full h-[700px] p-4">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
      {/* <div className="p-4">
        <h3 className="text-xl font-semibold mb-4">Components Detail</h3>
        <Table
          columns={columns}
          dataSource={allComponents}
          pagination={{ pageSize: 5 }}
          rowKey="component"
        />
      </div> */}
    </div>
  );
};

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
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const machines = Object.keys(data.machine_schedules);
  
  // Handle search functionality
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  // Column search props configuration
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <div className="flex justify-between">
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    render: (text) =>
      searchedColumn === dataIndex ? (
        <span style={{ backgroundColor: '#ffc069' }}>
          {text ? text.toString() : ''}
        </span>
      ) : (
        text
      ),
  });

  // Chart configuration
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

  // Table columns configuration
  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      ...getColumnSearchProps('machine'),
      filters: machines.map(m => ({ text: m, value: m })),
      onFilter: (value, record) => record.machine === value,
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      ...getColumnSearchProps('part_number'),
      sorter: (a, b) => a.part_number.localeCompare(b.part_number)
    },
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      ...getColumnSearchProps('operation'),
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
  ];

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      {/* <div className="w-full h-[400px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div> */}

      {/* Global Search */}
      <div className="p-4 bg-white rounded-lg shadow">
        <Input
          placeholder="Global Search (Part Number, Machine, Operation)"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value.toLowerCase())}
          className="max-w-md mb-4"
        />

        {/* Table Section */}
        <div className="overflow-x-auto">
          <Table
            dataSource={machines.flatMap(machine => 
              data.machine_schedules[machine].map(schedule => ({
                ...schedule,
                machine: machine,
                key: `${machine}-${schedule.part_number}-${schedule.start_time}`
              }))
            ).filter(record => {
              if (!searchText) return true;
              return (
                record.part_number.toLowerCase().includes(searchText) ||
                record.machine.toLowerCase().includes(searchText) ||
                record.operation.toLowerCase().includes(searchText)
              );
            })}
            columns={columns}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
            scroll={{ x: true }}
          />
        </div>
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
          fetch('http://172.19.224.1:8002/api/v1/component_status/'),
          fetch('http://172.19.224.1:8002/api/v1/operations/machine_schedules/')
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
        {/* <TabPane tab="Delivery Date Analysis" key="leadTime">
          <LeadTimeAnalytics  />
        </TabPane> */} 
        {/* <TabPane tab="Part Number Status" key="componentStatus">
          <ComponentStatusAnalytics data={data} /> */}
          {/* <div>
            <h3 className="text-xl font-semibold mb-4">Delayed Components Detail</h3>
            <Table
              columns={columns}
              dataSource={data.delayed_complete}
              pagination={{ pageSize: 5 }}
              rowKey="component"
            />
          </div> */}
        {/* </TabPane> */}
        {/* <TabPane tab="Schedule Details" key="scheduleDetails">
          <ScheduleDetails data={scheduleData} />
        </TabPane> */}
        <TabPane tab="Production Status" key="productionStatus">
          <ProductionStatus />
        </TabPane>
      </Tabs>

        
    </Card>
  );
};

export default AnalyticsDashboard;