import React from 'react';
import { Card, Row, Col, Typography, Tag, Progress, Tooltip, Space } from 'antd';
import { Clock, Activity, Box, AlertTriangle } from 'lucide-react';
import moment from 'moment';

const { Text, Title } = Typography;

const MachineStatusGrid = ({ machines }) => {
  const getStatusColor = (status) => {
    const statusMap = {
      'RUNNING': '#52c41a',
      'IDLE': '#faad14',
      'STOPPED': '#ff4d4f',
      'MAINTENANCE': '#1890ff',
      'OFFLINE': '#d9d9d9'
    };
    return statusMap[status] || '#d9d9d9';
  };

  const getUptime = (lastUpdated) => {
    return moment(lastUpdated).fromNow();
  };

  return (
    <Row gutter={[16, 16]}>
      {machines.map((machine) => (
        <Col xs={24} sm={12} md={8} lg={6} key={machine.machine_id}>
          <Card 
            hoverable
            className="h-full"
            bodyStyle={{ padding: '16px' }}
          >
            <Space direction="vertical" className="w-full">
              {/* Machine Header */}
              <Space className="w-full justify-between">
                <Title level={4} className="m-0">{machine.machine_name}</Title>
                <Tag color={getStatusColor(machine.status)}>
                  {machine.status}
                </Tag>
              </Space>

              {/* Program Info */}
              <Space direction="vertical" className="w-full">
                <Text type="secondary">Active Program: </Text>
                <Tag>{machine.active_program || 'No Program'}</Tag>
                
                <Text type="secondary">Program Number: </Text>
                <Tag>{machine.program_number || 'N/A'}</Tag>
              </Space>

              {/* Production Info */}
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between items-center">
                  <Text>Part Count:</Text>
                  <Text strong>{machine.part_count}</Text>
                </div>

                <Tooltip title="Job Progress">
                  <Progress 
                    percent={75} // Calculate based on part_count vs target
                    size="small"
                    status="active"
                  />
                </Tooltip>
              </Space>

              {/* Status Info */}
              <Space className="w-full justify-between">
                <Tooltip title="Last Updated">
                  <Space>
                    <Clock size={16} />
                    <Text type="secondary">{getUptime(machine.last_updated)}</Text>
                  </Space>
                </Tooltip>
                
                {machine.job_in_progress && (
                  <Tag color="blue">Job In Progress</Tag>
                )}
              </Space>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default MachineStatusGrid; 