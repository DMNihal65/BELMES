import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { Line, Bar } from '@ant-design/plots';

const MaintenanceAnalytics = () => {
  // Mock data for charts
  const maintenanceData = {
    mtbf: {
      data: [
        { month: 'Jan', hours: 168 },
        { month: 'Feb', hours: 180 },
        { month: 'Mar', hours: 175 },
        // Add more data points
      ]
    },
    downtime: {
      data: [
        { machine: 'CNC Machine 01', hours: 12 },
        { machine: 'Lathe Machine 03', hours: 8 },
        { machine: 'Milling Machine 02', hours: 15 },
        // Add more data points
      ]
    }
  };

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Mean Time Between Failures (MTBF)">
            <Line
              data={maintenanceData.mtbf.data}
              xField="month"
              yField="hours"
              point={{ size: 5 }}
              label={{ style: { fill: '#aaa' } }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Machine Downtime">
            <Bar
              data={maintenanceData.downtime.data}
              xField="hours"
              yField="machine"
              seriesField="machine"
              label={{ position: 'right' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MaintenanceAnalytics; 