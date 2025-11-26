import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Tooltip , InputNumber, Spin, Space, Input, Card, Tag, Row, Col, Descriptions } from 'antd';
import { ReloadOutlined, RollbackOutlined, SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import useTransactionHistoryStore from '../../../store/transaction-history-store';
import useAuthStore from '../../../store/auth-store';
import useInventoryStore from '../../../store/inventory-store';

const TransactionHistoryTable = () => {
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [isDynamicDataModalVisible, setIsDynamicDataModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedDynamicData, setSelectedDynamicData] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [returnForm] = Form.useForm();
  const { user } = useAuthStore();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    transactions,
    metadata,
    loading,
    fetchTransactionHistory,
    createReturnTransaction
  } = useTransactionHistoryStore();

  const { fetchTransactionHistoryEnhanced } = useInventoryStore();

  useEffect(() => {
    // Use enhanced transaction history from inventory store
    fetchTransactionHistoryEnhanced(100, 0);
    // Fallback to original if enhanced fails
    fetchTransactionHistory().catch(() => {
      console.log('Using fallback transaction history');
    });
  }, [fetchTransactionHistory, fetchTransactionHistoryEnhanced]);

  const { fetchCategories, fetchItems, fetchAllSubcategories } = useInventoryStore();

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, itemsData, subcatsData] = await Promise.all([
          fetchCategories(),
          loadInventoryItems(),
          loadSubcategories(),
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load some data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchCategories]);

  const loadSubcategories = async () => {
    try {
      const subCats = await fetchAllSubcategories();
      setSubcategories(subCats || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      toast.error('Failed to load subcategories');
      setSubcategories([]);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const items = await fetchItems();
      setInventoryItems(items || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast.error('Failed to load inventory items');
      setInventoryItems([]);
    }
  };

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
      toast.error('Return quantity cannot be greater than issued quantity');
      return;
    }

    if (quantity <= 0) {
      toast.error('Return quantity must be greater than 0');
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

      // Success toast message
      toast.success('Return transaction created successfully!');

      setIsReturnModalVisible(false);
      returnForm.resetFields();
    } catch (error) {
      console.error('Error creating return transaction:', error);
      // Error toast message
      toast.error('Error creating return transaction. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const handleReset = () => {
    setSearchText('');
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

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleItemCodeClick = (record) => {
    setSelectedDynamicData(record.dynamic_data);
    setIsDynamicDataModalVisible(true);
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 120,
      align: 'center',
    },
    {
      title: 'Subcategory',
      dataIndex: 'subcategory_name',
      key: 'subcategory_name',
      width: 150,
      align: 'center',
    },
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 150,
      align: 'center',
      render: (itemCode, record) => (
        <Button 
          type="link" 
          onClick={() => handleItemCodeClick(record)}
          icon={<InfoCircleOutlined />}
        >
          {itemCode}
        </Button>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      align: 'center',
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
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
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
          align: 'center',
          render: (value) => (
            <span className="font-semibold text-blue-600">{value}</span>
          ),
        },
        {
          title: 'Available',
          dataIndex: 'available_quantity',
          key: 'available_quantity',
          width: 100,
          align: 'center',
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
      align: 'center',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      align: 'center',
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      align: 'center',
      render: formatDate,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      align: 'center',
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
      <ToastContainer position="top-right" autoClose={5000} />
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
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
              className="mr-2"
            />
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={() => {
                handleReset();
                fetchTransactionHistoryEnhanced(100, 0);
                fetchTransactionHistory();
              }}
              className="mr-2"
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
              current: currentPage,
              pageSize: pageSize,
              total: filteredData.length,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} transactions`,
              onChange: handleTableChange,
            }}
            className="shadow-sm"
            rowClassName={(record) => 
              record.type === 'Issue' ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'
            }
          />
        </Spin>
      </Card>

      {/* Dynamic Data Modal */}
      <Modal
        title="Item Details"
        open={isDynamicDataModalVisible}
        onCancel={() => setIsDynamicDataModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        {selectedDynamicData && (
          <Descriptions
            bordered
            column={2}
            size="small"
            className="mb-4"
          >
            {Object.entries(selectedDynamicData).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {value}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Modal>

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