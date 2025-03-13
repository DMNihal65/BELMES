import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, Row, Col, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import useEnergyStore from '../../../store/energyMonitoring';
import moment from 'moment';

function RealtimeGraph({ machineId }) {
  const { liveData, fetchLiveData, averageEnergyData, fetchAverageEnergy, historicalData, energyData, lastUpdate } = useEnergyStore();

  useEffect(() => {
    // Initial fetch
    fetchLiveData(machineId);

    // Set up polling interval
    const interval = setInterval(() => {
      fetchLiveData(machineId);
    }, 5000);

    return () => clearInterval(interval);
  }, [machineId, fetchLiveData]);

  useEffect(() => {
    // Fetch average energy data initially and every minute
    fetchAverageEnergy(machineId, new Date());
    const averageInterval = setInterval(() => {
      fetchAverageEnergy(machineId, new Date());
    }, 60000); // Update every minute

    return () => clearInterval(averageInterval);
  }, [machineId, fetchAverageEnergy]);

  const getCurrentOption = useMemo(() => ({
    title: {
      text: 'Live Current Data',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const value = params[0].value;
        const time = params[0].axisValue;
        return `Time: ${time}<br/>Current: ${value} A`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: historicalData.timestamps,
      axisLabel: {
        rotate: 45
      },
      boundaryGap: false // This makes the line start from the left edge
    },
    yAxis: {
      type: 'value',
      name: 'Current (A)',
      axisLabel: {
        formatter: '{value} A'
      },
      splitLine: {
        show: true
      }
    },
    series: [{
      name: 'Current',
      type: 'line',
      data: historicalData.currents,
      smooth: true,
      symbol: 'circle', // Show points as circles
      symbolSize: 6, // Size of the points
      itemStyle: {
        color: '#2c6e49'
      },
      areaStyle: {
        color: 'rgba(44, 110, 73, 0.2)'
      },
      animation: false // Disable animation for smoother updates
    }]
  }), [historicalData]);

  // Memoize the chart update function
  const onChartUpdate = useCallback((chart) => {
    if (chart && lastUpdate) {
      chart.setOption({
        series: [{
          data: historicalData.currents
        }],
        xAxis: {
          data: historicalData.timestamps
        }
      }, {
        notMerge: false,
        lazyUpdate: true
      });
    }
  }, [historicalData, lastUpdate]);

  const getEnergyOption = () => ({
    title: {
      text: 'Energy Analysis',
      left: 'center',
      textStyle: {
        color: '#2c6e49',
      },
    },
    tooltip: {
      trigger: 'item',
    },
    xAxis: {
      type: 'category',
      data: ['Energy'],
    },
    yAxis: {
      type: 'value',
      name: 'Energy',
      min: 0,
      axisLabel: {
        formatter: '{value} kWh',
      },
    },
    series: [{
      name: 'Energy',
      type: 'bar',
      data: energyData,
      itemStyle: {
        color: '#1f77b4',
      },
    }]
  });

  const getReportOption = () => ({
    title: {
      text: 'Machine Report',
      left: 'center',
      textStyle: {
        color: '#2c6e49',
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const avgEnergy = params[0].data;
        const totalTime = params[1].data;
        return `Average Energy: ${avgEnergy} kWh<br/>Total Time: ${totalTime} hours`;
      }
    },
    legend: {
      data: ['Average Energy', 'Total Time'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ['Today'],
    },
    yAxis: [
      {
        type: 'value',
        name: 'Energy (kWh)',
        axisLabel: {
          formatter: '{value} kWh'
        }
      },
      {
        type: 'value',
        name: 'Time (hours)',
        axisLabel: {
          formatter: '{value} h'
        }
      }
    ],
    series: [
      {
        name: 'Average Energy',
        type: 'bar',
        data: [averageEnergyData?.average_energy || 0],
        itemStyle: {
          color: '#1f77b4',
        }
      },
      {
        name: 'Total Time',
        type: 'bar',
        yAxisIndex: 1,
        data: [averageEnergyData?.total_time || 0],
        itemStyle: {
          color: '#ff7f0e',
        }
      }
    ]
  });

  return (
    <div>
      <Card title="Live Current Data">
        <ReactECharts 
          option={getCurrentOption} 
          style={{ height: '400px' }}
          notMerge={false}
          lazyUpdate={true}
          onEvents={{
            finished: () => {
              // Optional: Add any post-update handling here
            }
          }}
        />
      </Card>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card
            title="Machine Energy"
            style={{
              borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              height: '100%'
            }}
            headStyle={{
              background: '#2c6e49',
              color: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '16px 24px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ height: '300px' }}>
              {energyData.length > 0 ? (
                <ReactECharts option={getEnergyOption()} style={{ height: '100%' }} />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Empty description="No energy data available" />
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Machine Report"
            style={{
              borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              height: '100%'
            }}
            headStyle={{
              background: '#2c6e49',
              color: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '16px 24px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ height: '300px' }}>
              <ReactECharts option={getReportOption()} style={{ height: '100%' }} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default React.memo(RealtimeGraph);