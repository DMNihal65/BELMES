import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, Radio, message, Spin, Tabs } from 'antd';
import { AlertTriangle, Wrench, Package2 } from 'lucide-react';
import useWebSocketStore from '../../store/websocket-store';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const MachineIssueModal = ({ 
  visible, 
  onClose
}) => {
  // Separate forms for each tab
  const [breakdownForm] = Form.useForm();
  const [machineForm] = Form.useForm();
  const [componentForm] = Form.useForm();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('breakdown');
  const [breakdownCategory, setBreakdownCategory] = useState('availability');

  const { 
    submitMachineIssue, 
    submitComponentIssue,
    machineStatus,
    maintenanceLoading,
    jobData
  } = useWebSocketStore();

  // Breakdown reasons based on category
  const breakdownReasons = {
    availability: [
      'Machine Breakdown',
      'Tool Change',
      'Setup/Adjustment',
      'Planned Maintenance',
      'Power Failure',
      'Material Shortage'
    ],
    quality: [
      'Product Defects',
      'Rework Required',
      'Quality Check Failure',
      'Calibration Issues',
      'Tool Wear'
    ],
    performance: [
      'Reduced Speed',
      'Minor Stoppages',
      'Process Deviation',
      'Operator Unavailable',
      'System Issues'
    ]
  };

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (visible) {
      // Reset all forms
      breakdownForm.resetFields();
      machineForm.resetFields();
      componentForm.resetFields();
      // Reset to default tab
      setActiveTab('breakdown');
      setBreakdownCategory('availability');
    }
  }, [visible, breakdownForm, machineForm, componentForm]);

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Get machine ID from localStorage
  const getMachineId = () => {
    try {
      const storedMachine = localStorage.getItem('currentMachine');
      if (storedMachine) {
        const machineData = JSON.parse(storedMachine);
        return machineData.id;
      }
    } catch (error) {
      console.error('Error getting machine ID:', error);
    }
    return null;
  };

  // Get current part number from jobData
  const getCurrentPartNumber = () => {
    // First try to get from jobData
    if (jobData?.part_number) {
      return jobData.part_number;
    }
    
    // Fallback to localStorage
    try {
      const storedJobData = localStorage.getItem('jobData');
      if (storedJobData) {
        const parsedJobData = JSON.parse(storedJobData);
        return parsedJobData.part_number;
      }
    } catch (error) {
      console.error('Error getting part number from localStorage:', error);
    }
    return null;
  };

  // Updated submit handler
  const handleSubmit = async (type) => {
    try {
      let values;
      switch (type) {
        case 'breakdown':
          values = await breakdownForm.validateFields();
          // Handle breakdown submission
          console.log('Breakdown submission:', values);
          break;
        case 'machine':
          values = await machineForm.validateFields();
          const machineId = getMachineId();
          if (!machineId) {
            message.error('No machine ID available');
            return;
          }
          const result = await submitMachineIssue(machineId, {
            description: values.description,
            machineStatus: values.machineStatus
          });
          if (result.success) {
            message.success('Machine issue submitted successfully');
            onClose();
          }
          break;
        case 'component':
          values = await componentForm.validateFields();
          const partNumber = getCurrentPartNumber();
          if (!partNumber) {
            message.error('No part number available');
            return;
          }
          const componentResult = await submitComponentIssue(partNumber, {
            description: values.description,
            componentStatus: values.componentStatus
          });
          if (componentResult.success) {
            message.success('Component issue submitted successfully');
            onClose();
          }
          break;
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // Get current part number for display
  const currentPartNumber = getCurrentPartNumber();

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="h-5 w-5" />
          <span>Raise Ticket</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        className="issue-tabs"
      >
        {/* Breakdown Tab */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Breakdown Issue
            </span>
          }
          key="breakdown"
        >
          <Form 
            form={breakdownForm}
            layout="vertical" 
            className="p-4"
          >
            <div className="space-y-4">
              <Form.Item 
                name="breakdownCategory" 
                label="Issue Category"
                className="mb-6"
              >
                <Radio.Group 
                  value={breakdownCategory} 
                  onChange={(e) => setBreakdownCategory(e.target.value)}
                  className="grid grid-cols-3 gap-4"
                >
                  <Radio.Button value="availability" className="text-center">
                    Availability
                  </Radio.Button>
                  <Radio.Button value="quality" className="text-center">
                    Quality
                  </Radio.Button>
                  <Radio.Button value="performance" className="text-center">
                    Performance
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="breakdownReason"
                label="Issue Reason"
                rules={[{ required: true, message: 'Please select or enter a reason' }]}
              >
                <Select
                  showSearch
                  placeholder="Select a reason or enter custom"
                  allowClear
                  mode="tags"
                  className="w-full"
                >
                  {breakdownReasons[breakdownCategory].map(reason => (
                    <Option key={reason} value={reason}>
                      {reason}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="breakdownDetails" label="Additional Details">
                <TextArea 
                  rows={4} 
                  placeholder="Enter any additional details about the breakdown..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item name="otherRemarks" label="Other Remarks">
                <TextArea 
                  rows={3} 
                  placeholder="Enter any other remarks..."
                  maxLength={300}
                  showCount
                />
              </Form.Item>

              <Button 
                type="primary" 
                danger
                onClick={() => handleSubmit('breakdown')}
                loading={maintenanceLoading}
                block
                size="large"
              >
                Submit Breakdown Report
              </Button>
            </div>
          </Form>
        </TabPane>

        {/* Machine Issue Tab */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Machine Issue
            </span>
          }
          key="machine"
        >
          <Form
            form={machineForm}
            layout="vertical"
            className="mt-4"
            initialValues={{ machineStatus: 'ON' }}
          >
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

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please provide a description' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Describe the machine issue"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Button 
              type="primary" 
              danger
              onClick={() => handleSubmit('machine')}
              loading={maintenanceLoading}
              block
            >
              Submit Machine Issue
            </Button>
          </Form>
        </TabPane>

        {/* Component Issue Tab */}
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              Component Issue
            </span>
          }
          key="component"
        >
          <Form
            form={componentForm}
            layout="vertical"
            className="mt-4"
            initialValues={{ componentStatus: 'available' }}
          >
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
            
            <div className="mb-4 text-xs text-gray-500">
              Using part number: {currentPartNumber || 'No part number available'}
            </div>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please provide a description' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Describe the component issue"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Button 
              type="primary" 
              danger
              onClick={() => handleSubmit('component')}
              loading={maintenanceLoading}
              block
            >
              Submit Component Issue
            </Button>
          </Form>
        </TabPane>
      </Tabs>

      {maintenanceLoading && (
        <div className="flex justify-center mt-4">
          <Spin tip="Loading..." />
        </div>
      )}
    </Modal>
  );
};

export default MachineIssueModal; 