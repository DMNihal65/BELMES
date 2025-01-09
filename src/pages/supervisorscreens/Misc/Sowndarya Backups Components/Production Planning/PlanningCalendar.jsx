import React, { useState } from 'react';
import { 
  Calendar, Badge, Card, Tooltip, Modal, Timeline, 
  Select, Row, Col, Button, Space, Tag 
} from 'antd';
import { ClockCircleOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const PlanningCalendar = ({ data, viewMode }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);

  const getListData = (value) => {
    const date = value.format('YYYY-MM-DD');
    let filteredData = data.flatMap(machine => 
      machine.capacityData
        .filter(c => c.date === date)
        .filter(c => selectedMachine === 'all' || machine.id === selectedMachine)
        .map(c => ({
          type: c.type,
          content: `${machine.name}: ${c.jobDetails}`,
          status: c.status,
          shift: c.shift,
          startTime: c.startTime,
          endTime: c.endTime,
          efficiency: c.efficiency,
          downtime: c.downtime
        }))
    );

    return filteredData;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events p-0">
        {listData.map((item, index) => (
          <li key={index} className="list-none mb-1">
            <Badge 
              status={getStatusColor(item.status)} 
              text={
                <Tooltip title={getTooltipContent(item)}>
                  <span className="truncate block text-xs">
                    {`${item.content} (${item.startTime}-${item.endTime})`}
                  </span>
                </Tooltip>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'processing';
      case 'completed': return 'success';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getTooltipContent = (item) => (
    <div>
      <p>{item.content}</p>
      <p>Shift: {item.shift}</p>
      <p>Time: {item.startTime} - {item.endTime}</p>
      {item.efficiency && <p>Efficiency: {item.efficiency}%</p>}
      {item.downtime > 0 && <p>Downtime: {item.downtime}hrs</p>}
    </div>
  );

  const handleDateSelect = (value) => {
    setSelectedDate(value);
    setModalVisible(true);
  };

  const renderDayDetails = () => {
    if (!selectedDate) return null;

    const dayData = getListData(selectedDate);
    return (
      <Timeline mode="left">
        {dayData.map((item, index) => (
          <Timeline.Item 
            key={index}
            color={getStatusColor(item.status)}
            label={`${item.startTime}-${item.endTime}`}
          >
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h4 className="font-medium">{item.content}</h4>
              <p className="text-sm text-gray-500">Shift {item.shift}</p>
              {item.efficiency && (
                <p className="text-sm">
                  Efficiency: <Tag color="blue">{item.efficiency}%</Tag>
                </p>
              )}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              value={selectedMachine}
              onChange={setSelectedMachine}
              options={[
                { value: 'all', label: 'All Machines' },
                ...data.map(m => ({
                  value: m.id,
                  label: m.name
                }))
              ]}
            />
          </Col>
          <Col span={16}>
            <Space className="float-right">
              <Button icon={<ClockCircleOutlined />}>
                Shift View
              </Button>
              <Button icon={<ToolOutlined />}>
                Maintenance View
              </Button>
            </Space>
          </Col>
        </Row>

        <Calendar 
          dateCellRender={dateCellRender}
          mode={viewMode}
          onSelect={handleDateSelect}
        />
      </Card>

      <Modal
        title={`Schedule for ${selectedDate?.format('YYYY-MM-DD')}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        {renderDayDetails()}
      </Modal>
    </div>
  );
};

export default PlanningCalendar; 