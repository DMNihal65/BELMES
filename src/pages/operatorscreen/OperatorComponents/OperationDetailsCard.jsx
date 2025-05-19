import React, { useState } from 'react';
import { Table, Tag, Badge, Button, Empty, Tooltip, Space, Modal } from 'antd';
import { ClipboardList, Check, Zap, Clock, Info, Eye, AlertCircle } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';

const OperationDetailsCard = () => {
  const {
    availableOperations,
    selectedOperation,
    selectedJob,
    selectOperation,
    activateJob,
    isLoadingOperations,
    jobSource
  } = useOperatorStore();

  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [operationToActivate, setOperationToActivate] = useState(null);

  // Show confirmation modal before activating
  const showActivateConfirmation = (operation) => {
    setOperationToActivate(operation);
    setActivateModalVisible(true);
  };

  // Handle activation confirmation
  const handleActivate = async () => {
    if (!operationToActivate || !operationToActivate.id) return;
    
    await activateJob(operationToActivate.id);
    setActivateModalVisible(false);
  };

  // Get operation status tag
  const getOperationStatusTag = (record) => {
    if (selectedOperation && record.id === selectedOperation.id) {
      if (jobSource === 'inprogress') {
        return <Tag color="success">Active</Tag>;
      }
      return <Tag color="blue">Selected</Tag>;
    }
    
    // If this is the current active operation in an in-progress job
    if (jobSource === 'inprogress' && 
        selectedJob?.operation_id === record.id) {
      return <Tag color="success">Active</Tag>;
    }
    
    return null;
  };

  // Get row class name
  const getRowClassName = (record) => {
    if (selectedOperation && record.id === selectedOperation.id) {
      return 'current-row';
    }
    return '';
  };

  // Define table columns
  const columns = [
    {
      title: 'OP',
      dataIndex: 'operation_number',
      key: 'operation_number',
      width: 70,
      render: (text) => <span className="font-medium">{text}</span>,
      sorter: (a, b) => a.operation_number - b.operation_number,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Description',
      dataIndex: 'operation_description',
      key: 'description',
      render: (text, record) => (
        <div className="flex flex-col">
          <div className="font-medium">{text || record.description}</div>
          <div className="text-xs text-gray-500">{record.work_center}</div>
        </div>
      )
    },
    {
      title: 'Time',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span>Setup: {record.setup_time} hrs</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-gray-400" />
            <span>Cycle: {record.ideal_cycle_time} hrs</span>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => getOperationStatusTag(record)
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<Eye size={16} />} 
            onClick={() => selectOperation(record)}
            size="small"
          />
          <Button 
            type="text"
            icon={<Zap size={16} />}
            onClick={() => showActivateConfirmation(record)}
            disabled={
              jobSource === 'inprogress' && 
              selectedOperation && 
              record.id === selectedOperation.id
            }
            size="small"
          />
        </Space>
      )
    }
  ];

  if (isLoadingOperations) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin mb-4">
          <ClipboardList className="mx-auto text-blue-500" size={24} />
        </div>
        <div>Loading operations...</div>
      </div>
    );
  }

  if (!availableOperations || availableOperations.length === 0) {
    return (
      <div className="p-8">
        <Empty 
          description="No operations found" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-1">Operations Sequence</div>
        <div className="text-sm text-gray-500">
          {selectedJob ? (
            <>
              {selectedJob.part_number} - {selectedJob.part_description || selectedJob.material_description}
            </>
          ) : (
            'No job selected'
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={availableOperations}
        rowKey="id"
        pagination={false}
        rowClassName={getRowClassName}
        className="operations-table"
        size="middle"
        scroll={{ y: 400 }}
      />

      {/* Activation Confirmation Modal */}
      <Modal
        title="Activate Operation"
        open={activateModalVisible}
        onCancel={() => setActivateModalVisible(false)}
        onOk={handleActivate}
        okText="Activate"
        okButtonProps={{ 
          type: 'primary',
          className: 'bg-blue-500'
        }}
      >
        <div className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-orange-500 mt-1" size={20} />
            <div>
              <p className="font-medium">
                Are you sure you want to activate this operation?
              </p>
              {operationToActivate && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">OP{operationToActivate.operation_number}:</span> {operationToActivate.operation_description}
                  </div>
                  {operationToActivate.work_center && (
                    <div className="text-xs text-gray-500 mt-1">
                      Work Center: {operationToActivate.work_center}
                    </div>
                  )}
                </div>
              )}
              {(jobSource === 'inprogress' || jobSource === 'scheduled') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-yellow-600" />
                    <span className="text-yellow-700">This will deactivate the current operation first.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OperationDetailsCard; 