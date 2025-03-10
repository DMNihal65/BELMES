import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import CreateOrderModal from './CreateOrderModal';
import ManualCreateOrderModal from './ManualCreateOrderModal';

const OrderModals = () => {
  const [showOarcModal, setShowOarcModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const handleOarcModalCancel = () => {
    setShowOarcModal(false);
  };

  const handleManualModalCancel = () => {
    setShowManualModal(false);
  };

  const handleOarcCreate = (result) => {
    console.log('OARC Order created:', result);
    setShowOarcModal(false);
  };

  return (
    <>
      <Space>
        <Button 
          type="primary" 
          icon={<UploadOutlined />}
          onClick={() => setShowOarcModal(true)}
        >
          Upload OARC
        </Button>
        <Button 
          type="default"
          icon={<PlusOutlined />}
          onClick={() => setShowManualModal(true)}
        >
          Create Order
        </Button>
      </Space>

      <CreateOrderModal
        visible={showOarcModal}
        onCancel={handleOarcModalCancel}
        onCreate={handleOarcCreate}
      />

      <ManualCreateOrderModal
        visible={showManualModal}
        onCancel={handleManualModalCancel}
      />
    </>
  );
};

export default OrderModals; 