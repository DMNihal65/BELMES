import React, { useState } from 'react';
import { Table, Tag, Button, Empty, Tooltip, Space, Modal, Spin, Tabs, Row, Col } from 'antd';
import { 
  ClipboardList, 
  Zap, 
  Clock, 
  Info, 
  Eye, 
  AlertCircle, 
  FileText, 
  Download,
  CheckCircle2
} from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';

const OperationDetailsCard = () => {
  const {
    availableOperations,
    selectedOperation,
    selectedJob,
    selectOperation,
    activateJob,
    isLoadingOperations,
    jobSource,
    fetchOperationMpp,
    downloadDocument,
    isLoadingMppData
  } = useOperatorStore();

  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [operationToActivate, setOperationToActivate] = useState(null);
  
  // MPP Modal state
  const [mppModalVisible, setMppModalVisible] = useState(false);
  const [mppData, setMppData] = useState(null);
  const [currentOperationForMpp, setCurrentOperationForMpp] = useState(null);

  // Show confirmation modal before activating
  const showActivateConfirmation = (operation) => {
    setOperationToActivate(operation);
    setActivateModalVisible(true);
  };

  // Handle activation confirmation
  const handleActivate = async () => {
    if (!operationToActivate) return;
    
    // Use operation_id if available, otherwise use id
    const operationId = operationToActivate.operation_id || operationToActivate.id;
    
    if (!operationId) {
      console.error('No valid operation ID found for activation');
      return;
    }
    
    await activateJob(operationId);
    setActivateModalVisible(false);
  };
  
  // Handle viewing MPP for an operation
  const handleViewMpp = async (operation) => {
    if (!selectedJob || !selectedJob.part_number || !operation) return;
    
    setMppModalVisible(true);
    setCurrentOperationForMpp(operation);
    setMppData(null);
    
    try {
      const result = await fetchOperationMpp(selectedJob.part_number, operation.operation_number);
      if (result.success) {
        setMppData(result.data);
      } else {
        setMppData({ error: result.error });
      }
    } catch (error) {
      console.error('Error fetching MPP data:', error);
      setMppData({ error: 'Failed to load MPP data' });
    }
  };
  
  // Handle document download
  const handleDownloadDocument = (documentId) => {
    if (!documentId) return;
    downloadDocument(documentId);
  };

  // Get operation status tag
  const getOperationStatusTag = (record) => {
    const recordId = record.operation_id || record.id;
    const selectedOpId = selectedOperation ? (selectedOperation.operation_id || selectedOperation.id) : null;
    
    if (selectedOpId && recordId === selectedOpId) {
      if (jobSource === 'inprogress') {
        return <Tag color="success" className="px-2 py-1 text-base font-medium">Active</Tag>;
      }
      return <Tag color="blue" className="px-2 py-1 text-base font-medium">Selected</Tag>;
    }
    
    // If this is the current active operation in an in-progress job
    if (jobSource === 'inprogress' && 
        selectedJob?.operation_id === recordId) {
      return <Tag color="success" className="px-2 py-1 text-base font-medium">Active</Tag>;
    }
    
    // Show can_log status if available
    if (record.can_log === false) {
      return <Tag color="warning" className="px-2 py-1 text-base font-medium">Cannot Log</Tag>;
    }
    
    return null;
  };

  // Get row class name
  const getRowClassName = (record) => {
    const recordId = record.operation_id || record.id;
    const selectedOpId = selectedOperation ? (selectedOperation.operation_id || selectedOperation.id) : null;
    
    if (selectedOpId && recordId === selectedOpId) {
      return 'operation-row bg-sky-50 border-l-4 border-sky-500';
    }
    return 'operation-row';
  };

  // Define table columns
  const columns = [
    {
      title: 'OP',
      dataIndex: 'operation_number',
      key: 'operation_number',
      width: 70,
      render: (text) => <div className="text-lg font-bold">{text}</div>,
      sorter: (a, b) => a.operation_number - b.operation_number,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Description',
      dataIndex: 'operation_description',
      key: 'description',
      render: (text, record) => (
        <div className="flex flex-col">
          <div className="font-medium text-base">
            {text || record.description}
          </div>
          <div className="text-sm text-gray-500 mt-1">{record.work_center}</div>
        </div>
      )
    },
    {
      title: 'Parts',
      key: 'parts',
      width: 150,
      render: (_, record) => (
        <div className="grid grid-cols-1 gap-1 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-green-600">Completed: {record.completed_quantity || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-orange-500">Remaining: {record.remaining_quantity || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Total: {record.required_quantity || 0}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Time',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <div className="grid grid-cols-1 gap-1 text-sm">
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-gray-400" />
            <span>Setup: {record.setup_time} hrs</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={16} className="text-gray-400" />
            <span>Cycle: {record.ideal_cycle_time} hrs</span>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => getOperationStatusTag(record)
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const recordId = record.operation_id || record.id;
        const selectedOpId = selectedOperation ? (selectedOperation.operation_id || selectedOperation.id) : null;
        
        return (
          <Space size="middle" wrap>
            <Button 
              type="primary"
              ghost 
              icon={<Eye size={16} />} 
              onClick={() => selectOperation(record)}
              size="middle"
              className={selectedOpId && recordId === selectedOpId ? "bg-sky-50" : ""}
            >
              View
            </Button>
            <Button
              type="default"
              icon={<FileText size={16} />}
              onClick={() => handleViewMpp(record)}
              size="middle"
              className="border-sky-300 text-sky-600"
            >
              MPP
            </Button>
            <Button 
              type="primary"
              icon={<Zap size={16} />}
              onClick={() => showActivateConfirmation(record)}
              disabled={
                (jobSource === 'inprogress' && 
                selectedOpId && 
                recordId === selectedOpId) ||
                record.can_log === false
              }
              size="middle"
              className={
                jobSource === 'inprogress' && 
                selectedOpId && 
                recordId === selectedOpId 
                  ? "bg-green-500" 
                  : "bg-sky-500"
              }
            >
              Activate
            </Button>
          </Space>
        );
      }
    }
  ];

  // Render MPP content based on data type
  const renderMppContent = () => {
    if (isLoadingMppData) {
      return (
        <div className="p-8 text-center">
          <Spin size="large" />
          <div className="mt-4">Loading MPP data...</div>
        </div>
      );
    }
    
    if (!mppData) {
      return (
        <div className="p-8 text-center">
          <div className="text-gray-400">
            <FileText size={48} className="mx-auto mb-4" />
            <p>MPP data will appear here</p>
          </div>
        </div>
      );
    }
    
    if (mppData.error) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-500">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p>{mppData.error}</p>
          </div>
        </div>
      );
    }
    
    if (mppData.type === 'pdf') {
      return (
        <div className="p-8 text-center">
          <div className="mb-6">
            <FileText size={48} className="mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium">MPP Document Available</h3>
            <p className="text-gray-500">
              {mppData.document.name} (v{mppData.document.latest_version?.version_number})
            </p>
          </div>
          <Button 
            type="primary" 
            size="large"
            icon={<Download size={16} />} 
            onClick={() => handleDownloadDocument(mppData.documentId)}
            className="bg-blue-500"
          >
            Download MPP Document
          </Button>
          <p className="mt-4 text-xs text-gray-400">
            Click the button above to download or view the MPP document
          </p>
        </div>
      );
    }
    
    if (mppData.type === 'instructions' && mppData.instructions) {
      const instructions = mppData.instructions;
      
      return (
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Operation Work Instructions</h3>
          
          {instructions.operation_description && (
            <div className="mb-4">
              <div className="font-medium text-gray-700">Description</div>
              <div className="p-2 bg-gray-50 rounded-md">{instructions.operation_description}</div>
            </div>
          )}
          
          {instructions.steps && instructions.steps.length > 0 && (
            <div className="mb-4">
              <div className="font-medium text-gray-700 mb-2">Steps</div>
              <div className="border rounded-md overflow-hidden">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="bg-sky-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        {index + 1}
                      </div>
                      <div>
                        {step.description}
                        {step.image_url && (
                          <div className="mt-2">
                            <img 
                              src={step.image_url} 
                              alt={`Step ${index + 1}`} 
                              className="max-w-full h-auto rounded-md border border-gray-200"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {instructions.notes && (
            <div className="mb-4">
              <div className="font-medium text-gray-700">Notes</div>
              <div className="p-2 bg-gray-50 rounded-md whitespace-pre-wrap">{instructions.notes}</div>
            </div>
          )}
          
          {instructions.tools && instructions.tools.length > 0 && (
            <div className="mb-4">
              <div className="font-medium text-gray-700 mb-2">Tools Required</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {instructions.tools.map((tool, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-md">
                    {tool.name} {tool.specification && `(${tool.specification})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400">
          <Info size={48} className="mx-auto mb-4" />
          <p>No detailed MPP information available</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-3">
        {isLoadingOperations ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
            <span className="ml-2 text-gray-500">Loading operation sequence...</span>
          </div>
        ) : !availableOperations || availableOperations.length === 0 ? (
          <Empty 
            description={
              <div>
                <p className="text-gray-600">No operations available</p>
                <p className="text-xs text-gray-400">Select a job to view operations</p>
              </div>
            }
          />
        ) : (
          <>
            {/* Current operation summary if one is selected */}
            {selectedOperation && (
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-sky-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {selectedOperation.operation_number}
                    </div>
                    <div className="text-lg font-bold text-sky-900">
                      {selectedOperation.operation_description || selectedOperation.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {jobSource === 'inprogress' ? (
                      <Tag color="success" className="px-3 py-1 text-base">Active</Tag>
                    ) : (
                      <Tag color="processing" className="px-3 py-1 text-base">Selected</Tag>
                    )}
                    {selectedOperation.can_log === false && (
                      <Tooltip title={selectedOperation.validation_reason || "Cannot log production"}>
                        <Tag color="warning" className="px-3 py-1 text-base">Cannot Log</Tag>
                      </Tooltip>
                    )}
                  </div>
                </div>
                
                <Row gutter={16} className="mt-4">
                  <Col span={8}>
                    <div className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm">
                      <div className="text-xs text-gray-500">Parts Information</div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="font-medium text-green-600">{selectedOperation.completed_quantity || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Remaining:</span>
                          <span className="font-medium text-orange-500">{selectedOperation.remaining_quantity || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Required:</span>
                          <span className="font-medium">{selectedOperation.required_quantity || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm">
                      <div className="text-xs text-gray-500">Setup Time</div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-sky-500" />
                        <div className="font-medium">{selectedOperation.setup_time} hrs</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm">
                      <div className="text-xs text-gray-500">Cycle Time</div>
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-sky-500" />
                        <div className="font-medium">{selectedOperation.ideal_cycle_time} hrs</div>
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="flex gap-2 mt-4 justify-end">
                  <Button
                    type="default"
                    icon={<FileText size={16} />}
                    onClick={() => handleViewMpp(selectedOperation)}
                    className="border-sky-300 text-sky-600"
                  >
                    View MPP
                  </Button>
                  <Button 
                    type="primary"
                    icon={<Zap size={16} />}
                    onClick={() => showActivateConfirmation(selectedOperation)}
                    disabled={
                      (jobSource === 'inprogress' && 
                      selectedOperation === selectedOperation) ||
                      selectedOperation.can_log === false
                    }
                    className={
                      jobSource === 'inprogress' ? "bg-green-500" : "bg-sky-500"
                    }
                  >
                    {jobSource === 'inprogress' ? 'Active' : 'Activate'}
                  </Button>
                </div>
              </div>
            )}

            {/* Operations table with highlighted active operation */}
            <div className="mb-2 flex justify-between items-center">
              <div className="text-lg font-semibold text-sky-800">Operation Sequence</div>
              <div className="text-sm text-gray-500">
                {availableOperations.length} operations
              </div>
            </div>
            
            <Table 
              columns={columns}
              dataSource={availableOperations}
              rowClassName={getRowClassName}
              pagination={false}
              rowKey={(record) => record.operation_id || record.id}
              className="operations-table"
              size="large"
              scroll={{ y: 350 }}
              onRow={(record) => ({
                onClick: () => selectOperation(record),
                className: 'cursor-pointer hover:bg-gray-50'
              })}
            />
          </>
        )}
      </div>

      {/* Activate Operation Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Zap className="text-sky-500" size={20} />
            <span>Activate Operation</span>
          </div>
        }
        open={activateModalVisible}
        onOk={handleActivate}
        onCancel={() => setActivateModalVisible(false)}
        okText="Activate"
        cancelText="Cancel"
        okButtonProps={{ 
          className: "bg-sky-500",
          size: "large",
          icon: <CheckCircle2 size={16} />
        }}
        cancelButtonProps={{ size: "large" }}
      >
        <div className="py-4">
          <p>Are you sure you want to activate the following operation?</p>
          
          {operationToActivate && (
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 mt-4">
              <div className="font-bold text-lg">
                Operation {operationToActivate.operation_number}
              </div>
              <div className="text-gray-600">
                {operationToActivate.operation_description || operationToActivate.description}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MPP Document Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="text-sky-500" size={20} />
            <span>
              MPP for Operation {currentOperationForMpp?.operation_number}
            </span>
          </div>
        }
        open={mppModalVisible}
        onCancel={() => setMppModalVisible(false)}
        footer={null}
        width={800}
      >
        {renderMppContent()}
      </Modal>

      {/* Add custom CSS for the operations table */}
      <style jsx global>{`
        .operations-table .ant-table-cell {
          padding: 16px 12px;
        }
        
        .operations-table .operation-row {
          transition: all 0.3s ease;
        }
        
        .operations-table .operation-row.bg-sky-50 {
          background-color: #f0f9ff;
        }
        
        .operations-table .ant-table-row:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </>
  );
};

export default OperationDetailsCard; 