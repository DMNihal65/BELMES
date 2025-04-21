import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { Table, Button, Space, Modal, Input, message } from 'antd';
import useMachineMaintenanceStore from '../../../store/maintenance'; // Import the store
import { Row, Col } from 'antd'; 

const DowntimeTickets = () => {
  const [data, setData] = useState([]); // State to hold the fetched data
  const fetchDowntimes = useMachineMaintenanceStore((state) => state.fetchDowntimes); // Fetch function from the store
  const acknowledgeDowntime = useMachineMaintenanceStore((state) => state.acknowledgeDowntime); // Acknowledge function
  const closeDowntime = useMachineMaintenanceStore((state) => state.closeDowntime); // Close function
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const downtimes = await fetchDowntimes(); // Fetch downtimes
      setData(downtimes); // Set the fetched data to state
    };

    getData(); // Initial fetch

    const intervalId = setInterval(() => {
      getData(); // Fetch downtimes every 2 seconds
    }, 5000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchDowntimes]);

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
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Machine ID',
      dataIndex: 'machine_id',
      key: 'machine_id',
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
    {
      title: 'Reported By',
      dataIndex: 'reported_by',
      key: 'reported_by',
      render: (value) => value || '-',
    },
    {
      title: 'Open Date',
      dataIndex: 'open_dt',
      key: 'open_dt',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'In Progress Date',
      dataIndex: 'inprogress_dt',
      key: 'inprogress_dt',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Closed Date',
      dataIndex: 'closed_dt',
      key: 'closed_dt',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
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

  return (
    <div className="p-4">
      <Table 
        columns={columns} 
        dataSource={data} // Use the fetched data
        rowKey="id"
        pagination={{ pageSize: 10 }} // Optional: Add pagination for better UX
        scroll={{ x: true }} // Enable horizontal scrolling for smaller screens
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