import React, { useState } from 'react';
import { Card, Row, Col, DatePicker, Table, Space, Button, Tooltip, Select } from 'antd';
import { Line, Column } from '@ant-design/plots';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;

const ProductionHistory = ({ data }) => {
  const [dateRange, setDateRange] = useState([moment().subtract(7, 'days'), moment()]);
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [timeRange, setTimeRange] = useState('shift1');
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: 'OEE',
      dataIndex: 'oee',
      key: 'oee',
      render: (value) => `${value}%`,
      sorter: (a, b) => a.oee - b.oee,
    },
    {
      title: 'Production',
      dataIndex: 'production',
      key: 'production',
      sorter: (a, b) => a.production - b.production,
    },
    {
      title: 'Downtime (min)',
      dataIndex: 'downtime',
      key: 'downtime',
      sorter: (a, b) => a.downtime - b.downtime,
    },
    {
      title: 'Quality',
      dataIndex: 'quality',
      key: 'quality',
      render: (value) => `${value}%`,
      sorter: (a, b) => a.quality - b.quality,
    },
  ];

  return (
    <div className="space-y-6">
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
              ...data.map(m => ({ value: m.id, label: `${m.name} (${m.id})` })),
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
            icon={<DownloadOutlined />}
            loading={loading}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Production Trend">
            <Line
              data={data}
              xField="date"
              yField="production"
              smooth={true}
              point={{
                size: 5,
                shape: 'diamond',
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="OEE Trend">
            <Column
              data={data}
              xField="date"
              yField="oee"
              label={{
                position: 'middle',
                style: {
                  fill: '#FFFFFF',
                  opacity: 0.6,
                },
              }}
              color={({ oee }) => {
                if (oee >= 85) return '#52c41a';
                if (oee >= 70) return '#faad14';
                return '#f5222d';
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Detailed History">
        <Table 
          columns={columns} 
          dataSource={data}
          rowKey="date"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default ProductionHistory; 