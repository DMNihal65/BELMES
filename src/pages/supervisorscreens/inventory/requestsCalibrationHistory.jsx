import React, { useState } from 'react';
import { Tabs } from 'antd'; 
import Analytics from './Analytics/Analytics'; // Import Analytics component
import Requests from './Requests'; // Import Requests component
import Calibration from './Calibration'; // Import Calibration component
import History from './History'; // Import History component
const { TabPane } = Tabs;
const { Title } = Typography;

function RequestsCalibrationHistory() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Row gutter={[0, 24]}>
        <Col span={24}>
          <Card className="shadow-sm border-0">
            <div className="flex items-center mb-6">
              <DashboardOutlined className="text-2xl text-blue-600 mr-3" />
              <Title level={2} className="m-0">Inventory Management Dashboard</Title>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              size="large"
              className="custom-tabs"
              items={[
                {
                  key: 'analytics',
                  label: (
                    <span className="flex items-center">
                      <BarChartOutlined className="mr-2" />
                      Analytics
                    </span>
                  ),
                  children: <Analytics />,
                },
                {
                  key: 'requests',
                  label: (
                    <span className="flex items-center">
                      <ProfileOutlined className="mr-2" />
                      Requests
                    </span>
                  ),
                  children: <Requests />,
                },
                {
                  key: 'calibration',
                  label: (
                    <span className="flex items-center">
                      <ToolOutlined className="mr-2" />
                      Calibration
                    </span>
                  ),
                  children: <Calibration />,
                },
                {
                  key: 'history',
                  label: (
                    <span className="flex items-center">
                      <HistoryOutlined className="mr-2" />
                      History
                    </span>
                  ),
                  children: <History />,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default RequestsCalibrationHistory;