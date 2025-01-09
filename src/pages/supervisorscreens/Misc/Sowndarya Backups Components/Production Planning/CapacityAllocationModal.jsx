import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Select, InputNumber, DatePicker, 
  Space, Button, Alert, Table, Divider, Card, 
  Row, Col, Timeline, Tooltip, Progress, Tag, Badge,
  Descriptions, message 
} from 'antd';
import { 
  InfoCircleOutlined, WarningOutlined, 
  CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import { mockPartNumbers } from '../../data/mockPlanningData';

const CapacityAllocationModal = ({ visible, onCancel, machines }) => {
  const [form] = Form.useForm();
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (selectedMachine) {
      analyzeMachineCapacity(selectedMachine);
    }
  }, [selectedMachine]);

  useEffect(() => {
    // Auto-fill cycle time when part is selected
    if (selectedPart) {
      const part = mockPartNumbers.find(p => p.id === selectedPart);
      if (part) {
        form.setFieldsValue({
          cycleTime: part.cycleTime,
          setupTime: part.setupTime
        });
      }
    }
  }, [selectedPart]);

  const getFilteredParts = (machineId) => {
    return mockPartNumbers.filter(part => 
      part.machineTypes.includes(machineId)
    );
  };

  const handleMachineChange = (value) => {
    setSelectedMachine(value);
    // Reset part selection when machine changes
    form.setFieldsValue({ partNumber: undefined });
    setSelectedPart(null);
    
    // Check for conflicts
    const machine = machines.find(m => m.id === value);
    if (machine) {
      analyzeMachineCapacity(value);
    }
  };

  const handlePartChange = (value) => {
    setSelectedPart(value);
  };

  const analyzeMachineCapacity = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;

    const utilization = (machine.usedCapacity / machine.totalCapacity) * 100;
    const newConflicts = [];
    const newSuggestions = [];

    // Utilization checks
    if (utilization > 80) {
      newConflicts.push({
        type: 'warning',
        message: 'High utilization period',
        description: 'Selected machine is already at 80% capacity during this period.'
      });
      
      // Find alternative machines
      const alternatives = machines
        .filter(m => m.id !== machineId && m.usedCapacity / m.totalCapacity < 0.7)
        .map(m => ({
          id: m.id,
          name: m.name,
          availableCapacity: m.totalCapacity - m.usedCapacity
        }));

      if (alternatives.length > 0) {
        newSuggestions.push({
          type: 'info',
          message: 'Alternative machines available',
          machines: alternatives
        });
      }
    }

    // Efficiency checks
    if (machine.efficiency < 85) {
      newConflicts.push({
        type: 'warning',
        message: 'Low efficiency warning',
        description: 'Machine efficiency is below optimal levels.'
      });
    }

    setConflicts(newConflicts);
    setSuggestions(newSuggestions);
  };

  const calculateRequiredCapacity = (values) => {
    if (!values.quantity || !values.cycleTime) return 0;
    const setupTime = values.setupTime || 0;
    const totalMinutes = (values.quantity * values.cycleTime) + setupTime;
    return totalMinutes / 60; // Convert to hours
  };

  const renderPartDetails = () => {
    if (!selectedPart) return null;
    const part = mockPartNumbers.find(p => p.id === selectedPart);
    if (!part) return null;

    return (
      <Card size="small" className="mt-4">
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="Material">
            {part.specifications.material}
          </Descriptions.Item>
          <Descriptions.Item label="Weight">
            {part.specifications.weight}
          </Descriptions.Item>
          <Descriptions.Item label="Dimensions">
            {part.specifications.dimensions}
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={part.priority === 'high' ? 'red' : 'blue'}>
              {part.priority.toUpperCase()}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const requiredCapacity = calculateRequiredCapacity(values);
      
      // Validate capacity availability
      const machine = machines.find(m => m.id === values.machineId);
      const availableCapacity = machine.totalCapacity - machine.usedCapacity;
      
      if (requiredCapacity > availableCapacity) {
        Modal.confirm({
          title: 'Capacity Exceeded',
          content: (
            <div>
              <p>Required capacity ({requiredCapacity.toFixed(1)} hrs) exceeds available capacity ({availableCapacity.toFixed(1)} hrs).</p>
              <p>Would you like to see optimization suggestions?</p>
            </div>
          ),
          onOk: () => showOptimizationSuggestions(values, requiredCapacity, availableCapacity),
        });
        return;
      }

      // Calculate estimated completion time
      const startDate = values.dateRange[0].toDate();
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + requiredCapacity);

      const allocationData = {
        ...values,
        machineId: values.machineId,
        partNumber: values.partNumber,
        quantity: values.quantity,
        requiredCapacity,
        estimatedStart: startDate,
        estimatedEnd: endDate,
        status: 'pending'
      };

      console.log('Allocation values:', allocationData);
      message.success('Capacity allocated successfully');
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields');
    }
  };

  const showOptimizationSuggestions = (values, required, available) => {
    // Find alternative machines that can handle this part
    const part = mockPartNumbers.find(p => p.id === values.partNumber);
    const alternatives = machines.filter(m => 
      m.id !== values.machineId && 
      part.machineTypes.includes(m.id) &&
      (m.totalCapacity - m.usedCapacity) >= required
    );

    Modal.info({
      title: 'Optimization Suggestions',
      width: 600,
      content: (
        <div>
          <Alert
            message="Capacity Optimization Required"
            description={`Required capacity (${required.toFixed(1)} hrs) exceeds available capacity (${available.toFixed(1)} hrs)`}
            type="warning"
            showIcon
            className="mb-4"
          />
          
          {alternatives.length > 0 ? (
            <>
              <p className="font-medium mb-2">Alternative Machines Available:</p>
              <ul>
                {alternatives.map(machine => (
                  <li key={machine.id} className="mb-2">
                    <strong>{machine.name}</strong>
                    <div className="text-sm text-gray-500">
                      Available Capacity: {(machine.totalCapacity - machine.usedCapacity).toFixed(1)} hrs
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Alert
              message="No Alternative Machines"
              description="No other machines are available for this part with sufficient capacity."
              type="error"
              showIcon
            />
          )}

          <Divider />
          
          <p className="font-medium mb-2">Other Options:</p>
          <ul>
            <li>Split the production quantity across multiple machines</li>
            <li>Adjust the production schedule to a different time period</li>
            <li>Review and optimize existing allocations</li>
          </ul>
        </div>
      ),
      onOk() {},
    });
  };

  return (
    <Modal
      title={
        <div>
          <h3 className="text-lg font-semibold">Allocate Machine Capacity</h3>
          <p className="text-sm text-gray-500 mt-1">
            Plan and allocate machine capacity for production
          </p>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Allocate
        </Button>
      ]}
    >
      <Row gutter={16}>
        <Col span={16}>
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="machineId"
              label="Select Machine"
              rules={[{ required: true }]}
            >
              <Select
                onChange={handleMachineChange}
                options={machines.map(m => ({
                  value: m.id,
                  label: `${m.name} (${m.id})`
                }))}
              />
            </Form.Item>

            {selectedMachine && (
              <Form.Item
                name="partNumber"
                label="Part Number"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder="Select part number"
                  onChange={handlePartChange}
                  options={getFilteredParts(selectedMachine).map(part => ({
                    value: part.id,
                    label: `${part.id} - ${part.name}`
                  }))}
                  optionFilterProp="label"
                />
              </Form.Item>
            )}

            {selectedPart && renderPartDetails()}

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="quantity"
                  label="Quantity"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="cycleTime"
                  label="Cycle Time (min)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="setupTime"
                  label="Setup Time (min)"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="dateRange"
              label="Production Period"
              rules={[{ required: true }]}
            >
              <DatePicker.RangePicker 
                showTime 
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>

          {selectedMachine && (
            <>
              <Divider>Capacity Analysis</Divider>
              <Table
                size="small"
                pagination={false}
                columns={[
                  { title: 'Period', dataIndex: 'period' },
                  { 
                    title: 'Available Capacity', 
                    dataIndex: 'available',
                    render: (value) => (
                      <Progress 
                        percent={value} 
                        size="small"
                        status={value < 20 ? 'exception' : 'normal'}
                      />
                    )
                  },
                  { 
                    title: 'Required Capacity',
                    dataIndex: 'required',
                    render: (value) => (
                      <Tag color={value > 80 ? 'red' : 'green'}>
                        {value}%
                      </Tag>
                    )
                  },
                  { 
                    title: 'Status',
                    dataIndex: 'status',
                    render: (status) => (
                      <Badge status={status === 'available' ? 'success' : 'error'} 
                        text={status} 
                      />
                    )
                  },
                ]}
                dataSource={[
                  // Add capacity summary data
                ]}
              />
            </>
          )}
        </Col>
        
        <Col span={8}>
          <Card title="Capacity Analysis" size="small">
            {conflicts.map((conflict, index) => (
              <Alert
                key={index}
                message={conflict.message}
                description={conflict.description}
                type={conflict.type}
                showIcon
                className="mb-4"
              />
            ))}

            {suggestions.map((suggestion, index) => (
              <Alert
                key={index}
                message={suggestion.message}
                type="info"
                showIcon
                description={
                  <div>
                    <p>Alternative machines:</p>
                    <ul>
                      {suggestion.machines.map(machine => (
                        <li key={machine.id}>
                          {machine.name} ({machine.availableCapacity}hrs available)
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                className="mb-4"
              />
            ))}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default CapacityAllocationModal; 