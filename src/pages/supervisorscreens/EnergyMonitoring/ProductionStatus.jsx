

import React, { useState, useRef, useEffect } from 'react';
import { Card, DatePicker, Typography, Space, Spin } from 'antd';
import * as echarts from 'echarts';
import moment from 'moment';
import useEnergyStore from '../../../store/energyMonitoring';

const { Title } = Typography;

function ProductionStatus({ machineId }) {
  // Initialize with current date and time
  const [selectedDate, setSelectedDate] = useState(() => moment().utcOffset('+05:30'));
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartData, setChartData] = useState({
    OFF: [],
    ON: [],
    PRODUCTION: []
  });
  const { fetchProductionData, loading } = useEnergyStore();

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date || moment().utcOffset('+05:30')); // Provide fallback to current date
  };

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Generate time slots for x-axis from 8:30 today to 8:30 tomorrow
    const timeSlots = [];
    const startHour = 8;
    const startMinute = 30;
    
    // Generate 24 hours worth of slots starting from 8:30
    for (let i = 0; i < 48; i++) { // 48 slots for 24 hours (30-minute intervals)
      const currentDateTime = moment()
        .startOf('day')
        .hour(startHour)
        .minute(startMinute)
        .add(i * 30, 'minutes');

      timeSlots.push(currentDateTime.format('HH:mm'));
    }

    const option = {
      title: {
        text: 'Machine Production Timeline',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#2c6e49'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const timeStr = params[0].axisValue;
          let result = `Time: ${timeStr}<br/>`;
          params.forEach(param => {
            if (param.value) {
              result += `${param.seriesName}<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['OFF', 'ON', 'PRODUCTION'],
        top: 40,
        left: 'center',
        textStyle: {
          color: '#2c6e49'
        }
      },
      grid: {
        height: '60%',
        top: '20%',
        bottom: '15%',
        left: '5%',
        right: '5%'
      },
      xAxis: {
        type: 'category',
        data: timeSlots,
        axisLabel: {
          interval: 1, // Show all labels
          rotate: 45,
          formatter: (value) => {
            // Add visual separator for day change at midnight
            return value === '00:00' ? `${value}\n(Next Day)` : value;
          },
          color: '#2c6e49',
          fontSize: 11
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#ccc'
          }
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'category',
        data: [machineId],
        axisLabel: {
          color: '#2c6e49'
        }
      },
      series: [
        {
          name: 'OFF',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#4A4A4A' },
          data: (chartData.OFF || []).map(interval => ({
            value: [interval.start, interval.end],
            itemStyle: { color: '#4A4A4A' }
          }))
        },
        {
          name: 'ON',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#DAA520' },
          data: (chartData.ON || []).map(interval => ({
            value: [interval.start, interval.end],
            itemStyle: { color: '#DAA520' }
          }))
        },
        {
          name: 'PRODUCTION',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#228B22' },
          data: (chartData.PRODUCTION || []).map(interval => ({
            value: [interval.start, interval.end],
            itemStyle: { color: '#228B22' }
          }))
        }
      ]
    };

    chartInstance.current.setOption(option);
  }, [chartData, machineId]);

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!machineId || !selectedDate) return;
      
      try {
        const formattedDate = selectedDate.format('YYYY-MM-DD');
        const data = await fetchProductionData(machineId, formattedDate);
        
        // Transform the data into the required format
        const transformedData = {
          OFF: [],
          ON: [],
          PRODUCTION: []
        };

        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.status && item.start_time && item.end_time) {
              transformedData[item.status].push({
                start: item.start_time,
                end: item.end_time
              });
            }
          });
        }

        setChartData(transformedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setChartData({ OFF: [], ON: [], PRODUCTION: [] });
      }
    };

    fetchData();
  }, [machineId, selectedDate]);

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#2c6e49' }}>
            Machine: {machineId} | Date: {selectedDate?.format('DD MMM, YYYY') || 'Not selected'}
          </Title>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            style={{ width: 200 }}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <div 
            ref={chartRef} 
            style={{ 
              height: '200px', 
              width: '100%' 
            }} 
          />
          
          {loading && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}>
              <Spin size="large" />
            </div>
          )}
        </div>
      </Space>
    </Card>
  );
}

export default ProductionStatus; 