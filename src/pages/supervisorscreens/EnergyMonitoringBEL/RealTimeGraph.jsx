import React, { useEffect, useState } from 'react';
// import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Badge, Space, Alert, Select, DatePicker, Button } from 'antd';
import { ThunderboltOutlined, SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBel';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const RealTimeGraph = ({ machineId, machineName }) => {
  const { fetchMachineLiveData, getMachineParameters, isLoading } = useEnergyMonitoringBelStore();
  const [parameters, setParameters] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const handleLiveToggle = () => {
    setIsLive(!isLive);
    if (!isLive) {
      setDateRange(null); // Clear date range when going live
    }
  };

  // Effect to fetch machine data and update parameter history
  useEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      try {
        setApiError(null); // Clear any previous errors
        await fetchMachineLiveData(machineId);
        const newParams = getMachineParameters(machineId);
        
        if (newParams) {
          setParameters(newParams);
          
          if (initialLoad) {
            setInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("Error fetching machine data:", error);
        setApiError(error.message || "Failed to fetch machine data");
        
        // Still set any mock data that might be available
        const newParams = getMachineParameters(machineId);
        if (newParams) {
          setParameters(newParams);
        }
      }
    };
    
    // Fetch initial data
    fetchData();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(fetchData, 5000);
    
    return () => clearInterval(intervalId);
  }, [fetchMachineLiveData, getMachineParameters, machineId]);

  // Add a separate effect to handle initialLoad state
  useEffect(() => {
    if (initialLoad && parameters) {
      setInitialLoad(false);
    }
  }, [initialLoad, parameters]);

  // Helper function for status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 0: return { 
        text: 'Off', 
        color: '#94A3B8',
        badgeStatus: 'default',
        bgColor: '#F1F5F9'
      };
      case 1: return { 
        text: 'Idle/On', 
        color: '#eab308',
        badgeStatus: 'warning',
        bgColor: '#FEF9C3'
      };
      case 2: return { 
        text: 'Production', 
        color: '#22c55e',
        badgeStatus: 'success',
        bgColor: '#DCFCE7'
      };
      default: return { 
        text: 'Unknown', 
        color: '#64748B',
        badgeStatus: 'default',
        bgColor: '#F1F5F9'
      };
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
  
  // Helper to format value with unit
  const formatValue = (value, unit, precision = 2) => {
    if (value === undefined || value === null || isNaN(value) || typeof value !== 'number') {
      return '--';
    }
    try {
      return `${value.toFixed(precision)}${unit}`;
    } catch (error) {
      console.warn('Error formatting value:', value, error);
      return `${value}${unit}`;
    }
  };
  
  // If we're in the initial loading state
  if (initialLoad || !parameters) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <Text type="secondary">Loading machine data...</Text>
      </div>
    );
  }
  
  // Get status info once we have parameters
  const statusInfo = getStatusInfo(parameters.status);
  
  // Add error display to your UI
  if (apiError) {
    return (
      <Alert
        message="Data Connection Error"
        description={
          <div>
            <p>{apiError}</p>
            <p>Using fallback data for visualization. Some values may not be current.</p>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    );
  }
  
  return (
    <div style={{ padding: '0 8px' }}>
      <Card 
        style={{ 
          marginBottom: '16px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {/* Header with machine name and status */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Space align="center">
              <Badge status={statusInfo.badgeStatus} dot size="large" />
              <Title level={4} style={{ margin: 0 }}>{machineName}</Title>
              <Text strong style={{ 
                color: statusInfo.color,
                marginLeft: '8px',
                backgroundColor: statusInfo.bgColor,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {statusInfo.text}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Text type="secondary">
                Updated: {new Date().toLocaleTimeString()}
              </Text>
              {parameters.status === 2 && (
                <Badge
                  count="Live"
                  style={{ backgroundColor: '#22c55e' }}
                />
              )}
            </Space>
          </Col>
        </Row>

        {/* Four cards layout */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                background: '#f0f9ff',
                height: '100%'
              }}
              bodyStyle={{ 
                padding: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#3b82f6' }}>
                    Average Voltage
                  </Text>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    color: getValueColor(parameters.avgPhaseVoltage, 200, 240),
                    margin: '8px 0'
                  }}>
                    {formatValue(parameters.avgPhaseVoltage, 'V', 1)}
                  </div>
                </div>
                <div style={{ fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Phase A:</Text>
                    <Text strong style={{ color: getValueColor(parameters.phaseAVoltage, 200, 240) }}>
                      {formatValue(parameters.phaseAVoltage, 'V')}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Phase B:</Text>
                    <Text strong style={{ color: getValueColor(parameters.phaseBVoltage, 200, 240) }}>
                      {formatValue(parameters.phaseBVoltage, 'V')}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Phase C:</Text>
                    <Text strong style={{ color: getValueColor(parameters.phaseCVoltage, 200, 240) }}>
                      {formatValue(parameters.phaseCVoltage, 'V')}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                background: '#faf5ff',
                height: '100%'
              }}
              bodyStyle={{ 
                padding: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#8b5cf6' }}>
                    Average Current
                  </Text>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    color: getValueColor(parameters.avgThreePhaseCurrent, 5, 15),
                    margin: '8px 0'
                  }}>
                    {formatValue(parameters.avgThreePhaseCurrent, 'A', 1)}
                  </div>
                </div>
                <div style={{ fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Phase A:</Text>
                    <Text strong style={{ color: getValueColor(parameters.phaseACurrent, 5, 15) }}>
                      {formatValue(parameters.phaseACurrent, 'A')}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Phase B:</Text>
                    <Text strong style={{ color: getValueColor(parameters.phaseBCurrent, 5, 15) }}>
                      {formatValue(parameters.phaseBCurrent, 'A')}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Phase C:</Text>
                    <Text strong style={{ color: getValueColor(parameters.phaseCCurrent, 5, 15) }}>
                      {formatValue(parameters.phaseCCurrent, 'A')}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                background: '#fff1f2',
                height: '100%'
              }}
              bodyStyle={{ 
                padding: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#ef4444' }}>
                    Power
                  </Text>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    color: getValueColor(parameters.totalInstantaneousPower, 0, 15),
                    margin: '8px 0'
                  }}>
                    {formatValue(parameters.totalInstantaneousPower, 'kW', 1)}
                  </div>
                </div>
                <div style={{ fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Power Factor:</Text>
                    <Text strong style={{ color: getValueColor(parameters.powerFactor, 0.7, 1) }}>
                      {formatValue(parameters.powerFactor, '')}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Frequency:</Text>
                    <Text strong style={{ color: getValueColor(parameters.frequency, 49.8, 50.2) }}>
                      {formatValue(parameters.frequency, 'Hz')}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                background: '#f0fdf4',
                height: '100%'
              }}
              bodyStyle={{ 
                padding: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#22c55e' }}>
                    Energy
                  </Text>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    color: getValueColor(parameters.activeEnergyDelivered, 100, 500),
                    margin: '8px 0'
                  }}>
                    {formatValue(parameters.activeEnergyDelivered, 'kWh', 1)}
                  </div>
                </div>
                <div style={{ fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Today's Usage:</Text>
                    <Text strong style={{ color: getValueColor(parameters.activeEnergyDelivered, 100, 500) }}>
                      {formatValue(parameters.activeEnergyDelivered, 'kWh')}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* New Production Timeline Card */}
      <Card
        style={{
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}
      >
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>Production Timeline</Title>
            <Text type="secondary">{machineName}</Text>
          </Col>
          <Col>
            <Space size="middle">
              <Select
                style={{ width: 200 }}
                placeholder="Select Parameter"
                value={selectedParameter}
                onChange={setSelectedParameter}
              >
                <Option value="phaseAVoltage">Phase A Voltage</Option>
                <Option value="phaseBVoltage">Phase B Voltage</Option>
                <Option value="phaseCVoltage">Phase C Voltage</Option>
                <Option value="avgPhaseVoltage">Avg Phase Voltage</Option>
                <Option value="lineABVoltage">Line AB Voltage</Option>
                <Option value="lineBCVoltage">Line BC Voltage</Option>
                <Option value="lineCAVoltage">Line CA Voltage</Option>
                <Option value="avgLineVoltage">Avg Line Voltage</Option>
                <Option value="phaseACurrent">Phase A Current</Option>
                <Option value="phaseBCurrent">Phase B Current</Option>
                <Option value="phaseCCurrent">Phase C Current</Option>
                <Option value="avgThreePhaseCurrent">Avg Current</Option>
                <Option value="powerFactor">Power Factor</Option>
                <Option value="frequency">Frequency</Option>
                <Option value="totalInstantaneousPower">Total Power</Option>
                <Option value="activeEnergyDelivered">Energy Delivered</Option>
              </Select>
              
              {!isLive && (
                <>
                  <RangePicker 
                    style={{ width: 280 }}
                    onChange={setDateRange}
                    value={dateRange}
                  />
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />}
                    onClick={() => {
                      // Handle submit
                      console.log('Selected Parameter:', selectedParameter);
                      console.log('Date Range:', dateRange);
                    }}
                  >
                    Submit
                  </Button>
                </>
              )}
              
              <Button 
                type={isLive ? "primary" : "default"}
                icon={<PlayCircleOutlined />}
                style={{ 
                  ...(isLive && {
                    backgroundColor: '#22c55e',
                    borderColor: '#22c55e'
                  })
                }}
                onClick={handleLiveToggle}
              >
                {isLive ? 'Live' : 'Go Live'}
              </Button>
            </Space>
          </Col>
        </Row>
        <div style={{ 
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '6px',
          minHeight: '100px'
        }}>
          <Text>
            {isLive ? 
              'Showing live production timeline data...' : 
              'Showing historical production timeline data...'}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RealTimeGraph; 