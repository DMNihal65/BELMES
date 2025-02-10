import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Spin, Radio, Tabs } from 'antd';
import ReactECharts from 'echarts-for-react';
import useScheduleStore from '../../store/schedule-store';

const { TabPane } = Tabs;

const ProductionStatus = () => {
  const [partNumber, setPartNumber] = useState('');
  const [timeRange, setTimeRange] = useState('daily');
  const { 
    productionStatusData, 
    productionStatusLoading, 
    productionStatusError,
    fetchProductionStatus,
    fetchWeeklyProductionStatus,
    fetchMonthlyProductionStatus
  } = useScheduleStore();

  const handleSearch = () => {
    switch (timeRange) {
      case 'daily':
        fetchProductionStatus(partNumber);
        break;
      case 'weekly':
        fetchWeeklyProductionStatus(partNumber);
        break;
      case 'monthly':
        fetchMonthlyProductionStatus(partNumber);
        break;
    }
  };

  const getStackedBarChartOption = () => {
    if (!productionStatusData?.daily_production) return {};

    const data = productionStatusData.daily_production;
    const uniquePartNumbers = [...new Set(data.map(item => item.part_number))];
    const dateField = timeRange === 'daily' ? 'date' : 
                     timeRange === 'weekly' ? 'week_start_date' : 'month_start_date';
    const dates = [...new Set(data.map(item => item[dateField]))];

    return {
      title: {
        text: partNumber ? `Production Status for ${partNumber}` : 'Overall Production Status',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: uniquePartNumbers,
        top: 30,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        top: uniquePartNumbers.length > 10 ? 100 : 80
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: 'Quantity'
      },
      series: uniquePartNumbers.map(part => ({
        name: part,
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: dates.map(date => {
          const record = data.find(item => 
            item.part_number === part && item[dateField] === date
          );
          return record ? record.completed_quantity : 0;
        })
      }))
    };
  };

  const getDetailedChartOption = () => {
    if (!productionStatusData?.daily_production) return {};

    const data = productionStatusData.daily_production;
    const dateField = timeRange === 'daily' ? 'date' : 
                     timeRange === 'weekly' ? 'week_start_date' : 'month_start_date';
    const dates = [...new Set(data.map(item => item[dateField]))];

    return {
      title: {
        text: `Detailed Production Analysis${partNumber ? ` for ${partNumber}` : ''}`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Planned', 'Completed', 'Remaining'],
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
        type: 'category',
        data: dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: 'Quantity'
      },
      series: [
        {
          name: 'Planned',
          type: 'bar',
          data: data.map(item => item.planned_quantity),
          itemStyle: { color: '#1890ff' }
        },
        {
          name: 'Completed',
          type: 'bar',
          data: data.map(item => item.completed_quantity),
          itemStyle: { color: '#52c41a' }
        },
        {
          name: 'Remaining',
          type: 'bar',
          data: data.map(item => item.remaining_quantity),
          itemStyle: { color: '#ff4d4f' }
        }
      ]
    };
  };

  const getPieChartOption = () => {
    if (!productionStatusData?.total_planned || !productionStatusData?.total_completed) return {};

    const partNumbers = Object.keys(productionStatusData.total_planned);
    const data = partNumbers.map(part => ({
      name: part,
      value: productionStatusData.total_completed[part] || 0
    }));

    return {
      title: {
        text: 'Total Completion by Part Number',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        type: 'scroll'
      },
      series: [
        {
          name: 'Completed Quantity',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '20',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  };

  return (
    <Card className="mt-4">
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Enter Part Number"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
          style={{ width: 200 }}
        />
        <Radio.Group value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <Radio.Button value="daily">Daily</Radio.Button>
          <Radio.Button value="weekly">Weekly</Radio.Button>
          <Radio.Button value="monthly">Monthly</Radio.Button>
        </Radio.Group>
        <Button type="primary" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {productionStatusLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Spin size="large" />
        </div>
      ) : productionStatusError ? (
        <div className="text-red-500 text-center">
          Error: {productionStatusError}
        </div>
      ) : productionStatusData?.daily_production?.length > 0 ? (
        <Tabs defaultActiveKey="1">
          <TabPane tab="Stacked Overview" key="1">
            <ReactECharts
              option={getStackedBarChartOption()}
              style={{ height: '500px' }}
              opts={{ renderer: 'svg' }}
            />
          </TabPane>
          <TabPane tab="Detailed Analysis" key="2">
            <ReactECharts
              option={getDetailedChartOption()}
              style={{ height: '500px' }}
              opts={{ renderer: 'svg' }}
            />
          </TabPane>
          <TabPane tab="Total Completion" key="3">
            <ReactECharts
              option={getPieChartOption()}
              style={{ height: '500px' }}
              opts={{ renderer: 'svg' }}
            />
          </TabPane>
        </Tabs>
      ) : (
        <div className="text-center text-gray-500">
          No data available. Please search for production data.
        </div>
      )}
    </Card>
  );
};

export default ProductionStatus; 