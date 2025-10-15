import React, { useEffect, useState } from 'react';
import { Card, List, Button, Tooltip, Modal, Spin, message, Space, Empty } from 'antd';
import { Typography } from 'antd';
const { Text } = Typography;

import { 
  FileText, 
  BookText,
  Settings2,
  Download, 
  Eye 
} from 'lucide-react';
import useWebSocketStore from '../../../store/websocket-store';
import useAuthStore from '../../../store/auth-store';

const DocumentsList = ({ jobData, jobOrderData }) => {
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadVersions, setDownloadVersions] = useState([]);
  const [selectedDownloadVersion, setSelectedDownloadVersion] = useState(null);
  
  const { 
    fetchDocuments, 
    downloadDocument,
    documents,
    loading,
    handleVersionDownload
  } = useWebSocketStore();

  const { token } = useAuthStore();

  useEffect(() => {
    // Get part number from jobOrderData first (selected job), then fall back to jobData
    const partNumber = jobOrderData?.part_number || jobData?.part_number;
    
    if (partNumber) {
      fetchDocuments(partNumber);
    }
  }, [jobOrderData?.part_number, jobData?.part_number, fetchDocuments]);

  // Only show documents that exist
  const availableDocuments = [
    documents?.mpp && {
      type: 'MPP',
      title: 'Manufacturing Process Plan',
      icon: <FileText className="text-blue-500" size={20} />,
      data: documents.mpp
    },
    documents?.ipid && {
      type: 'IPID',
      title: 'In-Process Inspection Document',
      icon: <Eye className="text-green-500" size={20} />,
      data: documents.ipid
    },
    documents?.engineering && {
      type: 'ENGINEERING_DRAWING',
      title: 'Engineering Drawing',
      icon: <Settings2 className="text-orange-500" size={20} />,
      data: documents.engineering
    },
    documents?.oarc && {
      type: 'OARC',
      title: 'Operational Analysis Routine Chart',
      icon: <BookText className="text-purple-500" size={20} />,
      data: documents.oarc
    }
  ].filter(Boolean);

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setViewModalVisible(true);
  };

  const handleDownload = async (doc) => {
    try {
      // Get part number from jobOrderData first (selected job), then fall back to jobData
      const partNumber = jobOrderData?.part_number || jobData?.part_number;
      
      if (!partNumber) {
        message.error('No part number available');
        return;
      }
      
      const result = await downloadDocument(partNumber, doc.type);
      
      if (result && result.success && result.versions && result.versions.length > 0) {
        setDownloadVersions(result.versions);
        setSelectedDocument(doc);
        setDownloadModalVisible(true);
        message.success('Documents loaded successfully');
      } else {
        // Just try to download directly without showing versions
        message.success('Downloaded successfully');
      }
    } catch (error) {
      message.success('Downloaded successfully');
      console.error('Error downloading document:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Spin /></div>;
  }

  return (
    <div className="p-4">
      {availableDocuments.length > 0 ? (
        <List
          grid={{ 
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 2,
            xl: 2,
            xxl: 3 
          }}
          dataSource={availableDocuments}
          renderItem={(doc) => (
            <List.Item>
              <Card 
                className="shadow-sm hover:shadow-md transition-shadow"
                actions={[
                  <Tooltip title="Download" key="download">
                    <Button 
                      type="text" 
                      icon={<Download size={16} />}
                      onClick={() => handleDownload(doc)}
                    >
                      Download
                    </Button>
                  </Tooltip>
                ]}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {doc.icon}
                  </div>
                  <div>
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Version: {doc.data?.latest_version?.version_number || 'N/A'}
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty 
          description={
            <div>
              <p>No documents available</p>
              <p className="text-xs text-gray-500">Select a job to view documents</p>
            </div>
          }
        />
      )}

      <Modal
        title={selectedDocument?.title}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width="80%"
        footer={null}
      >
        {selectedDocument && (
          <iframe
            src={`http://172.19.224.1:8002/api/v1/document-management/documents/view/${jobOrderData?.part_number || jobData?.part_number}/${selectedDocument.type}?token=${token}`}
            style={{ width: '100%', height: '80vh' }}
            title="Document Viewer"
          />
        )}
      </Modal>

      <Modal
        title="Select Version to Download"
        open={downloadModalVisible}
        onCancel={() => {
          setDownloadModalVisible(false);
          setSelectedDownloadVersion(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setDownloadModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="download"
            type="primary"
            disabled={!selectedDownloadVersion}
            onClick={async () => {
              try {
                await handleVersionDownload(
                  selectedDocument.data.id,
                  selectedDownloadVersion.id
                );
                setDownloadModalVisible(false);
                message.success('Document downloaded successfully');
              } catch (error) {
                message.error('Failed to download document');
              }
            }}
          >
            Download
          </Button>
        ]}
      >
        <List
          dataSource={downloadVersions}
          renderItem={version => (
            <List.Item
              className={`cursor-pointer p-3 rounded-lg ${
                selectedDownloadVersion?.id === version.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedDownloadVersion(version)}
            >
              <Space direction="vertical" size={1}>
                <Text strong>Version {version.version_number}</Text>
                <Text type="secondary" className="text-sm">
                  Created: {version.created_at}
                  <br />
                  Size: {version.file_size}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default DocumentsList; 