import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Space, Select, Input, 
  Table, Modal, Steps, Tabs, Upload, message,
  Typography, Tag, Tooltip, Form, Drawer, Descriptions,
  Badge, Alert, Spin
} from 'antd';
import {
  UploadOutlined, FileTextOutlined, EditOutlined,
  SaveOutlined, PlusOutlined, ClockCircleOutlined,
  CalendarOutlined, BarChartOutlined,
  ToolOutlined, DownloadOutlined, DeleteOutlined
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

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Planning = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMPPDetails, setShowMPPDetails] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [activeTab, setActiveTab] = useState('jobDetails');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);
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
  const [addToolForm, setAddToolForm] = useState(null);
  const [editToolForm, setEditToolForm] = useState(null);
  const [addProgramForm, setAddProgramForm] = useState(null);
  const [editProgramForm, setEditProgramForm] = useState(null);
  const [tools, setTools] = useState([]);

  // Fetch part numbers and active parts on component mount
  React.useEffect(() => {
    fetchAllOrders();
    fetchActiveParts();
  }, [fetchAllOrders, fetchActiveParts]);

  const getJobStatus = (productionOrder) => {
    const activePart = activeParts.find(part => part.production_order === productionOrder);
    return activePart ? activePart.status : 'unknown';
  };

  const handleStatusChange = (productionOrder, currentStatus) => {
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
          await changePartStatus(productionOrder, newStatus);
          message.success(`Part status successfully changed to ${newStatus}`);
        } catch (error) {
          message.error('Failed to change part status');
        }
      }
    });
  };

  const renderStatusButton = (productionOrder) => {
    const status = getJobStatus(productionOrder);
    
    switch (status) {
      case 'active':
        return (
          <Button 
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => handleStatusChange(productionOrder, status)}
          >
            <CalendarCheck className="w-5 h-5 mr-2" /> Active
          </Button>
        );
      case 'inactive':
        return (
          <Button 
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={() => handleStatusChange(productionOrder, status)}
          >
            <Hourglass className="w-5 h-5 mr-2" /> Inactive
          </Button>
        );
      default:
        return (
          <Button 
            className="bg-gray-600 text-white hover:bg-gray-700"
            onClick={() => handleStatusChange(productionOrder, 'unknown')}
          >
            <AlertTriangle className="w-5 h-5 mr-2" /> Unknown
          </Button>
        );
    }
  };

  const handleJobSelect = async (partNumber) => {
    const results = await searchOrders(partNumber);
    if (results.orders && results.orders.length > 0) {
      const selectedJobData = results.orders[0];
      setSelectedJob(selectedJobData);
      setSelectedOrderNumber(selectedJobData?.orderNumber);
      console.log('Selected Order Number:', selectedJobData?.orderNumber);
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

  const handleAddTool = (values) => {
    const newTool = {
      id: tools.length + 1,
      toolType: values.toolType,
      toolDescription: values.toolDescription,
      belPartNumber: values.belPartNumber
    };
    setTools([...tools, newTool]);
    setIsAddToolModalVisible(false);
    addToolForm.resetFields();
    message.success('Tool added successfully');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Job Selection Section with improved layout */}
      <Card className="shadow-sm">
        <Row gutter={24} align="middle">
          <Col span={20}>
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
                  >
                    {partNumbers.map(item => (
                      <Option key={item.id} value={item.productionOrder}>
                        {item.productionOrder}
                      </Option>
                    ))}
                  </Select>
                  {/* <Button onClick={handleReset}>Reset</Button> */}
                </Space>
              </Form.Item>
              <Upload 
                accept=".pdf"
                onChange={handleUpload}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
              >
              </Upload>
            </Space>
          </Col>
          <Col span={4} className="text-right">
            <Space>
              {selectedJob && renderDownloadButton()}
            </Space>
          </Col>
        </Row>
      </Card>

      {selectedJob && (
        <>
          {/* Job Details Section */}
          <Card className="shadow-sm">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarExtraContent={
                <Link to="/scheduling">
                </Link>
              }
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
                    getJobStatus(selectedJob.production_order) === 'active' 
                      ? 'bg-green-50' 
                      : getJobStatus(selectedJob.production_order) === 'inactive'
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
                    <Descriptions.Item label="Delivery Date">
                      {selectedJob.project?.delivery_date || 'N/A'}
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
                        {renderStatusButton(selectedJob.production_order)}
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
                  <div className="space-y-8">
                    {/* Tools Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Title level={5} className="mb-0">Tools List</Title>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => setIsAddToolModalVisible(true)}
                        >
                          Add Tool
                        </Button>
                      </div>
                      <Table
                        size="small"
                        columns={[
                          { 
                            title: 'Sl.No', 
                            dataIndex: 'id', 
                            key: 'id',
                            width: '10%',
                            render: (text, record, index) => index + 1
                          },
                          { 
                            title: 'Tool Type', 
                            dataIndex: 'toolType', 
                            key: 'toolType',
                            width: '20%'
                          },
                          { 
                            title: 'Tool Description', 
                            dataIndex: 'toolDescription', 
                            key: 'toolDescription',
                            width: '45%'
                          },
                          { 
                            title: 'BEL Part Number', 
                            dataIndex: 'belPartNumber', 
                            key: 'belPartNumber',
                            width: '15%'
                          },
                          {
                            title: 'Action',
                            key: 'action',
                            width: '10%',
                            render: (_, record) => (
                              <Space>
                                <Button 
                                  type="link" 
                                  icon={<EditOutlined />}
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
                                    setTools(tools.filter(tool => tool.id !== record.id));
                                    message.success('Tool deleted successfully');
                                  }}
                                />
                              </Space>
                            ),
                          },
                        ]}
                        dataSource={tools}
                        pagination={false}
                      />
                    </div>

                    {/* Programs Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Title level={5} className="mb-0">Programs List</Title>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => setIsAddProgramModalVisible(true)}
                        >
                          Add Program
                        </Button>
                      </div>
                      <Table
                        size="small"
                        columns={[
                          { title: 'Program No', dataIndex: 'programNo', key: 'programNo' },
                          { title: 'Description', dataIndex: 'description', key: 'description' },
                          { title: 'Version', dataIndex: 'version', key: 'version' },
                          { title: 'Last Modified', dataIndex: 'lastModified', key: 'lastModified' },
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
                                  onClick={() => {
                                    Modal.confirm({
                                      title: 'Delete Program',
                                      content: 'Are you sure you want to delete this program?',
                                      okText: 'Yes',
                                      okType: 'danger',
                                      cancelText: 'No',
                                      onOk: () => {
                                        // Handle delete
                                        message.success('Program deleted successfully');
                                      },
                                    });
                                  }}
                                />
                              </Space>
                            ),
                          },
                        ]}
                        dataSource={[]}
                        pagination={false}
                      />
                    </div>
                  </div>
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
                >
                  <Form
                    form={addToolForm}
                    layout="vertical"
                    onFinish={handleAddTool}
                  >
                    <Form.Item
                      name="toolType"
                      label="Tool Type"
                      rules={[{ required: true, message: 'Please enter Tool Type' }]}
                    >
                      <Input placeholder="Enter tool type" />
                    </Form.Item>
                    <Form.Item
                      name="toolDescription"
                      label="Tool Description"
                      rules={[{ required: true, message: 'Please enter Tool Description' }]}
                    >
                      <Input.TextArea rows={3} placeholder="Enter tool description" />
                    </Form.Item>
                    <Form.Item
                      name="belPartNumber"
                      label="BEL Part Number"
                      rules={[{ required: true, message: 'Please enter BEL Part Number' }]}
                    >
                      <Input placeholder="Enter BEL part number" />
                    </Form.Item>
                    <Form.Item className="mb-0 text-right">
                      <Space>
                        <Button onClick={() => {
                          setIsAddToolModalVisible(false);
                          addToolForm.resetFields();
                        }}>
                          Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
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
                >
                  <Form
                    form={editToolForm}
                    layout="vertical"
                    initialValues={selectedTool}
                    onFinish={(values) => {
                      setTools(tools.map(tool => 
                        tool.id === selectedTool.id 
                          ? { ...tool, ...values }
                          : tool
                      ));
                      setIsEditToolModalVisible(false);
                      editToolForm.resetFields();
                      message.success('Tool updated successfully');
                    }}
                  >
                    <Form.Item
                      name="toolType"
                      label="Tool Type"
                      rules={[{ required: true, message: 'Please enter Tool Type' }]}
                    >
                      <Input placeholder="Enter tool type" />
                    </Form.Item>
                    <Form.Item
                      name="toolDescription"
                      label="Tool Description"
                      rules={[{ required: true, message: 'Please enter Tool Description' }]}
                    >
                      <Input.TextArea rows={3} placeholder="Enter tool description" />
                    </Form.Item>
                    <Form.Item
                      name="belPartNumber"
                      label="BEL Part Number"
                      rules={[{ required: true, message: 'Please enter BEL Part Number' }]}
                    >
                      <Input placeholder="Enter BEL part number" />
                    </Form.Item>
                    <Form.Item className="mb-0 text-right">
                      <Space>
                        <Button onClick={() => {
                          setIsEditToolModalVisible(false);
                          editToolForm.resetFields();
                        }}>
                          Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                          Update Tool
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Modal>

                {/* Add Program Modal */}
                <Modal
                  title="Add New Program"
                  open={isAddProgramModalVisible}
                  onCancel={() => {
                    setIsAddProgramModalVisible(false);
                    addProgramForm.resetFields();
                  }}
                  footer={null}
                >
                  <Form
                    form={addProgramForm}
                    layout="vertical"
                    onFinish={(values) => {
                      console.log('Add program values:', values);
                      message.success('Program added successfully');
                      setIsAddProgramModalVisible(false);
                      addProgramForm.resetFields();
                    }}
                  >
                    <Form.Item
                      name="programNo"
                      label="Program Number"
                      rules={[{ required: true, message: 'Please enter Program Number' }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[{ required: true, message: 'Please enter description' }]}
                    >
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                      name="version"
                      label="Version"
                      rules={[{ required: true, message: 'Please enter version' }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="programFile"
                      label="Program File"
                    >
                      <Upload
                        maxCount={1}
                        beforeUpload={() => false}
                      >
                        <Button icon={<UploadOutlined />}>Select File</Button>
                      </Upload>
                    </Form.Item>
                    <Form.Item className="mb-0 text-right">
                      <Space>
                        <Button onClick={() => {
                          setIsAddProgramModalVisible(false);
                          addProgramForm.resetFields();
                        }}>
                          Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                          Add Program
                        </Button>
                      </Space>
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
                  footer={null}
                >
                  <Form
                    form={editProgramForm}
                    layout="vertical"
                    initialValues={selectedProgram}
                    onFinish={(values) => {
                      console.log('Edit program values:', values);
                      message.success('Program updated successfully');
                      setIsEditProgramModalVisible(false);
                      editProgramForm.resetFields();
                    }}
                  >
                    <Form.Item
                      name="programNo"
                      label="Program Number"
                      rules={[{ required: true, message: 'Please enter Program Number' }]}
                    >
                      <Input disabled />
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[{ required: true, message: 'Please enter description' }]}
                    >
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                      name="version"
                      label="Version"
                      rules={[{ required: true, message: 'Please enter version' }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="programFile"
                      label="Program File"
                    >
                      <Upload
                        maxCount={1}
                        beforeUpload={() => false}
                      >
                        <Button icon={<UploadOutlined />}>Update File</Button>
                      </Upload>
                    </Form.Item>
                    <Form.Item className="mb-0 text-right">
                      <Space>
                        <Button onClick={() => {
                          setIsEditProgramModalVisible(false);
                          editProgramForm.resetFields();
                        }}>
                          Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                          Update Program
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Modal>
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <BarChartOutlined />
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
                    <CalendarOutlined />
                    Schedule Guide
                  </span>
                }
                key="schedule"
              >
                <Card className="bg-gray-50">
                  <Steps 
                    direction="vertical" 
                    current={1}
                    className="max-w-3xl mx-auto"
                  >
                    <Steps.Step 
                      title="Plan Operations" 
                      description={
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>1. Define all manufacturing operations in sequence</p>
                          <p>2. Specify required tools and fixtures</p>
                          <p>3. Set up operation parameters and instructions</p>
                        </div>
                      }
                      icon={<ToolOutlined size={16} />}
                    />
                    <Steps.Step 
                      title="Check Resources" 
                      description={
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>1. Review machine availability in Resources tab</p>
                          <p>2. Verify tool and fixture availability</p>
                          <p>3. Check operator skill requirements</p>
                        </div>
                      }
                      icon={<Gauge size={16} />}
                    />
                    <Steps.Step 
                      title="Schedule Operations" 
                      description="Allocate time slots for each operation"
                      icon={<Calendar size={16} />}
                    />
                    <Steps.Step 
                      title="Assign Personnel" 
                      description="Assign operators to scheduled operations"
                      icon={<Users size={16} />}
                    />
                  </Steps>

                  <Alert
                    className="mt-6 max-w-3xl mx-auto"
                    message="Scheduling Tips"
                    description={
                      <ul className="list-disc pl-4">
                        <li>Consider machine maintenance schedules</li>
                        <li>Account for setup and changeover times</li>
                        <li>Plan for potential bottlenecks</li>
                        <li>Leave buffer time for unexpected delays</li>
                      </ul>
                    }
                    type="info"
                    showIcon
                  />
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
    </div>
  );
};

export default Planning;