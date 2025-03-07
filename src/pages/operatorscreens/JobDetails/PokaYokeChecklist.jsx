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
      category: 'Documentation',
      items: [
        { 
          id: 'doc-1', 
          text: 'IPID (In-process Inspection Document)',
          required: true,
          checked: false,
          docNumber: 'IPID-2024-001',
          notes: 'Verify latest revision'
        },
        { 
          id: 'doc-2', 
          text: 'MPP (Manufacturing Process Plan)',
          required: true,
          checked: false,
          docNumber: 'MPP-2024-001',
          notes: 'Check operation sequence'
        },
        { 
          id: 'doc-3', 
          text: 'Engineering Drawings',
          required: true,
          checked: false,
          docNumber: 'DWG-2024-001',
          notes: 'Verify revision level'
        }
      ]
    },
    {
      id: 2,
      category: 'Tools & Equipment',
      items: [
        { 
          id: 'tool-1', 
          text: 'Required Tools Available',
          required: true,
          checked: false,
          notes: 'Check tool list in MPP'
        },
        { 
          id: 'tool-2', 
          text: 'Jigs & Fixtures Available',
          required: true,
          checked: false,
          notes: 'Verify fixture number and condition'
        },
        { 
          id: 'tool-3', 
          text: 'Measuring Instruments Calibrated',
          required: true,
          checked: false,
          notes: 'Check calibration dates'
        }
      ]
    },
    {
      id: 3,
      category: 'Machine Setup',
      items: [
        { 
          id: 'setup-1', 
          text: 'Machine Safety Guards in Place',
          required: true,
          checked: false,
          notes: 'Check all interlocks'
        },
        { 
          id: 'setup-2', 
          text: 'Program Number Verified',
          required: true,
          checked: false,
          notes: 'Match with MPP'
        }
      ]
    }
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