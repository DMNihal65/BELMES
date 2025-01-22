import React, { useState } from 'react';
import { Card, Row, Col, Space, Select, Button, DatePicker } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
const { RangePicker } = DatePicker;

const OEEDashboard = ({ machines }) => {
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [timeRange, setTimeRange] = useState('shift1');
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with Machine Selection and Time Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          
          <Select
            mode="multiple"
            style={{ width: '300px' }}
            placeholder="Select Machines"
            defaultValue={['all']}
            onChange={setSelectedMachines}
            options={[
              { value: 'all', label: 'All Machines' },
              ...machines.map(m => ({ value: m.id, label: `${m.name} (${m.id})` })),
            ]}
          />
        </div>
        <Space size="large">
          <Select
            value={timeRange}
            style={{ width: '120px' }}
            onChange={setTimeRange}
            options={[
              { value: 'shift1', label: 'Shift 1' },
              { value: 'shift2', label: 'Shift 2' },
              { value: 'shift3', label: 'Shift 3' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {timeRange === 'custom' && (
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              onChange={setDateRange}
            />
          )}
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Other components and content */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="OEE Trend">
            {/* OEE Trend Chart Component */}
            {/* Replace with your actual chart component */}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Production Trend">
            {/* Production Trend Chart Component */}
            {/* Replace with your actual chart component */}
          </Card>
        </Col>
      </Row>

      {/* Additional content can go here */}
    </div>
  );
};

export default OEEDashboard; 