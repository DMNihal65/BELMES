import React, { useState, useEffect } from 'react';
import { 
  List, Checkbox, Card, Space, Button, Typography, Tag, Input, 
  Divider, Alert, Spin, Empty, Steps, message, Tooltip, Result,
  InputNumber, Form, Modal
} from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import axios from 'axios';
import useAuthStore from '../../../store/auth-store';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.18.7.88:6643';

const PokaYokeChecklist = ({ jobId, machineId }) => {
  const { currentUser, currentMachine } = useAuthStore();
  const [form] = Form.useForm();
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [machineAssignments, setMachineAssignments] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistDetails, setChecklistDetails] = useState(null);
  const [responses, setResponses] = useState({});
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState('');
  const [selectedPartNumber, setSelectedPartNumber] = useState('');

  // Get effective machine ID - either from props or from auth store
  const effectiveMachineId = machineId || currentMachine?.id;

  // Initialize with production order information if available from localStorage
  useEffect(() => {
    const machineStatus = localStorage.getItem('machineStatus');
    if (machineStatus) {
      try {
        const parsedStatus = JSON.parse(machineStatus);
        if (parsedStatus.production_order) {
          setSelectedProductionOrder(parsedStatus.production_order);
        }
        if (parsedStatus.part_number) {
          setSelectedPartNumber(parsedStatus.part_number);
        }
      } catch (error) {
        console.error('Error parsing machine status:', error);
      }
    }
  }, []);

  // Fetch machine assignments when component mounts
  useEffect(() => {
    if (effectiveMachineId) {
      fetchMachineAssignments(effectiveMachineId);
    }
  }, [effectiveMachineId]);
  
  // Reset responses when checklist changes
  useEffect(() => {
    if (checklistDetails) {
      const initialResponses = {};
      checklistDetails.items.forEach(item => {
        initialResponses[item.id] = {
          item_id: item.id,
          item_text: item.item_text,
          response_value: item.item_type === 'boolean' ? 'false' : '',
          is_conforming: false
        };
      });
      setResponses(initialResponses);
    }
  }, [checklistDetails]);

  // Fetch checklists assigned to the machine
  const fetchMachineAssignments = async (machineId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/pokayoke/assignments/machine/${machineId}`, {
        params: { active_only: true },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMachineAssignments(response.data);
      
      // Auto-select checklist if there's only one
      if (response.data.length === 1) {
        handleChecklistSelect(response.data[0].checklist_id);
      }
    } catch (error) {
      console.error('Error fetching machine assignments:', error);
      setError('Failed to fetch checklists assigned to this machine');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch checklist details
  const handleChecklistSelect = async (checklistId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/pokayoke/checklists/${checklistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChecklistDetails(response.data);
      setSelectedChecklist(checklistId);
      setCurrentStep(1); // Move to checklist items step
    } catch (error) {
      console.error('Error fetching checklist details:', error);
      setError('Failed to fetch checklist details');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle response changes for different item types
  const handleResponseChange = (itemId, value) => {
    const item = checklistDetails.items.find(item => item.id === itemId);
    
    // Determine if response is conforming based on item type and expected value
    let isConforming = false;
    if (item.item_type === 'boolean') {
      // For boolean, true is typically conforming unless expected_value is explicitly set to 'false'
      isConforming = value === 'true' && item.expected_value !== 'false';
    } else if (item.item_type === 'numerical' && item.expected_value) {
      // Parse numerical validation
      const numValue = parseFloat(value);
      
      if (item.expected_value.startsWith('>=')) {
        const threshold = parseFloat(item.expected_value.substring(2));
        isConforming = numValue >= threshold;
      } else if (item.expected_value.startsWith('<=')) {
        const threshold = parseFloat(item.expected_value.substring(2));
        isConforming = numValue <= threshold;
      } else if (item.expected_value.startsWith('>')) {
        const threshold = parseFloat(item.expected_value.substring(1));
        isConforming = numValue > threshold;
      } else if (item.expected_value.startsWith('<')) {
        const threshold = parseFloat(item.expected_value.substring(1));
        isConforming = numValue < threshold;
      } else if (item.expected_value.includes('-')) {
        // Range (min-max)
        const [min, max] = item.expected_value.split('-').map(v => parseFloat(v));
        isConforming = numValue >= min && numValue <= max;
      } else if (!isNaN(parseFloat(item.expected_value))) {
        // Exact match
        isConforming = numValue === parseFloat(item.expected_value);
      }
    } else {
      // For text items or no expected_value, consider as conforming
      isConforming = true;
    }
    
    setResponses({
      ...responses,
      [itemId]: {
        ...responses[itemId],
        response_value: value.toString(),
        is_conforming: isConforming
      }
    });
  };
  
  // Check if all required items are completed
  const areAllRequiredItemsCompleted = () => {
    if (!checklistDetails) return false;
    
    return checklistDetails.items.every(item => {
      if (!item.is_required) return true;
      
      const response = responses[item.id];
      if (!response) return false;
      
      if (item.item_type === 'boolean') {
        return response.response_value === 'true' || response.response_value === 'false';
      } else if (item.item_type === 'numerical') {
        return response.response_value !== '' && !isNaN(parseFloat(response.response_value));
      } else {
        return response.response_value.trim() !== '';
      }
    });
  };
  
  // Check if all responses are conforming
  const areAllResponsesConforming = () => {
    if (!checklistDetails) return false;
    
    return Object.values(responses).every(response => response.is_conforming);
  };
  
  // Handle checklist submission
  const handleSubmit = async () => {
    if (!selectedProductionOrder || !selectedPartNumber) {
      setIsConfirmModalVisible(true);
      return;
    }
    
    submitChecklist();
  };
  
  // Submit checklist after confirmation
  const submitChecklist = async () => {
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const submissionData = {
        checklist_id: selectedChecklist,
        machine_id: effectiveMachineId,
        production_order: selectedProductionOrder,
        part_number: selectedPartNumber,
        comments: comments,
        item_responses: Object.values(responses)
      };
      
      await axios.post(`${API_BASE_URL}/pokayoke/complete/`, submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubmitted(true);
      message.success('Checklist completed successfully!');
    } catch (error) {
      console.error('Error submitting checklist:', error);
      message.error('Failed to submit checklist');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Confirm modal submission
  const handleConfirmSubmit = () => {
    form.validateFields()
      .then(values => {
        setSelectedProductionOrder(values.production_order);
        setSelectedPartNumber(values.part_number);
        setIsConfirmModalVisible(false);
        submitChecklist();
      })
      .catch(info => {
        console.log('Validation failed:', info);
      });
  };
  
  // Reset the checklist process
  const handleReset = () => {
    setCurrentStep(0);
    setSelectedChecklist(null);
    setChecklistDetails(null);
    setResponses({});
    setComments('');
    setSubmitted(false);
  };
  
  // Render response input based on item type
  const renderResponseInput = (item) => {
    switch (item.item_type) {
      case 'boolean':
        return (
          <Space>
            <Button
              type={responses[item.id]?.response_value === 'true' ? 'primary' : 'default'}
              onClick={() => handleResponseChange(item.id, 'true')}
              className="w-20"
            >
              Yes
            </Button>
            <Button
              type={responses[item.id]?.response_value === 'false' ? 'primary' : 'default'}
              onClick={() => handleResponseChange(item.id, 'false')}
              className="w-20"
              danger={responses[item.id]?.response_value === 'false'}
            >
              No
            </Button>
          </Space>
        );
        
      case 'numerical':
        return (
          <div className="flex items-center space-x-2">
            <InputNumber
              value={responses[item.id]?.response_value ? parseFloat(responses[item.id].response_value) : null}
              onChange={(value) => handleResponseChange(item.id, value !== null ? value.toString() : '')}
              className="w-32"
              status={responses[item.id]?.is_conforming === false ? 'error' : ''}
            />
            {item.expected_value && (
              <Tooltip title={`Expected: ${item.expected_value}`}>
                <InfoCircleOutlined className="text-blue-500" />
              </Tooltip>
            )}
          </div>
        );
        
      case 'text':
      default:
        return (
          <Input
            value={responses[item.id]?.response_value}
            onChange={(e) => handleResponseChange(item.id, e.target.value)}
            placeholder="Enter response"
          />
        );
    }
  };
  
  // Render response status indicator
  const renderResponseStatus = (item) => {
    const response = responses[item.id];
    
    if (!response || (item.item_type === 'boolean' && response.response_value === '') || 
        (item.item_type !== 'boolean' && response.response_value.trim() === '')) {
      return null;
    }
    
    return response.is_conforming ? (
      <Tag color="success" className="ml-2">
        <CheckCircleOutlined /> Conforming
      </Tag>
    ) : (
      <Tag color="error" className="ml-2">
        <CloseCircleOutlined /> Non-conforming
      </Tag>
    );
  };
  
  // Render different steps of the process
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Select checklist
        return (
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              </div>
            ) : machineAssignments.length > 0 ? (
              <List
                dataSource={machineAssignments}
                renderItem={assignment => (
                  <List.Item
                    className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    onClick={() => handleChecklistSelect(assignment.checklist_id)}
                  >
                    <div className="flex items-center justify-between w-full cursor-pointer">
                      <div>
                        <Text strong>{assignment.checklist_name}</Text>
                        <div className="text-gray-500 text-sm mt-1">
                          Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                        </div>
                      </div>
                      <Button type="primary" size="small">
                        Select
                      </Button>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description={
                  <span>
                    No checklists assigned to this machine.
                    <br />
                    Please contact your supervisor.
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
            
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                className="mt-4"
              />
            )}
          </div>
        );
        
      case 1: // Fill checklist
        return (
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              </div>
            ) : checklistDetails ? (
              <div className="space-y-6">
                <Alert
                  message="Please complete all required items"
                  description="Items marked as required must be completed before submission."
                  type="info"
                  showIcon
                  className="mb-4"
                />
                
                <List
                  dataSource={checklistDetails.items}
                  renderItem={(item, index) => (
                    <List.Item
                      className={`bg-white rounded-lg p-4 mb-4 border ${
                        responses[item.id]?.is_conforming === false
                          ? 'border-red-200 bg-red-50'
                          : responses[item.id]?.is_conforming
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                              {index + 1}
                            </div>
                            <Text strong>{item.item_text}</Text>
                            {item.is_required && (
                              <Tag color="blue" className="ml-2">Required</Tag>
                            )}
                            {renderResponseStatus(item)}
                          </div>
                        </div>
                        
                        <div className="ml-11 mb-3">
                          {renderResponseInput(item)}
                        </div>
                        
                        {item.expected_value && (
                          <div className="ml-11 text-sm text-gray-500">
                            <InfoCircleOutlined className="mr-1" />
                            Expected: {item.expected_value}
                          </div>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <Text strong>Additional Comments</Text>
                  <TextArea
                    placeholder="Enter any additional comments or observations..."
                    rows={4}
                    className="mt-2"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    {!areAllRequiredItemsCompleted() && (
                      <Tag icon={<WarningOutlined />} color="warning">
                        Required items not completed
                      </Tag>
                    )}
                    {areAllRequiredItemsCompleted() && !areAllResponsesConforming() && (
                      <Tag icon={<WarningOutlined />} color="warning">
                        Non-conforming responses detected
                      </Tag>
                    )}
                    {areAllRequiredItemsCompleted() && areAllResponsesConforming() && (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        All items conforming
                      </Tag>
                    )}
                  </div>
                  <Space>
                    <Button onClick={handleReset}>Back</Button>
                    <Button
                      type="primary"
                      onClick={handleSubmit}
                      disabled={!areAllRequiredItemsCompleted() || submitting}
                      loading={submitting}
                    >
                      Submit Checklist
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <Empty description="Checklist details not found" />
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render success or checklist process
  if (submitted) {
    return (
      <Result
        status="success"
        title="Checklist Completed Successfully!"
        subTitle="You can now proceed with your production tasks."
        extra={[
          <Button type="primary" key="done" onClick={handleReset}>
            New Checklist
          </Button>
        ]}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <Steps current={currentStep} className="mb-8">
        <Step title="Select Checklist" description="Choose from assigned checklists" />
        <Step title="Complete Items" description="Fill all required items" />
      </Steps>
      
      {renderStepContent()}
      
      <Modal
        title="Production Information Required"
        visible={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleConfirmSubmit}
        >
          <Form.Item
            name="production_order"
            label="Production Order"
            rules={[{ required: true, message: 'Please enter the production order' }]}
            initialValue={selectedProductionOrder}
          >
            <Input placeholder="Enter production order number" />
          </Form.Item>
          
          <Form.Item
            name="part_number"
            label="Part Number"
            rules={[{ required: true, message: 'Please enter the part number' }]}
            initialValue={selectedPartNumber}
          >
            <Input placeholder="Enter part number" />
          </Form.Item>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsConfirmModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PokaYokeChecklist; 