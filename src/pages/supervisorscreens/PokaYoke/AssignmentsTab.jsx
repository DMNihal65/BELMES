import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Select, Form, Input, Modal, message, Tag, Tooltip, Empty, Card, Descriptions, Alert } from 'antd';
import { LinkOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons';
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
    assignChecklistToMachine 
  } = usePokayokeStore();
  
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [form] = Form.useForm();
  
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
  
  const getMachineName = (machine) => {
    if (machine.work_center && machine.work_center.description) {
      return `${machine.work_center.description} (${machine.work_center.code})`;
    }
    return machine.make ? `${machine.make} ${machine.model || ''}` : `Machine ${machine.id}`;
  };
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '5%',
    },
    {
      title: 'Checklist',
      dataIndex: 'checklist_name',
      key: 'checklist_name',
      width: '25%',
    },
    {
      title: 'Machine ID',
      dataIndex: 'machine_id',
      key: 'machine_id',
      width: '10%',
    },
    {
      title: 'Machine Make',
      dataIndex: 'machine_make',
      key: 'machine_make',
      width: '25%',
    },
    {
      title: 'Assigned At',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      width: '15%',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: '10%',
      render: (active) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Checklist Details">
            <Button 
              icon={<FileSearchOutlined />} 
              size="small"
            />
          </Tooltip>
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
            style={{ width: 300 }}
            loading={loading}
          >
            {machines.map(machine => (
              <Option key={machine.id} value={machine.id}>
                {getMachineName(machine)}
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
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
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
                  <Descriptions.Item label="Work Center Code">
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