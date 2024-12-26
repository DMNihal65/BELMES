import React, { useState } from 'react';
import { Card, Typography, Space, Button, Tree, Collapse, List, Modal, Form, Input, Select, Badge, Divider } from 'antd';
import { 
  ArrowLeftOutlined, 
  QuestionCircleOutlined, 
  BookOutlined, 
  MessageOutlined,
  SearchOutlined,
  FileTextOutlined,
  ToolOutlined,
  BugOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Search } = Input;

function HelpAndSupport() {
  const navigate = useNavigate();
  const [isIssueModalVisible, setIsIssueModalVisible] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Tree data for issue categories
  const issueTreeData = [
    {
      title: 'Machine Issues',
      key: '0-0',
      icon: <ToolOutlined style={{ color: '#0284C7' }} />,
      children: [
        { title: 'Machine not starting', key: '0-0-0' },
        { title: 'Unusual noise', key: '0-0-1' },
        { title: 'Error messages', key: '0-0-2' },
      ],
    },
    {
      title: 'Software Issues',
      key: '0-1',
      icon: <BugOutlined style={{ color: '#38BDF8' }} />,
      children: [
        { title: 'Login problems', key: '0-1-0' },
        { title: 'Data not saving', key: '0-1-1' },
        { title: 'Screen freezing', key: '0-1-2' },
      ],
    },
    {
      title: 'Process Issues',
      key: '0-2',
      icon: <FileTextOutlined style={{ color: '#7DD3FC' }} />,
      children: [
        { title: 'Quality concerns', key: '0-2-0' },
        { title: 'Production delays', key: '0-2-1' },
        { title: 'Material handling', key: '0-2-2' },
      ],
    },
  ];

  // FAQ data
  const faqData = [
    {
      question: 'How do I mark a task as completed?',
      answer: 'Navigate to the task list, find the specific task, and click the checkbox next to it. The system will automatically update the task status.',
    },
    {
      question: 'What should I do if I encounter a machine error?',
      answer: 'First, note down the error code. Then, check the machine manual for the specific error code. If the issue persists, report it through the issue reporting system.',
    },
    {
      question: 'How can I view my inspection history?',
      answer: 'Go to the Inspection Results page from the sidebar menu. You can filter the results by date range and part number to view specific inspection records.',
    },
    {
      question: 'Where can I find maintenance schedules?',
      answer: 'Access the Maintenance Guide from the sidebar menu. It shows all scheduled maintenance tasks and their due dates.',
    },
  ];

  // Documentation links
  const documentationLinks = [
    {
      title: 'Operator Manual',
      description: 'Complete guide for machine operation and maintenance',
      link: '/docs/operator-manual.pdf',
      icon: <FileTextOutlined style={{ fontSize: '24px', color: '#0284C7' }} />,
      type: 'Primary',
    },
    {
      title: 'Quick Start Guide',
      description: 'Basic instructions for daily operations',
      link: '/docs/quick-start.pdf',
      icon: <RightOutlined style={{ fontSize: '24px', color: '#38BDF8' }} />,
      type: 'Guide',
    },
    {
      title: 'Safety Guidelines',
      description: 'Important safety procedures and protocols',
      link: '/docs/safety-guidelines.pdf',
      icon: <ToolOutlined style={{ fontSize: '24px', color: '#7DD3FC' }} />,
      type: 'Safety',
    },
    {
      title: 'Troubleshooting Guide',
      description: 'Common issues and their solutions',
      link: '/docs/troubleshooting.pdf',
      icon: <BugOutlined style={{ fontSize: '24px', color: '#082F49' }} />,
      type: 'Support',
    },
  ];

  const handleIssueSelect = (selectedKeys, info) => {
    setSelectedIssueType(info.node.title);
    setIsIssueModalVisible(true);
  };

  const handleIssueSubmit = () => {
    form.validateFields().then(values => {
      console.log('Issue submitted:', { ...values, type: selectedIssueType });
      setIsIssueModalVisible(false);
      form.resetFields();
    });
  };

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white p-6 rounded-lg shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined style={{ color: '#0284C7' }} />}
              onClick={() => navigate('/operator/dashboard')}
              size="large"
              className="hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </Button>
            <div>
              <Title level={4} style={{ margin: 0, color: '#0284C7' }}>Help and Support</Title>
              <Text type="secondary">Get assistance and find answers to your questions</Text>
            </div>
          </div>
          <Search
            placeholder="Search for help..."
            style={{ width: 300 }}
            size="large"
            onSearch={handleSearch}
            className="hover:shadow-md transition-shadow"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issue Reporting Section */}
          <Card 
            title={
              <Space>
                <MessageOutlined style={{ color: '#0284C7' }} />
                <span className="font-semibold">Report an Issue</span>
                <Badge count="New" style={{ backgroundColor: '#38BDF8' }} />
              </Space>
            }
            className="hover:shadow-lg transition-shadow"
            headStyle={{ background: '#EFF6FF', borderBottom: '2px solid #0284C7' }}
          >
            <Paragraph className="mb-4">
              Select an issue category below to report a problem. Our support team will assist you as soon as possible.
            </Paragraph>
            <Tree
              showLine={{ showLeafIcon: false }}
              showIcon
              defaultExpandAll
              onSelect={handleIssueSelect}
              treeData={issueTreeData}
              className="custom-tree"
            />
          </Card>

          {/* FAQs Section */}
          <Card 
            title={
              <Space>
                <QuestionCircleOutlined style={{ color: '#38BDF8' }} />
                <span className="font-semibold">Frequently Asked Questions</span>
              </Space>
            }
            className="hover:shadow-lg transition-shadow"
            headStyle={{ background: '#E0F2FE', borderBottom: '2px solid #38BDF8' }}
          >
            <Collapse 
              bordered={false}
              className="custom-collapse"
              expandIcon={({ isActive }) => (
                <RightOutlined rotate={isActive ? 90 : 0} />
              )}
            >
              {faqData.map((faq, index) => (
                <Panel 
                  header={
                    <Text strong>{faq.question}</Text>
                  } 
                  key={index}
                  className="mb-2 rounded-lg hover:shadow-md transition-shadow"
                >
                  <p className="text-gray-600">{faq.answer}</p>
                </Panel>
              ))}
            </Collapse>
          </Card>
        </div>

        {/* Documentation Section */}
        <Card 
          title={
            <Space>
              <BookOutlined style={{ color: '#0284C7' }} />
              <span className="font-semibold">Documentation</span>
            </Space>
          }
          className="mt-6 hover:shadow-lg transition-shadow"
          headStyle={{ background: '#BAE6FD', borderBottom: '2px solid #0284C7' }}
        >
          <List
            grid={{ gutter: 16, column: 2 }}
            dataSource={documentationLinks}
            renderItem={item => (
              <List.Item>
                <Card 
                  hoverable 
                  className="border-l-4"
                  style={{ borderLeftColor: item.icon.props.style.color }}
                >
                  <div className="flex items-start gap-4">
                    {item.icon}
                    <div className="flex-1">
                      <Title level={5} className="mb-1">
                        <a href={item.link} className="hover:text-blue-500 transition-colors">
                          {item.title}
                        </a>
                      </Title>
                      <Text type="secondary">{item.description}</Text>
                      <div className="mt-2">
                        <Badge color={item.icon.props.style.color} text={item.type} />
                      </div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </Card>

        {/* Issue Reporting Modal */}
        <Modal
          title={
            <Space>
              <MessageOutlined style={{ color: '#0284C7' }} />
              <span>Report Issue: {selectedIssueType}</span>
            </Space>
          }
          open={isIssueModalVisible}
          onOk={handleIssueSubmit}
          onCancel={() => setIsIssueModalVisible(false)}
          okText="Submit Issue"
          cancelText="Cancel"
          okButtonProps={{ 
            style: { background: '#0284C7' },
            className: 'hover:scale-105 transition-transform'
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="description"
              label="Issue Description"
              rules={[{ required: true, message: 'Please describe the issue' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Please provide detailed information about the issue..."
                className="hover:border-blue-400 transition-colors"
              />
            </Form.Item>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select placeholder="Select issue priority">
                <Select.Option value="low">Low</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="high">High</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <style jsx>{`
          .custom-tree .ant-tree-node-content-wrapper:hover {
            background-color: #EFF6FF;
          }
          .custom-collapse .ant-collapse-item {
            margin-bottom: 8px;
            border: 1px solid #f0f0f0;
            border-radius: 8px;
          }
          .custom-collapse .ant-collapse-header {
            border-radius: 8px !important;
          }
        `}</style>
      </div>
    </div>
  );
}

export default HelpAndSupport;
