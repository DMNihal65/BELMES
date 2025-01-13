import React from 'react';
import { Modal, Descriptions, Badge, Tag } from 'antd';

const OrderDetailsModal = ({ visible, order, onClose }) => {
  if (!order) return null;

  const formatDate = (epochDate) => {
    if (!epochDate) return '-';
    return new Date(epochDate * 1000).toLocaleDateString();
  };

  return (
    <Modal
      title="Order Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Production Order">
          {order.production_order}
        </Descriptions.Item>
        <Descriptions.Item label="Sales Order">
          {order.sale_order}
        </Descriptions.Item>
        <Descriptions.Item label="Part Number">
          {order.part_number}
        </Descriptions.Item>
        <Descriptions.Item label="WBS Element">
          {order.wbs_element}
        </Descriptions.Item>
        <Descriptions.Item label="Material Description" span={2}>
          {order.part_description}
        </Descriptions.Item>
        <Descriptions.Item label="Required Quantity">
          {order.required_quantity}
        </Descriptions.Item>
        <Descriptions.Item label="Launched Quantity">
          {order.launched_quantity || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Project">
          {order.project?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Priority">
          <Tag color={order.project?.priority === 1 ? 'red' : 'blue'}>
            Priority {order.project?.priority}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Delivery Date">
          {formatDate(order.delivery_date)}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Badge 
            status={
              order.status?.toLowerCase() === 'completed' ? 'success' :
              order.status?.toLowerCase() === 'in_progress' ? 'processing' :
              order.status?.toLowerCase() === 'delayed' ? 'error' :
              'default'
            } 
            text={order.status?.toUpperCase() || 'PENDING'} 
          />
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default OrderDetailsModal; 