import React, { useState } from 'react';
import { Modal, Button, Table, Tabs, DatePicker, Badge, Tooltip } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import moment from 'moment'; // Import moment for date handling

const { RangePicker } = DatePicker;

const FeedbackModal = ({ visible, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');
  const [selectedDates, setSelectedDates] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]); // Store feedback entries
  const [showFeedbackList, setShowFeedbackList] = useState(false); // Control feedback list modal
  const { TabPane } = Tabs;

  // Predefined operators and their shifts
  const operators = [
    { name: 'Ramesh', shift: 1 },
    { name: 'Suresh', shift: 2 },
    { name: 'Rajesh', shift: 3 },
    { name: 'Dinesh', shift: 1 },
    { name: 'Mahesh', shift: 2 },
  ];

  // Function to generate random feedback data
  const generateRandomFeedback = (date) => {
    const randomFeedback = [];
    for (let i = 0; i < 5; i++) {
      const operator = operators[Math.floor(Math.random() * operators.length)];
      randomFeedback.push({
        key: i, // Add a key for each entry
        operator: `${operator.name} (Shift ${operator.shift})`, // Format operator name with shift
        machine: `Machine ${Math.floor(Math.random() * 10) + 1}`,
        feedback: `Feedback for ${date.format('YYYY-MM-DD')} - Entry ${i + 1}`,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'), // Add timestamp for feedback
      });
    }
    return randomFeedback;
  };

  // Get feedback based on selected date range
  const getFeedbackForDateRange = () => {
    if (selectedDates) {
      const feedbackData = [];
      selectedDates.forEach(date => {
        feedbackData.push(...generateRandomFeedback(date));
      });
      return feedbackData;
    }
    return [];
  };

  const handleSubmit = () => {
    if (feedback) {
      // Strip HTML tags from feedback
      const plainTextFeedback = feedback.replace(/<[^>]+>/g, ''); // Remove HTML tags
      const newFeedback = {
        operator: '(Shift 1)', // Example operator
        machine: 'Machine 1', // Example machine
        feedback: plainTextFeedback, // Store plain text feedback
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'), // Add timestamp for feedback
      };
      setFeedbackList([...feedbackList, newFeedback]); // Add new feedback to the list
      onSubmit(plainTextFeedback); // Call the onSubmit function passed as a prop
      setFeedback(''); // Clear feedback after submission
      onClose(); // Close the modal
    }
  };

  // Define columns for the table
  const columns = [
    {
      title: 'Operator (Shift)',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  return (
    <Modal
      title="Operator Feedback"
      open={visible}
      onCancel={onClose}
      footer={null} // Set footer to null to customize it
      width={800} // Increase the width of the modal
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="Submit Feedback" key="1">
          <ReactQuill 
            value={feedback}
            onChange={setFeedback}
            placeholder="Share your feedback..."
          />
          
          {/* Enhanced Notification for Feedback */}
          <div className="flex items-center justify-between mt-4">
            <Button key="cancel" onClick={onClose} style={{ marginRight: '8px' }}>
              Cancel
            </Button>
            <Button key="submit" type="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </TabPane>
        <TabPane tab="Previous Feedback" key="2">
          <h3 className="mt-4">Previous Feedback</h3>
          <RangePicker 
            onChange={(dates) => setSelectedDates(dates)} 
            style={{ marginBottom: '16px' }} 
          />
          <Table
            columns={columns}
            dataSource={getFeedbackForDateRange()}
            pagination={false} // Disable pagination for simplicity
            bordered
            rowClassName="table-row"
          />
        </TabPane>
      </Tabs>

      {/* Feedback List Modal */}
      <Modal
        title="Feedback List"
        visible={showFeedbackList}
        onCancel={() => setShowFeedbackList(false)}
        footer={[
          <Button key="close" onClick={() => setShowFeedbackList(false)}>
            Close
          </Button>,
        ]}
      >
        <Table
          columns={columns}
          dataSource={feedbackList.map((item, index) => ({
            key: index,
            operator: item.operator,
            machine: item.machine,
            feedback: item.feedback,
            timestamp: item.timestamp,
          }))}
          pagination={false}
          bordered
        />
      </Modal>
    </Modal>
  );
};

export default FeedbackModal; 