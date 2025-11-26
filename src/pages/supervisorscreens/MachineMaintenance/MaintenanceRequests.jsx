import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Input, Badge, Card, Tag } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import useMachineMaintenanceStore from '../../../store/maintenance';
import { format } from 'date-fns';

export default function MaintenanceRequests() {
  const {
    pendingRequests,
    totalPendingRequests,
    loading,
    error,
    fetchPendingRequests,
    approveRequest,
    rejectRequest
  } = useMachineMaintenanceStore();

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchPendingRequests();
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };
    fetchData();
  }, [fetchPendingRequests]);

  const handleApprove = async (machineId) => {
    Modal.confirm({
      title: 'Approve Request',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to approve this maintenance request?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await approveRequest(machineId);
        } catch (error) {
          Modal.error({
            title: 'Error',
            content: error.message
          });
        }
      }
    });
  };

  const showRejectModal = (machineId) => {
    setSelectedMachineId(machineId);
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Modal.error({
        title: 'Error',
        content: 'Please provide a reason for rejection'
      });
      return;
    }

    try {
      await rejectRequest(selectedMachineId, rejectReason);
      setRejectModalVisible(false);
      setRejectReason('');
      setSelectedMachineId(null);
    } catch (error) {
      Modal.error({
        title: 'Error',
        content: error.message
      });
    }
  };

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine_make',
      key: 'machine_make',
      width: '10%',
    },
    {
      title: 'Current Status',
      dataIndex: 'current_status',
      key: 'current_status',
      width: '15%',
      render: (status) => (
        <Tag color={status === 'ON' ? 'success' : 'error'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Current Description',
      dataIndex: 'current_description',
      key: 'current_description',
      width: '20%',
    },
    {
      title: 'Requested Status',
      dataIndex: 'requested_status',
      key: 'requested_status',
      width: '15%',
      render: (status) => (
        <Tag color={status === 'ON' ? 'success' : 'error'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Requested Description',
      dataIndex: 'requested_description',
      key: 'requested_description',
      width: '20%',
    },
    {
      title: 'Requested At',
      dataIndex: 'requested_at',
      key: 'requested_at',
      width: '15%',
      render: (date) => format(new Date(date), 'dd/MM/yyyy HH:mm')
    },
    {
      title: 'Available From',
      dataIndex: 'available_from',
      key: 'available_from',
      width: '15%',
      render: (date) => format(new Date(date), 'dd/MM/yyyy HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record.machine_id)}
            size="small"
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => showRejectModal(record.machine_id)}
            size="small"
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-6">
        <div className="flex items-center">
          <Badge count={totalPendingRequests} showZero>
            <div className="text-lg font-semibold mr-2">Pending Requests</div>
          </Badge>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={pendingRequests}
        loading={loading}
        rowKey="machine_id"
        pagination={{
          total: totalPendingRequests,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} requests`,
        }}
        size="middle"
        bordered
        scroll={{ x: 1200 }}
      />

      <Modal
        title="Reject Request"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setSelectedMachineId(null);
        }}
        okText="Reject"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Please provide a reason for rejection"
        />
      </Modal>
    </div>
  );
} 