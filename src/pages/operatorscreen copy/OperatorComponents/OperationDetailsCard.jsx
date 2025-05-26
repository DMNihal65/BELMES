import React, { useState } from 'react';
import { Table, Tag, Button, Empty, Tooltip, Space, Modal, Spin, Tabs } from 'antd';
import { 
  ClipboardList, 
  Zap, 
  Clock, 
  Info, 
  Eye, 
  AlertCircle, 
  FileText, 
  Download 
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
    if (!operationToActivate || !operationToActivate.id) return;
    
    await activateJob(operationToActivate.id);
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
    if (selectedOperation && record.id === selectedOperation.id) {
      if (jobSource === 'inprogress') {
        return <Tag color="success">Active</Tag>;
      }
      return <Tag color="blue">Selected</Tag>;
    }
    
    // If this is the current active operation in an in-progress job
    if (jobSource === 'inprogress' && 
        selectedJob?.operation_id === record.id) {
      return <Tag color="success">Active</Tag>;
    }
    
    return null;
  };

  // Get row class name
  const getRowClassName = (record) => {
    if (selectedOperation && record.id === selectedOperation.id) {
      return 'current-row';
    }
    return '';
  };

  // Define table columns
  const columns = [
    {
      title: 'OP',
      dataIndex: 'operation_number',
      key: 'operation_number',
      width: 70,
      render: (text) => <span className="font-medium">{text}</span>,
      sorter: (a, b) => a.operation_number - b.operation_number,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Description',
      dataIndex: 'operation_description',
      key: 'description',
      render: (text, record) => (
        <div className="flex flex-col">
          <div 
            className="font-medium cursor-pointer hover:text-blue-500" 
            onClick={() => handleViewMpp(record)}
          >
            {text || record.description}
          </div>
          <div className="text-xs text-gray-500">{record.work_center}</div>
        </div>
      )
    },
    {
      title: 'Time',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span>Setup: {record.setup_time} hrs</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-gray-400" />
            <span>Cycle: {record.ideal_cycle_time} hrs</span>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => getOperationStatusTag(record)
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Operation">
            <Button 
              type="text" 
              icon={<Eye size={16} />} 
              onClick={() => selectOperation(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="View MPP">
            <Button 
              type="text"
              icon={<FileText size={16} />}
              onClick={() => handleViewMpp(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Activate Operation">
            <Button 
              type="text"
              icon={<Zap size={16} />}
              onClick={() => showActivateConfirmation(record)}
              disabled={
                jobSource === 'inprogress' && 
                selectedOperation && 
                record.id === selectedOperation.id
              }
              size="small"
            />
          </Tooltip>
        </Space>
      )
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
    
    if (mppData.type === 'instructions') {
      const { instructions } = mppData;
      return (
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Work Instructions for Operation {instructions.operation_number}
              </h3>
            </div>
            <div className="text-sm text-gray-500">
              {selectedJob?.part_number} - {selectedJob?.part_description}
            </div>
          </div>
          
          <div className="border rounded-lg mb-4 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Fixture Number</span>
                <span className="font-medium">{instructions.fixture_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">IPID Number</span>
                <span className="font-medium">{instructions.ipid_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Datum X</span>
                <span className="font-medium">{instructions.datum_x || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Datum Y</span>
                <span className="font-medium">{instructions.datum_y || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Datum Z</span>
                <span className="font-medium">{instructions.datum_z || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {instructions.work_instructions && instructions.work_instructions.sections && (
            <Tabs defaultActiveKey="0" type="card">
              {instructions.work_instructions.sections.map((section, index) => (
                <Tabs.TabPane 
                  tab={section.title || `Section ${index + 1}`} 
                  key={index.toString()}
                >
                  <div className="p-4 work-instructions-content" 
                       dangerouslySetInnerHTML={{ __html: section.instructions }} />
                </Tabs.TabPane>
              ))}
            </Tabs>
          )}
        </div>
      );
    }
    
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p>No MPP data available for this operation</p>
        </div>
      </div>
    );
  };

  if (isLoadingOperations) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin mb-4">
          <ClipboardList className="mx-auto text-blue-500" size={24} />
        </div>
        <div>Loading operations...</div>
      </div>
    );
  }

  if (!availableOperations || availableOperations.length === 0) {
    return (
      <div className="p-8">
        <Empty 
          description="No operations found" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-1">Operations Sequence</div>
        <div className="text-sm text-gray-500">
          {selectedJob ? (
            <>
              {selectedJob.part_number} - {selectedJob.part_description || selectedJob.material_description}
            </>
          ) : (
            'No job selected'
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={availableOperations}
        rowKey="id"
        pagination={false}
        rowClassName={getRowClassName}
        className="operations-table"
        size="middle"
        scroll={{ y: 400 }}
      />

      {/* Activation Confirmation Modal */}
      <Modal
        title="Activate Operation"
        open={activateModalVisible}
        onCancel={() => setActivateModalVisible(false)}
        onOk={handleActivate}
        okText="Activate"
        okButtonProps={{ 
          type: 'primary',
          className: 'bg-blue-500'
        }}
      >
        <div className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-orange-500 mt-1" size={20} />
            <div>
              <p className="font-medium">
                Are you sure you want to activate this operation?
              </p>
              {operationToActivate && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">OP{operationToActivate.operation_number}:</span> {operationToActivate.operation_description}
                  </div>
                  {operationToActivate.work_center && (
                    <div className="text-xs text-gray-500 mt-1">
                      work centre: {operationToActivate.work_center}
                    </div>
                  )}
                </div>
              )}
              {(jobSource === 'inprogress' || jobSource === 'scheduled') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-yellow-600" />
                    <span className="text-yellow-700">This will deactivate the current operation first.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
      
      {/* MPP Viewing Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} />
            <span>
              {currentOperationForMpp ? 
                `MPP for OP${currentOperationForMpp.operation_number}: ${currentOperationForMpp.operation_description}` : 
                'Operation MPP'
              }
            </span>
          </div>
        }
        open={mppModalVisible}
        onCancel={() => setMppModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        {renderMppContent()}
      </Modal>
    </div>
  );
};

export default OperationDetailsCard; 