import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Card, Row, Col, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import useEnergyStore from '../../../store/energyMonitoring';

const { Title, Text } = Typography;

function MachineDetails() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machineName, setMachineName] = useState('');
  
  const { 
    machineDetails, 
    loading, 
    error,
    fetchMachineDetails,
    clearMachineDetails
  } = useEnergyStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMachineDetails(machineId);
        setMachineName(`Machine ${machineId}`);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearMachineDetails();
    };
  }, [machineId, fetchMachineDetails, clearMachineDetails]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Title level={4}>Error</Title>
          <Text type="danger">{error}</Text>
          <Button 
            type="primary" 
            onClick={() => navigate(-1)} 
            style={{ marginTop: '16px' }}
          >
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Title level={2} style={{ margin: 0 }}>{machineName}</Title>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <CustomGaugeChart 
                title="Current" 
                value={machineDetails?.current || 0} 
                unit="A" 
                color="#2563eb"
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <CustomGaugeChart 
                title="Power" 
                value={machineDetails?.power || 0} 
                unit="kW" 
                color="#16a34a"
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <CustomGaugeChart 
                title="Energy" 
                value={machineDetails?.energy || 0} 
                unit="kWh" 
                color="#9333ea"
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}

export default MachineDetails; 