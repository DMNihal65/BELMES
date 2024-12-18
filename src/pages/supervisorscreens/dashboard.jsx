import React from 'react';
import { Card, Col, Row, Button, Statistic } from 'antd';
import { Settings, AlertCircle, Activity } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function Dashboard() {
  const location = useLocation();
  const isOperator = location.pathname.includes('/operator');

  const currentJob = {
    jobId: 'JOB-2024-0345',
    partDescription: 'Precision Turbine Blade',
    status: 'IDLE',
    alerts: 3
  };

  const keyMetrics = {
    efficiency: 85,
    productivity: 92,
    quality: 95
  };

  if (isOperator) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Operator Dashboard</h1>
        </div>

        <Row gutter={[16, 16]}>
          {/* Status Card */}
          <Col span={8}>
            <Card className="h-full">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Settings size={40} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Status</h3>
                <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  {currentJob.status}
                </div>
                <Button type="primary" className="mt-4 w-full">
                  View Details
                </Button>
              </div>
            </Card>
          </Col>

          {/* Alert Counts Card */}
          <Col span={8}>
            <Card className="h-full">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Alert Counts</h3>
                <div className="text-2xl font-bold text-red-500">
                  {currentJob.alerts}
                </div>
                <Button type="default" className="mt-4 w-full">
                  View Alerts
                </Button>
              </div>
            </Card>
          </Col>

          {/* Key Metrics Card */}
          <Col span={8}>
            <Card className="h-full">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Activity size={40} className="text-green-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
                <div className="space-y-2">
                  <Statistic title="Efficiency" value={keyMetrics.efficiency} suffix="%" />
                  <Statistic title="Productivity" value={keyMetrics.productivity} suffix="%" />
                  <Statistic title="Quality" value={keyMetrics.quality} suffix="%" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Machine Details Card */}
        <Card className="mt-6">
          <h3 className="text-lg font-medium mb-4">Alerts and Machine Specific Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Current Job ID: {currentJob.jobId}</p>
                <p className="text-gray-600">Part Description: {currentJob.partDescription}</p>
              </div>
              <Button type="primary">Job Details</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Return supervisor dashboard or default dashboard
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
      {/* Add supervisor dashboard content here */}
    </div>
  );
}

export default Dashboard;