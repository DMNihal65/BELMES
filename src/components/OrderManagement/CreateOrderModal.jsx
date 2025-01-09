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
  const { uploadPDF, updateOrder, createOrder, orderDetails, isLoading, error, clearOrderDetails } = useOrderStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [isManualCreate, setIsManualCreate] = useState(false);

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

      const result = await uploadPDF(file);
      setRawMaterials(result.raw_materials || []);
      setCurrentStep(1);
      return false;
    } catch (error) {
      message.error(error.message || 'Failed to upload file');
      return false;
    }
  };

  const renderRawMaterials = () => (
    <div className="mb-4">
      <Divider>Raw Materials</Divider>
      {rawMaterials.map((material, index) => (
        <div key={index} className="p-2 bg-gray-50 rounded mb-2">
          <Row gutter={16}>
            <Col span={8}>
              <strong>Part Number:</strong> {material.child_part_number}
            </Col>
            <Col span={8}>
              <strong>Description:</strong> {material.description}
            </Col>
            <Col span={4}>
              <strong>Quantity:</strong> {material.quantity} {material.unit.name}
            </Col>
            <Col span={4}>
              <strong>Status:</strong> {material.status.name}
            </Col>
          </Row>
        </div>
      ))}
    </div>
  );


  const handleBack = () => {
    if (isManualCreate) {
      // If in manual create mode, go back to upload option
      setIsManualCreate(false);
      form.resetFields();
    } else if (currentStep > 0) {
      setCurrentStep(0);
    } else {
      handleCancel();
    }
  };


  const handleCancel = () => {
    form.resetFields();
    clearOrderDetails();
    setCurrentStep(0);
    setFileList([]);
    setRawMaterials([]);
    setIsManualCreate(false); // Reset manual create mode
    onCancel();
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      if (!values.deliveryDate) {
        message.error('Please select a delivery date');
        return;
      }
  
      // Ensure we have the correct delivery date format
      const deliveryDate = dayjs(values.deliveryDate);
      const epochTimestamp = Math.floor(deliveryDate.valueOf() / 1000);
  
      if (orderDetails?.id) {
        // Update existing order
        const updatePayload = {
          sale_order: values.salesOrderNumber,
          wbs_element: values.wbsElement,
          part_number: values.partNumber,
          part_description: values.materialDescription,
          total_operations: parseInt(values.totalOperations),
          required_quantity: parseInt(values.targetQuantity),
          launched_quantity: parseInt(values.launchedQuantity),
          plant_id: parseInt(values.plant),
          delivery_date: epochTimestamp
        };
  
        await updateOrder(orderDetails.id, updatePayload, values.orderNumber);
        message.success('Order updated successfully');
        handleCancel();
      } else {
        // ... rest of the create order logic ...
      }
    } catch (error) {
      console.error('Submit Error:', error);
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


  useEffect(() => {
    if (!visible) {
      // When modal is closed, reset everything
      form.resetFields();
      clearOrderDetails();
      setCurrentStep(0);
      setFileList([]);
      setRawMaterials([]);
      setIsManualCreate(false); // Reset manual create mode
    } else if (initialData) {
      // Only set initial data when modal is opened with data
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
      {/* Read-only fields */}
      {/* Order Information - Some Editable */}
    <Divider>Order Information</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="orderNumber"
            label="Production Order"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="salesOrderNumber"
            label="Sales Order"
          >
            <Input disabled />
          </Form.Item>
        </Col>
      </Row>
  
      {/* Project Information - Read Only */}
      <Divider>Project Information</Divider>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="projectName"
          label="Project Name"
        >
          <Input disabled />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="priority"
          label="Priority"
        >
          <Input disabled />
        </Form.Item>
      </Col>
    </Row>

    {/* Raw Materials Section - Read Only */}
    {orderDetails?.rawMaterials && orderDetails.rawMaterials.length > 0 && (
      <>
        <Divider>Raw Materials</Divider>
        {orderDetails.rawMaterials.map((material, index) => (
          <div key={index}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Part Number"
                >
                  <Input value={material.child_part_number} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Description"
                >
                  <Input value={material.description} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Quantity"
                >
                  <Input value={`${material.quantity} ${material.unit.name}`} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Status"
                >
                  <Input value={material.status.name} disabled />
                </Form.Item>
              </Col>
            </Row>
            {index < orderDetails.rawMaterials.length - 1 && <Divider dashed />}
          </div>
        ))}
      </>
    )}

      <Divider/>
      {/* Editable fields */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="wbsElement"
            label="WBS Element"
            rules={[{ required: true, message: 'Please enter WBS Element' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="partNumber"
            label="Part Number"
            rules={[{ required: true, message: 'Please enter Part Number' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
  
      <Form.Item
        name="materialDescription"
        label="Part Description"
        rules={[{ required: true, message: 'Please enter Part Description' }]}
      >
        <Input />
      </Form.Item>
  
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="totalOperations"
            label="Total Operations"
            rules={[{ required: true, message: 'Please enter Total Operations' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1}
              parser={value => parseInt(value) || 0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="targetQuantity"
            label="Required Quantity"
            rules={[{ required: true, message: 'Please enter Required Quantity' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1}
              parser={value => parseInt(value) || 0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="launchedQuantity"
            label="Launched Quantity"
            rules={[{ required: true, message: 'Please enter Launched Quantity' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              parser={value => parseInt(value) || 0}
            />
          </Form.Item>
        </Col>
      </Row>
  
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="plant"
            label="Plant ID"
            rules={[{ required: true, message: 'Please enter Plant ID' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1}
              parser={value => parseInt(value) || 0}
            />
          </Form.Item>
        </Col>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="deliveryDate" // Changed from delivery_date to deliveryDate
              label="Delivery Date"
              rules={[{ required: true, message: 'Please select Delivery Date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>
      </Row>

    {/* Form Actions */}
      <Form.Item className="mb-0">
        <Space className="w-full justify-end">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
            className="bg-blue-500"
          >
            Update Order
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  // Manual Create Form
  const renderManualCreateForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleManualSubmit}
      initialValues={{
        total_operations: 1,
        required_quantity: 1,
        launched_quantity: 0
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
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="required_quantity"
              label="Required Quantity"
              rules={[{ required: true, message: 'Please enter Required Quantity' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
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
              <InputNumber min={1} style={{ width: '100%' }} />
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

        <Row gutter={16}>
        <Col span={24}>
        <Form.Item
          name="delivery_date"
          label="Delivery Date"
          rules={[{ required: true, message: 'Please select Delivery Date' }]}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            format="YYYY-MM-DD"
            // Ensure future dates only
            disabledDate={(current) => {
              return current && current < dayjs().startOf('day');
            }}
          />
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
  );

  // Inside the CreateOrderModal component

  const handleManualSubmit = async (values) => {
    try {
      // Validate delivery date
      if (!values.delivery_date) {
        message.error('Please select a delivery date');
        return;
      }
  
      // Convert delivery date to epoch timestamp (seconds)
      const deliveryDate = dayjs(values.delivery_date);
      const epochTimestamp = Math.floor(deliveryDate.valueOf() / 1000);
  
      const payload = {
        production_order: values.production_order,
        sale_order: values.sale_order,
        wbs_element: values.wbs_element,
        part_number: values.part_number,
        part_description: values.part_description,
        total_operations: parseInt(values.total_operations),
        required_quantity: parseInt(values.required_quantity),
        launched_quantity: parseInt(values.launched_quantity),
        plant_id: parseInt(values.plant_id),
        project_name: values.project_name,
        delivery_date: epochTimestamp,
        raw_materials: []
      };
  
      const response = await createOrder(payload);
      message.success('Order created successfully');
      handleCancel();
      return response;
    } catch (error) {
      console.error('Submit Error:', error);
      message.error(error.message || 'Failed to create order');
      throw error;
    }
  };
  
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
              {isManualCreate ? 'Create New Order' : 'Upload OARC Document'}
            </h3>
            {!isManualCreate && (
              <Steps 
                current={currentStep}
                size="small"
                className="px-12"
                items={steps}
                progressDot
              />
            )}
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
      destroyOnClose={true} 
    >
      {!isManualCreate ? (
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
              onClick={() => setIsManualCreate(true)}
              icon={<EditOutlined />}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create Order Manually
            </Button>
          </div>
        </div>
      ) : (
        renderManualCreateForm()
      )}

      {currentStep === 1 && !isManualCreate && renderOrderForm()}
    </Modal>
  );
};

export default CreateOrderModal;
