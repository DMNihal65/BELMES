// src/pages/supervisorscreens/inventory/Requests.jsx
import React, { useState } from 'react';
import { Card, Table, Button } from 'antd';
import { Filter, RefreshCcw } from 'lucide-react';
import RequestCard from './cards/RequestCard'; // Adjust the path as necessary

const ToolRequestList = () => {
    const [filteredInfo, setFilteredInfo] = useState({});

    const [toolsData, setToolsData] = useState([ // Change here to use state
        {
            key: '1',
            toolId: 'T001',
            toolName: 'Power Drill',
            partNumber: 'PN01',
            quantity: 12,
            category: 'Cutting Tools',
            location: 'Cubbort 1',
            lastUpdated: '14 Feb 2019',
            operator: 'Sowndarya',
            action: 'Approved',
        },
        {
            key: '2',
            toolId: 'T002',
            toolName: 'Circular Saw',
            partNumber: 'PN02',
            quantity: 17,
            category: 'Tool Holders',
            location: 'Cubbort 2',
            lastUpdated: '14 Feb 2019',
            operator: 'Supriya',
            action: 'Pending',
        },
        // Add more data as needed
          {
            key: '3',
            toolId: 'T003',
            toolName: 'Wrench Set',
            partNumber: 'PN-003',
            category: 'Tool Holders',
            quantity: 8,
            location: 'Warehouse A',
            lastUpdated: '2024-03-13',
            operator: 'Pavithra',
            action: 'Pending',
        },
          {
            key: '4',
            toolId: 'T004',
            toolName: 'Safety Goggles',
            partNumber: 'PN-004',
            category: 'Consumables',
            quantity: 0,
            location: 'Warehouse C',
            lastUpdated: '2024-03-12',
            operator: 'Nihal',
            action: 'Approved',
        },
          {
            key: '5',
            toolId: 'T005',
            toolName: 'Hammer',
            partNumber: 'PN-005',
            category: 'Raw Materials',
            quantity: 12,
            location: 'Warehouse B',
            lastUpdated: '2024-03-11',
            operator: 'Nagasiri',
            action: 'Pending',
        },
        {
          key: '6',
          toolId: 'T006',
          toolName: 'Screwdriver Set',
          partNumber: 'PN-006',
          category: 'Tool Holders',
          quantity: 4,
          location: 'Warehouse A',
          lastUpdated: '2024-03-10',
          operator: 'Hajira',
          action: 'Pending',
      },
      {
        key: '7',
        toolId: 'T007',
        toolName: 'Level Tool',
        partNumber: 'PN-007',
        category: 'Measuring Instruments',
        quantity: 6,
        location: 'Warehouse C',
        lastUpdated: '2024-03-09',
        operator: 'Yadushree',
        action: 'Pending',
      },
      {
        key: '8',
        toolId: 'T008',
        toolName: 'Measuring Tape',
        partNumber: 'PN-008',
        category: 'Measuring Instruments',
        quantity: 15,
        location: 'Warehouse B',
        lastUpdated: '2024-03-08',
        operator: 'Tejas',
        action: 'Pending',
      },
      {
        key: '9',
        toolId: 'T009',
        toolName: 'Machine Oil',
        partNumber: 'PN-009',
        category: 'Consumables',
        quantity: 15,
        location: 'Warehouse D',
        lastUpdated: '2024-03-09',
        operator: 'Nikhil',
        action: 'Pending',
      },

    ]);

    const handleActionChange = (key) => {
      setToolsData(prevData => 
          prevData.map(tool => 
              tool.key === key ? { ...tool, action: 'Approved' } : tool
          )
      );
  };


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
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Raw Materials', value: 'Raw Materials' },
        { text: 'Cutting Tools', value: 'Cutting Tools' },
        { text: 'Consumables', value: 'Consumables' },
        { text: 'Spares', value: 'Spares' },
        { text: 'Tool Holders', value: 'Tool Holders' },
        { text: 'Jigs & Fixtures', value: 'Jigs & Fixtures' },
        { text: 'Measuring Instruments', value: 'Measuring Instruments' },
      ],
      onFilter: (value, record) => record.category === value,
      sorter: (a, b) => a.category.localeCompare(b.category),
      filterSearch: true,
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
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      sorter: (a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated),
    },
    { title: 'Operator', dataIndex: 'operator', key: 'operator',
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
      render: (text, record) => (
          <Button 
              onClick={() => text === 'Pending' && handleActionChange(record.key)} // Change here
              type={text === 'Approved' ? 'primary' : 'default'} 
              style={{ 
                  backgroundColor: text === 'Approved' ? '#66bb6a' : text === 'Pending' ? '#ff9999' : undefined,
                  color: 'dark' 
              }}
          >
              {text}
          </Button>
      ),
  },
    ];

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RequestCard
                    title="Total Requests"
                    value={toolsData.length} // Example value
                    trend={10} // Example trend
                    trendPeriod="Last Month" // Example trend period
                    icon={Filter} // Example icon
                />
                {/* Add more RequestCard components as needed */}
            </div>

            <Card title="Tool Requests" className="mb-4 mt-7">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Tool Request Lists</h2>
                    <div className="flex space-x-2">
                        <Button icon={<RefreshCcw />} type="default">Reset Filter</Button>
                    </div>
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

export default ToolRequestList;