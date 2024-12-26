import React, {useState } from 'react';
import { Card, Table, Button } from 'antd';
import CalibrationCard from './cards/CalibrationCard';
import { Filter } from 'lucide-react';

const toolsData = [
  {
    toolId: 'T001',
    toolName: 'Power Drill',
    partNumber: 'PN01',
    startDate: '14 Feb 2019',
    endDate: '25 Dec 2024',
    location: 'Cubbort 1',
    operator: 'Sowndarya',
    action: 'near critical',
  },
  {
    toolId: 'T002',
    toolName: 'Circular Saw',
    partNumber: 'PN02',
    startDate: '12 Feb 2019',
    endDate: '27 Dec 2024',
    location: 'Cubbort 2',
    operator: 'Supriya',
    action: 'Overdue',
  },
  {
    toolId: 'T003',
    toolName: 'Wrench Set',
    partNumber: 'PN03',
    startDate: '14 Feb 2019',
    endDate: '14 Feb 2019',
    location: 'Cubbort 3',
    operator: 'Pavithra',
    action: 'Approved',
  },
  {
    toolId: 'T004',
    toolName: 'Safety Goggles',
    partNumber: 'PN04',
    startDate: '14 Feb 2019',
    endDate: '1 Jan 2025',
    location: 'Cubbort 4',
    operator: 'Nihal',
    action: 'Pending',
  },
];

const columns = [
  {
    title: 'Tool ID',
    dataIndex: 'toolId',
    key: 'toolId',
    sorter: (a, b) => a.toolId.localeCompare(b.toolId),
        filterSearch: true,
        filters: [...new Set(toolsData.map(item => ({
            text: item.toolId,
            value: item.toolId,
        })))],
        onFilter: (value, record) => record.toolId.indexOf(value) === 0,
  },
  {
    title: 'Tool Name',
    dataIndex: 'toolName',
    key: 'toolName',
    sorter: (a, b) => a.toolName.localeCompare(b.toolName),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.toolName,
        value: item.toolName,
      })))],
      onFilter: (value, record) => record.toolName.indexOf(value) === 0,
  },
  {
    title: 'Part Number',
    dataIndex: 'partNumber',
    key: 'partNumber',
    sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.partNumber,
        value: item.partNumber,
      })))],
      onFilter: (value, record) => record.partNumber.indexOf(value) === 0,
  },
  {
    title: 'Start Date',
    dataIndex: 'startDate',
    key: 'startDate',
  },
  {
    title: 'End Date',
    dataIndex: 'endDate',
    key: 'endDate',
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    filters: [...new Set(toolsData.map(item => ({
        text: item.location,
        value: item.location,
      })))],
      onFilter: (value, record) => record.location === value,
      filterSearch: true,
  },
  {
    title: 'Operator',
    dataIndex: 'operator',
    key: 'operator',
    filters: [...new Set(toolsData.map(item => ({
        text: item.operator,
        value: item.operator,
      })))],
      onFilter: (value, record) => record.operator === value,
      filterSearch: true,
  },
  {
    title: 'Action',
    dataIndex: 'action',
    key: 'action',
    render: (text) => {
      let color;
      if (text === 'Overdue') {
        color = 'red';
      } else if (text === 'Approved') {
        color = 'green';
      } else if (text === 'Pending') {
        color = 'orange';
      } else {
        color = '#D06800';
      }
      return <span style={{ color }}>{text}</span>;
    },
  },
];

const CalibrationTable = () => {
    const [filteredInfo, setFilteredInfo] = useState({});
  return (
    <div className="p-4">

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <CalibrationCard
    title="Total Tools"  // Example title
    icon={Filter}  // Replace with the actual icon component you want to use
/>
    </div>

    <Card title="Tool Lists" className="mb-4 mt-7">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Tool Lists</h2>
            
        </div>
        <Table 
            dataSource={toolsData} 
            pagination={{ 
              pageSize: 4,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            columns={columns} 
            onChange={(pagination, filters) => setFilteredInfo(filters)} 
            filteredInfo={filteredInfo}
        />
    </Card>
</div>
);
};

//   <Table dataSource={data} columns={columns} />;


export default CalibrationTable;