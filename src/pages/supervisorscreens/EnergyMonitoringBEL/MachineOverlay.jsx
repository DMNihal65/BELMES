import React, { useState, useEffect } from 'react';
import { Tabs, Button, Typography, Card, Row, Col, Statistic, Spin, Select } from 'antd';
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
      title={title}
      value={value}
      precision={2}
      suffix={unit}
      valueStyle={{ 
        fontSize: '12px',
        color: color
      }}
    />
  </Card>
);

const MachineOverlay = ({ machineId, machineName, onBack }) => {
  const { 
    clearMachineData,
    connectToParametersStream,
    cleanupParametersStream,
    machineParameters,
    isLoading 
  } = useEnergyMonitoringBelStore();
  const [activeTab, setActiveTab] = useState('1');
  const [chartData, setChartData] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState('total_instantaneous_power');

  // Connect to Parameters Stream when component mounts
  useEffect(() => {
    console.log(`Initializing parameters stream for machine ${machineId}`);
    const parametersStream = connectToParametersStream(machineId);
    
    // Clean up function
    return () => {
      console.log(`Cleaning up parameters stream for machine ${machineId}`);
      cleanupParametersStream();
      clearMachineData();
    };
  }, [machineId, clearMachineData, connectToParametersStream, cleanupParametersStream]);

  // Update chart data when parameters change
  useEffect(() => {
    if (machineParameters) {
      const now = new Date();
      const formattedTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const newDataPoint = {
        key: Date.now(),
        timestamp: formattedTimestamp,
        value: machineParameters[selectedParameter] || 0
      };
      
      setChartData(prevData => {
        const newData = [...prevData, newDataPoint];
        return newData.length > 20 ? newData.slice(-20) : newData;
      });
    }
  }, [machineParameters, selectedParameter]);

  const handleBack = () => {
    clearMachineData();
    onBack();
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleParameterChange = (value) => {
    setSelectedParameter(value);
    setChartData([]); // Clear existing data when parameter changes
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
        data: chartData.map(d => d.timestamp),
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
        data: chartData.map(d => d.value),
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
          <Row gutter={[4, 4]} style={{ marginBottom: '4px' }}>
            <Col span={12}>
              <EnergyMetricCard 
                title="Total Instantaneous Power"
                value={machineParameters?.total_instantaneous_power || 0}
                unit="kW"
                icon={<ThunderboltOutlined style={{ fontSize: '12px', color: 'white' }} />}
                color="#1890ff"
              />
            </Col>
            <Col span={12}>
              <EnergyMetricCard 
                title="Active Energy Delivered"
                value={machineParameters?.active_energy_delivered || 0}
                unit="kWh"
                icon={<ThunderboltOutlined style={{ fontSize: '12px', color: 'white' }} />}
                color="#52c41a"
              />
            </Col>
          </Row>

          {/* Other Parameters Grid */}
          <Row gutter={[4, 4]}>
            {/* Voltage Parameters */}
            <Col span={6}>
              <ParameterCard 
                title="Phase A Voltage" 
                value={machineParameters?.phase_a_voltage || 0} 
                unit="V"
                color="#722ed1"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Phase B Voltage" 
                value={machineParameters?.phase_b_voltage || 0} 
                unit="V"
                color="#722ed1"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Phase C Voltage" 
                value={machineParameters?.phase_c_voltage || 0} 
                unit="V"
                color="#722ed1"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Average Phase Voltage" 
                value={machineParameters?.avg_phase_voltage || 0} 
                unit="V"
                color="#722ed1"
              />
            </Col>

            {/* Line Voltage Parameters */}
            <Col span={6}>
              <ParameterCard 
                title="Line AB Voltage" 
                value={machineParameters?.line_ab_voltage || 0} 
                unit="V"
                color="#eb2f96"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Line BC Voltage" 
                value={machineParameters?.line_bc_voltage || 0} 
                unit="V"
                color="#eb2f96"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Line CA Voltage" 
                value={machineParameters?.line_ca_voltage || 0} 
                unit="V"
                color="#eb2f96"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Average Line Voltage" 
                value={machineParameters?.avg_line_voltage || 0} 
                unit="V"
                color="#eb2f96"
              />
            </Col>

            {/* Current Parameters */}
            <Col span={6}>
              <ParameterCard 
                title="Phase A Current" 
                value={machineParameters?.phase_a_current || 0} 
                unit="A"
                color="#fa8c16"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Phase B Current" 
                value={machineParameters?.phase_b_current || 0} 
                unit="A"
                color="#fa8c16"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Phase C Current" 
                value={machineParameters?.phase_c_current || 0} 
                unit="A"
                color="#fa8c16"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Average Three Phase Current" 
                value={machineParameters?.avg_three_phase_current || 0} 
                unit="A"
                color="#fa8c16"
              />
            </Col>

            {/* Final Parameters */}
            <Col span={6}>
              <ParameterCard 
                title="Power Factor" 
                value={machineParameters?.power_factor || 0} 
                unit=""
                color="#2f54eb"
              />
            </Col>
            <Col span={6}>
              <ParameterCard 
                title="Frequency" 
                value={machineParameters?.frequency || 0} 
                unit="Hz"
                color="#2f54eb"
              />
            </Col>
          </Row>

          {/* Production Timeline */}
          <Card style={{ marginTop: '4px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Production Timeline</Title>
              <Select
                style={{ width: '180px' }}
                value={selectedParameter}
                onChange={handleParameterChange}
                options={PARAMETER_OPTIONS}
                size="small"
              />
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