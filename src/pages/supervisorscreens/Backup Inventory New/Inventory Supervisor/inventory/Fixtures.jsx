import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col,  Input as AntInput,  Drawer, Checkbox, Slider, Select, DatePicker  } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FilterOutlined  } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const Fixtures = ({filters }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({}); 
  const [selectedType, setSelectedType] = useState([]);
  const [selectedInstrumentCode, setSelectedInstrumentCode] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedSize, setSelectedSize] = useState([0, 100]); 
  const [selectedStock, setSelectedStock] = useState([0, 100]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedCalibrationDate, setSelectedCalibrationDate] = useState([]);
  const [selectedCalibrationDueDate, setSelectedCalibrationDueDate] = useState([]);
  const [selectedMaintenancePlan, setSelectedMaintenancePlan] = useState([]);
  const [selectedNotificationNumber, setSelectedNotificationNumber] = useState([]);
  const [selectedEquipmentNumber, setSelectedEquipmentNumber] = useState([]);
  const [FixturesData, setFixturesData] = useState([
    {
      key: '1',
      id: '001',
      type: 'Type A',
      description: 'High precision end mill',
      instrument_code: 'INST001',
      size: '8mm',
      equipment_number: 'EQ001',
      maintenance_plan: 'Monthly',
      notification_number: 'NOTIF001',
      calibration_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      calibration_due_date: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      location: 'Warehouse 1',
      stock: 10,
      status: 'Available',
    },
    {
      key: '2',
      id: '002',
      type: 'Type A',
      description: 'low precision end mill',
      instrument_code: 'INST001',
      size: '8mm',
      equipment_number: 'EQ001',
      maintenance_plan: 'Monthly',
      notification_number: 'NOTIF001',
      calibration_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      calibration_due_date: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      location: 'Warehouse 1',
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
      setFilteredData(FixturesData);
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
      if (Object.keys(selectedFilters).length === 0) {
        setFilteredData(FixturesData);
        message.info('No filters applied - showing all data');
      } else {
        const filtered = FixturesData.filter(item => {
          return Object.keys(selectedFilters).every(column => {
            const filterValue = selectedFilters[column];
            if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
              return true;
            }
  
            // Handle different types of filters
            if (column === 'calibration_date' || column === 'calibration_due_date') {
              const itemDate = dayjs(item[column]);
              const startDate = dayjs(filterValue[0]);
              const endDate = dayjs(filterValue[1]);
              return itemDate.isAfter(startDate) && itemDate.isBefore(endDate);
            } else if (Array.isArray(filterValue)) {
              return filterValue.includes(item[column]);
            }
            
            return true;
          });
        });
        setFilteredData(filtered);
        message.success(`Filtered data to show ${filtered.length} items`);
      }
      closeDrawer();
    } catch (error) {
      message.error(`Error applying filters: ${error.message}`);
    }
  };

  const resetFilters = () => {
    setSelectedFilters({}); // Reset selected filters
    setFilteredData(FixturesData); // Reset table data
    setSelectedType([]);
    setSelectedInstrumentCode([]);
    setSelectedStatus([]);
    setSelectedSize([0, 100]);
    setSelectedStock([0, 100]);
    setSelectedLocation([]);
    setSelectedCalibrationDate([]);
    setSelectedCalibrationDueDate([]);
    setSelectedMaintenancePlan([]);
    setSelectedNotificationNumber([]);
    setSelectedEquipmentNumber([]);
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
      const updatedData = FixturesData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setFixturesData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${FixturesData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setFixturesData([...FixturesData, newTool]); // Add new tool to the list
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
        setFixturesData(FixturesData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(FixturesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fixtures Data");
    XLSX.writeFile(wb, "Fixtures_template.xlsx");
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            const formattedData = data.map((item, index) => ({
                key: item.key,
                id: item.id || '',
                type: item.type || '',
                description: item.description || '',
                instrument_code: item.instrument_code || '',
                size: item.size || '',
                equipment_number: item.equipment_number || '',
                maintenance_plan: item.maintenance_plan || '',
                notification_number: item.notification_number || '',
                calibration_date: item.calibration_date || '',
                calibration_due_date: item.calibration_due_date || '',
                location: item.location || '',
                stock: parseInt(item.stock) || 0,
                status: item.status || '',
            }));

            setFixturesData([...FixturesData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} Fixtures`);
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
    onFilter: (value, record) => record.key === value,
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    sorter: (a, b) => a.type.localeCompare(b.type),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.type))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.type.includes(value),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    sorter: (a, b) => a.description.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.description))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.description.includes(value),
  },
  {
    title: 'Instrument Code',
    dataIndex: 'instrument_code',
    key: 'instrument_code',
    sorter: (a, b) => a.instrument_code.localeCompare(b.instrument_code),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.instrument_code))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.instrument_code.includes(value),
  },
  {
    title: 'Size',
    dataIndex: 'size',
    key: 'size',
    sorter: (a, b) => a.size.localeCompare(b.size),
  },
  {
    title: 'Equipment Number',
    dataIndex: 'equipment_number',
    key: 'equipment_number',
    sorter: (a, b) => a.equipment_number.localeCompare(b.equipment_number),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.equipment_number))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.equipment_number.includes(value),
  },
  {
    title: 'Maintenance Plan',
    dataIndex: 'maintenance_plan',
    key: 'maintenance_plan',
    sorter: (a, b) => a.maintenance_plan.localeCompare(b.maintenance_plan),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.maintenance_plan))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.maintenance_plan.includes(value),
  },
  {
    title: 'Notification Number',
    dataIndex: 'notification_number',
    key: 'notification_number',
    sorter: (a, b) => a.notification_number.localeCompare(b.notification_number),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.notification_number))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.notification_number.includes(value),
  },
  {
    title: 'Calibration Date',
    dataIndex: 'calibration_date',
    key: 'calibration_date',
    sorter: (a, b) => a.calibration_date.localeCompare(b.calibration_date),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.calibration_date))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.calibration_date.includes(value),
  },
  {
    title: 'Calibration Due Date',
    dataIndex: 'calibration_due_date',
    key: 'calibration_due_date',
    sorter: (a, b) => a.calibration_due_date.localeCompare(b.calibration_due_date),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.calibration_due_date))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.calibration_due_date.includes(value),
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    sorter: (a, b) => a.location.localeCompare(b.location),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.location))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.location.includes(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    sorter: (a, b) => a.stock - b.stock,
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.stock))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.stock === value,
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
      const filtered = FixturesData.filter(item => 
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(FixturesData);
    }
  }, [filters, FixturesData]);

  return (
    <div>
      <Card 
        title="Fixtures Data"
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
                    calibration_date: dayjs(),
                    calibration_due_date: dayjs().add(1, 'month'),
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
                    <Col span={8}>
                        <Form.Item
                            name="type"
                            label="Type"
                            rules={[{ required: true, message: 'Please input the Type!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please input the Description!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="instrument_code"
                            label="Instrument Code"
                            rules={[{ required: true, message: 'Please input the Instrument Code!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="size"
                            label="Size"
                            rules={[{ required: true, message: 'Please input the Size!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="equipment_number"
                            label="Equipment Number"
                            rules={[{ required: true, message: 'Please input the Equipment Number!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="maintenance_plan"
                            label="Maintenance Plan"
                            rules={[{ required: true, message: 'Please input the Maintenance Plan!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="notification_number"
                            label="Notification Number"
                            rules={[{ required: true, message: 'Please input the Notification Number!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="calibration_date"
                            label="Calibration Date"
                            rules={[{ required: true, message: 'Please input the Calibration Date!' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="calibration_due_date"
                            label="Calibration Due Date"
                            rules={[{ required: true, message: 'Please input the Calibration Due Date!' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="location"
                            label="Location"
                            rules={[{ required: true, message: 'Please input the Location!' }]}
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
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="status"
                            label="Status"
                            rules={[{ required: true, message: 'Please input the Status!' }]}
                        >
                            <Input />
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
      <Form.Item label={<span className="font-bold">Type</span>}>
      <Select
        mode="multiple"
        allowClear
        showSearch
        value={selectedType}
        placeholder="Select Type"
        style={{ width: '100%' }}
        options={[...new Set(FixturesData.map(item => item.type))].map(value => ({
          label: value,
          value: value,
        }))}
        onChange={(values) => {
          setSelectedType(values);
          handleCheckboxChange('type', values);
        }}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>

    <Form.Item label={<span className="font-bold">Instrument Code</span>}>
      <Select
        mode="multiple"
        allowClear
        showSearch
        value={selectedInstrumentCode}
        placeholder="Select Instrument Code"
        style={{ width: '100%' }}
        options={[...new Set(FixturesData.map(item => item.instrument_code))].map(value => ({
          label: value,
          value: value,
        }))}
        onChange={(values) => {
          setSelectedInstrumentCode(values);
          handleCheckboxChange('instrument_code', values);
        }}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>

    <Form.Item label={<span className="font-bold">Size</span>}> 
      <Slider
        range
        value={selectedSize}
        min={0}
        max={Math.max(...FixturesData.map(item => {
          // Extract numeric value from size string (e.g., "8mm" -> 8)
          return parseFloat(item.size.replace(/[^0-9.]/g, ''));
        }))}
        onChange={(values) => {
          setSelectedSize(values);
          handleSliderChange('size', values);
        }}
        trackStyle={[{ backgroundColor: '#1890ff' }]}
        handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
        marks={{
          0: '0mm',
          [Math.max(...FixturesData.map(item => 
            parseFloat(item.size.replace(/[^0-9.]/g, ''))
          ))]: `${Math.max(...FixturesData.map(item => 
            parseFloat(item.size.replace(/[^0-9.]/g, ''))
          ))}mm`
        }}
        tipFormatter={value => `${value}mm`}
      />
    </Form.Item>

    <Form.Item label={<span className="font-bold">Equipment Number</span>}>
      <Select
        mode="multiple"
        allowClear
        showSearch
        value={selectedEquipmentNumber}
        placeholder="Select Equipment Number"
        style={{ width: '100%' }}
        options={[...new Set(FixturesData.map(item => item.equipment_number))].map(value => ({
          label: value,
          value: value,
        }))}
        onChange={(values) => {
          setSelectedEquipmentNumber(values);
          handleCheckboxChange('equipment_number', values);
        }}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>

    <Form.Item label={<span className="font-bold">Maintenance Plan</span>}>
      <Checkbox.Group
        options={[...new Set(FixturesData.map(item => item.maintenance_plan))]}
        onChange={values => handleCheckboxChange('maintenance_plan', values)}
      />
    </Form.Item>

    <Form.Item label={<span className="font-bold">Notification Number</span>}>
      <Select
        mode="multiple"
        allowClear
        showSearch
        value={selectedNotificationNumber}
        placeholder="Select Maintenance Plan"
        style={{ width: '100%' }}
        options={[...new Set(FixturesData.map(item => item.notification_number))].map(value => ({
          label: value,
          value: value,
        }))}
        onChange={(values) => {
          setSelectedNotificationNumber(values);
          handleCheckboxChange('notification_number', values);
        }}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>

   <Form.Item label={<span className="font-bold">Calibration Date Range</span>}>
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          value={selectedCalibrationDate}
          onChange={(dates) => {
            setSelectedCalibrationDate(dates);
            if (dates) {
              handleCheckboxChange('calibration_date', [
                dates[0].format('YYYY-MM-DD'),
                dates[1].format('YYYY-MM-DD')
              ]);
            } else {
              handleCheckboxChange('calibration_date', null);
            }
          }}
          allowClear
        />
      </Form.Item>

      <Form.Item label={<span className="font-bold">Calibration Due Date Range</span>}>
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          value={selectedCalibrationDueDate}
          onChange={(dates) => {
            setSelectedCalibrationDueDate(dates);
            if (dates) {
              handleCheckboxChange('calibration_due_date', [
                dates[0].format('YYYY-MM-DD'),
                dates[1].format('YYYY-MM-DD')
              ]);
            } else {
              handleCheckboxChange('calibration_due_date', null);
            }
          }}
          allowClear
        />
      </Form.Item>

    <Form.Item label={<span className="font-bold">Location</span>}>
      <Select
        mode="multiple"
        allowClear
        showSearch
        value={selectedLocation}
        placeholder="Select Location"
        style={{ width: '100%' }}
        options={[...new Set(FixturesData.map(item => item.location))].map(value => ({
          label: value,
          value: value,
        }))}
        onChange={(values) => {
          setSelectedLocation(values);
          handleCheckboxChange('location', values);
        }}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>

    <Form.Item label={<span className="font-bold">Stock</span>}>
            <Slider
              range
              min={0}
              max={Math.max(...FixturesData.map(item => item.stock))}
              onChange={values => handleSliderChange('stock', values)}
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

export default Fixtures;