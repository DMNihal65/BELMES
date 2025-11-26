import React, { useEffect, useState } from 'react';
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
import CommonDocuments from '../supervisorscreens/CommonDocuments';

const { Title, Text } = Typography;

function HelpAndSupport() {
  const { 
    machineDocuments, 
    loading, 
    error, 
    fetchMachineDocuments,
    downloadDocument,
    downloadLatestDocument
  } = useHelpSupportStore();

  const token = useAuthStore(state => state.token);
  const currentMachine = useAuthStore(state => state.currentMachine);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    console.log("Component mounted, checking for machine ID...");
    
    let machineId = null;
    
    // First try to get machine from auth store
    if (currentMachine && currentMachine.id) {
      machineId = currentMachine.id;
      console.log("Using machine ID from auth store:", machineId);
    } else {
      // Try to get from localStorage as JSON object
      try {
        const storedMachine = localStorage.getItem('currentMachine');
        if (storedMachine) {
          const parsedMachine = JSON.parse(storedMachine);
          if (parsedMachine && parsedMachine.id) {
            machineId = parsedMachine.id;
            console.log("Using machine ID from localStorage (JSON):", machineId);
          }
        }
      } catch (e) {
        console.error("Error parsing machine from localStorage:", e);
      }
      
      // If still not found, try direct ID values
      if (!machineId) {
        const directId = localStorage.getItem('machineId');
        if (directId) {
          machineId = parseInt(directId, 10);
          console.log("Using direct machine ID from localStorage:", machineId);
        }
      }
    }
    
    console.log("Final machine ID:", machineId);
    console.log("Auth token available:", !!token);
    
    if (machineId) {
      console.log("Fetching documents for machine ID:", machineId);
      fetchMachineDocuments(machineId);
    } else {
      const errorMsg = 'No machine ID found. Using default machine ID: 3';
      console.warn(errorMsg);
      setLocalError(errorMsg);
      // Fallback to a default machine ID
      fetchMachineDocuments(3);
    }
  }, [fetchMachineDocuments, token, currentMachine]);

  // Log when documents are received or errors occur
  useEffect(() => {
    if (machineDocuments.length > 0) {
      console.log("Documents received:", machineDocuments.length);
    }
    if (error) {
      console.error("Error from store:", error);
    }
  }, [machineDocuments, error]);

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

  const handleDownload = (item) => {
    // If we have a document ID, use the new endpoint
    if (item.id) {
      console.log(`Downloading latest version of document ID: ${item.id}`);
      downloadLatestDocument(item.id, token);
    } 
    // Fallback to the old method if we only have a minio path
    else if (item.latest_version?.minio_path) {
      console.log(`Downloading document by minio path: ${item.latest_version.minio_path}`);
      downloadDocument(item.latest_version.minio_path, token);
    } else {
      console.error("Cannot download document - no ID or minio_path available", item);
    }
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
            {localError && (
              <Alert
                message="Warning"
                description={localError}
                type="warning"
                showIcon
                className="mb-6 rounded-lg"
              />
            )}
            
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
                              onClick={() => handleDownload(item)}
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
                              onClick={() => handleDownload(item)}
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

       
        </div>
      </div>
      <CommonDocuments/>
    </div>
  );
}

export default HelpAndSupport;
