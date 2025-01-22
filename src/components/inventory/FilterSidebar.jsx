import React from 'react';
import { Drawer, Form, Select, Button, Space } from 'antd';

const FilterSidebar = ({ visible, onClose, onApply }) => {
  const [form] = Form.useForm();

  const handleApply = (values) => {
    onApply(values);
    onClose();
  };

  return (
    <Drawer
      title="Filter Inventory"
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleApply}
      >
        <Form.Item name="status" label="Status">
          <Select
            placeholder="Select status"
            options={[
              { label: 'Available', value: 'available' },
              { label: 'In Use', value: 'in_use' }
            ]}
          />
        </Form.Item>

        <Space>
          <Button onClick={() => {
            form.resetFields();
            onClose();
          }}>
            Reset
          </Button>
          <Button type="primary" htmlType="submit">
            Apply Filters
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};

export default FilterSidebar;