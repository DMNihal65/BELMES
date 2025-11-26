import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { Table, Button, Space, Modal, Input, message, DatePicker, Select } from 'antd';
import useMachineMaintenanceStore from '../../../store/maintenance'; // Import the store
import { Row, Col } from 'antd'; 
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DowntimeTickets = () => {
  const [data, setData] = useState([]); // State to hold the fetched data
  const [searchText, setSearchText] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateColumn, setSelectedDateColumn] = useState('open_dt');
  const [filteredData, setFilteredData] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const fetchDowntimes = useMachineMaintenanceStore((state) => state.fetchDowntimes); // Fetch function from the store
  const acknowledgeDowntime = useMachineMaintenanceStore((state) => state.acknowledgeDowntime); // Acknowledge function
  const closeDowntime = useMachineMaintenanceStore((state) => state.closeDowntime); // Close function
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const downtimes = await fetchDowntimes();
      setData(downtimes);
      if (!searchText && !dateRange && selectedColumn === 'all' && selectedStatus === 'all') {
        applyFilters(downtimes, '', null, 'all', 'all', selectedDateColumn);
      } else {
        applyFilters(downtimes, searchText, dateRange, selectedColumn, selectedStatus, selectedDateColumn);
      }
    };

    getData();

    const intervalId = setInterval(() => {
      getData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchDowntimes, searchText, dateRange, selectedColumn, selectedStatus, selectedDateColumn]);

  // Function to apply both search and date filters
const applyFilters = (dataToFilter, searchValue, dates, column, status, dateColumn) => {
  let filtered = [...dataToFilter];

  // Apply text search filter
  if (searchValue) {
    const searchVal = searchValue.toLowerCase();
    filtered = filtered.filter(item => {
      if (column === 'all') {
        return Object.keys(item).some(key => {
          const itemValue = item[key];
          if (itemValue === null || itemValue === undefined) return false;
          return String(itemValue).toLowerCase().includes(searchVal);
        });
      } else {
        const itemValue = item[column];
        if (itemValue === null || itemValue === undefined) return false;
        return String(itemValue).toLowerCase().includes(searchVal);
      }
    });
  }

  // Apply date range filter
  if (dates && dates[0] && dates[1]) {
    const startDate = moment(dates[0]).startOf('day');
    const endDate = moment(dates[1]).endOf('day');
    
    filtered = filtered.filter(item => {
      const dateValue = item[dateColumn];
      if (!dateValue) return false;
      const itemDate = moment(dateValue);
      return itemDate.isBetween(startDate, endDate, 'day', '[]');
    });
  }

  // Apply status filter
  if (status !== 'all') {
    filtered = filtered.filter(item => item.status === status);
  }

  // Sort by open_dt in descending order (latest first)
  filtered = filtered.sort((a, b) => {
    const dateA = a.open_dt ? moment(a.open_dt) : moment(0); // Handle null/undefined dates
    const dateB = b.open_dt ? moment(b.open_dt) : moment(0);
    return dateB - dateA; // Descending order
  });

  setFilteredData(filtered);
  setPagination(prev => ({
    ...prev,
    total: filtered.length,
  }));
};

  // Handle search functionality
  const handleSearch = (value) => {
    setSearchText(value);
    applyFilters(data, value, dateRange, selectedColumn, selectedStatus, selectedDateColumn);
  };

  // Handle column selection
  const handleColumnChange = (value) => {
    setSelectedColumn(value);
    applyFilters(data, searchText, dateRange, value, selectedStatus, selectedDateColumn);
  };

  // Handle status selection
  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    applyFilters(data, searchText, dateRange, selectedColumn, value, selectedDateColumn);
  };

  // Handle date column selection
  const handleDateColumnChange = (value) => {
    setSelectedDateColumn(value);
    applyFilters(data, searchText, dateRange, selectedColumn, selectedStatus, value);
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    applyFilters(data, searchText, dates, selectedColumn, selectedStatus, selectedDateColumn);
  };

  const handleAcknowledge = async (ticketId) => {
    try {
      await acknowledgeDowntime(ticketId);
      message.success('Ticket acknowledged successfully');
      const downtimes = await fetchDowntimes();
      setData(downtimes);
    } catch (error) {
      message.error('Error acknowledging ticket');
      console.error('Error acknowledging ticket:', error);
    }
  };

  const showCloseModal = (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsModalVisible(true);
  };

  const handleCloseModalOk = async () => {
    if (!actionTaken.trim()) {
      message.warning('Please enter action taken');
      return;
    }

    try {
      await closeDowntime(selectedTicketId, actionTaken);
      message.success('Ticket closed successfully');
      const downtimes = await fetchDowntimes();
      setData(downtimes);
      setIsModalVisible(false);
      setActionTaken('');
      setSelectedTicketId(null);
    } catch (error) {
      message.error('Error closing ticket');
      console.error('Error closing ticket:', error);
    }
  };

  const handleCloseModalCancel = () => {
    setIsModalVisible(false);
    setActionTaken('');
    setSelectedTicketId(null);
  };

  const renderActionButtons = (record) => {
    if (record.status === 'closed') {
      return <span>No actions available</span>;
    }

    if (record.status === 'open') {
      return (
        <Button 
          type="primary" 
          onClick={() => handleAcknowledge(record.id)}
        >
          Acknowledge
        </Button>
      );
    }

    if (record.status === 'in_progress') {
      return (
        <Button 
          type="primary" 
          onClick={() => showCloseModal(record.id)}
        >
          Close
        </Button>
      );
    }
  };

  const columns = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    // },
    {
      title: 'Machine Name',
      dataIndex: 'machine_name',
      key: 'machine_name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
    },
    // {
    //   title: 'Reported By',
    //   dataIndex: 'reported_by',
    //   key: 'reported_by',
    //   render: (value) => value || '-',
    // },
    {
      title: 'Open Date',
      dataIndex: 'open_dt',
      key: 'open_dt',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'In Progress Date',
      dataIndex: 'inprogress_dt',
      key: 'inprogress_dt',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Closed Date',
      dataIndex: 'closed_dt',
      key: 'closed_dt',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Action Taken',
      dataIndex: 'action_taken',
      key: 'action_taken',
      render: (value) => value || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => status.replace('_', ' ').toUpperCase(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => renderActionButtons(record),
    },
  ];

  // Handle pagination change
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Reset all filters
  const handleReset = () => {
    setSearchText('');
    setDateRange(null);
    setSelectedColumn('all');
    setSelectedStatus('all');
    setSelectedDateColumn('open_dt');
    setPagination({
      current: 1,
      pageSize: 5,
      total: data.length,
    });
    applyFilters(data, '', null, 'all', 'all', 'open_dt');
  };

  return (
    <div className="p-4 shadow-lg rounded-xl">
      <Row className="mb-4" gutter={16}>
      <Col span={3}>
          <Select
            style={{ width: '100%' }}
            value={selectedStatus}
            onChange={handleStatusChange}
            placeholder="Select Status"
          >
            <Option value="all">All Status</Option>
            <Option value="open">Open</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="closed">Closed</Option>
          </Select>
        </Col>
        <Col span={3}>
          <Select
            style={{ width: '100%' }}
            value={selectedColumn}
            onChange={handleColumnChange}
            placeholder="Select Column"
          >
            <Option value="all">All Columns</Option>
            <Option value="machine_name">Machine Name</Option>
            <Option value="category">Category</Option>
            <Option value="description">Description</Option>
            <Option value="priority">Priority</Option>
            <Option value="reported_by">Reported By</Option>
          </Select>
        </Col>
        <Col span={6}>
          <Input
            placeholder={`Search in ${selectedColumn === 'all' ? 'all columns' : selectedColumn}...`}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </Col>
        {/* <Col span={3}>
          <Select
            style={{ width: '100%' }}
            value={selectedDateColumn}
            onChange={handleDateColumnChange}
            placeholder="Select Date Column"
          >
            <Option value="open_dt">Open Date</Option>
            <Option value="inprogress_dt">In Progress Date</Option>
            <Option value="closed_dt">Closed Date</Option>
          </Select>
        </Col>
        <Col span={6}>
          <RangePicker
            onChange={handleDateRangeChange}
            placeholder={['Start Date', 'End Date']}
            format="DD/MM/YYYY"
            allowClear
            value={dateRange}
          />
        </Col> */}
        <Col span={3}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            Reset Filters
          </Button>
        </Col>
      </Row>
      
      <Table 
        columns={columns} 
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: handleTableChange,
        }}
        scroll={{ x: true }}
      />
      
      <Modal
        title="Close Ticket"
        visible={isModalVisible}
        onOk={handleCloseModalOk}
        onCancel={handleCloseModalCancel}
      >
        <Input.TextArea
          placeholder="Enter action taken"
          value={actionTaken}
          onChange={(e) => setActionTaken(e.target.value)}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default DowntimeTickets;