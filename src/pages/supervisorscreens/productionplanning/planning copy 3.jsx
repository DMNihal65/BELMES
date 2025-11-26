import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, Upload, message,
  Typography, Tag, Tooltip, Form, Drawer, Descriptions, Cascader ,
  Badge, Alert, Spin, Progress, Divider, Collapse, DatePicker, Pagination, InputNumber, Grid // Added Grid
} from 'antd';
import {
  UploadOutlined, FileTextOutlined, EditOutlined,
  SaveOutlined, PlusOutlined, ClockCircleOutlined,
  CalendarOutlined, BarChartOutlined,
  ToolOutlined, DownloadOutlined, DeleteOutlined,
  ScheduleOutlined, ReloadOutlined, EyeOutlined,
  AppstoreOutlined, CheckOutlined, RobotOutlined,
  ExperimentOutlined, FileSearchOutlined, InfoCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  Gauge, Settings, Users, Calendar,  CheckCircle, Hourglass, CalendarCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JobOperationsTable from '../../../components/ProductionPlanning/JobOperationsTable';
import OperationMPPDetails from '../../../components/ProductionPlanning/OperationMPPDetails';
import ResourceUtilization from '../../../components/ProductionPlanning/ResourceUtilization';
import { mockJobData, mockPartNumbers, mockMachines } from '../../../data/mockPlanningData';
import usePlanningStore from '../../../store/planning-store';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import belLogo from '../../../assets/belUrl.png';
import { QRCodeSVG } from 'qrcode.react';
import * as QRCodeNode from 'qrcode';
import { create } from 'zustand';
import moment from 'moment';
import useInventoryStore from '../../../store/inventory-store';
import useOrderStore from '../../../store/order-store';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const cellStyle = {
  border: '1px solid #222',
  padding: 8,
  fontSize: 16,
};

// Create a separate component for PDC info
const PdcInfo = ({ productionOrder }) => {
  const [pdcInfo, setPdcInfo] = useState({ pdc: null, status: 'loading', data_source: null });
  const { fetchPdcForCurrentJob, activeParts } = usePlanningStore();

  // This effect will run whenever productionOrder changes
  useEffect(() => {
    if (productionOrder) {
      fetchPdc();
    }
  }, [productionOrder, activeParts]); // Include activeParts to refresh when status changes

  const fetchPdc = async () => {
    try {
      console.log(`Fetching PDC for production order: ${productionOrder}`);
      const data = await fetchPdcForCurrentJob(productionOrder);
      console.log(`PDC result:`, data);
      setPdcInfo(data);
    } catch (error) {
      console.error('Error fetching PDC info:', error);
      setPdcInfo({ pdc: null, status: 'error', data_source: null });
    }
  };

  // Different display based on status
  if (pdcInfo.status === 'loading') {
    return <Spin size="small" />;
  }
  
  // For inactive parts, show "Not yet scheduled" in orange color
  if (pdcInfo.status === 'inactive') {
    return <span className="text-orange-500 font-medium">Not yet scheduled</span>;
  }
  
  // For active parts with PDC data, show the date with blue text
  if (pdcInfo.status === 'active' && pdcInfo.pdc) {
    return (
      <Tooltip title={`Data source: ${pdcInfo.data_source || 'Unknown'}`}>
        <span className="text-blue-600 font-medium">{moment(pdcInfo.pdc).format('MM/DD/YYYY')}</span>
      </Tooltip>
    );
  }
  
  // For active parts without PDC data
  if (pdcInfo.status === 'active' && !pdcInfo.pdc) {
    return <span className="text-blue-600 font-medium">Pending PDC</span>;
  }
  
  // Fallback for any other case
  return <span>-</span>;
};


const Planning = () => {
  const screens = Grid.useBreakpoint(); // Added for responsiveness
  // Job and part selection states
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedPartNumber, setSelectedPartNumber] = useState(null);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState(null);
  const [selectedProjectName, setSelectedProjectName] = useState(null);
  const [selectedPartDescription, setSelectedPartDescription] = useState(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);

  // UI visibility states
  const [showMPPDetails, setShowMPPDetails] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isAddDocumentModalVisible, setIsAddDocumentModalVisible] = useState(false);
  const [isAddToolModalVisible, setIsAddToolModalVisible] = useState(false);
  const [isEditToolModalVisible, setIsEditToolModalVisible] = useState(false);
  const [isAddProgramModalVisible, setIsAddProgramModalVisible] = useState(false);
  const [operations, setOperations] = useState([]);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [isEditProgramModalVisible, setIsEditProgramModalVisible] = useState(false);
  const [isVersionUpdateModalVisible, setIsVersionUpdateModalVisible] = useState(false);
  const [selectedProgramForVersion, setSelectedProgramForVersion] = useState(null);
  const [versionFile, setVersionFile] = useState(null);
  const [versionNumber, setVersionNumber] = useState('');
  const [form] = Form.useForm();

  // Selected item states
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  // Data states
  const [tools, setTools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [pdcData, setPdcData] = useState(null);
  const [engineeringDrawings, setEngineeringDrawings] = useState([]);
  const [programDocuments, setProgramDocuments] = useState([]);
  const [programVersions, setProgramVersions] = useState([]); // Add state for versions
  const [isVersionHistoryModalVisible, setIsVersionHistoryModalVisible] = useState(false); // Add state for modal
  const [isRawMaterialModalVisible, setIsRawMaterialModalVisible] = useState(false);
  const [isGeneratingRawMaterialPdf, setIsGeneratingRawMaterialPdf] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableFields, setEditableFields] = useState({
    partNumber: '',
    location: '',
    rmSize: '',
    heatNo: '',
    rmQty: '',
    rmPartNo: '',
    revision: '',
    rmPartName: '',
    department: '',
    orderNo: '',
    orderQty: ''
  });

  // UI control states
  const [activeTab, setActiveTab] = useState('jobDetails');
  const [currentPage, setCurrentPage] = useState(1);
  const [programCurrentPage, setProgramCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [drawingsLoading, setDrawingsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Form instances
  const [addDocumentForm] = Form.useForm();
  const [addToolForm] = Form.useForm();
  const [editToolForm] = Form.useForm();
  const [addProgramForm] = Form.useForm();
  const [editProgramForm] = Form.useForm();

  const [completionStatus, setCompletionStatus] = useState(null);
  const planningStore = usePlanningStore();

  // Store hooks
  const { 
    fetchAllOrders, 
    searchOrders, 
    partNumbers, 
    searchResults,
    isLoading,
    fetchActiveParts,
    activeParts,
    changePartStatus,
    fetchToolsByOrderId,
    addOrderTool,
    updateOrderTool,
    deleteOrderTool,
    fetchProgramsByOrderId,
    addOrderProgram,
    updateOrderProgram,
    deleteOrderProgram,
    fetchPartProductionPDC,
    fetchEngineeringDrawings,
    downloadDocument,
    uploadCncProgram,
    updateProgramVersion,
    fetchProgramVersions,
    fetchCncProgramDetails,
    fetchOperationsForTool // Add this line
  } = usePlanningStore();

    const [subcategories, setSubcategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const { categories, fetchItems,  fetchCategories, fetchAllSubcategories } = useInventoryStore();
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
        try {
            await fetchCategories();
            await fetchAllSubcategories();
        } catch (error) {
            message.error('Failed to fetch data');
        }
    };
    fetchData();
}, [fetchCategories, fetchAllSubcategories]);

useEffect(() => {
  loadInventoryItems();
  loadSubcategories();
}, []);

const loadInventoryItems = async () => {
  try {
    const items = await fetchItems();
    // console.log('Loaded items:', items); // Debug log
    setInventoryItems(items || []);
  } catch (error) {
    console.error('Error loading inventory items:', error);
    toast.error('Failed to load inventory items');
    setInventoryItems([]);
  }
};

  const loadSubcategories = async () => {
    try {
      const subCats = await fetchAllSubcategories();
      // console.log('Loaded subcategories:', subCats); // Debug log
      setSubcategories(subCats || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      toast.error('Failed to load subcategories');
      setSubcategories([]);
    }
  };



  const handleInventoryItemClick = (itemId) => {
    setSelectedInventoryItem(itemId);
    setActiveTab('history');  // Switch to history tab
    // Get item details for the message
    const item = inventoryItems.find(item => item.id === itemId);
    const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
    const itemName = item ? `${subcategory?.name || 'N/A'} - ${item.item_code}` : itemId;
    message.info(`Showing calibration history for ${itemName}`);
  };

  // Configuration for file upload component - customized for NC program files
  const uploadProps = {
    name: 'file',
    multiple: false,
    // Disable automatic upload - we'll handle the file in our form submit handlers
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok", null);
      }, 0);
    },
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} ready for upload.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file preparation failed.`);
      }
    },
    beforeUpload: (file) => {
      // Validate file types commonly used for CNC programs
      const isValidFileType = file.type === 'application/octet-stream' || 
                             file.type === 'text/plain' ||
                             file.name.endsWith('.nc') ||
                             file.name.endsWith('.prt') ||
                             file.name.endsWith('.mpf') ||
                             file.name.endsWith('.cnc');
      
      const isLessThan20MB = file.size / 1024 / 1024 < 20;
      
      if (!isValidFileType) {
        message.error('Please upload a valid program file (.nc, .prt, .mpf, .cnc)');
      }
      
      // if (!isLessThan20MB) {
      //   message.error('File must be smaller than 20MB!');
      // }
      
      return (isValidFileType && isLessThan20MB) || Upload.LIST_IGNORE;
    },
    showUploadList: true,
  };

  // Add new state for tracking file-operation mappings
  const [fileOperationMappings, setFileOperationMappings] = useState({});

  // Update documentUploadProps
  const documentUploadProps = {
    name: 'file',
    multiple: true,
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok", null);
      }, 0);
    },
    beforeUpload: (file) => {
      // Define allowed CNC program extensions
      const allowedExtensions = [
        '.NC', '.TXT', '.CNC', '.EIA', '.ISO', '.H', '.PGM',
        '.MIN', '.MZK', '.APL', '.ARF', '.SUB', '.DNC', '.MPF', '.SPF'
      ];
      
      // Get the file extension and convert to uppercase
      const extension = '.' + file.name.split('.').pop().toUpperCase();
      
      // Check if the file extension is allowed
      const isValidFileType = allowedExtensions.includes(extension);
      const isLessThan20MB = file.size / 1024 / 1024 < 20;
      
      if (!isValidFileType) {
        message.error(`Please upload a valid CNC program file. Allowed types: ${allowedExtensions.join(', ')}`);
        return Upload.LIST_IGNORE;
      }
      
      if (!isLessThan20MB) {
        message.error('File must be smaller than 20MB!');
        return Upload.LIST_IGNORE;
      }
      
      return true;
    },
    onChange(info) {
      const { status, uid } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} ready for upload.`);
        // Initialize operation mapping for new file
        setFileOperationMappings(prev => ({
          ...prev,
          [uid]: null
        }));
      } else if (status === 'removed') {
        // Remove operation mapping when file is removed
        setFileOperationMappings(prev => {
          const newMappings = { ...prev };
          delete newMappings[uid];
          return newMappings;
        });
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    showUploadList: {
      showRemoveIcon: true,
      showDownloadIcon: false
    },
  };

  // Load saved selection from localStorage on component mount
  useEffect(() => {
    const savedSelection = localStorage.getItem('selectedJobDetails');
    if (savedSelection) {
      const { partNumber, productionOrder, projectName, partDescription } = JSON.parse(savedSelection);
      setSelectedPartNumber(partNumber);
      setSelectedProductionOrder(productionOrder);
      setSelectedProjectName(projectName);
      setSelectedPartDescription(partDescription);
    }
  }, []);

  // Save selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedPartNumber && selectedProductionOrder) {
      localStorage.setItem('selectedJobDetails', JSON.stringify({
        partNumber: selectedPartNumber,
        productionOrder: selectedProductionOrder,
        projectName: selectedProjectName,
        partDescription: selectedPartDescription
      }));
    }
  }, [selectedPartNumber, selectedProductionOrder, selectedProjectName, selectedPartDescription]);

  // Fetch part numbers and active parts on component mount
  React.useEffect(() => {
    fetchAllOrders();
    fetchActiveParts();
    // Clear PDC data when the component mounts
    setPdcData(null);

    // Load saved job and tools data from localStorage
    const savedJob = localStorage.getItem('selectedJob');
    if (savedJob) {
      try {
        const parsedJob = JSON.parse(savedJob);
        setSelectedJob(parsedJob);
        setSelectedOrderNumber(parsedJob?.production_order);
        console.log('Restored job from localStorage:', parsedJob);
        
        // Only fetch PDC data for the restored job if needed
        // We'll handle this in a separate useEffect below
        
        // After restoring the job, check for saved tools that match this job
        const savedTools = localStorage.getItem('jobTools');
        if (savedTools) {
          try {
            const parsedTools = JSON.parse(savedTools);
            // Only use saved tools if they match the restored job
            if (parsedTools.length > 0 && parsedTools[0].productionOrder === parsedJob.production_order) {
              setTools(parsedTools);
              console.log('Restored matching tools from localStorage:', parsedTools);
            } else {
              console.log('Saved tools do not match the restored job - initializing empty tools');
              setTools([]);
            }
          } catch (error) {
            console.error('Error parsing saved tools:', error);
            setTools([]);
          }
        }

        // Also restore saved programs from localStorage
        const savedPrograms = localStorage.getItem('jobPrograms');
        if (savedPrograms) {
          try {
            const parsedPrograms = JSON.parse(savedPrograms);
            // Only use saved programs if they match the restored job
            if (parsedPrograms.length > 0 && parsedPrograms[0].productionOrder === parsedJob.production_order) {
              setPrograms(parsedPrograms);
              console.log('Restored matching programs from localStorage:', parsedPrograms);
            } else {
              console.log('Saved programs do not match the restored job - initializing empty programs');
              setPrograms([]);
            }
          } catch (error) {
            console.error('Error parsing saved programs:', error);
            setPrograms([]);
          }
        }
        
        // Remove this block
        // Restore saved program documents from localStorage
        const savedProgramDocuments = localStorage.getItem('programDocuments');
        if (savedProgramDocuments) {
          try {
            const parsedDocuments = JSON.parse(savedProgramDocuments);
            // Only use saved documents if they match the restored job
            if (parsedDocuments.length > 0 && parsedDocuments[0].part_number === parsedJob.part_number) {
              setProgramDocuments(parsedDocuments);
              console.log('Restored matching program documents from localStorage:', parsedDocuments);
            } else {
              console.log('Saved program documents do not match the restored job - initializing empty documents');
              setProgramDocuments([]);
            }
          } catch (error) {
            console.error('Error parsing saved program documents:', error);
            setProgramDocuments([]);
          }
        }
      } catch (error) {
        console.error('Error parsing saved job:', error);
      }
    }
  }, [fetchAllOrders, fetchActiveParts]);

  // Add a new useEffect to fetch PDC data when selectedJob changes
  // This ensures PDC data is only loaded for the current selection
  useEffect(() => {
    const fetchPdcForCurrentJob = async () => {
      if (selectedJob) {
        try {
          // Fetch PDC data for the selected job
          const pdcResponse = await fetchPartProductionPDC(
            selectedJob.part_number,
            selectedJob.production_order
          );
          console.log('PDC Response for current job:', pdcResponse);
          
          if (pdcResponse && Array.isArray(pdcResponse) && pdcResponse.length > 0) {
            // Find the matching PDC record for this specific part number and production order
            const matchingPdc = pdcResponse.find(item => 
              item.part_number === selectedJob.part_number && 
              item.production_order === selectedJob.production_order
            );
            
            if (matchingPdc) {
              // If a matching record was found, set it as the PDC data
              setPdcData(matchingPdc);
              console.log('PDC data matched for current job:', matchingPdc);
            } else {
              // Use the first PDC record if no exact match found
              const pdcWithProductionOrder = {
                ...pdcResponse[0],
                production_order: pdcResponse[0].production_order || selectedJob.production_order,
                part_number: pdcResponse[0].part_number || selectedJob.part_number
              };
              setPdcData(pdcWithProductionOrder);
              console.log('Using first PDC record:', pdcWithProductionOrder);
            }
          } else {
            console.log('No PDC data available for this part/order');
            setPdcData(null);
          }
        } catch (pdcError) {
          console.error('Error fetching PDC data:', pdcError);
          setPdcData(null);
        }
      } else {
        // Clear PDC data if no job is selected
        setPdcData(null);
      }
    };

    fetchPdcForCurrentJob();
  }, [selectedJob, fetchPartProductionPDC]); // Include fetchPartProductionPDC in the dependency array

  // Save selectedJob to localStorage when it changes
  useEffect(() => {
    if (selectedJob) {
      localStorage.setItem('selectedJob', JSON.stringify(selectedJob));
    }
  }, [selectedJob]);

  // Save tools to localStorage when they change
  useEffect(() => {
    if (tools.length > 0) {
      localStorage.setItem('jobTools', JSON.stringify(tools));
    }
  }, [tools]);

  // Save programs to localStorage when they change
  useEffect(() => {
    if (programs.length > 0) {
      localStorage.setItem('jobPrograms', JSON.stringify(programs));
      console.log('Saved programs to localStorage:', programs);
    }
  }, [programs]);

  // Use effect to set form values when selectedTool changes
  useEffect(() => {
    if (selectedTool && isEditToolModalVisible) {
      editToolForm.setFieldsValue({
        toolType: selectedTool.toolType,
        toolDescription: selectedTool.toolDescription,
        belPartNumber: selectedTool.belPartNumber
      });
    }
  }, [selectedTool, isEditToolModalVisible, editToolForm]);

  // Use effect to set form values when selectedProgram changes
  useEffect(() => {
    if (selectedProgram && isEditProgramModalVisible) {
      editProgramForm.setFieldsValue({
        programNo: selectedProgram.programNo,
        description: selectedProgram.description,
        version: selectedProgram.version
      });
    }
  }, [selectedProgram, isEditProgramModalVisible, editProgramForm]);

  // Add effect to update the edit form when selectedProgram changes
  useEffect(() => {
    if (selectedProgram && editProgramForm) {
      editProgramForm.setFieldsValue({
        program_name: selectedProgram.program_name || selectedProgram.description,
        program_number: selectedProgram.program_number || selectedProgram.programNo,
        version: selectedProgram.version || 'v1',
        operation_id: selectedProgram.operation_id
      });
    }
  }, [selectedProgram, editProgramForm]);

  // Add effect to fetch tools when tab changes or job changes
  useEffect(() => {
    const fetchTools = async () => {
      if (selectedJob?.id && activeTab === 'toolsAndPrograms') {
        try {
          setLoading(true);
          const toolsData = await fetchToolsByOrderId(selectedJob.id);
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
  }, [selectedJob?.id, activeTab, fetchToolsByOrderId]);

  // Add effect to fetch programs when tab changes or job changes
  useEffect(() => {
    const fetchPrograms = async () => {
      if (selectedJob?.id && activeTab === 'toolsAndPrograms') {
        try {
          setLoading(true);
          const programsData = await fetchProgramsByOrderId(selectedJob.id);
          setPrograms(programsData);
        } catch (error) {
          console.error('Error fetching programs:', error);
          message.error('Failed to fetch programs');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPrograms();
  }, [selectedJob?.id, activeTab, fetchProgramsByOrderId]);

  // Add effect to fetch engineering drawings when a job is selected
  useEffect(() => {
    const fetchDrawings = async () => {
      if (selectedJob?.part_number && activeTab === 'configMatrix') {
        try {
          setDrawingsLoading(true);
          const drawingsData = await fetchEngineeringDrawings(selectedJob.part_number);
          console.log('Fetched engineering drawings:', drawingsData);
          console.log('Items from API:', drawingsData.items); // Log the items
          setEngineeringDrawings(drawingsData.items || []);
        } catch (error) {
          console.error('Error fetching engineering drawings:', error);
          message.error('Failed to fetch engineering drawings');
        } finally {
          setDrawingsLoading(false);
        }
      }
    };

    fetchDrawings();
  }, [selectedJob?.part_number, activeTab, fetchEngineeringDrawings]);

  // Update the getJobStatus function to correctly check based on production order
  const getJobStatus = (productionOrder) => {
    // Check if the production order exists in the activeParts array
    const foundPart = activeParts.find(part => 
      part.production_order === productionOrder || 
      part.production_order_number === productionOrder
    );
    
    // Check the status
    const isActive = foundPart && foundPart.status === 'active';
    
    console.log(`Checking status for ${productionOrder}:`, {
      foundInActiveParts: !!foundPart,
      partStatus: foundPart?.status,
      isActive: isActive,
      returnStatus: isActive ? 'active' : 'inactive'
    });
    
    return isActive ? 'active' : 'inactive';
  };

  // Update the handleStatusChange function to properly toggle status
  const handleStatusChange = (productionOrder, currentStatus) => {
    // Get the current status directly from activeParts to make sure we have the latest
    const actualCurrentStatus = getJobStatus(productionOrder);
    
    // Determine new status based on current status
    const newStatus = actualCurrentStatus === 'active' ? 'inactive' : 'active';
    
    console.log(`Toggling status for ${productionOrder}: ${actualCurrentStatus} -> ${newStatus}`);
    
    // Show confirmation modal
    Modal.confirm({
      title: `Confirm Status Change`,
      content: `Are you sure you want to change the status of production order ${productionOrder} to ${newStatus}?`,
      onOk: async () => {
        try {
          setUpdatingStatus(true);
          await changePartStatus(productionOrder, newStatus);
          
          // Refresh data after status change
          await fetchActiveParts();
          
          message.success(`Status changed to ${newStatus} successfully`);
        } catch (error) {
          message.error(`Failed to change status: ${error.message}`);
        } finally {
          setUpdatingStatus(false);
        }
      }
    });
  };

  // Update the renderStatusButton function to properly display the text based on current status
  const renderStatusButton = (productionOrder) => {
    // Get the current status
    const status = getJobStatus(productionOrder);
    console.log(`Rendering status button for ${productionOrder}: Current status is ${status}`);
    
    return (
      <Button
        type={status === 'active' ? 'primary' : 'default'}
        onClick={() => handleStatusChange(productionOrder, status)}
        loading={updatingStatus}
        style={status === 'active' ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
      >
        {status === 'active' ? 'Active' : 'Inactive'}
      </Button>
    );
  };

  const fetchCompletionStatus = async (partNumber, productionOrder) => {
    try {
      console.log('Fetching completion status for:', partNumber, productionOrder);
      const status = await useOrderStore.getState().checkOrderCompletion(partNumber, productionOrder);
      console.log('Completion status received:', status);
      setCompletionStatus(status);
    } catch (error) {
      console.error('Error fetching completion status:', error);
      // message.error('Failed to fetch completion status');
    }
  };

  const handleJobSelect = async (partNumber) => {
    try {
      console.log('Job selected:', partNumber);
      setLoading(true);
      setSelectedJob(null);
      setCompletionStatus(null); // Reset completion status when selecting new job
      
      if (!partNumber) {
        setSelectedJob(null);
        setTools([]);
        setPrograms([]);
        setLoading(false);
        setPdcData(null); // Reset PDC data when no job is selected
        return;
      }

      console.log('Selected partNumber:', partNumber);
      
      const fetchJobDetails = async (selectedPartNumber) => {
        try {
          const orderData = await searchOrders(selectedPartNumber);
          if (orderData && orderData.orders && orderData.orders.length > 0) {
            const jobData = orderData.orders[0];
            console.log('Job details:', jobData);
            setSelectedJob(jobData);
            
            // Save to localStorage for persistence
            localStorage.setItem('selectedJob', JSON.stringify(jobData));
            
            // PDC data will be fetched by the useEffect hook when selectedJob changes
            // No need to fetch it here
            
            // Fetch tools and programs
            try {
              const toolsData = await fetchToolsByOrderId(jobData.id);
              console.log('Tools data:', toolsData);
              
              const enhancedToolsData = toolsData.map(tool => ({
                ...tool,
                productionOrder: jobData.production_order,
                partNumber: jobData.part_number
              }));
              
              setTools(enhancedToolsData);
              localStorage.setItem('tools', JSON.stringify(enhancedToolsData));
            } catch (toolsError) {
              console.error('Error fetching tools:', toolsError);
              // Fall back to localStorage if available
              const savedTools = JSON.parse(localStorage.getItem('tools') || '[]');
              setTools(savedTools);
            }
            
            try {
              const programsData = await fetchProgramsByOrderId(jobData.id);
              console.log('Programs data:', programsData);
              
              const enhancedProgramsData = programsData.map(program => ({
                ...program,
                productionOrder: jobData.production_order,
                partNumber: jobData.part_number,
                operationNumber: program.operation_id, // Map operation_id to operationNumber for display
                operationDescription: jobData.operations.find(op => op.id === program.operation_id)?.operation_description || 'Unknown'
              }));
              
              setPrograms(enhancedProgramsData);
              localStorage.setItem('programs', JSON.stringify(enhancedProgramsData));
            } catch (programsError) {
              console.error('Error fetching programs:', programsError);
              // Fall back to localStorage if available
              const savedPrograms = JSON.parse(localStorage.getItem('programs') || '[]');
              setPrograms(savedPrograms);
            }
            
            return jobData;
          }
          return null;
        } catch (error) {
          console.error('Error fetching job details:', error);
          message.error('Failed to fetch job details');
          return null;
        }
      };
      
      const jobDetails = await fetchJobDetails(partNumber);
      
      if (!jobDetails) {
        message.error('No job details found for the selected part number');
      }
      
      if (selectedJob) {
        console.log('Selected job:', selectedJob);
        try {
          await fetchCompletionStatus(partNumber, selectedJob.production_order);
        } catch (error) {
          console.error('Error fetching completion status:', error);
          // message.error('Failed to fetch completion status');
        }
      }
      
    } catch (error) {
      console.error('Error in handleJobSelect:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOperationEdit = (operation) => {
    setSelectedOperation(operation);
    setShowMPPDetails(true);
  };

  const handleUpload = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const handleReset = () => {
    // Only reset the select input value
    const select = document.querySelector('.ant-select-selector input');
    if (select) {
      select.value = '';
    }
    setSelectedJob(null);
    setSelectedOrderNumber(null);
    setTools([]);
    setPrograms([]);
    setPdcData(null);
    localStorage.removeItem('selectedJob');
    localStorage.removeItem('jobTools');
    localStorage.removeItem('jobPrograms');
  };

  const handleShowPreview = () => {
    if (!selectedJob) {
      message.error('No job selected');
      return;
    }
    setIsPreviewModalVisible(true);
  };

  const handleDownloadJobCard = async () => {
    setIsGeneratingPdf(true);
    try {
      // Initialize PDF document
      const doc = new jsPDF();
      
      // Set better font
      doc.setFont('NotoSansCondensed');
      
      // Add BEL logo
      const img = new Image();
      img.src = belLogo;
      doc.addImage(img, 'PNG', 10, 5, 30, 15);
      
      // Add company header with better styling
      doc.setFontSize(18);
      doc.setFont('NotoSansCondensed', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('FABRICATION COMPONENTS', 105, 15, { align: 'center' });
      doc.setFontSize(16);
      doc.text('JOB CARD', 105, 22, { align: 'center' });

      // Add horizontal line with better styling
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(10, 25, 200, 25);

      // Define the job details table data
      const tableData = [
        [
          {
            content: 'Part Number',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: selectedJob.part_number || 'N/A',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Rev',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: 'B',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Part Description',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: selectedJob.part_description || 'N/A',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Dept. / Project',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: selectedJob.project?.name || 'N/A',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'PO No.',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: selectedJob.production_order || 'N/A',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'No. of OP',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: selectedJob.total_operations || 'N/A',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Batch',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: 'NA',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Qty',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: selectedJob.required_quantity || 'N/A',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Heat No.',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: '',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Heat No.',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: '',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'RM Reference',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: selectedJob.rm_reference || 'N/A',
            styles: { cellWidth: 100 }
          }
        ]
      ];

      // Generate the job details table with adjusted width
      autoTable(doc, {
        startY: 30,
        head: [],
        body: tableData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          font: 'NotoSansCondensed',
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 100 }
        },
        margin: { right: 90 }, // Increased right margin to make space for QR codes
        didDrawCell: function(data) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.1);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
      });



      // Generate and add QR codes
      try {
        // Part Number QR - positioned to the right of the table
        const partQrDataUrl = await QRCodeNode.toDataURL(selectedJob.part_number || '', {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 80
        });
        doc.addImage(partQrDataUrl, 'PNG', 160, 35, 35, 35);
        doc.setFontSize(8);
        doc.text('Part Number QR', 177, 75, { align: 'center' });

        // PO Number QR - positioned below the first QR code
        const poQrDataUrl = await QRCodeNode.toDataURL(selectedJob.production_order || '', {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 80
        });
        doc.addImage(poQrDataUrl, 'PNG', 160, 80, 35, 35);
        doc.setFontSize(8);
        doc.text('PO Number QR', 177, 120, { align: 'center' });
      } catch (error) {
        console.error('Error generating QR codes:', error);
      }

      // Add Operation Status header with better styling
      doc.setFontSize(12);
      doc.setFont('NotoSansCondensed', 'bold');
      doc.text('Operation Status', 105, doc.lastAutoTable.finalY + 15, { align: 'center' });

      // Create operations table headers
      const operationsHeader = [
        [
          { content: 'No.', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Dates', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Ava. Hrs', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Act. Hrs', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Acpt. Qty', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'In-Ch', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'No.', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Dates', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Ava. Hrs', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Act. Hrs', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Acpt. Qty', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'In-Ch', styles: { halign: 'center', fontStyle: 'bold' } }
        ]
      ];

      // Prepare operations data
      const operations = selectedJob.operations || [];
      
      // Sort operations by operation number
      const sortedOperations = [...operations].sort((a, b) => 
        parseInt(a.operation_number) - parseInt(b.operation_number)
      );
      
      // Calculate how many rows we need (half of total operations, rounded up)
      const rowCount = Math.ceil(sortedOperations.length / 2);
      
      // Split operations into left and right columns
      const leftColumnOps = sortedOperations.slice(0, rowCount);
      const rightColumnOps = sortedOperations.slice(rowCount);
      
      // Create rows with operation data
      const operationsRows = [];
      for (let i = 0; i < rowCount; i++) {
        const leftOp = leftColumnOps[i];
        const rightOp = rightColumnOps[i];
        
        const row = [
          // Left side operation
          { content: leftOp ? leftOp.operation_number.toString().padStart(2, '0') : '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          // Right side operation
          { content: rightOp ? rightOp.operation_number.toString().padStart(2, '0') : '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } }
        ];
        operationsRows.push(row);
      }

      // Generate the operations table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: operationsHeader,
        body: operationsRows,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          halign: 'center'
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 20 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 20 },
          8: { cellWidth: 15 },
          9: { cellWidth: 15 },
          10: { cellWidth: 15 },
          11: { cellWidth: 15 }
        }
      });

      // Add new page for QA Reference and Waiver Details
      doc.addPage();

      // QA Reference section
      const qaReferenceData = [
        [
          {
            content: 'QA Reference',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: '',
            styles: { cellWidth: 120 }
          }
        ]
      ];

      // Generate QA Reference table
      autoTable(doc, {
        startY: 20,
        head: [],
        body: qaReferenceData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 120 }
        },
        didDrawCell: function(data) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.1);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
      });

      // Waiver Details section
      doc.setFontSize(12);
      doc.setFont('NotoSansCondensed', 'bold');
      doc.text('Waiver Details', 105, doc.lastAutoTable.finalY + 15, { align: 'center' });

      const waiverDetailsData = [
        [
          {
            content: 'Document Number',
            styles: { fontStyle: 'bold', cellWidth: 80 }
          },
          {
            content: 'Status',
            styles: { fontStyle: 'bold', cellWidth: 80 }
          }
        ],
        [
          {
            content: '',
            rowSpan: 3,
            styles: { cellWidth: 80 }
          },
          {
            content: 'Raised Qty',
            styles: { fontStyle: 'bold', cellWidth: 80 }
          }
        ],
        [
          {
            content: 'Accepted Qty',
            styles: { fontStyle: 'bold', cellWidth: 80 }
          }
        ],
        [
          {
            content: 'Rejected Qty',
            styles: { fontStyle: 'bold', cellWidth: 80 }
          }
        ]
      ];

      // Generate Waiver Details table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [],
        body: waiverDetailsData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 80 }
        },
        didDrawCell: function(data) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.1);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
      });

      // Add Signature and Date section
      doc.setFontSize(10);
      doc.text('Signature with Seal', 30, doc.lastAutoTable.finalY + 30);
      doc.text('Date:', 150, doc.lastAutoTable.finalY + 30);

      // Add Notes section
      doc.setFontSize(12);
      doc.setFont('NotoSansCondensed', 'bold');
      doc.text('Notes', 20, doc.lastAutoTable.finalY + 50);

      // Add Notes box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.rect(20, doc.lastAutoTable.finalY + 55, 170, 100);

      // Save the PDF
      const fileName = `JobCard_${selectedJob.production_order || 'unknown'}.pdf`;
      console.log('Saving PDF with filename:', fileName);
      doc.save(fileName);
      message.success('Job card downloaded successfully');
      setIsPreviewModalVisible(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate job card');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderPreviewContent = () => {
    if (!selectedJob) return null;

    // Sort operations by operation number
    const sortedOperations = [...(selectedJob.operations || [])].sort(
      (a, b) => parseInt(a.operation_number) - parseInt(b.operation_number)
    );

    // Calculate how many operations to show in each column
    const leftColumnOps = sortedOperations.slice(0, Math.ceil(sortedOperations.length / 2));
    const rightColumnOps = sortedOperations.slice(Math.ceil(sortedOperations.length / 2));

    return (
      <div className="space-y-8 p-4">
        {/* First Page */}
        <div className="border-4 border-blue-900 rounded-lg p-8 mx-auto max-w-5xl bg-white shadow-2xl relative overflow-hidden">
          {/* Background watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <img src={belLogo} alt="" className="w-96" />
          </div>
          
          {/* Header Section */}
          <div className="text-center space-y-2 border-b-4 border-blue-900 pb-4 mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <img src={belLogo} alt="BEL Logo" className="h-16" />
              <div className=" bg-blue-50 text-Black px-8 py-3 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold">FABRICATION COMPONENTS</h2>
                <h3 className="text-xl">JOB CARD</h3>
              </div>
              <div className="w-24"></div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Jobs Card */}
            <div className="bg-blue-600 text-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-90">Total Jobs</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <ScheduleOutlined className="text-xl" />
                </div>
              </div>
            </div>

            {/* In Progress Card */}
            <div className="bg-yellow-500 text-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-90">In Progress</p>
                  <p className="text-2xl font-bold">18</p>
                </div>
                <div className="bg-yellow-400 p-3 rounded-full">
                  <Hourglass className="text-xl" />
                </div>
              </div>
            </div>

            {/* Completed Card */}
            <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-90">Completed</p>
                  <p className="text-2xl font-bold">6</p>
                </div>
                <div className="bg-green-400 p-3 rounded-full">
                  <CheckCircle className="text-xl" />
                </div>
              </div>
            </div>

            {/* Pending PDC Card */}
            <div className="bg-orange-500 text-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-90">Pending PDC</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div className="bg-orange-400 p-3 rounded-full">
                  <CalendarCheck className="text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Job Details Section with QR Codes */}
          <div className="flex justify-between gap-8 relative z-10">
            <div className="flex-grow">
              <table className="w-full border-collapse text-sm shadow-lg">
                <tbody>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 w-1/4 bg-blue-50">Part Number</td>
                    <td className="p-4 w-1/4 border-r-2">{selectedJob.part_number}</td>
                    <td className="font-bold p-4 w-1/4 bg-blue-50">Rev</td>
                    <td className="p-4">B</td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">Part Description</td>
                    <td className="p-4" colSpan="3">{selectedJob.part_description || 'N/A'}</td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">Dept. / Project</td>
                    <td className="p-4" colSpan="3">{selectedJob.project?.name || 'N/A'}</td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">PO No.</td>
                    <td className="p-4">{selectedJob.production_order || 'N/A'}</td>
                    <td className="font-bold p-4 bg-blue-50">No. of OP</td>
                    <td className="p-4">{selectedJob.total_operations || 'N/A'}</td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">Batch</td>
                    <td className="p-4">NA</td>
                    <td className="font-bold p-4 bg-blue-50">Qty</td>
                    <td className="p-4">{selectedJob.required_quantity || 'N/A'}</td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">Heat No.</td>
                    <td className="p-4" colSpan="3"></td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">Heat No.</td>
                    <td className="p-4" colSpan="3"></td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">RM Reference</td>
                    <td className="p-4" colSpan="3">{selectedJob.rm_reference || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col items-center p-6 border-2 border-blue-900 rounded-lg bg-white shadow-lg">
                <QRCodeSVG
                  value={selectedJob.part_number || ''}
                  size={120}
                  level="H"
                  includeMargin={true}
                  className="mb-3"
                />
                <span className="text-sm font-semibold">Part Number QR</span>
              </div>
              <div className="flex flex-col items-center p-6 border-2 border-blue-900 rounded-lg bg-white shadow-lg">
                <QRCodeSVG
                  value={selectedJob.production_order || ''}
                  size={120}
                  level="H"
                  includeMargin={true}
                  className="mb-3"
                />
                <span className="text-sm font-semibold ">PO Number QR</span>
              </div>
            </div>
          </div>

          {/* Operations Section */}
          <div className="mt-10 relative z-10">
            <div className=" bg-blue-50 text-Black py-3 px-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-center">Operation Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-4 bg-white border-2 border-t-0 border-blue-900 rounded-b-lg shadow-lg">
              {/* Left Column */}
              <div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border-2 border-gray-300 p-3 font-semibold ">No.</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">Dates</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">Ava. Hrs</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">Act. Hrs</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">Acpt. Qty</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">In-Ch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leftColumnOps.map(op => (
                      <tr key={op.operation_number} className="hover:bg-gray-50">
                        <td className="border-2 border-gray-300 p-3 text-center font-medium">{op.operation_number}</td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Right Column */}
              <div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border-2 border-gray-300 p-3 font-semibold ">No.</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold  ">Dates</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">Ava. Hrs</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">Act. Hrs</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">Acpt. Qty</th>
                      <th className="border-2 border-gray-300 p-3 font-semibold ">In-Ch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rightColumnOps.map(op => (
                      <tr key={op.operation_number} className="hover:bg-gray-50">
                        <td className="border-2 border-gray-300 p-3 text-center font-medium">{op.operation_number}</td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                        <td className="border-2 border-gray-300 p-3"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Second Page */}
        <div className="border-4 border-blue-900 rounded-lg p-8 mx-auto max-w-5xl bg-white shadow-2xl relative overflow-hidden">
          {/* Background watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <img src={belLogo} alt="" className="w-96" />
          </div>

          {/* Header Section */}
          <div className="text-center space-y-2 border-b-4 border-blue-900 pb-4 mb-8 relative z-10">
            <div className="flex items-center justify-between">
              <img src={belLogo} alt="BEL Logo" className="h-16" />
              <div className=" bg-blue-50 text-black px-8 py-3 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold">FABRICATION COMPONENTS</h2>
                <h3 className="text-xl">JOB CARD</h3>
              </div>
              <div className="w-24"></div>
            </div>
          </div>

          {/* QA Reference Section */}
          <div className="mb-8 relative z-10">
            <div className=" bg-blue-50 text-black py-2 px-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">QA Reference</h3>
            </div>
            <div className="border-2 border-t-0 border-blue-900 rounded-b-lg p-4 min-h-[100px]"></div>
          </div>

          {/* Waiver Details Section */}
          <div className="mb-8 relative z-10">
            <div className=" bg-blue-50 text-black py-2 px-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-center">Waiver Details</h3>
            </div>
            <br />
            <div className="border-2 border-t-0 border-blue-900 rounded-b-lg">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="font-bold p-4 w-1/2 bg-blue-50 border-b-2 border-r-2 border-blue-900">Document Number</td>
                    <td className="font-bold p-4 w-1/2 bg-blue-50 border-b-2 border-blue-900">Status</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-r-2 border-blue-900" rowSpan="3"></td>
                    <td className="font-bold p-4 border-b-2 border-blue-900">Raised Qty</td>
                  </tr>
                  <tr>
                    <td className="font-bold p-4 border-b-2 border-blue-900">Accepted Qty</td>
                  </tr>
                  <tr>
                    <td className="font-bold p-4">Rejected Qty</td>
                  </tr>
                </tbody>
              </table>

              {/* Signature and Date Section */}
              <div className="flex justify-between items-start mt-12 mb-8 relative z-10">
                <div className="w-1/3">
                  <p className="font-bold mb-2 bg-blue-50">Signature with Seal</p>
                  <div className="border-b-4 border-blue-900 h-16"></div>
                </div>
                <div className="w-1/3 text-right">
                  <p className="font-bold mb-2 bg-blue-50">Date:</p>
                  <div className="border-b-4 border-blue-900 h-16"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="relative z-10">
            <div className=" bg-blue-50 text-black py-2 px-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Notes</h3>
            </div>
            <div className="border-2 border-t-0 border-blue-900 rounded-b-lg p-4 min-h-[200px] bg-blue-50"></div>
          </div>
        </div>
      </div>
    );
  };

  const renderDownloadButton = () => (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={handleShowPreview}
    >
      Download Job Card
    </Button>
  );

  // Function to load operations for the selected production order
  const loadOperations = async (productionOrder) => {
    if (!productionOrder) return [];
    
    try {
      setLoadingOperations(true);
      const ops = await fetchOperationsForTool(productionOrder);
      setOperations(ops);
      return ops;
    } catch (error) {
      console.error('Error loading operations:', error);
      message.error('Failed to load operations');
      return [];
    } finally {
      setLoadingOperations(false);
    }
  };

  // Load operations when modal opens
  useEffect(() => {
    if (isAddToolModalVisible && selectedJob?.production_order) {
      console.log('Loading operations for production order:', selectedJob.production_order);
      loadOperations(selectedJob.production_order);
    }
  }, [isAddToolModalVisible, selectedJob]);

  // Add this useEffect to fetch tools when the component mounts or when selectedJob changes
  useEffect(() => {
  const fetchTools = async () => {
      if (selectedJob?.id) {
        try {
          setLoading(true);
        const toolsData = await fetchToolsByOrderId(selectedJob.id);
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
}, [selectedJob?.id, fetchToolsByOrderId]);

// Update the handleAddTool function
  const handleAddTool = async (values) => {
    if (!values.operation_id) {
      message.error('Please select an operation');
      return;
    }
    
    try {
      setLoading(true);
      const toolData = {
      ...values,
      order_id: selectedJob.id,
      operation_id: values.operation_id,
      tool_name: selectedSubcategoryName,
      bel_partnumber: selectedPartNumber,
      description: selectedPartDescription,
      tool_number: selectedPartNumber || 'N/A', // Add tool_number field using BEL part number
      quantity: values.quantity
    };
    
    // Call the API to add the tool
    await addOrderTool(toolData);
    
    // After successful addition, fetch the updated tools list
    const updatedTools = await fetchToolsByOrderId(selectedJob.id);
    setTools(updatedTools);
    
    message.success('Tool added successfully');
    setIsAddToolModalVisible(false);
    addToolForm.resetFields();
    
    // Reset the selected values
    setSelectedSubcategoryName('');
    setSelectedPartNumber('');
    setSelectedPartDescription('');
  } catch (error) {
    console.error('Error adding tool:', error);
    message.error('Failed to add tool');
  } finally {
    setLoading(false);
  }
};

  const handleUpdateTool = async (values) => {
    try {
      setLoading(true);
      const toolData = {
        ...values,
        order_id: selectedJob.id,
        operation_id: values.operation_id
      };
      
      const updatedTool = await updateOrderTool(selectedTool.id, toolData);
      setTools(prevTools => 
        prevTools.map(tool => 
          tool.id === selectedTool.id ? updatedTool : tool
        )
      );
      message.success('Tool updated successfully');
      setIsEditToolModalVisible(false);
      editToolForm.resetFields();
    } catch (error) {
      console.error('Error updating tool:', error);
      message.error('Failed to update tool');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTool = async (toolId) => {
    try {
      setLoading(true);
      await deleteOrderTool(toolId);
      setTools(prevTools => prevTools.filter(tool => tool.id !== toolId));
      message.success('Tool deleted successfully');
    } catch (error) {
      console.error('Error deleting tool:', error);
      message.error('Failed to delete tool');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = async (values) => {
    try {
      setLoading(true);
      const programData = {
        ...values,
        order_id: selectedJob.id,
        operation_id: values.operation_id,
        part_number: selectedJob.part_number,
        production_order: selectedJob.production_order
      };
      
      const newProgram = await addOrderProgram(programData);
      const operation = selectedJob?.operations?.find(op => op.id === values.operation_id);
      const enhancedProgram = {
        ...newProgram,
        partNumber: selectedJob.part_number,
        productionOrder: selectedJob.production_order,
        operationNumber: operation?.operation_number,
        operationDescription: operation?.operation_description
      };
      setPrograms(prevPrograms => [...prevPrograms, enhancedProgram]);
      message.success('Program added successfully');
      setIsAddProgramModalVisible(false);
      addProgramForm.resetFields();
    } catch (error) {
      console.error('Error adding program:', error);
      message.error('Failed to add program');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgram = async (values) => {
    try {
      setLoading(true);
      const programData = {
        ...values,
        order_id: selectedJob.id,
        operation_id: values.operation_id,
        part_number: selectedJob.part_number,
        production_order: selectedJob.production_order
      };
      
      const updatedProgram = await updateOrderProgram(selectedProgram.id, programData);
      const operation = selectedJob?.operations?.find(op => op.id === values.operation_id);
      const enhancedProgram = {
        ...updatedProgram,
        partNumber: selectedJob.part_number,
        productionOrder: selectedJob.production_order,
        operationNumber: operation?.operation_number,
        operationDescription: operation?.operation_description
      };
      setPrograms(prevPrograms => 
        prevPrograms.map(program => 
          program.id === selectedProgram.id ? enhancedProgram : program
        )
      );
      message.success('Program updated successfully');
      setIsEditProgramModalVisible(false);
      editProgramForm.resetFields();
    } catch (error) {
      console.error('Error updating program:', error);
      message.error('Failed to update program');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    try {
      setLoading(true);
      await deleteOrderProgram(programId);
      setPrograms(prevPrograms => prevPrograms.filter(program => program.id !== programId));
      message.success('Program deleted successfully');
    } catch (error) {
      console.error('Error deleting program:', error);
      message.error('Failed to delete program');
    } finally {
      setLoading(false);
    }
  };

  // In your Planning component, replace the renderPdcInfo function with:
  const renderPdcInfo = (productionOrder) => {
    return <PdcInfo productionOrder={productionOrder} key={`pdc-${productionOrder}`} />;
  };

  // Handle viewing/downloading a drawing
  const handleViewDrawing = async (documentId) => {
    try {
      console.log('Attempting to download document ID:', documentId);
      
      if (!documentId) {
        message.error('Invalid document ID');
        return;
      }
      
      // Try to download the document
      const result = await downloadDocument(documentId);
      console.log('Download result:', result);
      message.success('Drawing downloaded successfully');
    } catch (error) {
      console.error('Error viewing/downloading drawing:', error);
      message.error('Failed to download drawing: ' + (error.message || 'Unknown error'));
    }
  };

  // Update handleAddDocument function
  const handleAddDocument = async (values) => {
    try {
      setLoading(true);
      
      // Get all files from the Upload component
      const files = values.file?.fileList || [];
      if (files.length === 0) {
        throw new Error('Please select files to upload');
      }

      // Validate that all files have operations assigned
      const unassignedFiles = files.filter(file => !fileOperationMappings[file.uid]);
      if (unassignedFiles.length > 0) {
        throw new Error('Please assign operations to all files');
      }

      // Validate that all assigned operations exist in the available operations
      const availableOperationIds = documentOperations.map(op => op.id.toString());
      const invalidMappings = Object.entries(fileOperationMappings).filter(
        ([fileUid, operationId]) => !availableOperationIds.includes(operationId.toString())
      );
      
      if (invalidMappings.length > 0) {
        const invalidFiles = invalidMappings.map(([fileUid]) => 
          files.find(f => f.uid === fileUid)?.name || 'Unknown file'
        );
        throw new Error(`Invalid operation assigned to: ${invalidFiles.join(', ')}. Please select valid operations.`);
      }

      // Upload each file with its assigned operation
      const uploadPromises = files.map(fileInfo => {
        const file = fileInfo.originFileObj;
        const operationId = fileOperationMappings[fileInfo.uid];
        
        console.log('File:', file.name, 'Operation ID:', operationId);
        console.log('Available operations:', documentOperations.map(op => ({id: op.id, number: op.operation_number})));
        
        // Use string comparison to ensure type compatibility
        const selectedOperation = documentOperations.find(op => String(op.id) === String(operationId));
        
        if (!selectedOperation) {
          console.error(`No matching operation found for ID ${operationId}`);
          throw new Error(`Invalid operation for file ${file.name}. Operation ID ${operationId} not found.`);
        }

        // Create FormData object for each file
        const formData = new FormData();
        formData.append('file', file);
        
        // Use file name without extension as program name
        const programName = file.name.split('.')[0];
        formData.append('program_name', programName);
        formData.append('description', programName); // Use filename as description
        formData.append('version_number', '1'); // Default version
        formData.append('part_number', selectedJob.part_number);
        formData.append('operation_number', selectedOperation.operation_number);
        formData.append('operation_id', selectedOperation.id); // Add operation_id explicitly

        // Return upload promise
        return uploadCncProgram(formData);
      });

      // Wait for all uploads to complete
      const responses = await Promise.all(uploadPromises);
      
      // Process all responses and add to program documents
      const newDocuments = responses.map((response, index) => {
        if (response && response.id) {
          const fileInfo = files[index];
          const operationId = fileOperationMappings[fileInfo.uid];
          return {
            id: response.id,
            name: response.name,
            description: response.description,
            type: 'CNC Program',
            doc_type_id: response.doc_type_id,
            part_number: response.part_number,
            production_order_id: response.production_order_id,
            created_at: response.created_at,
            upload_date: response.created_at,
            is_active: response.is_active,
            latest_version: response.latest_version,
            operation_number: response.latest_version?.metadata?.operation_number || '',
            operation_id: operationId
          };
        }
        return null;
      }).filter(Boolean);
      
      setProgramDocuments(prevDocs => {
        const updatedDocs = [...prevDocs, ...newDocuments];
        localStorage.setItem('programDocuments', JSON.stringify(updatedDocs));
        return updatedDocs;
      });
      
      message.success(`${files.length} CNC program(s) uploaded successfully`);
      setIsAddDocumentModalVisible(false);
      addDocumentForm.resetFields();
      setFileOperationMappings({}); // Reset mappings
    } catch (error) {
      console.error('Error uploading CNC programs:', error);
      message.error(`Failed to upload CNC programs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add new function to handle operation selection for a file
  const handleOperationSelect = (fileUid, operationId) => {
    console.log(`Assigning operation ID ${operationId} to file ${fileUid}`);
    
    // Find the operation details for better feedback
    const operation = documentOperations.find(op => String(op.id) === String(operationId));
    
    setFileOperationMappings(prev => ({
      ...prev,
      [fileUid]: operationId
    }));
    
    // Show feedback message
    if (operation) {
      message.success(`Assigned Operation ${operation.operation_number} to file`);
    }
  };

  // Add this useEffect to set the form values when the modal opens
  useEffect(() => {
    if (isAddDocumentModalVisible && selectedJob) {
      const selectedOrder = partNumbers.find(order => order.productionOrder === selectedJob.production_order);
      if (selectedOrder) {
        addDocumentForm.setFieldsValue({
          part_number: selectedOrder.partNumber || selectedJob.part_number
        });
      }
    }
  }, [isAddDocumentModalVisible, selectedJob, partNumbers, addDocumentForm]);

  // Add effect to fetch program documents when job changes or tab changes
  useEffect(() => {
    const fetchProgramDocs = async () => {
      if (selectedJob?.part_number && activeTab === 'toolsAndPrograms') {
        try {
          setLoading(true);
          
          // Use the fetchCncProgramDetails endpoint to get program documents
          const programDetails = await fetchCncProgramDetails(selectedJob.part_number);
          console.log('Fetched program documents using CNC endpoint:', programDetails);
          
          // Process the data to extract operation numbers as needed
          let mappedDocuments = [];
          
          if (programDetails && Array.isArray(programDetails)) {
            // Map the data to include operation numbers if available
            mappedDocuments = programDetails.map(doc => {
              // Try to extract operation number from metadata or latest_version
              let operationNumber = null;
              
              if (doc.metadata && doc.metadata.operation_number) {
                operationNumber = doc.metadata.operation_number;
              } else if (doc.latest_version && doc.latest_version.metadata && doc.latest_version.metadata.operation_number) {
                operationNumber = doc.latest_version.metadata.operation_number;
              } else {
                // Try to extract from file name (common format: OP10, Operation 10, etc.)
                const name = doc.name || '';
                const fileNameMatch = name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                if (fileNameMatch) {
                  operationNumber = fileNameMatch[1] || fileNameMatch[2];
                }
              }
              
              return {
                ...doc,
                operation_number: operationNumber
              };
            });
          } else if (programDetails && programDetails.items && Array.isArray(programDetails.items)) {
            // Handle case where API returns {items: [...]} structure
            mappedDocuments = programDetails.items.map(doc => {
              // Try to extract operation number from metadata or latest_version
              let operationNumber = null;
              
              if (doc.metadata && doc.metadata.operation_number) {
                operationNumber = doc.metadata.operation_number;
              } else if (doc.latest_version && doc.latest_version.metadata && doc.latest_version.metadata.operation_number) {
                operationNumber = doc.latest_version.metadata.operation_number;
              } else {
                // Try to extract from file name (common format: OP10, Operation 10, etc.)
                const name = doc.name || '';
                const fileNameMatch = name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                if (fileNameMatch) {
                  operationNumber = fileNameMatch[1] || fileNameMatch[2];
                }
              }
              
              return {
                ...doc,
                operation_number: operationNumber
              };
            });
          }
          
          console.log('Processed CNC program documents:', mappedDocuments);
          setProgramDocuments(mappedDocuments);
          
          // Store in localStorage for persistence
          localStorage.setItem('programDocuments', JSON.stringify(mappedDocuments));
        } catch (error) {
          console.error('Error fetching program documents:', error);
          
          // Try to load from localStorage as fallback
          const savedDocuments = localStorage.getItem('programDocuments');
          if (savedDocuments) {
            try {
              const parsedDocuments = JSON.parse(savedDocuments);
              setProgramDocuments(parsedDocuments);
            } catch (parseError) {
              console.error('Error parsing saved documents:', parseError);
              setProgramDocuments([]);
            }
          } else {
            setProgramDocuments([]);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProgramDocs();
  }, [selectedJob?.part_number, activeTab, fetchCncProgramDetails]);

  // Add the documentsColumns definition before the return statement
  // Define the columns for the Program Documents table
  const documentsColumns = [
    { 
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      className: 'bg-gray-50'
    },
    { 
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      className: 'bg-gray-50'
    },
    { 
      title: 'Operation',
      dataIndex: 'operation_number',
      key: 'operation_number',
      className: 'bg-gray-50',
      render: (operationNumber, record) => {
        // Log the record to help debugging
        console.log('Rendering operation for document in table:', record);
        
        // Handle different possible data structures from API
        let opNum = operationNumber || 
          record.metadata?.operation_number || 
          record.latest_version?.metadata?.operation_number;
        
        // If no operation number found in metadata, try to extract from name
        if (!opNum && record.name) {
          const fileNameMatch = record.name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
          if (fileNameMatch) {
            opNum = fileNameMatch[1] || fileNameMatch[2];
          }
        }
        
        if (!opNum) return 'N/A';
        
        // Try to find matching operation in the job data
        const operation = selectedJob?.operations?.find(op => 
          op.operation_number.toString() === opNum.toString()
        );
        
        if (operation) {
          return `${operation.operation_number} - ${operation.operation_description}`;
        } else {
          // If no match found, at least show the operation number
          return `Operation ${opNum}`;
        }
      }
    },
    { 
      title: 'Version',
      dataIndex: ['latest_version', 'version_number'],
      key: 'version',
      className: 'bg-gray-50',
      render: (version) => version || 'N/A'
    },
    { 
      title: 'Upload Date',
      dataIndex: 'created_at',
      key: 'created_at',
      className: 'bg-gray-50',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Action',
      key: 'action',
      className: 'bg-gray-50',
      align: 'center',
      render: (_, record) => (
        <Space>
          {/* <Tooltip title="Download Document">
            <Button 
              type="link" 
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadDocument(record)}
            />
          </Tooltip> */}
          <Tooltip title="View Version History">
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={() => handleViewVersionHistory(record)}
            />
          </Tooltip>
          <Tooltip title="Update Version">
            <Button
              type="link"
              icon={<UploadOutlined />}
              onClick={() => handleUpdateVersion(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Add a new function to handle viewing version history
  const handleViewVersionHistory = async (record) => {
    try {
      if (!record || !record.id) {
        message.error('Invalid document selected');
        return;
      }
      
      setSelectedProgramForVersion(record);
      setLoading(true);
      
      // Fetch all versions for this document
      const versions = await fetchProgramVersions(record.id);
      setProgramVersions(versions);
      
      setIsVersionHistoryModalVisible(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching version history:', error);
      message.error('Failed to fetch version history');
      setLoading(false);
    }
  };

  // Update the handleUpdateVersion function to use document_id directly
  const handleUpdateVersion = async (record) => {
    try {
      if (!record || !record.id) {
        message.error('Invalid document selected');
        return;
      }
      
      setSelectedProgramForVersion(record);
      setVersionFile(null);
      setVersionNumber('');
      form.resetFields();
      setIsVersionUpdateModalVisible(true);
    } catch (error) {
      message.error('Failed to prepare version update');
    }
  };

  // Update the handleVersionUpdateConfirm function to use document_id
  const handleVersionUpdateConfirm = async () => {
    try {
      // Add console.log to debug the values
      console.log('Selected Program:', selectedProgramForVersion);
      console.log('Uploaded File:', versionFile);
      console.log('Version Number:', versionNumber);

      // Check if all required values are present
      if (!selectedProgramForVersion || !selectedProgramForVersion.id) {
        message.error('No program selected');
        return;
      }

      if (!versionFile) {
        message.error('Please select a file');
        return;
      }

      if (!versionNumber) {
        message.error('Please enter a version number');
        return;
      }

      // Use the document ID directly for the API call
      await updateProgramVersion(selectedProgramForVersion.id, versionFile, versionNumber);
      message.success('Program version updated successfully');
      setIsVersionUpdateModalVisible(false);
      
      // Clear the form values
      setVersionFile(null);
      setVersionNumber('');
      
      // Refresh the program documents list based on active tab
      if (activeTab === 'toolsAndPrograms' && selectedJob?.part_number) {
        try {
          // Fetch latest documents using the CNC endpoint
          const programDetails = await fetchCncProgramDetails(selectedJob.part_number);
          
          // Process the data to extract operation numbers
          let mappedDocuments = [];
          
          if (programDetails && Array.isArray(programDetails)) {
            mappedDocuments = programDetails.map(doc => {
              let operationNumber = null;
              
              if (doc.metadata && doc.metadata.operation_number) {
                operationNumber = doc.metadata.operation_number;
              } else if (doc.latest_version && doc.latest_version.metadata && doc.latest_version.metadata.operation_number) {
                operationNumber = doc.latest_version.metadata.operation_number;
              } else {
                const name = doc.name || '';
                const fileNameMatch = name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                if (fileNameMatch) {
                  operationNumber = fileNameMatch[1] || fileNameMatch[2];
                }
              }
              
              return {
                ...doc,
                operation_number: operationNumber
              };
            });
          } else if (programDetails && programDetails.items && Array.isArray(programDetails.items)) {
            mappedDocuments = programDetails.items.map(doc => {
              let operationNumber = null;
              
              if (doc.metadata && doc.metadata.operation_number) {
                operationNumber = doc.metadata.operation_number;
              } else if (doc.latest_version && doc.latest_version.metadata && doc.latest_version.metadata.operation_number) {
                operationNumber = doc.latest_version.metadata.operation_number;
              } else {
                const name = doc.name || '';
                const fileNameMatch = name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                if (fileNameMatch) {
                  operationNumber = fileNameMatch[1] || fileNameMatch[2];
                }
              }
              
              return {
                ...doc,
                operation_number: operationNumber
              };
            });
          }
          
          setProgramDocuments(mappedDocuments);
        } catch (error) {
          console.error('Error refreshing program documents:', error);
        }
      } else if (activeTab === 'configMatrix' && selectedJob?.part_number) {
        try {
          // Also refresh config matrix documents
          const programDetails = await fetchCncProgramDetails(selectedJob.part_number);
          let mappedDocuments = [];
          
          if (programDetails && Array.isArray(programDetails)) {
            mappedDocuments = programDetails.map(doc => {
              let operationNumber = null;
              
              if (doc.metadata && doc.metadata.operation_number) {
                operationNumber = doc.metadata.operation_number;
              } else if (doc.latest_version && doc.latest_version.metadata && doc.latest_version.metadata.operation_number) {
                operationNumber = doc.latest_version.metadata.operation_number;
              } else {
                const name = doc.name || '';
                const fileNameMatch = name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                if (fileNameMatch) {
                  operationNumber = fileNameMatch[1] || fileNameMatch[2];
                }
              }
              
              return {
                ...doc,
                operation_number: operationNumber
              };
            });
          }
          
          setProgramDocuments(mappedDocuments);
        } catch (error) {
          console.error('Error refreshing program documents for config matrix:', error);
        }
      }
    } catch (error) {
      message.error(error.message || 'Failed to update program version');
    }
  };

  // Define columns for the version history table
  const versionHistoryColumns = [
    {
      title: 'Version',
      dataIndex: 'version_number',
      key: 'version_number',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Upload Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'File Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => size ? `${(size / 1024).toFixed(2)} KB` : 'N/A',
    },
    {
      title: 'File Name',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Download Version">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadVersion(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Add function to handle downloading a specific version
  const handleDownloadVersion = async (version) => {
    try {
      if (version?.id) {
        // Use the file_name from the version record for the download
        await downloadDocument(version.document_id, version.file_name);
      } else {
        message.error('Version information is missing');
      }
    } catch (error) {
      console.error('Error downloading version:', error);
      message.error('Failed to download version');
    }
  };

  // Make sure you have the file upload handler
  const handleFileChange = (info) => {
    if (info.file.status === 'done') {
      setVersionFile(info.file.originFileObj);
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  // Handle document download
  const handleDownloadDocument = async (record) => {
    try {
      if (record.latest_version?.id) {
        // Pass the document name when downloading
        await downloadDocument(record.latest_version.id, record.name);
      } else {
        message.error('No version available for download');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      message.error('Failed to download document');
    }
  };

  // Add effect to fetch program details when a part number is selected
  useEffect(() => {
    const fetchProgramDetails = async () => {
      console.log('Running fetchProgramDetails for tab:', activeTab, 'part number:', selectedJob?.part_number);
      
      if (selectedJob?.part_number && (activeTab === 'toolsAndPrograms' || activeTab === 'configMatrix')) {
        try {
          setLoading(true);
          const programDetails = await fetchCncProgramDetails(selectedJob.part_number);
          console.log('Fetched CNC program details:', programDetails);
          
          // Update program documents state when we're on the configMatrix tab
          if (activeTab === 'configMatrix') {
            // Check if there's valid program data
            if (programDetails && Array.isArray(programDetails)) {
              // Map the data to include operation numbers if available
              const mappedDocuments = programDetails.map(doc => {
                // Try to extract operation number from metadata or latest_version
                let operationNumber = null;
                
                if (doc.metadata && doc.metadata.operation_number) {
                  operationNumber = doc.metadata.operation_number;
                } else if (doc.latest_version && doc.latest_version.metadata && doc.latest_version.metadata.operation_number) {
                  operationNumber = doc.latest_version.metadata.operation_number;
                } else {
                  // Try to extract from file name (common format: OP10, Operation 10, etc.)
                  const name = doc.name || '';
                  const fileNameMatch = name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                  if (fileNameMatch) {
                    operationNumber = fileNameMatch[1] || fileNameMatch[2];
                  }
                }
                
                return {
                  ...doc,
                  operation_number: operationNumber
                };
              });
              
              console.log('Mapped CNC program documents with operation numbers:', mappedDocuments);
              setProgramDocuments(mappedDocuments);
            } else if (programDetails && programDetails.items && Array.isArray(programDetails.items)) {
              // Handle case where API returns {items: [...]} structure
              const mappedDocuments = programDetails.items.map(doc => {
                // Try to extract operation number from metadata or latest_version
                let operationNumber = null;
                
                if (doc.metadata && doc.metadata.operation_number) {
                  operationNumber = doc.metadata.operation_number;
                } else if (doc.latest_version && doc.latest_version.metadata && doc.latest_version.metadata.operation_number) {
                  operationNumber = doc.latest_version.metadata.operation_number;
                } else {
                  // Try to extract from file name (common format: OP10, Operation 10, etc.)
                  const name = doc.name || '';
                  const fileNameMatch = name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                  if (fileNameMatch) {
                    operationNumber = fileNameMatch[1] || fileNameMatch[2];
                  }
                }
                
                return {
                  ...doc,
                  operation_number: operationNumber
                };
              });
              
              console.log('Mapped CNC program documents with operation numbers:', mappedDocuments);
              setProgramDocuments(mappedDocuments);
            } else {
              console.log('No program documents found for this part number');
              setProgramDocuments([]);
            }
          }
        } catch (error) {
          console.error('Error fetching CNC program details:', error);
          // Don't show error to user as this might be optional data
          if (activeTab === 'configMatrix') {
            setProgramDocuments([]);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProgramDetails();
  }, [selectedJob?.part_number, activeTab, fetchCncProgramDetails]);

  // Add state variable for operations dropdown in the modal
  const [documentOperations, setDocumentOperations] = useState([]);

  // Add useEffect to fetch operations when the modal opens
  useEffect(() => {
    const fetchOperationsForModal = async () => {
      if (isAddDocumentModalVisible && selectedJob) {
        try {
          setLoading(true);
          
          // Always fetch fresh operations from the API to ensure we have the latest data
          console.log('Fetching operations from API for production order:', selectedJob.production_order);
          const orderData = await searchOrders(selectedJob.production_order);
          
          if (orderData && orderData.orders && orderData.orders.length > 0) {
            const operations = orderData.orders[0].operations || [];
            console.log('Operations fetched from API:', operations);
            setDocumentOperations(operations);
            
            // Update the selected job's operations if needed
            if (operations.length > 0 && (!selectedJob.operations || selectedJob.operations.length === 0)) {
              setSelectedJob(prevJob => ({
                ...prevJob,
                operations: operations
              }));
            }
          } else {
            console.warn('No operations found for production order:', selectedJob.production_order);
            setDocumentOperations([]);
          }
        } catch (error) {
          console.error('Error fetching operations for document upload:', error);
          message.error('Failed to fetch operations');
          setDocumentOperations([]);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchOperationsForModal();
  }, [isAddDocumentModalVisible, selectedJob, searchOrders]);

  // Update the modal to reset operations when closing
  const handleCloseAddDocumentModal = () => {
    setIsAddDocumentModalVisible(false);
    addDocumentForm.resetFields();
    setFileOperationMappings({});
    setDocumentOperations([]);
  };

  const handleShowRawMaterialModal = () => {
    if (!selectedJob) {
      message.error('No job selected');
      return;
    }
    setIsRawMaterialModalVisible(true);
  };

  // Add this function before your JSX return statement or in your component's function body

const handleDownloadRawMaterialJobCard = async () => {
  if (!selectedJob) {
    message.error("No job selected for Job Number Tag.");
    return;
  }

  setIsGeneratingRawMaterialPdf(true);

  try {
    // Page and table sizes in points
    const mmToPt = mm => mm * 2.83465;
    const pageWidth = mmToPt(80);  // 226.77 pt
    const pageHeight = mmToPt(50); // 141.73 pt
    const tableWidth = mmToPt(74); // 209.76 pt
    const tableHeight = mmToPt(44); // 124.73 pt

    // Centered margins
    const marginX = (pageWidth - tableWidth) / 2;
    const marginY = (pageHeight - tableHeight) / 2;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [pageWidth, pageHeight]
    });

    // Font setup
    try {
      doc.setFont('NotoSans_Condensed', 'normal');
    } catch {
      doc.setFont('Lexend', 'normal');
    }

    // Data prep
    const material = selectedJob.raw_materials?.[0] || {};
    const qrString = [
      `RM Part No: ${material.child_part_number || 'N/A'}`,
      `RM Part Name: ${material.description || material.material_name || 'N/A'}`,
      `RM Qty: ${material.quantity || 'N/A'}`,
      `Job Part No.: ${selectedJob.part_number || 'N/A'}`,
      `Order No.: ${selectedJob.production_order || 'N/A'}`,
      `Order Qty: ${selectedJob.launched_quantity || 'N/A'}`
    ].filter(Boolean).join('\n');

    const qrDataUrl = await QRCodeNode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 80
    });

    // Column widths for 74mm (209.76pt)
    const colWidths = [
      tableWidth * 0.18,
      tableWidth * 0.39,
      tableWidth * 0.17,
      tableWidth * 0.26
    ];

    const headerHeight = 16;
    const totalDataRows = 9;
    const dataRowHeight = Math.floor((tableHeight - headerHeight) / totalDataRows);

    // Use standard jsPDF font for PDF generation to avoid loading issues
    const fontName = 'helvetica';
    const fontStyle = 'bold';

    // Table structure
    const tableData = [
      [{
        content: 'FAB/C - RM Traceability Card',
        colSpan: 4,
        styles: {
          fontStyle: 'bold',
          font: 'helvetica',
          halign: 'center',
          fontSize: 11,
          minCellHeight: headerHeight
        }
      }],
      [
        { content: 'Job Part No.', styles: { fontStyle: 'bold' }},
        { content: selectedJob.part_number || 'N/A' },
        { content: 'Location', styles: { fontStyle: 'bold' }},
        { content: material.location || 'N/A' }
      ],
      [
        { content: 'RM Size', styles: { fontStyle: 'bold' }},
        { content: material.size || 'N/A', colSpan: 3 }
      ],
      [
        { content: 'Heat No.', styles: { fontStyle: 'bold' }},
        { content: material.gr_number || 'N/A' },
        { content: 'RM Qty', styles: { fontStyle: 'bold', halign: 'right' }},
        { content: material.quantity || 'N/A' }
      ],
      [
        { content: 'RM Part No.', styles: { fontStyle: 'bold' }},
        { content: material.child_part_number || 'N/A' },
        { content: 'Rev', styles: { fontStyle: 'bold', halign: 'right' }},
        { content: material.revision || 'N/A' }
      ],
      [
        { content: 'RM Part Name', styles: { fontStyle: 'bold' }},
        { content: material.description || material.material_name || 'N/A', colSpan: 2 },
        { content: '', rowSpan: 4 }
      ],
      [
        { content: 'Dept', styles: { fontStyle: 'bold' }},
        { content: selectedJob.department || 'N/A', colSpan: 2 }
      ],
      [
        { content: 'Order No.', styles: { fontStyle: 'bold' }},
        { content: selectedJob.production_order || 'N/A', colSpan: 2 }
      ],
      [
        { content: 'Order Qty', styles: { fontStyle: 'bold' }},
        { content: selectedJob.launched_quantity || 'N/A', colSpan: 2 }
      ]
    ];

    let qrPosition = null;

    // Generate the centered table
    autoTable(doc, {
      startY: marginY,
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 4.5,
        cellPadding: 1, // ~0.1 mm
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        font: 'helvetica',
        halign: 'left',
        valign: 'middle',
        minCellHeight: dataRowHeight,
        maxCellHeight: dataRowHeight,
        textColor: [0, 0, 0],
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: colWidths[0], fontStyle: 'bold', fontSize: 6 },
        1: { cellWidth: colWidths[1], fontSize: 6 },
        2: { cellWidth: colWidths[2], fontStyle: 'bold', fontSize: 6 },
        3: { cellWidth: colWidths[3], fontSize: 6 }
      },
      tableWidth: tableWidth,
      margin: { left: marginX, right: marginX, top: marginY, bottom: marginY },
      pageBreak: 'avoid',
      didDrawCell: (data) => {
        // Capture the position of the merged cell area (column 3, starting from row 5)
        // Rows are 0-indexed, so row 5 is the 6th row (RM Part Name)
        if (data.row.index === 5 && data.column.index === 3) {
          qrPosition = {
            x: data.cell.x,
            y: data.cell.y,
            width: data.cell.width,
            height: dataRowHeight * 4 // 4 rows merged
          };
        }
      }
    });

    // Add QR code with better sizing and positioning
    if (qrPosition) {
      const qrPadding = 2; // Add some padding
      const availableWidth = qrPosition.width - (qrPadding * 2);
      const availableHeight = qrPosition.height - (qrPadding * 2);
      
      // Make QR code square and fit within the available space
      const qrSize = Math.min(availableWidth, availableHeight);
      
      // Center the QR code within the cell
      const qrX = qrPosition.x + (qrPosition.width - qrSize) / 2;
      const qrY = qrPosition.y + (qrPosition.height - qrSize) / 2;

      try {
        // Add a white background for the QR code
        doc.setFillColor(255, 255, 255);
        doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'F');
        
        // Add the QR code
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Add a border around the QR code
        doc.setDrawColor(0, 0, 0);
        doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2);
      } catch (error) {
        console.error('Error adding QR code to PDF:', error);
      }
    }

    doc.save(`RawMaterial_JobCard_${selectedJob.production_order || 'unknown'}.pdf`);
    message.success('Job Number Tag PDF downloaded successfully.');
    setIsRawMaterialModalVisible(false);

  } catch (error) {
    console.error("Error generating Raw Material PDF:", error);
    message.error(`Failed to generate Raw Material PDF: ${error.message}`);
  } finally {
    setIsGeneratingRawMaterialPdf(false);
  }
};

// Your existing Modal JSX
{/* Job Number Tag Preview Modal */}
<Modal
  title="Job Number Tag Preview"
  open={isRawMaterialModalVisible}
  onCancel={() => {
    setIsRawMaterialModalVisible(false);
  }}
  width={800}
  footer={[
    <Button key="cancelRM" onClick={() => setIsRawMaterialModalVisible(false)}>
      Cancel
    </Button>,
    <Button
      key="downloadRM"
      type="primary"
      icon={<DownloadOutlined />}
      onClick={handleDownloadRawMaterialJobCard}
      loading={isGeneratingRawMaterialPdf}
    >
      {isGeneratingRawMaterialPdf ? 'Generating PDF...' : 'Download PDF'}
    </Button>
  ]}
>
  {selectedJob ? (() => {
    const material = selectedJob.raw_materials?.[0] || {};
    const qrString = [
      `Part No: ${material.child_part_number || 'N/A'}`,
      `RM Name: ${material.material_name || 'N/A'}`,
      `RM Qty: ${material.quantity || 'N/A'}`,
      `Order No: ${selectedJob.production_order || 'N/A'}`
    ].filter(Boolean).join('\n');

    // Path to the image - update this with your actual image path
    const logoImage = '/images/logo.png';

    return (
      <div className="max-h-[80vh] overflow-y-auto p-4 bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-2">
              <img 
                src={logoImage} 
                alt="Company Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide the image if it fails to load
                }}
              />
            </div>
            <h2 className="text-xl font-bold text-gray-800">FAB/C - RM Traceability Card</h2>
            <p className="text-sm text-gray-500">Preview of Job Number Tag</p>
          </div>
          
          <div className="relative border border-gray-300 rounded-lg p-4 bg-white">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="font-semibold p-2 w-1/4">Job Part No.</td>
                  <td className="p-2 border-b border-gray-200">{selectedJob.part_number || 'N/A'}</td>
                  <td className="font-semibold p-2 w-1/4">Location</td>
                  <td className="p-2 border-b border-gray-200">{material.location || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">RM Name</td>
                  <td className="p-2 border-b border-gray-200" colSpan="3">{material.material_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">RM Size</td>
                  <td className="p-2 border-b border-gray-200" colSpan="3">{material.size || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">Heat No.</td>
                  <td className="p-2 border-b border-gray-200">{material.gr_number || 'N/A'}</td>
                  <td className="font-semibold p-2">RM Qty</td>
                  <td className="p-2 border-b border-gray-200">{material.quantity || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">Part No.</td>
                  <td className="p-2 border-b border-gray-200">{material.child_part_number || 'N/A'}</td>
                  <td className="font-semibold p-2">Rev</td>
                  <td className="p-2 border-b border-gray-200">{material.revision || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">Part Name</td>
                  <td className="p-2 border-b border-gray-200" colSpan="2">
                    {selectedJob.part_description || 'N/A'}
                  </td>
                  <td className="p-2 border-b border-gray-200" rowSpan="4" style={{ position: 'relative', minHeight: '120px' }}>
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <QRCodeSVG
                        value={qrString}
                        size={100}
                        level="M"
                        includeMargin={true}
                        className="border border-gray-200 p-1 rounded"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">Dept</td>
                  <td className="p-2 border-b border-gray-200" colSpan="2">{selectedJob.department || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">Order No.</td>
                  <td className="p-2 border-b border-gray-200" colSpan="2">{selectedJob.production_order || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">Order Qty</td>
                  <td className="p-2 border-b border-gray-200" colSpan="2">{selectedJob.launched_quantity || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This is a preview of the Job Number Tag that will be generated in the PDF.</p>
            <p className="mt-2">The actual PDF will have the same layout but with optimized printing format.</p>
          </div>
        </div>
      </div>
    );
  })() : (
    <Alert message="No job selected or job data is unavailable." type="warning" showIcon />
  )}
</Modal>

  // Add this effect to fetch completion status when job is selected
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (selectedJob?.part_number && selectedJob?.production_order) {
        setLoading(true);
        try {
          const status = await usePlanningStore.getState().checkOrderCompletion(
            selectedJob.part_number,
            selectedJob.production_order
          );
          setCompletionStatus(status);
        } catch (error) {
          console.error('Error fetching completion status:', error);
          // message.error('Failed to fetch completion status');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCompletionStatus();
  }, [selectedJob]);

  
  return (
    <div className="space-y-6 p-6">
      {/* Job Selection Section with improved layout */}
      <Card className="shadow-sm">
      <Row justify="space-between" align="middle" wrap>
        <Col flex="1">
          <Form.Item label="Select Job/Production Order" className="mb-0" style={{ width: '100%', fontWeight: 600, fontSize: '26px' }}>
            <Select
              className="job-select"
              showSearch
              style={{ width: '100%', maxWidth: 300 }}
              placeholder="Select Production Order"
              optionFilterProp="label"
              value={selectedOrderNumber}
              onChange={handleJobSelect}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            >
              {partNumbers.map(order => (
                <Option 
                  key={order.id} 
                  value={order.value}
                  label={order.label}
                >
                  {order.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {selectedJob && (
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={handleShowRawMaterialModal}
              >
                Job Number Tag
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleShowPreview}
              >
                Download Job Card
              </Button>
            </Space>
          </Col>
        )}
      </Row>
    </Card>

      {/* All other content conditionally rendered only when a job is selected */}
      {selectedJob && (
        <>
          {/* Job Details Section */}
          <Card className="shadow-sm">
            <Tabs 
              activeKey={activeTab} 
              onChange={(tab) => {
                console.log('Tab changed to:', tab);
                // Clear program documents if changing away from configMatrix
                if (tab !== 'configMatrix') {
                  setProgramDocuments([]);
                }
                setActiveTab(tab);
              }}
            >
              <TabPane 
                tab={
                  <span style={{ fontWeight: 'bold' }}>
                    <FileTextOutlined />
                    Job Details

                  </span>
                }
                key="jobDetails"
              >
                <Card 
                  className={`shadow-sm mb-6 hover:shadow-md transition-shadow ${
                    getJobStatus(selectedJob.production_order) === 'active' 
                      ? 'bg-green-50' 
                      : getJobStatus(selectedJob.production_order) === 'inactive'
                      ? 'bg-yellow-50'
                      : 'bg-gray-50'
                  }`}
                  size="small"
                >
                  <Descriptions
                    bordered
                    size="small"
                    column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                  >
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Part Number</span>}>
                      {selectedJob.part_number}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Production Order</span>}>
                      {selectedJob.production_order}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Project Name</span>}>
                      {selectedJob.project?.name}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Part Description</span>}>
                      {selectedJob.part_description}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Launched Quantity</span>}>
                      {selectedJob.launched_quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Total Operations</span>}>
                      {selectedJob.total_operations}
                    </Descriptions.Item>
                    {/* <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Start Date</span>}>
                      {selectedJob.project?.start_date 
                        ? new Date(selectedJob.project.start_date).toLocaleDateString()
                        : 'N/A'}
                    </Descriptions.Item> */}
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Status</span>}>
                      <div className="flex items-center space-x-2">
                        {renderStatusButton(selectedJob.production_order)}
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ fontWeight: 'bold', color: '#1890ff' }}>PDC</span>}
                    >
                      {renderPdcInfo(selectedJob.production_order)}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span style={{ fontWeight: 'bold' }}>Completion Status</span>}>
                      {loading ? (
                        <Spin size="small" />
                      ) : completionStatus ? (
                        <div style={{ 
                          color: completionStatus.is_order_completed ? '#52c41a' : '#fa8c16',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {completionStatus.is_order_completed 
                            ? `Completed on ${new Date(completionStatus.overall_completion_date).toLocaleDateString()}`
                            : 'Not Yet Completed'}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>Loading status...</span>
                      )}
                    </Descriptions.Item>
                  </Descriptions>

                  {/* Raw Materials Section */}
                  <div className="mt-6">
                    <Title level={5}>Raw Materials</Title>
                    <Table
                      size="small"
                      dataSource={selectedJob.raw_materials}
                      rowKey="id"
                      pagination={false}
                      className="mt-2"
                      columns={[
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
                          title: 'Quantity',
                          dataIndex: 'quantity',
                          key: 'quantity',
                        },
                        {
                          title: 'Unit',
                          dataIndex: ['unit', 'name'],
                          key: 'unit',
                          render: (text, record) => record.unit?.name || 'N/A'
                        },
                        
                      ]}
                    />
                  </div>
                </Card>

                <JobOperationsTable 
                  jobId={selectedJob.id}
                  onOperationEdit={handleOperationEdit}
                  operations={selectedJob.operations}
                  partNumber={selectedJob.part_number}
                  orderNumber={selectedJob.production_order}
                  status={getJobStatus(selectedJob.production_order) === 'active' ? 'Active' : 'Inactive'}
                />
              </TabPane>

              <TabPane 
                tab={
                  <span style={{ fontWeight: 'bold' }}>
                    <ToolOutlined />
                    Tools and Programs
                  </span>
                }
                key="toolsAndPrograms"
              >
                <Card className="shadow-sm">
                  {/* Add nested Tabs for Tools and Programs with improved styling */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center mb-4">
                      <ToolOutlined className="text-blue-500 text-xl mr-2" />
                      <Text strong className="text-lg">Tools and Programs Management</Text>
                    </div>
                    <Descriptions
                      bordered
                      size="small"
                      column={{ xxl: 4, xl: 4, lg: 3, md: 2, sm: 1, xs: 1 }}
                      className="bg-white rounded-lg"
                    >
                      <Descriptions.Item 
                        label={<span className="font-semibold">Part Number</span>}
                        className="bg-gray-50"
                      >
                        <span className="text-blue-600 font-medium">{selectedJob?.part_number}</span>
                      </Descriptions.Item>
                      <Descriptions.Item 
                        label={<span className="font-semibold">Production Order</span>}
                        className="bg-gray-50"
                      >
                        <span className="text-blue-600 font-medium">{selectedJob?.production_order}</span>
                      </Descriptions.Item>
                      <Descriptions.Item 
                        label={<span className="font-semibold">Project Name</span>}
                        className="bg-gray-50"
                      >
                        <span className="text-blue-600 font-medium">{selectedJob?.project?.name}</span>
                      </Descriptions.Item>
                      <Descriptions.Item 
                        label={<span className="font-semibold">Total Operations</span>}
                        className="bg-gray-50"
                      >
                        <span className="text-blue-600 font-medium">{selectedJob?.total_operations}</span>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>

                  <Tabs 
                    defaultActiveKey="tools" 
                    type="card"
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <TabPane 
                      tab={
                        <span className="flex items-center" style={{ fontWeight: 'bold' }}>
                          <ToolOutlined className="mr-2" />
                          Tools List
                        </span>
                      } 
                      key="tools"
                    >
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <Text strong className="text-lg flex items-center">
                            <ToolOutlined className="text-blue-500 mr-2" />
                            Tools Management
                          </Text>
                          <Button
                            type="primary"
                            onClick={() => setIsAddToolModalVisible(true)}
                            icon={<PlusOutlined />}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Add Tool
                          </Button>
                        </div>
                        {loading ? (
                          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                            <Spin size="large" />
                          </div>
                        ) : (
                          <Table
                            size="small"
                            bordered
                            columns={[
                              {
                                title: 'Tool Name',
                                dataIndex: 'tool_name',
                                key: 'tool_name',
                                className: 'bg-gray-50',
                              },
                              // {
                              //   title: 'Tool Number',
                              //   dataIndex: 'tool_number',
                              //   key: 'tool_number',
                              //   className: 'bg-gray-50',
                              // },
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
                                }
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
                                title: 'Action',
                                key: 'action',
                                className: 'bg-gray-50',
                                align: 'center',
                                render: (_, record) => (
                                  <Space>
                                    <Button 
                                      type="link" 
                                      icon={<EditOutlined className="text-blue-500" />}
                                      onClick={() => {
                                        setSelectedTool(record);
                                        setIsEditToolModalVisible(true);
                                      }}
                                    />
                                    <Button
                                      type="link"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => {
                                        Modal.confirm({
                                          title: 'Delete Tool',
                                          content: 'Are you sure you want to delete this tool?',
                                          okText: 'Yes',
                                          okType: 'danger',
                                          cancelText: 'No',
                                          onOk: () => handleDeleteTool(record.id),
                                        });
                                      }}
                                    />
                                  </Space>
                                ),
                              },
                            ]}
                            dataSource={tools}
                            pagination={{ 
                              current: currentPage,
                              pageSize: 6,
                              showSizeChanger: false, 
                              position: ['bottomCenter'],
                              showTotal: (total) => `Total ${total} tools`,
                              onChange: (page) => {
                                setCurrentPage(page);
                              },
                              className: "mt-4"
                            }}
                            className="border border-gray-200 rounded-lg"
                          />
                        )}
                      </div>
                    </TabPane>

                    {/* <TabPane 
                      tab={
                        <span className="flex items-center">
                          <FileTextOutlined className="mr-2" />
                          Programs List
                        </span>
                      } 
                      key="programs"
                    >
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <Text strong className="text-lg flex items-center">
                            <FileTextOutlined className="text-blue-500 mr-2" />
                            Programs Management
                          </Text>
                          <Button
                            type="primary"
                            onClick={() => setIsAddProgramModalVisible(true)}
                            icon={<PlusOutlined />}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Add Program
                          </Button>
                        </div>
                        {loading ? (
                          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                            <Spin size="large" />
                          </div>
                        ) : (
                          <Table
                            size="small"
                            bordered
                            columns={[
                              { 
                                title: 'Sl.No', 
                                key: 'serialNumber',
                                width: '5%',
                                className: 'bg-gray-50',
                                align: 'center',
                                render: (text, record, index) => ((programCurrentPage - 1) * 6) + index + 1
                              },
                              { 
                                title: 'Program No', 
                                dataIndex: 'program_number', 
                                key: 'program_number',
                                className: 'bg-gray-50',
                                render: (text, record) => text || record.programNo || 'N/A'
                              },
                              { 
                                title: 'Program Name', 
                                dataIndex: 'program_name', 
                                key: 'program_name',
                                className: 'bg-gray-50',
                                render: (text, record) => text || record.description || 'N/A'
                              },
                              { 
                                title: 'Operation', 
                                dataIndex: 'operation_id', 
                                key: 'operation_id',
                                className: 'bg-gray-50',
                                render: (operationId) => {
                                  const operation = selectedJob?.operations?.find(op => op.id === operationId);
                                  return operation 
                                    ? `${operation.operation_number} - ${operation.operation_description}`
                                    : 'N/A';
                                }
                              },
                              { 
                                title: 'Version', 
                                dataIndex: 'version', 
                                key: 'version',
                                className: 'bg-gray-50',
                                align: 'center',
                                render: (text) => text || 'v1'
                              },
                              {
                                title: 'Action',
                                key: 'action',
                                className: 'bg-gray-50',
                                align: 'center',
                                render: (_, record) => (
                                  <Space size="middle">
                                    <Tooltip title="Update Version">
                                      <Button
                                        type="text"
                                        icon={<UploadOutlined />}
                                        onClick={() => handleUpdateVersion(record)}
                                      />
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteProgram(record.id)}
                                      />
                                    </Tooltip>
                                  </Space>
                                ),
                              },
                            ]}
                            dataSource={programs}
                            pagination={{ 
                              current: programCurrentPage,
                              pageSize: 6,
                              showSizeChanger: false, 
                              position: ['bottomCenter'],
                              showTotal: (total) => `Total ${total} programs`,
                              onChange: (page) => {
                                setProgramCurrentPage(page);
                              },
                              className: "mt-4"
                            }}
                            className="border border-gray-200 rounded-lg"
                          />
                        )}
                      </div>
                    </TabPane> */}

              <TabPane 
                tab={
                        <span className="flex items-center">
                          <FileTextOutlined className="mr-2" />
                          Program Documents
                  </span>
                }
                      key="documents"
                    >
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <Text strong className="text-lg flex items-center">
                            <FileTextOutlined className="text-blue-500 mr-2" />
                            Program Documents
                          </Text>
                          <Button
                            type="primary"
                            onClick={() => setIsAddDocumentModalVisible(true)}
                            icon={<PlusOutlined />}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Add Document
                          </Button>
                        </div>
                        {loading && activeTab === 'toolsAndPrograms' ? (
                          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                            <Spin size="large" tip="Loading program documents..." />
                          </div>
                        ) : programDocuments.length > 0 ? (
                          <Table
                            dataSource={programDocuments}
                            columns={documentsColumns}
                            rowKey="id"
                            pagination={{
                              current: programCurrentPage,
                              onChange: setProgramCurrentPage,
                              pageSize: 5,
                              showSizeChanger: false
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
                            <FileTextOutlined style={{ fontSize: 48 }} className="text-gray-300 mb-4" />
                            <Text className="text-gray-500">No documents found</Text>
                          </div>
                        )}
                      </div>
                    </TabPane>
                  </Tabs>
                </Card>





                
                {/* Add Tool Modal */}
               <Modal
                  title="Add Tool"
                  visible={isAddToolModalVisible}
                  onOk={() => addToolForm.submit()}
                  onCancel={() => {
                    setIsAddToolModalVisible(false);
                    addToolForm.resetFields();
                    setSelectedSubcategoryName('');
                    setSelectedPartNumber('');
                    setSelectedPartDescription('');
                  }}
                  confirmLoading={loading}
                >
                 <Form
                    form={addToolForm}
                    layout="vertical"
                    onFinish={handleAddTool}
                  >


                    
                  <Form.Item
                    label="Select Tool"
                    rules={[{ required: true, message: 'Please select an inventory item' }]}
                  >
                    <Cascader
                      placeholder="Select Category > Subcategory > Item"
                      loading={isLoading}
                      style={{ width: '100%' }}
                      options={categories.map(category => ({
                        label: category.name,
                        value: category.id,
                        isLeaf: false,
                        children: subcategories
                          .filter(sub => sub.category_id === category.id)
                          .map(subcategory => ({
                            label: subcategory.name,
                            value: subcategory.id,
                            isLeaf: false,
                            children: inventoryItems
                              .filter(item => item.subcategory_id === subcategory.id)
                              .map(item => {
                                const instrumentCode = item.dynamic_data["Instrument code"];
                                const belPartNumber = item.dynamic_data["BEL Part Number"] || item.dynamic_data["BEL Part Number "];
                                const belPartDescription = item.dynamic_data["BEL Part Description"];

                                let label = '';

                                if (belPartNumber) {
                                  label += belPartNumber;
                                  if (belPartDescription) {
                                    label += ` - ${belPartDescription}`;
                                  }
                                } else if (belPartDescription) {
                                  label += belPartDescription;
                                } else {
                                  label += 'N/A';
                                }

                                if (instrumentCode) {
                                  label += ` (Inst. Code: ${instrumentCode})`;
                                }

                                return {
                                  label: label,
                                  value: item.id,
                                  isLeaf: true,
                                };
                              })
                          }))
                      }))}

                      showSearch={{
                        filter: (inputValue, path) =>
                          path.some(option =>
                            option.label.toLowerCase().includes(inputValue.toLowerCase())
                          )
                      }}
                      onChange={(value, selectedOptions) => {
                        if (Array.isArray(value) && value.length === 3) {
                          const selectedSubcategory = selectedOptions[1];
                          const subcategoryName = selectedSubcategory ? selectedSubcategory.label : '';
                          const selectedItem = selectedOptions[2];
                          const selectedItemData = inventoryItems.find(item => item.id === value[2]);

                          // Set the form values
                          addToolForm.setFieldsValue({
                            tool_name: subcategoryName,
                            inventory_item_id: value[2],
                            bel_partnumber: selectedItemData?.dynamic_data["BEL Part Number"] || selectedItemData?.dynamic_data["BEL Part Number "] || 'N/A',
                            description: selectedItemData?.dynamic_data["BEL Part Description"] || '',
                            tool_number: selectedItemData?.dynamic_data["BEL Part Number"] || selectedItemData?.dynamic_data["BEL Part Number "] || 'N/A'
                          });

                          // Set the selected values
                          setSelectedSubcategoryName(subcategoryName);
                          setSelectedPartNumber(selectedItemData?.dynamic_data["BEL Part Number"] || selectedItemData?.dynamic_data["BEL Part Number "] || 'N/A');
                          setSelectedPartDescription(selectedItemData?.dynamic_data["BEL Part Description"] || '');
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="operation_id"
                    label="Operation"
                    rules={[{ required: true, message: 'Please select an operation' }]}
                  >
                    <Select
                      placeholder="Select Operation"
                      loading={loadingOperations}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        String(option.children).toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {operations.map(op => (
                        <Select.Option key={op.id} value={op.id}>
                          {`${op.operation_number} - ${op.operation_description || 'No Description'}`}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Selected Subcategory">
                    <Input value={selectedSubcategoryName} readOnly className="bg-gray-100" />
                  </Form.Item>

                    <Form.Item label="BEL Part Number">
                      <Input 
                        value={selectedPartNumber} 
                        readOnly 
                        className="bg-gray-100" 
                      />
                    </Form.Item>

                    <Form.Item label="BEL Part Description">
                      <Input 
                        value={selectedPartDescription} 
                        readOnly 
                        className="bg-gray-100" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="quantity"
                      label="Quantity"
                      rules={[{ required: true, message: 'Please enter quantity' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    {/* <Form.Item
                      name="operation_id"
                      label="Operation"
                      rules={[{ required: true, message: 'Please select an operation' }]}
                    >
                      <Select>
                        {selectedJob?.operations?.map(op => (
                          <Select.Option key={op.id} value={op.id}>
                            {`Operation ${op.operation_number} - ${op.operation_description}`}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item> */}
                  </Form>
                </Modal>

                {/* Edit Tool Modal */}
                <Modal
                  title="Edit Tool"
                  visible={isEditToolModalVisible}
                  onOk={() => editToolForm.submit()}
                  onCancel={() => {
                    setIsEditToolModalVisible(false);
                    editToolForm.resetFields();
                  }}
                  confirmLoading={loading}
                >
                  <Form
                    form={editToolForm}
                    layout="vertical"
                    onFinish={handleUpdateTool}
                    initialValues={selectedTool}
                  >
                    <Form.Item
                      name="tool_name"
                      label="Tool Name"
                      rules={[{ required: true, message: 'Please enter tool name' }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="tool_number"
                      label="Tool Number"
                      rules={[{ required: true, message: 'Please enter tool number' }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="bel_partnumber"
                      label="BEL Part Number"
                      rules={[{ required: true, message: 'Please enter BEL part number' }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="Description"
                    >
                      <Input.TextArea />
                    </Form.Item>
                    <Form.Item
                      name="quantity"
                      label="Quantity"
                      rules={[{ required: true, message: 'Please enter quantity' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="operation_id"
                      label="Operation"
                      rules={[{ required: true, message: 'Please select an operation' }]}
                    >
                      <Select>
                        {selectedJob?.operations?.map(op => (
                          <Select.Option key={op.id} value={op.id}>
                            {`Operation ${op.operation_number} - ${op.operation_description}`}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Form>
                </Modal>

                {/* Add Program Modal */}
                <Modal
                  title="Add Program"
                  open={isAddProgramModalVisible}
                  onCancel={() => {
                    setIsAddProgramModalVisible(false);
                    addProgramForm.resetFields();
                  }}
                  footer={[
                    <Button key="cancel" onClick={() => {
                      setIsAddProgramModalVisible(false);
                      addProgramForm.resetFields();
                    }}>
                      Cancel
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      loading={loading}
                      onClick={() => {
                        addProgramForm.validateFields()
                          .then(values => {
                            handleAddProgram(values);
                          })
                          .catch(info => {
                            console.log('Validate Failed:', info);
                          });
                      }}
                    >
                      Add
                    </Button>,
                  ]}
                >
                  <Form form={addProgramForm} layout="vertical">
                    <Form.Item
                      name="operation_id"
                      label="Operation"
                      rules={[{ required: true, message: 'Please select an operation' }]}
                    >
                      <Select placeholder="Select operation">
                        {selectedJob?.operations?.map((operation) => (
                          <Option key={operation.id} value={operation.id}>
                            {operation.operation_number} - {operation.operation_description}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="program_name"
                      label="Program Name"
                      rules={[{ required: true, message: 'Please enter program name' }]}
                    >
                      <Input placeholder="Enter program name" />
                    </Form.Item>
                    <Form.Item
                      name="program_number"
                      label="Program Number"
                      rules={[{ required: true, message: 'Please enter program number' }]}
                    >
                      <Input placeholder="Enter program number" />
                    </Form.Item>
                    <Form.Item
                      name="version"
                      label="Version"
                      initialValue="v1"
                      rules={[{ required: true, message: 'Please enter version' }]}
                    >
                      <Input placeholder="Enter version (e.g., v1)" />
                    </Form.Item>
                    
                  </Form>
                </Modal>

                {/* Edit Program Modal */}
                <Modal
                  title="Edit Program"
                  open={isEditProgramModalVisible}
                  onCancel={() => {
                    setIsEditProgramModalVisible(false);
                    editProgramForm.resetFields();
                  }}
                  footer={[
                    <Button key="cancel" onClick={() => {
                      setIsEditProgramModalVisible(false);
                      editProgramForm.resetFields();
                    }}>
                      Cancel
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      loading={loading}
                      onClick={() => {
                        editProgramForm.validateFields()
                          .then(values => {
                            handleUpdateProgram(values);
                          })
                          .catch(info => {
                            console.log('Validate Failed:', info);
                          });
                      }}
                    >
                      Update
                    </Button>,
                  ]}
                >
                  <Form 
                    form={editProgramForm} 
                    layout="vertical"
                    initialValues={{
                      program_name: selectedProgram?.program_name || selectedProgram?.description,
                      program_number: selectedProgram?.program_number || selectedProgram?.programNo,
                      version: selectedProgram?.version || 'v1',
                      operation_id: selectedProgram?.operation_id
                    }}
                  >
                    <Form.Item
                      name="operation_id"
                      label="Operation"
                      rules={[{ required: true, message: 'Please select an operation' }]}
                    >
                      <Select placeholder="Select operation">
                        {selectedJob?.operations?.map((operation) => (
                          <Option key={operation.id} value={operation.id}>
                            {operation.operation_number} - {operation.operation_description}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="program_name"
                      label="Program Name"
                      rules={[{ required: true, message: 'Please enter program name' }]}
                    >
                      <Input placeholder="Enter program name" />
                    </Form.Item>
                    <Form.Item
                      name="program_number"
                      label="Program Number"
                      rules={[{ required: true, message: 'Please enter program number' }]}
                    >
                      <Input placeholder="Enter program number" />
                    </Form.Item>
                    <Form.Item
                      name="version"
                      label="Version"
                      rules={[{ required: true, message: 'Please enter version' }]}
                    >
                      <Input placeholder="Enter version (e.g., v1)" />
                    </Form.Item>
                    <Form.Item name="file" label="Upload File (Optional)">
                      <Upload {...uploadProps} maxCount={1}>
                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                        <div className="mt-2 text-xs text-gray-500">
                          Support for .nc, .prt and other program files
                        </div>
                      </Upload>
                    </Form.Item>
                  </Form>
                </Modal>
              </TabPane>

              <TabPane 
                tab={
                  <span style={{ fontWeight: 'bold' }}>
                    <AppstoreOutlined />
                    Configuration Matrix
                  </span>
                }
                key="configMatrix"
              >
                <Card className="shadow-sm">
                  <div className="space-y-6">
                    {/* Job Details Section with improved styling */}
                    {selectedJob && (
                      <>
                        <div className="bg-blue-50 p-4 rounded-lg shadow-sm mb-8">
                          <div className="flex items-center mb-4">
                            <AppstoreOutlined className="text-blue-500 text-xl mr-2" />
                            <Text strong className="text-lg">Configuration Details</Text>
                          </div>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xxl: 4, xl: 4, lg: 3, md: 2, sm: 1, xs: 1 }}
                            className="bg-white rounded-lg"
                          >
                            <Descriptions.Item 
                              label={<span className="font-semibold">Part Number</span>}
                              className="bg-gray-50"
                            >
                              <span className="text-blue-600 font-medium">{selectedJob.part_number}</span>
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={<span className="font-semibold">Production Order</span>}
                              className="bg-gray-50"
                            >
                              <span className="text-blue-600 font-medium">{selectedJob.production_order}</span>
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={<span className="font-semibold">Project Name</span>}
                              className="bg-gray-50"
                            >
                              <span className="text-blue-600 font-medium">{selectedJob.project?.name}</span>
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={<span className="font-semibold">Part Description</span>}
                              className="bg-gray-50"
                            >
                              <span className="text-blue-600 font-medium">{selectedJob.part_description}</span>
                            </Descriptions.Item>
                          </Descriptions>
                        </div>

                        {/* Program Details Section with improved styling */}
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
                          <div className="flex flex-col gap-6">
                            {/* Program Documents Section - Full Width */}
                            <div className="w-full">
                              <Card 
                                title={
                                  <div className="flex items-center">
                                    <FileTextOutlined className="text-blue-500 mr-2" />
                                    <span>Program Documents</span>
                                  </div>
                                }
                                className="shadow-md hover:shadow-lg transition-shadow duration-300"
                                headStyle={{ background: '#f0f5ff', borderBottom: '2px solid #1890ff' }}
                                bodyStyle={{ padding: '12px' }}
                                loading={loading && activeTab === 'configMatrix'}
                              >
                                {programDocuments && programDocuments.length > 0 ? (
                                  <Table
                                    size="small"
                                    bordered
                                    pagination={{ pageSize: 5, size: 'small' }}
                                    columns={[
                                      {
                                        title: 'Name',
                                        dataIndex: 'name',
                                        key: 'name',
                                        width: '25%',
                                        ellipsis: true
                                      },
                                      {
                                        title: 'Description',
                                        dataIndex: 'description',
                                        key: 'description',
                                        width: '25%',
                                        ellipsis: true
                                      },
                                      {
                                        title: 'Operation',
                                        dataIndex: 'operation_number',
                                        key: 'operation_number',
                                        width: '20%',
                                        render: (operationNumber, record) => {
                                          // Log the record to help debugging
                                          console.log('Rendering operation for document:', record);
                                          
                                          // Handle different possible data structures from API
                                          let opNum = operationNumber || 
                                            record.metadata?.operation_number || 
                                            record.latest_version?.metadata?.operation_number;
                                          
                                          // If no operation number found in metadata, try to extract from name
                                          if (!opNum && record.name) {
                                            const fileNameMatch = record.name.match(/OP[_\s]?(\d+)|Operation[_\s]?(\d+)/i);
                                            if (fileNameMatch) {
                                              opNum = fileNameMatch[1] || fileNameMatch[2];
                                            }
                                          }
                                          
                                          if (!opNum) return 'N/A';
                                          
                                          // Try to find matching operation in the job data
                                          const operation = selectedJob?.operations?.find(op => 
                                            op.operation_number.toString() === opNum.toString()
                                          );
                                          
                                          if (operation) {
                                            return `${operation.operation_number} - ${operation.operation_description}`;
                                          } else {
                                            // If no match found, at least show the operation number
                                            return `Operation ${opNum}`;
                                          }
                                        }
                                      },
                                      {
                                        title: 'Version',
                                        dataIndex: ['latest_version', 'version_number'],
                                        key: 'version',
                                        width: '10%',
                                        align: 'center',
                                        render: (version) => version || 'N/A'
                                      },
                                      {
                                        title: 'Upload Date',
                                        dataIndex: 'created_at',
                                        key: 'created_at',
                                        width: '10%',
                                        render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
                                      },
                                      {
                                        title: 'Actions',
                                        key: 'actions',
                                        width: '10%',
                                        align: 'center',
                                        render: (_, record) => (
                                          <Space>
                                            {/* <Button
                                              type="link"
                                              icon={<DownloadOutlined />}
                                              onClick={() => handleDownloadDocument(record)}
                                            />
                                            <Button
                                              type="link"
                                              icon={<EyeOutlined />}
                                              onClick={() => handleViewDrawing(record.id)}
                                            /> */}
                                            <Button
                                              type="link"
                                              icon={<HistoryOutlined />}
                                              onClick={() => handleViewVersionHistory(record)}
                                            />
                                          </Space>
                                        )
                                      }
                                    ]}
                                    dataSource={programDocuments}
                                  />
                                ) : !loading && (
                                  <div className="flex flex-col items-center justify-center h-[200px] bg-gray-50 rounded-lg">
                                    <FileTextOutlined className="text-blue-400 text-5xl mb-4" />
                                    <Text strong className="text-lg mb-2">No Program Documents Available</Text>
                                    <Text type="secondary" className="text-center">
                                      No CNC program documents found for this part
                                    </Text>
                                  </div>
                                )}
                              </Card>
                            </div>

                            {/* Engineering Drawings Section - Full Width */}
                            <div className="w-full">
                              <Card 
                                title={
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <FileTextOutlined className="text-green-500 mr-2" />
                                      <span>Engineering Drawings</span>
                                    </div>
                                    {/* Add a refresh button to manually fetch drawings */}
                                    <Button 
                                      type="text" 
                                      icon={<ReloadOutlined />} 
                                      onClick={() => {
                                        if (selectedJob?.part_number) {
                                          setDrawingsLoading(true);
                                          fetchEngineeringDrawings(selectedJob.part_number)
                                            .then(data => {
                                              console.log('Manually fetched drawings:', data);
                                              setEngineeringDrawings(data.items || []);
                                            })
                                            .catch(err => console.error('Manual fetch error:', err))
                                            .finally(() => setDrawingsLoading(false));
                                        }
                                      }}
                                    />
                                  </div>
                                }
                                className="shadow-md hover:shadow-lg transition-shadow duration-300"
                                headStyle={{ background: '#f0fff0', borderBottom: '2px solid #52c41a' }}
                                bodyStyle={{ padding: '12px' }}
                                loading={drawingsLoading}
                              >
                                {engineeringDrawings && engineeringDrawings.length > 0 ? (
                                  <Table
                                    size="small"
                                    bordered
                                    pagination={{ 
                                      pageSize: 10, 
                                      size: 'small',
                                      position: ['bottomCenter'],
                                      showTotal: (total) => `Total ${total} drawings` 
                                    }}
                                    columns={[
                                      {
                                        title: 'Drawing Name',
                                        dataIndex: 'name',
                                        key: 'name',
                                        width: '60%',
                                        ellipsis: true,
                                        render: (text) => (
                                          <Tooltip title={text}>
                                            <span>{text}</span>
                                          </Tooltip>
                                        )
                                      },
                                      {
                                        title: 'Version',
                                        dataIndex: ['latest_version', 'version_number'],
                                        key: 'version',
                                        width: '20%',
                                        align: 'center',
                                        render: (version) => version || 'v1'
                                      },
                                      {
                                        title: 'Action',
                                        key: 'action',
                                        width: '20%',
                                        align: 'center',
                                        render: (_, record) => (
                                          <Button 
                                            type="link" 
                                            icon={<EyeOutlined />} 
                                            onClick={() => handleViewDrawing(record.id)}
                                          />
                                        )
                                      }
                                    ]}
                                    dataSource={engineeringDrawings}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-[200px] bg-gray-50 rounded-lg">
                                    <FileTextOutlined className="text-green-400 text-5xl mb-4" />
                                    <Text strong className="text-lg mb-2">No Drawings Available</Text>
                                    <Text type="secondary" className="text-center mb-4">
                                      No engineering drawings found for this part
                                    </Text>
                                    {/* Add debug info */}
                                    <div className="text-xs text-gray-500 mt-2">
                                      Part Number: {selectedJob?.part_number || 'None selected'}
                                    </div>
                                  </div>
                                )}
                              </Card>
                            </div>
                          </div>
                        </div>

                        {/* Additional Information Section */}
                        
                      </>
                    )}
                  </div>
                </Card>
              </TabPane>
            </Tabs>
          </Card>

          {/* MPP Details Drawer */}
          <Drawer
            title={`Operation Details - ${selectedOperation?.operation_number}`}
            width={1200}
            open={showMPPDetails}
            onClose={() => setShowMPPDetails(false)}
            destroyOnClose
          >
            <OperationMPPDetails 
              operation={selectedOperation}
              partNumber={selectedJob?.part_number}
              onSave={() => {
                setShowMPPDetails(false);
                message.success('Operation details updated');
              }}
            />
          </Drawer>
        </>
      )}

      {/* Add Preview Modal */}
      <Modal
        title="Job Card Preview"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={1200}
        footer={[
          <Button key="cancel" onClick={() => setIsPreviewModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadJobCard}
            loading={isGeneratingPdf}
          >
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        ]}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {isGeneratingPdf ? (
            <div className="flex items-center justify-center py-12">
              <Spin size="large" tip="Generating PDF..." />
            </div>
          ) : (
            renderPreviewContent()
          )}
        </div>
      </Modal>

      {/* Add Document Modal */}
      <Modal
        title="Add CNC Program Document"
        open={isAddDocumentModalVisible}
        onCancel={handleCloseAddDocumentModal}
        footer={[
          <Button key="cancel" onClick={handleCloseAddDocumentModal}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={() => {
              addDocumentForm.validateFields()
                .then(values => {
                  handleAddDocument(values);
                })
                .catch(info => {
                  console.log('Validate Failed:', info);
                });
            }}
          >
            Upload
          </Button>,
        ]}
      >
        <Form form={addDocumentForm} layout="vertical">
          <Form.Item
            name="file"
            label="Upload CNC Program Files"
            rules={[{ required: true, message: 'Please select at least one file to upload' }]}
          >
            <Upload.Dragger
              {...documentUploadProps}
              style={{ padding: '20px' }}
              multiple={true}
              maxCount={10}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined className="text-3xl text-blue-500" />
              </p>
              <p className="ant-upload-text font-medium">
                Click or drag CNC program files to this area to upload
              </p>
              <p className="ant-upload-hint text-gray-500 text-sm">
                Support for CNC program files (.nc, .txt, .cnc, etc.)
                <br />
                You can upload multiple files at once
              </p>
            </Upload.Dragger>
          </Form.Item>

          {/* File Operation Mappings */}
          {addDocumentForm.getFieldValue('file')?.fileList?.length > 0 && (
            <div className="mt-4">
              <Alert
                message="Operation Assignment Required"
                description="Please assign an operation to each file before uploading."
                type="info"
                showIcon
                className="mb-4"
              />
              <Text strong>Assign Operations to Files</Text>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded p-2">
                {addDocumentForm.getFieldValue('file').fileList.map(file => (
                  <div key={file.uid} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <Text>{file.name}</Text>
                    </div>
                    <Form.Item
                      className="mb-0 flex-1"
                      validateStatus={!fileOperationMappings[file.uid] ? 'error' : 'success'}
                      help={!fileOperationMappings[file.uid] ? 'Please select an operation' : ''}
                    >
                      <Select
                        placeholder="Select operation"
                        value={fileOperationMappings[file.uid]}
                        onChange={(value) => handleOperationSelect(file.uid, value)}
                        style={{ width: '100%' }}
                        status={!fileOperationMappings[file.uid] ? 'error' : ''}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children.toLowerCase().includes(input.toLowerCase())
                        }
                        loading={loading}
                      >
                        {documentOperations.map((operation) => (
                          <Option key={operation.id} value={operation.id}>
                            {operation.operation_number} - {operation.operation_description}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Modal>






      

      {/* Version Update Modal */}
      <Modal
        title="Update Program Version"
        open={isVersionUpdateModalVisible}
        onOk={handleVersionUpdateConfirm}
        onCancel={() => {
          setIsVersionUpdateModalVisible(false);
          setSelectedProgramForVersion(null);
          setVersionFile(null);
          setVersionNumber('');
          form.resetFields();
        }}
        okText="Update"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="file"
            label="Select Program File"
            rules={[{ required: true, message: 'Please select a file' }]}
          >
            <Upload
              maxCount={1}
              beforeUpload={(file) => {
                setVersionFile(file);
                return false;
              }}
              onRemove={() => setVersionFile(null)}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="version_number"
            label="Version Number"
            rules={[{ required: true, message: 'Please enter version number' }]}
          >
            <Input
              placeholder="Enter version number"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
            />
          </Form.Item>

          <div className="bg-gray-50 p-3 rounded mt-2">
            <h4 className="font-medium">Current Program Information</h4>
            <p><strong>Program:</strong> {selectedProgramForVersion?.name}</p>
            <p><strong>Current Version:</strong> {selectedProgramForVersion?.latest_version?.version_number || 'None'}</p>
          </div>
        </Form>
      </Modal>

      {/* Version History Modal */}
      <Modal
        title={`Version History - ${selectedProgramForVersion?.name}`}
        open={isVersionHistoryModalVisible}
        onCancel={() => {
          setIsVersionHistoryModalVisible(false);
          setProgramVersions([]);
        }}
        width={800}
        footer={[
          <Button 
            key="close" 
            onClick={() => setIsVersionHistoryModalVisible(false)}
          >
            Close
          </Button>,
          <Button
            key="update"
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              setIsVersionHistoryModalVisible(false);
              handleUpdateVersion(selectedProgramForVersion);
            }}
          >
            Add New Version
          </Button>
        ]}
      >
        <Table
          dataSource={programVersions}
          columns={versionHistoryColumns}
          rowKey="id"
          size="middle"
          loading={loading}
          pagination={false}
          className="mt-4"
        />
      </Modal>

      {/* Raw Material Modal */}
      <Modal
        title={<span style={{ fontWeight: 'bold' }}>Job Number Tag</span>}
        open={isRawMaterialModalVisible}
        onOk={handleDownloadRawMaterialJobCard}
        onCancel={() => setIsRawMaterialModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRawMaterialModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={handleDownloadRawMaterialJobCard}
            loading={isGeneratingRawMaterialPdf}
          >
            {isGeneratingRawMaterialPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        ]}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {isGeneratingRawMaterialPdf ? (
            <div className="flex items-center justify-center py-12">
              <Spin size="large" tip="Generating PDF..." />
            </div>
          ) : (
            <div className="p-4">
              {/* Add your Job Number Tag content here */}
            </div>
          )}
        </div>
      </Modal>

      {/* Job Number Tag Preview Modal */}
      <Modal
        title="Job Number Tag Preview"
        open={isRawMaterialModalVisible}
        onCancel={() => {
          setIsRawMaterialModalVisible(false);
        }}
        width={800}
        footer={[
          <Button key="cancelRM" onClick={() => setIsRawMaterialModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="editRM"
            type={isEditing ? 'default' : 'primary'}
            icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
            onClick={() => {
              if (isEditing) {
                // Save logic would go here
                message.success('Changes saved successfully');
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? 'Save Changes' : 'Edit'}
          </Button>,
          <Button
            key="downloadRM"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadRawMaterialJobCard}
            loading={isGeneratingRawMaterialPdf}
            disabled={isEditing}
          >
            {isGeneratingRawMaterialPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        ]}
      >

        
        {selectedJob ? (() => {
          const material = selectedJob.raw_materials?.[0] || {};
          const qrString = [
            `RM Part No: ${material.child_part_number || 'N/A'}`,
            `RM Part Name: ${material.description || material.material_name || 'N/A'}`,
            `RM Qty: ${material.quantity || 'N/A'}`,
            `Job Part No.: ${selectedJob.part_number || 'N/A'}`,
            `Order No.: ${selectedJob.production_order || 'N/A'}`,
            `Order Qty: ${selectedJob.launched_quantity || 'N/A'}`
          ].filter(Boolean).join('\n');

          // Table data structure matching the PDF layout
          const tableData = [
            // Header row with full width
            [{
              content: 'FAB/C - RM Traceability Card',
              colSpan: 4,
              styles: {
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                backgroundColor: '#f0f0f0',
                padding: '4px 0',
                minHeight: '16px',
                lineHeight: '16px'
              }
            }],
            // Data rows
            [
              { content: 'Job Part No.', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: selectedJob.part_number || 'N/A', styles: { padding: '4px 8px' }},
              { content: 'Location', styles: { fontWeight: 'bold', textAlign: 'right', padding: '4px 8px' }},
              { content: material.location || 'N/A', styles: { padding: '4px 8px' }}
            ],
            [
              { content: 'RM Name', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: material.material_name || 'N/A', colSpan: 3, styles: { padding: '4px 8px' }}
            ],
            [
              { content: 'RM Size', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: material.size || 'N/A', colSpan: 3, styles: { padding: '4px 8px' }}
            ],
            [
              { content: 'Heat No.', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: material.gr_number || 'N/A', styles: { padding: '4px 8px' }},
              { content: 'RM Qty', styles: { fontWeight: 'bold', textAlign: 'right', padding: '4px 8px' }},
              { content: material.quantity || 'N/A', styles: { padding: '4px 8px' }}
            ],
            [
              { content: 'Part No.', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: material.child_part_number || 'N/A', styles: { padding: '4px 8px' }},
              { content: 'Rev', styles: { fontWeight: 'bold', textAlign: 'right', padding: '4px 8px' }},
              { content: material.revision || 'N/A', styles: { padding: '4px 8px' }}
            ],
            [
              { content: 'Part Name', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: selectedJob.part_description || 'N/A', colSpan: 2, styles: { padding: '4px 8px' }},
              { content: '', rowSpan: 4, styles: { position: 'relative', padding: 0 }}
            ],
            [
              { content: 'Dept', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: selectedJob.department || 'N/A', colSpan: 2, styles: { padding: '4px 8px' }}
            ],
            [
              { content: 'Order No.', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: selectedJob.production_order || 'N/A', colSpan: 2, styles: { padding: '4px 8px' }}
            ],
            [
              { content: 'Order Qty', styles: { fontWeight: 'bold', padding: '4px 8px' }},
              { content: selectedJob.launched_quantity || 'N/A', colSpan: 2, styles: { padding: '4px 8px' }}
            ]
          ];

          return (
            <div className="max-h-[70vh] overflow-y-auto p-4 bg-gray-50">
              <div className="bg-white shadow-lg rounded-lg p-6 relative">
                {isEditing && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Editing Mode
                  </div>
                )}
                <div className="relative border-2 border-gray-800 bg-white p-1">
                  <table className="w-full text-sm border-collapse">
                    <colgroup>
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                    </colgroup>
                    <tbody>
                      {/* Header Row */}
                      <tr className="border-b border-gray-800">
                        <td 
                          colSpan={4}
                          className="text-center font-bold bg-gray-100 p-1"
                          style={{ fontFamily: '"Noto Sans Condensed", sans-serif', fontWeight: 700, fontSize: '1.1rem' }}
                        >
                          FAB/C - RM Traceability Card
                        </td>
                      </tr>
                      
                      {/* Data Rows */}
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">Job Part No.</td>
                        <td className="p-1 border-r border-gray-600">{selectedJob.part_number || 'N/A'}</td>
                        <td className="font-semibold p-1 text-right pr-2 border-r border-gray-600">Location</td>
                        <td className="p-1">{material.location || 'N/A'}</td>
                      </tr>
                      
                      {/* <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">RM Name</td>
                        <td colSpan={3} className="p-1">{material.material_name || 'N/A'}</td>
                      </tr> */}
                      
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">RM Size</td>
                        <td colSpan={3} className="p-1">{material.size || 'N/A'}</td>
                      </tr>
                      
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">Heat No.</td>
                        <td className="p-1 border-r border-gray-600">{material.gr_number || 'N/A'}</td>
                        <td className="font-semibold p-1 text-right pr-2 border-r border-gray-600">RM Qty</td>
                        <td className="p-1">{material.quantity || 'N/A'}</td>
                      </tr>
                      
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">RM Part No.</td>
                        <td className="p-1 border-r border-gray-600">{material.child_part_number || 'N/A'}</td>
                        <td className="font-semibold p-1 text-right pr-2 border-r border-gray-600">Rev</td>
                        <td className="p-1">{material.revision || 'N/A'}</td>
                      </tr>
                      
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">RM Part Name</td>
                        <td colSpan={2} className="p-1 border-r border-gray-600">{material.description || material.material_name || 'N/A'}</td>
                        <td rowSpan={4} className="border-l-2 border-gray-800 p-1" style={{ width: '220px' }}>
                          <div className="flex flex-col h-full">
                            <div className="flex-1 flex items-center justify-start pl-2">
                              <QRCodeSVG
                                value={qrString}
                                size={150}
                                level="M"
                                includeMargin={true}
                                className="border border-gray-400"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                      
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">Dept</td>
                        <td colSpan={2} className="p-1 border-r border-gray-600">{selectedJob.department || 'N/A'}</td>
                      </tr>
                      
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">Order No.</td>
                        <td colSpan={2} className="p-1 border-r border-gray-600">{selectedJob.production_order || 'N/A'}</td>
                      </tr>
                      
                      <tr className="border-b border-gray-800">
                        <td className="font-semibold p-1 border-r border-gray-600">Order Qty</td>
                        <td colSpan={2} className="p-1 border-r border-gray-600">{selectedJob.launched_quantity || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })() : (
          <Alert message="No job selected or job data is unavailable." type="warning" showIcon />
        )}
      </Modal>
    </div>
  );
};

export default Planning;


















