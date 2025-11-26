import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Typography, Card, Row, Col, Button, Space, Tabs } from 'antd';
import { 
  ArrowLeftOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import * as echarts from 'echarts';
import useEnergyStore from '../../../store/energyMonitoring';
import ProductionTimeline from './ProductionTimeline';
import RealtimeGraph from './RealtimeGraph';
import DetailGraph from './DetailGraph';
import Productivity from './Productivity';
import ProductionStatus from './ProductionStatus';

const { Title } = Typography;

// Create a new memoized component for live values
const LiveValue = React.memo(({ value, unit }) => (
  <span>{value} {unit}</span>
));

// Update the GaugeChart component to be more efficient
const GaugeChart = React.memo(({ title, value, unit, color }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart only once
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Update only the data instead of recreating the entire chart
    chartInstance.current.setOption({
      series: [{
        data: [{ value: value }]
      }]
    }, { notMerge: false });

  }, [value]); // Only depend on value changes

  // Initialize chart configuration once
  useEffect(() => {
    if (!chartRef.current || !chartInstance.current) return;

    const option = {
      tooltip: {
        formatter: `${title}<br/>${value} ${unit}`
      },
      series: [{
        name: title,
        type: 'gauge',
        progress: { show: true },
        detail: {
          valueAnimation: true,
          formatter: `{value} ${unit}`,
          fontSize: 20,
          color: color
        },
        data: [{ value: value, name: title }],
        axisLine: {
          lineStyle: {
            color: [[1, color]]
          }
        }
      }]
    };

    chartInstance.current.setOption(option);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []); // Empty dependency array for one-time setup

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />;
});

// Update MetricCard to be more efficient
const MetricCard = React.memo(({ icon, title, value, unit, color }) => (
  <Card
    title={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {icon}
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
      </div>
    }
    headStyle={{ background: '#f5f5f5' }}
  >
    <GaugeChart 
      value={value} 
      unit={unit} 
      color={color}
      title={title}
    />
  </Card>
), (prevProps, nextProps) => {
  // Only re-render if value changes
  return prevProps.value === nextProps.value;
});

function MachineOverlay({ machineId, machineName, onBack }) {
  const { fetchLiveData, liveData } = useEnergyStore();
  const pollingInterval = useRef(null);
  
  // Retrieve the initial tab from localStorage or default to 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(`machine_${machineId}_tab`) || 'overview';
  });

  // Memoize the machine data
  const machineData = useMemo(() => {
    return liveData[machineId] || {};
  }, [machineId, liveData]);

  useEffect(() => {
    fetchLiveData(machineId);
    
    pollingInterval.current = setInterval(() => {
      fetchLiveData(machineId);
    }, 10000);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [machineId, fetchLiveData]);

  // Update localStorage when tab changes
  const handleTabChange = (key) => {
    setActiveTab(key);
    localStorage.setItem(`machine_${machineId}_tab`, key); // Store the active tab in localStorage
  };

  const items = [
    {
      key: 'overview',
      label: (
        <span>
          <PieChartOutlined />
          Overview
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <MetricCard
                icon={<ThunderboltOutlined style={{ fontSize: '20px', color: '#faad14' }} />}
                title="Current"
                value={machineData.current || 0}
                unit="A"
                color="#666666"
              />
            </Col>
            <Col xs={24} md={8}>
              <MetricCard
                icon={<RocketOutlined style={{ fontSize: '20px', color: '#52c41a' }} />}
                title="Power"
                value={machineData.power || 0}
                unit="kW"
                color="#666666"
              />
            </Col>
            <Col xs={24} md={8}>
              <MetricCard
                icon={<BarChartOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                title="Energy"
                value={machineData.energy || 0}
                unit="kWh"
                color="#666666"
              />
            </Col>
          </Row>
          
          <Card
            title="Production Timeline"
            styles={{
              header: { background: '#f5f5f5' },
              body: { padding: '24px', minHeight: '300px' }
            }}
          >
            <ProductionTimeline machineId={machineId} />
          </Card>
        </Space>
      )
    },
    {
      key: 'realtime',
      label: (
        <span>
          <LineChartOutlined />
          Realtime Graph
        </span>
      ),
      children: <RealtimeGraph machineId={machineId} />
    },
    {
      key: 'detail',
      label: (
        <span>
          <AreaChartOutlined />
          Detail Graph
        </span>
      ),
      children: <DetailGraph machineId={machineId} />
    },
    {
      key: 'production-status',
      label: (
        <span>
          <BarChartOutlined />
          Production Status
        </span>
      ),
      children: <ProductionStatus machineId={machineId} />
    },
    {
      key: 'productivity',
      label: (
        <span>
          <ClockCircleOutlined />
          Productivity
        </span>
      ),
      children: <Productivity machineId={machineId} />
    }
  ];

  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(240, 242, 245, 0.8)',
      zIndex: 1000,
      padding: '24px',
      borderRadius: '8px',
      overflowY: 'auto'
    }}>
      <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
        DEBUG: Machine Overlay for ID: {machineId}, Name: {machineName}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <Space align="center" style={{ marginBottom: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onBack}
          >
            Back
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {machineName}
          </Title>
        </Space>
        
        <div style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '16px'
        }}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={items}
            type="card"
            animated={false}
            destroyInactiveTabPane={false}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(MachineOverlay, (prevProps, nextProps) => {
  return prevProps.machineId === nextProps.machineId;
});