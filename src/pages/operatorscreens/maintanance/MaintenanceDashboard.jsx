import React, { useState } from 'react';
import { Tabs, Typography } from 'antd';
import { ToolOutlined, FileTextOutlined } from '@ant-design/icons';
import MachineMaintananceGuide from './MachineMaintananceGuide';
import MachineMaintenance from './MachineMaintanance';

const { Title } = Typography;

function MaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState('1');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* <div className="bg-white shadow-sm px-6 py-3">
        <Title level={4} style={{ margin: 0 }}>
          Maintenance Dashboard
        </Title>
      </div> */}

      <div className="flex-1 overflow-hidden">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="px-6 pt-4"
          items={[
            // {
            //   key: '1',
            //   label: (
            //     <span>
            //       <ToolOutlined />
            //      Machine Maintenance
            //     </span>
            //   ),
            //   children: <MachineMaintenance />
            // },
            {
              key: '1',
              label: (
                <span>
                  <FileTextOutlined />
                  Maintenance Guide
                </span>
              ),
              children: <MachineMaintananceGuide />
            }
          ]}
        />
      </div>
    </div>
  );
}

export default MaintenanceDashboard;