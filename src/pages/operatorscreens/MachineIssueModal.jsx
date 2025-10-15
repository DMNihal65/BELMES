import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, Radio, Spin, Tabs } from 'antd';
import { AlertTriangle, Wrench, Package2 } from 'lucide-react';
import useWebSocketStore from '../../store/websocket-store';
import useAuthStore from '../../store/auth-store'; 
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import moment from 'moment';
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const MachineIssueModal = ({ 
  visible, 
  onClose
}) => {
  // Forms
  const [oeeissueForm] = Form.useForm();
  const [machineForm] = Form.useForm();
  const [componentForm] = Form.useForm();
  
  // States
  const [activeTab, setActiveTab] = useState('oeeissue');
  const [oeeissueCategory, setoeeissueCategory] = useState('availability');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [machineIssueCategory, setMachineIssueCategory] = useState('availability');

  // Get store values
  const { submitMachineIssue, submitComponentIssue, submitoeeissueIssue, maintenanceLoading, jobData, fetchAllOrders, submitBreakdownIssue, submitOeeIssueReport } = useWebSocketStore();
  
  // Get user ID from localStorage as fallback
  const getUserId = () => {
    // First try from auth store
    const storeUserId = useAuthStore.getState().user_id;
    if (storeUserId) return storeUserId;

    // Then try from localStorage
    const localUserId = localStorage.getItem('user_id');
    if (localUserId) return localUserId;

    return null;
  };

  // Fetch orders when modal opens
  useEffect(() => {
    if (visible && activeTab === 'component') {
      fetchOrders();
    }
  }, [visible, activeTab]);

  // Function to fetch orders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const result = await fetchAllOrders();
      if (result.success) {
        setOrders(result.data);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (visible) {
      oeeissueForm.resetFields();
      machineForm.resetFields();
      componentForm.resetFields();
      setActiveTab('oeeissue');
      setoeeissueCategory('availability');
      setMachineIssueCategory('availability');

      // Check if user is logged in when modal opens
      const userId = getUserId();
      if (!userId) {
        toast.error('Please log in to submit issues');
        onClose();
      }
    }
  }, [visible, oeeissueForm, machineForm, componentForm]);

  // oeeissue reasons based on category
  const oeeissueReasons = {
    availability: [
      'Machine oeeissue',
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

  // Machine issue reasons based on category (new)
  const machineIssueReasons = {
    availability: [
      'Machine Breakdown',
      'Electrical Issue',
      'Mechanical Issue',
      'Hydraulic Issue',
      'Pneumatic Issue',
      'Software Issue',
      'Emergency Stop'
    ],
    quality: [
      'Tooling Issue',
      'Material Issue',
      'Calibration Issue',
      'Measurement Issue',
      'Surface Finish Issue'
    ],
    performance: [
      'Slow Cycle Time',
      'Intermittent Stoppages',
      'Excessive Vibration',
      'Noise Issue',
      'Heating Issue'
    ]
  };

  // Get current part number from jobData
  const getCurrentPartNumber = () => {
    if (jobData?.part_number) {
      return jobData.part_number;
    }
    
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

  // Handle submit
  const handleSubmit = async (type) => {
    try {
      // Check user ID before proceeding
      const currentUserId = getUserId();
      if (!currentUserId) {
        toast.error('User ID not available. Please try logging in again.');
        onClose();
        return;
      }

      let machineId;
      const storedMachine = localStorage.getItem('currentMachine');
      if (storedMachine) {
        const machineData = JSON.parse(storedMachine);
        machineId = machineData?.id;
      }
      
      if (!machineId) {
        toast.error('No machine ID available');
        onClose();
        return;
      }

      let values;
      switch (type) {
        case 'oeeissue':
          values = await oeeissueForm.validateFields();
          const [startTime, endTime] = values.timeRange || [null, null];
          if (!startTime || !endTime) {
            toast.error('Please select both start and end times');
            return;
          }

          // Normalize picker values (supports Moment or Dayjs) and add +5:30 hours
          const toAdjustedIso = (value) => {
            let m;
            if (moment.isMoment(value)) {
              m = value.clone();
            } else if (value && typeof value === 'object' && typeof value.toDate === 'function') {
              // Likely a Dayjs instance
              m = moment(value.toDate());
            } else {
              m = moment(value);
            }
            return m.add(330, 'minutes').toISOString();
          };

          const adjustedStart = toAdjustedIso(startTime);
          const adjustedEnd = toAdjustedIso(endTime);

          const oeeIssuePayload = {
            category: "OEE",
            description: values.oeeissueReason.join(', '),
            machine: machineId,
            reported_by: parseInt(currentUserId),
            timestamp: adjustedStart,
            end_timestamp: adjustedEnd
          };

          const oeeissueResult = await submitOeeIssueReport(oeeIssuePayload);
          if (oeeissueResult?.success) {
            toast.success('OEE Issue submitted successfully');
            onClose();
          } else {
            toast.error(oeeissueResult?.error || 'Failed to submit OEE Issue');
          }
          break;

        case 'machine':
          values = await machineForm.validateFields();
          
          // Combine selected reasons and additional description
          const selectedReasons = values.machineIssueReason ? values.machineIssueReason.join(', ') : '';
          const additionalDesc = values.description || '';
          const combinedDescription = additionalDesc ? `${selectedReasons} - ${additionalDesc}` : selectedReasons;
          
          const machinePayload = {
            machine_id: values.machineId,
            description: combinedDescription,
            is_on: values.machineStatus === 'ON',
            created_by: currentUserId.toString()
          };

          const result = await submitMachineIssue(machineId, machinePayload);
          
          // Second API call for downtime issue
          const downtimePayload = {
            machine_id: machineId,
            category: values.machineIssueCategory,
            description: combinedDescription,
            priority: 0,
            reported_by: parseInt(currentUserId)
          };
          
          const downtimeResult = await submitBreakdownIssue(downtimePayload);

          if (result?.success && downtimeResult?.success) {
            toast.success('Machine and Downtime issues submitted successfully');
            onClose();
          } else {
            toast.error(result?.error || downtimeResult?.error || 'Failed to submit machine issue');
          }
          break;

        case 'component':
          values = await componentForm.validateFields();
          if (!values.partNumber) {
            toast.error('Please select a part number');
            return;
          }

          // Get user ID using the existing getUserId function
          const componentUserId = getUserId();
          if (!componentUserId) {
            toast.error('User ID is not available. Please log in again.');
            return;
          }

          const componentResult = await submitComponentIssue(values.partNumber, {
            description: values.description || '',
            componentStatus: values.componentStatus,
            created_by: componentUserId.toString()
          });

          if (componentResult?.success) {
            toast.success('Component issue submitted successfully');
            componentForm.resetFields();
            onClose();
          } else {
            toast.error(componentResult?.error || 'Failed to submit component issue');
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Form validation failed:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <>
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
          {/* oeeissue Tab */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                OEE Issue
              </span>
            }
            key="oeeissue"
          >
            <Form 
              form={oeeissueForm}
              layout="vertical" 
              className="p-4"
            >
              <div className="space-y-4">
                <Form.Item 
                  name="oeeissueCategory" 
                  label="Issue Category"
                  className="mb-6"
                  initialValue={oeeissueCategory}
                >
                  <Radio.Group 
                    onChange={(e) => setoeeissueCategory(e.target.value)}
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
                  name="oeeissueReason"
                  label="Issue Reason(description)"
                  rules={[{ required: true, message: 'Please select or enter a reason' }]}
                >
                  <Select
                    mode="tags"
                    placeholder="Select a reason or enter custom"
                    className="w-full"
                  >
                    {oeeissueReasons[oeeissueCategory]?.map(reason => (
                      <Option key={reason} value={reason}>
                        {reason}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                    name="timeRange"
                    label="Start and End Time"
                    rules={[{ required: true, message: 'Please select start and end times' }]}
                  >
                    <RangePicker
                      showTime={{ format: 'HH:mm:ss' }}
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder={['Start Time', 'End Time']}
                      className="w-full"
                    />
                  </Form.Item>

                <Button 
                  type="primary" 
                  danger
                  onClick={() => handleSubmit('oeeissue')}
                  loading={maintenanceLoading}
                  block
                  size="large"
                >
                  Submit OEE Issue Report
                </Button>
              </div>
            </Form>
          </TabPane>

          {/* Machine Breakdown Tab */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Machine Breakdown
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
                name="machineIssueCategory" 
                label="Issue Category"
                className="mb-6"
                initialValue={machineIssueCategory}
              >
                <Radio.Group 
                  onChange={(e) => setMachineIssueCategory(e.target.value)}
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
                name="machineIssueReason"
                label="Issue Reason (description)"
                rules={[{ required: true, message: 'Please select or enter a reason' }]}
              >
                <Select
                  mode="tags"
                  placeholder="Select a reason or enter custom"
                  className="w-full"
                >
                  {machineIssueReasons[machineIssueCategory]?.map(reason => (
                    <Option key={reason} value={reason}>
                      {reason}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label="Additional Description (Optional)"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Add any additional details about the machine issue"
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
                size="large"
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
              
              <Form.Item
                name="partNumber"
                label="Part Number"
                rules={[{ required: true, message: 'Please select a part number' }]}
              >
                <Select
                  placeholder="Select part number"
                  loading={loadingOrders}
                  showSearch
                  optionFilterProp="children"
                  style={{ width: '100%' }}
                >
                  {orders.map((order) => (
                    <Option key={order.part_number} value={order.part_number}>
                      {`${order.part_number} - ${order.part_description}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

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
      <ToastContainer />
    </>
  );
};

export default MachineIssueModal; 








