import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
      padding: '4px 8px'
    }}
  >
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ 
        fontSize: '12px', 
        color: '#666',
        fontWeight: '500'
      }}>
        {title}
      </span>
      <span style={{ 
        fontSize: '12px',
        color: color,
        fontWeight: 'bold'
      }}>
        {value.toFixed(2)}{unit}
      </span>
    </div>
  </Card>
);

// Create a memoized chart component with ref
const MemoizedChart = React.memo(({ options }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance();
      chart.setOption(options, {
        replaceMerge: ['series', 'xAxis', 'yAxis'],
        animation: true,
        animationDuration: 300
      });
    }
  }, [options]);

  return (
    <ReactECharts
      ref={chartRef}
      option={options}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
      notMerge={false}
    />
  );
});

// Create a memoized timeline controls component
const TimelineControls = React.memo(({ 
  selectedParameter, 
  onParameterChange, 
  isLive, 
  startTime, 
  endTime, 
  onDateChange, 
  onLiveToggle 
}) => (
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
        onChange={onParameterChange}
        options={PARAMETER_OPTIONS}
        size="small"
      />
      
      {!isLive && (
        <DatePicker.RangePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          value={[startTime, endTime]}
          onChange={onDateChange}
          size="small"
          style={{ width: '300px' }}
        />
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px' }}>Live</span>
        <Switch
          checked={isLive}
          onChange={onLiveToggle}
          size="small"
        />
      </div>
    </div>
  </div>
));

const MachineOverlay = ({ machineId, machineName, onBack }) => {
  const { 
    clearMachineData,
    connectToParametersStream,
    cleanupParametersStream,
    connectToParameterHistoryStream,
    fetchParameterHistory,
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

  // Memoize handlers
  const handleParameterChange = useCallback((value) => {
    setSelectedParameter(value);
  }, []);

  const handleLiveToggle = useCallback((checked) => {
    setIsLive(checked);
    if (checked) {
      setStartTime(null);
      setEndTime(null);
      const newHistoryStream = connectToParameterHistoryStream(machineId, selectedParameter);
      setHistoryEventSource(newHistoryStream);
    } else if (historyEventSource) {
      historyEventSource.close();
      setHistoryEventSource(null);
    }
  }, [machineId, selectedParameter, historyEventSource]);

  const handleDateChange = useCallback((dates) => {
    if (dates && dates.length === 2) {
      setStartTime(dates[0]);
      setEndTime(dates[1]);
      // Fetch historical data without triggering full page refresh
      fetchParameterHistory(machineId, selectedParameter, dates[0], dates[1])
        .catch(error => {
          console.error('Error fetching historical data:', error);
        });
    } else {
      setStartTime(null);
      setEndTime(null);
    }
  }, [machineId, selectedParameter, fetchParameterHistory]);

  // Modify the useEffect for parameter history to prevent unnecessary re-renders
  useEffect(() => {
    let newHistoryStream = null;

    if (isLive) {
      if (historyEventSource) {
        historyEventSource.close();
      }
      newHistoryStream = connectToParameterHistoryStream(machineId, selectedParameter);
      setHistoryEventSource(newHistoryStream);
    }

    return () => {
      if (newHistoryStream) {
        newHistoryStream.close();
      }
    };
  }, [machineId, selectedParameter, isLive]);

  // Separate useEffect for handling date range changes
  useEffect(() => {
    if (!isLive && startTime && endTime) {
      fetchParameterHistory(machineId, selectedParameter, startTime, endTime)
        .catch(error => {
          console.error('Error fetching historical data:', error);
        });
    }
  }, [isLive, startTime, endTime, machineId, selectedParameter, fetchParameterHistory]);

  // Memoize chart options with optimized update logic
  const chartOptions = useMemo(() => {
    const selectedParam = PARAMETER_OPTIONS.find(p => p.value === selectedParameter);
    const unit = selectedParam ? selectedParam.label.match(/\((.*?)\)/)?.[1] || '' : '';

    const baseOptions = {
      grid: {
        top: 50,
        right: 30,
        bottom: 50,
        left: 60,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: 12,
          fontWeight: 'bold'
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
          fontSize: 12,
          color: '#666',
          rotate: 45,
          margin: 12,
          fontWeight: 'bold'
        },
        axisLine: {
          lineStyle: {
            color: '#666',
            width: 2
          }
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12,
          color: '#666',
          fontWeight: 'bold',
          formatter: `{value} ${unit}`
        },
        splitLine: {
          lineStyle: {
            color: '#ddd',
            type: 'solid',
            width: 1
          }
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#666',
            width: 2
          }
        },
        axisTick: {
          show: false
        }
      },
      series: [{
        name: selectedParam?.label || selectedParameter,
        type: 'line',
        step: 'middle',
        data: parameterHistoryData.map(d => d.value),
        smooth: false,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: '#1890ff'
        },
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
          },
          lineStyle: {
            width: 3,
            color: '#1890ff'
          }
        }
      }],
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicInOut',
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 0,
          borderColor: 'transparent',
          backgroundColor: '#f0f2f5',
          fillerColor: 'rgba(24, 144, 255, 0.1)',
          handleStyle: {
            color: '#1890ff',
            borderColor: '#1890ff'
          },
          moveHandleStyle: {
            color: '#1890ff',
            borderColor: '#1890ff'
          }
        }
      ]
    };

    if (!isLive && (!parameterHistoryData || parameterHistoryData.length === 0)) {
      return {
        ...baseOptions,
        graphic: [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'No data available for the selected time range',
            fontSize: 16,
            fontWeight: 'bold',
            fill: '#999'
          }
        }]
      };
    }

    return baseOptions;
  }, [selectedParameter, parameterHistoryData, isLive]);

  const handleBack = () => {
    clearMachineData();
    onBack();
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
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
                title={<span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b4e8f' }}>Voltage Parameters</span>}
                style={{ 
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #f5f3f8 0%, #f8f9fa 100%)',
                  border: '2px solid #6b4e8f',
                  boxShadow: '0 4px 12px rgba(107, 78, 143, 0.15)',
                  borderRadius: '8px'
                }}
                headStyle={{
                  background: 'rgba(107, 78, 143, 0.08)',
                  borderBottom: '2px solid #6b4e8f',
                  padding: '12px 16px'
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
                title={<span style={{ fontSize: '14px', fontWeight: 'bold', color: '#8c6d3f' }}>Current Parameters</span>}
                style={{ 
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #f8f6f2 0%, #f9f7f5 100%)',
                  border: '2px solid #8c6d3f',
                  boxShadow: '0 4px 12px rgba(140, 109, 63, 0.15)',
                  borderRadius: '8px'
                }}
                headStyle={{
                  background: 'rgba(140, 109, 63, 0.08)',
                  borderBottom: '2px solid #8c6d3f',
                  padding: '12px 16px'
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
                title={<span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a6b8a' }}>Power & Frequency</span>}
                style={{ 
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #f2f5f8 0%, #f5f7f9 100%)',
                  border: '2px solid #4a6b8a',
                  boxShadow: '0 4px 12px rgba(74, 107, 138, 0.15)',
                  borderRadius: '8px'
                }}
                headStyle={{
                  background: 'rgba(74, 107, 138, 0.08)',
                  borderBottom: '2px solid #4a6b8a',
                  padding: '12px 16px'
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
                      title="Total Power" 
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
<br></br>
          {/* Production Timeline */}
          <Card style={{ marginTop: '4px' }}>
            <TimelineControls
              selectedParameter={selectedParameter}
              onParameterChange={handleParameterChange}
              isLive={isLive}
              startTime={startTime}
              endTime={endTime}
              onDateChange={handleDateChange}
              onLiveToggle={handleLiveToggle}
            />
            <div style={{ height: '300px', width: '100%' }}>
              <MemoizedChart
                options={chartOptions}
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

export default React.memo(MachineOverlay); 