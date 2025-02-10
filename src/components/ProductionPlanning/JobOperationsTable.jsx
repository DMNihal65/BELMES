import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tooltip, Form, Input, 
  Popconfirm, Select, Tag, TimePicker, Modal, message,
  Upload
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, FileTextOutlined, 
  SaveOutlined, PlusOutlined, 
  UploadOutlined,
  InboxOutlined
} from '@ant-design/icons';
import EditableCell from './EditableCell';
import dayjs from 'dayjs';
import useIpidStore from '../../store/ipid-store';
import usePlanningStore from '../../store/planning-store';

const { Option } = Select;

// Mock data for machines
const mockMachines = [
  { id: 'M1', name: 'Machine 1', status: 'available' },
  { id: 'M2', name: 'Machine 2', status: 'maintenance' },
  { id: 'M3', name: 'Machine 3', status: 'available' },
];

// Mock data for tools
const mockTools = [
  { id: 'T1', name: 'Tool 1' },
  { id: 'T2', name: 'Tool 2' },
  { id: 'T3', name: 'Tool 3' },
];

const JobOperationsTable = ({ jobId, onOperationEdit, operations: initialOperations, partNumber, productionOrder ,orderNumber}) => {
  const [form] = Form.useForm();
  const [operations, setOperations] = useState(initialOperations || []);
  const [editingKey, setEditingKey] = useState('');
  const [isIpidModalVisible, setIsIpidModalVisible] = useState(false);
  const [ipidForm] = Form.useForm();
  const [selectedOperation, setSelectedOperation] = useState(null);
  const { uploadIpidDocument, isLoading: isUploading } = useIpidStore();
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(orderNumber);
  const [machines, setMachines] = useState([]);
  const { fetchMachines, fetchMachineDetails, updateMachine, fetchOperationDetails, updateOperation } = usePlanningStore();
  const [mppDocuments, setMppDocuments] = useState(null);

  useEffect(() => {
    setOperations(initialOperations || []);
  }, [initialOperations]);

  useEffect(() => {
    setSelectedOrderNumber(orderNumber);
  }, [orderNumber]);

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      ...record,
      primary_machine: {
        name: record.primary_machine?.name
      }
    });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...operations];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        
        // Find the selected machine from work_center_machines
        const selectedMachine = item.work_center_machines?.find(
          m => m.make === row.primary_machine?.name
        );

        newData.splice(index, 1, {
          ...item,
          ...row,
          primary_machine: selectedMachine ? {
            id: selectedMachine.id,
            name: selectedMachine.make
          } : item.primary_machine
        });
        
        setOperations(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  // Show Modal for Edit or Add Operation
  const showEditModal = (record) => {
    setIsAddOperation(false);
    setCurrentOperation({ ...record });
    setIsModalVisible(true);
  };

  // Show Modal for Add New Operation
  const showAddModal = () => {
    setIsAddOperation(true);
    setCurrentOperation({
      opNo: '',
      description: '',
      machine: '',
      cycleTime: null,
      setupTime: null,
      tools: [],
      fixtures: [],
    });
    setIsModalVisible(true);
  };

  // Handle Modal OK
  const handleOk = () => {
    if (isAddOperation) {
      // Add New Operation
      const newOperation = { 
        ...currentOperation, 
        key: `${operations.length + 1}`,
      };
      setOperations([...operations, newOperation]);
    } else {
      // Edit Existing Operation
      const updatedOperations = operations.map(op =>
        op.key === currentOperation.key ? currentOperation : op
      );
      setOperations(updatedOperations);
    }
    setIsModalVisible(false);
  };

  // Handle Modal Cancel
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Update the form submission
  const handleIpidUpload = async (file) => {
    try {
      const values = await ipidForm.validateFields();
      console.log('Uploading IPID for order number:', selectedOrderNumber);
      
      await uploadIpidDocument(
        file,
        values.documentName,
        values.description,
        selectedOrderNumber, // Use the selected order number
        selectedOperation.operation_number
      );
      
      message.success('IPID document uploaded successfully');
      setIsIpidModalVisible(false);
      ipidForm.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to upload IPID document');
    }
  };

  // Function to fetch machines when work center changes
  const handleWorkCenterChange = async (workCenterCode) => {
    try {
      const machinesList = await fetchMachines(workCenterCode);
      console.log('Fetched machines for', workCenterCode, ':', machinesList);
      setMachines(machinesList);
    } catch (error) {
      console.error('Error fetching machines:', error);
      message.error('Failed to fetch machines');
    }
  };

  // Update useEffect to fetch machines when work center changes
  useEffect(() => {
    const fetchMachinesForWorkCenter = async () => {
      if (editingKey) {
        const record = operations.find(op => op.key === editingKey);
        if (record?.work_center) {
          try {
            const machinesList = await fetchMachines(record.work_center);
            console.log('Fetched machines:', machinesList); // Debug log
            setMachines(machinesList);
          } catch (error) {
            console.error('Error fetching machines:', error);
          }
        }
      }
    };

    fetchMachinesForWorkCenter();
  }, [editingKey, operations]);

  // Update the useEffect for initializing machines
  useEffect(() => {
    const initializeMachines = async () => {
      if (operations && operations.length > 0) {
        // Get all unique work centers
        const uniqueWorkCenters = [...new Set(operations.map(op => op.work_center))];
        
        let allMachines = [];
        
        // Fetch machines for each work center
        for (const workCenter of uniqueWorkCenters) {
          if (workCenter) {
            try {
              const machinesList = await fetchMachines(workCenter);
              console.log('Fetched machines for', workCenter, ':', machinesList);
              allMachines = [...allMachines, ...machinesList];
              
              // Update operations with machine types
              const updatedOperations = operations.map(op => {
                if (op.work_center === workCenter) {
                  // Try to find matching machine by id or name
                  const matchingMachine = machinesList.find(m => 
                    m.id === op.machine?.id || 
                    m.type === op.machine?.name?.split(' ')[0]
                  );
                  return {
                    ...op,
                    machine_type: matchingMachine?.type || op.machine?.name?.split(' ')[0] || '-'
                  };
                }
                return op;
              });
              
              setOperations(updatedOperations);
            } catch (error) {
              console.error('Error fetching machines for work center:', workCenter, error);
            }
          }
        }
        setMachines(allMachines);
      }
    };

    initializeMachines();
  }, [initialOperations]);

  // Add this function to refresh data
  const refreshData = async () => {
    try {
      // Fetch fresh data using the search endpoint
      const response = await usePlanningStore.getState().searchOrders(partNumber);
      if (response?.orders?.[0]?.operations) {
        setOperations(response.orders[0].operations);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Function to fetch MPP documents
  const fetchMppDocuments = async (productionOrder) => {
    try {
      const response = await fetch(`http://172.18.7.85:4723/api/v1/documents/mpp/${productionOrder}`);
      const data = await response.json();
      if (response.ok) {
        setMppDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching MPP documents:', error);
    }
  };

  // Function to handle MPP document viewing
  const handleMppView = async (operation) => {
    if (!mppDocuments || mppDocuments.length === 0) {
      // If no MPP document exists, open manual entry form
      onOperationEdit(operation);
      return;
    }

    // Find the active MPP document
    const activeMppDoc = mppDocuments.find(doc => doc.is_active);
    if (!activeMppDoc) {
      onOperationEdit(operation);
      return;
    }

    try {
      // Fetch and display the PDF
      const response = await fetch(`http://172.18.7.85:4723/api/v1/documents/${activeMppDoc.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Open PDF in new window/tab
        window.open(url, '_blank');
      } else {
        message.error('Failed to load MPP document');
        onOperationEdit(operation);
      }
    } catch (error) {
      console.error('Error downloading MPP document:', error);
      message.error('Failed to load MPP document');
      onOperationEdit(operation);
    }
  };

  // Fetch MPP documents when production order changes
  useEffect(() => {
    if (orderNumber) {
      fetchMppDocuments(orderNumber);
    }
  }, [orderNumber]);

  // Define Columns for the Table
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      editable: false,
    },
    {
      title: 'Operation Number',
      dataIndex: 'operation_number',
      width: 150,
      editable: true,
    },
    {
      title: 'Operation Description',
      dataIndex: 'operation_description',
      width: 200,
      editable: true,
    },
    {
      title: 'Setup Time [Hrs]',
      dataIndex: 'setup_time',
      width: 150,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="setup_time"
            style={{ margin: 0 }}
            initialValue={text}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
        ) : (
          text
        );
      }
    },
    {
      title: 'Ideal Cycle Time [Hrs]',
      dataIndex: 'ideal_cycle_time',
      width: 150,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="ideal_cycle_time"
            style={{ margin: 0 }}
            initialValue={text}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
        ) : (
          text
        );
      }
    },
    {
      title: 'Work Center',
      dataIndex: 'work_center',
      width: 150,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="work_center"
            style={{ margin: 0 }}
            initialValue={text}
          >
            <Select 
              onChange={(value) => handleWorkCenterChange(value)}
              placeholder="Select work center"
            >
              <Option value="CNCM">CNCM</Option>
              <Option value="MMC1">MMC1</Option>
              <Option value="MMC2">MMC2</Option>
            </Select>
          </Form.Item>
        ) : (
          text || '-'
        );
      }
    },
    {
      title: 'Machine',
      dataIndex: ['primary_machine', 'name'],
      width: 150,
      editable: false,
      render: (text, record) => {
        const editable = isEditing(record);
        if (editable) {
          const workCenterMachines = record.work_center_machines || [];
          
          return (
            <Form.Item
              name={['primary_machine', 'name']}
              style={{ margin: 0 }}
            >
              <Select 
                open={true}
                style={{ 
                  width: '100%',
                  position: 'relative'
                }}
                popupClassName="machine-select-dropdown"
                dropdownStyle={{ 
                  zIndex: 9999,
                  minWidth: '200px',
                  padding: '8px 0'
                }}
                placeholder="Select machine"
                defaultActiveFirstOption={true}
                defaultValue={ record.primary_machine?.make}
                optionLabelProp="label"
                optionFilterProp="children"
                showSearch
                onChange={async (value, option) => {
                  try {
                    // Prepare the update data
                    const updateData = {
                      operation_number: parseInt(record.operation_number),
                      operation_description: record.operation_description || "",
                      setup_time: parseFloat(record.setup_time) || 0,
                      ideal_cycle_time: parseFloat(record.ideal_cycle_time) || 0,
                      work_center: record.work_center || "", // This will be used as work_center_code
                      primary_machine: {
                        id: parseInt(option.key), // This will be used as machine_id
                        name: value
                      }
                    };

                    console.log('Updating operation with data:', updateData); // Debug log

                    // Call the API to update the operation
                    const result = await usePlanningStore.getState().updateOperationDetails(
                      partNumber,
                      record.operation_number,
                      updateData
                    );

                    // Update the local state
                    const newData = [...operations];
                    const index = newData.findIndex(item => item.key === record.key);
                    if (index > -1) {
                      newData[index] = {
                        ...newData[index],
                        primary_machine: {
                          id: parseInt(option.key),
                          name: value
                        }
                      };
                      setOperations(newData);
                    }

                    message.success('Machine updated successfully');
                  } catch (error) {
                    console.error('Error updating machine:', error);
                    message.error(error.message || 'Failed to update machine');
                  }
                }}
              >
                {workCenterMachines && workCenterMachines.length > 0 ? (
                  workCenterMachines.map((machine) => (
                    <Select.Option 
                      key={machine.id} 
                      value={machine.make}
                      label={machine.make}
                    >
                      <div style={{ padding: '4px 8px' }}>
                        <div>{machine.make}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Type: {machine.type}
                        </div>
                      </div>
                    </Select.Option>
                  ))
                ) : (
                  <Select.Option value="" disabled>
                    No machines available for this work center
                  </Select.Option>
                )}
              </Select>
            </Form.Item>
          );
        }
        return record.primary_machine?.name || record.primary_machine?.make || '-';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const editable = isEditing(record);
        return (
          <Space>
            {/* MPP Details button */}
            <Tooltip title="View MPP Details">
              <Button 
                type="link" 
                icon={<FileTextOutlined />} 
                onClick={() => handleMppView(record)}
              />
            </Tooltip>

            {/* IPID Upload button */}
            <Tooltip title="Upload IPID File">
              <Button 
                type="link" 
                icon={<UploadOutlined />} 
                onClick={() => {
                  setSelectedOperation(record);
                  setIsIpidModalVisible(true);
                }}
              />
            </Tooltip>

            {/* Edit/Save buttons */}
            {editable ? (
              <Space>
                <Button 
                  type="link" 
                  icon={<SaveOutlined />}
                  onClick={() => save(record.key)}
                />
                <Button 
                  type="link"
                  onClick={cancel}
                >
                  Cancel
                </Button>
              </Space>
            ) : (
              <Tooltip title="Edit Operation">
                <Button 
                  type="link" 
                  icon={<EditOutlined />}
                  onClick={() => edit(record)}
                />
              </Tooltip>
            )}

            {/* Delete button */}
            {!editable && (
              <Popconfirm
                title="Delete this operation?"
                onConfirm={() => {
                  const updatedOperations = operations.filter(op => op.key !== record.key);
                  setOperations(updatedOperations);
                }}
              >
                <Button 
                  type="link" 
                  danger 
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Operations Sequence</h3>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              const newOperation = {
                key: `${operations.length + 1}`,
                id: operations.length + 1,
                operation_number: operations.length * 10 + 10,
                operation_description: '',
                setup_time: 0,
                ideal_cycle_time: 0,
                work_center: '',
              };
              setOperations([...operations, newOperation]);
              edit(newOperation);
            }}
          >
            Add Operation
          </Button>
        </div>

        <Table 
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          columns={mergedColumns} 
          dataSource={operations}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            total: operations.length,
            showSizeChanger: false
          }}
          size="middle"
          rowKey="id"
        />
      </div>

      {/* Add this modal to your JSX */}
      <Modal
        title="Upload IPID Document"
        open={isIpidModalVisible}
        onCancel={() => {
          setIsIpidModalVisible(false);
          ipidForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={ipidForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const file = values.file?.fileList[0]?.originFileObj;
              if (!file) {
                message.error('Please select a file to upload');
                return;
              }
              
              await uploadIpidDocument(
                file,
                values.documentName,
                values.description,
                selectedOrderNumber, // Use the selected order number
                selectedOperation.operation_number
              );
              
              message.success('IPID document uploaded successfully');
              setIsIpidModalVisible(false);
              ipidForm.resetFields();
            } catch (error) {
              message.error(error.message || 'Failed to upload IPID document');
            }
          }}
        >
          <Form.Item
            name="documentName"
            label="Document Name"
            rules={[{ required: true, message: 'Please enter document name' }]}
          >
            <Input placeholder="Enter document name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter document description" />
          </Form.Item>

          <Form.Item
            name="file"
            label="IPID Document"
            rules={[{ required: true, message: 'Please select a file' }]}
          >
            <Upload.Dragger
              name="file"
              maxCount={1}
              beforeUpload={() => false}
              accept=".pdf,.doc,.docx"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for PDF, DOC, DOCX files
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setIsIpidModalVisible(false);
                ipidForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isUploading}>
                Upload
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Form>
  );
};

export default JobOperationsTable;
