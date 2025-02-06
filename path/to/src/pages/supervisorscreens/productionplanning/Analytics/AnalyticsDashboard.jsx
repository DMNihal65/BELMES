import useScheduleStore from '../../../store/schedule-store'; // Adjust the path as necessary

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
    const onTimeStatus = leadTimeData.map(item => item.onTime ? 'Yes' : 'No');

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
          const onTime = onTimeStatus[params[0].dataIndex];
          return `Component: ${component}<br/>Scheduled End Time: ${scheduledEnd}<br/>Lead Time: ${leadTime}<br/>On Time: ${onTime}`;
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
        // min: yAxisMin, // Uncomment if yAxisMin is stored in the store
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
      color: ['#FF69B4', '#4169E1'], // Pink for bars, Blue for line
      series: [
        {
          name: 'Scheduled End Time',
          type: 'bar',
          data: scheduledEndTimes,
          itemStyle: {
            color: '#FF69B4' // Pink for bars
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
        }
      ]
    };
  };

  return (
    <div className="w-full h-[800px] p-4">
      <ReactECharts
        option={getOption()}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

const AnalyticsDashboard = () => {
  // ... existing state and hooks ...

  return (
    <Card className="mt-4">
      <Tabs defaultActiveKey="componentStatus">
        <TabPane tab="Component Status" key="componentStatus">
          {/* ... existing content ... */}
        </TabPane>
        <TabPane tab="Lead Time Analysis" key="leadTime">
          <LeadTimeAnalytics />
        </TabPane>
        <TabPane tab="Schedule Details" key="scheduleDetails">
          {/* ... existing content ... */}
        </TabPane>
      </Tabs>
    </Card>
  );
};

// ... existing export ... 