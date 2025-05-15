import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Space, Card, Row, Col, DatePicker } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsMore from 'highcharts/highcharts-more';
import solidGauge from 'highcharts/modules/solid-gauge';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBel';
import { isEqual } from 'lodash';

// Initialize Highcharts modules
highchartsMore(Highcharts);
solidGauge(Highcharts);

const { Title, Text } = Typography;

const Productivity = ({ onBack }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [machineData, setMachineData] = useState([]);
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
      // Fetch machine names if they haven't been loaded yet
      if (!machineNames || machineNames.length === 0) {
        await fetchMachineNames();
      }
      
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
  }, [connectShiftwiseEnergyWebSocket, disconnectShiftwiseEnergyWebSocket, fetchMachineNames, isLive, machineNames]);

  // Update machine data when WebSocket sends new data or on interval
  useEffect(() => {
    // Function to update machine data
    const updateMachineData = async (checkForChanges = true) => {
      // Get raw machine data directly from the WebSocket data
      const { allMachinesEnergyData } = useEnergyMonitoringBelStore.getState();
      const { machineNames } = useEnergyMonitoringBelStore.getState();
      
      // If we have valid WebSocket data (array of machine data)
      if (allMachinesEnergyData && Array.isArray(allMachinesEnergyData) && allMachinesEnergyData.length > 0) {
        // Process only the machines that have data from the WebSocket
        const newMachineData = allMachinesEnergyData.map(machine => {
          const id = machine.machine_id;
          
          // Try to find the machine name from the machineNames array
          const machineInfo = machineNames && machineNames.length > 0 
            ? machineNames.find(m => m.machine_id === id) 
            : null;
          
          // Get the actual machine name (use the make field from machine_data)
          const machineName = machineInfo?.machine_data?.make || `Machine ${id}`;
          
          // Ensure all numeric values are actually numbers
          return {
            id,
            machine_name: machineName,
            energy: parseFloat(machine.total_energy || 0),
            max_energy: 2, // Set a reasonable max based on actual data
            first_shift: parseFloat(machine.first_shift || 0),
            second_shift: parseFloat(machine.second_shift || 0),
            third_shift: parseFloat(machine.third_shift || 0)
          };
        });
        
        // If checkForChanges is false or the data has changed, update state
        if (!checkForChanges || !isDeepEqual(newMachineData, prevDataRef.current)) {
          console.log("Energy data updated, refreshing charts");
          setMachineData(newMachineData);
          prevDataRef.current = newMachineData;
        }
      } else if (prevDataRef.current.length === 0) {
        // Only set fallback data if we don't have any data yet
        const fallbackData = Array.from({ length: 7 }, (_, index) => {
          const id = index + 1;
          
          // Try to find machine name from machineNames
          const machineInfo = machineNames && machineNames.length > 0 
            ? machineNames.find(m => m.machine_id === id) 
            : null;
          
          const machineName = machineInfo?.machine_data?.make || `Machine ${id}`;
          
          return {
            id,
            machine_name: machineName,
            energy: Math.random() * 1, // Small random value for fallback
            max_energy: 2,
            first_shift: Math.random() * 0.8,
            second_shift: 0,
            third_shift: 0
          };
        });
        
        setMachineData(fallbackData);
        prevDataRef.current = fallbackData;
      }
    };
    
    // Update data immediately
    updateMachineData();
    
    // Set interval to check for updates less frequently (10 seconds instead of 5)
    let interval;
    if (isLive) {
      interval = setInterval(() => updateMachineData(), 10000); // Changed from 5000 to 10000 ms
    }
    
    // Clean up interval
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const handleDateChange = async (date) => {
    try {
      // Set loading state and update UI state
      useEnergyMonitoringBelStore.setState({ isLoading: true });
      setSelectedDate(date);
      setIsLive(!date);
      
      if (!date) {
        // If returning to live mode, reconnect WebSocket
        connectShiftwiseEnergyWebSocket();
        useEnergyMonitoringBelStore.setState({ isLoading: false });
        return;
      }
      
      // If switching to history mode, disconnect WebSocket
      disconnectShiftwiseEnergyWebSocket();
      
      // Format the date for the API call
      const formattedDate = date.format('YYYY-MM-DD');
      console.log(`Fetching historical data for date: ${formattedDate}`);
      
      try {
        // Call the store function to fetch historical data using REST API endpoint
        const historyData = await fetchShiftwiseEnergyHistoryByDate(date);
        
        // Process the data if available
        if (historyData && Array.isArray(historyData) && historyData.length > 0) {
          // Process the data for display
          const processedData = historyData.map(machine => {
            const id = machine.machine_id;
            
            // Find machine name in machineNames
            const machineInfo = machineNames && machineNames.length > 0 
              ? machineNames.find(m => m.machine_id === id) 
              : null;
            
            const machineName = machineInfo?.machine_data?.make || `Machine ${id}`;
            
            // Log raw values to debug
            console.log(`Machine ${id} raw values:`, {
              total_energy: machine.total_energy,
              type: typeof machine.total_energy,
              first_shift: machine.first_shift,
              second_shift: machine.second_shift,
              third_shift: machine.third_shift
            });
            
            // Make sure to convert all values to numbers
            return {
              id,
              machine_name: machineName,
              energy: parseFloat(machine.total_energy || 0),
              max_energy: 2,
              first_shift: parseFloat(machine.first_shift || 0),
              second_shift: parseFloat(machine.second_shift || 0),
              third_shift: parseFloat(machine.third_shift || 0)
            };
          });
          
          console.log('Processed historical data:', processedData);
          setMachineData(processedData);
          prevDataRef.current = processedData;
        } else {
          console.warn('No historical data available for the selected date');
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
      console.error('Error in handleDateChange:', error);
      useEnergyMonitoringBelStore.setState({ isLoading: false });
      setMachineData([]);
      prevDataRef.current = [];
    } finally {
      // Always make sure to turn off loading state
      useEnergyMonitoringBelStore.setState({ isLoading: false });
    }
  };

  const handleGoLive = () => {
    setSelectedDate(null);
    setIsLive(true);
    connectShiftwiseEnergyWebSocket();
  };

  const handleViewReport = () => {
    if (selectedDate) {
      // Calculate costs for each machine before sending to report
      const reportData = machineData.map(machine => ({
        ...machine,
        // Calculate cost based on energy (using fixed rate of 12.5 rupees per kWh)
        cost: parseFloat((machine.energy * 12.5).toFixed(2))
      }));
      
      console.log('Sending data to report:', reportData);
      
      navigate('/supervisor/energy-monitoring-bel/report', { 
        state: { 
          date: selectedDate.format('YYYY-MM-DD'),
          machineData: reportData,
          returnPath: '/supervisor/energy-monitoring-bel/machines'
        } 
      });
    }
  };

  const getGaugeOptions = (machine) => ({
    chart: {
      type: 'solidgauge',
      height: '200px',
      backgroundColor: 'transparent',
      animation: {
        duration: 300, // Reduced animation duration for more stability
        easing: 'linear' // Changed to linear easing for less bouncing
      }
    },
    title: {
      text: machine.machine_name,
      style: { fontSize: '16px', fontWeight: '600' }
    },
    pane: {
      center: ['50%', '50%'],
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: [{
        backgroundColor: '#EEE',
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc',
        borderWidth: 0
      }]
    },
    tooltip: {
      enabled: true,
      formatter: function() {
        return `<b>${machine.machine_name}</b><br/>
                Total Energy: ${typeof this.y === 'number' ? this.y.toFixed(3) : '0.000'} kWh<br/>
                Second Shift: ${typeof machine.second_shift === 'number' ? machine.second_shift.toFixed(3) : '0.000'} kWh<br/>
                Third Shift: ${typeof machine.third_shift === 'number' ? machine.third_shift.toFixed(3) : '0.000'} kWh`;
      }
    },
    yAxis: {
      min: 0,
      max: machine.max_energy,
      stops: [
        [0.1, '#34D399'], // Green for low energy
        [0.5, '#FBBF24'], // Yellow for medium energy
        [0.9, '#EF4444']  // Red for high energy
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      labels: {
        y: 16,
        style: {
          fontSize: '12px'
        }
      }
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: -25,
          borderWidth: 0,
          useHTML: true
        },
        animation: {
          duration: 300 // Match chart animation duration
        }
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      name: 'Total Energy',
      data: [machine.energy],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:20px;color:black">{y:.3f}</span><br/>' +
               '<span style="font-size:12px;color:silver">kWh</span></div>'
      }
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
          {isLive ? 'Live Energy Monitoring' : 'Historical Energy Data'}
        </Title>
        <Space size="middle">
          <DatePicker 
            value={selectedDate}
            onChange={handleDateChange}
            style={{ width: '150px' }}
            placeholder="Select date"
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
            disabled={!selectedDate || machineData.length === 0}
            style={{
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb'
            }}
          >
            View Report
          </Button>
        </Space>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <Text>Loading machine energy data...</Text>
        </div>
      )}

      {/* No data message */}
      {!isLoading && selectedDate && machineData.length === 0 && (
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
            No energy monitoring data available for {selectedDate.format('MMMM D, YYYY')}
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

      {/* Machine Gauge Charts Grid - only show if there's data */}
      {machineData.length > 0 && (
        <Row gutter={[16, 16]}>
          {machineData.map((machine) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={machine.id}>
              <Card 
                className="shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ 
                  borderRadius: '8px',
                  height: '100%'
                }}
              >
                <HighchartsReact
                  highcharts={Highcharts}
                  options={getGaugeOptions(machine)}
                  immutable={true}
                  updateArgs={[true, false, false]}
                />
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <div style={{ 
                    background: '#f9fafb',
                    padding: '12px',
                    borderRadius: '8px',
                    marginTop: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <Text type="secondary">Total Energy:</Text>
                      <Text strong style={{ color: '#059669' }}>
                        {machine.energy.toFixed(3)} kWh
                      </Text>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      {/* <Text type="secondary">Second Shift:</Text>
                      <Text strong style={{ color: '#059669' }}>
                        {machine.second_shift.toFixed(3)} kWh
                      </Text> */}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Live indicator */}
      {isLive && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          background: '#22c55e',
          padding: '8px 16px',
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
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