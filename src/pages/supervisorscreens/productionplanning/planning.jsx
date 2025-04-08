import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, Upload, message,
  Typography, Tag, Tooltip, Form, Drawer, Descriptions,
  Badge, Alert, Spin, Progress, Divider, Collapse, DatePicker, Pagination
} from 'antd';
import {
  UploadOutlined, FileTextOutlined, EditOutlined,
  SaveOutlined, PlusOutlined, ClockCircleOutlined,
  CalendarOutlined, BarChartOutlined,
  ToolOutlined, DownloadOutlined, DeleteOutlined,
  ScheduleOutlined, ReloadOutlined, EyeOutlined,
  AppstoreOutlined, CheckOutlined
} from '@ant-design/icons';
import {
  Timer, AlertTriangle, CheckCircle2, 
  Gauge, Settings, Users, Calendar,  CheckCircle, Hourglass, CalendarCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JobOperationsTable from '../../../components/ProductionPlanning/JobOperationsTable';
import OperationMPPDetails from '../../../components/ProductionPlanning/OperationMPPDetails';
import ResourceUtilization from '../../../components/ProductionPlanning/ResourceUtilization';
import CapacityPlanning from '../../../components/ProductionPlanning/CapacityPlanning';
import { mockJobData, mockPartNumbers, mockMachines } from '../../../data/mockPlanningData';
import usePlanningStore from '../../../store/planning-store';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import belLogo from '../../../assets/belUrl.png';
import { QRCodeSVG } from 'qrcode.react';
import * as QRCodeNode from 'qrcode';
import { create } from 'zustand';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Planning = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMPPDetails, setShowMPPDetails] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [activeTab, setActiveTab] = useState('jobDetails');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [programCurrentPage, setProgramCurrentPage] = useState(1);
  const { 
    fetchAllOrders, 
    searchOrders, 
    partNumbers, 
    searchResults,
    isLoading,
    fetchActiveParts,
    activeParts,
    changePartStatus 
  } = usePlanningStore();
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isAddToolModalVisible, setIsAddToolModalVisible] = useState(false);
  const [isEditToolModalVisible, setIsEditToolModalVisible] = useState(false);
  const [isAddProgramModalVisible, setIsAddProgramModalVisible] = useState(false);
  const [isEditProgramModalVisible, setIsEditProgramModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [addToolForm] = Form.useForm();
  const [editToolForm] = Form.useForm();
  const [addProgramForm] = Form.useForm();
  const [editProgramForm] = Form.useForm();
  const [tools, setTools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdcData, setPdcData] = useState(null);
  // Add fetchPartProductionPDC from the planning store
  const fetchPartProductionPDC = usePlanningStore((state) => state.fetchPartProductionPDC);

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
      
      if (!isLessThan20MB) {
        message.error('File must be smaller than 20MB!');
      }
      
      return (isValidFileType && isLessThan20MB) || Upload.LIST_IGNORE;
    },
    showUploadList: true,
  };

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
            // Store the production_order with the PDC data
            const pdcWithProductionOrder = {
              ...pdcResponse[0],
              production_order: pdcResponse[0].production_order || selectedJob.production_order,
              part_number: pdcResponse[0].part_number || selectedJob.part_number
            };
            setPdcData(pdcWithProductionOrder);
            console.log('PDC data fetched for current job:', pdcWithProductionOrder);
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

  const getJobStatus = (partNumber) => {
    const activePart = activeParts.find(part => part.part_number === partNumber);
    return activePart ? activePart.status : 'unknown';
  };

  const handleStatusChange = (partNumber, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const modalTitle = currentStatus === 'active' ? 'Deactivate Part' : 'Activate Part';
    const modalContent = currentStatus === 'active' 
      ? 'Are you sure you want to deactivate this part?' 
      : 'Are you sure you want to activate this part?';

    Modal.confirm({
      title: modalTitle,
      content: modalContent,
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await changePartStatus(partNumber, newStatus);
          message.success(`Part status successfully changed to ${newStatus}`);
          
          // Immediately fetch PDC data after status change
          if (selectedJob) {
            try {
              const pdcResponse = await fetchPartProductionPDC(
                selectedJob.part_number,
                selectedJob.production_order
              );
              
              if (pdcResponse && Array.isArray(pdcResponse) && pdcResponse.length > 0) {
                const pdcWithProductionOrder = {
                  ...pdcResponse[0],
                  production_order: pdcResponse[0].production_order || selectedJob.production_order,
                  part_number: pdcResponse[0].part_number || selectedJob.part_number
                };
                setPdcData(pdcWithProductionOrder);
              } else {
                setPdcData(null);
              }
            } catch (pdcError) {
              console.error('Error fetching PDC data after status change:', pdcError);
              setPdcData(null);
            }
          }
        } catch (error) {
          message.error('Failed to change part status');
        }
      }
    });
  };

  const renderStatusButton = (partNumber) => {
    const status = getJobStatus(partNumber);
    
    switch (status) {
      case 'active':
        return (
          <Button 
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => handleStatusChange(partNumber, status)}
          >
            <CalendarCheck className="w-5 h-5 mr-2" /> Active
          </Button>
        );
      case 'inactive':
        return (
          <Button 
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={() => handleStatusChange(partNumber, status)}
          >
            <Hourglass className="w-5 h-5 mr-2" /> Inactive
          </Button>
        );
      default:
        return (
          <Button 
            className="bg-gray-600 text-white hover:bg-gray-700"
            onClick={() => handleStatusChange(partNumber, 'unknown')}
          >
            <AlertTriangle className="w-5 h-5 mr-2" /> Unknown
          </Button>
        );
    }
  };

  const handleJobSelect = async (partNumber) => {
    try {
      setLoading(true);
      console.log('Selected part number:', partNumber);
      setSelectedOrderNumber(partNumber);
      
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
      
    } catch (error) {
      console.error('Error in handleJobSelect:', error);
      message.error('Failed to fetch job details');
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
      doc.setFont('helvetica');
      
      // Add BEL logo
      const img = new Image();
      img.src = belLogo;
      doc.addImage(img, 'PNG', 10, 5, 30, 15);
      
      // Add company header with better styling
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
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
            content: 'Gr No.',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: 'N/A',
            styles: { cellWidth: 100 }
          }
        ],
        [
          {
            content: 'Heat No.',
            styles: { fontStyle: 'bold', cellWidth: 40 }
          },
          {
            content: 'N/A',
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
          font: 'helvetica',
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
      doc.setFont('helvetica', 'bold');
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
      doc.setFont('helvetica', 'bold');
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
      doc.setFont('helvetica', 'bold');
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
          <div className="text-center space-y-2 border-b-4 border-blue-900 pb-4 mb-8 relative z-10">
            <div className="flex items-center justify-between">
              <img src={belLogo} alt="BEL Logo" className="h-16" />
              <div className=" bg-blue-50 text-Black px-8 py-3 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold">FABRICATION COMPONENTS</h2>
                <h3 className="text-xl">JOB CARD</h3>
              </div>
              <div className="w-24"></div>
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
                    <td className="font-bold p-4 bg-blue-50">Gr No.</td>
                    <td className="p-4" colSpan="3">N/A</td>
                  </tr>
                  <tr className="border-2 border-gray-300">
                    <td className="font-bold p-4 bg-blue-50">Heat No.</td>
                    <td className="p-4" colSpan="3">N/A</td>
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
            </div>
          </div>

          {/* Signature and Date Section */}
          <div className="flex justify-between items-start mt-12 mb-8 relative z-10">
            <div className="w-1/3">
              <p className="font-bold mb-2  bg-blue-50">Signature with Seal</p>
              <div className="border-b-4 border-blue-900 h-16"></div>
            </div>
            <div className="w-1/3 text-right">
              <p className="font-bold mb-2  bg-blue-50">Date:</p>
              <div className="border-b-4 border-blue-900 h-16"></div>
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

  const handleAddTool = async (values) => {
    try {
      setLoading(true);
      
      // Find the selected operation to get its id
      const selectedOperation = selectedJob?.operations?.find(
        op => op.operation_number === parseInt(values.operationNumber, 10)
      );
      
      if (!selectedOperation) {
        throw new Error('Selected operation not found');
      }
      
      console.log('Selected Operation:', selectedOperation);
      
      // Format the data for the API - using exactly the field names required
      const toolData = {
        // Required fields for the API with the exact field names expected
        tool_name: values.tool_name,
        tool_number: values.tool_number,
        bel_partnumber: values.bel_partnumber,
        description: values.description,
        quantity: values.quantity || 1,
        // Auto-populated fields - use the actual job ID and operation ID
        order_id: selectedJob.id,
        operation_id: selectedOperation.id
      };
      
      // Log the data we're sending to help with debugging
      console.log('Sending tool data to API with job ID and operation ID:', toolData);
      
      // Directly submit the tool data without showing the confirmation modal
      submitToolData(toolData);
      
    } catch (error) {
      console.error('Failed to add tool:', error);
      message.error(`Failed to add tool: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Function to handle the actual API call
  const submitToolData = async (toolData) => {
    try {
      // Call the API function
      const { addOrderTool } = usePlanningStore.getState();
      console.log('Calling addOrderTool with:', toolData);
      
      const response = await addOrderTool(toolData);
      
      console.log('API Response after adding tool:', response);
      
      // Find operation details for display in the table
      const operation = selectedJob?.operations?.find(op => op.id === toolData.operation_id);
      
      // Add the new tool to the local state with data from response
      const newTool = {
        id: response?.id || (tools.length + 1),
        tool_name: response?.tool_name || toolData.tool_name,
        tool_number: response?.tool_number || toolData.tool_number,
        bel_partnumber: response?.bel_partnumber || toolData.bel_partnumber,
        description: response?.description || toolData.description,
        quantity: response?.quantity || toolData.quantity,
        order_id: response?.order_id || toolData.order_id,
        operation_id: response?.operation_id || toolData.operation_id,
        created_at: response?.created_at,
        updated_at: response?.updated_at,
        // Additional fields for table display
        partNumber: selectedJob?.part_number,
        productionOrder: selectedJob?.production_order,
        operationNumber: operation?.operation_number || 'N/A',
        operationDescription: operation?.operation_description || addToolForm.getFieldValue('operationDescription')
      };
      
      const updatedTools = [...tools, newTool];
      setTools(updatedTools);
      // Save tools to localStorage
      localStorage.setItem('jobTools', JSON.stringify(updatedTools));
      
      setIsAddToolModalVisible(false);
      addToolForm.resetFields();
      
     
      // Provide additional guidance for common errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error')) {
        errorMessage = `Network error: Could not connect to API server at http://172.18.7.89:4470. Please verify the server is running and accessible.`;
      } else if (errorMessage.includes('CORS')) {
        errorMessage = `CORS error: The API server at http://172.18.7.89:4470 does not allow cross-origin requests from this application. Contact your administrator.`;
      } else if (errorMessage.includes('Validation errors')) {
        errorMessage = `${errorMessage}. Please check the tool data format and try again.`;
      } else if (errorMessage.includes('not found')) {
        errorMessage = `${errorMessage}. Please verify that the job ID and operation ID are correct.`;
      }
      
      // Show error message to user
      Modal.error({
        title: 'Failed to add tool',
        content: errorMessage,
        width: 600
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle the actual tool update API call
  const submitToolUpdate = async (toolData) => {
    try {
      // Call the API function
      const { updateOrderTool } = usePlanningStore.getState();
      
      console.log('Updating tool ID:', selectedTool.id);
      console.log('Sending data to API:', toolData);
      
      // Make sure order_id and operation_id are included
      if (!toolData.order_id || !toolData.operation_id) {
        toolData.order_id = selectedTool.order_id;
        toolData.operation_id = selectedTool.operation_id;
      }
      
      // Call the API with the correct tool ID
      const updatedTool = await updateOrderTool(selectedTool.id, toolData);
      
      console.log('API response for updated tool:', updatedTool);
      
      // Update the tool in the local state
      const updatedTools = tools.map(tool => 
        tool.id === selectedTool.id 
          ? { 
              ...tool,
              tool_name: toolData.tool_name,
              tool_number: toolData.tool_number,
              bel_partnumber: toolData.bel_partnumber,
              description: toolData.description,
              quantity: toolData.quantity,
              updated_at: new Date().toISOString()
            }
          : tool
      );
      
      setTools(updatedTools);
      // Save updated tools to localStorage
      localStorage.setItem('jobTools', JSON.stringify(updatedTools));
      
      setIsEditToolModalVisible(false);
      editToolForm.resetFields();
      
      // Show success modal with ONLY the requested fields
      Modal.success({
        title: 'Tool Updated Successfully',
        width: 600,
        content: (
          <div>
            <p>The tool has been updated with the following details:</p>
            <div style={{ maxHeight: '400px', overflow: 'auto', marginTop: '16px', border: '1px solid #f0f0f0', padding: '16px', borderRadius: '4px' }}>
              <pre>{JSON.stringify({
                "tool_name": toolData.tool_name,
                "tool_number": toolData.tool_number,
                "bel_partnumber": toolData.bel_partnumber,
                "description": toolData.description,
                "quantity": toolData.quantity
              }, null, 2)}</pre>
            </div>
          </div>
        )
      });
    } catch (error) {
      console.error('Failed to update tool:', error);
      message.error(`Failed to update tool: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update handleAddProgram to ensure proper localStorage handling
  const handleAddProgram = async (values) => {
    console.log("Adding program with values:", values);
    
    // Find the selected operation
    const operation = selectedJob?.operations?.find(op => op.id === values.operation_id);
    
    // Format the program data for the API
    const programData = {
      program_name: values.program_name,
      program_number: values.program_number,
      version: values.version || 'v1',
      operation_id: parseInt(values.operation_id, 10),
      order_id: parseInt(selectedJob.id, 10)
    };
    
    // Handle file upload if a file was provided
    if (values.file && values.file.fileList && values.file.fileList.length > 0) {
      const fileInfo = values.file.fileList[0];
      console.log("File to be uploaded:", fileInfo);
    }
    
    console.log("Formatted program data to be sent to API:", programData);
    
    try {
      // Get the addOrderProgram function from the store
      const { addOrderProgram } = usePlanningStore.getState();
      
      // Call the API to add the program
      const response = await addOrderProgram(programData);
      console.log("API response for program creation:", response);
      
      if (response && response.id) {
        // Create an enhanced program object with additional display fields
        const newProgram = {
          ...response,
          productionOrder: selectedJob.production_order,
          partNumber: selectedJob.part_number,
          operationNumber: operation?.operation_number || 'N/A',
          operationDescription: operation?.operation_description || 'N/A',
          // Map API fields to UI fields
          programNo: response.program_number,
          description: response.program_name,
          lastModified: response.update_date,
          update_date: response.update_date,
          version: response.version || 'v1',
          key: response.id
        };
        
        // Update state and localStorage with the new program
        const updatedPrograms = [...programs, newProgram];
        setPrograms(updatedPrograms);
        
        // Explicitly save programs to localStorage 
        localStorage.setItem('jobPrograms', JSON.stringify(updatedPrograms));
        console.log('Programs saved to localStorage after adding:', updatedPrograms);
        
        // Close the modal and reset form
        setIsAddProgramModalVisible(false);
        addProgramForm.resetFields();
        
        // Show success message
        Modal.success({
          title: 'Program Created Successfully',
          content: (
            <div>
              <p>Program Name: {newProgram.program_name}</p>
              <p>Program Number: {newProgram.program_number}</p>
              <p>Version: {newProgram.version}</p>
            </div>
          )
        });
      } else {
        throw new Error("Failed to create program: Invalid response from server");
      }
    } catch (error) {
      console.error("Error creating program:", error);
      message.error("Failed to create program: " + (error.message || "Unknown error"));
    }
  };

  // Update handleEditProgram to ensure proper localStorage handling
  const handleEditProgram = async (values) => {
    console.log("Editing program with values:", values);
    
    // Format the program data for the API
    const programData = {
      program_name: values.program_name,
      program_number: values.program_number,
      version: values.version || 'v1',
      operation_id: parseInt(values.operation_id, 10),
      order_id: parseInt(selectedJob.id, 10)
    };
    
    console.log("Formatted program data to be sent to API:", programData);

    // Handle file upload if a file was provided
    if (values.file && values.file.fileList && values.file.fileList.length > 0) {
      const fileInfo = values.file.fileList[0];
      console.log("File to be uploaded for program update:", fileInfo);
    }
    
    try {
      // Get the updateOrderProgram function from the store
      const { updateOrderProgram } = usePlanningStore.getState();
      
      // Call the API to update the program - pass ID separately
      const response = await updateOrderProgram(selectedProgram.id, programData);
      console.log("API response for program update:", response);
      
      if (response) {
        // Find the operation to get additional display fields
        const operation = selectedJob?.operations?.find(op => op.id === values.operation_id);
        
        // Create an updated program object with additional display fields
        const updatedProgram = {
          ...selectedProgram,
          ...response,
          productionOrder: selectedJob.production_order,
          partNumber: selectedJob.part_number,
          operationNumber: operation?.operation_number || 'N/A',
          operationDescription: operation?.operation_description || 'N/A',
          // Map API fields to UI fields
          programNo: response.program_number,
          description: response.program_name,
          lastModified: response.update_date,
          update_date: response.update_date,
          version: response.version || 'v1'
        };
        
        // Update state with the updated program
        const updatedPrograms = programs.map(prog => 
          prog.id === selectedProgram.id ? updatedProgram : prog
        );
        setPrograms(updatedPrograms);
        
        // Explicitly save programs to localStorage
        localStorage.setItem('jobPrograms', JSON.stringify(updatedPrograms));
        console.log('Programs saved to localStorage after updating:', updatedPrograms);
        
        // Close the modal and reset form
        setIsEditProgramModalVisible(false);
        editProgramForm.resetFields();
        
        // Show success message
        message.success("Program updated successfully");
      } else {
        throw new Error("Failed to update program: Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating program:", error);
      message.error("Failed to update program: " + (error.message || "Unknown error"));
    }
  };

  // Add a function to handle program deletion
  const handleDeleteProgram = async (programId) => {
    try {
      setLoading(true);
      
      // Confirm deletion with the user
      Modal.confirm({
        title: 'Delete Program',
        content: 'Are you sure you want to delete this program?',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          try {
            // Call the API to delete the program
            const { deleteOrderProgram } = usePlanningStore.getState();
            await deleteOrderProgram(programId);
            
            // Update the local state by filtering out the deleted program
            const updatedPrograms = programs.filter(program => program.id !== programId);
            setPrograms(updatedPrograms);
            
            // Update localStorage to reflect the deletion
            localStorage.setItem('jobPrograms', JSON.stringify(updatedPrograms));
            console.log('Programs saved to localStorage after deletion:', updatedPrograms);
            
            message.success('Program deleted successfully');
          } catch (error) {
            console.error('Error deleting program:', error);
            message.error('Failed to delete program: ' + (error.message || 'Unknown error'));
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error in delete confirmation:', error);
      setLoading(false);
    }
  };

  // Add this new function above the return statement to render PDC information based on PDC data and status
  const renderPdcInfo = (productionOrder) => {
    const status = getJobStatus(productionOrder);
    
    // Verify that pdcData matches the current production order
    const isPdcForCurrentJob = pdcData && 
                              pdcData.production_order === productionOrder && 
                              pdcData.part_number === selectedJob.part_number;
    
    // If PDC exists for this specific production order AND status is active: Show the PDC date/time
    if (isPdcForCurrentJob && status === 'active') {
      return (
        <Tooltip title="Production Due Date">
          <Tag color="blue" style={{ fontWeight: 'bold' }}>
            {new Date(pdcData.pdc).toLocaleDateString()} {new Date(pdcData.pdc).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Tag>
        </Tooltip>
      );
    } 
    // If PDC doesn't exist for this production order AND status is inactive: Show "Not yet scheduled"
    else if (!isPdcForCurrentJob && status === 'inactive') {
      return (
        <Tag color="orange">Not yet scheduled</Tag>
      );
    } 
    // If PDC exists for this production order but status is not active
    else if (isPdcForCurrentJob && status !== 'active') {
      return (
        <Tooltip title="Production Due Date (Part not active)">
          <Tag color="gray" style={{ fontWeight: 'bold' }}>
            {new Date(pdcData.pdc).toLocaleDateString()} {new Date(pdcData.pdc).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Tag>
        </Tooltip>
      );
    }
    // If status is active but no PDC data for this production order
    else if (!isPdcForCurrentJob && status === 'active') {
      return (
        <Tag color="red">PDC not defined</Tag>
      );
    }
    // For any other case (like unknown status)
    else {
      return (
        <Tag color="orange">Not yet Scheduled</Tag>
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Job Selection Section with improved layout */}
      <Card className="shadow-sm">
        <Row gutter={24} align="middle">
          <Col span={selectedJob ? 20 : 24}>
            <Space size="large" className="w-full">
              <Form.Item label="Select Job/Production Order" className="mb-0" style={{ flex: 1 }}>
                <Space className="w-full">
                  <Select
                    className="job-select"
                    showSearch
                    loading={isLoading}
                    placeholder="Search by Production Order"
                    onChange={handleJobSelect}
                    optionFilterProp="children"
                    style={{ width: '500px' }}
                    allowClear
                    value={selectedJob?.production_order}
                  >
                    {partNumbers.map(item => (
                      <Option key={item.id} value={item.productionOrder}>
                        {item.productionOrder}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Form.Item>
            </Space>
          </Col>
          {selectedJob && (
            <Col span={4} className="text-right">
              <Space>
                {renderDownloadButton()}
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
              onChange={setActiveTab}
            >
              <TabPane 
                tab={
                  <span>
                    <FileTextOutlined />
                    Job Details
                  </span>
                }
                key="jobDetails"
              >
                <Card 
                  className={`shadow-sm mb-6 hover:shadow-md transition-shadow ${
                    getJobStatus(selectedJob.part_number) === 'active' 
                      ? 'bg-green-50' 
                      : getJobStatus(selectedJob.part_number) === 'inactive'
                      ? 'bg-yellow-50'
                      : 'bg-gray-50'
                  }`}
                  size="small"
                >
                  <Descriptions column={3}>
                    <Descriptions.Item label="Part Number">
                      {selectedJob.part_number}
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={selectedJob.project?.priority === 1 ? 'red' : 'blue'}>
                        {selectedJob.project?.priority === 1 ? 'HIGH' : 'NORMAL'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Required Quantity">
                      {selectedJob.required_quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="End Date">
                      {selectedJob.project?.end_date || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ fontWeight: 'bold', color: '#1890ff' }}>PDC</span>}
                    >
                      {renderPdcInfo(selectedJob.production_order)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Production Order">
                      {selectedJob.production_order}
                    </Descriptions.Item>
                    <Descriptions.Item label="Project Name">
                      {selectedJob.project?.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Part Description">
                      {selectedJob.part_description}
                    </Descriptions.Item>
                    <Descriptions.Item label="Launched Quantity">
                      {selectedJob.launched_quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Operations">
                      {selectedJob.total_operations}
                    </Descriptions.Item>
                    <Descriptions.Item label="Start Date">
                      {selectedJob.project?.start_date 
                        ? new Date(selectedJob.project.start_date).toLocaleDateString()
                        : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <div className="flex items-center space-x-2">
                        {renderStatusButton(selectedJob.part_number)}
                      </div>
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
                />
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <ToolOutlined />
                    Tools and Programs
                  </span>
                }
                key="toolsAndPrograms"
              >
                <Card className="shadow-sm">
                  {/* Add nested Tabs for Tools and Programs */}
                  <Tabs defaultActiveKey="tools" type="card">
                    <TabPane 
                      tab={
                        <span>
                          <ToolOutlined />
                          Tools List
                        </span>
                      } 
                      key="tools"
                    >
                      <div className="mb-4 flex justify-end">
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => setIsAddToolModalVisible(true)}
                          disabled={!selectedJob}
                        >
                          Add Tool
                        </Button>
                      </div>

                      {loading ? (
                        <div className="flex justify-center items-center py-8">
                          <Spin size="large" />
                          <span className="ml-2">Loading tools...</span>
                        </div>
                      ) : (
                        <Table
                          size="small"
                          columns={[
                            { 
                              title: 'Sl.No', 
                              key: 'serialNumber',
                              width: '5%',
                              render: (text, record, index) => {
                                // Calculate continuous serial number across pages
                                return ((currentPage - 1) * 6) + index + 1;
                              }
                            },
                            { 
                              title: 'Tool Name', 
                              dataIndex: 'tool_name', 
                              key: 'tool_name',
                              width: '15%'
                            },
                            { 
                              title: 'Tool Number', 
                              dataIndex: 'tool_number', 
                              key: 'tool_number',
                              width: '15%'
                            },
                            { 
                              title: 'BEL Part No', 
                              dataIndex: 'bel_partnumber', 
                              key: 'bel_partnumber',
                              width: '10%'
                            },
                            { 
                              title: 'Production Order', 
                              dataIndex: 'productionOrder', 
                              key: 'productionOrder',
                              width: '12%'
                            },
                            { 
                              title: 'Operation', 
                              dataIndex: 'operationNumber', 
                              key: 'operationNumber',
                              width: '8%'
                            },
                            { 
                              title: 'Description', 
                              dataIndex: 'description', 
                              key: 'description',
                              width: '15%'
                            },
                            {
                              title: 'Qty',
                              dataIndex: 'quantity',
                              key: 'quantity',
                              width: '8%',
                              render: (text) => text || 1
                            },
                           
                            {
                              title: 'Action',
                              key: 'action',
                              width: '15%',
                              render: (_, record) => (
                                <Space>
                                  <Button 
                                    type="link" 
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                      setSelectedTool(record);
                                      editToolForm.setFieldsValue({
                                        tool_name: record.tool_name,
                                        tool_number: record.tool_number,
                                        bel_partnumber: record.bel_partnumber,
                                        description: record.description,
                                        quantity: record.quantity || 1
                                      });
                                      setIsEditToolModalVisible(true);
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
                            }
                          }}
                        />
                      )}
                    </TabPane>

                    <TabPane 
                      tab={
                        <span>
                          <FileTextOutlined />
                          Programs List
                        </span>
                      } 
                      key="programs"
                    >
                      <div className="mb-4 flex justify-end">
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => setIsAddProgramModalVisible(true)}
                          disabled={!selectedJob}
                        >
                          Add Program
                        </Button>
                      </div>

                      {loading ? (
                        <div className="flex justify-center items-center py-8">
                          <Spin size="large" />
                          <span className="ml-2">Loading programs...</span>
                        </div>
                      ) : (
                        <Table
                          size="small"
                          columns={[
                            { 
                              title: 'Sl.No', 
                              key: 'serialNumber',
                              width: '5%',
                              render: (text, record, index) => {
                                // Calculate continuous serial number across pages
                                return ((programCurrentPage - 1) * 6) + index + 1;
                              }
                            },
                            { 
                              title: 'Program No', 
                              dataIndex: 'program_number', 
                              key: 'program_number',
                              render: (text, record) => text || record.programNo || 'N/A'
                            },
                            { 
                              title: 'Program Name', 
                              dataIndex: 'program_name', 
                              key: 'program_name',
                              render: (text, record) => text || record.description || 'N/A'
                            },
                            { 
                              title: 'Part Number', 
                              dataIndex: 'partNumber', 
                              key: 'partNumber' 
                            },
                            { 
                              title: 'Production Order', 
                              dataIndex: 'productionOrder', 
                              key: 'productionOrder' 
                            },
                            { 
                              title: 'Operation', 
                              dataIndex: 'operationNumber', 
                              key: 'operationNumber',
                              render: (text, record) => text || 'N/A'
                            },
                            { 
                              title: 'Version', 
                              dataIndex: 'version', 
                              key: 'version',
                              render: (text) => text || 'v1'
                            },
                            { 
                              title: 'Update Date', 
                              dataIndex: 'update_date', 
                              key: 'update_date',
                              render: (text, record) => {
                                // Check for update_date first, then lastModified, then updated_at
                                const date = text || record.update_date || record.lastModified || record.updated_at;
                                if (!date) return 'N/A';
                                return typeof date === 'string' && date.includes('T') 
                                  ? new Date(date).toLocaleDateString() 
                                  : date;
                              }
                            },
                            {
                              title: 'Action',
                              key: 'action',
                              render: (_, record) => (
                                <Space>
                                  <Button 
                                    type="link" 
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                      setSelectedProgram(record);
                                      setIsEditProgramModalVisible(true);
                                    }}
                                  />
                                  <Button
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteProgram(record.id)}
                                  />
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
                            }
                          }}
                        />
                      )}
                    </TabPane>
                  </Tabs>
                </Card>

                {/* Add Tool Modal */}
                <Modal
                  title="Add New Tool"
                  open={isAddToolModalVisible}
                  onCancel={() => {
                    setIsAddToolModalVisible(false);
                    addToolForm.resetFields();
                  }}
                  footer={null}
                  width={600}
                >
                  <Form
                    form={addToolForm}
                    layout="vertical"
                    onFinish={handleAddTool}
                  >
                    {/* Job Details Section */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <div className="mb-2">
                            <label className="text-sm text-gray-600">Part Number</label>
                            <div className="font-medium">{selectedJob?.part_number || 'N/A'}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="mb-2">
                            <label className="text-sm text-gray-600">Production Order</label>
                            <div className="font-medium">{selectedJob?.production_order || 'N/A'}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <Form.Item
                      name="operationNumber"
                      label="Operation Number"
                      rules={[{ required: true, message: 'Please select an operation' }]}
                    >
                      <Select 
                        placeholder="Select operation"
                        showSearch
                        optionFilterProp="children"
                        onChange={(value, option) => {
                          // Find the operation description for the selected operation number
                          const operation = selectedJob?.operations?.find(op => op.operation_number === value);
                          if (operation) {
                            // Update the operationDescription field
                            addToolForm.setFieldsValue({
                              operationDescription: operation.operation_description
                            });
                          }
                        }}
                      >
                        {selectedJob?.operations
                          ?.slice() // Create a copy to avoid mutating the original
                          .sort((a, b) => parseInt(a.operation_number) - parseInt(b.operation_number)) // Sort by operation number
                          .map(op => (
                            <Option key={op.operation_number} value={op.operation_number}>
                              {`${op.operation_number} - ${op.operation_description.substring(0, 30)}${op.operation_description.length > 30 ? '...' : ''}`}
                            </Option>
                          ))
                        }
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="operationDescription"
                      label="Operation Description"
                    >
                      <Input disabled />
                    </Form.Item>

                    <Form.Item
                      name="tool_name"
                      label="Tool Name"
                      rules={[{ required: true, message: 'Please enter Tool Name' }]}
                    >
                      <Input placeholder="Enter tool name" />
                    </Form.Item>
                    
                    <Form.Item
                      name="tool_number"
                      label="Tool Number"
                      rules={[{ required: true, message: 'Please enter Tool Number' }]}
                    >
                      <Input placeholder="Enter tool number" />
                    </Form.Item>
                    
                    <Form.Item
                      name="bel_partnumber"
                      label="BEL Part Number"
                      rules={[{ required: true, message: 'Please enter BEL Part Number' }]}
                    >
                      <Input placeholder="Enter BEL part number" />
                    </Form.Item>
                    
                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[{ required: true, message: 'Please enter Description' }]}
                    >
                      <Input.TextArea rows={3} placeholder="Enter tool description" />
                    </Form.Item>
                    
                    <Form.Item
                      name="quantity"
                      label="Quantity"
                      initialValue={1}
                      rules={[{ required: true, message: 'Please enter Quantity' }]}
                    >
                      <Input type="number" min={1} placeholder="Enter quantity" />
                    </Form.Item>
                    
                    <Form.Item className="mb-0 text-right">
                      <Space>
                        <Button onClick={() => {
                          setIsAddToolModalVisible(false);
                          addToolForm.resetFields();
                        }}>
                          Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                          Add Tool
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Modal>

                {/* Edit Tool Modal */}
                <Modal
                  title="Edit Tool"
                  open={isEditToolModalVisible}
                  onCancel={() => {
                    setIsEditToolModalVisible(false);
                    editToolForm.resetFields();
                  }}
                  footer={null}
                  width={600}
                >
                  <Form
                    form={editToolForm}
                    layout="vertical"
                    initialValues={selectedTool}
                    onFinish={async (values) => {
                      try {
                        setLoading(true);
                        
                        // Format the data for the API using the exact field names required
                        const toolData = {
                          tool_name: values.tool_name,
                          tool_number: values.tool_number,
                          bel_partnumber: values.bel_partnumber,
                          description: values.description,
                          quantity: values.quantity || 1,
                          // Auto-populated fields - use the correct IDs
                          order_id: selectedTool.order_id,
                          operation_id: selectedTool.operation_id
                        };
                        
                        console.log('Selected tool for update:', selectedTool);
                        console.log('Sending tool update data to API:', toolData);
                        
                        // Directly submit tool update without showing confirmation modal
                        submitToolUpdate(toolData);
                        
                      } catch (error) {
                        console.error('Failed to update tool:', error);
                        message.error(`Failed to update tool: ${error.message}`);
                        setLoading(false);
                      }
                    }}
                  >
                    {/* Job Details Section */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <div className="mb-2">
                            <label className="text-sm text-gray-600">Part Number</label>
                            <div className="font-medium">{selectedTool?.partNumber || 'N/A'}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="mb-2">
                            <label className="text-sm text-gray-600">Production Order</label>
                            <div className="font-medium">{selectedTool?.productionOrder || 'N/A'}</div>
                          </div>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <div className="mb-2">
                            <label className="text-sm text-gray-600">Operation</label>
                            <div className="font-medium">{selectedTool?.operationNumber} - {selectedTool?.operationDescription}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <Form.Item
                      name="tool_name"
                      label="Tool Name"
                      rules={[{ required: true, message: 'Please enter Tool Name' }]}
                    >
                      <Input placeholder="Enter tool name" />
                    </Form.Item>
                    
                    <Form.Item
                      name="tool_number"
                      label="Tool Number"
                      rules={[{ required: true, message: 'Please enter Tool Number' }]}
                    >
                      <Input placeholder="Enter tool number" />
                    </Form.Item>
                    
                    <Form.Item
                      name="bel_partnumber"
                      label="BEL Part Number"
                      rules={[{ required: true, message: 'Please enter BEL Part Number' }]}
                    >
                      <Input placeholder="Enter BEL part number" />
                    </Form.Item>
                    
                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[{ required: true, message: 'Please enter Description' }]}
                    >
                      <Input.TextArea rows={3} placeholder="Enter tool description" />
                    </Form.Item>
                    
                    <Form.Item
                      name="quantity"
                      label="Quantity"
                      initialValue={1}
                      rules={[{ required: true, message: 'Please enter Quantity' }]}
                    >
                      <Input type="number" min={1} placeholder="Enter quantity" />
                    </Form.Item>
                    
                    <Form.Item className="mb-0 text-right">
                      <Space>
                        <Button onClick={() => {
                          setIsEditToolModalVisible(false);
                          editToolForm.resetFields();
                        }}>
                          Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                          Update Tool
                        </Button>
                      </Space>
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
                            handleEditProgram(values);
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
                  <span>
                    <AppstoreOutlined />
                    Configuration Matrix
                  </span>
                }
                key="configMatrix"
              >
                <Card className="shadow-sm">
                  <div className="space-y-6">
                    <Table
                      size="small"
                      columns={[
                        { title: 'Operation', dataIndex: 'operation', key: 'operation', fixed: 'left' },
                        { title: 'Machine', dataIndex: 'machine', key: 'machine' },
                        { title: 'Tool Set', dataIndex: 'toolSet', key: 'toolSet' },
                        { title: 'Program', dataIndex: 'program', key: 'program' },
                        { title: 'Fixture', dataIndex: 'fixture', key: 'fixture' },
                        { title: 'Setup Time', dataIndex: 'setupTime', key: 'setupTime' },
                        { title: 'Cycle Time', dataIndex: 'cycleTime', key: 'cycleTime' }
                      ]}
                      dataSource={[]}
                      scroll={{ x: 1000 }}
                      pagination={false}
                    />
                  </div>
                </Card>
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <BarChartOutlined />
                    Capacity Planning
                  </span>
                }
                key="capacityPlanning"
              >
                <CapacityPlanning />
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
    </div>
  );
};

export default Planning;