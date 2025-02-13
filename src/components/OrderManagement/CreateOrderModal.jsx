import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col, Alert 
} from 'antd';
import { 
  InboxOutlined, FileTextOutlined, LoadingOutlined,
  CloudUploadOutlined, SaveOutlined, ArrowLeftOutlined, EditOutlined, UploadOutlined 
} from '@ant-design/icons';
import { ArrowLeftCircle } from 'lucide-react';
import useOrderStore from '../../store/order-store';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Step } = Steps;

const CreateOrderModal = ({ visible, onCancel, onCreate, initialData = null }) => {
  const [form] = Form.useForm();
  const { 
    uploadPDF, 
    updateOrder, 
    createOrder, 
    orderDetails, 
    isLoading, 
    error, 
    clearOrderDetails,
    uploadMppFile,
    uploadEngineeringDrawing 
  } = useOrderStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [isManualCreate, setIsManualCreate] = useState(false);
  const [mppFile, setMppFile] = useState(null);
  const [drawingFile, setDrawingFile] = useState(null);
  const [mppDocName, setMppDocName] = useState('');
  const [mppVersion, setMppVersion] = useState('v1');
  const [drawingDocName, setDrawingDocName] = useState('');
  const [drawingVersion, setDrawingVersion] = useState('v1');
  const [mppDescription, setMppDescription] = useState('');
  const [drawingDescription, setDrawingDescription] = useState('');
  
  // Add new state variables for additional fields
  const [rtgSeqNo, setRtgSeqNo] = useState('0');
  const [sequenceNo, setSequenceNo] = useState('0');
  const [operations, setOperations] = useState([]);

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

      const result = await uploadPDF(file);
      
      if (result) {
        // Set form values
        form.setFieldsValue({
          orderNumber: result["Prod Order No"],
          salesOrderNumber: result["Sale Order"],
          projectName: result["Project Name"],
          wbsElement: result["WBS"],
          partNumber: result["Part No"],
          materialDescription: result["Part Desc"],
          totalOperations: parseInt(result["Operations"]?.length) || 0,
          targetQuantity: parseInt(result["Required Qty"]) || 0,
          launchedQuantity: parseInt(result["Launched Qty"]) || 0,
          plant: result["Plant"],
          rtgSeqNo: parseInt(result["Rtg Seq No"]) || 0,
          sequenceNo: parseInt(result["Sequence No"]) || 0
        });

        // Set operations data
        setOperations(result["Operations"] || []);

        setCurrentStep(1);
      }

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
            <Col span={6}>
              <strong>Part Number:</strong> {material["Child Part No"]}
            </Col>
            <Col span={8}>
              <strong>Description:</strong> {material["Description"]}
            </Col>
            <Col span={5}>
              <strong>Quantity:</strong> {material["Qty Per Set"]} {material["UoM"]}
            </Col>
            <Col span={5}>
              <strong>Total Qty:</strong> {material["Total Qty"]}
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
    setIsManualCreate(false);
    setMppDocName('');
    setMppVersion('v1');
    setMppDescription('');
    setDrawingDocName('');
    setDrawingVersion('v1');
    setDrawingDescription('');
    onCancel();
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      if (!values.deliveryDate) {
        message.error('Please select a delivery date');
        return;
      }

      // Validate document names if files are selected
      if (mppFile && !mppDocName.trim()) {
        message.error('Please enter MPP document name');
        return;
      }
      if (drawingFile && !drawingDocName.trim()) {
        message.error('Please enter Engineering Drawing document name');
        return;
      }
  
      const deliveryDate = dayjs(values.deliveryDate);
      const epochTimestamp = Math.floor(deliveryDate.valueOf() / 1000);
  
      // First update the order
      const payload = {
        ...values,
        delivery_date: epochTimestamp,
      };
  
      let response;
      if (orderDetails?.id) {
        response = await updateOrder(orderDetails.id, payload);
      } else {
        response = await createOrder(payload);
      }

      // After order is created/updated, handle file uploads
      const productionOrder = values.orderNumber || response.production_order;
      
      try {
        // Upload MPP file if exists
        if (mppFile) {
          try {
            await uploadMppFile(
              mppFile.originFileObj || mppFile, 
              productionOrder,
              mppDocName.trim(),
              mppDescription.trim(),
              mppVersion.trim()
            );
          } catch (mppError) {
            if (mppError.message.includes('Authentication token not found')) {
              message.error('Please log in again to upload files');
              return;
            }
            throw mppError;
          }
        }
        
        // Upload engineering drawing if exists
        if (drawingFile) {
          try {
            await uploadEngineeringDrawing(
              drawingFile.originFileObj || drawingFile, 
              productionOrder,
              drawingDocName.trim(),
              drawingDescription.trim(),
              drawingVersion.trim()
            );
          } catch (drawingError) {
            if (drawingError.message.includes('Authentication token not found')) {
              message.error('Please log in again to upload files');
              return;
            }
            throw drawingError;
          }
        }
      } catch (fileError) {
        console.error('File upload error:', fileError);
        if (fileError.message.includes('401') || fileError.message.includes('Unauthorized')) {
          message.error('Your session has expired. Please log in again to upload files.');
        } else {
          message.warning('Order was created but there was an issue uploading some files: ' + fileError.message);
        }
        return;
      }
      
      message.success(orderDetails?.id ? 'Order updated successfully' : 'Order created successfully');
      handleCancel();
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

  const handleMppFileChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    // Store the file for later upload
    setMppFile(info.file);
  };

  const handleDrawingFileChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    // Store the file for later upload
    setDrawingFile(info.file);
  };

  const renderOrderForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={orderDetails || initialData}
      className="p-4"
    >
      {/* Order Information Section */}
      <Divider>Order Information</Divider>
      
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="orderNumber"
            label="Production Order"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="salesOrderNumber"
            label="Sales Order"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="projectName"
            label="Project Name"
          >
            <Input disabled />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="wbsElement"
            label="WBS Element"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="partNumber"
            label="Part Number"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="materialDescription"
            label="Part Description"
          >
            <Input disabled />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
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
        <Col span={6}>
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
        <Col span={6}>
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
        <Col span={6}>
          <Form.Item
            name="plant"
            label="Plant ID"
          >
            <Input disabled />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="rtgSeqNo"
            label="Routing Sequence No"
            rules={[{ required: true, message: 'Please enter Routing Sequence No' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              parser={value => parseInt(value) || 0}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="sequenceNo"
            label="Sequence No"
            rules={[{ required: true, message: 'Please enter Sequence No' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              parser={value => parseInt(value) || 0}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Remove raw materials section */}
      {renderFileUploadSection()}

      <Form.Item className="mb-0">
        <Space className="w-full justify-end">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
            className="bg-blue-500"
          >
            {initialData ? 'Update Order' : 'Create Order'}
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

        {/* Add the same file upload section */}
        {renderFileUploadSection()}

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

  // Update handleManualSubmit function
  const handleManualSubmit = async (values) => {
    try {
      // Validate document names if files are selected
      if (mppFile && !mppDocName.trim()) {
        message.error('Please enter MPP document name');
        return;
      }
      if (drawingFile && !drawingDocName.trim()) {
        message.error('Please enter Engineering Drawing document name');
        return;
      }

      // Format the payload according to the API requirements
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
        project: {
          name: values.project_name
        },
        raw_materials: []
      };

      // Create the order first
      const response = await createOrder(payload);
      const productionOrder = response.production_order || values.production_order;

      try {
        // Upload MPP file if exists
        if (mppFile) {
          try {
            await uploadMppFile(
              mppFile.originFileObj || mppFile, 
              productionOrder,
              mppDocName.trim(),
              mppDescription.trim(),
              mppVersion.trim()
            );
          } catch (mppError) {
            if (mppError.message.includes('Authentication token not found')) {
              message.error('Please log in again to upload files');
              return;
            }
            throw mppError;
          }
        }
        
        // Upload engineering drawing if exists
        if (drawingFile) {
          try {
            await uploadEngineeringDrawing(
              drawingFile.originFileObj || drawingFile, 
              productionOrder,
              drawingDocName.trim(),
              drawingDescription.trim(),
              drawingVersion.trim()
            );
          } catch (drawingError) {
            if (drawingError.message.includes('Authentication token not found')) {
              message.error('Please log in again to upload files');
              return;
            }
            throw drawingError;
          }
        }
      } catch (fileError) {
        console.error('File upload error:', fileError);
        if (fileError.message.includes('401') || fileError.message.includes('Unauthorized')) {
          message.error('Your session has expired. Please log in again to upload files.');
        } else {
          message.warning('Order was created but there was an issue uploading some files: ' + fileError.message);
        }
        return;
      }

      message.success('Order created successfully');
      handleCancel();
      return response;
    } catch (error) {
      console.error('Submit Error:', error);
      message.error(error.message || 'Failed to create order');
      throw error;
    }
  };
  
  // Update the file upload sections in renderOrderForm
  const renderFileUploadSection = () => (
    <>
      <Divider>MPP and Drawing Files</Divider>
      <Row gutter={16} className="mb-4">
        <Col span={12}>
          <div className="border p-4 rounded">
            <h4 className="mb-3">MPP File</h4>
            <Form.Item
              label="Document Name"
              required
            >
              <Input 
                value={mppDocName}
                onChange={(e) => setMppDocName(e.target.value)}
                placeholder="Enter document name"
              />
            </Form.Item>
            <Form.Item
              label="Description"
            >
              <Input.TextArea 
                value={mppDescription}
                onChange={(e) => setMppDescription(e.target.value)}
                placeholder="Enter description"
                rows={2}
              />
            </Form.Item>
            <Form.Item
              label="Version"
              required
            >
              <Input 
                value={mppVersion}
                onChange={(e) => setMppVersion(e.target.value)}
                placeholder="Enter version (e.g. v1)"
              />
            </Form.Item>
            <Form.Item
              name="mppFile"
            >
              <Upload
                maxCount={1}
                onChange={handleMppFileChange}
                beforeUpload={() => false}
                showUploadList={{ showRemoveIcon: true }}
              >
                <Button icon={<UploadOutlined />} className="w-full">
                  {mppFile ? 'Change MPP File' : 'Upload MPP File'}
                </Button>
              </Upload>
            </Form.Item>
          </div>
        </Col>
        <Col span={12}>
          <div className="border p-4 rounded">
            <h4 className="mb-3">Engineering Drawing</h4>
            <Form.Item
              label="Document Name"
              required
            >
              <Input 
                value={drawingDocName}
                onChange={(e) => setDrawingDocName(e.target.value)}
                placeholder="Enter document name"
              />
            </Form.Item>
            <Form.Item
              label="Description"
            >
              <Input.TextArea 
                value={drawingDescription}
                onChange={(e) => setDrawingDescription(e.target.value)}
                placeholder="Enter description"
                rows={2}
              />
            </Form.Item>
            <Form.Item
              label="Version"
              required
            >
              <Input 
                value={drawingVersion}
                onChange={(e) => setDrawingVersion(e.target.value)}
                placeholder="Enter version (e.g. v1)"
              />
            </Form.Item>
            <Form.Item
              name="drawingFile"
            >
              <Upload
                maxCount={1}
                onChange={handleDrawingFileChange}
                beforeUpload={(file) => {
                  const isValidFormat = [
                    'application/pdf',
                    'application/x-autocad',  // For .dwg files
                    'image/vnd.dxf',          // For .dxf files
                    '.dwg',
                    '.dxf'
                  ].includes(file.type) || 
                  file.name.toLowerCase().endsWith('.dwg') || 
                  file.name.toLowerCase().endsWith('.dxf');
                  
                  if (!isValidFormat) {
                    message.error('You can only upload PDF, DWG, or DXF files!');
                    return false;
                  }
                  return false; // Return false to prevent auto upload
                }}
                accept=".pdf,.dwg,.dxf"
                showUploadList={{ showRemoveIcon: true }}
              >
                <Button icon={<UploadOutlined />} className="w-full">
                  {drawingFile ? 'Change Drawing File' : 'Upload Drawing'}
                </Button>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Supported formats: PDF, DWG, DXF
                </div>
              </Upload>
            </Form.Item>
          </div>
        </Col>
      </Row>
    </>
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
