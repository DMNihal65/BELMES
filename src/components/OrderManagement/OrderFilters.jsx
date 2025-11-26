import React from 'react';
import { Space, Input, DatePicker, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const OrderFilters = ({ 
  searchText, 
  setSearchText, 
  dateRange, 
  setDateRange,
  filterStatus,
  setFilterStatus
}) => {
  return (
    <div className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-lg">
      <Space size="large">
        <Input
          placeholder="Search orders..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 250 }}
          allowClear
        />
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder={['Start Date', 'End Date']}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 150 }}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'delayed', label: 'Delayed' },
          ]}
        />
      </Space>
    </div>
  );
};

export default OrderFilters; 