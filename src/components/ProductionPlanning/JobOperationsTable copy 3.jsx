import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tooltip, 
  Form, 
  Input, 
  Popconfirm, 
  Select, 
  Tag, 
  TimePicker, 
  Modal, 
  message, 
  Upload, 
  InputNumber, 
  Card, 
  Tabs, 
  Spin 
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  FileTextOutlined, 
  SaveOutlined, 
  PlusOutlined, 
  UploadOutlined, 
  InboxOutlined, 
  LinkOutlined 
} from '@ant-design/icons';
import EditableCell from './EditableCell';
import dayjs from 'dayjs';
import useIpidStore from '../../store/ipid-store';
import usePlanningStore from '../../store/planning-store';
import { Document, Page, pdfjs } from 'react-pdf';

const { Option } = Select;

// Add styles for editable rows
const styles = {
  editableRow: {
    backgroundColor: '#f5f5f5',
  }
};

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

const JobOperationsTable = ({ jobId, onOperationEdit, operations: initialOperations, partNumber, productionOrder, orderNumber, status = 'Inactive' }) => {
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
  const [ipidVersions, setIpidVersions] = useState([]);
  const [existingIpidDocument, setExistingIpidDocument] = useState(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionNumber, setVersionNumber] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const loadingStartTimeRef = useRef(0);
  const [partDrawings, setPartDrawings] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingDocument, setViewingDocument] = useState(null);

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
    const checkIpidStatusForOperations = async () => {
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
      loadingStartTimeRef.current = Date.now();
      const statusMap = {};
      
      try {
        // Fetch IPID structure using the new endpoint
        const { fetchIpidStructure } = usePlanningStore.getState();
        const ipidStructure = await fetchIpidStructure(currentProductionOrder);
        
        if (!ipidStructure || !ipidStructure.structure || !ipidStructure.structure.subfolders) {
          console.log('No IPID structure found for production order:', currentProductionOrder);
          setIpidStatusMap({});
          setIsIpidStatusLoading(false);
          return;
        }
        
        console.log('IPID structure:', ipidStructure);
        
        // Process all operations
        operations.forEach(operation => {
          if (!operation || !operation.operation_number) {
            console.warn('Found invalid operation:', operation);
            return;
          }
          
          const opNumber = parseInt(operation.operation_number, 10);
          const opFolderKey = `OP${opNumber}`;
          
          // Check if there's an IPID folder and documents for this operation
          const opFolder = ipidStructure.structure.subfolders[opFolderKey];
          
          if (opFolder && opFolder.documents && opFolder.documents.length > 0) {
            statusMap[operation.operation_number] = true;
            console.log(`Found ${opFolder.documents.length} IPID documents for operation ${opNumber}`);
          } else {
            statusMap[operation.operation_number] = false;
          }
        });
        
        console.log('Finished processing operations, status map:', statusMap);
      } catch (error) {
        console.error('Error checking IPID statuses:', error);
      } finally {
        // Always set loading to false and update the status map
        setIpidStatusMap(statusMap);
        setIsIpidStatusLoading(false);
      }
    };

    // Add a timeout to ensure the loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (isIpidStatusLoading) {
        console.warn('IPID status check timed out, resetting loading state');
        setIsIpidStatusLoading(false);
      }
    }, 10000); // 10 second timeout

    // Run the check
    checkIpidStatusForOperations();
    
    // Cleanup timeout
    return () => clearTimeout(loadingTimeout);
  }, [operations, productionOrder, orderNumber]);

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

  const isEditing = (record) => {
    if (status === 'Active') {
      return false; // Prevent editing if job is active
    }
    return record.key === editingKey;
  };

  const edit = (record) => {
    if (status === 'Active') {
      message.warning('Cannot edit operation when job is Active');
      return;
    }
    form.setFieldsValue({
      operation_description: record.operation_description,
      setup_time: record.setup_time,
      ideal_cycle_time: record.ideal_cycle_time,
      work_center: record.work_center,
    });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    if (status === 'Active') {
      message.warning('Cannot save operation when job is Active');
      return;
    }
    try {
      const row = await form.validateFields();
      const record = operations.find(item => item.key === key);
      
      // Prepare update data with more comprehensive formatting
      const updateData = {
        operation_description: row.operation_description,
        setup_time: parseFloat(row.setup_time),
        ideal_cycle_time: parseFloat(row.ideal_cycle_time),
        work_center_code: record.work_center,
        machine_id: record.primary_machine?.id || null,
        // Add production order which is required by the API
        production_order: productionOrder || orderNumber
      };

      console.log('Updating operation with data:', {
        partNumber,
        operationNumber: record.operation_number,
        updateData
      });

      // Make direct fetch call to the endpoint with the correct URL pattern
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Use the correct URL format: /api/v1/planning/operations/{part_number}/{operation_number}
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/planning/operations/${partNumber}/${record.operation_number}?production_order=${updateData.production_order}`, 
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update operation');
      }

      const updatedOperation = await response.json();
      
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
      message.error('Failed to update operation: ' + (errInfo.message || 'Unknown error'));
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
        order_id: order.id,
        production_order: productionOrder || orderNumber // Add production order
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

  // Function to fetch IPID document details and versions
  const fetchIpidDocuments = async (productionOrder) => {
    try {
      // Fetch IPID structure using the new endpoint
      const { fetchIpidStructure } = usePlanningStore.getState();
      const ipidStructure = await fetchIpidStructure(productionOrder);
      
      if (!ipidStructure || !ipidStructure.structure || !ipidStructure.structure.subfolders) {
        console.log('No IPID structure found for production order:', productionOrder);
        return [];
      }
      
      // Extract all documents from all operation folders
      const allDocuments = [];
      Object.values(ipidStructure.structure.subfolders).forEach(folder => {
        if (folder.documents && folder.documents.length > 0) {
          allDocuments.push(...folder.documents);
        }
      });
      
      return allDocuments;
    } catch (error) {
      console.error('Error fetching IPID documents:', error);
      return [];
    }
  };

  // Add this function to fetch IPID document details for a specific operation
  const fetchIpidDocumentForOperation = async (productionOrder, operationNumber) => {
    try {
      // Fetch IPID structure using the new endpoint
      const { fetchIpidStructure } = usePlanningStore.getState();
      const ipidStructure = await fetchIpidStructure(productionOrder);
      
      if (!ipidStructure || !ipidStructure.structure || !ipidStructure.structure.subfolders) {
        console.log('No IPID structure found for production order:', productionOrder);
        return null;
      }
      
      const opFolderKey = `OP${operationNumber}`;
      const opFolder = ipidStructure.structure.subfolders[opFolderKey];
      
      // Check if there are documents for this operation
      if (opFolder && opFolder.documents && opFolder.documents.length > 0) {
        // Sort documents by created_at to get the most recent
        const sortedDocuments = [...opFolder.documents].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        return sortedDocuments[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching IPID document for operation:', error);
      return null;
    }
  };

  // Update the handleOpenIpidModal function
  const handleOpenIpidModal = async (record) => {
    setSelectedOperation(record);
    setIsIpidModalVisible(true);
    setIsLoading(true);
    
    try {
      const currentProductionOrder = productionOrder || orderNumber;
      const operationNumber = parseInt(record.operation_number, 10);
      
      // Fetch the IPID document for this operation
      const ipidDocument = await fetchIpidDocumentForOperation(
        currentProductionOrder, 
        operationNumber
      );
      
      if (ipidDocument) {
        console.log('Found IPID document:', ipidDocument);
        setExistingIpidDocument(ipidDocument);
        
        // Fetch all versions for this document
        const { fetchDocumentVersions } = usePlanningStore.getState();
        const versions = await fetchDocumentVersions(ipidDocument.id);
        setIpidVersions(versions);
        
        // Set next version number
        if (versions && versions.length > 0) {
          const latestVersion = Math.max(...versions.map(v => parseFloat(v.version_number)));
          setVersionNumber((latestVersion + 1).toString());
        } else {
          setVersionNumber('1');
        }
      } else {
        console.log('No IPID document found for this operation');
        setExistingIpidDocument(null);
        setIpidVersions([]);
        setVersionNumber('1');
      }
      
      // Also fetch part drawings
      if (partNumber) {
        const drawings = await fetchPartDrawings(partNumber);
        console.log('Found part drawings:', drawings);
        setPartDrawings(drawings);
      }
    } catch (error) {
      console.error('Error opening IPID modal:', error);
      setExistingIpidDocument(null);
      setIpidVersions([]);
      setPartDrawings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleIpidUpload function
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

      // Upload new IPID document
      setIsLoading(true);
      
      // Create form data for new document
      const formData = new FormData();
      formData.append('file', file);
      formData.append('production_order', currentProductionOrder);
      formData.append('operation_number', selectedOperation.operation_number);
      formData.append('document_name', values.documentName);
      formData.append('description', values.description || '');
      formData.append('version_number', '1');
      formData.append('metadata', JSON.stringify({
        operation_id: selectedOperation.id,
        operation_number: selectedOperation.operation_number
      }));
      
      // Call the function to upload new document
      const { uploadIpidDocument } = usePlanningStore.getState();
      await uploadIpidDocument(formData);
      
      message.success('IPID document uploaded successfully');
      
      // Update the status map for this operation
      setIpidStatusMap(prev => {
        const updated = {
          ...prev,
          [selectedOperation.operation_number]: true
        };
        
        // Store in localStorage to persist through refreshes
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
      
      // Close the modal and reset form
      setIsIpidModalVisible(false);
      ipidForm.resetFields();
      
      // Refresh IPID status
      await fetchIpidDocuments(currentProductionOrder);
    } catch (error) {
      console.error('Error uploading IPID:', error);
      message.error(error.message || 'Failed to upload IPID document');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleDownloadIpidDocument function to use the correct version_id
  const handleDownloadIpidDocument = async (versionId) => {
    await handleDownloadDocument(existingIpidDocument.id, versionId, existingIpidDocument.name);
  };

  // Add function to fetch part drawings
  const fetchPartDrawings = async (partNumber) => {
    try {
      const { fetchEngineeringDrawings } = usePlanningStore.getState();
      const drawings = await fetchEngineeringDrawings(partNumber);
      return drawings?.items || [];
    } catch (error) {
      console.error('Error fetching part drawings:', error);
      return [];
    }
  };

  // Add function to handle drawing download
  const handleDownloadDrawing = async (drawing) => {
    await handleDownloadDocument(drawing.id, null, drawing.name);
  };

  // Update the handleViewDocument function to handle different file types
  const handleViewDocument = async (documentId, versionId, documentName) => {
    try {
      setIsLoading(true);
      setViewingDocument({ id: documentId, versionId, name: documentName });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Construct the URL to fetch the document
      let downloadUrl = `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download`;
      if (versionId) {
        downloadUrl += `?version_id=${versionId}`;
      }

      console.log(`Fetching document for viewing: ${downloadUrl}`);
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/pdf',
          'Content-Type': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      // Get the content type to handle different file types
      const contentType = response.headers.get('content-type');
      console.log(`Document content type: ${contentType}`);
      
      // Create a blob URL to use with PDF viewer
      const blob = await response.blob();
      // Create a new blob with PDF type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      
      // If it's not a PDF, just download it instead of trying to view
      if (!contentType || !contentType.includes('application/pdf')) {
        console.log('Non-PDF document detected, downloading instead of viewing');
        // Get filename from Content-Disposition header if available
        let filename = documentName || 'document.pdf';
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        // Ensure filename has .pdf extension
        if (!filename.toLowerCase().endsWith('.pdf')) {
          filename += '.pdf';
        }
        
        const url = URL.createObjectURL(pdfBlob);
        
        // Create and trigger download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        setIsLoading(false);
        return;
      }
      
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setIsPdfModalVisible(true);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error viewing document:', error);
      message.error('Failed to view document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle PDF document loading
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Updated download function that preserves file type
  const handleDownloadDocument = async (documentId, versionId, fileName) => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Construct the download URL
      let downloadUrl = `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download`;
      if (versionId) {
        downloadUrl += `?version_id=${versionId}`;
      }

      console.log(`Downloading document: ${downloadUrl}`);
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/pdf',
          'Content-Type': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
      }
      
      // Get filename from Content-Disposition header if available
      let filename = fileName || 'document.pdf';
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Ensure filename has .pdf extension
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
      }
      
      // Get the content type
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      const blob = await response.blob();
      // Create a new blob with PDF type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      
      // Create and trigger download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      message.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      message.error('Failed to download document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the renderIpidButton function to be more resilient
  const renderIpidButton = (record) => {
    // Default to false if status is undefined
    const hasIpid = ipidStatusMap[record.operation_number] || false;
    
    // If loading for more than 5 seconds, just show the default state
    const showLoadingState = isIpidStatusLoading && Date.now() - loadingStartTimeRef.current < 5000;
    
    return (
      <Tooltip title={showLoadingState ? 'Checking IPID status...' : 
                       hasIpid ? 'View IPID Document' : 'Upload IPID File'}>
        <Button 
          type="link" 
          icon={hasIpid ? <FileTextOutlined /> : <UploadOutlined />} 
          onClick={() => {
            if (showLoadingState) {
              message.info('Still checking IPID status, please wait a moment');
              return;
            }
            handleOpenIpidModal(record);
          }}
          style={{ 
            color: hasIpid ? '#52c41a' : undefined,
            cursor: showLoadingState ? 'not-allowed' : 'pointer',
            opacity: showLoadingState ? 0.7 : 1,
          }}
          disabled={showLoadingState}
          loading={showLoadingState}
        />
      </Tooltip>
    );
  };

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

      // Make direct fetch call to the endpoint with the correct URL pattern
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Use the correct URL format: /api/v1/planning/operations/{part_number}/{operation_number}
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/planning/operations/${partNumber}/${selectedOperationForMachine.operation_number}?production_order=${currentData.production_order}`, 
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update machine');
      }

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
      message.error('Failed to update machine: ' + (error.message || 'Unknown error'));
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
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="operation_description"
            style={{ margin: 0 }}
            initialValue={text}
            rules={[{ required: true, message: 'Operation description is required' }]}
          >
            <Input />
          </Form.Item>
        ) : (
          text
        );
      }
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
        const isActive = status === 'Active';

        return (
          <Space>
            {/* View MPP Details button */}
            <Tooltip title="View MPP Details">
              <Button 
                type="link" 
                icon={<FileTextOutlined />}
                onClick={() => handleMppView(record)}
                disabled={isActive}
              />
            </Tooltip>

            {/* IPID Upload button with loading state */}
            {!isActive && renderIpidButton(record)}

            {/* Machine Linking button */}
            <Tooltip title={isActive ? 'Cannot change machine when job is Active' : 'Change Machine'}>
              <Button
                type="link"
                icon={<LinkOutlined />}
                onClick={() => handleMachineLinking(record)}
                disabled={isActive}
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
              <Tooltip title={isActive ? 'Cannot edit operation when job is Active' : 'Edit Operation'}>
                <Button 
                  type="link" 
                  icon={<EditOutlined />}
                  onClick={() => edit(record)}
                  disabled={isActive}
                />
              </Tooltip>
            )}
          </Space>
        );
      }
    },
  ];

  // Updated header section with "Operation Sequences" and "Add Operation" button
  const headerSection = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Operation Sequences</h3>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsAddModalVisible(true)}
        disabled={status === 'Active'}
        title={status === 'Active' ? 'Cannot add operations when job is Active' : 'Add new operation'}
      >
        Add Operation
      </Button>
    </div>
  );

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
        rowClassName={(record) => (isEditing(record) ? 'editable-row' : '')}
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

      {/* IPID Document Modal (Updated) */}
      <Modal
        title={existingIpidDocument ? "IPID Document" : "Upload IPID Document"}
        open={isIpidModalVisible}
        onCancel={() => {
          setIsIpidModalVisible(false);
          ipidForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spin tip="Loading..." />
          </div>
        ) : (
          <>
            {/* Show IPID document and versions if exists */}
            {selectedOperation && ipidStatusMap[selectedOperation.operation_number] && existingIpidDocument ? (
              <div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-lg font-medium mb-2">Current IPID Document</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Document Name</label>
                      <div className="font-medium">{existingIpidDocument.name}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Latest Version</label>
                      <div className="font-medium">
                        {existingIpidDocument.latest_version?.version_number || '1'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Description</label>
                      <div className="font-medium">{existingIpidDocument.description}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Created At</label>
                      <div className="font-medium">
                        {new Date(existingIpidDocument.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {ipidVersions.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-600 block mb-2">Document Versions</label>
                      <div className="max-h-40 overflow-y-auto">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left text-sm">Version</th>
                              <th className="p-2 text-left text-sm">Date</th>
                              <th className="p-2 text-left text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...ipidVersions].sort((a, b) => 
                              parseFloat(b.version_number) - parseFloat(a.version_number)
                            ).map(version => (
                              <tr key={version.id} className="border-t border-gray-200">
                                <td className="p-2 text-sm">{version.version_number}</td>
                                <td className="p-2 text-sm">
                                  {new Date(version.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-2 text-sm">
                                  <Space>
                                    <Button 
                                      type="link" 
                                      size="small"
                                      onClick={() => handleViewDocument(existingIpidDocument.id, version.id, existingIpidDocument.name)}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      type="link" 
                                      size="small"
                                      onClick={() => handleDownloadIpidDocument(version.id)}
                                    >
                                      Download
                                    </Button>
                                  </Space>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Information about uploading new versions */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> To upload new versions, please go to Document Management → 
                      Document Types → IPID → {productionOrder || orderNumber} → OP{selectedOperation.operation_number} 
                      and select the IPID document. Click the 3 dots menu and choose "Upload new version".
                    </p>
                  </div>
                </div>
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
                    <Button type="primary" htmlType="submit" loading={isLoading}>
                      Upload
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </>
        )}
      </Modal>

      {/* Add Machine Linking Modal (no changes needed) */}
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
        {/* Machine linking form (no changes needed) */}
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
                Save Changes
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* PDF Viewer Modal (Updated) */}
      <Modal
        title={viewingDocument?.name || "Document Viewer"}
        open={isPdfModalVisible}
        onCancel={() => {
          setIsPdfModalVisible(false);
          setPdfUrl(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsPdfModalVisible(false);
            setPdfUrl(null);
          }}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            onClick={() => {
              if (viewingDocument) {
                handleDownloadDocument(viewingDocument.id, viewingDocument.versionId, viewingDocument.name);
              }
            }}
          >
            Download
          </Button>
        ]}
        width={800}
        bodyStyle={{ 
          height: '70vh', 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {pdfUrl && (
          <>
            <div className="pdf-controls mb-4">
              <Space>
                <Button 
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {numPages || '--'}
                </span>
                <Button 
                  disabled={!numPages || currentPage >= numPages} 
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </Space>
            </div>
            <div className="pdf-container" style={{ width: '100%', textAlign: 'center' }}>
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<Spin tip="Loading document..." />}
                error={
                  <div className="p-4 text-center">
                    <p className="text-red-500">Failed to load PDF document.</p>
                    <p className="text-gray-600 mt-2">The document may not be in PDF format. Please download instead.</p>
                    <Button 
                      type="primary" 
                      onClick={() => {
                        if (viewingDocument) {
                          handleDownloadDocument(viewingDocument.id, viewingDocument.versionId, viewingDocument.name);
                          setIsPdfModalVisible(false);
                        }
                      }}
                      className="mt-3"
                    >
                      Download File
                    </Button>
                  </div>
                }
              >
                <Page 
                  pageNumber={currentPage} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={700}
                />
              </Document>
            </div>
          </>
        )}
      </Modal>
    </Form>
  );
};

export default JobOperationsTable;