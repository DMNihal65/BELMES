import React from 'react';
import { Card, Row, Col, Space, Statistic, Progress, Tag, Tooltip } from 'antd';
import { Line } from '@ant-design/plots';

const OEEDashboard = ({ machines, historicalData }) => {
  // Filter out machines without OEE data
  const validMachines = machines.filter(machine => machine.oee?.overall);

  const getOEEColor = (value) => {
    if (value >= 85) return '#3f8600';
    if (value >= 70) return '#faad14';
    return '#cf1322';
  };

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        {validMachines.map(machine => (
          <Col span={8} key={machine.id}>
            <Card 
              title={machine.name} 
              className="hover:shadow-lg transition-shadow"
              extra={
                <Tag color={machine.status === 'running' ? 'green' : 'red'}>
                  {machine.status.toUpperCase()}
                </Tag>
              }
            >
              <Space direction="vertical" className="w-full">
                <Statistic
                  title="Overall OEE"
                  value={machine.oee.overall}
                  suffix="%"
                  valueStyle={{ color: getOEEColor(machine.oee.overall) }}
                />
                <div className="space-y-2">
                  <Tooltip title="Target: 90%">
                    <Progress 
                      percent={machine.oee.availability}
                      status="active"
                      size="small"
                      format={percent => `Availability: ${percent}%`}
                    />
                  </Tooltip>
                  <Tooltip title="Target: 95%">
                    <Progress 
                      percent={machine.oee.performance}
                      status="active"
                      size="small"
                      format={percent => `Performance: ${percent}%`}
                    />
                  </Tooltip>
                  <Tooltip title="Target: 99%">
                    <Progress 
                      percent={machine.oee.quality}
                      status="active"
                      size="small"
                      format={percent => `Quality: ${percent}%`}
                    />
                  </Tooltip>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Card title="OEE Trends">
        <Line
          data={historicalData}
          xField="date"
          yField="oee"
          point={{
            size: 5,
            shape: 'diamond',
          }}
          label={{
            style: {
              fill: '#aaa',
            },
          }}
          annotations={[
            {
              type: 'line',
              start: ['min', 85],
              end: ['max', 85],
              style: {
                stroke: '#ff4d4f',
                lineDash: [4, 4],
              },
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default OEEDashboard; 