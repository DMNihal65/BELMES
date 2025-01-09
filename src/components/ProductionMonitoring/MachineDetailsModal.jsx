import React from 'react';
import { 
  Modal, Descriptions, Card, Row, Col, 
  Statistic, Progress, Timeline, Space, Tag, Typography 
} from 'antd';
import {
  ClockCircleOutlined,
  ToolOutlined,
  UserOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Text } = Typography;

const MachineDetailsModal = ({ machine, visible, onClose }) => {
  if (!machine) return null;

  return (
    <Modal
      title={`Machine Details - ${machine.name}`}
      visible={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <div className="space-y-6">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <Descriptions column={1}>
                <Descriptions.Item label="Machine ID">
                  {machine.id}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={machine.status === 'running' ? 'green' : 'red'}>
                    {machine.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Current Job">
                  {machine.currentJob}
                </Descriptions.Item>
                <Descriptions.Item label="Operation">
                  {machine.currentOperation}
                </Descriptions.Item>
                <Descriptions.Item label="Operator">
                  <Space>
                    <UserOutlined />
                    {machine.operator}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Current Performance">
              <Space direction="vertical" className="w-full">
                <Progress
                  percent={Math.round((machine.actualUnits / machine.plannedUnits) * 100)}
                  status="active"
                  format={percent => `Progress: ${percent}%`}
                />
                <Statistic
                  title="Planned vs Actual"
                  value={`${machine.actualUnits}/${machine.plannedUnits}`}
                  suffix="units"
                />
                <Statistic
                  title="Efficiency"
                  value={machine.efficiency}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                />
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="OEE Components">
              <Space direction="vertical" className="w-full">
                <Progress
                  percent={machine.oee.availability}
                  status="active"
                  format={percent => `Availability: ${percent}%`}
                />
                <Progress
                  percent={machine.oee.performance}
                  status="active"
                  format={percent => `Performance: ${percent}%`}
                />
                <Progress
                  percent={machine.oee.quality}
                  status="active"
                  format={percent => `Quality: ${percent}%`}
                />
                <Statistic
                  title="Overall OEE"
                  value={machine.oee.overall}
                  suffix="%"
                  valueStyle={{ color: machine.oee.overall >= 85 ? '#3f8600' : '#cf1322' }}
                />
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Maintenance Info">
              <Space direction="vertical" className="w-full">
                <Descriptions column={1}>
                  <Descriptions.Item label="Status">
                    <Tag color={machine.maintenanceStatus === 'Good' ? 'green' : 'red'}>
                      {machine.maintenanceStatus}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Next Maintenance">
                    <Space>
                      <ToolOutlined />
                      {moment(machine.nextMaintenance).format('YYYY-MM-DD')}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Downtime">
                    <Space direction="vertical">
                      <Text>Planned: {machine.downtime.planned} min</Text>
                      <Text>Unplanned: {machine.downtime.unplanned} min</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card title="Recent Activity">
          <Timeline>
            <Timeline.Item color="green">
              Machine started - {moment(machine.lastUpdated).format('HH:mm:ss')}
            </Timeline.Item>
            <Timeline.Item color="blue">
              Maintenance check - {moment(machine.lastUpdated).subtract(2, 'hours').format('HH:mm:ss')}
            </Timeline.Item>
            <Timeline.Item>
              Previous job completed - {moment(machine.lastUpdated).subtract(3, 'hours').format('HH:mm:ss')}
            </Timeline.Item>
          </Timeline>
        </Card>
      </div>
    </Modal>
  );
};

export default MachineDetailsModal; 