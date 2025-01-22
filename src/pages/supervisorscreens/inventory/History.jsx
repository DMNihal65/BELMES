// src/pages/supervisorscreens/inventory/History.jsx
import React, {useState} from 'react';
import { Card,Tag, Button, DatePicker, Space, Upload, Table } from 'antd'; // Import necessary Ant Design components
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'; // Import icons

const toolsData = [
    { key: '1', toolId: 'T001', toolName: 'Power Drill', partNumber: 'PN01', quantity: 12, category: 'Cutting Tools', location: 'Cubbort 1', requestDate: '14 Feb 2024', approvedDate: '17 Feb 2019', returnUpdated: 'N/A', machineName: 'M-1', operator: 'Sowndarya', action: 'Approved' },
    { key: '2', toolId: 'T002', toolName: 'Circular Saw', partNumber: 'PN02', quantity: 17, category: 'Tool Holders', location: 'Cubbort 2', requestDate: '14 Feb 2019', approvedDate: '17 Feb 2019', returnUpdated: 'N/A', machineName: 'M-2', operator: 'Supriya', action: 'Approved' },
    { key: '3', toolId: 'T003', toolName: 'Wrench Set', partNumber: 'PN03', quantity: 3, category: 'Consumables', location: 'Cubbort 3', requestDate: '14 Feb 2019', approvedDate: '17 Feb 2019', returnUpdated: 'N/A', machineName: 'M-2', operator: 'Pavithra', action: 'Approved' },
    { key: '4', toolId: 'T004', toolName: 'Safety Goggles', partNumber: 'PN04', quantity: 9, category: 'Raw Materials', location: 'Cubbort 4', requestDate: '14 Feb 2019', approvedDate: '19 Feb 2019', returnUpdated: 'N/A', machineName: 'M-6', operator: 'Nihal', action: 'Approved' },
    { key: '5', toolId: 'T005', toolName: 'Hammer', partNumber: 'PN05', quantity: 43, category: 'Measuring Instruments', location: 'Cubbort 5', requestDate: '14 Feb 2019', approvedDate: '15 Feb 2019', returnUpdated: 'N/A', machineName: 'M-5', operator: 'Hajira', action: 'Approved' },
    { key: '6', toolId: 'T006', toolName: 'Screwdriver Set', partNumber: 'PN06', quantity: 23, category: 'Jigs & Fixtures', location: 'Cubbort 6', requestDate: '14 Feb 2019', approvedDate: '14 Feb 2019', returnUpdated: 'N/A', machineName: 'M-8', operator: 'Nagasiri', action: 'Approved' },
];

const columns = [
    {
        title: 'Tool ID',
        dataIndex: 'toolId',
        key: 'toolId',
        sorter: (a, b) => a.toolId.localeCompare(b.toolId),
        filters: [...new Set(toolsData.map(item => ({
            text: item.toolId,
            value: item.toolId,
        })))],
        onFilter: (value, record) => record.toolId.indexOf(value) === 0,
        filterSearch: true,
    },
    {
        title: 'Tool NAME',
        dataIndex: 'toolName',
        key: 'toolName',
        sorter: (a, b) => a.toolName.localeCompare(b.toolName),
        filters: [...new Set(toolsData.map(item => ({
            text: item.toolName,
            value: item.toolName,
        })))],
        onFilter: (value, record) => record.toolName.indexOf(value) === 0,
        filterSearch: true,
    },
    {
        title: 'PART NUMBER',
        dataIndex: 'partNumber',
        key: 'partNumber',
        sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
        filters: [...new Set(toolsData.map(item => ({
            text: item.partNumber,
            value: item.partNumber,
        })))],
        onFilter: (value, record) => record.partNumber.indexOf(value) === 0,
        filterSearch: true,
    },
    {
        title: 'QUANTITY',
        dataIndex: 'quantity',
        key: 'quantity',
        sorter: (a, b) => a.quantity - b.quantity,
    },
    {
        title: 'CATEGORY',
        dataIndex: 'category',
        key: 'category',
        filters: [...new Set(toolsData.map(item => ({
            text: item.category,
            value: item.category,
        })))],
        onFilter: (value, record) => record.category.indexOf(value) === 0,
        filterSearch: true,
    },
    {
        title: 'LOCATION',
        dataIndex: 'location',
        key: 'location',
        filters: [...new Set(toolsData.map(item => ({
            text: item.location,
            value: item.location,
        })))],
        onFilter: (value, record) => record.location.indexOf(value) === 0,
        filterSearch: true,
    },
    {
        title: 'REQUEST DATE',
        dataIndex: 'requestDate',
        key: 'requestDate',
        sorter: (a, b) => new Date(a.requestDate) - new Date(b.requestDate),
        filterSearch: true,
        // Added filterDropdown for date picker
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <DatePicker
                    onChange={(date, dateString) => {
                        setSelectedKeys(dateString ? [dateString] : []);
                    }}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        OK
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        onFilter: (value, record) => record.requestDate === value,
    },
    // {
    //     title: 'REQUEST DATE',
    //     dataIndex: 'requestDate',
    //     key: 'requestDate',
    //     sorter: (a, b) => new Date(a.requestDate) - new Date(b.requestDate),
    //     filters: [
    //         { text: 'Today', value: 'Today' },
    //         { text: 'Yesterday', value: 'Yesterday' },
    //         { text: 'This Week', value: 'This Week' },
    //         { text: 'Last Week', value: 'Last Week' },
    //         { text: 'This Month', value: 'This Month' },
    //         { text: 'Last Month', value: 'Last Month' },
    //     ],
    //     onFilter: (value, record) => {
    //         const date = new Date(record.requestDate);
    //         switch (value) {
    //             case 'Today':
    //                 return date.toDateString() === new Date().toDateString();
    //             case 'Yesterday':
    //                 return date.toDateString() === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();
    //             case 'This Week':
    //                 return date >= new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
    //             case 'Last Week':
    //                 return date >= new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1 - 7)) && date < new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
    //             case 'This Month':
    //                 return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
    //             case 'Last Month':
    //                 return date.getMonth() === new Date().getMonth() - 1 && date.getFullYear() === new Date().getFullYear();
    //             default:
    //                 return false;
    //         }
    //     },
    //     filterSearch: true,
    // },
    {
        title: 'APPROVED DATE',
        dataIndex: 'approvedDate',
        key: 'approvedDate',
        sorter: (a, b) => new Date(a.approvedDate) - new Date(b.approvedDate),
    },
    {
        title: 'RETURN UPDATED',
        dataIndex: 'returnUpdated',
        key: 'returnUpdated',
    },
    {
        title: 'MACHINE NAME',
        dataIndex: 'machineName',
        key: 'machineName',
        filters: [...new Set(toolsData.map(item => ({
            text: item.machineName,
            value: item.machineName,
        })))],
        onFilter: (value, record) => record.machineName.indexOf(value) === 0,
        filterSearch: true,
    },
    {
        title: 'OPERATOR',
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
        title: 'ACTION',
        dataIndex: 'action',
        key: 'action',
        render: (_, record) => {
            const { status, color } = getStatus(record.action);
            return (
              <Tag color={color} className="text-sm">{status}</Tag>
            );
          },
    },
];

const getStatus = (action) => {

    return { status: 'Approved', color: 'green' }; // Calibrated (green)
  };

const History = ({ showModal, handleDownloadData, handleFileUpload }) => {
    const [filteredInfo, setFilteredInfo] = useState({});
    return (
        <Card 
            title="Tools Inventory History"
           
        >
            <Table 
                columns={columns} 
                dataSource={toolsData} 
                pagination={{ 
                    pageSize: 4,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  }}
                rowKey="key" 
                onChange={(pagination, filters) => setFilteredInfo(filters)} 
                filteredInfo={filteredInfo}
                scroll={{ x: 1000 }}
            />
        </Card>
    );
};

export default History;