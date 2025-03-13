import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, Radio, message, Spin } from 'antd';
import { AlertTriangle, Wrench, Package2 } from 'lucide-react';
import useWebSocketStore from '../../store/websocket-store';

const { Option } = Select;
const { TextArea } = Input;

const MachineIssueModal = ({ 
  visible, 
  onClose, 
  machineId
}) => {
  const [form] = Form.useForm();
  const [issueType, setIssueType] = useState('machine');
  
  const { 
    submitMachineIssue, 
    submitComponentIssue, 
    fetchMachineOperations,
    maintenanceLoading,
    jobData // Get jobData from the store
  } = useWebSocketStore();

  // Get current part number from jobData
  const currentPartNumber = jobData?.part_number;

  // Fetch machine operations when modal opens
  useEffect(() => {
    if (visible && machineId) {
      fetchMachineOperations(machineId);
    }
  }, [visible, machineId, fetchMachineOperations]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setIssueType('machine');
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      let result;
      if (issueType === 'machine') {
        result = await submitMachineIssue(machineId, {
          description: values.description,
          machineStatus: values.machineStatus
        });
      } else {
        // Use current part number from jobData
        if (!currentPartNumber) {
          message.error('No part number available for current job');
          return;
        }
        
        result = await submitComponentIssue(currentPartNumber, {
          description: values.description,
          componentStatus: values.componentStatus
        });
      }

      if (result.success) {
        message.success(result.message);
        onClose();
      } else {
        message.error(result.message || 'Failed to submit ticket');
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="h-5 w-5" />
          <span>Raise Issue</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          danger 
          onClick={handleSubmit}
          loading={maintenanceLoading}
        >
          Submit Ticket
        </Button>
      ]}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{ 
          issueType: 'machine',
          machineStatus: 'ON'  // Default to ON
        }}
      >
        <Form.Item name="issueType">
          <Radio.Group 
            onChange={(e) => setIssueType(e.target.value)} 
            value={issueType}
            className="flex gap-4"
          >
            <Radio.Button value="machine" className="flex items-center gap-2 py-2 px-4">
              <Wrench className="h-4 w-4" />
              Machine Issue
            </Radio.Button>
            <Radio.Button value="component" className="flex items-center gap-2 py-2 px-4">
              <Package2 className="h-4 w-4" />
              Component Issue
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {issueType === 'machine' && (
          <Form.Item
            name="machineStatus"
            label="Machine Status"
            rules={[{ required: true, message: 'Please select machine status' }]}
          >
            <Select placeholder="Select machine status">
              <Option value="ON">ON - Machine is available</Option>
              <Option value="OFF">OFF - Machine is not available</Option>
            </Select>
          </Form.Item>
        )}

        {issueType === 'component' && (
          <>
            <Form.Item
              name="componentStatus"
              label="Component Status"
              rules={[{ required: true, message: 'Please select component status' }]}
            >
              <Select placeholder="Select component status">
                <Option value="available">Available</Option>
                <Option value="notAvailable">Not Available</Option>
              </Select>
            </Form.Item>
            
            {/* Show current part number from jobData */}
            <div className="mb-4 text-xs text-gray-500">
              Using part number: {currentPartNumber || 'No part number available'}
            </div>
          </>
        )}

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please provide a description' }]}
        >
          <TextArea 
            rows={4} 
            placeholder={`Describe the ${issueType} issue`}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
      
      {maintenanceLoading && (
        <div className="flex justify-center mt-4">
          <Spin tip="Loading..." />
        </div>
      )}
    </Modal>
  );
};

export default MachineIssueModal; 