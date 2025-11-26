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

function mergeFormWithOarcData(oarcData, formValues) {
  const updated = { ...oarcData };
  if (formValues.production_order) updated["Prod Order No"] = formValues.production_order;
  if (formValues.sale_order) updated["Sale Order"] = formValues.sale_order;
  if (formValues.project_name) updated["Project Name"] = formValues.project_name;
  if (formValues.priority) updated["Priority"] = formValues.priority;
  if (formValues.wbs_element) updated["WBS"] = formValues.wbs_element;
  if (formValues.part_number) updated["Part No"] = formValues.part_number;
  if (formValues.part_description) updated["Part Desc"] = formValues.part_description;
  if (formValues.total_operations) updated["Total Operations"] = formValues.total_operations;
  if (formValues.required_quantity) updated["Required Qty"] = formValues.required_quantity;
  if (formValues.launched_quantity) updated["Launched Qty"] = formValues.launched_quantity;
  if (formValues.plant_id) updated["Plant"] = formValues.plant_id;
  return updated;
}

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
  const [mppDescription, setMppDescription] = useState('');
  const [drawingDocName, setDrawingDocName] = useState('');
  const [drawingVersion, setDrawingVersion] = useState('v1');
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
  const [currentOarcData, setCurrentOarcData] = useState(null);
  const [currentProductionOrder, setCurrentProductionOrder] = useState(null);

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

  // Utility function to clean up any existing localStorage OARC data
  const cleanupLocalStorageOarcData = () => {
    try {
      // Remove any existing OARC data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('oarcData_') || key === 'currentProductionOrder')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleaned up localStorage key: ${key}`);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} localStorage OARC data entries`);
      }
    } catch (error) {
      console.error('Error cleaning up localStorage OARC data:', error);
    }
  };

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

      setCurrentOarcData(completeData);
      setCurrentProductionOrder(result["Prod Order No"]);

      setOrderData(completeData);
      setOperations(result.Operations);
      setRawMaterials(result["Raw Materials"]);

      console.log('Stored complete data in state:', completeData);

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
      
      // Move to the next step after successful upload
      setCurrentStep(1);

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
      <div className="mb-2 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {operations?.length > 0 
            ? "Edit operations data below:" 
            : "No operations found. Click 'Add Operation' to add new operations:"
          }
        </span>
        <Button 
          type="primary" 
          size="small"
          onClick={() => {
            const newOperation = {
              "Oprn No": (operations?.length || 0) + 1,
              "Wc/Plant": "",
              "Operation": "",
              "Setup Time": 0,
              "Per Pc Time": 0
            };
            setOperations([...(operations || []), newOperation]);
          }}
        >
          Add Operation
        </Button>
      </div>
      <Table
        dataSource={operations?.map((op, index) => ({
          ...op, // Keep all original fields
          key: op["Oprn No"] || index,
          operation_number: op["Oprn No"],
          workcenter: op["Wc/Plant"],
          operation_description: op["Operation"],
          setup_time: op["Setup Time"],
          per_piece_time: op["Per Pc Time"]
        })) || []}
        size="small"
        pagination={false}
        scroll={{ y: 250, x: 1000 }}
        locale={{
          emptyText: (
            <div className="py-8 text-center text-gray-500">
              <p>No operations added yet.</p>
              <p className="text-sm">Click "Add Operation" to start adding operations.</p>
            </div>
          )
        }}
        columns={[
          {
            title: 'Operation No',
            dataIndex: 'operation_number',
            key: 'operation_number',
            width: 120,
            render: (text, record, index) => (
              <InputNumber
                value={text}
                min={1}
                style={{ width: '100%' }}
                onChange={(value) => {
                  const updatedOperations = [...operations];
                  updatedOperations[index]["Oprn No"] = value;
                  setOperations(updatedOperations);
                }}
              />
            ),
          },
          {
            title: 'Workcenter',
            dataIndex: 'workcenter',
            key: 'workcenter',
            width: 150,
            render: (text, record, index) => (
              <Input
                value={text}
                placeholder="Enter workcenter"
                onChange={(e) => {
                  const updatedOperations = [...operations];
                  updatedOperations[index]["Wc/Plant"] = e.target.value;
                  setOperations(updatedOperations);
                }}
              />
            ),
          },
          {
            title: 'Operation',
            dataIndex: 'operation_description',
            key: 'operation_description',
            width: 250,
            render: (text, record, index) => (
              <Input
                value={text}
                placeholder="Enter operation description"
                onChange={(e) => {
                  const updatedOperations = [...operations];
                  updatedOperations[index]["Operation"] = e.target.value;
                  setOperations(updatedOperations);
                }}
              />
            ),
          },
          {
            title: 'Setup Time',
            dataIndex: 'setup_time',
            key: 'setup_time',
            width: 120,
            render: (text, record, index) => (
              <InputNumber
                value={text}
                min={0}
                style={{ width: '100%' }}
                onChange={(value) => {
                  const updatedOperations = [...operations];
                  updatedOperations[index]["Setup Time"] = value;
                  setOperations(updatedOperations);
                }}
              />
            ),
          },
          {
            title: 'Per Piece Time',
            dataIndex: 'per_piece_time',
            key: 'per_piece_time',
            width: 150,
            render: (text, record, index) => (
              <InputNumber
                value={text}
                min={0}
                style={{ width: '100%' }}
                onChange={(value) => {
                  const updatedOperations = [...operations];
                  updatedOperations[index]["Per Pc Time"] = value;
                  setOperations(updatedOperations);
                }}
              />
            ),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_, record, index) => (
              <Button
                type="text"
                danger
                size="small"
                onClick={() => {
                  const updatedOperations = operations.filter((_, i) => i !== index);
                  // Reorder operation numbers
                  updatedOperations.forEach((operation, i) => {
                    operation["Oprn No"] = i + 1;
                  });
                  setOperations(updatedOperations);
                }}
              >
                Delete
              </Button>
            ),
          }
        ]}
      />
    </div>
  );

  const renderRawMaterials = () => (
    <div className="mb-4">
      <Divider>Raw Materials</Divider>
      <div className="mb-2 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {rawMaterials?.length > 0 
            ? "Edit raw materials data below:" 
            : "No raw materials found. Click 'Add Material' to add a new material:"
          }
        </span>
        <Button 
          type="primary" 
          size="small"
          disabled={rawMaterials && rawMaterials.length > 0}
          onClick={() => {
            const newMaterial = {
              "Sl.No": (rawMaterials?.length || 0) + 1,
              "Child Part No": "",
              "Description": "",
              "Qty Per Set": 0,
              "UoM": "",
              "Total Qty": 0
            };
            setRawMaterials([...(rawMaterials || []), newMaterial]);
          }}
        >
          Add Material
        </Button>
      </div>
      <Table
        dataSource={rawMaterials?.map((material, index) => ({
          ...material, // Keep all original fields
          key: material["Sl.No"] || index,
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
        locale={{
          emptyText: (
            <div className="py-8 text-center text-gray-500">
              <p>No raw materials added yet.</p>
              <p className="text-sm">Click "Add Material" to add a new material.</p>
            </div>
          )
        }}
        columns={[
          {
            title: 'Sl. No',
            dataIndex: 'serial_number',
            key: 'serial_number',
            width: 80,
            render: (text, record, index) => (
              <InputNumber
                value={text}
                min={1}
                style={{ width: '100%' }}
                onChange={(value) => {
                  const updatedMaterials = [...rawMaterials];
                  updatedMaterials[index]["Sl.No"] = value;
                  setRawMaterials(updatedMaterials);
                }}
              />
            ),
          },
          {
            title: 'Part Number',
            dataIndex: 'child_part_number',
            key: 'child_part_number',
            width: 180,
            render: (text, record, index) => (
              <Input
                value={text}
                placeholder="Enter part number"
                onChange={(e) => {
                  const updatedMaterials = [...rawMaterials];
                  updatedMaterials[index]["Child Part No"] = e.target.value;
                  setRawMaterials(updatedMaterials);
                }}
              />
            ),
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            render: (text, record, index) => (
              <Input
                value={text}
                placeholder="Enter description"
                onChange={(e) => {
                  const updatedMaterials = [...rawMaterials];
                  updatedMaterials[index]["Description"] = e.target.value;
                  setRawMaterials(updatedMaterials);
                }}
              />
            ),
          },
          {
            title: 'Quantity Per Set',
            dataIndex: 'quantity_per_set',
            key: 'quantity_per_set',
            width: 140,
            render: (text, record, index) => (
              <InputNumber
                value={text}
                min={0}
                style={{ width: '100%' }}
                onChange={(value) => {
                  const updatedMaterials = [...rawMaterials];
                  updatedMaterials[index]["Qty Per Set"] = value;
                  // Auto-calculate total quantity based on required quantity
                  const requiredQty = form.getFieldValue('required_quantity') || 0;
                  updatedMaterials[index]["Total Qty"] = value * requiredQty;
                  setRawMaterials(updatedMaterials);
                }}
              />
            ),
          },
          {
            title: 'UoM',
            dataIndex: 'unit_of_measure',
            key: 'unit_of_measure',
            width: 100,
            render: (text, record, index) => (
              <Input
                value={text}
                placeholder="e.g., kg, pcs"
                onChange={(e) => {
                  const updatedMaterials = [...rawMaterials];
                  updatedMaterials[index]["UoM"] = e.target.value;
                  setRawMaterials(updatedMaterials);
                }}
              />
            ),
          },
          {
            title: 'Total Quantity',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
            width: 140,
            render: (text, record, index) => (
              <InputNumber
                value={text}
                min={0}
                style={{ width: '100%' }}
                onChange={(value) => {
                  const updatedMaterials = [...rawMaterials];
                  updatedMaterials[index]["Total Qty"] = value;
                  setRawMaterials(updatedMaterials);
                }}
              />
            ),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_, record, index) => (
              <Button
                type="text"
                danger
                size="small"
                onClick={() => {
                  const updatedMaterials = rawMaterials.filter((_, i) => i !== index);
                  // Reorder serial numbers
                  updatedMaterials.forEach((material, i) => {
                    material["Sl.No"] = i + 1;
                  });
                  setRawMaterials(updatedMaterials);
                }}
              >
                Delete
              </Button>
            ),
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
    setOperations([]);
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
    setCurrentOarcData(null);
    setCurrentProductionOrder(null);
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
        project_name: values.project_name,
        raw_materials: rawMaterials // Include the edited raw materials
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
        raw_materials: rawMaterials, // Include the edited raw materials
        operations: operations, // Include the edited operations
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
      
      // Always get the latest values from the form
      const latestValues = form.getFieldsValue();

      // Handle new order creation (OARC or manual)
      if (!isManualCreate) {
        // Handle OARC upload case - use state instead of localStorage
        if (!currentProductionOrder || !currentOarcData) {
          throw new Error('No production order data found. Please upload OARC document again.');
        }

        // Merge OARC data with form values, mapping form fields to OARC keys
        const mergedData = mergeFormWithOarcData(currentOarcData, latestValues);
        
        // Update raw materials in the merged data with any edits made by the user
        if (rawMaterials && rawMaterials.length > 0) {
          mergedData["Raw Materials"] = rawMaterials;
        }
        
        // Update operations in the merged data with any edits made by the user
        if (operations && operations.length > 0) {
          mergedData["Operations"] = operations;
        }

        // Prepare MPP FormData if file exists
        let mppFormData = null;
        if (mppFile) {
          mppFormData = new FormData();
          mppFormData.append('file', mppFile);
          mppFormData.append('name', mppDocName || `MPP_${latestValues.part_number}`);
          mppFormData.append('doc_type', 'MPP');
          mppFormData.append('part_number', latestValues.part_number);
          mppFormData.append('description', mppDescription || `MPP for ${latestValues.part_number}`);
          mppFormData.append('version', mppVersion || 'v1');
        }

        // Prepare Drawing FormData if file exists
        let drawingFormData = null;
        if (drawingFile) {
          drawingFormData = new FormData();
          drawingFormData.append('file', drawingFile);
          drawingFormData.append('name', drawingDocName || `DRAWING_${latestValues.part_number}`);
          drawingFormData.append('doc_type', 'ENGINEERING_DRAWING');
          drawingFormData.append('part_number', latestValues.part_number);
          drawingFormData.append('description', drawingDescription || `Drawing for ${latestValues.part_number}`);
          drawingFormData.append('version', drawingVersion || 'v1');
        }

        // Save OARC data with the form values (send only mergedData)
        const result = await saveOarcDataToDb(
          mergedData,
          mppFile,
          drawingFile,
          mppDocName || `MPP_${latestValues.part_number}`,
          mppDescription || `MPP for ${latestValues.part_number}`,
          mppVersion || 'v1',
          drawingDocName || `DRAWING_${latestValues.part_number}`,
          drawingDescription || `Drawing for ${latestValues.part_number}`,
          drawingVersion || 'v1'
        );

        // Clear OARC data from state after successful save
        setCurrentOarcData(null);
        setCurrentProductionOrder(null);

        if (result.fileUploadError) {
          message.warning('Order was saved but there was an issue uploading some files: ' + result.fileUploadError);
        } else {
          message.success('Order and documents saved successfully');
        }

        await onCreate(result);
      } else {
        // Handle manual creation case
        try {
          // Prepare FormData for file uploads if files exist
          let mppFormData = null;
          if (mppFile) {
            mppFormData = new FormData();
            mppFormData.append('file', mppFile);
            mppFormData.append('name', mppDocName || `MPP_${latestValues.part_number}`);
            mppFormData.append('doc_type', 'MPP');
            mppFormData.append('part_number', latestValues.part_number);
            mppFormData.append('description', mppDescription || `MPP for ${latestValues.part_number}`);
            mppFormData.append('version', mppVersion || 'v1');
          }

          let drawingFormData = null;
          if (drawingFile) {
            drawingFormData = new FormData();
            drawingFormData.append('file', drawingFile);
            drawingFormData.append('name', drawingDocName || `DRAWING_${latestValues.part_number}`);
            drawingFormData.append('doc_type', 'ENGINEERING_DRAWING');
            drawingFormData.append('part_number', latestValues.part_number);
            drawingFormData.append('description', drawingDescription || `Drawing for ${latestValues.part_number}`);
            drawingFormData.append('version', drawingVersion || 'v1');
          }

          const result = await createManualOrder({
            ...latestValues,
            raw_materials: rawMaterials, // Include the edited raw materials
            operations: operations, // Include the edited operations
            mppFormData,
            drawingFormData
          });

          console.log('Manual order creation result:', result);

          if (result.fileUploadError) {
            message.warning('Order was created but there was an issue uploading some files: ' + result.fileUploadError);
          } else {
            message.success('Order and documents created successfully');
          }
          await onCreate(result);
        } catch (error) {
          console.error('Detailed order creation error:', error);
          throw new Error(`Failed to create order: ${error.message || 'Unknown error'}`);
        }
      }

      // Clear form and close modal
      form.resetFields();
      clearDocuments();
      onCancel();

    } catch (error) {
      console.error('Order submission error:', error);
      message.error(error.message || `Failed to ${initialData ? 'update' : 'create'} order`);
      form.setFields([{
        name: 'submit',
        errors: [error.message || `Failed to ${initialData ? 'update' : 'create'} order`]
      }]);
    }
  };

  useEffect(() => {
    if (initialData) {
      // If we have initial data, we're in edit mode
      form.setFieldsValue({
        // Map the fields from initialData to form fields
        production_order: initialData.production_order,
        sale_order: initialData.sale_order,
        wbs_element: initialData.wbs_element,
        part_number: initialData.part_number,
        part_description: initialData.part_description,
        total_operations: initialData.total_operations,
        required_quantity: initialData.required_quantity,
        launched_quantity: initialData.launched_quantity,
        plant_id: initialData.plant_id,
        // Map any other fields as needed
      });
      
      // Set the order data for reference
      setOrderData(initialData);
      setIsManualCreate(true);
      setCurrentStep(1);
      
      // Fetch documents when part number changes or when in edit mode
      const fetchDocuments = async () => {
        const partNumber = initialData?.part_number || form.getFieldValue('part_number');
        if (partNumber) {
          await fetchDocumentsByPartNumber(partNumber);
        }
      };
      
      fetchDocuments();
    } else {
      // Reset form when opening modal for new order
      form.resetFields();
      setCurrentStep(0);
      setIsManualCreate(false);
      setOrderData(null);
      clearDocuments();
    }
  }, [initialData, form]);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      clearOrderDetails();
      setCurrentStep(0);
      setFileList([]);
      setRawMaterials([]);
      setOperations([]);
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
      // Clean up any existing localStorage OARC data
      cleanupLocalStorageOarcData();
      
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
      
      // Clear OARC data from state
      setCurrentOarcData(null);
      setCurrentProductionOrder(null);
    }
  }, [visible, form]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clear sensitive data from memory when component unmounts
      setCurrentOarcData(null);
      setCurrentProductionOrder(null);
      setOrderData(null);
      setOperations([]);
      setRawMaterials([]);
      setMppFile(null);
      setDrawingFile(null);
      
      // Clean up any remaining localStorage OARC data
      cleanupLocalStorageOarcData();
    };
  }, []);

  // Function to recalculate total quantities when required quantity changes
  const recalculateTotalQuantities = (requiredQty) => {
    if (requiredQty && rawMaterials && rawMaterials.length > 0) {
      const updatedMaterials = rawMaterials.map(material => ({
        ...material,
        "Total Qty": (material["Qty Per Set"] || 0) * requiredQty
      }));
      setRawMaterials(updatedMaterials);
    }
  };

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
            rules={[{ required: true, message: 'Please enter Production Order' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="sale_order"
            label="Sales Order"
            rules={[{ required: true, message: 'Please enter Sales Order' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Divider>Project Information</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="project_name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter Project Name' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please enter Priority' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
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
        name="part_description"
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
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="required_quantity"
            label="Required Quantity"
            rules={[{ required: true, message: 'Please enter Required Quantity' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1} 
              onChange={recalculateTotalQuantities}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="launched_quantity"
            label="Launched Quantity"
            rules={[{ required: true, message: 'Please enter Launched Quantity' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
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
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Col>
      </Row>
      
      {/* Display Operations */}
      <div className="mb-6">
        {renderOperations()}
      </div>
      
      {/* Display Raw Materials */}
      <div className="mb-6">
        {renderRawMaterials()}
      </div>
      
      
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
        total_operations: initialData?.total_operations || 1,
        required_quantity: initialData?.required_quantity || 1,
        launched_quantity: initialData?.launched_quantity || 0,
        production_order: initialData?.production_order || '',
        sale_order: initialData?.sale_order || '',
        wbs_element: initialData?.wbs_element || '',
        part_number: initialData?.part_number || '',
        part_description: initialData?.part_description || '',
        plant_id: initialData?.plant_id || ''
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
              <InputNumber 
                min={1} 
                style={{ width: '100%' }} 
                onChange={recalculateTotalQuantities}
              />
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
          <Col span={12}>
            <Form.Item
              name="raw_material_part_number"
              label="Raw Material Part Number"
              rules={[{ required: true, message: 'Please enter Raw Material Part Number' }]}
            >
              <Input placeholder="Enter raw material part number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="raw_material_description"
              label="Raw Material Description"
              rules={[{ required: true, message: 'Please enter Raw Material Description' }]}
            >
              <Input placeholder="Enter raw material description" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="raw_material_quantity"
              label="Raw Material Quantity"
              rules={[{ required: true, message: 'Please enter Raw Material Quantity' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter quantity" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="raw_material_unit_name"
              label="Unit of Measure"
              rules={[{ required: true, message: 'Please enter Unit of Measure' }]}
            >
              <Input 
                placeholder="Enter unit (e.g., kg, pcs, m)"
                onChange={e => {
                  // Remove all digits from the input
                  const value = e.target.value.replace(/[0-9]/g, '');
                  // Set the value in the form
                  form.setFieldsValue({ raw_material_unit_name: value });
                }}
                // Optionally, prevent pasting numbers
                onPaste={e => {
                  const paste = (e.clipboardData || window.clipboardData).getData('text');
                  if (/[0-9]/.test(paste)) {
                    e.preventDefault();
                  }
                }}
              />
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
                  >
                  </Input>
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

      {currentStep === 1 && !isManualCreate && (
        <div className="bg-white rounded-lg p-6 mt-4">
          {/* <h3 className="text-lg font-semibold mb-4">Order Details</h3> */}
          {renderOrderForm()}
        </div>
      )}
    </Modal>
  );
};

export default CreateOrderModal;