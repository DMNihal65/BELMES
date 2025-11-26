import React, { useEffect, useState, useCallback } from 'react';
// import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Badge, Space, Alert, Select, DatePicker, Button } from 'antd';
import { ThunderboltOutlined, SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBEL';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const RealTimeGraph = ({ machineId, machineName }) => {
  const { 
    fetchMachineLiveData, 
    getMachineParameters,
    fetchFilteredHistoryData,
    isLoading 
  } = useEnergyMonitoringBelStore();
  const [parameters, setParameters] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState('avgPhaseVoltage');
  const [chartData, setChartData] = useState([]);
  const [chartError, setChartError] = useState(null);
  
  // Add states for historical data mode
  const [isLive, setIsLive] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [chartLoading, setChartLoading] = useState(false);

  // Toggle between live and historical data
  const handleLiveToggle = () => {
    setIsLive(!isLive);
    if (!isLive) {
      // When switching to live, clear chart and reset
      setChartData([]);
    }
  };

  // Handle filtered history data submission
  const handleSubmitFilteredData = async () => {
    if (!selectedParameter || !dateRange || !dateRange[0] || !dateRange[1]) {
      setChartError("Please select a parameter and date range");
      return;
    }

    setChartLoading(true);
    setChartError(null);
    setChartData([]);
    setIsLive(false); // Turn off live mode when historical data is requested

    try {
      // Map parameter names to backend format
      const apiParamMap = {
        'phaseAVoltage': 'phase_a_voltage',
        'phaseBVoltage': 'phase_b_voltage',
        'phaseCVoltage': 'phase_c_voltage',
        'avgPhaseVoltage': 'avg_phase_voltage',
        'lineABVoltage': 'line_ab_voltage',
        'lineBCVoltage': 'line_bc_voltage',
        'lineCAVoltage': 'line_ca_voltage',
        'avgLineVoltage': 'avg_line_voltage',
        'phaseACurrent': 'phase_a_current',
        'phaseBCurrent': 'phase_b_current',
        'phaseCCurrent': 'phase_c_current',
        'avgThreePhaseCurrent': 'avg_three_phase_current',
        'powerFactor': 'power_factor',
        'frequency': 'frequency',
        'totalInstantaneousPower': 'total_instantaneous_power',
        'activeEnergyDelivered': 'active_energy_delivered'
      };
      
      const apiParamName = apiParamMap[selectedParameter] || selectedParameter;

      console.log(`Fetching historical data for machine ${machineId}, parameter ${selectedParameter} (${apiParamName}), date range ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`);
      
      const data = await fetchFilteredHistoryData(
        machineId, 
        dateRange[0], 
        dateRange[1], 
        selectedParameter
      );

      // Check if data is empty or null
      if (!data || !Array.isArray(data) || data.length === 0) {
        setChartError(`No data available for the selected date range: ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`);
        setChartData([]);
        return;
      }

      // Process data as before
      const formattedData = data.map((point, index) => {
        let formattedTimestamp;
        try {
          const date = new Date(point.timestamp);
          formattedTimestamp = date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
          });
        } catch (error) {
          formattedTimestamp = `Point ${index + 1}`;
        }
        
        const paramValue = point[apiParamName];
        let numericValue;
        
        if (typeof paramValue === 'string') {
          numericValue = parseFloat(paramValue);
        } else if (typeof paramValue === 'number') {
          numericValue = paramValue;
        } else {
          numericValue = getDefaultValue(selectedParameter);
        }
        
        return {
          key: index,
          timestamp: formattedTimestamp,
          rawTimestamp: point.timestamp,
          value: isNaN(numericValue) ? getDefaultValue(selectedParameter) : numericValue
        };
      });

      if (formattedData.length === 0) {
        setChartError(`No valid data points available for ${getParameterDisplayName(selectedParameter)} between ${dateRange[0].format('YYYY-MM-DD')} and ${dateRange[1].format('YYYY-MM-DD')}`);
        setChartData([]);
      } else {
        setChartData(formattedData);
      }
    } catch (error) {
      console.error("Error in handleSubmitFilteredData:", error);
      setChartError(error.message || "Failed to fetch filtered history data");
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  // Get default value for a parameter type
  const getDefaultValue = useCallback((paramKey) => {
    switch(paramKey) {
      case 'phaseAVoltage':
      case 'phaseBVoltage':
      case 'phaseCVoltage':
      case 'avgPhaseVoltage':
        return 220;
      case 'lineABVoltage':
      case 'lineBCVoltage':
      case 'lineCAVoltage':
      case 'avgLineVoltage':
        return 380;
      case 'phaseACurrent':
      case 'phaseBCurrent':
      case 'phaseCCurrent':
      case 'avgThreePhaseCurrent':
        return 10;
      case 'powerFactor':
        return 0.9;
      case 'frequency':
        return 50;
      case 'totalInstantaneousPower':
        return 8;
      case 'activeEnergyDelivered':
        return 350;
      default:
        return 100;
    }
  }, []);

  // Get parameter display name
  const getParameterDisplayName = (paramKey) => {
    const parameterMap = {
      'phaseAVoltage': 'Phase A Voltage (V)',
      'phaseBVoltage': 'Phase B Voltage (V)',
      'phaseCVoltage': 'Phase C Voltage (V)',
      'avgPhaseVoltage': 'Avg Phase Voltage (V)',
      'lineABVoltage': 'Line AB Voltage (V)',
      'lineBCVoltage': 'Line BC Voltage (V)',
      'lineCAVoltage': 'Line CA Voltage (V)',
      'avgLineVoltage': 'Avg Line Voltage (V)',
      'phaseACurrent': 'Phase A Current (A)',
      'phaseBCurrent': 'Phase B Current (A)',
      'phaseCCurrent': 'Phase C Current (A)',
      'avgThreePhaseCurrent': 'Avg Current (A)',
      'powerFactor': 'Power Factor',
      'frequency': 'Frequency (Hz)',
      'totalInstantaneousPower': 'Total Power (kW)',
      'activeEnergyDelivered': 'Energy Delivered (kWh)'
    };
    
    return parameterMap[paramKey] || paramKey;
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
    
    return () => {}; // No cleanup needed for intervals
  }, [fetchMachineLiveData, getMachineParameters, machineId]);

  // Handle live data effect - only run when isLive is true
  useEffect(() => {
    if (isLive && selectedParameter && parameters) {
      // When in live mode, update chart with current value
      const paramValue = parameters[selectedParameter];
      let numericValue;
      
      if (typeof paramValue === 'string') {
        numericValue = parseFloat(paramValue);
      } else if (typeof paramValue === 'number') {
        numericValue = paramValue;
      } else {
        numericValue = getDefaultValue(selectedParameter);
      }
      
      if (numericValue !== undefined && !isNaN(numericValue)) {
        const now = new Date();
        const formattedTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newDataPoint = {
          key: Date.now(),
          timestamp: formattedTimestamp,
          rawTimestamp: now.toISOString(),
          value: numericValue
        };
        
        setChartData(prevData => {
          const newData = [...prevData, newDataPoint];
          // Keep only the last 20 points for better visualization
          return newData.length > 20 ? newData.slice(-20) : newData;
        });
      }
    }
  }, [parameters, selectedParameter, getDefaultValue, isLive]);

  // Handle parameter changes in live mode
  useEffect(() => {
    if (isLive && parameters) {
      // When parameter selection changes, immediately add a data point for the new parameter
      const paramValue = parameters[selectedParameter];
      let numericValue;
      
      if (typeof paramValue === 'string') {
        numericValue = parseFloat(paramValue);
      } else if (typeof paramValue === 'number') {
        numericValue = paramValue;
      } else {
        numericValue = getDefaultValue(selectedParameter);
      }
      
      if (numericValue !== undefined && !isNaN(numericValue)) {
        const now = new Date();
        const formattedTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Reset chart data with just the current value for the new parameter
        setChartData([{
          key: Date.now(),
          timestamp: formattedTimestamp,
          rawTimestamp: now.toISOString(),
          value: numericValue
        }]);
      } else {
        // If there's no valid value, clear the chart
        setChartData([]);
      }
    }
  }, [selectedParameter, parameters, getDefaultValue, isLive]);

  // Validate date range
  const isDateRangeValid = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return false;
    }
    
    // Check if start date is before or equal to end date
    return dateRange[0].isBefore(dateRange[1]) || dateRange[0].isSame(dateRange[1], 'day');
  };

  // Disable submit button if parameters are invalid
  const isSubmitDisabled = () => {
    if (isLive) return true;
    if (!selectedParameter) return true;
    if (!isDateRangeValid()) return true;
    return false;
  };

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
    <div style={{ padding: '0 4px' }}>
      <Card 
        style={{ 
          marginBottom: '8px',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {/* Header with machine name and status */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '8px' }}>
          <Col xs={24} sm={16}>
            <Space align="center" wrap>
              <Badge status={statusInfo.badgeStatus} dot size="large" />
              <Title level={4} style={{ margin: 0, fontSize: '16px' }}>{machineName}</Title>
              <Text strong style={{ 
                color: statusInfo.color,
                marginLeft: '4px',
                backgroundColor: statusInfo.bgColor,
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {statusInfo.text}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space size="small" wrap style={{ justifyContent: 'flex-end' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
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
        <Row gutter={[8, 8]}>
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

      {/* Production Timeline Card */}
      <Card
        style={{
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '8px'
        }}
      >
        <Row justify="space-between" align="middle" style={{ marginBottom: '8px' }}>
          <Col xs={24} sm={12}>
            <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
              {isLive ? 'Live Production Timeline' : 'Historical Production Timeline'}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>{machineName}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Space size="small" wrap style={{ justifyContent: 'flex-end' }}>
              <Select
                style={{ width: '180px' }}
                placeholder="Select Parameter"
                value={selectedParameter}
                onChange={setSelectedParameter}
                allowClear={false}
                size="small"
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
              
              <RangePicker 
                style={{ width: '240px' }}
                onChange={setDateRange}
                value={dateRange}
                allowClear={false}
                disabled={isLive}
                size="small"
              />
              
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={handleSubmitFilteredData}
                disabled={isSubmitDisabled()}
                loading={chartLoading}
                size="small"
              >
                Submit
              </Button>
              
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
                size="small"
              >
                {isLive ? 'Live' : 'Go Live'}
              </Button>
            </Space>
          </Col>
        </Row>
        <div style={{ 
          padding: '8px',
          background: '#f8fafc',
          borderRadius: '4px',
          minHeight: '250px',
          border: '1px solid #e2e8f0'
        }}>
          {chartLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
              <Spin size="large" />
            </div>
          ) : chartError ? (
            <Alert 
              message="No Data Available"
              description={chartError}
              type="info" 
              showIcon 
              style={{
                margin: '16px',
                textAlign: 'center'
              }}
            />
          ) : chartData.length > 0 ? (
            <>
              <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '12px' }}>
                  {selectedParameter && getParameterDisplayName(selectedParameter)}
                  {!isLive && dateRange && dateRange[0] && dateRange[1] && ` - ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`}
                </Text>
                {isLive ? (
                  <Badge status="processing" text="Live Data" style={{ color: '#22c55e', fontSize: '12px' }} />
                ) : (
                  <Text type="secondary" style={{ fontSize: '12px' }}>Historical Data</Text>
                )}
              </div>
              <ResponsiveContainer width="100%" height={250} minHeight={250}>
                <LineChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  style={{ overflow: 'visible' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  
                  {/* X-axis displaying timestamps */}
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#64748b' }}
                    tickLine={{ stroke: '#64748b' }}
                    allowDataOverflow={false}
                    padding={{ left: 10, right: 10 }}
                    tickMargin={5}
                  />
                  
                  {/* Y-axis displaying parameter values */}
                  <YAxis 
                    label={{ 
                      value: getParameterDisplayName(selectedParameter).split(' ')[0], 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 0,
                      fontSize: 11,
                      fill: '#64748b'
                    }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => value.toFixed(1)}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#64748b' }}
                    tickLine={{ stroke: '#64748b' }}
                    allowDataOverflow={false}
                    padding={{ top: 10, bottom: 10 }}
                    tickMargin={5}
                  />
                  
                  <Tooltip
                    formatter={(value) => [
                      `${value.toFixed(2)} ${getParameterDisplayName(selectedParameter).split('(')[1]?.replace(')', '') || ''}`,
                      getParameterDisplayName(selectedParameter).split(' ')[0]
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      padding: '8px'
                    }}
                    isAnimationActive={false}
                    cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '5px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
                    iconSize={8}
                    verticalAlign="bottom"
                    height={20}
                  />
                  
                  <Line 
                    type="stepAfter" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    activeDot={{ r: 5, fill: '#8884d8', stroke: '#fff', strokeWidth: 2 }}
                    dot={{ r: 2.5, fill: '#8884d8', strokeWidth: 0 }}
                    name={getParameterDisplayName(selectedParameter)}
                    isAnimationActive={false}
                    connectNulls
                  />
                  
                  <Area 
                    type="stepAfter"
                    dataKey="value"
                    stroke="none"
                    fillOpacity={0.5}
                    fill="url(#colorValue)"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '250px',
              color: '#666'
            }}>
              <Text type="secondary" style={{ fontSize: '14px', marginBottom: '4px' }}>
                {isLive ? 'Waiting for live data...' : 'Select dates and click Submit to view historical data'}
              </Text>
              {!isLive && dateRange && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Date Range: {dateRange[0]?.format('YYYY-MM-DD')} to {dateRange[1]?.format('YYYY-MM-DD')}
                </Text>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RealTimeGraph; 