import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { Table, Button, Space } from 'antd';
import useMachineMaintenanceStore from '../../../store/maintenance'; // Import the store

const Tickets = () => {
  const [data, setData] = useState([]); // State to hold the fetched data
  const fetchDowntimes = useMachineMaintenanceStore((state) => state.fetchDowntimes); // Fetch function from the store
  const acknowledgeDowntime = useMachineMaintenanceStore((state) => state.acknowledgeDowntime); // Acknowledge function
  const closeDowntime = useMachineMaintenanceStore((state) => state.closeDowntime); // Close function
  const [visibleButtons, setVisibleButtons] = useState({}); // State to track button visibility

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

  const handleButtonToggle = (ticketId) => {
    setVisibleButtons((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId], // Toggle visibility for the specific ticket
    }));
  };

  const renderActionButtons = (record) => {
    const isVisible = visibleButtons[record.id]; // Check visibility for the current ticket
    return (
      <Space>
        {record.status === 'open' ? (
          <>
            <Button 
              type="primary" 
              onClick={() => { 
                handleAcknowledge(record.id); 
                handleButtonToggle(record.id); 
              }}
              style={{ display: isVisible ? 'none' : 'inline-block' }} // Hide if acknowledged
            >
              Acknowledge
            </Button>
            <Button 
              type="primary" 
              onClick={() => { 
                handleClose(record.id); 
                handleButtonToggle(record.id); 
              }}
              style={{ display: isVisible ? 'inline-block' : 'none' }} // Show if acknowledged
            >
              Close
            </Button>
          </>
        ) : (
          <span>No actions available</span>
        )}
      </Space>
    );
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Reported By',
      dataIndex: 'reported_by',
      key: 'reported_by',
    },
    {
      title: 'Open Date',
      dataIndex: 'open_dt',
      key: 'open_dt',
      render: (date) => new Date(date).toLocaleString(),
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => renderActionButtons(record), // Use the new render function
    },
  ];

  const handleAcknowledge = async (ticketId) => {
    try {
      await acknowledgeDowntime(ticketId); // Acknowledge the downtime
      console.log('Acknowledged ticket:', ticketId);
      const downtimes = await fetchDowntimes(); // Refetch downtimes
      setData(downtimes); // Update the state with the new data
    } catch (error) {
      console.error('Error acknowledging ticket:', error);
    }
  };

  const handleClose = async (ticketId) => {
    try {
      await closeDowntime(ticketId); // Close the downtime
      console.log('Closed ticket:', ticketId);
      const downtimes = await fetchDowntimes(); // Refetch downtimes
      setData(downtimes); // Update the state with the new data
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  return (
    <div className="p-4">
      <Table 
        columns={columns} 
        dataSource={data} // Use the fetched data
        rowKey="id"
      />
    </div>
  );
};

export default Tickets;