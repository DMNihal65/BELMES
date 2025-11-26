import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { FormOutlined, LinkOutlined, FileTextOutlined } from '@ant-design/icons';
import ChecklistsTab from './ChecklistsTab';
import AssignmentsTab from './AssignmentsTab';
import LogsTab from './LogsTab';

const { TabPane } = Tabs;

const PokaYokeDashboard = () => {
  const [activeTab, setActiveTab] = useState('checklists');

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div className="p-6">
      <Card bordered={false}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">PokaYoke Checklist System</h1>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane
            tab={
              <span>
                <FormOutlined />
                Checklists
              </span>
            }
            key="checklists"
          >
            <ChecklistsTab />
          </TabPane>

          <TabPane
            tab={
              <span>
                <LinkOutlined />
                Machine Assignments
              </span>
            }
            key="assignments"
          >
            <AssignmentsTab />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Completion Logs
              </span>
            }
            key="logs"
          >
            <LogsTab />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default PokaYokeDashboard; 