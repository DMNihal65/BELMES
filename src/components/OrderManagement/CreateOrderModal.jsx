import React, { useState } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col, Alert 
} from 'antd';
import { 
  InboxOutlined, FileTextOutlined, LoadingOutlined,
  CloudUploadOutlined, SaveOutlined 
} from '@ant-design/icons';
import { ArrowLeftCircle } from 'lucide-react';
import useOrderStore from '../../store/order-store';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Step } = Steps;

const CreateOrderModal = ({ visible, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const { uploadPDF, orderDetails, isLoading, error, clearOrderDetails } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);

  // Handle OARC document upload
  const handleOarcUpload = async (file) => {
    try {
      const data = await uploadPDF(file);
      form.setFieldsValue(data);
      setCurrentStep(1);
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error('Error processing document: ' + error.message);
      return false;
    }
  };

  // Reset form and store when modal closes
  const handleCancel = () => {
    form.resetFields();
    clearOrderDetails();
    onCancel();
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      if (!values.deliveryDate) {
        message.error('Please select a delivery date');
        return;
      }
      
      // Here you would send the final data to your backend
      await onCreate({
        ...orderDetails,
        ...values,
        deliveryDate: values.deliveryDate.format('YYYY-MM-DD'),
      });
      
      handleCancel();
      message.success('Order created successfully');
    } catch (error) {
      message.error('Failed to create order: ' + error.message);
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
      title: 'Upload PDF',
      content: (
        <div className="p-4">
          <Dragger
            name="pdf"
            multiple={false}
            beforeUpload={handleOarcUpload}
            accept=".pdf"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            showUploadList={{ showRemoveIcon: true }}
            className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300"
          >
            <div className="py-6 text-center">
              <p className="text-4xl text-blue-600 mb-2">
                {isLoading ? <LoadingOutlined spin /> : <CloudUploadOutlined />}
              </p>
              <p className="text-base font-medium text-gray-700 mb-1">
                Click or drag PDF document to this area
              </p>
              <p className="text-xs text-gray-500">
                Supported format: PDF
              </p>
            </div>
          </Dragger>

          {error && (
            <Alert
              message="Upload Error"
              description={error}
              type="error"
              showIcon
              className="mt-4"
            />
          )}

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
      ),
    },
    {
      title: 'Order Details',
      content: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={orderDetails}
          className="p-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderNumber"
                label="Production Order"
                rules={[{ required: true }]}
              >
                <Input disabled={!!orderDetails} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salesOrderNumber"
                label="Sales Order"
                rules={[{ required: true }]}
              >
                <Input disabled={!!orderDetails} />
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
                name="deliveryDate"
                label="Delivery Date"
                rules={[{ required: true, message: 'Please select delivery date' }]}
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
            label="Additional Notes"
          >
            <TextArea rows={4} placeholder="Enter any additional notes or requirements" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
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
      onCancel={handleCancel}
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
            name="pdf"
            multiple={false}
            beforeUpload={handleOarcUpload}
            accept=".pdf"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            showUploadList={{ showRemoveIcon: true }}
            className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300"
          >
            <div className="py-6 text-center">
              <p className="text-4xl text-blue-600 mb-2">
                {isLoading ? <LoadingOutlined spin /> : <CloudUploadOutlined />}
              </p>
              <p className="text-base font-medium text-gray-700 mb-1">
                Click or drag PDF document to this area
              </p>
              <p className="text-xs text-gray-500">
                Supported format: PDF
              </p>
            </div>
          </Dragger>

          {error && (
            <Alert
              message="Upload Error"
              description={error}
              type="error"
              showIcon
              className="mt-4"
            />
          )}

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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={orderDetails}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderNumber"
                label="Production Order"
                rules={[{ required: true }]}
              >
                <Input disabled={!!orderDetails} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salesOrderNumber"
                label="Sales Order"
                rules={[{ required: true }]}
              >
                <Input disabled={!!orderDetails} />
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
                label="WBS Element"
                rules={[{ required: true, message: 'Please enter WBS element' }]}
              >
                <Input placeholder="Enter WBS element" />
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
                  className="rounded h-8"
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

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              icon={<SaveOutlined />}
            >
              Create Order
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default CreateOrderModal;