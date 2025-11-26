import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import { Card, Select, DatePicker, Typography, Space, Checkbox, Button, Badge, Progress, Modal, Input, Select as AntSelect, message, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined, FileExcelOutlined, FilterOutlined, EyeOutlined, DownloadOutlined, CloseOutlined, ToolOutlined, HistoryOutlined, WarningOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

import { Viewer } from '@react-pdf-viewer/core';
import { Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function MaintenanceScreen() {
  
  const navigate = useNavigate();
  const [selectedMachine, setSelectedMachine] = useState('DMG DMU 60 eVo linear');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDocumentModalVisible, setIsDocumentModalVisible] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const documents = [
    {
      type: 'Instructions',
      icon: '📋',
      description: 'Detailed machine operation and maintenance instructions',
      pdfUrl: '/documents/maintenance/instructions.pdf'  // Remove process.env.PUBLIC_URL
    },
    {
      type: 'Checklist',
      icon: '✓',
      description: 'Step-by-step maintenance verification checklist',
      pdfUrl: '/documents/maintenance/checklist.pdf'
    },
    {
      type: 'Daily',
      icon: '📅',
      description: 'Daily maintenance procedures and requirements',
      pdfUrl: '/documents/maintenance/daily.pdf'
    },
    {
      type: 'Regular',
      icon: '🔄',
      description: 'Regular maintenance schedule and procedures',
      pdfUrl: '/documents/maintenance/regular.pdf'
    }
  ];

  const validatePdfUrl = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Not a valid PDF file!');
      }
      return true;
    } catch (error) {
      console.error('PDF validation error:', error);
      return false;
    }
  };

  const DocumentModal = () => (
    <Modal
      title={selectedDocument?.type}
      open={isDocumentModalVisible}
      onCancel={() => setIsDocumentModalVisible(false)}
      width={1200}
      centered
      bodyStyle={{
        padding: '12px',
        height: '800px',
        overflow: 'hidden',
      }}
      footer={[
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => {
            const link = document.createElement('a');
            link.href = selectedDocument?.pdfUrl; // URL of the PDF
            link.download = selectedDocument?.type || 'document.pdf'; // Suggested file name
            link.click();
          }}
        >
          Download
        </Button>,
        <Button
          key="close"
          icon={<CloseOutlined />}
          onClick={() => setIsDocumentModalVisible(false)}
        >
          Close
        </Button>,
      ]}
    >
      <div style={{ height: '100%', border: '1px solid #ddd' }}>
        {selectedDocument?.pdfUrl ? (
          <iframe
            src={selectedDocument.pdfUrl}
            title={selectedDocument.type}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          ></iframe>
        ) : (
          <Text type="danger">Error loading document. Please try again.</Text>
        )}
      </div>
    </Modal>
  );
  

  const [tasks, setTasks] = useState([
    {
      id: 1,
      task: 'Clean Air Filter',
      status: false,
      code: 'M001',
      priority: 'High',
      instructions: 'Clean or replace air filter as needed',
      lastChecked: '2024/12/15',
    },
    {
      id: 2,
      task: 'Lubricate Moving Parts',
      status: false,
      code: 'M002',
      priority: 'High',
      instructions: 'Apply machine-specific lubricant to all moving components',
      lastChecked: '2024/12/10',
    },
    {
      id: 3,
      task: 'Check Coolant Levels',
      status: false,
      code: 'M003',
      priority: 'Medium',
      instructions: 'Inspect coolant reservoir and top up if necessary',
      lastChecked: '2024/12/12',
    },
    {
      id: 4,
      task: 'Inspect Tool Wear',
      status: false,
      code: 'M004',
      priority: 'High',
      instructions: 'Check cutting tools for wear and damage',
      lastChecked: '2024/12/14',
    },
    {
      id: 5,
      task: 'Clean Machine Base',
      status: false,
      code: 'M005',
      priority: 'Low',
      instructions: 'Remove chips and debris from machine base',
      lastChecked: '2024/12/13',
    },
    {
      id: 6,
      task: 'Check Hydraulic System',
      status: false,
      code: 'M006',
      priority: 'High',
      instructions: 'Inspect hydraulic fluid levels and pressure',
      lastChecked: '2024/12/11',
    },
    {
      id: 7,
      task: 'Calibrate Axes',
      status: false,
      code: 'M007',
      priority: 'Medium',
      instructions: 'Verify axis alignment and calibration',
      lastChecked: '2024/12/09',
    },
    {
      id: 8,
      task: 'Check Electrical Connections',
      status: false,
      code: 'M008',
      priority: 'High',
      instructions: 'Inspect all electrical connections for security',
      lastChecked: '2024/12/08',
    },
    {
      id: 9,
      task: 'Verify Safety Systems',
      status: false,
      code: 'M009',
      priority: 'Critical',
      instructions: 'Test all emergency stops and safety interlocks',
      lastChecked: '2024/12/07',
    },
    {
      id: 10,
      task: 'Clean Control Panel',
      status: false,
      code: 'M010',
      priority: 'Low',
      instructions: 'Clean and inspect control panel surfaces',
      lastChecked: '2024/12/06',
    },
    {
      id: 11,
      task: 'Check Spindle Condition',
      status: false,
      code: 'M011',
      priority: 'Critical',
      instructions: 'Inspect spindle for wear and proper operation',
      lastChecked: '2024/12/05',
    },
    {
      id: 12,
      task: 'Inspect Chip Conveyor',
      status: false,
      code: 'M012',
      priority: 'Medium',
      instructions: 'Check chip conveyor operation and clean if needed',
      lastChecked: '2024/12/04',
    },
    {
      id: 13,
      task: 'Check Way Covers',
      status: false,
      code: 'M013',
      priority: 'Medium',
      instructions: 'Inspect way covers for damage and proper movement',
      lastChecked: '2024/12/03',
    }
  ]);

  const machines = [
    'DMG DMU 60 eVo linear',
    'DMG DMU 60T mB',
    'DMG CTX BETA 1250TC',
  ];

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([...tasks]);

  const handleTaskChange = (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: !task.status } : task
    );
    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);
  };

  const getCompletionPercentage = () => {
    const completedTasks = tasks.filter((task) => task.status).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'red',
      'High': 'orange',
      'Medium': 'blue',
      'Low': 'green'
    };
    return colors[priority] || 'blue';
  };

  const handleExportReport = () => {
    try {
      const exportData = filteredTasks.map(task => ({
        'Task Code': task.code,
        'Task Name': task.task,
        'Priority': task.priority,
        'Instructions': task.instructions,
        'Status': task.status ? 'Completed' : 'Pending',
        'Last Checked': task.lastChecked
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Maintenance Tasks');
      
      const fileName = `maintenance_report_${selectedMachine}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      message.success('Report exported successfully!');
    } catch (error) {
      message.error('Failed to export report');
      console.error('Export error:', error);
    }
  };

  const handleFilter = () => {
    let filtered = [...tasks];

    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => 
        filterStatus === 'completed' ? task.status : !task.status
      );
    }

    if (searchText) {
      filtered = filtered.filter(task =>
        task.task.toLowerCase().includes(searchText.toLowerCase()) ||
        task.code.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setFilterPriority('all');
    setFilterStatus('all');
    setSearchText('');
    setFilteredTasks([...tasks]);
    setIsFilterModalVisible(false);
    message.success('Filters reset');
  };

  const FilterModal = () => (
    <Modal
      title="Filter Tasks"
      open={isFilterModalVisible}
      onOk={handleFilter}
      onCancel={() => setIsFilterModalVisible(false)}
      footer={[
        <Button key="reset" onClick={resetFilters}>
          Reset Filters
        </Button>,
        <Button key="cancel" onClick={() => setIsFilterModalVisible(false)}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={handleFilter}>
          Apply Filters
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <div>
          <div className="mb-2">Search Tasks</div>
          <Input
            placeholder="Search by task name or code"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<FilterOutlined />}
          />
        </div>
        <div>
          <div className="mb-2">Priority</div>
          <AntSelect
            style={{ width: '100%' }}
            value={filterPriority}
            onChange={setFilterPriority}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'Critical', label: 'Critical' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
          />
        </div>
        <div>
          <div className="mb-2">Status</div>
          <AntSelect
            style={{ width: '100%' }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </div>
      </div>
    </Modal>
  );

  const [activeTab, setActiveTab] = useState('1');

  const MaintenanceTasksTab = () => (
    <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
      <div className="col-span-3">
        <Card className="mb-6">
          <div className="space-y-4">
            <div>
              <div className="mb-2 font-medium">Select Machine</div>
              <Select
                value={selectedMachine}
                onChange={setSelectedMachine}
                style={{ width: '100%' }}
                options={machines.map((machine) => ({
                  value: machine,
                  label: machine,
                }))}
              />
            </div>
            <div>
              <div className="mb-2 font-medium">Select Date</div>
              <DatePicker
                style={{ width: '100%' }}
                format="DD-MM-YYYY"
                suffixIcon={<CalendarOutlined />}
              />
            </div>
          </div>
        </Card>

        <Card>
          <Title level={5} className="mb-4">Maintenance Summary</Title>
          <Progress
            type="circle"
            percent={getCompletionPercentage()}
            width={120}
            format={(percent) => (
              <div className="text-center">
                <div className="text-lg font-bold">{percent}%</div>
                <div className="text-xs">
                  {tasks.filter((task) => task.status).length}/{tasks.length} Tasks
                </div>
              </div>
            )}
          />
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center">
              <Text>Critical Tasks</Text>
              <Badge count={tasks.filter(t => t.priority === 'Critical').length} color="red" />
            </div>
            <div className="flex justify-between items-center">
              <Text>High Priority</Text>
              <Badge count={tasks.filter(t => t.priority === 'High').length} color="orange" />
            </div>
            <div className="flex justify-between items-center">
              <Text>Medium Priority</Text>
              <Badge count={tasks.filter(t => t.priority === 'Medium').length} color="blue" />
            </div>
            <div className="flex justify-between items-center">
              <Text>Low Priority</Text>
              <Badge count={tasks.filter(t => t.priority === 'Low').length} color="green" />
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-9 bg-white rounded-lg shadow">
        <Card 
          title={`Maintenance Tasks for ${selectedMachine}`}
          className="h-full"
          bodyStyle={{ height: 'calc(100vh - 220px)', overflow: 'auto' }}
          extra={
            <Space>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                onClick={handleExportReport}
              >
                Export Report
              </Button>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setIsFilterModalVisible(true)}
              >
                Filter Tasks
              </Button>
            </Space>
          }
        >
          <FilterModal />
          
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Task</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Instructions</th>
                <th className="px-4 py-3 text-left">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr 
                  key={task.id}
                  className={`transition-colors ${
                    task.status ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={task.status}
                      onChange={() => handleTaskChange(task.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{task.task}</td>
                  <td className="px-4 py-3 text-gray-500">{task.code}</td>
                  <td className="px-4 py-3">
                    <Badge color={getPriorityColor(task.priority)} text={task.priority} />
                  </td>
                  <td className="px-4 py-3">{task.instructions}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex items-center gap-2">
                      <ClockCircleOutlined />
                      {task.lastChecked}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );

  const DocumentationTab = () => (
    <div className="p-6">
      <Card title="Documentation" className="p-2">
        <div className="grid grid-cols-4 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.type}
              className="text-center p-1 max-w-xs"
            >
              <div className="text-lg">{doc.icon}</div>
              <Title level={5} className="!mb-0 text-sm">{doc.type}</Title>
              <Text type="secondary" className="text-xs mb-2 mr-3">{doc.description}</Text> 
              <Button 
                type="primary" 
                icon={<EyeOutlined />}
                size="small"
                onClick={() => {
                  setSelectedDocument(doc);
                  setIsDocumentModalVisible(true);
                }}
              >
                View
              </Button>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  const MaintenanceHistoryTab = () => (
    <div className="p-6">
      <Card title="Maintenance History">
        <div>Maintenance History Component will be implemented here</div>
      </Card>
    </div>
  );

  const TroubleshootingTab = () => (
    <div className="p-6">
      <Card title="Troubleshooting Guide">
        <div>Troubleshooting Component will be implemented here</div>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* <div className="bg-white shadow-sm px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/operator/dashboard')}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Machine Maintenance Guide
          </Title>
        </div>
      </div> */}

      <div className="flex-1 overflow-hidden">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="px-6 pt-4"
          items={[
            {
              key: '1',
              label: (
                <span>
                  <ToolOutlined />
                  Maintenance Tasks
                </span>
              ),
              children: <MaintenanceTasksTab />
            },
            // {
            //   key: '2',
            //   label: (
            //     <span>
            //       <FileExcelOutlined />
            //       Documentation
            //     </span>
            //   ),
            //   children: <DocumentationTab />
            // },
            {
              key: '2',
              label: (
                <span>
                  <HistoryOutlined />
                  Maintenance History
                </span>
              ),
              children: <MaintenanceHistoryTab />
            },
            // {
            //   key: '4',
            //   label: (
            //     <span>
            //       <WarningOutlined />
            //       Troubleshooting
            //     </span>
            //   ),
            //   children: <TroubleshootingTab />
            // }
          ]}
        />
      </div>

      <DocumentModal />
      <FilterModal />
    </div>
  );
}

export default MaintenanceScreen;