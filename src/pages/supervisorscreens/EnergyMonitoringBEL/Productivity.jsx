import React, { useState } from 'react';
import { Typography, Button, Space, Card, Row, Col, DatePicker } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsMore from 'highcharts/highcharts-more';
import solidGauge from 'highcharts/modules/solid-gauge';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

// Initialize Highcharts modules
highchartsMore(Highcharts);
solidGauge(Highcharts);

const { Title, Text } = Typography;

const Productivity = ({ onBack }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLive, setIsLive] = useState(true);

  // Mock data for 14 machines
  const machineData = Array.from({ length: 14 }, (_, index) => ({
    id: index + 1,
    machine_name: `Machine ${index + 1}`,
    energy: Math.random() * 100, // Random energy value between 0 and 100
    cost: Math.random() * 1000, // Random cost value between 0 and 1000
    max_energy: 100 // Maximum energy threshold
  }));

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsLive(!date);
  };

  const handleGoLive = () => {
    setSelectedDate(null);
    setIsLive(true);
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
          Machine Energy Monitoring
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
    </div>
  );
};

export default Productivity; 