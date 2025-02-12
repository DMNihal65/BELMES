import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tooltip, Form, Input, 
  Popconfirm, Select, Tag, TimePicker, Modal,
  Upload, Drawer
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, FileTextOutlined, 
  SaveOutlined, PlusOutlined, 
  UploadOutlined,
  InboxOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import EditableCell from './EditableCell';
import dayjs from 'dayjs';
import useIpidStore from '../../store/ipid-store';
import usePlanningStore from '../../store/planning-store';
import OperationMPPDetails from './OperationMPPDetails';

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

const JobOperationsTable = ({ jobId, onOperationEdit, operations: initialOperations, partNumber, productionOrder, orderNumber }) => {
  const [form] = Form.useForm();
  const [operations, setOperations] = useState(initialOperations || []);
  const [editingKey, setEditingKey] = useState('');
  const [isIpidModalVisible, setIsIpidModalVisible] = useState(false);
  const [ipidForm] = Form.useForm();
  const [selectedOperation, setSelectedOperation] = useState(null);
  const { uploadIpidDocument, isLoading: isUploading } = useIpidStore();
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(orderNumber);
  const [machines, setMachines] = useState([]);
  const { fetchMachines, fetchMachineDetails, updateMachine, fetchOperationDetails, updateOperation, updateOperationDetails, updateOperationMachine } = usePlanningStore();
  const [isMachineLinkModalVisible, setIsMachineLinkModalVisible] = useState(false);
  const [selectedOperationForMachine, setSelectedOperationForMachine] = useState(null);
  const [isNewMppModalVisible, setIsNewMppModalVisible] = useState(false);
  const [mppForm] = Form.useForm();
  const [mppFormData, setMppFormData] = useState(null);
  const [mppData, setMppData] = useState(null);
  const [showMPPDetails, setShowMPPDetails] = useState(false);

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
      const record = operations.find(item => item.key === key);
      
      // Prepare update data
      const updateData = {
        operation_description: row.operation_description,
        setup_time: parseFloat(row.setup_time),
        ideal_cycle_time: parseFloat(row.ideal_cycle_time),
        work_center_code: record.work_center, // Use existing work center
        machine_id: record.primary_machine?.id || null // Include the current machine_id
      };

      // Call API to update
      await updateOperationDetails(partNumber, record.operation_number, updateData);
      
      // Refresh the table data
      const refreshedData = await usePlanningStore.getState().searchOrders(partNumber);
      if (refreshedData?.orders?.[0]?.operations) {
        // Sort operations by operation number
        const sortedOperations = refreshedData.orders[0].operations.sort(
          (a, b) => a.operation_number - b.operation_number
        );
        setOperations(sortedOperations);
      }
      
      setEditingKey('');
      message.success('Operation updated successfully');
    } catch (errInfo) {
      console.error('Validate Failed:', errInfo);
      message.error('Failed to update operation');
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

  // Add function to handle machine linking
  const handleMachineLinking = (record) => {
    setSelectedOperationForMachine(record);
    setIsMachineLinkModalVisible(true);
  };

  // Add function to save machine selection
  const handleMachineSave = async (newMachineId) => {
    try {
      await updateOperationMachine(
        partNumber,
        selectedOperationForMachine.operation_number,
        {
          operation_description: selectedOperationForMachine.operation_description,
          setup_time: selectedOperationForMachine.setup_time,
          ideal_cycle_time: selectedOperationForMachine.ideal_cycle_time,
          work_center: selectedOperationForMachine.work_center
        },
        newMachineId
      );

      message.success('Machine updated successfully');
      
      // Refresh the table data
      const refreshedData = await usePlanningStore.getState().searchOrders(partNumber);
      if (refreshedData?.orders?.[0]?.operations) {
        const sortedOperations = refreshedData.orders[0].operations.sort(
          (a, b) => a.operation_number - b.operation_number
        );
        setOperations(sortedOperations);
      }

      setIsMachineLinkModalVisible(false);
    } catch (error) {
      message.error('Failed to update machine');
    }
  };

  // Update the handleViewMppDetails function
  const handleViewMppDetails = async (record) => {
    try {
      // First get the production order from the search endpoint
      const searchResponse = await usePlanningStore.getState().searchOrders(partNumber);
      
      if (!searchResponse?.orders?.[0]?.production_order) {
        message.error('Production order not found');
        return;
      }

      const productionOrderNumber = searchResponse.orders[0].production_order;
      console.log('Production Order Number:', productionOrderNumber);

      // Try to fetch MPP documents using production order
      const mppDocs = await usePlanningStore.getState().fetchMppDocuments(productionOrderNumber);
      
      if (mppDocs && Array.isArray(mppDocs) && mppDocs.length > 0 && mppDocs[0].latest_version) {
        // Case 1: MPP exists - show download confirmation
        Modal.confirm({
          title: 'MPP Document Available',
          content: 'An MPP document exists for this operation. Would you like to download it?',
          okText: 'Download',
          cancelText: 'Cancel',
          onOk: async () => {
            const versionId = mppDocs[0].latest_version.id;
            await usePlanningStore.getState().downloadMppDocument(versionId);
          }
        });
      } else {
        // Case 2: Check MPP details by identifier
        const mppDetails = await usePlanningStore.getState().fetchMppByIdentifier(
          partNumber,
          record.operation_number
        );

        if (mppDetails && Array.isArray(mppDetails) && mppDetails.length > 0) {
          // MPP details exist - show in drawer with data
          const existingMpp = mppDetails[0];
          setMppData(existingMpp);

          // Show drawer with existing data
          setSelectedOperation({
            ...record,
            ...existingMpp,
            isExistingMpp: true,
            fixture_number: existingMpp.fixture_number,
            ipid_number: existingMpp.ipid_number,
            datum_x: existingMpp.datum_x,
            datum_y: existingMpp.datum_y,
            datum_z: existingMpp.datum_z,
            work_instructions: existingMpp.work_instructions?.sections || []
          });
          setShowMPPDetails(true);
        } else {
          // No MPP exists - show empty drawer
          setMppData(null);
          setSelectedOperation({
            ...record,
            operation_number: record.operation_number,
            partNumber: partNumber,
            isExistingMpp: false
          });
          setShowMPPDetails(true);
        }
      }
    } catch (error) {
      console.error('Error handling MPP details:', error);
      message.error('Failed to handle MPP document');
    }
  };

  // Update the form submission handler
  const handleSaveChanges = async (values) => {
    try {
      const result = await usePlanningStore.getState().createNewMpp({
        ...values,
        part_number: partNumber,
        work_instructions: {
          sections: values.work_instructions.map((instruction, index) => ({
            ...instruction,
            sequence: index
          }))
        }
      });

      if (result) {
        setMppData(result);
        message.success('MPP created successfully');
        setShowMPPDetails(false);
      }
    } catch (error) {
      console.error('Error creating MPP:', error);
      // message.error('Failed to create MPP');
    }
  };

  // Define Columns for the Table
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      editable: false,
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Operation Number',
      dataIndex: 'operation_number',
      width: 150,
      editable: false,
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
      editable: false,
    },
    {
      title: 'Machine',
      dataIndex: ['primary_machine', 'name'],
      width: 150,
      editable: false,
      render: (text, record) => {
        return record.primary_machine?.name || record.primary_machine?.make || '-';
      }
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      width: 150,
      editable: false,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        const editable = isEditing(record);
        return (
          <Space>
            {/* MPP Details button */}
            <Tooltip title="View MPP Details">
              <Button 
                type="link" 
                icon={<FileTextOutlined />} 
                onClick={() => handleViewMppDetails(record)}
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

            {/* Add Machine-WorkCenter linking button */}
            <Tooltip title="Machine-WorkCenter Linking">
              <Button 
                type="link" 
                icon={<LinkOutlined />}
                onClick={() => handleMachineLinking(record)}
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

      {/* Add Machine Linking Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <LinkOutlined />
            <span>Machine-WorkCenter Linking</span>
          </div>
        }
        open={isMachineLinkModalVisible}
        onCancel={() => setIsMachineLinkModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedOperationForMachine && (
          <Form
            onFinish={(values) => handleMachineSave(values.machineId)}
            initialValues={{
              machineId: selectedOperationForMachine.primary_machine?.id
            }}
            layout="vertical"
          >
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Operation Number</label>
                  <div className="font-medium">{selectedOperationForMachine.operation_number}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Work Center</label>
                  <div className="font-medium">{selectedOperationForMachine.work_center}</div>
                </div>
              </div>
            </div>

            <Form.Item
              name="machineId"
              label="Select Machine"
              rules={[{ required: true, message: 'Please select a machine' }]}
            >
              <Select
                placeholder="Choose a machine"
                className="w-full"
                showSearch
                optionFilterProp="children"
              >
                {selectedOperationForMachine.work_center_machines?.map(machine => (
                  <Select.Option 
                    key={machine.id} 
                    value={machine.id}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{machine.make}</span>
                      <span className="text-xs text-gray-500">Type: {machine.type}</span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setIsMachineLinkModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Add the New MPP Modal */}
      <Modal
        title={mppData ? "View/Edit MPP" : "Create New MPP"}
        open={isNewMppModalVisible}
        onCancel={() => {
          setIsNewMppModalVisible(false);
          if (!mppData) {
            mppForm.resetFields();
          }
        }}
        footer={null}
        width={600}
      >
        <Form
          form={mppForm}
          layout="vertical"
          onFinish={handleSaveChanges}
          initialValues={mppData}
          onValuesChange={(_, allValues) => {
            setMppFormData(allValues);
          }}
        >
          {/* Add hidden field for production order */}
          <Form.Item name="production_order" hidden>
            <Input />
          </Form.Item>
          
          {/* Rest of your form fields */}
          <Form.Item name="part_number" label="Part Number" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="operation_number" label="Operation Number" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="fixture_number" label="Fixture Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ipid_number" label="IPID Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="datum_x" label="Datum X" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="datum_y" label="Datum Y" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="datum_z" label="Datum Z" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.List name="work_instructions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div key={field.key} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Form.Item {...field} name={[field.name, 'title']} rules={[{ required: true }]}>
                      <Input placeholder="Title" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'instructions']} rules={[{ required: true }]}>
                      <Input placeholder="Instructions" />
                    </Form.Item>
                    <Button onClick={() => remove(field.name)} type="link" danger>
                      Delete
                    </Button>
                  </div>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Work Instruction
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {mppData ? "Update MPP" : "Create MPP"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Replace Modal with Drawer */}
      <Drawer
        title={`Operation Details - ${selectedOperation?.operation_number}`}
        width={1200}
        open={showMPPDetails}
        onClose={() => setShowMPPDetails(false)}
        destroyOnClose
      >
        <OperationMPPDetails 
          operation={selectedOperation}
          mppData={mppData}
          onSave={handleSaveChanges}
        />
      </Drawer>
    </Form>
  );
};

export default JobOperationsTable;
