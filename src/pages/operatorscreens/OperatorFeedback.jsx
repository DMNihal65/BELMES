import React, { useState } from 'react';
import { List, Input, Button } from 'antd';

const OperatorFeedback = () => {
  const [feedback, setFeedback] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);

  const handleSubmit = () => {
    if (feedback) {
      setFeedbackList([...feedbackList, feedback]);
      setFeedback('');
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold">Operator xxxFeedback</h3>
      <Input.TextArea
        rows={2}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Share your feedback..."
      />
      <Button type="primary" onClick={handleSubmit} className="mt-2">
        Submit
      </Button>
      <List
        className="mt-4"
        bordered
        dataSource={feedbackList}
        renderItem={(item) => (
          <List.Item>{item}</List.Item>
        )}
      />
    </div>
  );
};

export default OperatorFeedback; 