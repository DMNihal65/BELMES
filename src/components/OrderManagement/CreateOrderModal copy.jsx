import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, DatePicker, Upload, Space, Select, 
  Button, message, Divider, InputNumber, Steps, Row, Col, Alert, Card, Table 
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
  const [oarcData, setOarcData] = useState(null);
  const [operations, setOperations] = useState([]);
  const [orderData, setOrderData] = useState(null);

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
          child_part_number: material["Child Part No"],
          description: material["Description"],
          quantity_per_set: material["Qty Per Set"],
          unit_of_measure: material["UoM"],
          total_quantity: material["Total Qty"]
        })) || []}
        size="small"
        pagination={false}
        scroll={{ y: 200 }}
        columns={[
          {
            title: 'Part Number',
            dataIndex: 'child_part_number',
            key: 'child_part_number',
          },
          {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
          },
          {
            title: 'Quantity',
            dataIndex: 'quantity_per_set',
            key: 'quantity_per_set',
            render: (text, record) => `${text} ${record.unit_of_measure}`,
          },
          {
            title: 'Total Quantity',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
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
    onCancel();
  };

  const handleSubmit = async (values) => {
    try {
      form.setFields([{ name: 'submit', errors: [] }]);
      
      const productionOrder = localStorage.getItem('currentProductionOrder');
      if (!productionOrder) {
        throw new Error('No production order found');
      }

      const storageKey = `oarcData_${productionOrder}`;
      const storedData = JSON.parse(localStorage.getItem(storageKey));
      
      console.log('Retrieved stored data:', storedData);

      if (!storedData) {
        throw new Error('No stored data found');
      }

      const submitData = {
        data: {
          "Project Name": storedData["Project Name"],
          "Sale Order": storedData["Sale Order"],
          "Part No": storedData["Part No"],
          "Part Desc": storedData["Part Desc"],
          "Required Qty": storedData["Required Qty"],
          "Plant": storedData["Plant"],
          "WBS": storedData["WBS"],
          "Rtg Seq No": storedData["Rtg Seq No"],
          "Sequence No": storedData["Sequence No"],
          "Launched Qty": storedData["Launched Qty"],
          "Prod Order No": storedData["Prod Order No"],
          "Operations": storedData["Operations"],
          "Raw Materials": storedData["Raw Materials"],
          "Document Verification": {}
        }
      };

      console.log('Sending order data:', submitData);

      const maxRetries = 3;
      let retryCount = 0;
      let response;

      while (retryCount < maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          response = await fetch('http://172.18.7.85:6797/api/v1/planning/save-to-db', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submitData),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            break;
          }

          throw new Error(`Server responded with ${response.status}`);
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
          }
          console.log(`Attempt ${retryCount} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
      }

      const result = await response.json();
      console.log('Save to DB Response:', result);

      if (result && result.message === "Data saved successfully") {
        localStorage.removeItem(storageKey);
        localStorage.removeItem('currentProductionOrder');
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

  const handleMppFileChange = (info) => {
    const file = info.fileList[info.fileList.length - 1]?.originFileObj;
    if (file) {
      setMppFile(file);
      console.log('MPP file selected:', file);
    }
  };

  const handleDrawingFileChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setDrawingFile(file);
      console.log('Engineering Drawing file selected:', file);
    }
  };

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

  const handleManualSubmit = async (values) => {
    try {
      if (mppFile && !mppDocName.trim()) {
        message.error('Please enter MPP document name');
        return;
      }
      if (drawingFile && !drawingDocName.trim()) {
        message.error('Please enter Engineering Drawing document name');
        return;
      }

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
                      <Input 
                        value={documents.mpp_document.latest_version?.version_number || 'N/A'} 
                        disabled 
                      />
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
                  accept=".pdf,.dwg,.dxf"
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