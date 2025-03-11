import React, { useState } from 'react';
import { 
  List, Checkbox, Card, Space, Button, Typography, Tag,
  Divider, Alert 
} from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

const PokaYokeChecklist = ({ jobId }) => {
  const [checklist, setChecklist] = useState([
    { 
      id: 'doc-1', 
      text: 'IPID (In-process Inspection Document)',
      note: 'Verify latest revision',
      checked: false,
      required: true
    },
    { 
      id: 'doc-2', 
      text: 'MPP (Manufacturing Process Plan)',
      note: 'Check operation sequence',
      checked: false,
      required: true
    },
    { 
      id: 'doc-3', 
      text: 'Engineering Drawings',
      note: 'Verify revision level',
      checked: false,
      required: true
    },
    { 
      id: 'setup-1', 
      text: 'Required Tools Available',
      note: 'Check tool list in MPP',
      checked: false,
      required: true
    },
    { 
      id: 'setup-2', 
      text: 'Program Number Verified',
      note: 'Match with MPP',
      checked: false,
      required: true
    }
  ]);

  const handleCheck = (itemId) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const allChecked = checklist.every(item => !item.required || item.checked);
  const checkedCount = checklist.filter(item => item.checked).length;

  return (
    <div className="space-y-4">
      <Alert
        message="Safety First"
        description="Please verify all items before proceeding with the operation."
        type="info"
        showIcon
        icon={<InfoCircleOutlined className="text-blue-500" />}
        className="mb-6 border-blue-100 bg-blue-50"
      />

      <Card 
        title={
          <Space>
            <FileTextOutlined className="text-blue-500" />
            <span>Pre-Operation Checklist</span>
            <Tag color="blue">
              {checkedCount}/{checklist.length}
            </Tag>
          </Space>
        }
        className="shadow-sm border-blue-100"
        headStyle={{ background: '#f0f7ff' }}
      >
        <List
          dataSource={checklist}
          renderItem={item => (
            <List.Item
              className={`${item.checked ? 'bg-blue-50' : ''} 
                rounded-lg transition-colors duration-200 p-3`}
            >
              <div className="flex items-start w-full gap-3">
                <Checkbox
                  checked={item.checked}
                  onChange={() => handleCheck(item.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <Text strong className="text-gray-800">
                      {item.text}
                    </Text>
                    {item.required && (
                      <Tag color="blue">Required</Tag>
                    )}
                  </div>
                  {item.note && (
                    <Text type="secondary" className="block mt-1 text-sm">
                      {item.note}
                    </Text>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Divider className="my-6" />

      <div className="flex justify-between items-center">
        <Space>
          {allChecked ? (
            <Tag 
              icon={<CheckCircleOutlined />} 
              color="success"
              className="px-3 py-1"
            >
              All items verified
            </Tag>
          ) : (
            <Tag 
              icon={<InfoCircleOutlined />} 
              color="warning"
              className="px-3 py-1"
            >
              Pending verifications
            </Tag>
          )}
        </Space>
        <Space>
          <Button 
            type="default"
            onClick={() => setChecklist(prev => prev.map(item => ({ ...item, checked: false })))}
          >
            Reset
          </Button>
          <Button 
            type="primary"
            disabled={!allChecked}
            icon={<CheckCircleOutlined />}
          >
            Confirm & Start
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default PokaYokeChecklist; 