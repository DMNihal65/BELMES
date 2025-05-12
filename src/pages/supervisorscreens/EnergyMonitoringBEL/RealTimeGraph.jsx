import React, { useEffect, useState, useCallback } from 'react';
// import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Badge, Space, Alert, Select, DatePicker, Button } from 'antd';
import { ThunderboltOutlined, SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  const handleLiveToggle = () => {
    setIsLive(!isLive);
    if (!isLive) {
      setDateRange(null); // Clear date range when going live
      setChartData([]); // Clear chart data
      setChartError(null); // Clear any chart errors
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

  // Handle filtered history data submission
  const handleSubmitFilteredData = async () => {
    if (!selectedParameter || !dateRange || !dateRange[0] || !dateRange[1]) {
      setChartError("Please select a parameter and date range");
      return;
    }

    setChartLoading(true);
    setChartError(null);
    setChartData([]);

    try {
      const data = await fetchFilteredHistoryData(
        machineId, 
        dateRange[0], 
        dateRange[1], 
        selectedParameter
      );

      // Check the response structure
      if (!data) {
        throw new Error("Empty response received from the server");
      }

      // Check for data property
      let dataPoints = [];
      if (data.data && Array.isArray(data.data)) {
        dataPoints = data.data;
      } else if (Array.isArray(data)) {
        dataPoints = data;
      } else {
        console.error("Unexpected data structure:", data);
        throw new Error("Data structure is not in the expected format");
      }

      if (dataPoints.length === 0) {
        throw new Error("No data points available for the selected criteria");
      }

      // Sort data points by timestamp to ensure proper stepline rendering
      dataPoints.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      // Format data for chart
      const formattedData = dataPoints.map((point, index) => {
        // Format timestamp for display
        let formattedTimestamp;
        try {
          const date = new Date(point.timestamp);
          formattedTimestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
          formattedTimestamp = `Point ${index + 1}`;
        }
        
        // Ensure value is a proper number
        let numericValue;
        if (typeof point.value === 'string') {
          numericValue = parseFloat(point.value);
        } else if (typeof point.value === 'number') {
          numericValue = point.value;
        } else {
          // Get default value based on parameter type
          switch(selectedParameter) {
            case 'phaseAVoltage':
            case 'phaseBVoltage':
            case 'phaseCVoltage':
            case 'avgPhaseVoltage':
              numericValue = 220;
              break;
            case 'frequency':
              numericValue = 50;
              break;
            case 'powerFactor':
              numericValue = 0.9;
              break;
            case 'totalInstantaneousPower':
              numericValue = 8;
              break;
            default:
              numericValue = 100;
          }
        }
        
        return {
          key: index,
          timestamp: formattedTimestamp,
          rawTimestamp: point.timestamp,
          value: isNaN(numericValue) ? getDefaultValue(selectedParameter) : numericValue
        };
      });
      
      if (formattedData.length === 0) {
        setChartError("No valid data points available for the selected date range");
        setChartData([]);
      } else {
        setChartData(formattedData);
      }
    } catch (error) {
      setChartError(error.message || "Failed to fetch filtered history data");
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

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

  // Handle live data effect
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
  }, [isLive, parameters, selectedParameter, getDefaultValue]);

  // Clear chart when changing parameter in live mode
  useEffect(() => {
    if (isLive) {
      setChartData([]);
    }
  }, [selectedParameter, isLive]);

  // Validate date range
  const isDateRangeValid = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return false;
    }
    
    // Check if start date is before end date
    return dateRange[0].isBefore(dateRange[1]) || dateRange[0].isSame(dateRange[1], 'day');
  };

  // Disable submit button if parameters are invalid
  const isSubmitDisabled = () => {
    if (isLive) return true;
    if (!selectedParameter) return true;
    if (!isDateRangeValid()) return true;
    return false;
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
            <Space size="middle" wrap>
              <Select
                style={{ width: 200 }}
                placeholder="Select Parameter"
                value={selectedParameter}
                onChange={setSelectedParameter}
                allowClear={false}
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
                    allowClear
                  />
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />}
                    onClick={handleSubmitFilteredData}
                    disabled={isSubmitDisabled()}
                    loading={chartLoading}
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
                disabled={!selectedParameter}
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
          minHeight: '300px',
          border: '1px solid #e2e8f0'
        }}>
          {chartLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <Spin size="large" />
            </div>
          ) : chartError ? (
            <Alert 
              message="Error" 
              description={chartError} 
              type="error" 
              showIcon 
            />
          ) : chartData.length > 0 ? (
            <>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>
                  {selectedParameter && getParameterDisplayName(selectedParameter)}
                  {!isLive && dateRange && dateRange[0] && dateRange[1] && ` - ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`}
                </Text>
                {isLive && (
                  <Badge status="processing" text="Live Data" style={{ color: '#22c55e' }} />
                )}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {chartData.length > 0 ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tick={{ fontSize: 12 }}
                      label={{ 
                        value: 'Time', 
                        position: 'insideBottomRight', 
                        offset: 0,
                        fontSize: 12
                      }}
                    />
                    <YAxis 
                      label={{ 
                        value: getParameterDisplayName(selectedParameter).split(' ')[0], 
                        angle: -90, 
                        position: 'insideLeft',
                        fontSize: 12
                      }}
                      domain={[
                        dataMin => Math.floor(dataMin * 0.9), // Start at 90% of minimum value
                        dataMax => Math.ceil(dataMax * 1.1)  // End at 110% of maximum value
                      ]}
                      tickFormatter={(value) => value.toFixed(1)}
                    />
                    <Tooltip
                      formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, getParameterDisplayName(selectedParameter).split(' ')[0]]}
                      labelFormatter={(label) => label}
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Line 
                      type="stepAfter" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      activeDot={{ r: 6 }} 
                      name={selectedParameter && getParameterDisplayName(selectedParameter)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </LineChart>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Text type="secondary">No data to display</Text>
                  </div>
                )}
              </ResponsiveContainer>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '300px' 
            }}>
              {selectedParameter ? (
                <Text type="secondary">
                  {isLive ? 
                    'Waiting for live data...' : 
                    'Select a date range, then click Submit to view historical data'}
                </Text>
              ) : (
                <Text type="secondary">
                  Please select a parameter first
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