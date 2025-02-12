import React from 'react';
import { Card, List, Button, Tag, Space, Upload } from 'antd';
import { FileTextOutlined, UploadOutlined } from '@ant-design/icons';

const Documents = () => {
  const documents = [
    {
      title: 'CNC Machine Manual',
      type: 'Manual',
      uploadedBy: 'John Doe',
      uploadDate: '2024-02-15',
      size: '2.5 MB',
    },
    {
      title: 'Maintenance Procedures',
      type: 'Procedure',
      uploadedBy: 'Jane Smith',
      uploadDate: '2024-02-10',
      size: '1.8 MB',
    },
    // Add more documents
  ];

  return (
    <Card
      title="Maintenance Documents"
      extra={
        <Upload>
          <Button icon={<UploadOutlined />}>Upload Document</Button>
        </Upload>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={documents}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link">View</Button>,
              <Button type="link">Download</Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: 24 }} />}
              title={item.title}
              description={
                <Space>
                  <Tag color="blue">{item.type}</Tag>
                  <span>Uploaded by: {item.uploadedBy}</span>
                  <span>Date: {item.uploadDate}</span>
                  <span>Size: {item.size}</span>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default Documents; 