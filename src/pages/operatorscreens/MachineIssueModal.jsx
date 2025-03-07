import React, { useState } from 'react';
import { Modal, Form, Select, Input, Button, Radio } from 'antd';
import { AlertTriangle } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

const MachineIssueModal = ({ visible, onClose, onSubmit, machineData }) => {
  const [form] = Form.useForm();
  const [issueType, setIssueType] = useState('machine');

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSubmit({
        ...values,
        machineId: machineData?.machine_id,
        timestamp: new Date().toISOString()
      });
      form.resetFields();
      onClose();
    });
  };

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
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" danger onClick={handleSubmit}>
          Submit Ticket
        </Button>
      ]}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          name="issueType"
          rules={[{ required: true }]}
        >
          <Radio.Group onChange={(e) => setIssueType(e.target.value)} value={issueType}>
            <Radio value="machine">Machine Issue</Radio>
            <Radio value="component">Component Issue</Radio>
          </Radio.Group>
        </Form.Item>

        {issueType === 'machine' && (
          <>
            <Form.Item
              name="machineStatus"
              label="Machine Status"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select machine status">
                <Option value="ON">ON - Machine is available</Option>
                <Option value="OFF">OFF - Machine is not available</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Describe the machine issue"
              />
            </Form.Item>
          </>
        )}

        {issueType === 'component' && (
          <>
            <Form.Item
              name="componentStatus"
              label="Component Status"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select component status">
                <Option value="available">Available</Option>
                <Option value="notAvailable">Not Available</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Describe the component issue"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default MachineIssueModal; 