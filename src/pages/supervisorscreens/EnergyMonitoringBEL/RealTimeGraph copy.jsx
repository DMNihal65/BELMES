import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin } from 'antd';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBEL';

const { Title, Text } = Typography;

const RealTimeGraph = ({ machineId, machineName }) => {
  const { fetchMachineLiveData, getMachineParameters, isLoading } = useEnergyMonitoringBelStore();
  const [parameters, setParameters] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  useEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      try {
        await fetchMachineLiveData(machineId);
        const newParams = getMachineParameters(machineId);
        
        // Only update if we have data
        if (newParams) {
          setParameters(newParams);
          
          // After first successful load, mark initial load as complete
          if (initialLoad) {
            setInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    // Fetch data immediately
    fetchData();
    
    // Then set up polling interval
    const intervalId = setInterval(fetchData, 5000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchMachineLiveData, getMachineParameters, machineId, initialLoad]);
  
  // Helper function for status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 0: return { text: 'Off', color: '#94A3B8' };
      case 1: return { text: 'Idle/On', color: '#eab308' };
      case 2: return { text: 'Production', color: '#22c55e' };
      default: return { text: 'Unknown', color: '#64748B' };
    }
  };
  
  // Helper function to get value color
  const getValueColor = (value, min, max) => {
    if (value === undefined || value === null) return '#64748B';
    
    const percent = (value - min) / (max - min);
    if (percent < 0.33) return '#ef4444'; // Red for low values
    if (percent < 0.66) return '#eab308'; // Yellow for medium values
    return '#22c55e'; // Green for high values
  };
  
  // If we're in the initial loading state
  if (initialLoad || !parameters) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin />
      </div>
    );
  }
  
  // Get status info once we have parameters
  const statusInfo = getStatusInfo(parameters.status);
  
  return (
    <div style={{ padding: '16px' }}>
      {/* Header with status */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>{machineName}</Title>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: statusInfo.color,
                  marginRight: '8px'
                }}
              ></div>
              <Text strong style={{ color: statusInfo.color }}>{statusInfo.text}</Text>
            </div>
          </Col>
          <Col>
            <Text type="secondary">
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </Col>
        </Row>
      </Card>
      
      {/* Main content */}
      <Row gutter={[16, 16]}>
        {/* Voltage Card */}
        <Col xs={24} lg={8}>
          <Card title="Voltage Parameters">
            <ParamRow 
              label="Phase A" 
              value={parameters.phaseAVoltage} 
              unit="V" 
              color={getValueColor(parameters.phaseAVoltage, 200, 240)} 
            />
            <ParamRow 
              label="Phase B" 
              value={parameters.phaseBVoltage} 
              unit="V" 
              color={getValueColor(parameters.phaseBVoltage, 200, 240)} 
            />
            <ParamRow 
              label="Phase C" 
              value={parameters.phaseCVoltage} 
              unit="V" 
              color={getValueColor(parameters.phaseCVoltage, 200, 240)} 
            />
            <ParamRow 
              label="Avg Phase" 
              value={parameters.avgPhaseVoltage} 
              unit="V" 
              color={getValueColor(parameters.avgPhaseVoltage, 200, 240)} 
            />
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #f0f0f0' }} />
            <ParamRow 
              label="Line AB" 
              value={parameters.lineABVoltage} 
              unit="V" 
              color={getValueColor(parameters.lineABVoltage, 360, 420)} 
            />
            <ParamRow 
              label="Line BC" 
              value={parameters.lineBCVoltage} 
              unit="V" 
              color={getValueColor(parameters.lineBCVoltage, 360, 420)} 
            />
            <ParamRow 
              label="Line CA" 
              value={parameters.lineCAVoltage} 
              unit="V" 
              color={getValueColor(parameters.lineCAVoltage, 360, 420)} 
            />
            <ParamRow 
              label="Avg Line" 
              value={parameters.avgLineVoltage} 
              unit="V" 
              color={getValueColor(parameters.avgLineVoltage, 360, 420)} 
            />
          </Card>
        </Col>
        
        {/* Current Card */}
        <Col xs={24} lg={8}>
          <Card title="Current Parameters">
            <ParamRow 
              label="Phase A" 
              value={parameters.phaseACurrent} 
              unit="A" 
              color={getValueColor(parameters.phaseACurrent, 5, 15)} 
            />
            <ParamRow 
              label="Phase B" 
              value={parameters.phaseBCurrent} 
              unit="A" 
              color={getValueColor(parameters.phaseBCurrent, 5, 15)} 
            />
            <ParamRow 
              label="Phase C" 
              value={parameters.phaseCCurrent} 
              unit="A" 
              color={getValueColor(parameters.phaseCCurrent, 5, 15)} 
            />
            <ParamRow 
              label="Avg Current" 
              value={parameters.avgThreePhaseCurrent} 
              unit="A" 
              color={getValueColor(parameters.avgThreePhaseCurrent, 5, 15)} 
            />
          </Card>
        </Col>
        
        {/* Power Card */}
        <Col xs={24} lg={8}>
          <Card title="Power Parameters">
            <ParamRow 
              label="Power Factor" 
              value={parameters.powerFactor} 
              unit="" 
              color={getValueColor(parameters.powerFactor, 0.7, 1)} 
            />
            <ParamRow 
              label="Frequency" 
              value={parameters.frequency} 
              unit="Hz" 
              color={getValueColor(parameters.frequency, 49.8, 50.2)} 
            />
            <ParamRow 
              label="Total Power" 
              value={parameters.totalInstantaneousPower} 
              unit="kW" 
              color={getValueColor(parameters.totalInstantaneousPower, 0, 15)} 
            />
            <ParamRow 
              label="Energy Delivered" 
              value={parameters.activeEnergyDelivered} 
              unit="kWh" 
              color={getValueColor(parameters.activeEnergyDelivered, 100, 500)} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Simple helper component for parameter rows
const ParamRow = ({ label, value, unit, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
    <Text>{label}:</Text>
    <Text strong style={{ color }}>
      {value !== undefined && value !== null ? `${value.toFixed(2)}${unit}` : '--'}
    </Text>
  </div>
);

export default RealTimeGraph; 