import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Button, Input, Layout, Modal, Tabs,
  Row, Col, Statistic, Badge, Space, Progress, Avatar,
  Tooltip, Divider, Alert, message, Tag, Table, Empty, DatePicker, Spin,
  Select, Radio, Drawer
} from 'antd';
import { 
  ClockCircleOutlined, UserOutlined, BellOutlined,
  ToolOutlined, CheckCircleOutlined, FileTextOutlined,
  ArrowLeftOutlined, InfoCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  FileText, Eye, Gauge, Settings, AlertOctagon,
  Clock, Activity, Power, ArrowUpCircle,
  AlertCircle, Ticket,
  Wrench, CalendarDays, Clock3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import IPID from '../operatorscreens/JobDetails/IPID';
import OperationDetails from '../operatorscreens/JobDetails/OperationDetails';
import PokaYokeChecklist from '../operatorscreens/JobDetails/PokaYokeChecklist';
import FeedbackModal from '../operatorscreens/FeedbackModal';
import moment from 'moment';
import MachineIssueModal from './MachineIssueModal';
import useAuthStore from '../../store/auth-store';
import useWebSocketStore from '../../store/websocket-store';
import useOperatorMppStore from '../../store/operatormpp-store';
import { formatDistanceToNow } from 'date-fns';
import DocumentsList from '../operatorscreens/JobDetails/DocumentsList';
const { Content } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;

// Mock data definition
const mockJobData = {
  jobId: 'JOB-2024-001',
  part_number: '211071570096',
  production_order: '10581931',
  sale_order: '07/3111202690/0010',
  wbs_element: 'Sale order :07/3111202690/0010 Part Desc :CAVITY SPACER 4-BUTTON -3  (17.4) Tot.No of Oprns :5',
  part_description: 'CAVITY SPACER 4-BUTTON -3',
  total_operations: 5,
  required_quantity: 2,
  launched_quantity: 2,
  plant_id: '1154',
  project: {
    id: 1,
    name: 'MWT-TWT-BCCT 2000X',
    priority: 1,
    delivery_date: '2025-02-12T15:50:49.636790'
  },
  partNumber: 'PA-0014',
  partName: 'HMC METAL TYPE',
  batchSize: 120,
  priority: 'High',
  jobDetails: {
    customer: 'ABC Manufacturing',
    orderNumber: 'ORD-2024-001',
    dueDate: '2024-01-15',
    orderQuantity: 120,
    completedQuantity: 75,
    remainingQuantity: 45,
    partnumber: '62805080AA',
    partname: 'HMC METAL TYPE',
    parameters: {
      orderNumber: 'ORD-2024-001',
      customer: 'ABC Manufacturing',
      dueDate: '2024-01-15'
    }
  },
  machine: {
    id: 'OP30',
    name: 'DMG DMU 60 eVo',
    status: 'IDLE',
    efficiency: 92,
    currentCycle: '02:45',
    nextMaintenance: '4hrs',
    alerts: 2,
    totalParts: 120,
    completedParts: 5,
    parameters: {
      speed: '1200 RPM',
      feed: '300 mm/min',
      temperature: '28°C'
    }
  },
  quality: {
    inspectionPoints: 5,
    completedInspections: 3,
    lastInspection: '11:30 AM',
    deviations: 0
  }
};

const operators = [
  { name: 'Ramesh', shift: 1 },
  { name: 'Suresh', shift: 2 },
  { name: 'Rajesh', shift: 3 },
  { name: 'Dinesh', shift: 1 },
  { name: 'Mahesh', shift: 2 },
];

const machines = [
  'DMG DMU 60 eVo',
  'Mazak VTC-300C',
  'Haas VF-2',
  'Okuma MB-46VAE',
  'Doosan DNM 4500'
];

const JobDetails = () => {
  // State management
  const [jobData, setJobData] = useState(mockJobData);
  const [activeTab, setActiveTab] = useState('operations');
  const [showPokaYoke, setShowPokaYoke] = useState(false);
  const [partCount, setPartCount] = useState(jobData.machine.completedParts);
  const [currentTime, setCurrentTime] = useState(moment().format('HH:mm:ss'));
  const [currentShift, setCurrentShift] = useState('Shift 1'); // You can make this dynamic based on time

  const [inputValue, setInputValue] = useState('');
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedbackList, setShowFeedbackList] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalHours, setTotalHours] = useState(0);

  const [showIssueModal, setShowIssueModal] = useState(false);

  const [machineTimer, setMachineTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const [quickFeedback, setQuickFeedback] = useState('');

  const [ticketLoading, setTicketLoading] = useState(false);

  const [jobOrderData, setJobOrderData] = useState(null);
  const [isLoadingJobData, setIsLoadingJobData] = useState(false);

  // Job selection states
  const [jobSelectionMode, setJobSelectionMode] = useState('scheduled');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [availableOperations, setAvailableOperations] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [isJobSelectorVisible, setIsJobSelectorVisible] = useState(false);
  const [isActivatingJob, setIsActivatingJob] = useState(false);
  const [showActivationWarning, setShowActivationWarning] = useState(false);

  // Add WebSocket store
  const { 
    machineStatus, 
    initializeWebSocket, 
    closeWebSocket, 
    isConnected,
    getIdleTime,
    error: wsError,
    fetchMachineOperations,
    maintenanceLoading,
    machineOperations,
    isLoadingMachineOperations
  } = useWebSocketStore();
  
  const { 
    currentMachine 
  } = useAuthStore();
  
  const {
    fetchAllOrders,
    fetchOrderByPartNumber,
    fetchOrderDetails,
    activateOrder,
    activateJob,
    isLoading: isMppLoading
  } = useOperatorMppStore();

  // Add this for idle timer display
  const [idleTime, setIdleTime] = useState(0);

  // Function to load all available jobs
  const loadAvailableJobs = useCallback(async () => {
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/all_orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch available jobs');
      }
      
      const data = await response.json();
      setAvailableJobs(data);
    } catch (error) {
      console.error('Error loading available jobs:', error);
      message.error('Failed to load available jobs');
    }
  }, []);

  // Function to load job details by part number
  const loadJobDetails = useCallback(async (partNumber) => {
    try {
      setIsLoadingJobData(true);
      const response = await fetch(`http://172.19.224.1:8002/api/v1/planning/search_order?part_number=${partNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        const jobDetailsData = data.orders[0];
        
        // Update available operations
        if (jobDetailsData.operations) {
          setAvailableOperations(jobDetailsData.operations.sort((a, b) => 
            a.operation_number - b.operation_number
          ));
        }
        
        // Update job data
        setSelectedJob(jobDetailsData);
        setJobOrderData(jobDetailsData);
        
        return jobDetailsData;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading job details:', error);
      message.error('Failed to load job details');
      return null;
    } finally {
      setIsLoadingJobData(false);
    }
  }, []);

  // Function to activate selected job and operation
  const activateSelectedJob = useCallback(async () => {
    if (!selectedJob || !selectedOperation) {
      message.error('Please select both a job and an operation');
      return;
    }
    
    setIsActivatingJob(true);
    
    try {
      const machineData = JSON.parse(localStorage.getItem('currentMachine')) || {};
      const machineId = machineData.id;
      
      if (!machineId) {
        throw new Error('Machine ID not found');
      }
      
      // Call the store's activateJob method instead of direct API call
      const activationResult = await activateJob(machineId, selectedOperation.id);
      
      if (!activationResult.success) {
        throw new Error(activationResult.error || 'Failed to activate job');
      }
      
      message.success('Job activated successfully');
      
      // Update the job data in the dashboard
      const jobDetails = await loadJobDetails(selectedJob.part_number);
      if (jobDetails) {
        setJobData({
          ...jobData,
          jobId: `JOB-${jobDetails.production_order}`,
          part_number: jobDetails.part_number,
          production_order: jobDetails.production_order,
          sale_order: jobDetails.sale_order,
          wbs_element: jobDetails.wbs_element,
          part_description: jobDetails.part_description,
          total_operations: jobDetails.total_operations,
          required_quantity: jobDetails.required_quantity,
          launched_quantity: jobDetails.launched_quantity,
          plant_id: jobDetails.plant_id,
          project: jobDetails.project,
          machine: {
            ...jobData.machine,
            completedParts: 0
          }
        });
        
        localStorage.setItem('currentJobData', JSON.stringify(jobDetails));
        
        // Close the job selector
        setIsJobSelectorVisible(false);
      }
      
    } catch (error) {
      console.error('Error activating job:', error);
      message.error('Failed to activate job: ' + error.message);
    } finally {
      setIsActivatingJob(false);
      setShowActivationWarning(false);
    }
  }, [selectedJob, selectedOperation, loadJobDetails, jobData, activateJob, setIsJobSelectorVisible, setIsActivatingJob, setShowActivationWarning]);

  // Toggle job selector visibility
  const toggleJobSelector = () => {
    console.log('Toggle job selector called. Current visibility:', isJobSelectorVisible);
    if (!isJobSelectorVisible) {
      console.log('Loading available jobs...');
      loadAvailableJobs();
    }
    setIsJobSelectorVisible(!isJobSelectorVisible);
    console.log('New visibility state set to:', !isJobSelectorVisible);
  };

  // Initialize WebSocket when component mounts
  useEffect(() => {
    const initializeData = async () => {
      const storedMachine = localStorage.getItem('currentMachine');
      if (storedMachine) {
        try {
          const machineData = JSON.parse(storedMachine);
          if (machineData?.id) {
            // Initialize WebSocket
            initializeWebSocket(machineData.id);
            
            // Fetch machine operations and job data
            console.log('Fetching machine operations for machine:', machineData.id);
            const result = await fetchMachineOperations(machineData.id);
            console.log('Machine operations result:', result);
            
            if (result?.success) {
              // Update job data
              if (result.data?.jobData) {
                setJobData(result.data.jobData);
                setJobOrderData(result.data.orders?.[0] || null);
              }
            }
          }
        } catch (error) {
          console.error('Error initializing data:', error);
        }
      }
    };

    initializeData();

    return () => {
      closeWebSocket();
    };
  }, []);

  // Monitor changes to job selector visibility
  useEffect(() => {
    console.log('Job selector visibility changed to:', isJobSelectorVisible);
  }, [isJobSelectorVisible]);

  // Update machine status from WebSocket
  useEffect(() => {
    if (machineStatus) {
      const storedMachine = localStorage.getItem('currentMachine');
      const machineData = storedMachine ? JSON.parse(storedMachine) : null;
      
      // Get current job data from localStorage or state
      const storedJobData = localStorage.getItem('currentJobData');
      const currentJobData = storedJobData ? JSON.parse(storedJobData) : jobData;
      
      const updatedJobData = {
        ...currentJobData,
        machine: {
          ...currentJobData?.machine,
          status: machineStatus.status,
          id: machineStatus.machine_id || machineData?.id,
          name: machineStatus.machine_name || machineData?.name,
          completedParts: machineStatus.part_count || 0,
          current_order: machineStatus.production_order || 'N/A',
          current_operation: machineStatus.operation_description || 'N/A'
        }
      };
      
      setJobData(updatedJobData);
      localStorage.setItem('jobData', JSON.stringify(updatedJobData));
    }
  }, [machineStatus]);

  useEffect(() => {
    if (jobData.machine.status === 'ON') {
      const interval = setInterval(() => {
        setMachineTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else {
      clearInterval(timerInterval);
      if (jobData.machine.status === 'PRODUCTION') {
        setMachineTimer(0);
      }
    }
    return () => clearInterval(timerInterval);
  }, [jobData.machine.status]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format('HH:mm:ss'));
      // You can also update shift here based on time
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update idle timer
  useEffect(() => {
    let timerInterval;
    
    // Always create the interval, but only increment if IDLE/ON
    timerInterval = setInterval(() => {
      if (machineStatus?.status === 'IDLE' || machineStatus?.status === 'ON') {
        setIdleTime(getIdleTime());
      }
    }, 1000);

    // Reset timer when status changes to PRODUCTION
    if (machineStatus?.status === 'PRODUCTION') {
      setIdleTime(0);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [machineStatus?.status, getIdleTime]);

  // Add new useEffect to fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      if (currentMachine?.id) {
        setIsLoadingJobData(true);
        try {
          const result = await fetchMachineOperations(currentMachine.id);
          if (result.success && result.data.orders && result.data.orders.length > 0) {
            // Get the first order from the response
            setJobOrderData(result.data.orders[0]);
            
            // Update operations data if needed
            if (result.data.operations) {
              // You could set operations data here if needed
            }
          }
        } catch (error) {
          console.error('Error fetching job data:', error);
          message.error('Failed to load job data');
        } finally {
          setIsLoadingJobData(false);
        }
      }
    };

    fetchJobData();
  }, [currentMachine?.id, fetchMachineOperations]);

  // Add an effect to handle machine operations updates
  useEffect(() => {
    const storedMachine = localStorage.getItem('currentMachine');
    if (storedMachine) {
      try {
        const machineData = JSON.parse(storedMachine);
        if (machineData?.id && (!jobData || !jobData.machine?.id)) {
          fetchMachineOperations(machineData.id);
        }
      } catch (error) {
        console.error('Error fetching machine operations:', error);
      }
    }
  }, [jobData]);

  // Add this useEffect near your other useEffects
  useEffect(() => {
    if (currentMachine?.id) {
      fetchMachineOperations(currentMachine.id);
    }
  }, [currentMachine?.id, fetchMachineOperations]);

  // Add console log to debug
  useEffect(() => {
    console.log('Machine Operations:', machineOperations);
  }, [machineOperations]);

  // Add effect to monitor machineOperations changes
  useEffect(() => {
    console.log('Machine Operations updated:', machineOperations);
  }, [machineOperations]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatIdleTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleUpdate = () => {
    const newCount = parseInt(inputValue);
    if (isNaN(newCount) || newCount > jobData.batchSize) {
      message.error('Invalid count value');
      return;
    }
    setPartCount(newCount);
    setInputValue('');
    message.success('Part count updated successfully');
  };

  const handleRaiseTicket = () => {
    message.success('Maintenance ticket raised successfully');
  };

  const getMachineStatusColor = (status) => {
    const statusConfig = {
      'OFF': { color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700' },
      'ON': { color: 'orange', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
      'IDLE': { color: 'orange', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
      'PRODUCTION': { color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' }
    };
    return statusConfig[status] || { color: 'default', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
  };

  const handleFeedbackSubmit = (feedback) => {
    const randomOperator = operators[Math.floor(Math.random() * operators.length)];
    const randomMachine = machines[Math.floor(Math.random() * machines.length)];
    
    const newFeedback = {
      operator: `${randomOperator.name} (Shift ${randomOperator.shift})`,
      machine: randomMachine,
      feedback: feedback,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    
    setFeedbackList([...feedbackList, newFeedback]);
    message.success('Feedback submitted successfully!');
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return;
    const hours = moment(end).diff(moment(start), 'hours', true);
    setTotalHours(parseFloat(hours.toFixed(2)));
  };

  const handleIssueSubmit = async (data) => {
    try {
      setTicketLoading(true);
      console.log('Ticket submitted:', data);
      message.success('Ticket submitted successfully');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      message.error('Failed to submit ticket');
    } finally {
      setTicketLoading(false);
      setShowIssueModal(false);
    }
  };

  const getTimerStyles = (status) => {
    switch (status) {
      case 'ON':
        return {
          containerClass: 'bg-yellow-50 border-yellow-200',
          textClass: 'text-yellow-700',
          iconClass: 'text-yellow-600'
        };
      case 'PRODUCTION':
        return {
          containerClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-700',
          iconClass: 'text-green-600'
        };
      case 'OFF':
        return {
          containerClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-700',
          iconClass: 'text-red-600'
        };
      default:
        return {
          containerClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-700',
          iconClass: 'text-gray-600'
        };
    }
  };

  // Add effect to restore data from localStorage on mount
  useEffect(() => {
    const storedJobData = localStorage.getItem('jobData');
    if (storedJobData) {
      try {
        setJobData(JSON.parse(storedJobData));
      } catch (error) {
        console.error('Error parsing stored job data:', error);
      }
    }
  }, []);

  const [lastUpdateTime, setLastUpdateTime] = useState('');

  // Update the last updated time every minute
  useEffect(() => {
    if (machineStatus?.last_updated) {
      const updateTimer = setInterval(() => {
        setLastUpdateTime(formatDistanceToNow(machineStatus.last_updated, { addSuffix: true }));
      }, 60000);

      return () => clearInterval(updateTimer);
    }
  }, [machineStatus?.last_updated]);

  const handleJobSelection = async (value) => {
    console.log('Job selected with ID:', value);
    const selectedJob = availableJobs.find(job => job.id === value);
    console.log('Selected job:', selectedJob);
    setSelectedJob(selectedJob);
    setSelectedOperation(null); // Reset operation when job changes
    if (selectedJob) {
      const jobDetails = await loadJobDetails(selectedJob.part_number);
      console.log('Job details loaded:', jobDetails);
      if (jobDetails && jobDetails.operations) {
        console.log('Available operations:', jobDetails.operations);
        setAvailableOperations(jobDetails.operations);
      }
    }
  };

  const handleOperationSelection = (value) => {
    console.log('Operation selected with ID:', value);
    const selectedOp = availableOperations.find(op => op.id === value);
    console.log('Selected operation:', selectedOp);
    setSelectedOperation(selectedOp);
  };

  return (
    <Layout className="h-screen flex flex-col bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{currentTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserOutlined className="text-blue-500" />
                <span className="font-medium">{currentShift}</span>
              </div>
              <Tooltip title={`WebSocket: ${isConnected ? 'Connected' : 'Disconnected'}${machineStatus?.error ? ` (${machineStatus.error})` : ''}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* Job Selection Button */}
        <Button
          type="primary"
          onClick={toggleJobSelector}
          className="bg-blue-500"
        >
          Select Job
        </Button>
      </div>

      {/* Main Content Area */}
      <Content className="p-6 flex-1 overflow-hidden">
        <div className="h-full flex flex-col gap-6">
          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6" style={{ minHeight: '55vh' }}>
            {/* Machine Status Card */}
            <div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wrench className="text-blue-500" />
                  <span className="font-semibold">Machine Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    getMachineStatusColor(machineStatus?.status).bgColor
                  }`}>
                    <span className={`w-2 h-2 rounded-full bg-${
                      getMachineStatusColor(machineStatus?.status).color
                    }-500 animate-pulse`} />
                    <span className={getMachineStatusColor(machineStatus?.status).textColor}>
                      {machineStatus?.status || 'N/A'}
                    </span>
                  </div>
                  <Tooltip title={isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  </Tooltip>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Machine Image and Basic Info */}
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="relative h-32">
                    <img 
                      src="/dmg.png" 
                      alt="Machine"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="text-lg font-bold text-white">{machineStatus?.machine_name || 'Loading...'}</div>
                      <div className="text-white/80 text-sm">ID: {machineStatus?.machine_id || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Machine Details */}
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-sm font-medium text-gray-600">Machine Details</span>
                    <Tag color={machineStatus?.job_status === 1 ? 'green' : 'orange'}>
                      {machineStatus?.job_status === 1 ? 'Active' : 'Pending'}
                    </Tag>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Active Program</div>
                      <div className="font-medium truncate">
                        {machineStatus?.active_program || 'x'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Job in Progress</div>
                      <div className="font-medium truncate">
                        {machineStatus?.job_in_progress || 'None'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Launched Quantity</div>
                      <div className="font-medium">
                        {machineStatus?.launched_quantity || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Part Count</div>
                      <div className="font-medium">
                        {machineStatus?.part_count || '0'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Operation</div>
                      <div className="font-medium truncate">
                        {machineStatus?.operation_number 
                          ? `${machineStatus.operation_number} - ${machineStatus.operation_description || ''}`
                          : 'No Operation'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Last Updated</div>
                      <div className="font-medium text-xs">
                        {machineStatus?.last_updated 
                          ? formatDistanceToNow(machineStatus.last_updated, { addSuffix: true })
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>

                  {machineStatus?.part_number && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">Production Order</div>
                      <div className="font-medium">
                        {machineStatus.production_order || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Part Details</div>
                      <div className="text-sm">
                        {machineStatus.part_number} - {machineStatus.part_description || 'N/A'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timer Display - Always Visible */}
                <div className={`border rounded-lg p-3 ${getTimerStyles(machineStatus?.status).containerClass}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${getTimerStyles(machineStatus?.status).iconClass}`} />
                      <span className={`text-sm ${getTimerStyles(machineStatus?.status).textClass}`}>
                        {machineStatus?.status === 'ON' && !machineStatus?.job_in_progress
                          ? 'Idle Time'
                          : machineStatus?.status === 'PRODUCTION'
                          ? 'Production Time'
                          : machineStatus?.status === 'OFF'
                          ? 'Machine OFF'
                          : 'Status Unknown'}
                      </span>
                    </div>
                    <div className={`text-lg font-mono font-bold ${getTimerStyles(machineStatus?.status).textClass}`}>
                      {machineStatus?.status === 'OFF' ? '--:--:--' : formatIdleTime(idleTime)}
                    </div>
                  </div>
                  {/* Status Indicator */}
                  <div className={`text-xs mt-1 ${getTimerStyles(machineStatus?.status).textClass}`}>
                    Status: {machineStatus?.status || 'N/A'}
                  </div>
                </div>

                {/* Raise Ticket Button */}
                <Button
                  type="primary"
                  danger
                  icon={<AlertTriangle className="w-4 h-4" />}
                  onClick={() => setShowIssueModal(true)}
                  className="w-full"
                >
                  Raise Ticket
                </Button>

                {/* WebSocket Error Display */}
                {wsError && (
                  <div className="text-xs text-red-500 mt-2">
                    Connection Error: {wsError}
                  </div>
                )}
              </div>
            </div>

            {/* Current Job Details Card */}
            <div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-sky-100">
              <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-100 to-sky-50">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-600" />
                  <span className="font-semibold">Current Job</span>
                </div>
                <div className="flex items-center gap-2">
                  {isLoadingJobData ? (
                    <Tag color="blue">Loading...</Tag>
                  ) : jobOrderData ? (
                    <Tag color={jobOrderData.priority === 1 ? 'red' : 'blue'}>
                      Priority {jobOrderData.priority || 'N/A'}
                    </Tag>
                  ) : (
                    <Tag color="blue">No Data</Tag>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {isLoadingJobData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse space-y-4 w-full">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ) : jobOrderData ? (
                  <>
                    {/* Part Information */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Part Number</div>
                          <div className="text-sm font-semibold">{jobOrderData.part_number}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Production Order</div>
                          <div className="text-sm font-semibold">{jobOrderData.production_order}</div>
                        </div>
                      </div>
                    </div>

                    {/* Material Description */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500">Material Description</div>
                      <Tooltip title={jobOrderData.material_description}>
                        <div className="text-sm font-medium truncate">
                          {jobOrderData.material_description || 'N/A'}
                        </div>
                      </Tooltip>
                    </div>

                    {/* Quantity Information */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Required Qty</div>
                          <div className="text-sm font-semibold text-blue-600">
                            {jobOrderData.required_qty}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Launched Qty</div>
                          <div className="text-sm font-semibold text-green-600">
                            {jobOrderData.launched_qty}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          percent={Math.round((jobOrderData.launched_qty / jobOrderData.required_qty) * 100)}
                          size="small"
                          strokeColor={{
                            '0%': '#60a5fa',
                            '100%': '#2563eb',
                          }}
                        />
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-500">Sales Order</div>
                          <div className="text-sm font-medium">{jobOrderData.sales_order}</div>
                        </div>
                        <Divider className="my-2" />
                        <div>
                          <div className="text-xs text-gray-500">WBS Element</div>
                          <Tooltip title={jobOrderData.wbs_element}>
                            <div className="text-sm font-medium truncate">
                              {jobOrderData.wbs_element}
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    {/* Project Information */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Project Details</div>
                        <Tag color="blue">Total Ops: {jobOrderData.project_details?.total_operations || 'N/A'}</Tag>
                      </div>
                      <div className="text-sm font-medium">{jobOrderData.project_details?.project_name || 'N/A'}</div>
                    </div>

                    {/* Operation Details */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Current Operation</div>
                        {machineOperations?.inprogress?.length > 0 && (
                          <Tag color="processing">In Progress</Tag>
                        )}
                      </div>

                      {isLoadingMachineOperations ? (
                        <div className="flex justify-center py-2">
                          <Spin size="small" />
                          <span className="ml-2 text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : machineOperations?.inprogress?.length > 0 ? (
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-gray-500">Operation Number</div>
                            <div className="text-sm font-medium">
                              {`OP ${machineOperations.inprogress[0].operation_number}`}
                            </div>
                          </div>
                          <Divider className="my-2" />
                          <div>
                            <div className="text-xs text-gray-500">Description</div>
                            <Tooltip title={machineOperations.inprogress[0].description}>
                              <div className="text-sm font-medium truncate">
                                {machineOperations.inprogress[0].description}
                              </div>
                            </Tooltip>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-500">Schedule Info</div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div>
                                <div className="text-xs text-gray-400">Start</div>
                                <div className="text-xs font-medium">
                                  {moment(machineOperations.inprogress[0].planned_start_time)
                                    .format('DD MMM YYYY')}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">End</div>
                                <div className="text-xs font-medium">
                                  {moment(machineOperations.inprogress[0].planned_end_time)
                                    .format('DD MMM YYYY')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          No operation in progress
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Empty description="No job data available" />
                    <Button 
                      type="primary" 
                      className="mt-4"
                      onClick={() => fetchMachineOperations(currentMachine?.id)}
                      loading={isLoadingJobData}
                    >
                      Refresh Data
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Production Progress Card */}
            <div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-sky-100">
              <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-100 to-sky-50">
                <div className="flex items-center gap-2">
                  <Activity className="text-blue-600" />
                  <span className="font-semibold">Production Progress</span>
                </div>
                <Tag color="blue">
                  {partCount} of {jobData.batchSize}
                </Tag>
              </div>

              <div className="p-4 space-y-4">
                {/* Progress Circle */}
                <div className="flex justify-center py-2">
                  <Progress 
                    type="dashboard"
                    percent={Math.round((partCount / jobData.batchSize) * 100)}
                    strokeColor={{
                      '0%': '#60a5fa',
                      '100%': '#2563eb',
                    }}
                    width={160}
                  />
                </div>

                {/* Statistics Grid - Enlarged */}
                <div className="bg-white rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Tooltip title="Total parts to be produced">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium mb-1">Total</div>
                        <div className="text-2xl font-bold text-blue-700">{jobData.batchSize}</div>
                      </div>
                    </Tooltip>
                    <Tooltip title="Parts completed so far">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600 font-medium mb-1">Completed</div>
                        <div className="text-2xl font-bold text-green-700">{partCount}</div>
                      </div>
                    </Tooltip>
                    <Tooltip title="Parts remaining">
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm text-orange-600 font-medium mb-1">Remaining</div>
                        <div className="text-2xl font-bold text-orange-700">
                          {jobData.batchSize - partCount}
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>

                {/* Production Timeline */}
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs font-medium flex items-center gap-2 text-gray-500 mb-3">
                    <CalendarDays className="w-4 h-4" />
                    Production Timeline
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      placeholder="Start Date"
                      className="w-full"
                      showTime
                      value={startDate}
                      onChange={(date) => {
                        setStartDate(date);
                        calculateHours(date, endDate);
                      }}
                    />
                    <DatePicker
                      placeholder="End Date"
                      className="w-full"
                      showTime
                      value={endDate}
                      onChange={(date) => {
                        setEndDate(date);
                        calculateHours(startDate, date);
                      }}
                    />
                  </div>

                  {totalHours > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg mt-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">
                        Total Time: <strong>{totalHours} hours</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Part Count Update */}
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">Update Part Count</div>
                  <Space.Compact className="w-full">
                    <Input 
                      placeholder="Enter count"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      type="number"
                      max={jobData.batchSize}
                      className="flex-1"
                    />
                    <Button 
                      type="primary"
                      onClick={handleUpdate}
                      className="bg-blue-500"
                    >
                      Update
                    </Button>
                  </Space.Compact>
                </div>
              </div>
            </div>

{/* Quality Status and Poka Yoke Card */}
<div className="bg-sky-50 rounded-xl shadow-xl overflow-hidden border border-sky-100">
              <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-100 to-sky-50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-blue-600" />
                  <span className="font-semibold">Poka Yoke & Feedback</span>
                </div>
                {/* <Tag color="blue">
                  {jobData.quality.completedInspections} / {jobData.quality.inspectionPoints} Checks
                </Tag> */}
              </div>

              <div className="p-4 space-y-3">
                {/* Poka Yoke Button */}
                <Button 
                    type="primary"
                    onClick={() => setShowPokaYoke(true)}
                    className="w-full bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300 flex items-center justify-center gap-2 h-auto py-3"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Open Poka Yoke Checklist</span>
                      <span className="text-xs text-blue-400">Review and complete poka yoke checkpoints</span>
                    </div>
                  </Button>
                  {/* Operator Feedback Section */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Operator Feedback</span>
                        <Badge count={feedbackList.length} style={{ backgroundColor: '#52c41a' }} />
                      </div>
                    </div>
                    <Input.TextArea
                      value={quickFeedback}
                      onChange={(e) => setQuickFeedback(e.target.value)}
                      placeholder="Share your feedback..."
                      autoSize={{ minRows: 4, maxRows: 6 }}
                      className="mb-3"
                    />
                    <Button 
                      type="primary"
                      className="w-full bg-blue-500"
                      onClick={() => {
                        if (quickFeedback.trim()) {
                          handleFeedbackSubmit(quickFeedback);
                          setQuickFeedback('');
                        }
                      }}
                    >
                      Submit Feedback
                    </Button>
                  </div>
                

                {/* Recent Feedback List with increased height */}
                <div className="bg-white rounded-lg p-3 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Recent Feedback</span>
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => setShowFeedbackList(true)}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[380px] overflow-auto">
                    {feedbackList.slice(-3).reverse().map((feedback, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-2 text-sm">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <div className="flex items-center gap-1">
                            <UserOutlined />
                            {feedback.operator}
                          </div>
                          <span>{moment(feedback.timestamp).fromNow()}</span>
                        </div>
                        <div className="text-gray-700">{feedback.feedback}</div>
                      </div>
                    ))}
                    {feedbackList.length === 0 && (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No feedback yet"
                        className="my-4"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>

          {/* Tabs Section */}
          <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden border border-gray-100">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              className="h-full flex flex-col"
              tabBarStyle={{ 
                background: '#f8fafc', 
                borderBottom: '1px solid #e2e8f0',
                padding: '0 16px',
                marginBottom: 0
              }}
            >
              <TabPane 
                tab={
                  <span className="flex items-center gap-2">
                    <Settings size={16} />
                    Operations
                  </span>
                } 
                key="operations"
              >
                <OperationDetails jobData={jobData} jobOrderData={jobOrderData} />
              </TabPane>

              {/* New Documents Tab */}
              <TabPane
                tab={
                  <span className="flex items-center gap-2">
                    <FileText size={16} />
                    Documents
                  </span>
                }
                key="documents"
              >
                <DocumentsList jobData={jobData} jobOrderData={jobOrderData} />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </Content>
      {/* Feedback Modal */}
      <FeedbackModal 
            visible={isFeedbackModalVisible} 
            onClose={() => setIsFeedbackModalVisible(false)} 
            onSubmit={handleFeedbackSubmit}
            feedbackList={feedbackList}
          />

      {/* Poka-Yoke Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="text-blue-500" />
            <span>Poka Yoke Checklist</span>
          </div>
        }
        open={showPokaYoke}
        onCancel={() => setShowPokaYoke(false)}
        footer={null}
        width={800}
        className="quality-modal"
      >
        <PokaYokeChecklist jobId={jobData.jobId} />
      </Modal>

      {/* Feedback History Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="text-blue-500" />
            <span>Feedback History</span>
          </div>
        }
        open={showFeedbackList}
        onCancel={() => setShowFeedbackList(false)}
        footer={null}
        width={800}
      >
        {feedbackList.length > 0 ? (
          <div className="space-y-4">
            <Table
              dataSource={feedbackList.map((item, index) => ({
                key: index,
                operator: item.operator,
                machine: item.machine,
                feedback: item.feedback,
                timestamp: item.timestamp
              }))}
              columns={[
                {
                  title: 'Operator (Shift)',
                  dataIndex: 'operator',
                  key: 'operator',
                  width: '20%',
                  render: (text) => (
                    <div className="flex items-center gap-2">
                      <UserOutlined className="text-blue-500" />
                      <span className="font-medium">{text}</span>
                    </div>
                  )
                },
                {
                  title: 'Machine',
                  dataIndex: 'machine',
                  key: 'machine',
                  width: '20%',
                  render: (text) => (
                    <div className="flex items-center gap-2">
                      <ToolOutlined className="text-blue-500" />
                      <span className="font-medium">{text}</span>
                    </div>
                  )
                },
                {
                  title: 'Feedback',
                  dataIndex: 'feedback',
                  key: 'feedback',
                  width: '40%',
                  render: (text) => (
                    <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
                      <p className="text-gray-700 whitespace-pre-wrap">{text}</p>
                    </div>
                  )
                },
                {
                  title: 'Timestamp',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  width: '20%',
                  render: (text) => (
                    <div className="flex items-center gap-2">
                      <ClockCircleOutlined className="text-blue-500" />
                      <span className="text-gray-600">{moment(text).format('MMM DD, YYYY HH:mm')}</span>
                    </div>
                  )
                }
              ]}
              pagination={false}
              className="feedback-table"
            />
          </div>
        ) : (
          <Empty description="No feedback available" />
        )}
      </Modal>

      {/* Machine Issue Modal */}
      <MachineIssueModal
        visible={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        machineId={currentMachine?.id}
        partNumber={jobData?.part_number}
      />

      {/* Job Selector Drawer */}
      <Drawer
        title="Select Job"
        placement="right"
        width={600}
        onClose={() => setIsJobSelectorVisible(false)}
        open={isJobSelectorVisible}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={() => setIsJobSelectorVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              disabled={!selectedJob || !selectedOperation}
              loading={isActivatingJob}
              onClick={() => setShowActivationWarning(true)}
            >
              Activate
            </Button>
          </Space>
        }
      >
        <div className="space-y-6">
          <Radio.Group 
            value={jobSelectionMode} 
            onChange={(e) => setJobSelectionMode(e.target.value)}
            className="mb-4"
          >
            <Radio.Button value="scheduled">Scheduled Jobs</Radio.Button>
            <Radio.Button value="custom">Select Other Job</Radio.Button>
          </Radio.Group>
          
          {jobSelectionMode === 'custom' && (
            <div className="space-y-6">
              <div>
                <div className="mb-2 font-medium">Select Job</div>
                <Select
                  className="w-full"
                  placeholder="Select a job"
                  loading={isMppLoading}
                  onChange={(value) => handleJobSelection(value)}
                  value={selectedJob?.id}
                >
                  {availableJobs.map(job => (
                    <Option key={job.id} value={job.id}>
                      {job.production_order} | {job.part_number}
                    </Option>
                  ))}
                </Select>
              </div>
              
              {selectedJob && (
                <div>
                  <div className="mb-2 font-medium">Select Operation</div>
                  <Select
                    className="w-full"
                    placeholder="Select an operation"
                    onChange={(value) => handleOperationSelection(value)}
                    value={selectedOperation?.id}
                  >
                    {availableOperations.map(op => (
                      <Option key={op.id} value={op.id}>
                        OP{op.operation_number}: {op.operation_description}
                      </Option>
                    ))}
                  </Select>
                  
                  {selectedOperation && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-700">Operation Details</div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500">Operation Number</div>
                          <div>{selectedOperation.operation_number}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">work centre</div>
                          <div>{selectedOperation.work_center}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Setup Time</div>
                          <div>{selectedOperation.setup_time} hrs</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Cycle Time</div>
                          <div>{selectedOperation.ideal_cycle_time} hrs</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {selectedJob && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">Selected Job Information</div>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">Production Order</div>
                    <div className="font-medium">{selectedJob.production_order}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Part Number</div>
                    <div className="font-medium">{selectedJob.part_number}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="font-medium">{selectedJob.part_description}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">Required Qty</div>
                    <div className="font-medium">{selectedJob.required_quantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Launched Qty</div>
                    <div className="font-medium">{selectedJob.launched_quantity}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Project</div>
                  <div className="font-medium">{selectedJob.project?.name || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>
      
      {/* Activation Warning Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <WarningOutlined />
            <span>Activate Job Warning</span>
          </div>
        }
        open={showActivationWarning}
        onCancel={() => setShowActivationWarning(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowActivationWarning(false)}>
            Cancel
          </Button>,
          <Button
            key="activate"
            type="primary"
            danger
            loading={isActivatingJob}
            onClick={activateSelectedJob}
          >
            Confirm Activation
          </Button>
        ]}
      >
        <div className="py-4">
          <Alert
            message="Warning: This action will activate the selected job and operation."
            description={
              <div className="mt-2">
                <p>You are about to activate:</p>
                <ul className="list-disc ml-6 mt-2">
                  <li>Job: {selectedJob?.production_order}</li>
                  <li>Part: {selectedJob?.part_number} - {selectedJob?.part_description}</li>
                  <li>Operation: {selectedOperation?.operation_number} - {selectedOperation?.operation_description}</li>
                </ul>
                <p className="mt-2">This will affect the machine's current status. Are you sure?</p>
              </div>
            }
            type="warning"
            showIcon
          />
        </div>
      </Modal>

      {/* Debugging Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
          <div>WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
          <div>Last Status: {machineStatus?.status}</div>
          {machineStatus?.error && <div className="text-red-400">Error: {machineStatus.error}</div>}
        </div>
      )}

      <style jsx global>{`
        .ant-tabs-content {
          height: 100%;
        }
        
        .ant-tabs-tabpane {
          height: 100%;
        }

        .quality-modal .ant-modal-content {
          border-radius: 12px;
        }

        .quality-modal .ant-modal-header {
          border-radius: 12px 12px 0 0;
        }

        /* Card hover effects */
        .ant-card {
          transition: all 0.3s ease;
        }

        .ant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Button hover effects */
        .ant-btn {
          transition: all 0.2s ease;
        }

        .ant-btn:hover {
          transform: translateY(-1px);
        }

        /* Progress bar animations */
        .ant-progress-bg {
          transition: all 0.3s ease;
        }

        /* Tag hover effects */
        .ant-tag {
          transition: all 0.2s ease;
        }

        .ant-tag:hover {
          transform: scale(1.05);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* Tab animations */
        .ant-tabs-tab {
          transition: all 0.2s ease;
        }

        .ant-tabs-tab:hover {
          color: #1890ff;
          transform: translateY(-1px);
        }

        /* Modal animations */
        .ant-modal {
          transform-origin: top;
        }

        .ant-modal-enter,
        .ant-modal-appear {
          opacity: 0;
          transform: scale(0.95);
        }

        .ant-modal-enter-active,
        .ant-modal-appear-active {
          opacity: 1;
          transform: scale(1);
          transition: opacity 0.2s, transform 0.2s;
        }

        /* Stats animation */
        .ant-statistic-content {
          transition: all 0.3s ease;
        }

        .ant-statistic:hover .ant-statistic-content {
          transform: scale(1.05);
        }

        /* Badge animations */
        .ant-badge-status-dot {
          transition: all 0.3s ease;
        }

        .ant-badge:hover .ant-badge-status-dot {
          transform: scale(1.2);
        }

        /* Divider styling */
        .ant-divider {
          margin: 16px 0;
          border-top: 1px solid #f0f0f0;
        }

        /* Card header styling */
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          min-height: 48px;
        }

        /* Button group spacing */
        .ant-space {
          gap: 8px !important;
        }

        /* Dashboard layout */
        .dashboard-layout {
          min-height: 100vh;
        }

        /* Header styling */
        .site-header {
          background: #fff;
          padding: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        /* Content area */
        .site-content {
          padding: 24px;
          background: #f0f2f5;
        }

        /* Card grid responsive */
        @media (max-width: 1200px) {
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .grid-cols-4 {
            grid-template-columns: repeat(1, 1fr);
          }
        }

        /* Override Ant Design's default font family */
        :root {
          --font-family: 'CustomFont', system-ui, sans-serif;
        }

        body {
          font-family: var(--font-family);
        }

        .ant-btn,
        .ant-input,
        .ant-modal-title,
        .ant-tabs-tab,
        .ant-statistic-title,
        .ant-statistic-content,
        .ant-card-head-title,
        .ant-tag,
        .ant-badge,
        .ant-divider,
        .ant-modal-content,
        .ant-space {
          font-family: var(--font-family) !important;
        }

        .feedback-table .ant-table {
          background: white;
          border-radius: 8px;
        }

        .feedback-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
        }

        .feedback-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9;
        }

        .feedback-table .ant-table-tbody > tr > td {
          vertical-align: top;
          padding: 16px;
        }

        .feedback-table .ant-table-tbody > tr {
          border-bottom: 1px solid #e5e7eb;
        }

        /* Responsive adjustments for Production Progress card */
        @media (max-width: 1400px) {
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .grid-cols-4 {
            grid-template-columns: 1fr;
          }
          
          .grid-cols-3 {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .ant-progress {
            width: 120px !important;
          }
        }

        @media (max-width: 480px) {
          .grid-cols-3 {
            grid-template-columns: repeat(1, 1fr);
          }
          
          .ant-space-compact {
            flex-direction: column;
          }
          
          .ant-space-compact .ant-input {
            width: 100%;
            margin-bottom: 8px;
          }
          
          .ant-space-compact .ant-btn {
            width: 100%;
          }
        }

        /* Enhanced spacing and transitions */
        .bg-sky-50 {
          transition: all 0.3s ease;
        }

        .ant-progress-text {
          font-size: 20px !important;
          font-weight: 600;
        }

        .ant-picker {
          transition: all 0.2s ease;
        }

        .ant-picker:hover {
          border-color: #0ea5e9;
        }

        .ant-input:focus {
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
        }

        /* Card height adjustments */
        .bg-sky-50.rounded-xl {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .bg-sky-50.rounded-xl > div:last-child {
          flex: 1;
          overflow-y: auto;
        }

        /* Custom scrollbar for cards */
        .bg-sky-50.rounded-xl > div:last-child::-webkit-scrollbar {
          width: 6px;
        }

        .bg-sky-50.rounded-xl > div:last-child::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .bg-sky-50.rounded-xl > div:last-child::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .bg-sky-50.rounded-xl > div:last-child::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Ensure content spacing */
        .bg-sky-50.rounded-xl .p-4 {
          padding: 1rem;
        }

        /* Responsive height adjustments */
        @media (max-height: 900px) {
          .grid.grid-cols-4 {
            height: 70vh;
          }
        }

        @media (max-height: 800px) {
          .grid.grid-cols-4 {
            height: 75vh;
          }
        }

        /* Ensure Progress circle doesn't get too large */
        .ant-progress.ant-progress-circle {
          max-height: 140px;
        }

        /* Improve spacing in production progress card */
        .space-y-4 > * {
          margin-bottom: 1rem;
        }

        .space-y-4 > *:last-child {
          margin-bottom: 0;
        }

        /* Responsive Layout Adjustments */
        .h-screen {
          min-height: 100vh;
          height: auto;
        }

        /* Card Responsiveness */
        .bg-sky-50.rounded-xl {
          height: auto;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        /* Improved Grid Layout */
        @media (max-width: 1536px) {
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .bg-sky-50.rounded-xl {
            min-height: 450px;
          }
        }

        @media (max-width: 1280px) {
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .ant-progress.ant-progress-circle {
            width: 120px !important;
            height: 120px !important;
          }
        }

        @media (max-width: 768px) {
          .grid-cols-4 {
            grid-template-columns: 1fr;
          }
          
          .bg-sky-50.rounded-xl {
            min-height: auto;
          }

          .p-6 {
            padding: 1rem;
          }
          
          .gap-6 {
            gap: 1rem;
          }

          /* Adjust statistics grid */
          .grid-cols-3 {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .text-lg {
            font-size: 0.875rem;
          }
          
          /* Compact date picker layout */
          .grid-cols-2.gap-2 {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
        }

        /* Enhanced Mobile Experience */
        @media (max-width: 480px) {
          .text-2xl {
            font-size: 1.5rem;
          }
          
          .grid-cols-3 {
            grid-template-columns: repeat(1, 1fr);
            gap: 0.5rem;
          }
          
          .bg-white.rounded-lg.p-3 {
            padding: 0.75rem;
          }
          
          .space-y-4 > * {
            margin-bottom: 0.75rem;
          }
          
          /* Stack buttons vertically */
          .flex.gap-2 {
            flex-direction: column;
          }
          
          .flex.gap-2 > * {
            width: 100%;
          }
          
          /* Adjust modal width */
          .ant-modal {
            max-width: 90vw !important;
            margin: 1rem auto !important;
          }
        }

        /* Fluid Typography */
        @media (max-width: 768px) {
          html {
            font-size: 14px;
          }
        }

        /* Enhanced Scrolling */
        .overflow-auto {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        /* Card Animations */
        .bg-sky-50.rounded-xl {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .bg-sky-50.rounded-xl:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                      0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Loading States */
        .ant-spin-spinning {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Better Touch Targets */
        @media (max-width: 768px) {
          .ant-btn {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .ant-input {
            min-height: 44px;
          }
          
          .ant-picker {
            min-height: 44px;
          }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .bg-sky-50 {
            background-color: rgba(14, 165, 233, 0.05);
          }
          
          .bg-white {
            background-color: rgba(255, 255, 255, 0.05);
          }
        }

        /* Print Styles */
        @media print {
          .bg-sky-50.rounded-xl {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }

        /* Improved Focus States */
        :focus {
          outline: 2px solid #0ea5e9;
          outline-offset: 2px;
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Container Query Support */
        @container (min-width: 400px) {
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Better Card Layout */
        .card-content {
          display: grid;
          gap: 1rem;
          height: 100%;
        }

        /* Improved Spacing */
        .space-y-4 > * + * {
          margin-top: 1rem;
        }

        /* Enhanced Accessibility */
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </Layout>
  );
};

export default JobDetails; 