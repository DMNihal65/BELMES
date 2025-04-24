import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, InputNumber, DatePicker, Input, Alert, Space, Select, Typography } from 'antd';
import useInventoryStore from '../../store/inventory-store';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const { Option } = Select;
const { Title, Text } = Typography;

const RequestItemModal = ({ visible, onCancel, item }) => {
  const { 
    submitItemRequest, 
    loading, 
    fetchAllOrders, 
    fetchOperationsByPartNumber,
    allOrders = [],
    operations = []
  } = useInventoryStore();
  
  const [requestData, setRequestData] = useState({
    quantity: 0,
    operation_id: undefined,
    operation: undefined,
    purpose: '',
    expected_return_date: null,
    remarks: '',
    part_number: undefined,
    order_id: undefined,
    item_id: undefined
  });
  
  const [stockError, setStockError] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAllOrders().catch(error => {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
      });
    }
  }, [visible, fetchAllOrders]);

  const handleQuantityChange = (value) => {
    const isError = value > (item?.available_quantity || 0);
    setStockError(isError);
    setRequestData(prev => ({ ...prev, quantity: value }));
  };

  const handlePartNumberSelect = async (value, option) => {
    try {
      setRequestData(prev => ({
        ...prev,
        part_number: value,
        order_id: option.order_id,
        operation_id: undefined,
        operation: undefined
      }));
      
      await fetchOperationsByPartNumber(value);
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error('Failed to fetch operations');
    }
  };

  const handleOperationSelect = (value, option) => {
    setRequestData(prev => ({
      ...prev,
      operation: value,
      operation_id: option.operation_id
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!requestData.part_number || !requestData.operation) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!requestData.purpose.trim()) {
        toast.error('Please enter a purpose');
        return;
      }

      if (!requestData.expected_return_date) {
        toast.error('Please select an expected return date');
        return;
      }

      await submitItemRequest({
        ...requestData,
        item_id: item?.id,
      });

      toast.success('Item request submitted successfully');
      onCancel();
      setRequestData({
        quantity: 0,
        operation_id: undefined,
        operation: undefined,
        purpose: '',
        expected_return_date: null,
        remarks: '',
        part_number: undefined,
        order_id: undefined,
        item_id: undefined
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    }
  };

  return (
    <>
      <Modal
        title={
          <div className="border-b border-gray-200 pb-3">
            <Title level={4} className="m-0">Request Item</Title>
            <Text type="secondary">Fill in the details to request an item</Text>
          </div>
        }
        open={visible}
        onOk={handleSubmit}
        onCancel={onCancel}
        okText="Submit Request"
        okButtonProps={{ 
          disabled: stockError || 
                    requestData.quantity === 0 || 
                    !requestData.part_number || 
                    !requestData.operation ||
                    !requestData.purpose.trim() ||
                    !requestData.expected_return_date,
          className: 'bg-blue-500 hover:bg-blue-600',
          loading: loading
        }}
        width={600}
        className="request-modal"
      >
        <div className="py-6">
          <Space direction="vertical" className="w-full" size="large">
            <div>
              <Text strong className="block mb-2">Part Number <span className="text-red-500">*</span></Text>
              <Select
                showSearch
                placeholder="Select part number"
                value={requestData.part_number}
                onChange={handlePartNumberSelect}
                className="w-full"
                status={!requestData.part_number && 'error'}
                loading={loading}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {Array.isArray(allOrders) && allOrders.map(order => (
                  <Option 
                    key={order.id} 
                    value={order.part_number}
                    order_id={order.id}
                  >
                    {order.part_number}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <Text strong className="block mb-2">Operation Number <span className="text-red-500">*</span></Text>
              <Select
                placeholder="Select operation number"
                value={requestData.operation}
                onChange={handleOperationSelect}
                className="w-full"
                status={!requestData.operation && 'error'}
                disabled={!requestData.part_number}
                loading={loading}
              >
                {Array.isArray(operations) && operations.map(op => (
                  <Option 
                    key={op.id} 
                    value={op.operation_number}
                    operation_id={op.id}
                  >
                    Operation {op.operation_number} - {op.operation_description}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <Text strong className="block mb-2">Quantity <span className="text-red-500">*</span></Text>
              <InputNumber
                placeholder="Enter quantity"
                value={requestData.quantity}
                onChange={handleQuantityChange}
                className="w-full"
                min={1}
                max={item?.available_quantity}
                status={stockError ? 'error' : ''}
              />
              {stockError && (
                <Alert
                  message={`Maximum available quantity is ${item?.available_quantity}`}
                  type="error"
                  showIcon
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Text strong className="block mb-2">Purpose <span className="text-red-500">*</span></Text>
              <Input.TextArea
                placeholder="Enter the purpose of request"
                value={requestData.purpose}
                onChange={e => setRequestData(prev => ({ ...prev, purpose: e.target.value }))}
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <Text strong className="block mb-2">Expected Return Date <span className="text-red-500">*</span></Text>
              <DatePicker
                className="w-full"
                value={requestData.expected_return_date}
                onChange={date => setRequestData(prev => ({ ...prev, expected_return_date: date }))}
                disabledDate={current => current && current < dayjs().endOf('day')}
              />
            </div>

            <div>
              <Text strong className="block mb-2">Remarks</Text>
              <Input.TextArea
                placeholder="Add any additional notes or remarks"
                value={requestData.remarks}
                onChange={e => setRequestData(prev => ({ ...prev, remarks: e.target.value }))}
                rows={3}
                className="w-full"
              />
            </div>
          </Space>
        </div>
      </Modal>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default RequestItemModal; 