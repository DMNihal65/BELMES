import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col,  Input as AntInput,  Drawer, Checkbox, Slider,  Select, DatePicker   } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FilterOutlined  } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const Consumables = ({filters }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({}); 
  const [selectedUnitID, setSelectedUnitID] = useState([]);
  const [selectedStock, setSelectedStock] = useState([0, 100]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedAvailableFrom, setSelectedAvailableFrom] = useState([]);
  const [ConsumablesData, setConsumablesData] = useState([
    {
      key: '1',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'High precision end mill',
      unit_id: 'UNIT001', // Added unit_id
      available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), 
      stock: 10,
      status: 'Available',
    },
    {
      key: '2',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'Low precision end mill',
      unit_id: 'UNIT001', // Added unit_id
      available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), // Added available_from
      stock: 10,
      status: 'In Use',
    },
    // ... other existing data ...
  ]);

  const showDrawer = () => {
    setSelectedFilters({}); // Reset selected filters when opening the drawer
     form.resetFields();
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    if (!Object.keys(selectedFilters).length) {
      // If no filters are applied, reset the data to original state
      setFilteredData(GaugesAndInstrumentsData);
    }
    setIsDrawerVisible(false);
  };

  const handleCheckboxChange = (column, values) => {
    setSelectedFilters(prev => ({ ...prev, [column]: values })); // Update selected filters
  };

  const handleSliderChange = (column, values) => {
    setSelectedFilters(prev => ({ ...prev, [column]: values })); // Update selected filters
  };

  const applyFilters = () => {
    try {
        const filtered = ConsumablesData.filter(item => {
            return Object.keys(selectedFilters).every(column => {
                const filterValue = selectedFilters[column];
                if (!filterValue) return true;
                if (Array.isArray(filterValue)) {
                    // For checkboxes
                    return filterValue.includes(item[column]);
                } else if (typeof filterValue === 'object') {
                    // For sliders
                    // Ensure that the comparison handles decimal values correctly
                    const itemValue = parseFloat(item[column]);
                    return itemValue >= filterValue[0] && itemValue <= filterValue[1];
                }
                return true;
            });
        });
        setFilteredData(filtered);
        closeDrawer();
    } catch (error) {
        message.error(`Error applying filters: ${error.message}. Selected filters: ${JSON.stringify(selectedFilters)}`);
        console.error(error);
    }
};

  const resetFilters = () => {
    setSelectedFilters({}); // Reset selected filters
    setFilteredData(ConsumablesData); // Reset table data
    setSelectedUnitID([]);
    setSelectedStock([0, 100]);
    setSelectedStatus([]);
    setSelectedAvailableFrom([]);
    form.resetFields(); // Reset form fields in the drawer
     setIsDrawerVisible(false);
    message.success('Filters have been reset');
  };

  useEffect(() => {
    if (!isDrawerVisible) {
      // Reset form and selected filters when drawer closes
      form.resetFields();
      setSelectedFilters({});
    }
  }, [isDrawerVisible, form]);

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  // Modify the columns array to work with global search
  const getFilteredData = () => {
    if (!searchText) return filteredData;

    return filteredData.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key]?.toString().toLowerCase();
        return value?.includes(searchText.toLowerCase());
      });
    });
  };

  const showModal = () => {
    form.resetFields(); // Reset form fields when opening the modal
    setIsModalVisible(true);
    setEditingKey(null); // Reset editing key for adding new tool
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingKey(null); // Reset editing key
  };

  const handleSubmit = (values) => {
    if (editingKey) { // Check if we are editing an existing row
      const updatedData = ConsumablesData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setConsumablesData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${ConsumablesData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setConsumablesData([...ConsumablesData, newTool]); // Add new tool to the list
      message.success('Tool added successfully');
    }
    handleCancel(); // Close the modal
  };

  const handleEditOrder = (record) => {
    form.setFieldsValue(record); // Set the form fields with the selected record's data
    setIsModalVisible(true); // Show the modal for editing
    setEditingKey(record.key); // Set the editing key
  };

  const handleDeleteOrder = (record) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this tool?',
      onOk: () => {
        setConsumablesData(ConsumablesData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(ConsumablesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consumables Data");
    XLSX.writeFile(wb, "Consumables_template.xlsx");
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            const formattedData = data.map((item) => ({
                key: item.key || `T${ConsumablesData.length + 1}`, // Generate a new key if not present
                id: item.id || '',
                description: item.description || '',
                unit_id: item.unit_id || '',
                stock: parseInt(item.stock) || 0,
            }));

            setConsumablesData([...ConsumablesData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} Consumables`);
        } catch (error) {
            message.error('Error processing file');
            console.error(error);
        }
    };
    reader.readAsBinaryString(file);
    return false; // Prevent automatic upload
};

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    sorter: (a, b) => a.id.localeCompare(b.id),
    onFilter: (value, record) => record.id.includes(value),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    sorter: (a, b) => a.description.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(ConsumablesData.map(item => item.description))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.description.includes(value),
  },
  {
    title: 'Unit ID',
    dataIndex: 'unit_id',
    key: 'unit_id',
    sorter: (a, b) => a.unit_id.localeCompare(b.type),
    filterSearch: true,
    filters: [...new Set(ConsumablesData.map(item => item.unit_id))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.unit_id.includes(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    sorter: (a, b) => a.stock.localeCompare(b.type),
    filterSearch: true,
    filters: [...new Set(ConsumablesData.map(item => item.stock))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.unit_id.includes(value),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: 'Available', value: 'Available' },
      { text: 'In Use', value: 'In Use' },
    ],
    onFilter: (value, record) => record.status === value,
    filterSearch: true,
    render: (status) => (
      <span style={{ color: status === 'Available' ? '#52c41a' : '#faad14' }}>
        {status}
      </span>
    ),
  },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditOrder(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteOrder(record)} />
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (filters?.status) {
      const filtered = ConsumablesData.filter(item => 
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(ConsumablesData);
    }
  }, [filters, ConsumablesData]);

  return (
    <div>
      <Card 
        title="Consumables Data"
        extra={
          <Space>
             <AntInput.Search
              placeholder="Search across all columns..."
              onChange={(e) => handleGlobalSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
              <Button type="primary"
          onClick={showModal}>
          Add New Tool
      </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadData}>
              Download
            </Button>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleFileUpload}
            >
              <Button icon={<UploadOutlined />}>
                Upload Excel
              </Button>
            </Upload>
            <Button 
              type="primary" 
              icon={<FilterOutlined />} 
              onClick={showDrawer}
            >
              Master Filter
            </Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={getFilteredData()}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingKey ? "Edit Tool" : "Add New Tool"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            available_from: dayjs(),
            status: 'Available'
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="id"
                label="ID"
                rules={[{ required: true, message: 'Please input the ID!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please input the Description!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit_id" // New field
                label="Unit ID"
                rules={[{ required: true, message: 'Please input the Unit ID!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="Stock"
                rules={[{ required: true, message: 'Please input the Stock!' }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">Submit</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
  title="Master Filter"
  placement="right"
  onClose={closeDrawer}
  open={isDrawerVisible}
>
  <Form layout="vertical" form={form}>
    {/* Categorical Filters */}
     <Form.Item label={<span className="font-bold">Unit ID</span>}>
      <Select
        mode="multiple"
        allowClear
        showSearch
        value={selectedUnitID}
        placeholder="Select UnitID"
        style={{ width: '100%' }}
        options={[...new Set(ConsumablesData.map(item => item.unit_id))].map(value => ({
          label: value,
          value: value,
        }))}
        onChange={(values) => {
          setSelectedUnitID(values);
          handleCheckboxChange('unit_id', values);
        }}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>
    <Form.Item label={<span className="font-bold">Stock</span>}>
      <Slider
        range
        value={selectedStock}
        min={0}
        max={Math.max(...ConsumablesData.map(item => item.stock))}
        onChange={(values) => {
          setSelectedStock(values);
          handleSliderChange('stock', values);
        }}
        trackStyle={[{ backgroundColor: '#1890ff' }]}
        handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
        marks={{
          0: '0',
          [Math.max(...ConsumablesData.map(item => item.stock))]: 
            Math.max(...ConsumablesData.map(item => item.stock))
        }}
      />
    </Form.Item>
    <Form.Item label={<span className="font-bold">Status</span>}>
      <Checkbox.Group
        options={[{ label: 'Available', value: 'Available' }, { label: 'In Use', value: 'In Use' }]}
        onChange={values => handleCheckboxChange('status', values)}
      />
    </Form.Item>
    <Form.Item>
      <Row justify="space-between">
        <Col>
          <Button onClick={resetFilters}>Reset</Button>
        </Col>
        <Col>
          <Button type="primary" onClick={applyFilters}>
            Apply Filter
          </Button>
        </Col>
      </Row>
    </Form.Item>
  </Form>
</Drawer>
    </div>
  );
};

export default Consumables;