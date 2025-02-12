import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Timeline } from 'antd';
import { Settings, Activity, Clock, AlertOctagon } from 'lucide-react';

const Overview = () => {
  const maintenanceStats = {
    totalMachines: 24,
    scheduledMaintenance: 8,
    ongoingMaintenance: 3,
    completedToday: 5,
    upcomingTasks: 12,
    criticalAlerts: 2,
    mtbf: '168h',
    mttr: '4.5h'
  };

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card bordered={false} className="h-full">
            <Statistic 
              title="Equipment Health Score"
              value={85}
              suffix="%"
              prefix={<Settings size={20} />}
            />
            <Progress percent={85} status="active" strokeColor="#1890ff" />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic 
                  title="MTBF"
                  value={maintenanceStats.mtbf}
                  prefix={<Clock size={16} />}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="MTTR"
                  value={maintenanceStats.mttr}
                  prefix={<Activity size={16} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic 
              title="Critical Issues"
              value={maintenanceStats.criticalAlerts}
              prefix={<AlertOctagon size={20} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Equipment Status">
            <div className="grid grid-cols-2 gap-4">
              {['CNC Machine', 'Lathe Machine', 'Milling Machine', 'Grinding Machine'].map((machine) => (
                <Card key={machine} className="bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{machine}</span>
                    <Tag color="green">Operational</Tag>
                  </div>
                  <Progress percent={Math.floor(Math.random() * 30) + 70} size="small" />
                </Card>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Recent Activities">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: 'Preventive maintenance completed on CNC Machine 01',
                },
                {
                  color: 'blue',
                  children: 'Scheduled maintenance for Lathe Machine 03',
                },
                {
                  color: 'red',
                  children: 'Critical alert: Hydraulic pressure low on Machine 05',
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview; 