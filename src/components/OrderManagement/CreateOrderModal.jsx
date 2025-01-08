import React, { useState } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col 
} from 'antd';
import { 
  InboxOutlined, FileTextOutlined, LoadingOutlined,
  CloudUploadOutlined, SaveOutlined, ArrowLeftOutlined 
} from '@ant-design/icons';
import { ArrowLeftCircle } from 'lucide-react';

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

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
      form.resetFields();
    } else {
      onCancel();
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
          <Space className="w-full justify-between">
            {/* <Button onClick={handleBack}>to enhance your UI/UX design while using Ant Design and Tailwind CSS:

Visual Hierarchy & Layout


Use a consistent grid system with cards for different widgets
Implement a clean sidebar with subtle hover effects
Add spacing between components using Tailwind's gap utilities
Consider a sticky header with important user/system information


Color Scheme


Use a primary brand color (like the deep blue shown) consistently
Add subtle gradients for backgrounds (light purple to white)
Implement a cohesive color system for status indicators (red for issues, green for active)
Use softer pastels for secondary information
Consider light shadows for depth


Dashboard Components


Rounded corners on all cards (not too sharp, not too rounded)
Subtle hover effects on interactive elements
Clear section headers with supporting text
Use icons consistently throughout the interface
Add loading states and skeleton screens


Data Visualization


Clean, minimalist charts with smooth animations
Consistent chart styles and colors
Interactive tooltips on hover
Use donut charts for percentage-based data
Implement responsive charts that adapt to container size


Typography Improvements


Clear hierarchy with different font weights
Consistent font sizes for different types of information
Proper line height and letter spacing
Use monospace fonts for numerical data
Add truncation for long text with tooltips


Interactive Elements


Subtle micro-interactions on buttons and controls
Clear hover and active states
Custom dropdown styles
Toggle switches with smooth transitions
Search bars with autocomplete


Responsive Design


Collapsible sidebar for mobile views
Responsive grid layouts
Adaptable charts and tables
Mobile-friendly touch targets
Consider mobile-first approach


Performance Optimizations


Lazy loading for off-screen components
Skeleton loading states
Efficient re-rendering strategies
Virtualized lists for large datasets
Progressive loading for images
              Back
            </Button> */}
            <Button 
              type="link"
              onClick={() => setCurrentStep(1)}
            >
              Enter Details Manually
            </Button>
          </Space>
        </div>
      ),
    },
    {
      title: 'Order Details',
      content: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setCurrentStep(0);
                setFileList([]);
                form.resetFields();
              }}
              style={{ marginLeft: '-8px' }}
            >
              Back to Upload
            </Button>
          </div>
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
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center w-full">
          <ArrowLeftCircle
            className="h-6 w-6 text-gray-600 hover:text-blue-600 cursor-pointer transition-all"
            onClick={handleBack}
          />
          <div className="flex-1 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Create New Order</h3>
            <Steps 
              current={currentStep}
              size="small"
              className="px-12"
              items={steps.map(item => ({ title: item.title }))}
              progressDot
            />
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      className="dashboard-modal"
      style={{ top: 20 }}
      bodyStyle={{ 
        padding: '16px', 
        background: '#f5f7fa', 
        height: 'calc(100vh - 120px)',
        overflowY: 'auto' 
      }}
      footer={null}
    >
      {currentStep === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <Dragger
            name="oarc"
            multiple={false}
            beforeUpload={handleOarcUpload}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            showUploadList={{ showRemoveIcon: true }}
            className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300"
          >
            <div className="py-6 text-center">
              <p className="text-4xl text-blue-600 mb-2">
                {loading ? <LoadingOutlined spin /> : <CloudUploadOutlined />}
              </p>
              <p className="text-base font-medium text-gray-700 mb-1">
                Click or drag OARC document to this area
              </p>
              <p className="text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX
              </p>
            </div>
          </Dragger>

          <Divider className="my-4">
            <span className="text-gray-400 px-4 text-sm">OR</span>
          </Divider>

          <div className="text-center">
            <Button 
              type="link"
              onClick={() => setCurrentStep(1)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Enter Details Manually
            </Button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-3"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="orderNumber"
                  label={<span className="text-gray-700 text-sm font-medium">Order Number</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <Input placeholder="Enter order number" className="rounded h-8" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="materialNumber"
                  label={<span className="text-gray-700 text-sm font-medium">Material Number</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <Input placeholder="Enter material number" className="rounded h-8" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="materialDescription"
              label={<span className="text-gray-700 text-sm font-medium">Material Description</span>}
              rules={[{ required: true }]}
              className="mb-2"
            >
              <TextArea rows={2} placeholder="Enter material description" className="rounded" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="targetQuantity"
                  label={<span className="text-gray-700 text-sm font-medium">Target Quantity</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <InputNumber min={1} placeholder="Quantity" className="w-full rounded h-8" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="plant"
                  label={<span className="text-gray-700 text-sm font-medium">Plant</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <Select placeholder="Select plant" className="rounded h-8">
                    <Select.Option value="Plant-01">Plant 01</Select.Option>
                    <Select.Option value="Plant-02">Plant 02</Select.Option>
                    <Select.Option value="Plant-03">Plant 03</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="priority"
                  label={<span className="text-gray-700 text-sm font-medium">Priority</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <Select placeholder="Select priority" className="rounded h-8">
                    <Select.Option value="high">
                      <span className="text-red-500">● </span>High
                    </Select.Option>
                    <Select.Option value="medium">
                      <span className="text-yellow-500">● </span>Medium
                    </Select.Option>
                    <Select.Option value="low">
                      <span className="text-green-500">● </span>Low
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="wbsElement"
                  label={<span className="text-gray-700 text-sm font-medium">WBS Element</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <Input placeholder="Enter WBS element" className="rounded h-8" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="salesOrderNumber"
                  label={<span className="text-gray-700 text-sm font-medium">Sales Order Number</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <Input placeholder="Enter sales order number" className="rounded h-8" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="partNumber"
                  label={<span className="text-gray-700 text-sm font-medium">Part Number</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <Input placeholder="Enter part number" className="rounded h-8" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="deliveryDate"
                  label={<span className="text-gray-700 text-sm font-medium">Delivery Date</span>}
                  rules={[{ required: true }]}
                  className="mb-2"
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    placeholder="Select delivery date"
                    className="rounded h-8"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="additionalNotes"
              label={<span className="text-gray-700 text-sm font-medium">Additional Notes</span>}
              className="mb-2"
            >
              <TextArea rows={2} placeholder="Enter any additional notes" className="rounded" />
            </Form.Item>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
              <Button onClick={onCancel} className="h-8 px-4">
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                className="h-8 px-4"
              >
                Create Order
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default CreateOrderModal;