import React, { useState, useEffect } from 'react';
import { Tabs, Button, Typography, Card, Row, Col, Statistic, Spin, Select, DatePicker, Switch } from 'antd';
import { ArrowLeftOutlined, LineChartOutlined, BarChartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBEL';

const { Title } = Typography;
const { Option } = Select;

// Parameter options for the dropdown
const PARAMETER_OPTIONS = [
  { value: 'phase_a_voltage', label: 'Phase A Voltage (V)' },
  { value: 'phase_b_voltage', label: 'Phase B Voltage (V)' },
  { value: 'phase_c_voltage', label: 'Phase C Voltage (V)' },
  { value: 'avg_phase_voltage', label: 'Average Phase Voltage (V)' },
  { value: 'line_ab_voltage', label: 'Line AB Voltage (V)' },
  { value: 'line_bc_voltage', label: 'Line BC Voltage (V)' },
  { value: 'line_ca_voltage', label: 'Line CA Voltage (V)' },
  { value: 'avg_line_voltage', label: 'Average Line Voltage (V)' },
  { value: 'phase_a_current', label: 'Phase A Current (A)' },
  { value: 'phase_b_current', label: 'Phase B Current (A)' },
  { value: 'phase_c_current', label: 'Phase C Current (A)' },
  { value: 'avg_three_phase_current', label: 'Average Three Phase Current (A)' },
  { value: 'power_factor', label: 'Power Factor' },
  { value: 'frequency', label: 'Frequency (Hz)' },
  { value: 'total_instantaneous_power', label: 'Total Instantaneous Power (kW)' },
  { value: 'active_energy_delivered', label: 'Active Energy Delivered (kWh)' }
];

// Energy Metric Card Component
const EnergyMetricCard = ({ title, value, unit, icon, color }) => (
  <Card 
    style={{ 
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      borderRadius: '6px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      padding: '2px'
    }}
  >
    <Statistic
      title={<span style={{ color: 'white', fontSize: '10px' }}>{title}</span>}
      value={value}
      precision={2}
      suffix={unit}
      valueStyle={{ 
        color: 'white', 
        fontSize: '14px',
        fontWeight: 'bold'
      }}
      prefix={icon}
    />
  </Card>
);

// Parameter Card Component
const ParameterCard = ({ title, value, unit, color }) => (
  <Card 
    size="small" 
    style={{ 
      marginBottom: '2px',
      borderRadius: '4px',
      borderLeft: `2px solid ${color}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      padding: '2px'
    }}
  >
    <Statistic
      title={<span style={{ fontSize: '10px' }}>{title}</span>}
      value={value}
      precision={2}
      suffix={unit}
      valueStyle={{ 
        fontSize: '11px',
        color: color,
        fontWeight: 'bold'
      }}
    />
  </Card>
);

const MachineOverlay = ({ machineId, machineName, onBack }) => {
  const { 
    clearMachineData,
    connectToParametersStream,
    cleanupParametersStream,
    connectToParameterHistoryStream,
    machineParameters,
    parameterHistoryData,
    isLoading 
  } = useEnergyMonitoringBelStore();
  const [activeTab, setActiveTab] = useState('1');
  const [selectedParameter, setSelectedParameter] = useState('phase_b_voltage');
  const [isLive, setIsLive] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [historyEventSource, setHistoryEventSource] = useState(null);

  // Connect to Parameters Stream when component mounts
  useEffect(() => {
    console.log(`Initializing parameters stream for machine ${machineId}`);
    const parametersStream = connectToParametersStream(machineId);
    
    // Clean up function
    return () => {
      console.log(`Cleaning up parameters stream for machine ${machineId}`);
      cleanupParametersStream();
      clearMachineData();
      // Clean up history stream if it exists
      if (historyEventSource) {
        historyEventSource.close();
      }
    };
  }, [machineId, clearMachineData, connectToParametersStream, cleanupParametersStream]);

  // Connect to parameter history stream when parameter changes or live mode is toggled
  useEffect(() => {
    if (isLive) {
      console.log(`Connecting to parameter history stream for ${selectedParameter}`);
      // Close existing history stream if any
      if (historyEventSource) {
        historyEventSource.close();
      }
      const newHistoryStream = connectToParameterHistoryStream(machineId, selectedParameter);
      setHistoryEventSource(newHistoryStream);
    } else if (historyEventSource) {
      // Close history stream when switching to non-live mode
      historyEventSource.close();
      setHistoryEventSource(null);
    }
  }, [machineId, selectedParameter, isLive, connectToParameterHistoryStream]);

  const handleBack = () => {
    clearMachineData();
    onBack();
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleParameterChange = (value) => {
    setSelectedParameter(value);
  };

  const handleLiveToggle = (checked) => {
    setIsLive(checked);
    if (checked) {
      setStartTime(null);
      setEndTime(null);
      // Reconnect to parameter history stream when switching to live mode
      const newHistoryStream = connectToParameterHistoryStream(machineId, selectedParameter);
      setHistoryEventSource(newHistoryStream);
    } else if (historyEventSource) {
      // Close history stream when switching to non-live mode
      historyEventSource.close();
      setHistoryEventSource(null);
    }
  };

  // ECharts options for the stepline chart
  const getChartOptions = () => {
    const selectedParam = PARAMETER_OPTIONS.find(p => p.value === selectedParameter);
    const unit = selectedParam ? selectedParam.label.match(/\((.*?)\)/)?.[1] || '' : '';

    return {
      grid: {
        top: 50,
        right: 30,
        bottom: 50,
        left: 60,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        },
        formatter: function(params) {
          const param = params[0];
          return `<div style="font-weight: bold; margin-bottom: 4px;">${param.name}</div>
                  <div style="display: flex; align-items: center;">
                    <span style="display: inline-block; width: 10px; height: 10px; background: #1890ff; margin-right: 8px;"></span>
                    <span>${param.value} ${unit}</span>
                  </div>`;
        }
      },
      xAxis: {
        type: 'category',
        data: parameterHistoryData.map(d => d.timestamp),
        axisLabel: {
          fontSize: 11,
          color: '#666',
          rotate: 45,
          margin: 12
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11,
          color: '#666',
          formatter: `{value} ${unit}`
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'dashed'
          }
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      },
      series: [{
        name: selectedParam?.label || selectedParameter,
        type: 'line',
        step: 'end',
        data: parameterHistoryData.map(d => d.value),
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#1890ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(24, 144, 255, 0.2)'
            }, {
              offset: 1,
              color: 'rgba(24, 144, 255, 0.05)'
            }]
          }
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: '#1890ff'
          }
        }
      }],
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicInOut'
    };
  };

  // Define items for the Tabs component
  const items = [
    {
      key: '1',
      label: (
        <span>
          <LineChartOutlined /> Overview
        </span>
      ),
      children: (
        <div style={{ padding: '8px' }}>
          {/* Energy Metrics Section */}
          

          {/* Other Parameters Grid */}
          <Row gutter={[8, 8]}>
            {/* Voltage Parameters Card */}
            <Col span={8}>
              <Card 
                size="small" 
                title={<span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b4e8f' }}>Voltage Parameters</span>}
                style={{ 
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #f5f3f8 0%, #f8f9fa 100%)',
                  border: '1px solid #e8e4f0',
                  boxShadow: '0 2px 8px rgba(107, 78, 143, 0.06)'
                }}
                headStyle={{
                  background: 'rgba(107, 78, 143, 0.03)',
                  borderBottom: '1px solid #e8e4f0'
                }}
              >
                <Row gutter={[2, 2]}>
                  <Col span={12}>
                    <ParameterCard 
                      title="Phase A V" 
                      value={machineParameters?.phase_a_voltage || 0} 
                      unit="V"
                      color="#722ed1"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Phase B V" 
                      value={machineParameters?.phase_b_voltage || 0} 
                      unit="V"
                      color="#722ed1"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Phase C V" 
                      value={machineParameters?.phase_c_voltage || 0} 
                      unit="V"
                      color="#722ed1"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Avg Phase V" 
                      value={machineParameters?.avg_phase_voltage || 0} 
                      unit="V"
                      color="#722ed1"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Line AB V" 
                      value={machineParameters?.line_ab_voltage || 0} 
                      unit="V"
                      color="#eb2f96"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Line BC V" 
                      value={machineParameters?.line_bc_voltage || 0} 
                      unit="V"
                      color="#eb2f96"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Line CA V" 
                      value={machineParameters?.line_ca_voltage || 0} 
                      unit="V"
                      color="#eb2f96"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Avg Line V" 
                      value={machineParameters?.avg_line_voltage || 0} 
                      unit="V"
                      color="#eb2f96"
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Current Parameters Card */}
            <Col span={8}>
              <Card 
                size="small" 
                title={<span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8c6d3f' }}>Current Parameters</span>}
                style={{ 
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #f8f6f2 0%, #f9f7f5 100%)',
                  border: '1px solid #e8e0d0',
                  boxShadow: '0 2px 8px rgba(140, 109, 63, 0.06)'
                }}
                headStyle={{
                  background: 'rgba(140, 109, 63, 0.03)',
                  borderBottom: '1px solid #e8e0d0'
                }}
              >
                <Row gutter={[2, 2]}>
                  <Col span={12}>
                    <ParameterCard 
                      title="Phase A A" 
                      value={machineParameters?.phase_a_current || 0} 
                      unit="A"
                      color="#fa8c16"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Phase B A" 
                      value={machineParameters?.phase_b_current || 0} 
                      unit="A"
                      color="#fa8c16"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Phase C A" 
                      value={machineParameters?.phase_c_current || 0} 
                      unit="A"
                      color="#fa8c16"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Avg 3P A" 
                      value={machineParameters?.avg_three_phase_current || 0} 
                      unit="A"
                      color="#fa8c16"
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Power & Frequency Parameters Card */}
            <Col span={8}>
              <Card 
                size="small" 
                title={<span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a6b8a' }}>Power & Frequency</span>}
                style={{ 
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #f2f5f8 0%, #f5f7f9 100%)',
                  border: '1px solid #dce4ed',
                  boxShadow: '0 2px 8px rgba(74, 107, 138, 0.06)'
                }}
                headStyle={{
                  background: 'rgba(74, 107, 138, 0.03)',
                  borderBottom: '1px solid #dce4ed'
                }}
              >
                <Row gutter={[2, 2]}>
                  <Col span={12}>
                    <ParameterCard 
                      title="Power Factor" 
                      value={machineParameters?.power_factor || 0} 
                      unit=""
                      color="#2f54eb"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Frequency" 
                      value={machineParameters?.frequency || 0} 
                      unit="Hz"
                      color="#2f54eb"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Total Powexr" 
                      value={machineParameters?.total_instantaneous_power || 0} 
                      unit="kW"
                      color="#52c41a"
                    />
                  </Col>
                  <Col span={12}>
                    <ParameterCard 
                      title="Energy Delivered" 
                      value={machineParameters?.active_energy_delivered || 0} 
                      unit="kWh"
                      color="#52c41a"
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Production Timeline */}
          <Card style={{ marginTop: '4px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px',
              gap: '8px'
            }}>
              
              <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Production Timeline</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
              <Select
                  style={{ width: '180px' }}
                  value={selectedParameter}
                  onChange={handleParameterChange}
                  options={PARAMETER_OPTIONS}
                  size="small"
                />
                
                
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Start Time"
                  value={startTime}
                  onChange={setStartTime}
                  disabled={isLive}
                  size="small"
                  style={{ width: '150px' }}
                />
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="End Time"
                  value={endTime}
                  onChange={setEndTime}
                  disabled={isLive}
                  size="small"
                  style={{ width: '150px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px' }}>Live</span>
                  <Switch
                    checked={isLive}
                    onChange={handleLiveToggle}
                    size="small"
                  />
                </div>
              
              </div>
            </div>
            <div style={{ height: '250px', width: '100%' }}>
              <ReactECharts
                option={getChartOptions()}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </Card>
        </div>
      ),
    }
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '12px', 
      background: '#f0f2f5', 
      height: '100vh', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '12px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          Back
        </Button>
        <Title level={3} style={{ margin: 0 }}>{machineName || `Machine ${machineId}`}</Title>
        <div style={{ width: '80px' }}></div>
      </div>
      
      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: '12px',
        background: 'white',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Tabs 
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          style={{ overflow: 'hidden' }}
        />
      </div>
    </div>
  );
};

export default MachineOverlay; 