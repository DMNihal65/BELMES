import React, { useEffect, useState } from 'react';
import { Card, List, Button, Tooltip, Modal, Spin, message } from 'antd';
import { 
  FileText, 
  BookText,
  Settings2,
  Download, 
  Eye 
} from 'lucide-react';
import useWebSocketStore from '../../../store/websocket-store';
import useAuthStore from '../../../store/auth-store';

const DocumentsList = () => {
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const { 
    jobData,
    fetchDocuments, 
    downloadDocument,
    documents,
    loading 
  } = useWebSocketStore();

  const { token } = useAuthStore();

  useEffect(() => {
    if (jobData?.part_number) {
      fetchDocuments(jobData.part_number);
    }
  }, [jobData?.part_number, fetchDocuments]);

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
      await downloadDocument(jobData.part_number, doc.type);
      message.success('Document downloaded successfully');
    } catch (error) {
      message.error('Failed to download document');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Spin /></div>;
  }

  return (
    <div className="p-4">
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
                // <Tooltip title="View Document" key="view">
                //   <Button 
                //     type="text" 
                //     icon={<Eye size={16} />}
                //     onClick={() => handleViewDocument(doc)}
                //   >
                //     View
                //   </Button>
                // </Tooltip>,
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
                    Version: {doc.data.latest_version.version_number}
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={selectedDocument?.title}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width="80%"
        footer={null}
      >
        {selectedDocument && (
          <iframe
            src={`http://172.18.7.85:6768/api/v1/document-management/documents/view/${jobData.part_number}/${selectedDocument.type}?token=${token}`}
            style={{ width: '100%', height: '80vh' }}
            title="Document Viewer"
          />
        )}
      </Modal>
    </div>
  );
};

export default DocumentsList; 