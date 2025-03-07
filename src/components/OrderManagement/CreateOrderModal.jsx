import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col, Alert, Card 
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
    uploadEngineeringDrawing,
    documents,
    isLoadingDocuments,
    documentError,
    fetchDocumentsByPartNumber,
    documentLoadingStates,
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

      // Upload OARC document
      const result = await uploadPDF(file);
      console.log('OARC Upload Response:', result);

      // Store raw materials exactly as they come from the API
      setRawMaterials(result['Raw Materials'] || []);

      // Store operations data
      const operations = result.Operations || [];

      // Set form fields with the extracted data
      const formData = {
        production_order: result['Prod Order No'],
        sale_order: result['Sale Order'],
        project_name: result['Project Name'],
        priority: 'normal',
        wbs_element: result['WBS'],
        part_number: result['Part No'],
        part_description: result['Part Desc'],
        total_operations: operations.length,
        required_quantity: parseInt(result['Required Qty']) || 0,
        launched_quantity: parseInt(result['Launched Qty']) || 0,
        plant_id: result['Plant'],
        operations: operations
      };

      console.log('Setting form data:', formData);
      form.setFieldsValue(formData);

      // Get documents for the part number
      if (result['Part No']) {
        await fetchDocumentsByPartNumber(result['Part No']);
      }

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
      form.setFields([{ name: 'submit', errors: [] }]);
      
      // Handle document uploads first if needed
      if (!documents?.mpp_document && mppFile) {
        try {
          await uploadMppFile(
            mppFile,
            values.part_number,
            mppDocName.trim(),
            mppDescription.trim() || '',
            mppVersion.trim()
          );
        } catch (error) {
          message.error('Failed to upload MPP document: ' + error.message);
          throw error;
        }
      }

      if (!documents?.engineering_drawing_document && drawingFile) {
        try {
          await uploadEngineeringDrawing(
            drawingFile,
            values.part_number,
            drawingDocName.trim(),
            drawingDescription.trim() || '',
            drawingVersion.trim()
          );
        } catch (error) {
          message.error('Failed to upload Engineering Drawing: ' + error.message);
          throw error;
        }
      }

      // Prepare data for save-to-db with all details from OARC
      const orderData = {
        data: {
          "Project Name": values.project_name,
          "Sale Order": values.sale_order,
          "Part No": values.part_number,
          "Part Desc": values.part_description,
          "Required Qty": String(values.required_quantity),
          "Plant": values.plant_id,
          "WBS": values.wbs_element,
          "Rtg Seq No": "0",
          "Sequence No": "0",
          "Launched Qty": String(values.launched_quantity),
          "Prod Order No": values.production_order,
          "Operations": form.getFieldValue('operations') || [],
          "Document Verification": documents || {},
          "Raw Materials": rawMaterials.map(material => ({
            "Sl.No": material.Sl.No,
            "Child Part No": material["Child Part No"],
            "Description": material.Description,
            "Qty Per Set": material["Qty Per Set"],
            "Total Qty": material["Total Qty"],
            "UoM": material.UoM
          }))
        }
      };

      console.log('Sending to save-to-db:', orderData);

      // Create order
      const response = await fetch('http://172.18.7.85:4787/api/v1/planning/save-to-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      console.log('Save to DB response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      if (result && result.message === "Data saved successfully") {
        message.success('Order created successfully');
        onCreate(result);
        form.resetFields();
        onCancel();
      } else {
        throw new Error(result.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      message.error(error.message || 'Failed to create order');
      form.setFields([{
        name: 'submit',
        errors: [error.message || 'Failed to create order']
      }]);
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

  // Update the file change handlers to properly handle the file object
  const handleMppFileChange = (info) => {
    const file = info.fileList[info.fileList.length - 1]?.originFileObj;
    if (file) {
      setMppFile(file);
      // Just store the file and metadata, don't upload yet
      console.log('MPP file selected:', file);
    }
  };

  const handleDrawingFileChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setDrawingFile(file);
      // Just store the file and metadata, don't upload yet
      console.log('Engineering Drawing file selected:', file);
    }
  };

  // Add useEffect to fetch documents when part number is available
  useEffect(() => {
    if (form.getFieldValue('part_number')) {
      fetchDocumentsByPartNumber(form.getFieldValue('part_number'));
    }
  }, [form.getFieldValue('part_number')]);

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

      {/* Project Information */}
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

      {/* Raw Materials Section */}
      {/* {orderDetails?.rawMaterials && orderDetails.rawMaterials.length > 0 && (
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
      )} */}

      {/* Operations Section */}
      {/* {orderDetails?.operations && orderDetails.operations.length > 0 && (
        <>
          <Divider>Operations</Divider>
          {orderDetails.operations.map((operation, index) => (
            <div key={index}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Operation Number">
                    <Input value={operation.operation_number} disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Workcenter">
                    <Input value={operation.workcenter} disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Plant Number">
                    <Input value={operation.plant_number} disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Operation Description">
                    <Input value={operation.operation_description} disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="Setup Time">
                    <Input value={`${operation.setup_time} hrs`} disabled />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Per Piece Time">
                    <Input value={`${operation.per_piece_time} hrs`} disabled />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Jump Quantity">
                    <Input value={operation.jump_quantity} disabled />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Total Quantity">
                    <Input value={operation.total_quantity} disabled />
                  </Form.Item>
                </Col>
              </Row>
              {index < orderDetails.operations.length - 1 && <Divider dashed />}
            </div>
          ))}
        </>
      )} */}

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
      </Row>

      {/* Optional File Uploads Section */}
      {renderFileUploadSection()}

      {/* Add error display */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

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

      // Format the data according to the backend API requirements
      const requestData = {
        data: {
          "Project Name": values.project_name,
          "Sale Order": values.sale_order,
          "Part No": values.part_number,
          "Part Desc": values.part_description,
          "Required Qty": values.required_quantity.toString(),
          "Plant": values.plant_id.toString(),
          "WBS": values.wbs_element,
          "Rtg Seq No": "0",
          "Sequence No": "0",
          "Launched Qty": values.launched_quantity.toString(),
          "Prod Order No": values.production_order,
          "Operations": [],
          "Document Verification": {},
          "Raw Materials": []
        }
      };

      // Save to database
      const response = await fetch('http://172.18.7.85:9671/api/v1/planning/save-to-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save order');
      }

      const savedData = await response.json();

      // Handle file uploads after successful order creation
      try {
        if (mppFile) {
          await uploadMppFile(
            mppFile.originFileObj || mppFile, 
            values.production_order,
            mppDocName.trim(),
            mppDescription.trim(),
            mppVersion.trim()
          );
        }
        
        if (drawingFile) {
          await uploadEngineeringDrawing(
            drawingFile.originFileObj || drawingFile, 
            values.production_order,
            drawingDocName.trim(),
            drawingDescription.trim(),
            drawingVersion.trim()
          );
        }
      } catch (fileError) {
        console.error('File upload error:', fileError);
        message.warning('Order was saved but there was an issue uploading some files: ' + fileError.message);
      }

      message.success('Order saved successfully');
      handleCancel();
    } catch (error) {
      console.error('Submit Error:', error);
      message.error(error.message || 'Failed to save order');
    }
  };
  
  // Update the file upload sections in renderOrderForm
  const renderFileUploadSection = () => (
    <>
      <Divider>Document Information</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="MPP File"
            className="hover:shadow-sm transition-shadow duration-300"
            bordered={true}
            loading={documentLoadingStates.mpp}
          >
            {documents?.mpp_document ? (
              <>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Document Name">
                      <Input value={documents.mpp_document.name} disabled />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Description">
                      <Input.TextArea 
                        value={documents.mpp_document.description} 
                        disabled 
                        rows={2}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Version">
                      <Input value={documents.mpp_document.latest_version.version_number} disabled />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : (
              <>
                <Form.Item label="Document Name" required>
                  <Input 
                    value={mppDocName}
                    onChange={(e) => setMppDocName(e.target.value)}
                    placeholder="Enter document name"
                  />
                </Form.Item>
                <Form.Item label="Description">
                  <Input.TextArea 
                    value={mppDescription}
                    onChange={(e) => setMppDescription(e.target.value)}
                    placeholder="Enter description"
                    rows={2}
                  />
                </Form.Item>
                <Form.Item label="Version" required>
                  <Input 
                    value={mppVersion}
                    onChange={(e) => setMppVersion(e.target.value)}
                    placeholder="Enter version (e.g. v1)"
                  />
                </Form.Item>
                <Upload
                  maxCount={1}
                  onChange={handleMppFileChange}
                  beforeUpload={() => false}
                  accept=".pdf,.doc,.docx"
                  showUploadList={{ showRemoveIcon: true }}
                  fileList={mppFile ? [mppFile] : []}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    className="w-full"
                    disabled={!mppDocName.trim() || !mppVersion.trim()}
                  >
                    {mppFile ? 'Change MPP File' : 'Select MPP File'}
                  </Button>
                </Upload>
              </>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="Engineering Drawing"
            className="hover:shadow-sm transition-shadow duration-300"
            bordered={true}
            loading={documentLoadingStates.engineering}
          >
            {documents?.engineering_drawing_document ? (
              <>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Document Name">
                      <Input value={documents.engineering_drawing_document.name} disabled />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Description">
                      <Input.TextArea 
                        value={documents.engineering_drawing_document.description} 
                        disabled 
                        rows={2}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Version">
                      <Input value={documents.engineering_drawing_document.latest_version.version_number} disabled />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : (
              <>
                <Form.Item label="Document Name" required>
                  <Input 
                    value={drawingDocName}
                    onChange={(e) => setDrawingDocName(e.target.value)}
                    placeholder="Enter document name"
                  />
                </Form.Item>
                <Form.Item label="Description">
                  <Input.TextArea 
                    value={drawingDescription}
                    onChange={(e) => setDrawingDescription(e.target.value)}
                    placeholder="Enter description"
                    rows={2}
                  />
                </Form.Item>
                <Form.Item label="Version" required>
                  <Input 
                    value={drawingVersion}
                    onChange={(e) => setDrawingVersion(e.target.value)}
                    placeholder="Enter version (e.g. v1)"
                  />
                </Form.Item>
                <Upload
                  maxCount={1}
                  onChange={handleDrawingFileChange}
                  beforeUpload={() => false}
                  accept=".pdf,.dwg,.dxf"  // Specify accepted file types
                  showUploadList={{ showRemoveIcon: true }}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    className="w-full"
                    disabled={!drawingDocName.trim()}
                  >
                    {drawingFile ? 'Change Drawing File' : 'Select Drawing File'}
                  </Button>
                </Upload>
              </>
            )}
          </Card>
        </Col>
      </Row>
      {documentError && (
        <Alert
          message="Error Loading Documents"
          description={documentError}
          type="error"
          showIcon
          className="mt-4"
        />
      )}
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