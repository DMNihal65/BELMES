import React, { useState, useEffect } from 'react';
import { Tabs, Card, List, Empty, Button, Tag, Table, Spin, Alert, message, Modal, Form, Input, Select, DatePicker } from 'antd';
import { FileText, Download, Eye, FileArchive, FileImage, Database, AlertCircle, Info, Package } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import usePlanningStore from '../../../store/planning-store';
import useInventoryStore from '../../../store/inventory-store';

const { TabPane } = Tabs;

// API endpoints for document downloads
const API_BASE_URL = "http://172.19.224.1:8002";
const MPP_API_BASE_URL = "http://172.19.224.1:8002";

const DocumentsCard = () => {
  const { jobDocuments, selectedJob, isLoadingJobs, rawMaterials, isLoadingRawMaterials, fetchRawMaterials, fetchJobDocuments, selectJob } = useOperatorStore();
  const { fetchToolsByOrderId, fetchCncProgramDetails } = usePlanningStore();
  const [activeTab, setActiveTab] = useState('all');
  const [downloading, setDownloading] = useState(false);
  const [tools, setTools] = useState([]);
  const [cncPrograms, setCncPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cncLoading, setCncLoading] = useState(false);
  const [cncError, setCncError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [requestForm] = Form.useForm();
  const [selectedToolRow, setSelectedToolRow] = useState(null);

  // Hydrate selectedJob from localStorage on mount if not set
useEffect(() => {
  const hydrateSelectedJob = () => {
    if (!selectedJob) {
      const currentJobData = localStorage.getItem('currentJobData');
      if (currentJobData) {
        const parsedJobData = JSON.parse(currentJobData);
        selectJob(parsedJobData); // Use selectJob to set selectedJob in the store
      } else {
        const userSelectedJob = localStorage.getItem('user-selected-job');
        if (userSelectedJob) {
          const parsedUserSelected = JSON.parse(userSelectedJob);
          const minimalJob = {
            production_order: parsedUserSelected.production_order,
            part_number: parsedUserSelected.part_number
          };
          selectJob(minimalJob); // Set minimal selectedJob and trigger fetches
        }
      }
    }
  };
  hydrateSelectedJob();
}, [selectedJob, selectJob]);

  // Inventory store functions for requests and operations
  const { submitItemRequest, fetchOperationsByPartNumber, operations, fetchItems } = useInventoryStore();

  // Fetch job documents if selectedJob exists and jobDocuments is empty
  useEffect(() => {
    const fetchDocumentsIfEmpty = async () => {
      if (selectedJob && (!jobDocuments || !jobDocuments.all_documents || jobDocuments.all_documents.length === 0)) {
        try {
          const partNumber = selectedJob.part_number;
          if (partNumber) {
            const result = await fetchJobDocuments(partNumber);
            if (!result.success) {
              message.error(`Failed to fetch job documents: ${result.error}`);
            }
          } else {
            message.error('Part number not found in selectedJob');
          }
        } catch (error) {
          console.error('Error fetching job documents:', error);
          message.error('Failed to fetch job documents');
        }
      }
    };

    fetchDocumentsIfEmpty();
  }, [jobDocuments, fetchJobDocuments, selectedJob]);

  // Fetch tools using production_order to get id from localStorage
  useEffect(() => {
    const fetchTools = async () => {
      if (selectedJob?.production_order && activeTab === 'toolsAndPrograms') {
        try {
          setLoading(true);
          const allOrders = localStorage.getItem('all_orders');
          let orderId = null;
          if (allOrders) {
            try {
              const parsedOrders = JSON.parse(allOrders);
              const matchingOrder = parsedOrders.find(
                order => order.production_order === selectedJob.production_order
              );
              orderId = matchingOrder?.id;
            } catch (error) {
              console.error('Error parsing all_orders:', error);
              message.error('Failed to parse orders data');
            }
          }
          if (!orderId) {
            message.error('Could not find order ID for the selected production order');
            return;
          }
          const toolsData = await fetchToolsByOrderId(orderId);
          setTools(toolsData);
        } catch (error) {
          console.error('Error fetching tools:', error);
          message.error('Failed to fetch tools');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTools();
  }, [selectedJob?.production_order, activeTab, fetchToolsByOrderId]);

  // Fetch raw materials
  useEffect(() => {
    if (selectedJob?.production_order && activeTab === 'tools') {
      fetchRawMaterials(selectedJob.production_order);
    }
  }, [selectedJob?.production_order, activeTab, fetchRawMaterials]);

  // Fetch CNC programs when CNC tab is active
  useEffect(() => {
    const fetchCncPrograms = async () => {
      if (selectedJob?.part_number && activeTab === 'cnc') {
        try {
          setCncLoading(true);
          setCncError(null);
          const programs = await fetchCncProgramDetails(selectedJob.part_number);
          setCncPrograms(programs);
        } catch (error) {
          console.error('Error fetching CNC programs:', error);
          setCncError(error.message);
          message.error('Failed to fetch CNC programs');
        } finally {
          setCncLoading(false);
        }
      }
    };
    fetchCncPrograms();
  }, [selectedJob?.part_number, activeTab, fetchCncProgramDetails]);

  // Open Request modal for a tool
  const openRequestModal = async (toolRow) => {
    try {
      setSelectedToolRow(toolRow);
      const userSelectedJob = localStorage.getItem('user-selected-job');
      const parsed = userSelectedJob ? JSON.parse(userSelectedJob) : {};
      const partNumber = parsed?.part_number || selectedJob?.part_number;
      const productionOrder = parsed?.production_order || selectedJob?.production_order;

      if (partNumber) {
        await fetchOperationsByPartNumber(partNumber);
      }

      // Resolve order_id from local storage all_orders using production_order
      let orderId = null;
      const allOrders = localStorage.getItem('all_orders');
      if (allOrders && productionOrder) {
        try {
          const parsedOrders = JSON.parse(allOrders);
          const match = parsedOrders.find(o => o.production_order === productionOrder);
          orderId = match?.id || null;
        } catch (e) {
          console.error('Failed parsing all_orders', e);
        }
      }

      // Resolve inventory item id
      let resolvedItemId = toolRow?.tool_id || toolRow?.inventory_item_id;
      if (!resolvedItemId && toolRow?.bel_partnumber) {
        try {
          const allItems = await fetchItems();
          const normalize = (s) => (s || '').toString().trim();
          const matchItem = (allItems || []).find((item) => {
            const bp1 = normalize(item?.dynamic_data?.['BEL Part Number']);
            const bp2 = normalize(item?.dynamic_data?.['BEL Part Number ']);
            const rowBp = normalize(toolRow.bel_partnumber);
            return bp1 === rowBp || bp2 === rowBp;
          });
          if (matchItem?.id) {
            resolvedItemId = matchItem.id;
          }
        } catch (e) {
          console.error('Failed to resolve inventory item id by BEL part number', e);
        }
      }

      requestForm.setFieldsValue({
        part_number: partNumber || '',
        production_order: productionOrder || '',
        quantity: toolRow?.quantity || 1,
        operation_id: toolRow?.operation_id || undefined,
        order_id: orderId,
        item_id: resolvedItemId,
        purpose: '',
      });

      setIsRequestModalVisible(true);
    } catch (err) {
      console.error('Error opening request modal:', err);
      message.error('Failed to open request modal');
    }
  };

  const handleSubmitRequest = async () => {
    try {
      const values = await requestForm.validateFields();
      const payload = {
        item_id: values.item_id,
        operation_id: values.operation_id,
        order_id: values.order_id,
        purpose: values.purpose,
        quantity: values.quantity,
        remarks: values.remarks,
        expected_return_date: values.expected_return_date,
      };
      await submitItemRequest(payload);
      setIsRequestModalVisible(false);
      requestForm.resetFields();
    } catch (err) {
      // validation or submit error already handled
    }
  };

  // Handle document preview with authentication
  const handlePreview = async (documentId) => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      let authToken = localStorage.getItem('token');
      if (!authToken && authStorage) {
        try {
          const parsedAuthStorage = JSON.parse(authStorage);
          authToken = parsedAuthStorage?.state?.token;
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
      if (!authToken) {
        message.error('Authentication token not found');
        return;
      }
      const previewUrl = `${MPP_API_BASE_URL}/api/v1/document-management/documents/${documentId}/download-latest`;
      const response = await fetch(previewUrl, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to load document preview');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      message.error('Failed to load document preview');
    }
  };

  // Handle document download
  const handleDownload = async (documentId, documentType) => {
    if (downloading) return;
    setDownloading(true);
    try {
      let url;
      if (documentId) {
        url = `${MPP_API_BASE_URL}/api/v1/document-management/documents/${documentId}/download-latest`;
      } else if (documentType && selectedJob?.part_number) {
        url = `${MPP_API_BASE_URL}/api/v1/document-management/documents/download-latest/${selectedJob.part_number}/${documentType}`;
      } else {
        throw new Error('Missing document information');
      }
      const authToken = localStorage.getItem('token') || JSON.parse(localStorage.getItem('auth-storage'))?.state?.token;
      if (!authToken) {
        throw new Error('Authentication token not found');
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        throw new Error('Document not Available');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        filename = `${selectedJob.part_number}_${documentType || 'document'}.pdf`;
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      message.success('Document downloaded successfully');
    } catch (error) {
      console.error('Document Not Available:', error);
      message.error(`Document Not Available: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Get document type icon
  const getDocumentTypeIcon = (doc) => {
    if (!doc) return <FileText />;
    const docType = doc.doc_type_id;
    switch (docType) {
      case 1: return <Database className="text-blue-500" />;
      case 2: return <FileImage className="text-green-500" />;
      case 3: return <FileArchive className="text-purple-500" />;
      default: return <FileText className="text-gray-500" />;
    }
  };

  // Get document type name
  const getDocumentTypeName = (doc) => {
    if (!doc) return 'Unknown';
    const docType = doc.doc_type_id;
    switch (docType) {
      case 1: return 'MPP';
      case 2: return 'Engineering Drawing';
      case 3: return 'CNC Program';
      default: return 'Other';
    }
  };

  // Get file extension
  const getFileExtension = (path) => {
    if (!path) return '';
    const parts = path.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return '';
  };

  // Filter documents by type
  const getFilteredDocuments = () => {
    if (!jobDocuments) return [];
    switch (activeTab) {
      case 'mpp':
        return jobDocuments.mpp_document ? [jobDocuments.mpp_document] : [];
      case 'drawing':
        return jobDocuments.engineering_drawing_document ? [jobDocuments.engineering_drawing_document] : [];
      case 'cnc':
        return cncPrograms || [];
      case 'all':
      default:
        return jobDocuments.all_documents || [];
    }
  };

  const documentsColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      className: 'bg-gray-50',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      className: 'bg-gray-50',
    },
    {
      title: 'Operation',
      dataIndex: 'operation_number',
      key: 'operation_number',
      className: 'bg-gray-50',
      render: (operationNumber, record) => {
        console.log('Rendering operation for document in table:', record);
        let opNum = operationNumber ||
          record.metadata?.operation_number ||
          record.latest_version?.metadata?.operation_number;
        if (!opNum && record.name) {
          const fileNameMatch = record.name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
          if (fileNameMatch) {
            opNum = fileNameMatch[1] || fileNameMatch[2];
          }
        }
        if (!opNum) return 'N/A';
        const operation = selectedJob?.operations?.find(op =>
          op.operation_number.toString() === opNum.toString()
        );
        if (operation) {
          return `${operation.operation_number} - ${operation.operation_description}`;
        } else {
          return `Operation ${opNum}`;
        }
      },
    },
    {
      title: 'Version',
      dataIndex: ['latest_version', 'version_number'],
      key: 'version',
      className: 'bg-gray-50',
      render: (version) => version || 'N/A',
    },
    {
      title: 'Upload Date',
      dataIndex: 'created_at',
      key: 'created_at',
      className: 'bg-gray-50',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      className: 'bg-gray-50',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<Download size={16} />}
            onClick={() => handleDownload(record.id)}
            loading={downloading}
            size="small"
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const rawMaterialsColumns = [
    {
      title: 'Child Part Number',
      dataIndex: 'child_part_number',
      key: 'child_part_number',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Raw Material Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => `${quantity} ${record.unit?.name || ''}`,
    },
    {
      title: 'Status',
      dataIndex: ['status', 'name'],
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Available' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Available From',
      dataIndex: 'available_from',
      key: 'available_from',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const toolsColumns = [
    {
      title: 'Tool Name',
      dataIndex: 'tool_name',
      key: 'tool_name',
      className: 'bg-gray-50',
    },
    {
      title: 'BEL Part Number',
      dataIndex: 'bel_partnumber',
      key: 'bel_partnumber',
      className: 'bg-gray-50',
    },
    {
      title: 'Operation',
      dataIndex: 'operation_id',
      key: 'operation',
      className: 'bg-gray-50',
      render: (operationId) => {
        const operation = selectedJob?.operations?.find(op => op.id === operationId);
        return operation ? `${operation.operation_number} - ${operation.operation_description}` : 'N/A';
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      className: 'bg-gray-50',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      className: 'bg-gray-50',
      align: 'center',
    },
        {
      title: 'Available Quantity',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      className: 'bg-gray-50',
      align: 'center',
    },
     {
      title: 'Tool Status',
      dataIndex: 'item_status',
      key: 'item_status',
      className: 'bg-gray-50',
      align: 'center',
    },
    {
      title: 'Action',
      key: 'action',
      className: 'bg-gray-50',
      align: 'center',
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => openRequestModal(record)}
        disabled={record.available_quantity === 0 || record.available_quantity === null}
        title={record.available_quantity === 0 || record.available_quantity === null ? 'Request disabled: No available quantity' : ''}
        >
        Request</Button>
      ),
    },
  ];

  if (isLoadingJobs) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Spin tip="Loading documents..." />
      </div>
    );
  }

  if (!selectedJob) {
    return (
      <div className="p-8">
        <Empty description="No job selected" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  if (!jobDocuments || (!jobDocuments.all_documents || jobDocuments.all_documents.length === 0)) {
    return (
      <div className="p-8">
        <Alert
          message="No Documents Found"
          description={`No documents available for part number ${selectedJob.part_number}. Fetching documents...`}
          type="info"
          showIcon
          icon={<Info />}
        />
      </div>
    );
  }

  const documents = getFilteredDocuments();

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-1">Documents</div>
        <div className="text-sm text-gray-500">
          {selectedJob.part_number} - {selectedJob.part_description || selectedJob.material_description}
        </div>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="document-tabs"
      >
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileText size={16} /> All Documents
            </span>
          }
          key="all"
        >
          {documents.length === 0 ? (
            <Empty description="No documents found" />
          ) : (
            <List
              dataSource={documents}
              renderItem={(doc) => (
                <List.Item
                  actions={[
                    <Button
                      icon={<Download size={16} />}
                      onClick={() => handleDownload(doc.id)}
                      loading={downloading}
                      key="download"
                    >
                      Download
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={getDocumentTypeIcon(doc)}
                    title={
                      <div className="flex items-center gap-2">
                        <span>{doc.name}</span>
                        <Tag color="blue">{getDocumentTypeName(doc)}</Tag>
                        {doc.latest_version?.file_size && (
                          <Tag color="green">
                            {Math.round(doc.latest_version.file_size / 1024)} KB
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <div>{doc.description}</div>
                        {doc.latest_version && (
                          <div className="text-xs text-gray-500 mt-1">
                            Version: {doc.latest_version.version_number}
                            {doc.latest_version.minio_path && (
                              <span className="ml-2">
                                Format: {getFileExtension(doc.latest_version.minio_path)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Database size={16} /> MPP
            </span>
          }
          key="mpp"
        >
          {!jobDocuments.mpp_document ? (
            <Alert
              message="MPP Not Available"
              description="Manufacturing Process Plan is not available for this part"
              type="warning"
              showIcon
              icon={<AlertCircle />}
              // action={
              //   <Button
              //     size="small"
              //     type="text"
              //     onClick={() => handleDownload(null, 'MPP')}
              //   >
              //     Try Direct Download
              //   </Button>
              // }
            />
          ) : (
            <Card className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold mb-1">Manufacturing Process Plan</div>
                  <div className="text-sm text-gray-500 mb-2">{jobDocuments.mpp_document.name}</div>
                  <div className="text-sm">{jobDocuments.mpp_document.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    icon={<Download size={16} />}
                    onClick={() => handleDownload(jobDocuments.mpp_document.id)}
                    loading={downloading}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileImage size={16} /> Drawing
            </span>
          }
          key="drawing"
        >
          {!jobDocuments.engineering_drawing_document ? (
            <Alert
              message="Engineering Drawing Not Available"
              description="Engineering drawing is not available for this part"
              type="warning"
              showIcon
              icon={<AlertCircle />}
              // action={
              //   <Button
              //     size="small"
              //     type="text"
              //     onClick={() => handleDownload(null, 'ENGINEERING_DRAWING')}
              //   >
              //     Try Direct Download
              //   </Button>
              // }
            />
          ) : (
            <Card className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold mb-1">Engineering Drawing</div>
                  <div className="text-sm text-gray-500 mb-2">{jobDocuments.engineering_drawing_document.name}</div>
                  <div className="text-sm">{jobDocuments.engineering_drawing_document.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    icon={<Download size={16} />}
                    onClick={() => handleDownload(jobDocuments.engineering_drawing_document.id)}
                    loading={downloading}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileArchive size={16} /> CNC Programs
            </span>
          }
          key="cnc"
        >
          {cncLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Spin tip="Loading CNC programs..." />
            </div>
          ) : cncError ? (
            <Alert
              message="Error Loading CNC Programs"
              description={cncError}
              type="error"
              showIcon
              icon={<AlertCircle />}
            />
          ) : !cncPrograms || cncPrograms.length === 0 ? (
            <Empty description="No CNC programs found" />
          ) : (
            <Table
              columns={documentsColumns}
              dataSource={cncPrograms}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: 6,
                showSizeChanger: false,
                position: ['bottomCenter'],
                showTotal: (total) => `Total ${total} programs`,
                onChange: (page) => setCurrentPage(page),
              }}
              className="border border-gray-200 rounded-lg"
            />
          )}
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Package size={16} /> Raw Materials
            </span>
          }
          key="tools"
        >
          {isLoadingRawMaterials ? (
            <div className="p-8 flex items-center justify-center">
              <Spin tip="Loading raw materials..." />
            </div>
          ) : !rawMaterials || rawMaterials.length === 0 ? (
            <Empty description="No raw materials found" />
          ) : (
            <Table
              dataSource={rawMaterials}
              columns={rawMaterialsColumns}
              rowKey="id"
              pagination={false}
              className="raw-materials-table"
            />
          )}
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Package size={16} /> Tools
            </span>
          }
          key="toolsAndPrograms"
        >
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Spin tip="Loading tools..." />
            </div>
          ) : !tools || tools.length === 0 ? (
            <Empty description="No tools found" />
          ) : (
            <Table
              columns={toolsColumns}
              dataSource={tools}
              pagination={{
                current: currentPage,
                pageSize: 6,
                showSizeChanger: false,
                position: ['bottomCenter'],
                showTotal: (total) => `Total ${total} tools`,
                onChange: (page) => setCurrentPage(page),
              }}
              className="border border-gray-200 rounded-lg"
            />
          )}
        </TabPane>
      </Tabs>

      <Modal
        title="Request Item"
        open={isRequestModalVisible}
        onOk={handleSubmitRequest}
        onCancel={() => { setIsRequestModalVisible(false); requestForm.resetFields(); }}
        okText="Submit"
      >
        <Form form={requestForm} layout="vertical">
          <Form.Item name="part_number" label="Part Number">
            <Input disabled />
          </Form.Item>
          <Form.Item name="production_order" label="Production Order">
            <Input disabled />
          </Form.Item>
          <Form.Item name="item_id" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="order_id" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="operation_id" label="Operation" rules={[{ required: true, message: 'Select operation' }]}>
            <Select placeholder="Select operation">
              {(operations || []).map(op => (
                <Select.Option key={op.id} value={op.id}>{`${op.operation_number} - ${op.operation_description}`}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Quantity is required' }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="purpose" label="Purpose" rules={[{ required: true}]}>
            <Input />
          </Form.Item>
          <Form.Item name="expected_return_date" label="Expected Return Date" rules={[{ required: true}]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentsCard;