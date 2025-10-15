import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Input, Space, Card, Row, Col, Tag, Select, DatePicker } from 'antd';
import { PlusOutlined, InboxOutlined, WarningOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const BASE_URL = 'http://172.19.224.1:8002/api/v1/maintainance';

export default function RawMaterialsMaintenance() {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [units, setUnits] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const { Search } = Input;

  useEffect(() => {
    fetchRawMaterials();
    fetchUnitsAndStatuses();
  }, []);

  useEffect(() => {
    handleSearch(searchText);
  }, [materials, searchText]);

  const fetchUnitsAndStatuses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/status-unit-rmdata/`);
      setUnits(response.data.units || []);
      setStatuses(response.data.statuses || []);
    } catch (error) {
      console.error('Error fetching units and statuses:', error);
    }
  };

  const fetchRawMaterials = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/raw-materials/`);
      setMaterials(response.data.raw_materials);
      setFilteredMaterials(response.data.raw_materials);
      setTotalItems(response.data.total_items);
    } catch (error) {
      console.error('Error fetching raw materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const searchVal = value.toLowerCase();
    const filtered = materials.filter(item => {
      return (
        (item.id?.toString().includes(searchVal)) ||
        (item.child_part_number?.toLowerCase().includes(searchVal)) ||
        (item.description?.toLowerCase().includes(searchVal)) ||
        (item.quantity?.toString().includes(searchVal)) ||
        (item.unit_name?.toLowerCase().includes(searchVal)) ||
        (item.availability_status?.toLowerCase().includes(searchVal)) ||
        (item.available_from?.toLowerCase().includes(searchVal)) ||
        (item.orders?.some(order => 
          order.production_order?.toLowerCase().includes(searchVal) ||
          order.part_number?.toLowerCase().includes(searchVal)
        ))
      );
    });
    setFilteredMaterials(filtered);
  };

  const isEditing = (record) => record.child_part_number === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      description: record.description,
      quantity: record.quantity,
      unit_id: record.unit_id,
      status_id: record.status_id,
      available_from: record.available_from ? moment(record.available_from) : null,
    });
    setEditingKey(record.child_part_number);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (record) => {
    try {
      const values = await form.validateFields();
      const updatedData = {
        description: values.description,
        quantity: values.quantity,
        unit_id: values.unit_id,
        status_id: values.status_id,
        available_from: values.available_from.toISOString(),
      };

      setLoading(true);
      await axios.put(`${BASE_URL}/raw-materials/${record.child_part_number}`, updatedData);
      
      // Refresh the data
      await fetchRawMaterials();
      setEditingKey('');
    } catch (error) {
      console.error('Error updating raw material:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'S.No',
      key: 'index',
      width: '6%',
      render: (_, record, index) => index + 1,
    },
    {
      title: 'Part Number',
      dataIndex: 'orders',
      key: 'part_number',
      width: '12%',
      render: (orders) => (
        <div>
          {orders && orders.map((order, index) => (
            <Tag color="cyan" key={index} style={{ marginBottom: '4px' }}>
              {order.part_number}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Production Order',
      dataIndex: 'orders',
      key: 'production_order',
      width: '12%',
      render: (orders) => (
        <div>
          {orders && orders.map((order, index) => (
            <Tag color="blue" key={index} style={{ marginBottom: '4px' }}>
              {order.production_order}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Child Part Number',
      dataIndex: 'child_part_number',
      key: 'child_part_number',
      width: '12%',
      sorter: (a, b) => a.child_part_number.localeCompare(b.child_part_number),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '18%',
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="description"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input />
          </Form.Item>
        ) : (
          text
        );
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '10%',
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item
              name="quantity"
              style={{ margin: 0 }}
              rules={[{ required: true, message: 'Quantity is required' }]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              name="unit_id"
              style={{ margin: 0 }}
              rules={[{ required: true, message: 'Unit is required' }]}
            >
              <Select>
                {units.map(unit => (
                  <Select.Option key={unit.id} value={unit.id}>
                    {unit.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
        ) : (
          <span>{record.quantity} {record.unit_name}</span>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      key: 'status_name',
      width: '10%',
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="status_id"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Status is required' }]}
          >
            <Select>
              {statuses.map(status => (
                <Select.Option key={status.id} value={status.id}>
                  {status.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <Tag color={record.status_name === 'Available' ? 'success' : 
                     record.status_name === 'Low Stock' ? 'warning' : 'error'}>
            {record.status_name}
          </Tag>
        );
      }
    },
    {
      title: 'Available From',
      dataIndex: 'available_from',
      key: 'available_from',
      width: '12%',
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="available_from"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Date is required' }]}
          >
            <DatePicker 
              showTime 
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              allowClear={true}
            />
          </Form.Item>
        ) : (
          text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-'
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '8%',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button 
              type="primary" 
              onClick={() => save(record)}
              loading={loading}
              size="small"
            >
              Save
            </Button>
            <Button onClick={cancel} size="small">
              Cancel
            </Button>
          </Space>
        ) : (
          <Button
            type="primary"
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            size="small"
          >
            Edit
          </Button>
        );
      },
    },
  ];

  const availableMaterials = materials.filter(m => m.availability_status === 'Available').length;
  const lowStockMaterials = materials.filter(m => m.availability_status === 'Low Stock').length;

  return (
    <div className="p-6">
      <div className="mb-4">
        <Search
          placeholder="Search in all columns..."
          allowClear
          enterButton
          size="large"
          onSearch={handleSearch}
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          style={{ maxWidth: 500 }}
        />
      </div>

      <Form form={form} component={false}>
        <Table
          columns={columns}
          dataSource={filteredMaterials}
          rowKey="id"
          loading={loading}
          size="middle"
          bordered
          scroll={{ x: 800 }}
        />
      </Form>
    </div>
  );
} 