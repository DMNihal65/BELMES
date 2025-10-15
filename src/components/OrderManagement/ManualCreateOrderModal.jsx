import React, { useState } from 'react';
import { 
  Modal, Form, Input, InputNumber, Space, Button, Alert, Row, Col
} from 'antd';
import { ArrowLeftCircle } from 'lucide-react';
import useOrderStore from '../../store/order-store';

const ManualCreateOrderModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { createOrder, isLoading, fetchAllOrders } = useOrderStore();

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = async (values) => {
    try {
      // Format the data according to the create_order endpoint requirements
      const requestData = {
        production_order: values.production_order,
        sale_order: values.sale_order,
        wbs_element: values.wbs_element,
        part_number: values.part_number,
        part_description: values.part_description,
        total_operations: values.total_operations,
        required_quantity: values.required_quantity,
        launched_quantity: values.launched_quantity,
        plant_id: values.plant_id,
        project_name: values.project_name
      };

      // Create order using the create_order endpoint
      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.detail || 'Failed to save order');
      }

      await response.json();
      await fetchAllOrders(); // Refresh the orders list
      handleCancel();
    } catch (error) {
      console.error('Submit Error:', error);
      message.error(error.message || 'Failed to save order');
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center w-full">
          <ArrowLeftCircle
            className="h-6 w-6 text-gray-600 hover:text-blue-600 cursor-pointer transition-all"
            onClick={handleCancel}
          />
          <div className="flex-1 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
              Create New Order
            </h3>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          total_operations: 0,
          required_quantity: 0,
          launched_quantity: 0,
          plant_id: 0
        }}
        className="p-4"
      >
        <div className="bg-white rounded-lg p-6">
          <Alert
            message="Manual Order Creation"
            description="Please fill in the required fields to create a new order."
            type="info"
            showIcon
            className="mb-6"
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="production_order"
                label="Production Order"
                rules={[{ required: true, message: 'Please enter Production Order' }]}
              >
                <Input placeholder="Enter Production Order" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sale_order"
                label="Sales Order"
                rules={[{ required: true, message: 'Please enter Sales Order' }]}
              >
                <Input placeholder="Enter sales order number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="wbs_element"
                label="WBS Element"
                rules={[{ required: true, message: 'Please enter WBS Element' }]}
              >
                <Input placeholder="Enter WBS element" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="part_number"
                label="Part Number"
                rules={[{ required: true, message: 'Please enter Part Number' }]}
              >
                <Input placeholder="Enter part number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="part_description"
                label="Part Description"
                rules={[{ required: true, message: 'Please enter Part Description' }]}
              >
                <Input placeholder="Enter part description" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="total_operations"
                label="Total Operations"
                rules={[{ required: true, message: 'Please enter Total Operations' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="required_quantity"
                label="Required Quantity"
                rules={[{ required: true, message: 'Please enter Required Quantity' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="launched_quantity"
                label="Launched Quantity"
                rules={[{ required: true, message: 'Please enter Launched Quantity' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plant_id"
                label="Plant ID"
                rules={[{ required: true, message: 'Please enter Plant ID' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  placeholder="Enter plant ID"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project_name"
                label="Project Name"
                rules={[{ required: true, message: 'Please enter Project Name' }]}
              >
                <Input placeholder="Enter project name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 mt-6">
            <Space className="w-full justify-end">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                className="bg-blue-500"
              >
                Create Order
              </Button>
            </Space>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ManualCreateOrderModal; 