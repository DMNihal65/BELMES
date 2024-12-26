// File: ../operatorscreens/JobDetails/IPID.jsx
import React, { useState } from 'react';
import { Button, Modal, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const IPID = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleIPIDClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/open-exe', { method: 'POST' });

      if (response.ok) {
        console.log('QMS application opened successfully');
      } else {
        throw new Error('Failed to open QMS application');
      }
    } catch (error) {
      console.error(error);
      Modal.error({
        title: 'Error',
        content: 'Failed to open QMS application. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={handleIPIDClick}
        style={{ width: '200px', textAlign: 'center' }}
      >
        IPID
      </Button>

      {/* Loading Modal */}
      <Modal
        title="QMS Loading"
        open={isLoading}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
            size="large"
          />
          <p style={{ marginTop: '16px' }}>Loading QMS, please wait...</p>
        </div>
      </Modal>
    </div>
  );
};

export default IPID;
