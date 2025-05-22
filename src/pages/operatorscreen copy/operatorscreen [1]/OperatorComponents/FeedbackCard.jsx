import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Tabs, Table, DatePicker, Empty, Tag, Tooltip, Popconfirm } from 'antd';
import { MessageCircle, Send, Clock, User, History, Filter, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useOperatorStore from '../../../store/operator-store';
import moment from 'moment';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const FeedbackCard = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const [message, setMessage] = useState('');
  const [handoverNotes, setHandoverNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [messageType, setMessageType] = useState('info'); // 'info', 'issue', 'task'
  
  const { machineStatus } = useOperatorStore();
  
  // Load handover notes from localStorage on initial render
  useEffect(() => {
    const machineId = machineStatus?.machine_id || localStorage.getItem('currentMachineId');
    if (!machineId) return;
    
    const storageKey = `handover-notes-machine-${machineId}`;
    const storedNotes = localStorage.getItem(storageKey);
    
    if (storedNotes) {
      try {
        const parsedNotes = JSON.parse(storedNotes);
        setHandoverNotes(parsedNotes);
        setFilteredNotes(parsedNotes);
      } catch (error) {
        console.error('Error parsing stored handover notes:', error);
      }
    }
  }, [machineStatus]);
  
  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        return {
          username: parsedData?.state?.user?.username || 'Unknown Operator',
          role: parsedData?.state?.user?.role || 'Operator',
          id: parsedData?.state?.user_id || 0
        };
      }
      return { username: 'Unknown Operator', role: 'Operator', id: 0 };
    } catch (error) {
      console.error('Error getting user info:', error);
      return { username: 'Unknown Operator', role: 'Operator', id: 0 };
    }
  };
  
  // Get shift based on current time
  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'Morning (6-14)';
    if (hour >= 14 && hour < 22) return 'Evening (14-22)';
    return 'Night (22-6)';
  };
  
  // Handle handover note submission
  const handleSubmit = () => {
    if (!message.trim()) return;
    
    setSubmitting(true);
    
    // Get plain text from HTML
    const plainTextMessage = message.replace(/<[^>]+>/g, '').trim();
    
    const userInfo = getUserInfo();
    const machineId = machineStatus?.machine_id || localStorage.getItem('currentMachineId');
    const machineName = machineStatus?.machine_name || 'Unknown Machine';
    
    if (!machineId) {
      alert('Cannot identify machine. Please refresh or select a machine.');
      setSubmitting(false);
      return;
    }
    
    const newNote = {
      id: Date.now(),
      user: userInfo.username,
      userId: userInfo.id,
      machineId: machineId,
      machineName: machineName,
      message: plainTextMessage,
      htmlMessage: message,
      type: messageType,
      shift: getCurrentShift(),
      created: moment().format('YYYY-MM-DD HH:mm:ss'),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null
    };
    
    const updatedNotes = [newNote, ...handoverNotes];
    const storageKey = `handover-notes-machine-${machineId}`;
    
    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    
    // Update state
    setHandoverNotes(updatedNotes);
    setFilteredNotes(updatedNotes);
    setMessage('');
    setMessageType('info');
    setSubmitting(false);
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    
    if (!dates) {
      setFilteredNotes(handoverNotes);
      return;
    }
    
    const [startDate, endDate] = dates;
    const filtered = handoverNotes.filter(item => {
      const itemDate = moment(item.created);
      return itemDate.isBetween(startDate, endDate, null, '[]');
    });
    
    setFilteredNotes(filtered);
  };
  
  // Delete handover note
  const handleDeleteNote = (id) => {
    const machineId = machineStatus?.machine_id || localStorage.getItem('currentMachineId');
    if (!machineId) return;
    
    const updatedList = handoverNotes.filter(item => item.id !== id);
    const storageKey = `handover-notes-machine-${machineId}`;
    
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
    setHandoverNotes(updatedList);
    setFilteredNotes(updatedList);
  };
  
  // Acknowledge a handover note
  const handleAcknowledgeNote = (id) => {
    const machineId = machineStatus?.machine_id || localStorage.getItem('currentMachineId');
    if (!machineId) return;
    
    const userInfo = getUserInfo();
    const updatedList = handoverNotes.map(item => {
      if (item.id === id) {
        return {
          ...item,
          acknowledged: true,
          acknowledgedBy: userInfo.username,
          acknowledgedAt: moment().format('YYYY-MM-DD HH:mm:ss')
        };
      }
      return item;
    });
    
    const storageKey = `handover-notes-machine-${machineId}`;
    
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
    setHandoverNotes(updatedList);
    setFilteredNotes(updatedList.filter(note => 
      !dateRange || moment(note.created).isBetween(dateRange[0], dateRange[1], null, '[]')
    ));
  };
  
  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'issue':
        return <AlertTriangle size={14} className="text-amber-500" />;
      case 'task':
        return <CheckCircle size={14} className="text-green-500" />;
      default:
        return <Info size={14} className="text-sky-500" />;
    }
  };
  
  // Table columns
  const columns = [
    {
      title: 'Date/Shift',
      dataIndex: 'created',
      key: 'created',
      width: 90,
      render: (date, record) => (
        <div className="text-xs">
          <div>{moment(date).format('MM/DD HH:mm')}</div>
          <div className="text-gray-500">{record.shift}</div>
        </div>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (text, record) => (
        <div className="py-1">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-medium flex items-center gap-1">
              {getTypeIcon(record.type)}
              <span>{record.user}</span>
            </span>
            {record.acknowledged && (
              <Tooltip title={`Acknowledged by ${record.acknowledgedBy} at ${moment(record.acknowledgedAt).format('HH:mm')}`}>
                <Tag color="green" className="text-xs ml-auto">Acknowledged</Tag>
              </Tooltip>
            )}
          </div>
          <div className="text-sm">{text}</div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 70,
      render: (_, record) => (
        <div className="flex gap-1">
          {!record.acknowledged && (
            <Tooltip title="Acknowledge">
              <Button 
                type="text" 
                icon={<CheckCircle size={14} className="text-green-500" />} 
                size="small" 
                onClick={() => handleAcknowledgeNote(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Delete this note?"
            onConfirm={() => handleDeleteNote(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <Card
      className="status-card h-full shadow-sm"
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-sky-500" size={18} />
            <span className="font-semibold">Operator Handover</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center">
            <User size={12} className="mr-1" />
            <span>{getUserInfo().username}</span>
          </div>
        </div>
      }
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="small"
        className="feedback-tabs"
      >
        <TabPane 
          tab={
            <span className="flex items-center gap-1">
              <Send size={14} />
              <span>Leave Note</span>
            </span>
          } 
          key="submit"
        >
          <div className="bg-sky-50 p-2 rounded-lg border border-sky-100 mb-2">
            <div className="flex gap-2 mb-2">
              <Button 
                type={messageType === 'info' ? 'primary' : 'default'} 
                size="small" 
                className={messageType === 'info' ? 'bg-sky-500' : ''}
                icon={<Info size={14} />}
                onClick={() => setMessageType('info')}
              >
                Info
              </Button>
              <Button 
                type={messageType === 'issue' ? 'primary' : 'default'} 
                size="small"
                className={messageType === 'issue' ? 'bg-amber-500' : ''}
                icon={<AlertTriangle size={14} />}
                onClick={() => setMessageType('issue')}
              >
                Issue
              </Button>
              <Button 
                type={messageType === 'task' ? 'primary' : 'default'} 
                size="small"
                className={messageType === 'task' ? 'bg-green-500' : ''}
                icon={<CheckCircle size={14} />}
                onClick={() => setMessageType('task')}
              >
                Task
              </Button>
            </div>
            
            <div className="quill-container" style={{ minHeight: '120px' }}>
              <ReactQuill
                theme="snow"
                value={message}
                onChange={setMessage}
                placeholder={
                  messageType === 'info' 
                    ? "Share important information for the next operator..." 
                    : messageType === 'issue' 
                    ? "Describe any issues with the machine or process..." 
                    : "Note any pending tasks for the next shift..."
                }
                style={{ height: '80px' }}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'bullet' }, { 'list': 'ordered' }]
                  ]
                }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-xs text-gray-500 flex items-center">
                <Clock size={12} className="mr-1" />
                <span>Current Shift: {getCurrentShift()}</span>
              </div>
              
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!message.trim()}
                className="bg-sky-500 hover:bg-sky-600"
                size="small"
                icon={<Send size={14} />}
              >
                Submit Note
              </Button>
            </div>
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span className="flex items-center gap-1">
              <History size={14} />
              <span>Previous Notes</span>
              {handoverNotes.filter(note => !note.acknowledged).length > 0 && (
                <Tag color="red" className="ml-1">
                  {handoverNotes.filter(note => !note.acknowledged).length}
                </Tag>
              )}
            </span>
          } 
          key="history"
        >
          <div className="bg-sky-50 p-2 rounded-lg border border-sky-100 mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-sky-700 font-medium flex items-center">
                <Filter size={14} className="mr-1" />
                <span>Filter by Date</span>
              </div>
              
              <RangePicker 
                size="small" 
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                allowClear
                className="text-xs"
                style={{ width: '230px' }}
              />
            </div>
            
            {filteredNotes.length > 0 ? (
              <div className="feedback-history-table" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                <Table
                  dataSource={filteredNotes}
                  columns={columns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  className="text-xs"
                  rowClassName={record => !record.acknowledged ? 'bg-amber-50' : ''}
                />
              </div>
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No handover notes found" 
                className="my-4"
              />
            )}
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default FeedbackCard; 