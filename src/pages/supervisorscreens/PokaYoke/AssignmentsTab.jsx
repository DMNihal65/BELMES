import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Select, Form, Input, Modal, message, Tag, Tooltip, Empty, Card, Descriptions, Alert, Popconfirm } from 'antd';
import { LinkOutlined, FileSearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import usePokayokeStore from '../../../store/pokayoke-store';

const { Option } = Select;

const AssignmentsTab = () => {
  const { 
    checklists, 
    machines,
    machineAssignments, 
    loading, 
    error, 
    fetchChecklists, 
    fetchMachines,
    fetchMachineAssignments, 
    assignChecklistToMachine,
    deleteAssignment
  } = usePokayokeStore();
  
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  
  useEffect(() => {
    fetchChecklists();
    fetchMachines();
  }, [fetchChecklists, fetchMachines]);
  
  useEffect(() => {
    if (selectedMachine) {
      fetchMachineAssignments(selectedMachine);
    }
  }, [selectedMachine, fetchMachineAssignments]);
  
  const handleMachineChange = (machineId) => {
    setSelectedMachine(machineId);
  };
  
  const handleAssignChecklist = () => {
    setIsAssignModalVisible(true);
  };
  
  const handleAssignSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const selectedMachineObj = machines.find(m => m.id === selectedMachine);
      const machineName = selectedMachineObj?.work_center?.description || 
                          selectedMachineObj?.make || 
                          `Machine ${selectedMachine}`;
      
      const assignmentData = {
        checklist_id: values.checklist_id,
        machine_id: selectedMachine,
        machine_make: machineName
      };
      
      const result = await assignChecklistToMachine(assignmentData);
      if (result) {
        message.success('Checklist assigned to machine successfully');
        form.resetFields();
        setIsAssignModalVisible(false);
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };
  
  const refreshData = () => {
    fetchMachines();
    if (selectedMachine) {
      fetchMachineAssignments(selectedMachine);
    }
  };

  const handleDeleteAssignment = async (assignmentId, checklistName, machineName) => {
    try {
      const result = await deleteAssignment(assignmentId);
      if (result) {
        message.success(`Assignment "${checklistName}" has been removed from machine "${machineName}" successfully`);
        // Refresh the machine assignments list
        if (selectedMachine) {
          fetchMachineAssignments(selectedMachine);
        }
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      message.error('Failed to delete assignment. Please try again.');
    }
  };
  
  const getMachineName = (machine) => {
    if (!machine) return 'Unknown Machine';
    
    const make = machine.make || '';
    const model = machine.model || '';
    const workCenter = machine.work_center?.description || '';
    const workCenterCode = machine.work_center?.code || '';
    
    // Format the display string
    let displayName = '';
    
    if (make) {
      displayName += make;
    }
    
    if (model) {
      displayName += ` ${model}`;
    }
    
    if (workCenter) {
      displayName += ` (${workCenter})`;
    }
    
    if (workCenterCode) {
      displayName += ` [${workCenterCode}]`;
    }
    
    return displayName.trim() || `Machine ${machine.id}`;
  };
  
  // Helper to check if machine is 'Default'
  const isDefaultMachine = (machine) => {
    const name = machine?.name || '';
    const make = machine?.make || '';
    const model = machine?.model || '';
    const wcDesc = machine?.work_center?.description || '';
    return (
      name.trim().toLowerCase() === 'default' ||
      make.trim().toLowerCase() === 'default' ||
      model.trim().toLowerCase() === 'default' ||
      wcDesc.trim().toLowerCase() === 'default'
    );
  };
  
  const columns = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   width: '5%',
    // },
    {
      title: 'Checklist',
      dataIndex: 'checklist_name',
      key: 'checklist_name',
      width: '22%',
    },
    // {
    //   title: 'Machine ID',
    //   dataIndex: 'machine_id',
    //   key: 'machine_id',
    //   width: '8%',
    // },
    {
      title: 'Machine Make',
      dataIndex: 'machine_make',
      key: 'machine_make',
      width: '22%',
    },
    {
      title: 'Assigned At',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      width: '13%',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: '8%',
      render: (active) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '7%',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Remove Assignment"
            description={
              <div>
                <p>Are you sure you want to remove this checklist assignment?</p>
                <p className="text-red-500 font-medium">
                  <strong>Warning:</strong> This will remove the checklist from this specific machine.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Checklist:</strong> {record.checklist_name}<br/>
                  {/* <strong>Machine:</strong> {record.machine_make} */}
                </p>
              </div>
            }
            onConfirm={() => handleDeleteAssignment(record.id, record.checklist_name, record.machine_make)}
            okText="Yes, Remove"
            cancelText="Cancel"
            okType="danger"
            placement="topRight"
          >
            <Tooltip title="Remove Assignment">
              <Button 
                icon={<DeleteOutlined />} 
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <div>
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Machine Checklist Assignments</h2>
          <p className="text-sm text-gray-500">Assign checklists to machines for operator completion</p>
        </div>
        <Space>
          <Tooltip title="Refresh Data">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              loading={loading}
            />
          </Tooltip>
          <Button 
            type="primary" 
            icon={<LinkOutlined />} 
            onClick={handleAssignChecklist}
          >
            Assign Checklist
          </Button>
        </Space>
      </div>
      
      <Card className="mb-4">
        <div className="flex items-center">
          <span className="mr-2 font-medium">Select Machine:</span>
          <Select
            placeholder="Select a machine to see its assigned checklists"
            onChange={handleMachineChange}
            style={{ width: 400 }}
            loading={loading}
            optionLabelProp="label"
          >
            {machines.filter(machine => !isDefaultMachine(machine)).map(machine => (
              <Option 
                key={machine.id} 
                value={machine.id}
                label={getMachineName(machine)}
              >
                <div className="flex flex-col">
                  <div className="font-medium">{getMachineName(machine)}</div>
                  <div className="text-xs text-gray-500">
                    {machine.type && <span className="mr-2">Type: {machine.type}</span>}
                    {machine.cnc_controller && <span>Controller: {machine.cnc_controller}</span>}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
          
          {selectedMachine && (
            <div className="ml-4">
              <Tag color="blue">
                {getMachineName(machines.find(m => m.id === selectedMachine) || {})}
              </Tag>
            </div>
          )}
        </div>
      </Card>
      
      {selectedMachine ? (
        <Table
          columns={columns}
          dataSource={machineAssignments}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      ) : (
        <div className="bg-white p-8 rounded-md shadow-sm">
          <Empty
            description={
              <span>
                Please select a machine to view its assigned checklists
              </span>
            }
          />
        </div>
      )}
      
      {/* Assign Checklist Modal */}
      <Modal
        title="Assign Checklist to Machine"
        open={isAssignModalVisible}
        onCancel={() => {
          form.resetFields();
          setIsAssignModalVisible(false);
        }}
        onOk={handleAssignSubmit}
        width={600}
        okText="Assign"
      >
        <Form
          form={form}
          layout="vertical"
        >
          {selectedMachine ? (
            <div className="mb-4 bg-gray-50 p-4 rounded-md">
              <Descriptions title="Selected Machine" size="small" column={1} bordered>
                <Descriptions.Item label="Machine ID">
                  {selectedMachine}
                </Descriptions.Item>
                <Descriptions.Item label="Machine Details">
                  {getMachineName(machines.find(m => m.id === selectedMachine) || {})}
                </Descriptions.Item>
                {machines.find(m => m.id === selectedMachine)?.work_center?.code && (
                  <Descriptions.Item label="work centre Code">
                    {machines.find(m => m.id === selectedMachine)?.work_center?.code}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          ) : (
            <Alert
              message="Please select a machine first"
              type="warning"
              showIcon
              className="mb-4"
            />
          )}
          
          <Form.Item
            name="checklist_id"
            label="Select Checklist"
            rules={[{ required: true, message: 'Please select a checklist' }]}
          >
            <Select placeholder="Select a checklist to assign">
              {checklists.filter(c => c.is_active).map(checklist => (
                <Option key={checklist.id} value={checklist.id}>
                  {checklist.name} ({checklist.items?.length || 0} items)
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssignmentsTab; 