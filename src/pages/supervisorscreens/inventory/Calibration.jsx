import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Typography,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  message,
  Spin,
  InputNumber,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  ToolOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

function Calibration() {
  const [form] = Form.useForm();
  const [historyForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [editingCalibration, setEditingCalibration] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('current');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    calibrations,
    calibrationHistory,
    categories,
    loading,
    fetchCalibrations,
    fetchCalibrationHistory,
    fetchCategories,
    addCalibration,
    updateCalibration,
    deleteCalibration,
    addCalibrationHistory,
    fetchItems,
    fetchAllSubcategories
  } = useInventoryStore();

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchCalibrations(),
          fetchCalibrationHistory(),
          fetchCategories(),
          loadInventoryItems(),
          loadSubcategories()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        message.error('Failed to load some data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchCalibrations, fetchCalibrationHistory, fetchCategories]);

  const loadInventoryItems = async () => {
    try {
      const items = await fetchItems();
      console.log('Loaded items:', items); // Debug log
      setInventoryItems(items || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      message.error('Failed to load inventory items');
      setInventoryItems([]);
    }
  };

  const loadSubcategories = async () => {
    try {
      const subCats = await fetchAllSubcategories();
      console.log('Loaded subcategories:', subCats); // Debug log
      setSubcategories(subCats || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      message.error('Failed to load subcategories');
      setSubcategories([]);
    }
  };

  const showModal = (record = null) => {
    setEditingCalibration(record);
    if (record) {
      form.setFieldsValue({
        calibration_type: record.calibration_type,
        frequency_days: record.frequency_days,
        last_calibration: moment(record.last_calibration),
        next_calibration: moment(record.next_calibration),
        remarks: record.remarks,
        inventory_item_id: record.inventory_item_id
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Calibration Record',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this calibration record?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteCalibration(id);
          message.success('Calibration record deleted successfully');
        } catch (error) {
          message.error('Failed to delete calibration record');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        calibration_type: values.calibration_type,
        frequency_days: values.frequency_days,
        last_calibration: values.last_calibration.toISOString(),
        next_calibration: values.next_calibration.toISOString(),
        remarks: values.remarks || '',
        inventory_item_id: values.inventory_item_id
      };

      if (editingCalibration) {
        await updateCalibration(editingCalibration.id, formattedValues);
        message.success('Calibration record updated successfully');
      } else {
        await addCalibration(formattedValues);
        message.success('Calibration record added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingCalibration(null);
      // Refresh the calibrations list
      fetchCalibrations();
    } catch (error) {
      console.error('Error saving calibration:', error);
      message.error(error.response?.data?.message || 'Failed to save calibration record');
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const colors = {
      'up_to_date': 'success',
      'due_soon': 'warning',
      'overdue': 'error',
      'in_progress': 'processing'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    const icons = {
      'up_to_date': <CheckCircleOutlined />,
      'due_soon': <WarningOutlined />,
      'overdue': <ExclamationCircleOutlined />,
      'in_progress': <SyncOutlined spin />
    };
    return icons[status] || null;
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'inventory_item_id',
      key: 'category',
      render: (itemId) => {
        const category = categories.find(cat => 
          cat.items?.some(item => item.id === itemId)
        );
        return <Tag color="blue">{category?.name || 'N/A'}</Tag>;
      }
    },
    {
      title: 'Calibration Type',
      dataIndex: 'calibration_type',
      key: 'calibration_type',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Frequency (Days)',
      dataIndex: 'frequency_days',
      key: 'frequency_days',
      render: (days) => <Tag>{days} days</Tag>
    },
    {
      title: 'Last Calibration',
      dataIndex: 'last_calibration',
      key: 'last_calibration',
      render: (date) => moment(date).format('DD MMM YYYY')
    },
    {
      title: 'Next Calibration',
      dataIndex: 'next_calibration',
      key: 'next_calibration',
      render: (date) => (
        <Tag icon={<CalendarOutlined />} color={moment(date).isBefore(moment()) ? 'error' : 'default'}>
          {moment(date).format('DD MMM YYYY')}
        </Tag>
      )
    },
    {
      title: 'Inventory Item',
      dataIndex: 'inventory_item_id',
      key: 'inventory_item_id',
      render: (itemId) => {
        const item = inventoryItems.find(item => item.id === itemId);
        const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
        return (
          <Tooltip title={`ID: ${itemId}`}>
            <Tag icon={<ToolOutlined />}>
              {item ? `${subcategory?.name || 'N/A'} - ${item.item_code}` : itemId}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const historyColumns = [
    {
      title: 'Calibration Schedule ID',
      dataIndex: 'calibration_schedule_id',
      key: 'calibration_schedule_id',
      render: (scheduleId) => {
        const calibration = calibrations.find(cal => cal.id === scheduleId);
        return (
          <Tooltip title={`Schedule ID: ${scheduleId}`}>
            <Tag icon={<ToolOutlined />}>
              {calibration ? `${calibration.calibration_type}` : scheduleId}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Certificate Number',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Calibration Date',
      dataIndex: 'calibration_date',
      key: 'calibration_date',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Next Due Date',
      dataIndex: 'next_due_date',
      key: 'next_due_date',
      render: (date) => (
        <Tag icon={<CalendarOutlined />} color={moment(date).isBefore(moment()) ? 'error' : 'default'}>
          {moment(date).format('DD MMM YYYY HH:mm')}
        </Tag>
      )
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result) => (
        <Tag color={result.toLowerCase() === 'pass' ? 'success' : 'error'}>
          {result.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm')
    }
  ];

  const filterCalibrations = (status) => {
    setSelectedStatus(status);
  };

  const getFilteredCalibrations = () => {
    if (!calibrations) return [];
    let filtered = calibrations;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cal => cal.status === selectedStatus);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cal => {
        const category = categories.find(cat => 
          cat.items?.some(item => item.id === cal.inventory_item_id)
        );
        return category?.id === selectedCategory;
      });
    }
    
    return filtered;
  };

  const getStatistics = () => {
    if (!calibrations) return { total: 0, upToDate: 0, dueSoon: 0, overdue: 0 };
    
    const total = calibrations.length;
    const upToDate = calibrations.filter(cal => cal.status === 'up_to_date').length;
    const dueSoon = calibrations.filter(cal => cal.status === 'due_soon').length;
    const overdue = calibrations.filter(cal => cal.status === 'overdue').length;

    return { total, upToDate, dueSoon, overdue };
  };

  const stats = getStatistics();

  const handleHistorySubmit = async (values) => {
    try {
      const formattedValues = {
        calibration_date: values.calibration_date.toISOString(),
        result: values.result,
        certificate_number: values.certificate_number,
        remarks: values.remarks || '',
        next_due_date: values.next_due_date.toISOString(),
        calibration_schedule_id: values.calibration_schedule_id,
        performed_by: 1 // You might want to get this from user context
      };

      await addCalibrationHistory(formattedValues);
      message.success('Calibration history record added successfully');
      setIsHistoryModalVisible(false);
      historyForm.resetFields();
      fetchCalibrationHistory();
    } catch (error) {
      console.error('Error saving calibration history:', error);
      message.error(error.response?.data?.message || 'Failed to save calibration history');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="loading-container">
          <Spin size="large" />
          <Text>Loading calibration data...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="calibration-container">
      {/* Header Card */}
      <Card className="header-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24}>
            <div className="header-content">
              <div className="header-title">
                <Title level={3} className="title">
                  <ToolOutlined /> Calibration Management
                </Title>
                <Text type="secondary" className="subtitle">
                  Track and manage calibration schedules for all equipment
                </Text>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                className="add-button"
              >
                <span className="button-text">Add New Calibration</span>
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      {activeTab === 'current' && (
        <div className="stats-container">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Total Equipment"
                  value={stats.total}
                  prefix={<ToolOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Up to Date"
                  value={stats.upToDate}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Due Soon"
                  value={stats.dueSoon}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Overdue"
                  value={stats.overdue}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      

      {/* Main Content */}
      <Card className="main-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-tabs"
        >
          <Tabs.TabPane tab="Current Calibrations" key="current">
            <div className="filter-buttons">
              <Space wrap>
                <Button
                  type={selectedStatus === 'all' ? 'primary' : 'default'}
                  onClick={() => filterCalibrations('all')}
                >
                  All
                </Button>
                <Button
                  type={selectedStatus === 'up_to_date' ? 'primary' : 'default'}
                  icon={<CheckCircleOutlined />}
                  onClick={() => filterCalibrations('up_to_date')}
                >
                  Up to Date
                </Button>
                <Button
                  type={selectedStatus === 'due_soon' ? 'primary' : 'default'}
                  icon={<WarningOutlined />}
                  onClick={() => filterCalibrations('due_soon')}
                >
                  Due Soon
                </Button>
                <Button
                  type={selectedStatus === 'overdue' ? 'primary' : 'default'}
                  danger={selectedStatus === 'overdue'}
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => filterCalibrations('overdue')}
                >
                  Overdue
                </Button>
              </Space>
            </div>

            <div className="table-container">
              <Table
                columns={columns}
                dataSource={getFilteredCalibrations()}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  responsive: true
                }}
                scroll={{ x: 'max-content' }}
                className="responsive-table"
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Calibration History" key="history">
            <div className="history-header">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsHistoryModalVisible(true)}
                className="add-button"
              >
                Add Calibration History
              </Button>
            </div>
            <div className="table-container">
              <Table
                columns={historyColumns}
                dataSource={calibrationHistory}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  responsive: true
                }}
                scroll={{ x: 'max-content' }}
                className="responsive-table"
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingCalibration ? "Edit Calibration Record" : "Add New Calibration Record"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingCalibration(null);
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="calibration_type"
            label="Calibration Type"
            rules={[{ required: true, message: 'Please enter calibration type' }]}
          >
            <Input 
              placeholder="Enter calibration type"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="frequency_days"
            label="Frequency (Days)"
            rules={[{ required: true, message: 'Please enter frequency in days' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="inventory_item_id"
            label="Inventory Item"
            rules={[{ required: true, message: 'Please select an inventory item' }]}
          >
            <Select
              showSearch
              placeholder="Select an inventory item"
              optionFilterProp="children"
              loading={isLoading}
              style={{ width: '100%' }}
              filterOption={(input, option) => {
                if (!option?.children) return false;
                return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
              }}
            >
              {subcategories.map(subcategory => {
                const subcategoryItems = inventoryItems.filter(
                  item => item.subcategory_id === subcategory.id
                );

                if (subcategoryItems.length === 0) return null;

                return (
                  <Select.OptGroup key={subcategory.id} label={subcategory.name}>
                    {subcategoryItems.map(item => {
                      const dynamicDataString = item.dynamic_data
                        ? Object.entries(item.dynamic_data)
                            .filter(([key, value]) => value !== undefined && value !== null)
                            .map(([key, value]) => {
                              const fieldConfig = subcategory.dynamic_fields?.[key];
                              const unit = fieldConfig?.unit ? ` ${fieldConfig.unit}` : '';
                              return `${key}: ${value}${unit}`;
                            })
                            .join(', ')
                        : '';

                      const label = `${item.item_code}${dynamicDataString ? ` (${dynamicDataString})` : ''}`;

                      return (
                        <Select.Option 
                          key={item.id} 
                          value={item.id}
                        >
                          {label}
                        </Select.Option>
                      );
                    })}
                  </Select.OptGroup>
                );
              }).filter(Boolean)}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="last_calibration"
                label="Last Calibration Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="next_calibration"
                label="Next Calibration Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add History Modal */}
      <Modal
        title="Add Calibration History Record"
        open={isHistoryModalVisible}
        onOk={() => historyForm.submit()}
        onCancel={() => {
          setIsHistoryModalVisible(false);
          historyForm.resetFields();
        }}
        width={600}
      >
        <Form
          form={historyForm}
          layout="vertical"
          onFinish={handleHistorySubmit}
        >
          <Form.Item
            name="calibration_schedule_id"
            label="Calibration Schedule"
            rules={[{ required: true, message: 'Please select calibration schedule' }]}
          >
            <Select
              showSearch
              placeholder="Select calibration schedule"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {calibrations.map(cal => {
                const item = inventoryItems.find(item => item.id === cal.inventory_item_id);
                const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
                return (
                  <Option key={cal.id} value={cal.id}>
                    {`${cal.calibration_type} - ${subcategory?.name || 'N/A'} (${item?.item_code || cal.inventory_item_id})`}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            name="certificate_number"
            label="Certificate Number"
            rules={[{ required: true, message: 'Please enter certificate number' }]}
          >
            <Input placeholder="Enter certificate number" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="calibration_date"
                label="Calibration Date"
                rules={[{ required: true, message: 'Please select calibration date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="next_due_date"
                label="Next Due Date"
                rules={[{ required: true, message: 'Please select next due date' }]}
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="result"
            label="Result"
            rules={[{ required: true, message: 'Please select result' }]}
          >
            <Select>
              <Option value="Pass">Pass</Option>
              <Option value="Fail">Fail</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={4} placeholder="Enter remarks" />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .calibration-container {
          padding: 16px;
          max-width: 100%;
          overflow-x: hidden;
        }

        .header-card {
          background: linear-gradient(to right, #ffffff, #f0f7ff);
          border: none;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-title {
          flex: 1;
          min-width: 200px;
        }

        .title {
          margin: 0 !important;
          color: #1890ff;
          font-size: 24px;
        }

        @media (max-width: 576px) {
          .title {
            font-size: 20px;
          }
          
          .button-text {
            display: none;
          }
        }

        .subtitle {
          display: block;
          margin-top: 4px;
        }

        .stats-container {
          margin-bottom: 24px;
        }

        .stat-card {
          height: 100%;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .filter-container {
          margin-bottom: 24px;
        }

        .filter-space {
          width: 100%;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }

        .category-select {
          max-width: 100%;
        }

        .main-content {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .custom-tabs {
          margin-top: -16px;
        }

        .filter-buttons {
          margin-bottom: 16px;
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 8px;
        }

        .table-container {
          overflow-x: auto;
          margin: 0 -16px;
          padding: 0 16px;
        }

        .responsive-table {
          min-width: 600px;
        }

        .history-header {
          margin-bottom: 16px;
        }

        .add-button {
          background: #52c41a;
          border-color: #52c41a;
          box-shadow: 0 2px 0 rgba(82, 196, 26, 0.1);
        }

        .add-button:hover {
          background: #73d13d;
          border-color: #73d13d;
        }

        .ant-table-wrapper {
          overflow-x: auto;
        }

        .ant-table {
          background: #ffffff;
          border-radius: 8px;
        }

        .ant-table-thead > tr > th {
          background: #fafafa;
          color: #262626;
          font-weight: 600;
          white-space: nowrap;
        }

        .ant-table-tbody > tr > td {
          white-space: normal;
          word-break: break-word;
        }

        .ant-btn {
          border-radius: 6px;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
        }

        .ant-tag {
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 13px;
          white-space: nowrap;
        }

        .ant-modal {
          max-width: 95%;
        }

        .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }

        .ant-modal-header {
          background: #fafafa;
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .ant-form-item-label > label {
          font-weight: 500;
          color: #262626;
        }

        .ant-input, .ant-select-selector, .ant-picker {
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .calibration-container {
            padding: 12px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .add-button {
            width: 100%;
          }

          .filter-space {
            flex-direction: column;
            align-items: flex-start;
          }

          .category-select {
            width: 100% !important;
          }

          .ant-table {
            font-size: 14px;
          }

          .ant-statistic-title {
            font-size: 14px;
          }

          .ant-statistic-content {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .calibration-container {
            padding: 8px;
          }

          .header-card {
            margin-bottom: 16px;
          }

          .ant-table {
            font-size: 12px;
          }

          .ant-btn {
            padding: 4px 8px;
            font-size: 12px;
          }

          .ant-tag {
            padding: 2px 6px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Calibration;