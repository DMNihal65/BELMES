import React, { useState } from 'react';
import { Tabs, Card, List, Empty, Button, Tag, Tooltip, Spin, Alert, message } from 'antd';
import { 
  FileText, Download, Eye, FileArchive, 
  FileImage, Database, AlertCircle, Info 
} from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';

const { TabPane } = Tabs;

// API endpoints for document downloads
const API_BASE_URL = "http://172.19.224.1:8002";
const MPP_API_BASE_URL = "http://172.19.224.1:8002";

const DocumentsCard = () => {
  const { jobDocuments, selectedJob, isLoadingJobs } = useOperatorStore();
  const [activeTab, setActiveTab] = useState('all');
  const [downloading, setDownloading] = useState(false);

  // Handle document preview with authentication
  const handlePreview = (documentId) => {
    try {
      // Get authentication token
      const authStorage = localStorage.getItem('auth-storage');
      let authToken = localStorage.getItem('token');
      
      if (!authToken && authStorage) {
        try {
          const parsedAuthStorage = JSON.parse(authStorage);
          authToken = parsedAuthStorage?.state?.token;
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
      
      if (!authToken) {
        message.error('Authentication token not found');
        return;
      }
      
      // Create URL with authentication header
      const previewUrl = `${MPP_API_BASE_URL}/api/v1/document-management/documents/${documentId}/preview-latest`;
      
      // Open in new window with auth
      const previewWindow = window.open('about:blank', '_blank');
      
      // Create a form to POST the token
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = previewUrl;
      form.target = '_blank';
      
      // Add token as hidden field
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = authToken;
      form.appendChild(tokenInput);
      
      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      // Alternatively, we could use fetch with the token and create a blob URL
      // This approach ensures the token is sent in the Authorization header
      setTimeout(() => {
        fetch(previewUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to load preview');
          return response.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          if (previewWindow) {
            previewWindow.location = url;
          } else {
            window.open(url, '_blank');
          }
        })
        .catch(error => {
          console.error('Preview error:', error);
          message.error('Failed to load document preview');
          if (previewWindow) previewWindow.close();
        });
      }, 100);
    } catch (error) {
      console.error('Error opening preview:', error);
      message.error('Failed to open document preview');
    }
  };

  // Handle document download
  const handleDownload = async (documentId, documentType) => {
    if (downloading) return;
    
    setDownloading(true);
    try {
      let url;
      
      if (documentId) {
        // Download by document ID
        url = `${MPP_API_BASE_URL}/api/v1/document-management/documents/${documentId}/download-latest`;
      } else if (documentType && selectedJob?.part_number) {
        // Download by document type and part number
        url = `${MPP_API_BASE_URL}/api/v1/document-management/documents/download-latest/${selectedJob.part_number}/${documentType}`;
      } else {
        throw new Error('Missing document information');
      }
      
      // Get authentication token from localStorage
      const authToken = localStorage.getItem('token') || JSON.parse(localStorage.getItem('auth-storage'))?.state?.token;
      
      if (!authToken) {
        throw new Error('Authentication token not found');
      }
      
      // Fetch the document with auth token
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'document';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Use a default name based on document type
        filename = `${selectedJob.part_number}_${documentType || 'document'}.pdf`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      message.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      message.error(`Failed to download document: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Get document type icon
  const getDocumentTypeIcon = (doc) => {
    if (!doc) return <FileText />;
    
    const docType = doc.doc_type_id;
    switch (docType) {
      case 1: // MPP
        return <Database className="text-blue-500" />;
      case 2: // Engineering Drawing
        return <FileImage className="text-green-500" />;
      case 3: // CNC Program
        return <FileArchive className="text-purple-500" />;
      default:
        return <FileText className="text-gray-500" />;
    }
  };

  // Get document type name
  const getDocumentTypeName = (doc) => {
    if (!doc) return 'Unknown';
    
    const docType = doc.doc_type_id;
    switch (docType) {
      case 1:
        return 'MPP';
      case 2:
        return 'Engineering Drawing';
      case 3:
        return 'CNC Program';
      default:
        return 'Other';
    }
  };

  // Get file extension
  const getFileExtension = (path) => {
    if (!path) return '';
    
    const parts = path.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    
    return '';
  };

  // Filter documents by type
  const getFilteredDocuments = () => {
    if (!jobDocuments) return [];
    
    switch (activeTab) {
      case 'mpp':
        return jobDocuments.mpp_document ? [jobDocuments.mpp_document] : [];
      case 'drawing':
        return jobDocuments.engineering_drawing_document ? [jobDocuments.engineering_drawing_document] : [];
      case 'cnc':
        return jobDocuments.all_documents?.filter(doc => doc.doc_type_id === 3) || [];
      case 'all':
      default:
        return jobDocuments.all_documents || [];
    }
  };

  if (isLoadingJobs) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Spin tip="Loading documents..." />
      </div>
    );
  }

  if (!selectedJob) {
    return (
      <div className="p-8">
        <Empty 
          description="No job selected" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  if (!jobDocuments || (!jobDocuments.all_documents || jobDocuments.all_documents.length === 0)) {
    return (
      <div className="p-8">
        <Alert
          message="No Documents Found"
          description={`No documents available for part number ${selectedJob.part_number}`}
          type="info"
          showIcon
          icon={<Info />}
        />
      </div>
    );
  }

  const documents = getFilteredDocuments();

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-1">Documents</div>
        <div className="text-sm text-gray-500">
          {selectedJob.part_number} - {selectedJob.part_description || selectedJob.material_description}
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="document-tabs"
      >
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileText size={16} />
              All Documents
            </span>
          }
          key="all"
        >
          {documents.length === 0 ? (
            <Empty description="No documents found" />
          ) : (
            <List
              dataSource={documents}
              renderItem={(doc) => (
                <List.Item
                  actions={[
                    <Button
                      icon={<Download size={16} />}
                      onClick={() => handleDownload(doc.id)}
                      loading={downloading}
                      key="download"
                    >
                      Download
                    </Button>,
                    doc.latest_version && (
                      <Button
                        type="link"
                        icon={<Eye size={16} />}
                        onClick={() => handlePreview(doc.id)}
                        key="preview"
                      >
                        Preview
                      </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={getDocumentTypeIcon(doc)}
                    title={
                      <div className="flex items-center gap-2">
                        <span>{doc.name}</span>
                        <Tag color="blue">{getDocumentTypeName(doc)}</Tag>
                        {doc.latest_version?.file_size && (
                          <Tag color="green">
                            {Math.round(doc.latest_version.file_size / 1024)} KB
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <div>{doc.description}</div>
                        {doc.latest_version && (
                          <div className="text-xs text-gray-500 mt-1">
                            Version: {doc.latest_version.version_number}
                            {doc.latest_version.minio_path && (
                              <span className="ml-2">
                                Format: {getFileExtension(doc.latest_version.minio_path)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Database size={16} />
              MPP
            </span>
          }
          key="mpp"
        >
          {!jobDocuments.mpp_document ? (
            <Alert
              message="MPP Not Available"
              description="Manufacturing Process Plan is not available for this part"
              type="warning"
              showIcon
              icon={<AlertCircle />}
              action={
                <Button 
                  size="small" 
                  type="text"
                  onClick={() => handleDownload(null, 'MPP')}
                >
                  Try Direct Download
                </Button>
              }
            />
          ) : (
            <Card className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold mb-1">Manufacturing Process Plan</div>
                  <div className="text-sm text-gray-500 mb-2">{jobDocuments.mpp_document.name}</div>
                  <div className="text-sm">{jobDocuments.mpp_document.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    icon={<Download size={16} />}
                    onClick={() => handleDownload(jobDocuments.mpp_document.id)}
                    loading={downloading}
                  >
                    Download
                  </Button>
                  {jobDocuments.mpp_document.latest_version && (
                    <Button
                      icon={<Eye size={16} />}
                      onClick={() => handlePreview(jobDocuments.mpp_document.id)}
                    >
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileImage size={16} />
              Drawing
            </span>
          }
          key="drawing"
        >
          {!jobDocuments.engineering_drawing_document ? (
            <Alert
              message="Engineering Drawing Not Available"
              description="Engineering drawing is not available for this part"
              type="warning"
              showIcon
              icon={<AlertCircle />}
              action={
                <Button 
                  size="small" 
                  type="text"
                  onClick={() => handleDownload(null, 'ENGINEERING_DRAWING')}
                >
                  Try Direct Download
                </Button>
              }
            />
          ) : (
            <Card className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold mb-1">Engineering Drawing</div>
                  <div className="text-sm text-gray-500 mb-2">{jobDocuments.engineering_drawing_document.name}</div>
                  <div className="text-sm">{jobDocuments.engineering_drawing_document.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    icon={<Download size={16} />}
                    onClick={() => handleDownload(jobDocuments.engineering_drawing_document.id)}
                    loading={downloading}
                  >
                    Download
                  </Button>
                  {jobDocuments.engineering_drawing_document.latest_version && (
                    <Button
                      icon={<Eye size={16} />}
                      onClick={() => handlePreview(jobDocuments.engineering_drawing_document.id)}
                    >
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileArchive size={16} />
              CNC Programs
            </span>
          }
          key="cnc"
        >
          {!documents || documents.length === 0 ? (
            <Empty description="No CNC programs found" />
          ) : (
            <List
              dataSource={documents}
              renderItem={(doc) => (
                <List.Item
                  actions={[
                    <Button
                      icon={<Download size={16} />}
                      onClick={() => handleDownload(doc.id)}
                      loading={downloading}
                      key="download"
                    >
                      Download
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileArchive className="text-purple-500" />}
                    title={
                      <div className="flex items-center gap-2">
                        <span>{doc.name}</span>
                        {doc.latest_version?.metadata?.operation_number && (
                          <Tag color="blue">
                            OP{doc.latest_version.metadata.operation_number}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <div>{doc.description}</div>
                        {doc.latest_version && doc.latest_version.metadata && (
                          <div className="text-xs text-gray-500 mt-1">
                            Program Path: {doc.latest_version.metadata.program_path}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DocumentsCard; 