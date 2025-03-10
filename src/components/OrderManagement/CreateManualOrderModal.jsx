import React from 'react';
import { 
  Modal, Form, Input, InputNumber, Space, Button, message, Row, Col, Alert 
} from 'antd';
import useOrderStore from '../../store/order-store';

const CreateManualOrderModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { createOrder, isLoading, error } = useOrderStore();

  const handleSubmit = async (values) => {
    try {
      const orderData = {
        orderNumber: values.production_order,
        salesOrderNumber: values.sale_order,
        wbsElement: values.wbs_element,
        partNumber: values.part_number,
        materialDescription: values.part_description,
        totalOperations: values.total_operations,
        targetQuantity: values.required_quantity,
        launchedQuantity: values.launched_quantity,
        plant: values.plant_id.toString(),
        projectName: values.project_name
      };

      await createOrder(orderData);
      message.success('Order created successfully');
      form.resetFields();
      onCancel();
    } catch (error) {
      message.error(error.message || 'Failed to create order');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Create New Order"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
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
                <InputNumber min={0} style={{ width: '100%' }} />
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

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

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

export default CreateManualOrderModal; 