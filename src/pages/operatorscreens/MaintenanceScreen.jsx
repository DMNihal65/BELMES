import React, { useState } from 'react';
import { Card, Select, DatePicker, Typography, Space, Checkbox, Button, Badge, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function MaintenanceScreen() {
  const navigate = useNavigate();
  const [selectedMachine, setSelectedMachine] = useState('DMG DMU 60 eVo linear');
  const [tasks, setTasks] = useState([
    {
      id: 1,
      task: 'Clean Air Filter',
      status: false,
      code: 'M001',
      instructions: 'Clean or replace air filter as needed',
      lastChecked: '2024/12/15',
    },
    {
      id: 2,
      task: 'Lubricate Moving Parts',
      status: false,
      code: 'M002',
      instructions: 'Apply machine-specific lubricant',
      lastChecked: '2024/12/10',
    },
    {
      id: 3,
      task: 'Check Coolant Levels',
      status: false,
      code: 'M003',
      instructions: 'Inspect coolant reservoir',
      lastChecked: '2024/12/12',
    },
  ]);

  const machines = [
    'DMG DMU 60 eVo linear',
    'DMG DMU 60T mB',
    'DMG CTX BETA 1250TC',
  ];

  const handleTaskChange = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: !task.status } : task
      )
    );
  };

  const getCompletionPercentage = () => {
    const completedTasks = tasks.filter((task) => task.status).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const renderTasks = () =>
    tasks.map((task) => (
      <div
        key={task.id}
        className={`border rounded-lg p-4 transition-all ${
          task.status ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={task.status}
              onChange={() => handleTaskChange(task.id)}
            >
              <span className="font-medium">{task.task}</span>
            </Checkbox>
          </div>
          <Space>
            <Badge
              status={task.status ? 'success' : 'processing'}
              text={task.status ? 'Completed' : 'Pending'}
            />
            {task.code && (
              <Text type="secondary" className="text-sm">
                Code: {task.code}
              </Text>
            )}
          </Space>
        </div>
        {task.instructions && (
          <div className="mt-4 ml-8">
            <Card
              size="small"
              className={task.status ? 'bg-green-50' : 'bg-gray-50'}
              style={{
                borderColor: task.status ? '#52c41a' : '#d9d9d9',
                transition: 'all 0.3s',
              }}
            >
              <div className="text-sm">
                <div className="font-medium mb-2">Instructions</div>
                <div className="mb-2">{task.instructions}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ClockCircleOutlined />
                  Last checked: {task.lastChecked}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    ));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/operator/dashboard')}
              size="large"
            >
              Back to Dashboard
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Maintenance Guide
            </Title>
          </div>
        </div>

        {/* Machine Selection and Date */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 font-medium">Select Machine</div>
              <Select
                value={selectedMachine}
                onChange={setSelectedMachine}
                style={{ width: '100%' }}
                size="large"
                options={machines.map((machine) => ({
                  value: machine,
                  label: machine,
                }))}
              />
            </div>
            <div className="w-full md:w-48">
              <div className="mb-2 font-medium">Select Date</div>
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                format="DD-MM-YYYY"
                suffixIcon={<CalendarOutlined />}
                placeholder="Choose Date"
              />
            </div>
          </div>
        </Card>

        {/* Progress Card */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <Title level={5} className="mb-2">
                Maintenance Progress
              </Title>
              <Text type="secondary">
                {tasks.filter((task) => task.status).length} of {tasks.length}{' '}
                tasks completed
              </Text>
            </div>
            <Progress
              type="circle"
              percent={getCompletionPercentage()}
              width={80}
              format={(percent) => (
                <div className="text-center">
                  <div className="text-lg font-bold">{percent}%</div>
                  <div className="text-xs">Complete</div>
                </div>
              )}
            />
          </div>
        </Card>

        {/* Maintenance Tasks */}
        <Card className="mb-6">
          <Title level={5} className="mb-4">
            Maintenance Tasks for {selectedMachine}
          </Title>
          <div className="space-y-4">{renderTasks()}</div>
        </Card>
      </div>
    </div>
  );
}

export default MaintenanceScreen;
