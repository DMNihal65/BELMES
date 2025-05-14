import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col, Alert, Card, Table, Tooltip, Switch 
} from 'antd';
import { 
  InboxOutlined, FileTextOutlined, LoadingOutlined,
  CloudUploadOutlined, SaveOutlined, ArrowLeftOutlined, EditOutlined, UploadOutlined, SearchOutlined 
} from '@ant-design/icons';
import { ArrowLeftCircle } from 'lucide-react';
import useOrderStore from '../../store/order-store';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Step } = Steps;

const CreateOrderModal = ({ visible, onCancel, onCreate, onRefresh, initialData = null }) => {
  const [form] = Form.useForm();
  const mppUploadRef = React.useRef(null);
  const drawingUploadRef = React.useRef(null);
  const mppVersionUploadRef = React.useRef(null);
  const drawingVersionUploadRef = React.useRef(null);
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
    uploadDocumentVersion,
    uploadNewVersion
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
  const [oarcData, setOarcData] = useState(null);
  const [operations, setOperations] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [enableMppVersionUpload, setEnableMppVersionUpload] = useState(false);
  const [enableDrawingVersionUpload, setEnableDrawingVersionUpload] = useState(false);
  const [mppVersionFile, setMppVersionFile] = useState(null);
  const [drawingVersionFile, setDrawingVersionFile] = useState(null);
  const [newMppVersion, setNewMppVersion] = useState('');
  const [newDrawingVersion, setNewDrawingVersion] = useState('');

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
      console.log('OARC Upload Response:', result);

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
      localStorage.setItem('currentProductionOrder', result["Prod Order No"]);
      localStorage.setItem(storageKey, JSON.stringify(completeData));

      setOrderData(completeData);
      setOperations(result.Operations);
      setRawMaterials(result["Raw Materials"]);

      console.log('Stored complete data:', completeData);

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

      // Fetch existing documents for the part number
      if (result["Part No"]) {
        try {
          const documentsResponse = await fetchDocumentsByPartNumber(result["Part No"]);
          console.log('Fetched documents:', documentsResponse);
          
          // If documents exist, set them in the state
          if (documentsResponse) {
            if (documentsResponse.mpp_document) {
              setMppDocName(documentsResponse.mpp_document.name);
              setMppDescription(documentsResponse.mpp_document.description || '');
              setMppVersion(documentsResponse.mpp_document.latest_version?.version_number || 'v1');
            }
            if (documentsResponse.engineering_drawing_document) {
              setDrawingDocName(documentsResponse.engineering_drawing_document.name);
              setDrawingDescription(documentsResponse.engineering_drawing_document.description || '');
              setDrawingVersion(documentsResponse.engineering_drawing_document.latest_version?.version_number || 'v1');
            }
          }
        } catch (error) {
          console.error('Error fetching documents:', error);
        }
      }

      setCurrentStep(1);
      return false;
    } catch (error) {
      message.error(error.message || 'Failed to upload file');
      return false;
    }
  };

  const renderOperations = () => (
    <div className="mb-4">
      <Divider>Operations</Divider>
      <Table
        dataSource={operations?.map(op => ({
          ...op, // Keep all original fields
          key: op["Oprn No"],
          operation_number: op["Oprn No"],
          workcenter: op["Wc/Plant"],
          operation_description: op["Operation"],
          setup_time: op["Setup Time"],
          per_piece_time: op["Per Pc Time"]
        })) || []}
        size="small"
        pagination={false}
        scroll={{ y: 250, x: 1000 }}
        columns={[
          {
            title: 'Operation No',
            dataIndex: 'operation_number',
            key: 'operation_number',
            width: 120,
          },
          {
            title: 'Workcenter',
            dataIndex: 'workcenter',
            key: 'workcenter',
            width: 150,
          },
          {
            title: 'Operation',
            dataIndex: 'operation_description',
            key: 'operation_description',
            width: 250,
          },
          {
            title: 'Setup Time',
            dataIndex: 'setup_time',
            key: 'setup_time',
            width: 120,
          },
          {
            title: 'Per Piece Time',
            dataIndex: 'per_piece_time',
            key: 'per_piece_time',
            width: 150,
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
          ...material, // Keep all original fields
          key: material["Sl.No"],
          serial_number: material["Sl.No"],
          child_part_number: material["Child Part No"],
          description: material["Description"],
          quantity_per_set: material["Qty Per Set"],
          unit_of_measure: material["UoM"],
          total_quantity: material["Total Qty"]
        })) || []}
        size="small"
        pagination={false}
        scroll={{ y: 250, x: 1000 }}
        columns={[
          {
            title: 'Sl. No',
            dataIndex: 'serial_number',
            key: 'serial_number',
            width: 80,
          },
          {
            title: 'Part Number',
            dataIndex: 'child_part_number',
            key: 'child_part_number',
            width: 180,
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 250,
          },
          {
            title: 'Quantity Per Set',
            dataIndex: 'quantity_per_set',
            key: 'quantity_per_set',
            width: 140,
          },
          {
            title: 'UoM',
            dataIndex: 'unit_of_measure',
            key: 'unit_of_measure',
            width: 100,
          },
          {
            title: 'Total Quantity',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
            width: 140,
          }
        ]}
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
    setMppVersion('v1');
    setMppDescription('');
    setDrawingDocName('');
    setDrawingVersion('v1');
    setDrawingDescription('');
    setEnableMppVersionUpload(false);
    setEnableDrawingVersionUpload(false);
    setMppVersionFile(null);
    setDrawingVersionFile(null);
    setNewMppVersion('');
    setNewDrawingVersion('');
    onCancel();
  };

  const handleManualCreate = () => {
    form.resetFields();
    setMppFile(null);
    setDrawingFile(null);
    setMppDocName('');
    setMppDescription('');
    setMppVersion('v1');
    setDrawingDocName('');
    setDrawingDescription('');
    setDrawingVersion('v1');
    clearDocuments();
    setIsManualCreate(true);
  };

  const handleCheckDocuments = async () => {
    try {
      const partNumber = form.getFieldValue('part_number');
      if (!partNumber) {
        message.error('Please enter a part number first');
        return;
      }

      // Clear previous document data before checking
      setMppFile(null);
      setDrawingFile(null);
      setMppDocName('');
      setMppDescription('');
      setMppVersion('v1');
      setDrawingDocName('');
      setDrawingDescription('');
      setDrawingVersion('v1');
      clearDocuments();

      message.loading({ content: 'Checking documents...', key: 'docCheck' });
      const data = await checkDocumentsByPartNumber(partNumber);
      
      // Pre-fill document fields if documents exist
      if (data.mpp_document) {
        // For existing documents, we just store the reference
        // These values are displayed read-only in the UI
        setMppDocName(data.mpp_document.name || '');
        setMppDescription(data.mpp_document.description || '');
        setMppVersion(data.mpp_document.latest_version?.version_number || 'v1');
        
        // Disable upload for existing documents
        message.info('MPP document found. Document details cannot be modified.');
      }
      
      if (data.engineering_drawing_document) {
        // For existing documents, we just store the reference
        // These values are displayed read-only in the UI
        setDrawingDocName(data.engineering_drawing_document.name || '');
        setDrawingDescription(data.engineering_drawing_document.description || '');
        setDrawingVersion(data.engineering_drawing_document.latest_version?.version_number || 'v1');
        
        // Disable upload for existing documents
        message.info('Engineering Drawing document found. Document details cannot be modified.');
      }

      // Show success message with information about found documents
      let successMessage = 'Documents checked successfully';
      if (data.mpp_document || data.engineering_drawing_document) {
        successMessage += '. Existing documents will be used.';
      } else {
        successMessage += '. No existing documents found. You can upload new ones.';
      }
      
      message.success({ 
        content: successMessage, 
        key: 'docCheck',
        duration: 4
      });
    } catch (error) {
      message.error({ 
        content: error.message || 'Failed to check documents', 
        key: 'docCheck' 
      });
    }
  };

  const handleMppFileChange = (info) => {
    console.log('MPP file change event:', info);
    
    try {
      if (info.fileList && info.fileList.length > 0) {
        // Get the file from the fileList
        const file = info.fileList[0].originFileObj || info.fileList[0];
        console.log('Setting MPP file:', file);
        
        // Explicitly set the file name property if it doesn't exist
        if (!file.name && info.fileList[0].name) {
          file.name = info.fileList[0].name;
        }
        
        setMppFile(file);
        
        // Force a re-render by updating component state
        setTimeout(() => {
          // Any small state change to force re-render
          setMppDescription(prev => prev + ' ');
          setTimeout(() => setMppDescription(prev => prev.trim()), 10);
        }, 10);
      } else {
        console.log('Clearing MPP file (no files in fileList)');
        setMppFile(null);
      }
    } catch (error) {
      console.error('Error handling MPP file change:', error);
      message.error('Failed to process the selected file');
    }
  };

  const handleDrawingFileChange = (info) => {
    console.log('Drawing file change event:', info);
    
    try {
      if (info.fileList && info.fileList.length > 0) {
        // Get the file from the fileList
        const file = info.fileList[0].originFileObj || info.fileList[0];
        console.log('Setting drawing file:', file);
        
        // Explicitly set the file name property if it doesn't exist
        if (!file.name && info.fileList[0].name) {
          file.name = info.fileList[0].name;
        }
        
        setDrawingFile(file);
        
        // Force a re-render by updating component state
        setTimeout(() => {
          // Any small state change to force re-render
          setDrawingDescription(prev => prev + ' ');
          setTimeout(() => setDrawingDescription(prev => prev.trim()), 10);
        }, 10);
      } else {
        console.log('Clearing drawing file (no files in fileList)');
        setDrawingFile(null);
      }
    } catch (error) {
      console.error('Error handling drawing file change:', error);
      message.error('Failed to process the selected file');
    }
  };

  const handleMppVersionFileChange = (info) => {
    if (info.fileList.length > 0) {
      setMppVersionFile(info.fileList[0].originFileObj);
    } else {
      setMppVersionFile(null);
    }
  };

  const handleDrawingVersionFileChange = (info) => {
    if (info.fileList.length > 0) {
      setDrawingVersionFile(info.fileList[0].originFileObj);
    } else {
      setDrawingVersionFile(null);
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
      
      if (!isManualCreate) {
        // Handle OARC upload case
        const productionOrder = localStorage.getItem('currentProductionOrder');
        if (!productionOrder) {
          throw new Error('No production order found');
        }

        const storageKey = `oarcData_${productionOrder}`;
        const storedData = JSON.parse(localStorage.getItem(storageKey));
        
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
      } else {
        // Handle manual creation case
        try {
          console.log('Creating manual order with values:', values);
          
          // Create a payload object for better debugging
          const orderPayload = {
            ...values,
            mppFile,
            drawingFile,
            mppDocName,
            mppDescription,
            mppVersion,
            drawingDocName,
            drawingDescription,
            drawingVersion
          };
          
          // Log the payload
          console.log('Order payload:', orderPayload);
          
          const result = await createManualOrder(orderPayload);
          
          console.log('Manual order creation result:', result);

          if (result.fileUploadError) {
            message.warning('Order was created but there was an issue uploading some files: ' + result.fileUploadError);
          } else {
            message.success('Order and documents created successfully');
          }

          await onCreate(result);
        } catch (createError) {
          console.error('Detailed manual order creation error:', createError);
          throw new Error(`Failed to create order: ${createError.message || 'Unknown error'}`);
        }
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
      setMppVersion('v1');
      setDrawingDocName('');
      setDrawingDescription('');
      setDrawingVersion('v1');
      
      // Clear document store state
      clearDocuments();
    }
  }, [visible, form]);

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

      {Array.isArray(rawMaterials) && rawMaterials.length > 0 && renderRawMaterials()}

      {Array.isArray(operations) && operations.length > 0 && renderOperations()}

      <Divider/>
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

        {/* Show document status if checked */}
        {(documents?.mpp_document || documents?.engineering_drawing_document) && (
          <Alert
            message="Existing Documents Found"
            description={
              <div>
                {documents?.mpp_document && (
                  <div className="mb-1">
                    <strong>MPP File:</strong> {documents.mpp_document.name} 
                    <span className="ml-2 text-blue-500">(v{documents.mpp_document.latest_version?.version_number || '1'})</span>
                    <div className="text-xs text-gray-500">Existing documents will be used and cannot be modified in this form.</div>
                  </div>
                )}
                {documents?.engineering_drawing_document && (
                  <div>
                    <strong>Engineering Drawing:</strong> {documents.engineering_drawing_document.name}
                    <span className="ml-2 text-blue-500">(v{documents.engineering_drawing_document.latest_version?.version_number || '1'})</span>
                    <div className="text-xs text-gray-500">Existing documents will be used and cannot be modified in this form.</div>
                  </div>
                )}
              </div>
            }
            type="info"
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
  );


  const renderFileUploadSection = () => (
    <>
      <Divider>Document Information</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title={
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">MPP File</span>
                <div className="flex items-center">
                  {documents?.mpp_document && (
                    <div className="flex items-center mr-2">
                      <span className="text-xs mr-2">New Version</span>
                      <Switch 
                        size="small" 
                        checked={enableMppVersionUpload}
                        onChange={(checked) => setEnableMppVersionUpload(checked)}
                      />
                    </div>
                  )}
                  {!documents?.mpp_document && (
                    <Tooltip title="Upload MPP File">
                      <Button 
                        type="primary"
                        shape="circle"
                        icon={<UploadOutlined />} 
                        size="small"
                        onClick={() => {
                          if (mppUploadRef.current) {
                            mppUploadRef.current.upload.openFileDialogOnClick();
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            }
            className="hover:shadow-sm transition-shadow duration-300"
            bordered={true}
            loading={documentLoadingStates.mpp}
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
                    value={documents.mpp_document.latest_version?.version_number || 'v1'}
                    disabled
                  />
                </Form.Item>
                
                {enableMppVersionUpload ? (
                  <>
                    <Form.Item label="New Version Number" required>
                      <Input
                        value={newMppVersion}
                        onChange={(e) => setNewMppVersion(e.target.value)}
                        placeholder="Enter new version (e.g. v2)"
                      />
                    </Form.Item>
                    <Upload
                      maxCount={1}
                      onChange={handleMppVersionFileChange}
                      beforeUpload={() => false}
                      accept=".pdf,.doc,.docx"
                      ref={mppVersionUploadRef}
                    >
                      <Button icon={<UploadOutlined />} className="w-full mb-2">
                        Select New MPP Version
                      </Button>
                    </Upload>
                    <Button 
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      className="w-full mt-2"
                      disabled={!mppVersionFile || !newMppVersion}
                      onClick={async () => {
                        if (mppVersionFile && newMppVersion && documents?.mpp_document?.id) {
                          try {
                            message.loading({ 
                              content: 'Uploading new MPP version...', 
                              key: 'mppUpload',
                              duration: 0 
                            });
                            
                            // Validate and prepare the file
                            const fileInfo = validateAndPrepareFile(mppVersionFile);
                            if (!fileInfo) {
                              message.error({
                                content: 'Invalid file selected',
                                key: 'mppUpload'
                              });
                              return;
                            }
                            
                            // Log detailed information for debugging
                            console.log('MPP Upload Details:', {
                              documentId: documents.mpp_document.id,
                              ...fileInfo,
                              versionNumber: newMppVersion
                            });
                            
                            // Create FormData for version upload
                            const formData = new FormData();
                            
                            // Ensure the file is properly attached to FormData
                            formData.append('file', fileInfo.file);
                            formData.append('version_number', newMppVersion);
                            
                            // Add document type for clarity
                            formData.append('doc_type', 'MPP'); // This might help the server identify the document type
                            
                            // Add part number if available
                            const partNumber = form.getFieldValue('part_number');
                            if (partNumber) {
                              formData.append('part_number', partNumber);
                            }
                            
                            // Log FormData entries for verification
                            for (let pair of formData.entries()) {
                              console.log('FormData entry:', pair[0], 
                                typeof pair[1] === 'object' ? `File: ${pair[1].name}, type: ${pair[1].type}, size: ${pair[1].size}` : pair[1]);
                            }
                            
                            let response;
                            try {
                              // First try with uploadDocumentVersion 
                              console.log('Attempting to upload with uploadDocumentVersion...');
                              response = await uploadDocumentVersion(
                                documents.mpp_document.id,
                                formData
                              );
                              console.log('MPP Upload Response (uploadDocumentVersion):', response);
                            } catch (initialError) {
                              console.warn('First upload method failed, trying alternative:', initialError);
                              
                              // If that fails, try the original uploadNewVersion method as fallback
                              console.log('Falling back to uploadNewVersion for MPP...');
                              response = await uploadNewVersion(
                                documents.mpp_document.id,
                                fileInfo.file,
                                newMppVersion
                              );
                              console.log('MPP Upload Response (uploadNewVersion fallback):', response);
                            }
                            
                            message.success({ 
                              content: `MPP document version ${newMppVersion} uploaded successfully`, 
                              key: 'mppUpload',
                              duration: 5
                            });
                            
                            // Reset form fields after successful upload
                            setMppVersionFile(null);
                            setNewMppVersion('');
                            setEnableMppVersionUpload(false);
                            
                            // Refresh documents for this part number
                            if (partNumber) {
                              await fetchDocumentsByPartNumber(partNumber);
                            }
                          } catch (error) {
                            console.error('Error uploading MPP version (all methods failed):', error);
                            
                            // Get a more detailed error message if possible
                            let errorMessage = error.message;
                            if (error.response) {
                              try {
                                const errorData = await error.response.json();
                                errorMessage = errorData.detail || errorData.message || error.message;
                              } catch (e) {
                                // If we can't parse the response, just use the original error
                              }
                            }
                            
                            message.error({ 
                              content: `Failed to upload new version: ${errorMessage}`, 
                              key: 'mppUpload',
                              duration: 6
                            });
                          }
                        } else {
                          message.warning('Please provide both a new version number and a file');
                        }
                      }}
                    >
                      Upload New Version
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    className="w-full mt-2"
                    disabled
                  >
                    Upload New Version
                  </Button>
                )}
                
                {!enableMppVersionUpload && (
                  <Alert
                    message="Document Already Exists"
                    description="This part number already has an MPP document. Toggle 'New Version' switch to upload a new version."
                    type="info"
                    showIcon
                    className="mt-3"
                  />
                )}
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
                  ref={mppUploadRef}
                  fileList={mppFile ? [{ uid: '-1', name: mppFile.name, originFileObj: mppFile }] : []}
                >
                  <Button icon={<UploadOutlined />} className="w-full">
                    Select MPP File
                  </Button>
                </Upload>
                {/* Debug information */}
                <div className="mt-2 text-xs text-gray-500">
                  File selected: {mppFile ? `Yes (${mppFile.name})` : 'No'}
                </div>
              </>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">Engineering Drawing</span>
                <div className="flex items-center">
                  {documents?.engineering_drawing_document && (
                    <div className="flex items-center mr-2">
                      <span className="text-xs mr-2">New Version</span>
                      <Switch 
                        size="small" 
                        checked={enableDrawingVersionUpload}
                        onChange={(checked) => setEnableDrawingVersionUpload(checked)}
                      />
                    </div>
                  )}
                  {!documents?.engineering_drawing_document && (
                    <Tooltip title="Upload Engineering Drawing">
                      <Button 
                        type="primary"
                        shape="circle"
                        icon={<UploadOutlined />} 
                        size="small"
                        onClick={() => {
                          if (drawingUploadRef.current) {
                            drawingUploadRef.current.upload.openFileDialogOnClick();
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            }
            className="hover:shadow-sm transition-shadow duration-300"
            bordered={true}
            loading={documentLoadingStates.engineering}
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
                    value={documents.engineering_drawing_document.latest_version?.version_number || 'v1'}
                    disabled
                  />
                </Form.Item>
                
                {enableDrawingVersionUpload ? (
                  <>
                    <Form.Item label="New Version Number" required>
                      <Input
                        value={newDrawingVersion}
                        onChange={(e) => setNewDrawingVersion(e.target.value)}
                        placeholder="Enter new version (e.g. v2)"
                      />
                    </Form.Item>
                    <Upload
                      maxCount={1}
                      onChange={handleDrawingVersionFileChange}
                      beforeUpload={() => false}
                      accept=".pdf,.dwg,.dxf"
                      ref={drawingVersionUploadRef}
                    >
                      <Button icon={<UploadOutlined />} className="w-full mb-2">
                        Select New Drawing Version
                      </Button>
                    </Upload>
                    <Button 
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      className="w-full mt-2"
                      disabled={!drawingVersionFile || !newDrawingVersion}
                      onClick={async () => {
                        if (drawingVersionFile && newDrawingVersion && documents?.engineering_drawing_document?.id) {
                          try {
                            message.loading({ 
                              content: 'Uploading new Engineering Drawing version...', 
                              key: 'drawingUpload',
                              duration: 0 
                            });
                            console.log('Uploading new Drawing version with ID:', documents.engineering_drawing_document.id);
                            
                            // Create FormData for version upload
                            const formData = new FormData();
                            const fileObj = drawingVersionFile.originFileObj || drawingVersionFile;
                            formData.append('file', fileObj);
                            formData.append('version_number', newDrawingVersion);
                            
                            // Use uploadDocumentVersion instead of uploadNewVersion
                            await uploadDocumentVersion(
                              documents.engineering_drawing_document.id,
                              formData
                            );
                            
                            message.success({ 
                              content: `Engineering Drawing version ${newDrawingVersion} uploaded successfully`, 
                              key: 'drawingUpload',
                              duration: 5
                            });
                            // Reset form fields after successful upload
                            setDrawingVersionFile(null);
                            setNewDrawingVersion('');
                            setEnableDrawingVersionUpload(false);
                            
                            // Refresh documents for this part number
                            const partNumber = form.getFieldValue('part_number');
                            if (partNumber) {
                              await fetchDocumentsByPartNumber(partNumber);
                            }
                          } catch (error) {
                            console.error('Error uploading Drawing version:', error);
                            message.error({ 
                              content: `Failed to upload new version: ${error.message}`, 
                              key: 'drawingUpload',
                              duration: 6
                            });
                          }
                        } else {
                          message.warning('Please provide both a new version number and a file');
                        }
                      }}
                    >
                      Upload New Version
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    className="w-full mt-2"
                    disabled
                  >
                    Upload New Version
                  </Button>
                )}
                
                {!enableDrawingVersionUpload && (
                  <Alert
                    message="Document Already Exists"
                    description="This part number already has an Engineering Drawing document. Toggle 'New Version' switch to upload a new version."
                    type="info"
                    showIcon
                    className="mt-3"
                  />
                )}
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
                  ref={drawingUploadRef}
                  fileList={drawingFile ? [{ uid: '-1', name: drawingFile.name, originFileObj: drawingFile }] : []}
                >
                  <Button icon={<UploadOutlined />} className="w-full">
                    Select Drawing File
                  </Button>
                </Upload>
                {/* Debug information */}
                <div className="mt-2 text-xs text-gray-500">
                  File selected: {drawingFile ? `Yes (${drawingFile.name})` : 'No'}
                </div>
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

  const validateAndPrepareFile = (file) => {
    console.log('Validating file:', file);
    
    // Get the file object (either from Upload component or direct file)
    const fileObj = file.originFileObj || file;
    
    // Get file extension
    const fileName = fileObj.name;
    const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    
    console.log('File details:', {
      name: fileName,
      type: fileObj.type,
      extension: fileExtension,
      size: fileObj.size
    });
    
    // Validate file type and size
    if (fileObj.size > 15 * 1024 * 1024) {
      message.error('File size should not exceed 15MB');
      return null;
    }
    
    // Return processed file
    return {
      file: fileObj,
      fileName,
      fileType: fileObj.type,
      fileExtension
    };
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
              {isManualCreate ? 'Create New Order' : 'Upload OARC Document '}
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