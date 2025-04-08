import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, Spin, message, Space, Input, Card, Tag, Row, Col, Descriptions } from 'antd';
import { ReloadOutlined, RollbackOutlined, SearchOutlined } from '@ant-design/icons';
import useTransactionHistoryStore from '../../../store/transaction-history-store';
import useAuthStore from '../../../store/auth-store';

const TransactionHistoryTable = () => {
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [returnForm] = Form.useForm();
  const { user } = useAuthStore();

  const {
    transactions,
    metadata,
    loading,
    fetchTransactionHistory,
    createReturnTransaction
  } = useTransactionHistoryStore();

  useEffect(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  const handleReturn = (record) => {
    setSelectedTransaction(record);
    setIsReturnModalVisible(true);
    returnForm.resetFields();
  };

  const handleReturnSubmit = async (values) => {
    if (!selectedTransaction) return;

    const quantity = parseFloat(values.quantity);

    // Validate return quantity
    if (quantity > selectedTransaction.quantity) {
      message.error('Return quantity cannot be greater than issued quantity');
      return;
    }

    if (quantity <= 0) {
      message.error('Return quantity must be greater than 0');
      return;
    }

    try {
      await createReturnTransaction({
        transaction_type: "Return",
        quantity: quantity,
        remarks: values.remarks,
        inventory_item_id: selectedTransaction.item_id,
        performed_by: user?.id || 1,
        reference_request_id: selectedTransaction.request_id || null
      });

      setIsReturnModalVisible(false);
      returnForm.resetFields();
    } catch (error) {
      console.error('Error creating return transaction:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const filteredData = transactions.filter(record => {
    if (!searchText) return true;
    return (
      record.id?.toString().toLowerCase().includes(searchText) ||
      record.type?.toLowerCase().includes(searchText) ||
      record.item_code?.toLowerCase().includes(searchText) ||
      record.performed_by_username?.toLowerCase().includes(searchText) ||
      record.remarks?.toLowerCase().includes(searchText) ||
      record.quantity?.toString().toLowerCase().includes(searchText) ||
      record.current_quantity?.toString().toLowerCase().includes(searchText) ||
      record.available_quantity?.toString().toLowerCase().includes(searchText) ||
      formatDate(record.created_at)?.toLowerCase().includes(searchText)
    );
  });

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'Issue' ? 'red' : 'green'} className="text-base px-3 py-1">
          {type}
        </Tag>
      ),
      filters: [
        { text: 'Issue', value: 'Issue' },
        { text: 'Return', value: 'Return' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 150,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity) => (
        <span className="font-semibold">{quantity}</span>
      ),
    },
    {
      title: 'Stock Status',
      children: [
        {
          title: 'Current',
          dataIndex: 'current_quantity',
          key: 'current_quantity',
          width: 100,
          render: (value) => (
            <span className="font-semibold text-blue-600">{value}</span>
          ),
        },
        {
          title: 'Available',
          dataIndex: 'available_quantity',
          key: 'available_quantity',
          width: 100,
          render: (value) => (
            <span className="font-semibold text-green-600">{value}</span>
          ),
        },
      ],
    },
    {
      title: 'Performed By',
      dataIndex: 'performed_by_username',
      key: 'performed_by_username',
      width: 150,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: formatDate,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        record.type === 'Issue' && (
          <Button
            type="primary"
            icon={<RollbackOutlined />}
            onClick={() => handleReturn(record)}
            className="hover:scale-105 transition-transform"
          >
            Return
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Transaction History</h2>
            <p className="text-gray-600">
              Total Transactions: {metadata.total_count}
            </p>
          </div>
          <Space size="middle">
            <Input.Search
              placeholder="Search transactions..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              className="mr-2"
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => fetchTransactionHistory()}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            scroll={{ x: 1500 }}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} transactions`,
            }}
            className="shadow-sm"
            rowClassName={(record) => 
              record.type === 'Issue' ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'
            }
          />
        </Spin>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <RollbackOutlined className="text-xl" />
            <span>Return Item</span>
          </div>
        }
        open={isReturnModalVisible}
        onCancel={() => setIsReturnModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedTransaction && (
          <div className="mb-4">
            <Descriptions
              title="Transaction Details"
              bordered
              column={2}
              size="small"
              className="mb-4"
            >
              <Descriptions.Item label="Transaction ID">
                {selectedTransaction.id}
              </Descriptions.Item>
              <Descriptions.Item label="Item Code">
                {selectedTransaction.item_code}
              </Descriptions.Item>
              <Descriptions.Item label="Issued Quantity">
                {selectedTransaction.quantity}
              </Descriptions.Item>
              <Descriptions.Item label="Current Stock">
                {selectedTransaction.current_quantity}
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={returnForm}
              onFinish={handleReturnSubmit}
              layout="vertical"
              className="mt-4"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="quantity"
                    label="Return Quantity"
                    rules={[
                      { required: true, message: 'Please enter return quantity' },
                      {
                        validator: (_, value) => {
                          const numValue = parseFloat(value);
                          if (numValue <= 0) {
                            return Promise.reject('Quantity must be greater than 0');
                          }
                          if (numValue > selectedTransaction.quantity) {
                            return Promise.reject(`Cannot return more than ${selectedTransaction.quantity} units`);
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={selectedTransaction.quantity}
                      style={{ width: '100%' }}
                      placeholder={`Max: ${selectedTransaction.quantity}`}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="remarks"
                    label="Remarks"
                    rules={[{ required: true, message: 'Please enter remarks' }]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Enter return remarks..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item className="mb-0">
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setIsReturnModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<RollbackOutlined />}>
                    Submit Return
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionHistoryTable; 