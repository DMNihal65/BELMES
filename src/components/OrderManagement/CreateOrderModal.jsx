import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col, Alert, Card, Table 
} from 'antd';
import { 
  InboxOutlined, FileTextOutlined, LoadingOutlined,
  CloudUploadOutlined, SaveOutlined, ArrowLeftOutlined, EditOutlined, UploadOutlined, SearchOutlined 
} from '@ant-design/icons';
import { ArrowLeftCircle } from 'lucide-react';
import useOrderStore from '../../store/order-store';
import dayjs from 'dayjs';
import usePlanningStore from '../../store/planning-store';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Step } = Steps;

const CreateOrderModal = ({ visible, onCancel, onCreate, onRefresh, initialData = null }) => {
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
    saveOarcDataToDb,
    createManualOrder,
    checkDocumentsByPartNumber,
    clearDocuments,
    uploadDocumentVersion
  } = useOrderStore();
  const { 
    createOperation, 
    searchOrders,
    fetchWorkCenters
  } = usePlanningStore.getState();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [isManualCreate, setIsManualCreate] = useState(false);
  const [mppFile, setMppFile] = useState(null);
  const [drawingFile, setDrawingFile] = useState(null);
  const [mppDocName, setMppDocName] = useState('');
  const [mppVersion, setMppVersion] = useState('');
  const [drawingDocName, setDrawingDocName] = useState('');
  const [drawingVersion, setDrawingVersion] = useState('');
  const [mppDescription, setMppDescription] = useState('');
  const [drawingDescription, setDrawingDescription] = useState('');
  const [oarcData, setOarcData] = useState(null);
  const [operations, setOperations] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [uploadingMppVersion, setUploadingMppVersion] = useState(false);
  const [uploadingDrawingVersion, setUploadingDrawingVersion] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addOperationForm] = Form.useForm();

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
      const result = await uploadPDF(file);
      console.log('OARC Upload Response:', result);

      // Store production order in localStorage
      localStorage.setItem('currentProductionOrder', result["Prod Order No"]);

      // Set form values silently without showing popup
      form.setFieldsValue({
        production_order: result["Prod Order No"],
        sale_order: result["Sale Order"],
        project_name: result["Project Name"],
        priority: 'normal',
        wbs_element: result["WBS"],
        part_number: result["Part No"],
        part_description: result["Part Desc"],
        total_operations: result.Operations?.length || 0,
        required_quantity: result["Required Qty"],
        launched_quantity: result["Launched Qty"],
        plant_id: result["Plant"]
      });

      // Store complete data in localStorage
      const completeData = {
        "Project Name": result["Project Name"],
        "Sale Order": result["Sale Order"],
        "Part No": result["Part No"],
        "Part Desc": result["Part Desc"],
        "Required Qty": result["Required Qty"],
        "Plant": result["Plant"],
        "WBS": result["WBS"],
        "Rtg Seq No": result["Rtg Seq No"],
        "Sequence No": result["Sequence No"],
        "Launched Qty": result["Launched Qty"],
        "Prod Order No": result["Prod Order No"],
        "Operations": result.Operations,
        "Raw Materials": result["Raw Materials"],
        "Document Verification": {}
      };

      const storageKey = `oarcData_${result["Prod Order No"]}`;
      localStorage.setItem(storageKey, JSON.stringify(completeData));

      setOrderData(completeData);
      setOperations(result.Operations);
      setRawMaterials(result["Raw Materials"]);

      // Move to next step without showing popup
      setCurrentStep(1);
      return false;
    } catch (error) {
      console.error('Error uploading OARC:', error);
      message.error('Failed to upload OARC document');
      return false;
    }
  };

  const renderOperations = () => (
    <div className="mb-4">
      <Divider>Operations</Divider>
      <Table
        dataSource={operations?.map(op => ({
          key: op["Oprn No"],
          operation_number: op["Oprn No"],
          workcenter: op["Wc/Plant"],
          operation_description: op["Operation"],
          setup_time: op["Setup Time"],
          per_piece_time: op["Per Pc Time"]
        })) || []}
        size="small"
        pagination={false}
        scroll={{ y: 200 }}
        columns={[
          {
            title: 'Operation No',
            dataIndex: 'operation_number',
            key: 'operation_number',
          },
          {
            title: 'Workcenter',
            dataIndex: 'workcenter',
            key: 'workcenter',
          },
          {
            title: 'Operation',
            dataIndex: 'operation_description',
            key: 'operation_description',
          },
          {
            title: 'Setup Time',
            dataIndex: 'setup_time',
            key: 'setup_time',
          },
          {
            title: 'Per Piece Time',
            dataIndex: 'per_piece_time',
            key: 'per_piece_time',
          }
        ]}
      />
    </div>
  );

  const renderRawMaterials = () => (
    <div className="mb-4">
      <Divider>Raw Materials</Divider>
      <Table
        dataSource={rawMaterials?.map(material => ({
          key: material["Sl.No"],
          slNo: material["Sl.No"],
          childPartNo: material["Child Part No"],
          description: material["Description"],
          qtyPerSet: material["Qty Per Set"],
          uom: material["UoM"],
          totalQty: material["Total Qty"]
        })) || []}
        size="small"
        pagination={false}
        scroll={{ y: 200 }}
        columns={[
          {
            title: 'Sl.No',
            dataIndex: 'slNo',
            key: 'slNo',
            width: 80,
          },
          {
            title: 'Child Part No',
            dataIndex: 'childPartNo',
            key: 'childPartNo',
            width: 150,
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 250,
          },
          {
            title: 'Qty Per Set',
            dataIndex: 'qtyPerSet',
            key: 'qtyPerSet',
            width: 120,
            render: (text, record) => `${text} ${record.uom}`
          },
          {
            title: 'UoM',
            dataIndex: 'uom',
            key: 'uom',
            width: 80,
          },
          {
            title: 'Total Qty',
            dataIndex: 'totalQty',
            key: 'totalQty',
            width: 120,
            render: (text, record) => `${text} ${record.uom}`
          }
        ]}
        className="border border-gray-200 rounded-lg"
      />
    </div>
  );

  const handleBack = () => {
    if (isManualCreate) {
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
    setMppVersion('');
    setMppDescription('');
    setDrawingDocName('');
    setDrawingVersion('');
    setDrawingDescription('');
    onCancel();
  };

  const handleManualCreate = () => {
    form.resetFields();
    setMppFile(null);
    setDrawingFile(null);
    setMppDocName('');
    setMppDescription('');
    setMppVersion('');
    setDrawingDocName('');
    setDrawingDescription('');
    setDrawingVersion('');
    clearDocuments();
    setIsManualCreate(true);
  };

  const handleCheckDocuments = async () => {
    try {
      const partNumber = form.getFieldValue('part_number');
      if (!partNumber) {
        throw new Error('Please enter a part number first');
      }

      // Just fetch the documents without showing any popup
      await checkDocumentsByPartNumber(partNumber);

    } catch (error) {
      console.error('Error checking documents:', error);
      message.error(error.message || 'Failed to check documents');
    }
  };

  const handleMppFileChange = (info) => {
    if (info.fileList.length > 0) {
      setMppFile(info.fileList[0].originFileObj);
    } else {
      setMppFile(null);
    }
  };

  const handleDrawingFileChange = (info) => {
    if (info.fileList.length > 0) {
      setDrawingFile(info.fileList[0].originFileObj);
    } else {
      setDrawingFile(null);
    }
  };

  const handleManualSubmit = async (values) => {
    try {
      // First create the order with basic information
      const orderData = {
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

      // Create FormData for MPP document if either file exists or document exists
      let mppFormData = null;
      if (mppFile || documents?.mpp_document) {
        mppFormData = new FormData();
        if (mppFile) {
          // If new file is uploaded
          mppFormData.append('file', mppFile);
          mppFormData.append('name', mppDocName);
          mppFormData.append('doc_type', 'MPP');
          mppFormData.append('part_number', values.part_number);
          mppFormData.append('description', mppDescription);
          mppFormData.append('version', mppVersion);
        } else if (documents?.mpp_document) {
          // If using existing document
          mppFormData.append('file', documents.mpp_document.latest_version.file_url);
          mppFormData.append('name', documents.mpp_document.name);
          mppFormData.append('doc_type', 'MPP');
          mppFormData.append('part_number', values.part_number);
          mppFormData.append('description', documents.mpp_document.description || '');
          mppFormData.append('version', documents.mpp_document.latest_version.version_number);
        }
      }

      // Create FormData for Engineering Drawing if either file exists or document exists
      let drawingFormData = null;
      if (drawingFile || documents?.engineering_drawing_document) {
        drawingFormData = new FormData();
        if (drawingFile) {
          // If new file is uploaded
          drawingFormData.append('file', drawingFile);
          drawingFormData.append('name', drawingDocName);
          drawingFormData.append('doc_type', 'ENGINEERING_DRAWING');
          drawingFormData.append('part_number', values.part_number);
          drawingFormData.append('description', drawingDescription);
          drawingFormData.append('version', drawingVersion);
        } else if (documents?.engineering_drawing_document) {
          // If using existing document
          drawingFormData.append('file', documents.engineering_drawing_document.latest_version.file_url);
          drawingFormData.append('name', documents.engineering_drawing_document.name);
          drawingFormData.append('doc_type', 'ENGINEERING_DRAWING');
          drawingFormData.append('part_number', values.part_number);
          drawingFormData.append('description', documents.engineering_drawing_document.description || '');
          drawingFormData.append('version', documents.engineering_drawing_document.latest_version.version_number);
        }
      }

      // Call createManualOrder with all the data
      const result = await createManualOrder({
        ...orderData,
        mppFormData,
        drawingFormData
      });

      if (result.fileUploadErrors) {
        message.warning('Order was saved but there were issues uploading some files: ' + result.fileUploadErrors.join(', '));
      } else {
        message.success('Order and documents saved successfully');
      }

      // Call onCreate with the result and wait for it to complete
      await onCreate(result);
      
      // Clear the form and close the modal
      handleCancel();
    } catch (error) {
      console.error('Submit Error:', error);
      message.error(error.message || 'Failed to save order');
    }
  };

  const handleSubmit = async (values) => {
    try {
      form.setFields([{ name: 'submit', errors: [] }]);
      
      if (isManualCreate) {
        // Handle manual creation case
        await handleManualSubmit(values);
      } else {
        // Handle OARC upload case
        const productionOrder = values.production_order;
        if (!productionOrder) {
          throw new Error('No production order found');
        }

        const storageKey = `oarcData_${productionOrder}`;
        const storedData = JSON.parse(localStorage.getItem(storageKey) || 'null');
        
        if (!storedData) {
          throw new Error('No stored data found');
        }

        // Save OARC data
        const result = await saveOarcDataToDb(
          storedData,
          mppFile,
          drawingFile,
          mppDocName,
          mppDescription,
          mppVersion,
          drawingDocName,
          drawingDescription,
          drawingVersion
        );

        // Clean up localStorage
        localStorage.removeItem(storageKey);
        localStorage.removeItem('currentProductionOrder');

        if (result.fileUploadError) {
          message.warning('Order was saved but there was an issue uploading some files: ' + result.fileUploadError);
        } else {
          message.success('Order and documents saved successfully');
        }

        await onCreate(result);
      }

      // Clear form and close modal
      form.resetFields();
      clearDocuments();
      onCancel();

    } catch (error) {
      console.error('Order submission error:', error);
      message.error(error.message || 'Failed to create order');
      form.setFields([{
        name: 'submit',
        errors: [error.message || 'Failed to create order']
      }]);
    }
  };

  const handleUploadNewMppVersion = async (file) => {
    if (!documents?.mpp_document?.id) {
      message.error('No MPP document found to update');
      return;
    }
    
    setUploadingMppVersion(true);
    try {
      const { uploadNewVersion } = useOrderStore.getState();
      
      await uploadNewVersion(documents.mpp_document.id, file, mppVersion);
      message.success('MPP document version uploaded successfully');
      
      // Refresh documents to show the new version
      const partNumber = form.getFieldValue('part_number');
      await checkDocumentsByPartNumber(partNumber);
    } catch (error) {
      message.error(`Failed to upload MPP version: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingMppVersion(false);
    }
  };

  const handleUploadNewDrawingVersion = async (file) => {
    if (!documents?.engineering_drawing_document?.id) {
      message.error('No Engineering Drawing document found to update');
      return;
    }
    
    setUploadingDrawingVersion(true);
    try {
      const { uploadNewVersion } = useOrderStore.getState();
      
      await uploadNewVersion(documents.engineering_drawing_document.id, file, drawingVersion);
      message.success('Engineering Drawing version uploaded successfully');
      
      // Refresh documents to show the new version
      const partNumber = form.getFieldValue('part_number');
      await checkDocumentsByPartNumber(partNumber);
    } catch (error) {
      message.error(`Failed to upload Engineering Drawing version: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingDrawingVersion(false);
    }
  };

  const handleAddOperation = async (values) => {
    try {
      const { 
        createOperation, 
        searchOrders,
        fetchWorkCenters
      } = usePlanningStore.getState();
      
      // Get the current order details to get the order_id
      const currentSearchResults = await searchOrders(productionOrder || orderNumber);
      const order = currentSearchResults?.orders?.[0];
      
      if (!order?.id) {
        throw new Error('Order details not found');
      }

      // Calculate the next operation number
      const nextOperationNumber = operations.length > 0 
        ? Math.max(...operations.map(op => parseInt(op.operation_number))) + 10 
        : 10;

      // Create operation data with the order_id from the API response
      const operationData = {
        part_number: partNumber,
        operation_number: parseInt(nextOperationNumber),
        operation_description: values.operation_description,
        setup_time: parseFloat(values.setup_time),
        ideal_cycle_time: parseFloat(values.ideal_cycle_time),
        work_center_code: values.work_center_code,
        order_id: order.id
      };

      // Create the operation
      const newOperation = await createOperation(partNumber, operationData);

      // Add the new operation to the local state immediately with machine information
      const newOperationWithDetails = {
        ...newOperation,
        id: newOperation.id,
        key: String(newOperation.id),
        operation_number: nextOperationNumber,
        operation_description: values.operation_description,
        setup_time: parseFloat(values.setup_time),
        ideal_cycle_time: parseFloat(values.ideal_cycle_time),
        work_center: values.work_center_code,
        work_center_machines: newOperation.work_center_machines || [],
        primary_machine: newOperation.primary_machine || null
      };

      // Update the operations state with the new operation
      setOperations(prevOperations => {
        const updatedOperations = [...prevOperations, newOperationWithDetails]
          .sort((a, b) => parseInt(a.operation_number) - parseInt(b.operation_number));
        return updatedOperations;
      });

      message.success('Operation created successfully');
      setIsAddModalVisible(false);
      addOperationForm.resetFields();

    } catch (error) {
      console.error('Error adding operation:', error);
      message.error(error.message || 'Failed to create operation');
    }
  };

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
      form.resetFields();
      clearOrderDetails();
      setCurrentStep(0);
      setFileList([]);
      setRawMaterials([]);
      setIsManualCreate(false);
    } else if (initialData) {
      form.setFieldsValue({
        ...initialData,
        deliveryDate: initialData.deliveryDate ? dayjs(initialData.deliveryDate) : undefined,
      });
      setCurrentStep(1);
    }
  }, [visible, initialData, form]);

  useEffect(() => {
    if (visible) {
      const productionOrder = localStorage.getItem('currentProductionOrder');
      if (productionOrder) {
        const storageKey = `oarcData_${productionOrder}`;
        const storedData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (storedData) {
          setOperations(storedData.Operations || []);
          setRawMaterials(storedData["Raw Materials"] || []);
        }
      }
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Clear form
      form.resetFields();
      
      // Reset document states
      setMppFile(null);
      setDrawingFile(null);
      setMppDocName('');
      setMppDescription('');
      setMppVersion('');
      setDrawingDocName('');
      setDrawingDescription('');
      setDrawingVersion('');
      
      // Clear document store state
      clearDocuments();
    }
  }, [visible, form]);

  useEffect(() => {
    if (documents?.mpp_document?.latest_version) {
      setMppVersion(documents.mpp_document.latest_version.version_number);
    }
    
    if (documents?.engineering_drawing_document?.latest_version) {
      setDrawingVersion(documents.engineering_drawing_document.latest_version.version_number);
    }
  }, [documents]);

  const renderOrderForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={orderDetails || initialData}
      className="p-4"
    >
      <Divider>Order Information</Divider>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="production_order"
            label="Production Order"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="sale_order"
            label="Sales Order"
          >
            <Input disabled />
          </Form.Item>
        </Col>
      </Row>

      <Divider>Project Information</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="project_name"
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

      {/* Display Raw Materials section if data exists */}
      {Array.isArray(rawMaterials) && rawMaterials.length > 0 && (
        <Card className="mb-4 bg-gray-50">
          {renderRawMaterials()}
        </Card>
      )}

      {/* Display Operations section if data exists */}
      {Array.isArray(operations) && operations.length > 0 && (
        <Card className="mb-4 bg-gray-50">
          {renderOperations()}
        </Card>
      )}

      <Divider/>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="wbs_element"
            label="WBS Element"
            rules={[{ required: true, message: 'Please enter WBS Element' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="part_number"
            label="Part Number"
            rules={[{ required: true, message: 'Please enter Part Number' }]}
          >
            <Input 
              placeholder="Enter part number" 
              onChange={(e) => {
                if (e.target.value) {
                  handleCheckDocuments(); // Silently check documents when part number changes
                }
              }}
            />
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
            name="total_operations"
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
            name="launched_quantity"
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
            name="plant_id"
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

      {renderFileUploadSection()}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

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

  const renderManualCreateForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
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
              <Input.Group compact>
                <Form.Item
                  name="part_number"
                  noStyle
                >
                  <Input 
                    style={{ width: 'calc(100% - 100px)' }} 
                    placeholder="Enter part number" 
                  />
                </Form.Item>
                <Button 
                  type="primary"
                  onClick={handleCheckDocuments}
                  loading={documentLoadingStates.mpp || documentLoadingStates.engineering}
                  icon={<SearchOutlined />}
                >
                  Check
                </Button>
              </Input.Group>
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
            styles={{
              body: {
                padding: '24px'
              }
            }}
          >
            {documents?.mpp_document ? (
              <>
                <Form.Item label="Document Name">
                  <Input value={documents.mpp_document.name} disabled />
                </Form.Item>
                <Form.Item label="Description">
                  <Input.TextArea value={documents.mpp_document.description} disabled rows={2} />
                </Form.Item>
                <Form.Item label="Version">
                  <Input 
                    value={mppVersion}
                    onChange={(e) => setMppVersion(e.target.value)}
                    placeholder="Enter version (e.g. v2)"
                  />
                </Form.Item>
                <Space direction="vertical" className="w-full">
                  <Button 
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.doc,.docx';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleUploadNewMppVersion(file);
                        }
                      };
                      input.click();
                    }}
                    loading={uploadingMppVersion}
                    className="w-full mt-2"
                  >
                    Upload New Version
                  </Button>
                </Space>
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
                >
                  <Button icon={<UploadOutlined />} className="w-full">
                    Select MPP File
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
            styles={{
              body: {
                padding: '24px'
              }
            }}
          >
            {documents?.engineering_drawing_document ? (
              <>
                <Form.Item label="Document Name">
                  <Input value={documents.engineering_drawing_document.name} disabled />
                </Form.Item>
                <Form.Item label="Description">
                  <Input.TextArea value={documents.engineering_drawing_document.description} disabled rows={2} />
                </Form.Item>
                <Form.Item label="Version">
                  <Input 
                    value={drawingVersion}
                    onChange={(e) => setDrawingVersion(e.target.value)}
                    placeholder="Enter version (e.g. v2)"
                  />
                </Form.Item>
                <Space direction="vertical" className="w-full">
                  <Button 
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.dwg,.dxf';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleUploadNewDrawingVersion(file);
                        }
                      };
                      input.click();
                    }}
                    loading={uploadingDrawingVersion}
                    className="w-full mt-2"
                  >
                    Upload New Version
                  </Button>
                </Space>
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
                  accept=".pdf,.dwg,.dxf"
                >
                  <Button icon={<UploadOutlined />} className="w-full">
                    Select Drawing File
                  </Button>
                </Upload>
              </>
            )}
          </Card>
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
              onClick={handleManualCreate}
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