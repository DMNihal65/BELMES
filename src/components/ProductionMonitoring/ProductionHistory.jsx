import React, { useState } from 'react';
import { Card, Row, Col, DatePicker, Table, Space, Button, Tooltip } from 'antd';
import { Line, Column } from '@ant-design/plots';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;

const ProductionHistory = ({ data }) => {
  const [dateRange, setDateRange] = useState([moment().subtract(7, 'days'), moment()]);

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
      <Space className="w-full justify-between">
        <RangePicker 
          value={dateRange}
          onChange={setDateRange}
          allowClear={false}
        />
        <Space>
          <Button icon={<FilterOutlined />}>Filter</Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            Export Data
          </Button>
        </Space>
      </Space>

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