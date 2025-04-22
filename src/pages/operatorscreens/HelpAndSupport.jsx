import React, { useEffect } from 'react';
import { Card, Typography, Space, Badge, List, Spin, Alert, Button } from 'antd';
import { 
  BookOutlined, 
  FileTextOutlined,
  ToolOutlined,
  BugOutlined,
  FileOutlined,
  DownloadOutlined,
  RightOutlined
} from '@ant-design/icons';
import useHelpSupportStore from '../../store/help-support-store';
import { format } from 'date-fns';
import useAuthStore from '../../store/auth-store';

const { Title, Text } = Typography;

function HelpAndSupport() {
  const { 
    machineDocuments, 
    loading, 
    error, 
    fetchMachineDocuments,
    downloadDocument 
  } = useHelpSupportStore();

  const token = useAuthStore(state => state.token);

  useEffect(() => {
    // Assuming machine ID 3, you might want to make this dynamic
    fetchMachineDocuments(3);
  }, [fetchMachineDocuments]);

  const getDocumentIcon = (docType) => {
    switch (docType?.toLowerCase()) {
      case 'maintancedocuments':
        return <ToolOutlined style={{ fontSize: '24px', color: '#0284C7' }} />;
      case 'manual':
        return <FileTextOutlined style={{ fontSize: '24px', color: '#38BDF8' }} />;
      default:
        return <FileOutlined style={{ fontSize: '24px', color: '#7DD3FC' }} />;
    }
  };

  const handleDownload = (minioPath) => {
    downloadDocument(minioPath, token);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="flex-1 p-8">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div>
            <Title level={3} style={{ margin: 0, color: '#0284C7', fontWeight: '600' }}>
              Machine Documentation
            </Title>
            <Text type="secondary" className="text-lg mt-2">
              Access all machine-related documents and guides
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Enhanced Machine Documentation Section */}
          <Card 
            title={
              <Space size="large">
                <ToolOutlined style={{ fontSize: '24px', color: '#0284C7' }} />
                <span className="text-xl font-semibold">Machine Documents</span>
                <Badge 
                  count={machineDocuments.length} 
                  style={{ 
                    backgroundColor: '#38BDF8',
                    fontSize: '14px',
                    padding: '0 12px',
                    height: '24px',
                    borderRadius: '12px'
                  }} 
                />
              </Space>
            }
            className="hover:shadow-xl transition-all duration-300 rounded-xl border-none"
            headStyle={{ 
              background: 'linear-gradient(to right, #EFF6FF, #F0F9FF)',
              borderBottom: '2px solid #0284C7',
              borderRadius: '12px 12px 0 0',
              padding: '20px 24px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            {error && (
              <Alert
                message="Error loading documents"
                description={error}
                type="error"
                showIcon
                className="mb-6 rounded-lg"
              />
            )}

            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Spin size="large" />
              </div>
            ) : (
              <List
                grid={{ 
                  gutter: 24,
                  xs: 1,
                  sm: 1,
                  md: 2,
                  lg: 2,
                  xl: 2,
                  xxl: 3
                }}
                dataSource={machineDocuments}
                renderItem={item => (
                  <List.Item>
                    <Card 
                      hoverable 
                      className="border-l-4 rounded-lg transform hover:scale-102 transition-all duration-300"
                      style={{ borderLeftColor: '#0284C7' }}
                      bodyStyle={{ padding: '20px' }}
                    >
                      <div className="flex items-start gap-6">
                        {getDocumentIcon(item.latest_version?.metadata?.document_type)}
                        <div className="flex-1">
                          <Title level={5} className="mb-2">
                            <a 
                              onClick={() => handleDownload(item.latest_version.minio_path)}
                              className="hover:text-blue-500 transition-colors cursor-pointer"
                            >
                              {item.name}
                            </a>
                          </Title>
                          <Text type="secondary" className="block mb-4">{item.description}</Text>
                          <div className="space-y-3">
                            <Badge 
                              color="#0284C7" 
                              text={
                                <span className="text-sm">
                                  Version {item.latest_version.version_number}
                                </span>
                              }
                            />
                            <div className="text-sm text-gray-500">
                              Updated: {format(new Date(item.latest_version.created_at), 'dd/MM/yyyy HH:mm')}
                            </div>
                            <Button 
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownload(item.latest_version.minio_path)}
                              className="mt-4 hover:scale-105 transition-transform"
                              style={{ backgroundColor: '#0284C7' }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Enhanced General Documentation Section */}
          <Card 
            title={
              <Space size="large">
                <BookOutlined style={{ fontSize: '24px', color: '#0284C7' }} />
                <span className="text-xl font-semibold">General Documentation</span>
              </Space>
            }
            className="hover:shadow-xl transition-all duration-300 rounded-xl border-none"
            headStyle={{ 
              background: 'linear-gradient(to right, #F0F9FF, #E0F2FE)',
              borderBottom: '2px solid #0284C7',
              borderRadius: '12px 12px 0 0',
              padding: '20px 24px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <List
              grid={{ 
                gutter: 24,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 2,
                xxl: 3
              }}
              dataSource={[
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
              ]}
            renderItem={item => (
              <List.Item>
                <Card 
                  hoverable 
                    className="border-l-4 rounded-lg transform hover:scale-102 transition-all duration-300"
                  style={{ borderLeftColor: item.icon.props.style.color }}
                    bodyStyle={{ padding: '20px' }}
                >
                    <div className="flex items-start gap-6">
                    {item.icon}
                    <div className="flex-1">
                        <Title level={5} className="mb-2">
                        <a href={item.link} className="hover:text-blue-500 transition-colors">
                          {item.title}
                        </a>
                      </Title>
                        <Text type="secondary" className="block mb-4">{item.description}</Text>
                        <Badge 
                          color={item.icon.props.style.color} 
                          text={<span className="text-sm">{item.type}</span>} 
                        />
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </Card>
        </div>
      </div>
    </div>
  );
}

export default HelpAndSupport;
