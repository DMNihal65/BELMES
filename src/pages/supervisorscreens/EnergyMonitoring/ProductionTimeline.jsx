import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import moment from 'moment';
import { Empty } from 'antd';
import useEnergyStore from '../../../store/energyMonitoring';

function ProductionTimeline({ machineId }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const initializedRef = useRef(false);
  const pollingInterval = useRef(null);
  const { fetchProductionData, productionData } = useEnergyStore();

  // Memoize the data processing
  const processedData = useMemo(() => {
    const dataPoints = productionData[machineId]?.dataPoints || [];
    
    // Return null if no data points or empty array
    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
      return null;
    }

    let chartData = [];
    const firstPoint = dataPoints[0];
    const baseDate = moment(parseInt(firstPoint.value[0])).utc();
    const dayStart = moment(baseDate).utc().set({ hour: 8, minute: 30, second: 0 });
    const dayEnd = moment(dayStart).utc().add(1, 'day');

    dataPoints.forEach(point => {
      const statusValue = 
        point.name === 'PRODUCTION' ? 2 :
        point.name === 'ON' ? 1 : 0;

      const startTime = moment(parseInt(point.value[0])).utc();
      const endTime = moment(parseInt(point.value[1])).utc();

      chartData.push([
        startTime.format('YYYY-MM-DD HH:mm:ss'),
        statusValue,
        point.name,
        startTime.format('HH:mm:ss')
      ]);

      if (startTime.valueOf() !== endTime.valueOf()) {
        chartData.push([
          endTime.format('YYYY-MM-DD HH:mm:ss'),
          statusValue,
          point.name,
          endTime.format('HH:mm:ss')
        ]);
      }
    });

    chartData.sort((a, b) => moment.utc(a[0]).valueOf() - moment.utc(b[0]).valueOf());

    return {
      chartData,
      dayStart: dayStart.format('YYYY-MM-DD HH:mm:ss'),
      dayEnd: dayEnd.format('YYYY-MM-DD HH:mm:ss')
    };
  }, [machineId, productionData]);

  // Memoize the chart options
  const getChartOption = useCallback((data) => {
    if (!data) return null;

    return {
      title: {
        text: 'Machine Status Timeline',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const time = params[0].value[3];
          const status = params[0].value[2];
          return `Time: ${time}<br/>Status: ${status}`;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        min: data.dayStart,
        max: data.dayEnd,
        axisLabel: {
          formatter: function(value) {
            return moment.utc(value).format('HH:mm');
          },
          interval: 'auto'
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: ['OFF', 'ON', 'PRODUCTION'],
        axisLine: { show: true },
        axisTick: { show: true },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'Status',
        type: 'line',
        step: 'start',
        symbolSize: 8,
        lineStyle: { width: 2 },
        itemStyle: {
          color: function(params) {
            return params.value[1] === 2 ? '#52c41a' :
                   params.value[1] === 1 ? '#faad14' :
                   '#f5222d';
          }
        },
        data: data.chartData
      }],
      dataZoom: [{
        type: 'inside',
        start: 0,
        end: 100
      }, {
        show: true,
        type: 'slider',
        bottom: 25,
        start: 0,
        end: 100
      }],
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      animationEasingUpdate: 'linear'
    };
  }, []);

  // Initialize chart only once
  useEffect(() => {
    if (!chartRef.current || initializedRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);
    initializedRef.current = true;

    const option = getChartOption(processedData);
    if (option) {
      chartInstance.current.setOption(option);
    }

    const handleResize = () => {
      chartInstance.current && chartInstance.current.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
      initializedRef.current = false;
    };
  }, [processedData, getChartOption]);

  // Update data without visual flicker or reset
  useEffect(() => {
    if (!chartInstance.current || !processedData) return;

    chartInstance.current.setOption({
      xAxis: {
        min: processedData.dayStart,
        max: processedData.dayEnd,
        animation: false
      },
      series: [{
        data: processedData.chartData,
        animation: false
      }]
    }, { 
      notMerge: false, 
      lazyUpdate: true, 
      silent: true,
      animation: false
    });
  }, [processedData]);

  // Setup polling with cleanup
  useEffect(() => {
    // Initial fetch
    fetchProductionData(machineId);
    
    // Setup polling
    pollingInterval.current = setInterval(() => {
      fetchProductionData(machineId);
    }, 10000);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [machineId]); // Remove fetchProductionData from dependencies

  // If no data is available, show Empty state
  if (!processedData) {
    return (
      <div style={{ 
        width: '100%', 
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>No production data available for this machine</span>
          }
        />
      </div>
    );
  }

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '300px'
      }} 
    />
  );
}

// Memoize the component with custom comparison
export default React.memo(ProductionTimeline, (prevProps, nextProps) => {
  return prevProps.machineId === nextProps.machineId;
}); 