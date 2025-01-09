import React, { useState } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col 
} from 'antd';
import { 
  InboxOutlined, FileTextOutlined, LoadingOutlined,
  CloudUploadOutlined, SaveOutlined 
} from '@ant-design/icons';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Step } = Steps;

const CreateOrderModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);

  // Handle OARC document upload
  const handleOarcUpload = async (file) => {
    setLoading(true);
    try {
      // Mock API call to process OARC document
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock extracted data
      const extractedData = {
        orderNumber: 'ORD-2024-002',
        materialNumber: 'MAT-002',
        materialDescription: 'Steel Component',
        targetQuantity: 500,
        plant: 'Plant-01',
        wbsElement: 'WBS-002',
        salesOrderNumber: 'SO-002',
        partNumber: 'PT-002',
        priority: 'high',
      };

      form.setFieldsValue(extractedData);
      message.success('OARC document processed successfully');
      setCurrentStep(1);
    } catch (error) {
      message.error('Error processing OARC document');
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Mock API call to create order
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Order created successfully');
      form.resetFields();
      setCurrentStep(0);
      setFileList([]);
      onCancel();
    } catch (error) {
      message.error('Error creating order');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Upload OARC',
      content: (
        <div className="p-4">
          <Dragger
            name="oarc"
            multiple={false}
            beforeUpload={handleOarcUpload}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            showUploadList={{ showRemoveIcon: true }}
          >
            <p className="ant-upload-drag-icon">
              {loading ? <LoadingOutlined /> : <InboxOutlined />}
            </p>
            <p className="ant-upload-text">
              Click or drag OARC document to this area to extract details
            </p>
            <p className="ant-upload-hint">
              Supported formats: PDF, DOC, DOCX
            </p>
          </Dragger>
          <Divider>OR</Divider>
          <Button 
            type="link" 
            block 
            onClick={() => setCurrentStep(1)}
          >
            Enter Details Manually
          </Button>
        </div>
      ),
    },
    {
      title: 'Order Details',
      content: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="p-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderNumber"
                label="Order Number"
                rules={[{ required: true, message: 'Please enter order number' }]}
              >
                <Input placeholder="Enter order number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="materialNumber"
                label="Material Number"
                rules={[{ required: true, message: 'Please enter material number' }]}
              >
                <Input placeholder="Enter material number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="materialDescription"
            label="Material Description"
            rules={[{ required: true, message: 'Please enter material description' }]}
          >
            <TextArea rows={3} placeholder="Enter material description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetQuantity"
                label="Target Quantity"
                rules={[{ required: true, message: 'Please enter target quantity' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={1}
                  placeholder="Enter quantity"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="plant"
                label="Plant"
                rules={[{ required: true, message: 'Please select plant' }]}
              >
                <Select placeholder="Select plant">
                  <Select.Option value="Plant-01">Plant 01</Select.Option>
                  <Select.Option value="Plant-02">Plant 02</Select.Option>
                  <Select.Option value="Plant-03">Plant 03</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="low">Low</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="wbsElement"
                label="WBS Element"
                rules={[{ required: true, message: 'Please enter WBS element' }]}
              >
                <Input placeholder="Enter WBS element" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salesOrderNumber"
                label="Sales Order Number"
                rules={[{ required: true, message: 'Please enter sales order number' }]}
              >
                <Input placeholder="Enter sales order number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="partNumber"
                label="Part Number"
                rules={[{ required: true, message: 'Please enter part number' }]}
              >
                <Input placeholder="Enter part number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryDate"
                label="Delivery Date"
                rules={[{ required: true, message: 'Please select delivery date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Select delivery date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="additionalNotes"
            label="Additional Notes"
          >
            <TextArea rows={4} placeholder="Enter any additional notes or requirements" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
            <Button onClick={() => setCurrentStep(0)}> {/* Back button added */}
            Back
          </Button>
              <Button onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                Create Order
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div>
          <h3 className="text-lg font-semibold">Create New Order</h3>
          <Steps 
            current={currentStep}
            size="small"
            className="mt-4"
            items={steps.map(item => ({ title: item.title }))}
          />
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      className="create-order-modal"
    >
      {steps[currentStep].content}
    </Modal>
  );
};

export default CreateOrderModal; 