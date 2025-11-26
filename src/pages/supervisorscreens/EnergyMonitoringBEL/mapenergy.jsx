import React, { useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import * as echarts from 'echarts';
import useEnergyStore from '../../../store/energyMonitoring';
import Machines from './machines';

const { Title } = Typography;

const EnergyMonitoring = () => {
  const chartRef = useRef(null);
  const { totalEnergy, fetchEnergyData, fetchMachines } = useEnergyStore();
  const [showMachines, setShowMachines] = useState(false);

  useEffect(() => {
    // Initial fetchMap and Energy
    fetchEnergyData();
    
    // Set up polling interval for 1 hour (3600000 milliseconds)
    const interval = setInterval(fetchEnergyData, 3600000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchEnergyData]);

  useEffect(() => {
    if (chartRef.current) {
      const chartDom = chartRef.current;
      const myChart = echarts.init(chartDom);
  
      const option = {
        tooltip: {
          formatter: '{a} <br/>{b} : {c}kWh',
        },
        series: [
          {
            name: 'Energy Usage',
            type: 'gauge',
            progress: {
              show: true,
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}kWh',
              fontSize: 20,
            },
            data: [
              {
                value: totalEnergy,
                name: 'Total Energy',
              },
            ],
            min: 0,
            max: totalEnergy > 50 ? totalEnergy + 10 : 50,
          },
        ],
      };
  
      myChart.setOption(option);
      window.addEventListener('resize', () => myChart.resize());
  
      return () => {
        window.removeEventListener('resize', () => myChart.resize());
        myChart.dispose();
      };
    }
  }, [totalEnergy]);

  const handleShowMachines = () => {
    fetchMachines();  // Fetch machines data when button is clicked
    setShowMachines(true);
  };

  return (
    <div className="energy-monitoring-container">
      {showMachines ? (
        <Machines onBack={() => setShowMachines(false)} />
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <Title level={2}>Map and Energy</Title>
            <Button 
              type="primary" 
              onClick={handleShowMachines}
              style={{
                backgroundColor: '#1890ff',
                borderRadius: '6px'
              }}
            >
              Show Machines
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center', 
                  marginBottom: '20px' 
                }}>
                  <Typography.Text 
                    strong 
                    style={{ 
                      fontSize: '24px',
                      textAlign: 'center'
                    }}
                  >
                    Map and Energy
                  </Typography.Text>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '500px',
                  }}
                >
                  <div
                    style={{
                      width: '50%',
                      height: '100%',
                      padding: '20px',
                    }}
                  >
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.6893831246395!2d77.55545081482372!3d13.048934890807095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae3d86f5fd8be5%3A0xaf067c9cab2ccfe8!2sBEL%20Main%20Gate!5e0!3m2!1sen!2sin!4v1710234789012!5m2!1sen!2sin"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="eager"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div
                    ref={chartRef}
                    style={{
                      width: '45%',
                      height: '100%',
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default EnergyMonitoring;
