import React from 'react';
import { Calendar, Badge, Card, Select, Button, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const Schedule = () => {
  const getListData = (value) => {
    // Mock data - replace with actual maintenance schedule data
    const listData = [];
    if (value.date() === 8) {
      listData.push(
        { type: 'warning', content: 'CNC Machine Maintenance' },
        { type: 'success', content: 'Lathe Machine Inspection' },
      );
    }
    return listData;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-4">
      <Row gutter={16}>
        <Col span={18}>
          <Card title="Maintenance Calendar">
            <Calendar dateCellRender={dateCellRender} />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Schedule Maintenance">
            <Button type="primary" icon={<PlusOutlined />} block>
              New Schedule
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Schedule; 