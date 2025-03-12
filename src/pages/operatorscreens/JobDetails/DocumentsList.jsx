import React from 'react';
import { Card, List, Button, Tooltip } from 'antd';
import { 
  FileText, 
  BookText,
  Settings2,
  Download, 
  Eye 
} from 'lucide-react';

const DocumentsList = ({ jobData }) => {
  const documents = [
    {
      type: 'MPP',
      title: 'Manufacturing Process Plan',
      icon: <FileText className="text-blue-500" size={20} />,
    //   docNumber: 'MPP-2024-001',
    //   lastUpdated: '2024-03-01'
    },
    {
      type: 'IPID',
      title: 'In-Process Inspection Document',
      icon: <Eye className="text-green-500" size={20} />,
    //   docNumber: 'IPID-2024-001',
    //   lastUpdated: '2024-03-01'
    },
    {
      type: 'Drawing',
      title: 'Engineering Drawing',
      icon: <Settings2 className="text-orange-500" size={20} />,
    //   docNumber: 'DWG-2024-001',
    //   lastUpdated: '2024-03-01'
    },
    {
      type: 'Manual',
      title: 'Machine Manual',
      icon: <BookText className="text-purple-500" size={20} />,
    //   docNumber: 'MAN-2024-001',
    //   lastUpdated: '2024-02-28'
    }
  ];

  const handleViewDocument = (docType) => {
    // Handle document viewing based on type
    console.log(`Viewing ${docType}`);
  };

  const handleDownload = (docType) => {
    // Handle document download
    console.log(`Downloading ${docType}`);
  };

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
        dataSource={documents}
        renderItem={(doc) => (
          <List.Item>
            <Card 
              className="shadow-sm hover:shadow-md transition-shadow"
              actions={[
                <Tooltip title="View Document" key="view">
                  <Button 
                    type="text" 
                    icon={<Eye size={16} />}
                    onClick={() => handleViewDocument(doc.type)}
                  >
                    View
                  </Button>
                </Tooltip>,
                <Tooltip title="Download" key="download">
                  <Button 
                    type="text" 
                    icon={<Download size={16} />}
                    onClick={() => handleDownload(doc.type)}
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
                  {/* <div className="text-xs text-gray-500 mt-1">
                    Doc No: {doc.docNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last Updated: {doc.lastUpdated}
                  </div> */}
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default DocumentsList; 