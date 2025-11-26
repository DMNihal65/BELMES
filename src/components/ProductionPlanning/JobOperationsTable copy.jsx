import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tooltip, Form, Input, 
  Popconfirm, Select, Tag, TimePicker, Modal, message,
  Upload, InputNumber, Card, Tabs
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, FileTextOutlined, 
  SaveOutlined, PlusOutlined, 
  UploadOutlined,
  InboxOutlined,
  LinkOutlined
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

const JobOperationsTable = ({ jobId, onOperationEdit, operations: initialOperations, partNumber, productionOrder, orderNumber }) => {
  const [form] = Form.useForm();
  const [operations, setOperations] = useState(initialOperations || []);
  const [editingKey, setEditingKey] = useState('');
  const [isIpidModalVisible, setIsIpidModalVisible] = useState(false);
  const [ipidForm] = Form.useForm();
  const [selectedOperation, setSelectedOperation] = useState(null);
  const { uploadIpidDocument, isLoading: isUploading, checkIpidStatus } = usePlanningStore();
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(orderNumber);
  const [machines, setMachines] = useState([]);
  const { 
    fetchMachines, 
    fetchMachineDetails, 
    updateMachine, 
    fetchOperationDetails, 
    updateOperation, 
    updateOperationDetails, 
    updateOperationMachine, 
    searchResults
  } = usePlanningStore();
  const [isMachineLinkModalVisible, setIsMachineLinkModalVisible] = useState(false);
  const [selectedOperationForMachine, setSelectedOperationForMachine] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addOperationForm] = Form.useForm();
  const [workCenters, setWorkCenters] = useState([]);
  const [ipidStatusMap, setIpidStatusMap] = useState({});
  const [isIpidStatusLoading, setIsIpidStatusLoading] = useState(true);

  useEffect(() => {
    if (initialOperations && initialOperations.length > 0) {
      // Ensure all operations have work_center correctly set
      const formattedOperations = initialOperations.map(op => ({
        ...op,
        // Ensure work_center is set from work_center_code if not already present
        work_center: op.work_center || op.work_center_code || '',
        // Make sure primary_machine structure is consistent
        primary_machine: op.primary_machine ? {
          id: op.primary_machine.id || op.machine_id,
          name: op.primary_machine.name || op.primary_machine.make || 'Not Assigned'
        } : op.machine_id ? {
          id: op.machine_id, 
          name: 'Machine ' + op.machine_id
        } : null
      }));
      
      // Sort operations by operation number when initially loading
      const sortedOperations = [...formattedOperations].sort((a, b) => {
        const aNum = parseInt(a.operation_number, 10) || 0;
        const bNum = parseInt(b.operation_number, 10) || 0;
        return aNum - bNum;
      });
      setOperations(sortedOperations);
    } else {
      // Try to load from localStorage if initialOperations is empty
      try {
        const storageKey = `operations_${partNumber}_${productionOrder || orderNumber}`;
        const cachedOperations = localStorage.getItem(storageKey);
        if (cachedOperations) {
          const parsedOperations = JSON.parse(cachedOperations);
          
          // Ensure all operations loaded from localStorage have work_center properly set
          const formattedOperations = parsedOperations.map(op => ({
            ...op,
            work_center: op.work_center || op.work_center_code || '',
            primary_machine: op.primary_machine || null
          }));
          
          console.log('Loaded operations from localStorage:', formattedOperations);
          setOperations(formattedOperations);
        } else {
          setOperations([]);
        }
      } catch (error) {
        console.error('Error loading operations from localStorage:', error);
        setOperations([]);
      }
    }
    
    // Refresh operations data from server when component mounts
    if (partNumber && (productionOrder || orderNumber)) {
      refreshOperationsFromServer();
    }
  }, [initialOperations, partNumber, productionOrder, orderNumber]);

  useEffect(() => {
    setSelectedOrderNumber(orderNumber);
  }, [orderNumber]);

  useEffect(() => {
    const fetchWorkCentersList = async () => {
      try {
        const { fetchWorkCenters } = usePlanningStore.getState();
        const centers = await fetchWorkCenters();
        setWorkCenters(centers);
      } catch (error) {
        console.error('Error fetching work centres:', error);
        message.error('Failed to fetch work centres');
      }
    };

    fetchWorkCentersList();
  }, []);

  // Modify the useEffect that checks IPID status to ensure it runs on mount and sets loading state
  useEffect(() => {
    const fetchIpidStatus = async () => {
      if (!operations || operations.length === 0) {
        setIsIpidStatusLoading(false);
        return;
      }
      
      // Make sure we have a production order number to check against
      const currentProductionOrder = productionOrder || orderNumber;
      if (!currentProductionOrder) {
        console.warn('No production order available for IPID status check');
        setIsIpidStatusLoading(false);
        return;
      }

      console.log(`Checking IPID status for ${operations.length} operations in order ${currentProductionOrder}`);
      
      setIsIpidStatusLoading(true);
      const statusMap = {};
      
      try {
        // Process all operations in parallel for faster loading
        const statusPromises = operations.map(async (operation) => {
          try {
            // Always check against the server for the latest status
            const hasIpid = await checkIpidStatus(currentProductionOrder, operation.operation_number);
            console.log(`IPID status for operation ${operation.operation_number}: ${hasIpid}`);
            return { opNumber: operation.operation_number, hasIpid };
          } catch (error) {
            console.error(`Error checking IPID status for operation ${operation.operation_number}:`, error);
            return { opNumber: operation.operation_number, hasIpid: false };
          }
        });
        
        // Wait for all status checks to complete
        const results = await Promise.all(statusPromises);
        
        // Convert results to status map
        results.forEach(result => {
          statusMap[result.opNumber] = result.hasIpid;
        });
      } catch (error) {
        console.error('Error checking IPID statuses:', error);
      } finally {
        // Set the status map in state
        setIpidStatusMap(statusMap);
        console.log('Updated IPID status map:', statusMap);
        setIsIpidStatusLoading(false);
      }
    };

    // Run this effect whenever operations change or when the component mounts
    fetchIpidStatus();
  }, [operations, productionOrder, orderNumber, checkIpidStatus]);

  // Sort the operations by operation_number
  useEffect(() => {
    if (operations && operations.length > 0) {
      // Sort operations by operation number in ascending order
      const sortedOperations = [...operations].sort((a, b) => {
        const aNum = parseInt(a.operation_number, 10) || 0;
        const bNum = parseInt(b.operation_number, 10) || 0;
        return aNum - bNum;
      });
      
      // Only update if the order has changed
      if (JSON.stringify(sortedOperations.map(op => op.id)) !== 
          JSON.stringify(operations.map(op => op.id))) {
        setOperations(sortedOperations);
      }
    }
  }, [operations.length]);

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
        work_center_code: record.work_center,
        machine_id: record.primary_machine?.id || null
      };

      // Call API to update
      const updatedOperation = await updateOperationDetails(partNumber, record.operation_number, updateData);
      
      // Update the local state immediately
      setOperations(prevOperations => {
        const updatedOperations = prevOperations.map(op => {
          if (op.key === key) {
            return {
              ...op,
              operation_description: row.operation_description,
              setup_time: parseFloat(row.setup_time),
              ideal_cycle_time: parseFloat(row.ideal_cycle_time),
              // Preserve other fields
              work_center: op.work_center,
              primary_machine: op.primary_machine,
              key: op.key,
              operation_number: op.operation_number
            };
          }
          return op;
        });
        
        // Store updated operations in localStorage
        try {
          const storageKey = `operations_${partNumber}_${productionOrder || orderNumber}`;
          localStorage.setItem(storageKey, JSON.stringify(updatedOperations));
        } catch (storageError) {
          console.error('Error updating operations in localStorage:', storageError);
        }
        
        return updatedOperations;
      });
      
      // Also refresh from server to ensure latest data
      await refreshOperationsFromServer();
      
      setEditingKey('');
      message.success('Operation updated successfully');
    } catch (errInfo) {
      console.error('Validate Failed:', errInfo);
      message.error('Failed to update operation');
    }
  };

  const handleAddOperation = async (values) => {
    try {
      const { 
        createOperation, 
        searchOrders,
        getLatestOperationNumber
      } = usePlanningStore.getState();
      
      // Get the current order details to get the order_id
      const currentSearchResults = await searchOrders(productionOrder || orderNumber);
      const order = currentSearchResults?.orders?.[0];
      
      if (!order?.id) {
        throw new Error('Order details not found');
      }

      // First determine what the next operation number should be
      // Check existing operations in the table to find the highest number
      let highestOpNumber = 0;
      if (operations && operations.length > 0) {
        const opNumbers = operations.map(op => parseInt(op.operation_number, 10))
                                  .filter(num => !isNaN(num));
        if (opNumbers.length > 0) {
          highestOpNumber = Math.max(...opNumbers);
          console.log(`Highest operation number in current table: ${highestOpNumber}`);
        }
      }

      // Also check the API for the latest operation number
      const latestApiOpNumber = await getLatestOperationNumber(partNumber);
      console.log(`Latest operation number from API: ${latestApiOpNumber}`);

      // Use the higher of the two values
      const baseOpNumber = Math.max(highestOpNumber, latestApiOpNumber);
      let nextOperationNumber = baseOpNumber + 10;
      
      console.log(`Using next operation number: ${nextOperationNumber}`);

      // Create operation data with the order_id from the API response
      const operationData = {
        part_number: partNumber,
        operation_number: nextOperationNumber,
        operation_description: values.operation_description,
        setup_time: parseFloat(values.setup_time),
        ideal_cycle_time: parseFloat(values.ideal_cycle_time),
        work_center_code: values.work_center_code,
        order_id: order.id
      };

      // Try to create the operation - with retry logic for handling conflicts
      let maxRetries = 5;
      let operationCreated = false;
      let newOperation = null;

      while (!operationCreated && maxRetries > 0) {
        try {
          console.log(`Attempting to create operation with number: ${nextOperationNumber}`);
          // Update the operation number for each attempt
          operationData.operation_number = nextOperationNumber;
          
          // Create the operation - this will also assign a default machine
          newOperation = await createOperation(partNumber, operationData);
          operationCreated = true;
          message.success(`Operation ${nextOperationNumber} created successfully`);
        } catch (createError) {
          // If the error indicates a duplicate operation number
          if (createError.message && createError.message.includes('already exists')) {
            console.log(`Operation number ${nextOperationNumber} already exists. Incrementing...`);
            nextOperationNumber += 10;
            maxRetries--;
          } else {
            // If it's a different error, just throw it
            throw createError;
          }
        }
      }

      if (!operationCreated) {
        throw new Error(`Could not find an available operation number after ${5 - maxRetries} attempts`);
      }

      // Add the new operation to the local state immediately with machine info
      const newOperationWithDetails = {
        ...newOperation,
        id: newOperation.id,
        key: String(newOperation.id),
        operation_number: nextOperationNumber,
        operation_description: values.operation_description,
        setup_time: parseFloat(values.setup_time),
        ideal_cycle_time: parseFloat(values.ideal_cycle_time),
        // Ensure work_center is set from work_center_code
        work_center: values.work_center_code,
        work_center_code: values.work_center_code,
        work_center_machines: newOperation.work_center_machines || [],
        primary_machine: {
          id: newOperation.primary_machine?.id,
          name: newOperation.primary_machine?.name || newOperation.work_center_machines?.[0]?.make || ''
        }
      };

      // Update the operations state with the new operation
      setOperations(prevOperations => {
        // Add the new operation to the array
        const updatedOperations = [...prevOperations, newOperationWithDetails];
        
        // Sort the operations by operation_number to ensure they appear in sequence
        const sortedOperations = updatedOperations.sort((a, b) => {
          const aNum = parseInt(a.operation_number, 10) || 0;
          const bNum = parseInt(b.operation_number, 10) || 0;
          return aNum - bNum;
        });

        // Store in localStorage as a backup
        try {
          const storageKey = `operations_${partNumber}_${productionOrder || orderNumber}`;
          localStorage.setItem(storageKey, JSON.stringify(sortedOperations));
          console.log('Operations cached in localStorage');
        } catch (storageError) {
          console.error('Error caching operations:', storageError);
        }
        
        return sortedOperations;
      });

      // Refresh operations data from server to ensure it's in sync
      await refreshOperationsFromServer();

      setIsAddModalVisible(false);
      addOperationForm.resetFields();

    } catch (error) {
      console.error('Error adding operation:', error);
      message.error(error.message || 'Failed to create operation');
    }
  };

  // Add this function to refresh operations data from server
  const refreshOperationsFromServer = async () => {
    try {
      console.log('Refreshing operations data from server');
      const { searchOrders } = usePlanningStore.getState();
      const searchTerm = productionOrder || orderNumber || partNumber;
      
      if (!searchTerm) {
        console.warn('No search term available for refreshing operations');
        return;
      }
      
      const results = await searchOrders(searchTerm);
      
      if (results?.orders && results.orders.length > 0) {
        const serverOperations = results.orders[0].operations || [];
        
        if (serverOperations.length > 0) {
          // Transform server operations to match our format
          const formattedOperations = serverOperations.map(op => ({
            ...op,
            key: op.id.toString(),
            production_order: results.orders[0].production_order,
            // Make sure work_center is set from work_center_code
            work_center: op.work_center_code || op.work_center || '',
            // Also ensure primary_machine is properly structured
            primary_machine: op.primary_machine ? {
              id: op.primary_machine.id || op.machine_id,
              name: op.primary_machine.name || op.primary_machine.make || 'Not Assigned'
            } : op.machine_id ? {
              id: op.machine_id,
              name: 'Machine ' + op.machine_id
            } : null
          }));
          
          console.log('Formatted operations from server:', formattedOperations);
          
          // Sort operations by operation number
          const sortedOperations = formattedOperations.sort((a, b) => {
            const aNum = parseInt(a.operation_number, 10) || 0;
            const bNum = parseInt(b.operation_number, 10) || 0;
            return aNum - bNum;
          });
          
          console.log('Updated operations from server:', sortedOperations);
          setOperations(sortedOperations);
          
          // Also update localStorage
          try {
            const storageKey = `operations_${partNumber}_${productionOrder || orderNumber}`;
            localStorage.setItem(storageKey, JSON.stringify(sortedOperations));
          } catch (storageError) {
            console.error('Error caching refreshed operations:', storageError);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing operations from server:', error);
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

  // Modify the handleIpidUpload function to persistently save status after upload
  const handleIpidUpload = async (values) => {
    try {
      const file = values.file?.fileList[0]?.originFileObj;
      
      if (!file) {
        throw new Error('Please select a file to upload');
      }

      if (!productionOrder && !orderNumber) {
        throw new Error('Production order number is required');
      }

      const currentProductionOrder = productionOrder || orderNumber;

      if (!selectedOperation?.operation_number) {
        throw new Error('Operation number is required');
      }

      const response = await uploadIpidDocument(
        file,
        currentProductionOrder,
        selectedOperation.operation_number,
        values.documentName,
        values.description || '',
        '1',
        JSON.stringify({
          operation_id: selectedOperation.id,
          operation_number: selectedOperation.operation_number
        })
      );

      if (response.success) {
        // Update the status map for this operation
        setIpidStatusMap(prev => {
          const updated = {
            ...prev,
            [selectedOperation.operation_number]: true
          };
          
          // Also store in localStorage to persist through refreshes
          try {
            localStorage.setItem(
              `ipid_status_${currentProductionOrder}`,
              JSON.stringify(updated)
            );
          } catch (err) {
            console.error('Error saving IPID status to localStorage:', err);
          }
          
          return updated;
        });
        
        message.success('IPID document uploaded successfully');
        setIsIpidModalVisible(false);
        ipidForm.resetFields();
        
        // Refresh status to ensure it's up to date
        const updatedStatus = await checkIpidStatus(
          currentProductionOrder,
          selectedOperation.operation_number
        );
        
        console.log(`Updated IPID status after upload for operation ${selectedOperation.operation_number}: ${updatedStatus}`);
      }
    } catch (error) {
      console.error('Error uploading IPID:', error);
      message.error(error.message || 'Failed to upload IPID document');
    }
  };

  // Add an additional useEffect to load IPID status from localStorage as a fallback
  useEffect(() => {
    const loadIpidStatusFromLocalStorage = () => {
      const currentProductionOrder = productionOrder || orderNumber;
      if (!currentProductionOrder) return;
      
      try {
        const savedStatus = localStorage.getItem(`ipid_status_${currentProductionOrder}`);
        if (savedStatus) {
          const parsedStatus = JSON.parse(savedStatus);
          console.log('Loaded IPID status from localStorage:', parsedStatus);
          setIpidStatusMap(prevMap => ({
            ...prevMap,
            ...parsedStatus
          }));
        }
      } catch (error) {
        console.error('Error loading IPID status from localStorage:', error);
      }
    };
    
    loadIpidStatusFromLocalStorage();
  }, [productionOrder, orderNumber]);

  // Function to fetch machines when work centre changes
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

  // Update useEffect to fetch machines when work centre changes
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
        // Get all unique work centres
        const uniqueWorkCenters = [...new Set(operations.map(op => op.work_center))];
        
        let allMachines = [];
        
        // Fetch machines for each work centre
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
              console.error('Error fetching machines for work centre:', workCenter, error);
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

  // Update the handleMachineSave function
  const handleMachineSave = async (machineId) => {
    try {
      if (!selectedOperationForMachine) return;

      const currentProductionOrder = productionOrder || orderNumber;

      // Include all required fields in the request data
      const currentData = {
        operation_description: selectedOperationForMachine.operation_description,
        setup_time: selectedOperationForMachine.setup_time,
        ideal_cycle_time: selectedOperationForMachine.ideal_cycle_time,
        work_center_code: selectedOperationForMachine.work_center,
        machine_id: machineId,
        production_order: currentProductionOrder // Add production order here
      };

      await updateOperationMachine(
        partNumber,
        selectedOperationForMachine.operation_number,
        currentData
      );

      // Update local state immediately with make
      setOperations(prevOperations => {
        const updatedOperations = prevOperations.map(op => {
          if (op.operation_number === selectedOperationForMachine.operation_number) {
            const selectedMachine = selectedOperationForMachine.work_center_machines?.find(m => m.id === machineId);
            return {
              ...op,
              primary_machine: {
                id: machineId,
                name: selectedMachine?.make || ''
              },
              work_center_machines: op.work_center_machines // Preserve work_center_machines
            };
          }
          return op;
        });
        
        // Store operations in localStorage
        try {
          const storageKey = `operations_${partNumber}_${productionOrder || orderNumber}`;
          localStorage.setItem(storageKey, JSON.stringify(updatedOperations));
        } catch (storageError) {
          console.error('Error updating operations in localStorage:', storageError);
        }
        
        return updatedOperations;
      });

      setIsMachineLinkModalVisible(false);
      message.success('Machine updated successfully');

      // Refresh data to ensure sync with server
      await refreshOperationsFromServer();
    } catch (error) {
      console.error('Error updating machine:', error);
      message.error('Failed to update machine');
    }
  };

  // Update the MPP Details button
  const handleMppView = async (record) => {
    try {
      // Get response from handleMppView with hasFile and mppData
      const response = await usePlanningStore.getState().handleMppView(partNumber, record);
      
      if (response.hasFile) {
        // If hasFile is true, the document has been opened in a new tab
        console.log('MPP document opened in new tab');
        return;
      }

      // If no file but we have MPP data, show drawer with existing data
      if (response.mppData) {
        console.log('Opening drawer with existing MPP data');
        onOperationEdit({
          ...record,
          operation_number: record.operation_number,
          partNumber: partNumber,
          productionOrder: orderNumber,
          existingMppData: response.mppData // Pass the existing data
        });
      } else {
        // If no file and no MPP data, show empty drawer for new MPP
        console.log('Opening drawer for new MPP');
        onOperationEdit({
          ...record,
          operation_number: record.operation_number,
          partNumber: partNumber,
          productionOrder: orderNumber
        });
      }
    } catch (error) {
      console.error('Error handling MPP view:', error);
      message.error('Failed to fetch MPP document');
    }
  };

  // Define Columns for the Table
  const columns = [
    {
      title: 'Operation Number',
      dataIndex: 'operation_number',
      width: 150,
      editable: false,
      sorter: (a, b) => {
        // Convert to numbers before comparing to ensure proper numeric sorting
        const aNum = parseInt(a.operation_number, 10) || 0;
        const bNum = parseInt(b.operation_number, 10) || 0;
        return aNum - bNum;
      },
      sortDirections: ['ascend'],
      defaultSortOrder: 'ascend',
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
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
      title: 'work centre',
      dataIndex: 'work_center',
      width: 150,
      editable: false,
      render: (text, record) => {
        // Use work_center if available, otherwise fall back to work_center_code
        const centerValue = text || record.work_center_code || 'Not Assigned';
        return <span>{centerValue}</span>;
      }
    },
    {
      title: 'Machine',
      dataIndex: ['primary_machine', 'name'],
      width: 150,
      editable: false,
      render: (text, record) => {
        const machine = record.primary_machine;
        const workCenterMachines = record.work_center_machines || [];
        
        // Try to get machine name with multiple fallback options
        if (machine && machine.name) {
          return machine.name;
        } else if (machine && machine.id) {
          // Try to find the machine in work_center_machines by id
          const matchedMachine = workCenterMachines.find(m => m.id === machine.id);
          if (matchedMachine) {
            return matchedMachine.make || `Machine ${machine.id}`;
          }
          return `Machine ${machine.id}`;
        } else if (record.machine_id) {
          const matchedMachine = workCenterMachines.find(m => m.id === record.machine_id);
          if (matchedMachine) {
            return matchedMachine.make || `Machine ${record.machine_id}`;
          }
          return `Machine ${record.machine_id}`;
        }
        return 'Not Assigned';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => {
        const editable = isEditing(record);
        const hasIpid = ipidStatusMap[record.operation_number];
        
        return (
          <Space>
            {/* View MPP Details button */}
            <Tooltip title="View MPP Details">
              <Button 
                type="link" 
                icon={<FileTextOutlined />} 
                onClick={() => handleMppView(record)}
              />
            </Tooltip>

            {/* IPID Upload button with loading state */}
            <Tooltip title={isIpidStatusLoading ? 'Checking IPID status...' : 
                              hasIpid ? 'IPID already uploaded' : 'Upload IPID File'}>
              <Button 
                type="link" 
                icon={<UploadOutlined />} 
                onClick={() => {
                  if (isIpidStatusLoading) {
                    message.info('Please wait while we check IPID status');
                    return;
                  }
                  if (hasIpid) {
                    message.info('IPID has already been uploaded for this operation');
                    return;
                  }
                  setSelectedOperation(record);
                  setIsIpidModalVisible(true);
                }}
                style={{ 
                  color: hasIpid ? '#52c41a' : undefined,
                  cursor: hasIpid || isIpidStatusLoading ? 'not-allowed' : 'pointer',
                  opacity: hasIpid || isIpidStatusLoading ? 0.7 : 1,
                }}
                disabled={hasIpid || isIpidStatusLoading}
                loading={isIpidStatusLoading}
              />
            </Tooltip>

            {/* Machine Linking button */}
            <Tooltip title="Change Machine">
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

  // Updated header section with "Operation Sequences" and "Add Operation" button
  const headerSection = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Operation Sequences</h3>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsAddModalVisible(true)}
      >
        Add Operation
      </Button>
    </div>
  );

  return (
    <Form form={form}>
      {headerSection}
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
        sortDirections={['ascend']}
        defaultSortOrder="ascend"
        sortField="operation_number"
      />

      {/* Add Operation Modal */}
      <Modal
        title="Add New Operation"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          addOperationForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={addOperationForm}
          onFinish={handleAddOperation}
          layout="vertical"
        >
          <Form.Item
            name="operation_description"
            label="Operation Description"
            rules={[{ required: true, message: 'Please enter operation description' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="setup_time"
            label="Setup Time [Hrs]"
            rules={[{ required: true, message: 'Please enter setup time' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="ideal_cycle_time"
            label="Ideal Cycle Time [Hrs]"
            rules={[{ required: true, message: 'Please enter ideal cycle time' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="work_center_code"
            label="work centre"
            rules={[{ required: true, message: 'Please select work centre' }]}
          >
            <Select placeholder="Select work centre">
              {workCenters.map(wc => (
                <Select.Option key={wc.id} value={wc.code}>
                  {wc.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => {
              setIsAddModalVisible(false);
              addOperationForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Operation
            </Button>
          </div>
        </Form>
      </Modal>

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
        {/* Check if IPID already exists for the selected operation */}
        {selectedOperation && ipidStatusMap[selectedOperation.operation_number] ? (
          <div className="text-center p-4">
            <div style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }}>
              <UploadOutlined />
            </div>
            <h3>IPID Already Uploaded</h3>
            <p>An IPID document has already been uploaded for this operation.</p>
            <Button type="primary" onClick={() => setIsIpidModalVisible(false)}>
              Close
            </Button>
          </div>
        ) : (
          <Form
            form={ipidForm}
            layout="vertical"
            onFinish={handleIpidUpload}
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
                <Button type="primary" htmlType="submit">
                  Upload
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
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
                  <label className="text-sm text-gray-600">work centre</label>
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
                      <span className="text-xs text-gray-500">
                        Model: {machine.model} | Type: {machine.type}
                      </span>
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
                Save Changess
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </Form>
  );
};

export default JobOperationsTable;