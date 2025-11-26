import React, { useState } from 'react';
import { Modal, Form, Radio, Input, Button, message } from 'antd';
import { Clock3 } from 'lucide-react';

const downtimeCategories = [
  {
    id: 1,
    name: 'Machine Breakdown',
    description: 'Mechanical or electrical failure',
    subcategories: [
      'Mechanical Failure',
      'Electrical Issue',
      'Control System Error',
      'Hydraulic System',
      'Pneumatic System'
    ]
  },
  {
    id: 2,
    name: 'Tool Change',
    description: 'Scheduled or unscheduled tool replacement',
    
    subcategories: [
      'Tool Wear',
      'Tool Breakage',
      'Scheduled Change',
      'Tool Adjustment'
    ]
  },
  {
    id: 3,
    name: 'Setup/Changeover',
    description: 'Machine setup or product changeover',
    subcategories: [
      'Product Changeover',
      'Machine Setup',
      'Program Loading',
      'First Piece Inspection'
    ]
  },
  {
    id: 4,
    name: 'Material Shortage',
    description: 'Waiting for raw materials',
    subcategories: [
      'Raw Material Shortage',
      'Component Shortage',
      'Supply Chain Delay',
      'Quality Hold'
    ]
  },
  {
    id: 5,
    name: 'Quality Issues',
    description: 'Quality-related stoppages',
    subcategories: [
      'Dimensional Issues',
      'Surface Finish',
      'Material Defects',
      'Process Variation'
    ]
  },
  {
    id: 6,
    name: 'Maintenance',
    description: 'Scheduled maintenance',
    subcategories: [
      'Preventive Maintenance',
      'Scheduled Service',
      'Calibration',
      'Cleaning'
    ]
  },
  {
    id: 7,
    name: 'Other',
    description: 'Other unspecified downtime',
    subcategories: [
      'Power Outage',
      'Network Issues',
      'Environmental Factors',
      'Unspecified'
    ]
  }
];

const DowntimeTicketModal = ({ visible, onClose, machineId, partNumber }) => {
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Here you would make an API call to submit the downtime ticket
      console.log('Submitting downtime ticket:', {
        ...values,
        machineId,
        partNumber,
        timestamp: new Date().toISOString()
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      message.success('Downtime ticket submitted successfully');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error submitting downtime ticket:', error);
      message.error('Failed to submit downtime ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(downtimeCategories.find(cat => cat.id === e.target.value));
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Clock3 className="text-orange-500" />
          <span>Create Downtime Ticket</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="space-y-4"
      >
        <Form.Item
          name="category"
          label="Downtime Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Radio.Group className="w-full" onChange={handleCategoryChange}>
            <div className="grid grid-cols-1 gap-3">
              {downtimeCategories.map(category => (
                <Radio key={category.id} value={category.id} className="w-full">
                  <div className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.description}</div>
                  </div>
                </Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        {selectedCategory && (
          <Form.Item
            name="subcategory"
            label="Subcategory"
            rules={[{ required: true, message: 'Please select a subcategory' }]}
          >
            <Radio.Group className="w-full">
              <div className="grid grid-cols-2 gap-2">
                {selectedCategory.subcategories.map((sub, index) => (
                  <Radio key={index} value={sub} className="w-full">
                    <div className="w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div className="text-sm">{sub}</div>
                    </div>
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>
        )}

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please provide a description' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Please describe the downtime issue..."
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex gap-2">
            <Button onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Submit Ticket
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DowntimeTicketModal; 