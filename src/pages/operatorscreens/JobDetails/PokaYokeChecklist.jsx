import React, { useState } from 'react';
import { 
  List, Checkbox, Card, Space, Button, Divider, 
  Alert, Image, Typography, Tag 
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  InfoCircleOutlined, CameraOutlined 
} from '@ant-design/icons';

const { Text, Title } = Typography;

const PokaYokeChecklist = ({ jobId }) => {
  const [checklist, setChecklist] = useState([
    {
      id: 1,
      category: 'Safety',
      items: [
        { 
          id: 'safety-1', 
          text: 'Safety guards in place and functional',
          required: true,
          checked: false,
          image: '/images/safety-guard.jpg',
          notes: 'Check all safety interlocks'
        },
        { 
          id: 'safety-2', 
          text: 'Emergency stop button accessible',
          required: true,
          checked: false,
          image: '/images/estop.jpg'
        }
      ]
    },
    {
      id: 2,
      category: 'Setup',
      items: [
        { 
          id: 'setup-1', 
          text: 'Correct fixture installed',
          required: true,
          checked: false,
          image: '/images/fixture.jpg',
          notes: 'Fixture number: F-123'
        },
        { 
          id: 'setup-2', 
          text: 'Tool preset verified',
          required: true,
          checked: false,
          image: '/images/tool-preset.jpg'
        }
      ]
    },
    // Add more categories...
  ]);

  const handleCheck = (categoryId, itemId) => {
    setChecklist(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map(item => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
          )
        };
      }
      return category;
    }));
  };

  const allChecked = checklist.every(category => 
    category.items.every(item => !item.required || item.checked)
  );

  return (
    <div className="space-y-6">
      <Alert
        message="Important Safety Check"
        description="All items must be verified before starting the operation."
        type="warning"
        showIcon
        className="mb-4"
      />

      {checklist.map(category => (
        <Card 
          key={category.id}
          title={
            <Space>
              <span>{category.category}</span>
              <Tag color="blue">
                {category.items.filter(item => item.checked).length}/
                {category.items.length}
              </Tag>
            </Space>
          }
          className="shadow-sm"
        >
          <List
            dataSource={category.items}
            renderItem={item => (
              <List.Item
                className={`${item.checked ? 'bg-green-50' : ''} 
                  ${item.required ? 'border-l-2 border-l-blue-500' : ''}`}
              >
                <Space align="start" className="w-full">
                  <Checkbox
                    checked={item.checked}
                    onChange={() => handleCheck(category.id, item.id)}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <Text strong>{item.text}</Text>
                      {item.required && (
                        <Tag color="red">Required</Tag>
                      )}
                    </div>
                    {item.notes && (
                      <Text type="secondary" className="block mt-1">
                        {item.notes}
                      </Text>
                    )}
                  </div>
                  {item.image && (
                    <Button 
                      type="text" 
                      icon={<CameraOutlined />}
                      onClick={() => {/* Show image modal */}}
                    >
                      View Image
                    </Button>
                  )}
                </Space>
              </List.Item>
            )}
          />
        </Card>
      ))}

      <Divider />

      <div className="flex justify-between items-center">
        <Space>
          {allChecked ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              All items verified
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              Pending items
            </Tag>
          )}
        </Space>
        <Space>
          <Button>Reset</Button>
          <Button 
            type="primary" 
            disabled={!allChecked}
          >
            Confirm & Start Operation
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default PokaYokeChecklist; 