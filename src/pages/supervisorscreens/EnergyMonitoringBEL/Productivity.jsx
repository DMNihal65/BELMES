import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Space, Card, Row, Col, DatePicker } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBEL';
import { isEqual } from 'lodash';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Productivity = ({ onBack }) => {
  const navigate = useNavigate();
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [machineData, setMachineData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const prevDataRef = useRef([]);
  
  // Get functions and state from the store
  const { 
    connectShiftwiseEnergyWebSocket, 
    disconnectShiftwiseEnergyWebSocket,
    getMachineEnergyData,
    fetchMachineNames,
    machineNames,
    isLoading,
    fetchShiftwiseEnergyHistoryByDate
  } = useEnergyMonitoringBelStore();

  // Connect to WebSocket when component mounts and isLive is true
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      // Connect to WebSocket if in live mode
      if (isLive) {
        connectShiftwiseEnergyWebSocket();
      }
    };
    
    loadData();
    
    // Cleanup - disconnect WebSocket when component unmounts
    return () => {
      disconnectShiftwiseEnergyWebSocket();
    };
  }, [connectShiftwiseEnergyWebSocket, disconnectShiftwiseEnergyWebSocket, isLive]);

  // Update machine data when SSE sends new data
  useEffect(() => {
    // Function to update machine data
    const updateMachineData = async () => {
      console.log('Updating machine data...');
      // Get raw machine data directly from the SSE data
      const { allMachinesEnergyData } = useEnergyMonitoringBelStore.getState();
      console.log('Current SSE data:', allMachinesEnergyData);
      
      // If we have valid SSE data (array of machine data)
      if (allMachinesEnergyData && Array.isArray(allMachinesEnergyData) && allMachinesEnergyData.length > 0) {
        console.log('Processing machine data...');
        // Process the machines data
        const newMachineData = allMachinesEnergyData.map(machine => ({
          id: machine.machine_id,
          machine_name: machine.machine_name || `Machine-${machine.machine_id}`,
          energy: parseFloat(machine.total_energy || 0),
          max_energy: Math.max(40, parseFloat(machine.total_energy || 0) * 1.2), // Dynamic max based on highest value
          first_shift: parseFloat(machine.first_shift || 0),
          second_shift: parseFloat(machine.second_shift || 0),
          third_shift: parseFloat(machine.third_shift || 0),
          timestamp: machine.timestamp
        }));
        
        console.log('Setting new machine data:', newMachineData);
        setMachineData(newMachineData);
        prevDataRef.current = newMachineData;
        setIsDataLoading(false);
      }
    };
    
    // Update data immediately
    updateMachineData();
    
    // Set up a more frequent check for updates
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        console.log('Checking for updates...');
        updateMachineData();
      }, 1000); // Check every second
    }
    
    // Clean up interval
    return () => {
      if (interval) {
        console.log('Cleaning up interval');
        clearInterval(interval);
      }
    };
  }, [isLive]);

  const handleDateRangeChange = async (dates) => {
    try {
      setIsDataLoading(true);
      // Set loading state and update UI state
      useEnergyMonitoringBelStore.setState({ isLoading: true });
      setSelectedDateRange(dates);
      setIsLive(!dates);
      
      if (!dates || dates.length === 0) {
        // If returning to live mode, reconnect WebSocket
        handleGoLive();
        return;
      }
      
      // If switching to history mode, disconnect WebSocket
      disconnectShiftwiseEnergyWebSocket();
      
      const [fromDate, toDate] = dates;
      
      // Format the dates for logging
      const formattedFromDate = fromDate.format('YYYY-MM-DD');
      const formattedToDate = toDate.format('YYYY-MM-DD');
      console.log(`Fetching historical data from ${formattedFromDate} to ${formattedToDate}`);
      
      try {
        // Pass both fromDate and toDate to the store function
        const historyData = await fetchShiftwiseEnergyHistoryByDate(fromDate, toDate);
        
        // Process the data if available
        if (historyData && Array.isArray(historyData) && historyData.length > 0) {
          // The data is already processed with correct machine names from the store
          console.log('Processed historical data:', historyData);
          setMachineData(historyData);
          prevDataRef.current = historyData;
        } else {
          console.warn('No historical data available for the selected date range');
          // Show empty data with message instead of fallback data
          setMachineData([]);
          prevDataRef.current = [];
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
        // Show empty data with message
        setMachineData([]);
        prevDataRef.current = [];
      }
      
    } catch (error) {
      console.error('Error in handleDateRangeChange:', error);
      useEnergyMonitoringBelStore.setState({ isLoading: false });
      setMachineData([]);
      prevDataRef.current = [];
    } finally {
      // Always make sure to turn off loading state
      useEnergyMonitoringBelStore.setState({ isLoading: false });
      setIsDataLoading(false);
    }
  };

  const handleGoLive = () => {
    console.log('Switching to live mode...');
    setIsDataLoading(true);
    setSelectedDateRange(null);
    setIsLive(true);
    // Clear existing data before reconnecting
    setMachineData([]);
    prevDataRef.current = [];
    // Reconnect to live data
    connectShiftwiseEnergyWebSocket();
  };

  const handleViewReport = () => {
    if (selectedDateRange && selectedDateRange.length === 2) {
      // Calculate costs for each machine before sending to report
      const reportData = machineData.map(machine => ({
        ...machine,
        // Calculate cost based on energy (using fixed rate of 12.5 rupees per kWh)
        cost: parseFloat((machine.energy * 12.5).toFixed(2))
      }));
      
      console.log('Sending data to report:', reportData);
      
      const [fromDate, toDate] = selectedDateRange;
      navigate('/supervisor/energy-monitoring-bel/report', { 
        state: { 
          fromDate: fromDate.format('YYYY-MM-DD'),
          toDate: toDate.format('YYYY-MM-DD'),
          dateRange: `${fromDate.format('YYYY-MM-DD')} to ${toDate.format('YYYY-MM-DD')}`,
          machineData: reportData,
          returnPath: '/supervisor/energy-monitoring-bel/machines'
        } 
      });
    }
  };

  const getGaugeOptions = (machine) => ({
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: machine.max_energy || 40,
      splitNumber: 10,
      radius: '85%',
      center: ['50%', '60%'],
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [{
            offset: 0, color: '#60A5FA'
          }, {
            offset: 0.5, color: '#3B82F6'
          }, {
            offset: 1, color: '#1D4ED8'
          }]
        }
      },
      progress: {
        show: true,
        roundCap: true,
        width: 18,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
              offset: 0, color: '#60A5FA'
            }, {
              offset: 0.5, color: '#3B82F6'
            }, {
              offset: 1, color: '#1D4ED8'
            }]
          }
        }
      },
      pointer: {
        show: false
      },
      axisLine: {
        roundCap: true,
        lineStyle: {
          width: 18,
          color: [[1, '#E5E7EB']]
        }
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      },
      axisLabel: {
        show: false
      },
      title: {
        show: false
      },
      detail: {
        show: true,
        width: 50,
        height: 14,
        fontSize: 24,
        color: '#1F2937',
        fontWeight: 'bold',
        formatter: function(value) {
          // Ensure value is a number and handle undefined/null
          const numValue = parseFloat(value) || 0;
          // Format to 3 decimal places and handle large numbers
          if (Math.abs(numValue) >= 1000) {
            return numValue.toFixed(1) + ' kWh';
          } else {
            return numValue.toFixed(3) + ' kWh';
          }
        },
        offsetCenter: [0, '-10%']
      },
      data: [{
        value: machine.energy || 0,
        name: machine.machine_name || `Machine-${machine.id}`
      }],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    }]
  });

  function isDeepEqual(obj1, obj2) {
    if (typeof isEqual === 'function') {
      return isEqual(obj1, obj2);
    }
    
    // Simple deep comparison for our specific data structure
    if (obj1.length !== obj2.length) return false;
    
    for (let i = 0; i < obj1.length; i++) {
      const a = obj1[i];
      const b = obj2[i];
      
      if (a.id !== b.id) return false;
      if (a.machine_name !== b.machine_name) return false;
      if (a.energy !== b.energy) return false;
      if (a.first_shift !== b.first_shift) return false;
      if (a.second_shift !== b.second_shift) return false;
      if (a.third_shift !== b.third_shift) return false;
    }
    
    return true;
  }

  // Helper function to format date range display
  const getDateRangeDisplay = () => {
    if (!selectedDateRange || selectedDateRange.length !== 2) return '';
    const [fromDate, toDate] = selectedDateRange;
    
    // If same date, show single date
    if (fromDate.format('YYYY-MM-DD') === toDate.format('YYYY-MM-DD')) {
      return fromDate.format('MMMM D, YYYY');
    }
    
    // Different dates, show range
    return `${fromDate.format('MMM D')} - ${toDate.format('MMM D, YYYY')}`;
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Space>
          <Button 
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{
              backgroundColor: '#1890ff',
              borderRadius: '6px'
            }}
          >
            Back
          </Button>
        </Space>
        <Title 
          level={2} 
          style={{ 
            margin: 0,
            color: '#000000',
            fontWeight: 600
          }}
        >
          {isLive ? 'Live Energy Monitoring' : `Historical Energy Data - ${getDateRangeDisplay()}`}
        </Title>
        <Space size="middle">
          <RangePicker 
            value={selectedDateRange}
            onChange={handleDateRangeChange}
            style={{ width: '300px' }}
            placeholder={['From Date', 'To Date']}
            format="YYYY-MM-DD"
            disabledDate={(current) => {
              // Disable future dates
              return current && current > moment().endOf('day');
            }}
            allowClear={true}
          />
        
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleGoLive}
            style={{
              backgroundColor: isLive ? '#22c55e' : '#64748b',
              borderColor: isLive ? '#16a34a' : '#475569'
            }}
          >
            Go Live
          </Button>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={handleViewReport}
            disabled={!selectedDateRange || machineData.length === 0}
            style={{
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb'
            }}
          >
            View Report
          </Button>
          {isLive && !isDataLoading && (
            <div style={{ 
              background: '#22c55e',
              padding: '8px 16px',
              borderRadius: '20px',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                background: 'white',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite'
              }}></div>
              <span>Live Data</span>
            </div>
          )}
        </Space>
      </div>

      {/* Loading state */}
      {(isLoading || isDataLoading) && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          background: '#f9fafb',
          borderRadius: '12px',
          margin: '20px 0'
        }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <Text style={{ fontSize: '16px', color: '#64748b' }}>
            {isLive ? 'Loading live energy data...' : 'Loading historical data...'}
          </Text>
        </div>
      )}

      {/* No data message */}
      {!isLoading && !isDataLoading && selectedDateRange && machineData.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 0',
          background: '#f9fafb',
          borderRadius: '12px',
          margin: '20px 0'
        }}>
          <Text 
            style={{ 
              fontSize: '18px', 
              display: 'block',
              marginBottom: '16px',
              color: '#64748b'
            }}
          >
            No energy monitoring data available for {getDateRangeDisplay()}
          </Text>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleGoLive}
          >
            Return to Live Data
          </Button>
        </div>
      )}

      {/* Machine Gauge Charts Grid */}
      {!isLoading && !isDataLoading && machineData.length > 0 && (
        <Row gutter={[16, 16]}>
          {machineData.map((machine) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={machine.id}>
              <Card 
                className="shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ 
                  borderRadius: '12px',
                  height: '100%',
                  background: 'white'
                }}
                bodyStyle={{ padding: '16px' }}
              >
                <div style={{
                  textAlign: 'center',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #E5E7EB'
                }}>
                  <Text style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#1F2937'
                  }}>
                    {machine.machine_name}
                  </Text>
                </div>
                <ReactECharts
                  option={getGaugeOptions(machine)}
                  style={{ height: '220px' }}
                  opts={{ renderer: 'svg' }}
                />
                <div style={{ 
                  marginTop: '12px',
                  padding: '12px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>Total Energy</Text>
                  <div style={{ 
                    color: '#3B82F6', 
                    fontWeight: '600', 
                    fontSize: '20px',
                    marginTop: '2px'
                  }}>
                       {(machine.energy || 0).toFixed(2)} kWh
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      

      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #22c55e;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Productivity;