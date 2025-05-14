import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Card, Row, Col, DatePicker } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsMore from 'highcharts/highcharts-more';
import solidGauge from 'highcharts/modules/solid-gauge';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBel';

// Initialize Highcharts modules
highchartsMore(Highcharts);
solidGauge(Highcharts);

const { Title, Text } = Typography;

const Productivity = ({ onBack }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [machineData, setMachineData] = useState([]);
  
  // Get functions and state from the store
  const { 
    connectShiftwiseEnergyWebSocket, 
    disconnectShiftwiseEnergyWebSocket,
    getMachineEnergyData,
    fetchMachineNames,
    machineNames,
    isLoading
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
    const updateMachineData = () => {
      // Get machine names from store or use a default list
      const machines = machineNames && machineNames.length > 0 ? 
        machineNames : 
        Array.from({ length: 14 }, (_, index) => ({
          machine_id: index + 1,
          machine_data: { id: index + 1 }
        }));
      
      // Map machine names to machine data with energy values
      const updatedMachineData = machines.map(machine => {
        const id = machine.machine_id;
        const name = machine.machine_data?.work_center ? 
          `Machine ${machine.machine_data.work_center}` : 
          `Machine ${id}`;
        
        // Get energy data from WebSocket data in the store
        const energyData = getMachineEnergyData(id);
        
        return {
          id,
          machine_name: name,
          energy: energyData.energy,
          cost: energyData.cost,
          max_energy: energyData.max_energy
        };
      });
      
      setMachineData(updatedMachineData);
    };
    
    // Update data immediately
    updateMachineData();
    
    // Set interval to update data every 5 seconds if in live mode
    let interval;
    if (isLive) {
      interval = setInterval(updateMachineData, 5000);
    }
    
    // Clean up interval
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [getMachineEnergyData, isLive, machineNames]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsLive(!date);
    
    if (!date) {
      // If returning to live mode, reconnect WebSocket
      connectShiftwiseEnergyWebSocket();
    } else {
      // If switching to history mode, disconnect WebSocket
      disconnectShiftwiseEnergyWebSocket();
      
      // In a real implementation, you would fetch historical data for the selected date
      // For now, we'll just use mock data
      const mockHistoryData = Array.from({ length: 14 }, (_, index) => ({
        id: index + 1,
        machine_name: `Machine ${index + 1}`,
        energy: Math.random() * 80 + 10, // Random energy between 10 and 90
        cost: Math.random() * 800 + 100, // Random cost between 100 and 900
        max_energy: 100
      }));
      
      setMachineData(mockHistoryData);
    }
  };

  const handleGoLive = () => {
    setSelectedDate(null);
    setIsLive(true);
    connectShiftwiseEnergyWebSocket();
  };

  const handleViewReport = () => {
    if (selectedDate) {
      navigate('/supervisor/energy-monitoring-bel/report', { 
        state: { 
          date: selectedDate.format('YYYY-MM-DD'),
          machineData: machineData,
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
                Energy: ${this.y.toFixed(2)} kWh<br/>
                Cost: ₹${machine.cost.toFixed(2)}`;
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
        }
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      name: 'Energy',
      data: [machine.energy],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:20px;color:black">{y:.1f}</span><br/>' +
               '<span style="font-size:12px;color:silver">kWh</span></div>'
      }
    }]
  });

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
            disabled={!selectedDate}
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
      {isLoading && machineData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <Text>Loading machine energy data...</Text>
        </div>
      )}

      {/* Machine Gauge Charts Grid */}
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
                    <Text type="secondary">Energy:</Text>
                    <Text strong style={{ color: '#059669' }}>
                      {machine.energy.toFixed(2)} kWh
                    </Text>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <Text type="secondary">Cost:</Text>
                    <Text strong style={{ color: '#059669' }}>
                      ₹{machine.cost.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      
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