import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col, Alert 
} from 'antd';
import { 
  InboxOutlined, FileTextOutlined, LoadingOutlined,
  CloudUploadOutlined, SaveOutlined, ArrowLeftOutlined, EditOutlined 
} from '@ant-design/icons';
import { ArrowLeftCircle } from 'lucide-react';
import useOrderStore from '../../store/order-store';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Step } = Steps;

const CreateOrderModal = ({ visible, onCancel, onCreate, initialData = null }) => {
  const [form] = Form.useForm();
  const { uploadPDF, updateOrder, orderDetails, isLoading, error, clearOrderDetails } = useOrderStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);

  const steps = [
    {
      title: 'Upload PDF',
      description: 'Upload OARC document',
    },
    {
      title: 'Order Details',
      description: 'Fill order information',
    }
  ];

  const handleOarcUpload = async (file) => {
    try {
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        message.error('You can only upload PDF files!');
        return false;
      }

      const isLessThan10M = file.size / 1024 / 1024 < 10;
      if (!isLessThan10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }

      await uploadPDF(file);
      setCurrentStep(1); // Move to order details after successful upload
      return false;
    } catch (error) {
      message.error(error.message || 'Failed to upload file');
      return false;
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(0); // Always go back to upload step
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    form.resetFields();
    clearOrderDetails();
    setCurrentStep(0); // Reset to upload step
    setFileList([]);
    onCancel();
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      if (!values.deliveryDate) {
        message.error('Please select a delivery date');
        return;
      }

     if (orderDetails?.id) {
        // If we have an ID, it's an update
        await updateOrder(orderDetails.id, {
          ...values,
          deliveryDate: values.deliveryDate,
        });
        message.success('Order updated successfully');
      } else {
        // Otherwise it's a new order
        await onCreate({
          ...orderDetails,
          ...values,
          deliveryDate: values.deliveryDate.format('YYYY-MM-DD'),
        });
        message.success('Order created successfully');
      }
      
      handleCancel();
    } catch (error) {
      message.error(error.message || 'Failed to save order');
    }
  };

  // Set initial form values when editing
 useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        ...initialData,
        deliveryDate: initialData.deliveryDate ? dayjs(initialData.deliveryDate) : undefined,
      });
      setCurrentStep(1);
    }
  }, [visible, initialData, form]);

  const renderOrderForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={orderDetails || initialData}
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

      <Form.Item className="mb-0">
        <Space className="w-full justify-end">
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
            className="bg-blue-500"
          >
            {orderDetails?.id ? 'Update Order' : 'Create Order'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  return (
    <Modal
      title={
        <div className="flex items-center w-full">
          <ArrowLeftCircle
            className="h-6 w-6 text-gray-600 hover:text-blue-600 cursor-pointer transition-all"
            onClick={handleBack}
          />
          <div className="flex-1 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
              {orderDetails?.id ? 'Edit Order' : 'Create New Order'}
            </h3>
            <Steps 
              current={currentStep}
              size="small"
              className="px-12"
              items={steps}
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

      {currentStep === 1 && renderOrderForm()}
    </Modal>
  );
};

export default CreateOrderModal;