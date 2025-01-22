import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col,  Input as AntInput,  Drawer, Checkbox, Slider, Select } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const Inserts = ({filters }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedBelParts, setSelectedBelParts] = useState([]);
  const [selectedSuitableFor, setSelectedSuitableFor] = useState([]);
  const [selectedToolMaterials, setSelectedToolMaterials] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedConfiguration, setSelectedConfiguration] = useState([0, 100]);
  const [selectedType, setSelectedType] = useState([0, 100]);
  const [selectedSize, setSelectedSize] = useState([0, 100]); 
  const [selectedNoOfEdges, setSelectedNoOfEdges] = useState([0, 100]);
  const [selectedThickness, setSelectedThickness] = useState([0, 100]);
  const [selectedCornerRadius, setSelectedCornerRadius] = useState([0, 100]);
  const [selectedStock, setSelectedStock] = useState([0, 100]);

  const [InsertsData, setInsertsData] = useState([
    {
      key: '1',
      bel_part_number: '3105 120 201 59',
      bel_part_description: 'High precision end mill',
      configuration: '', // Added new field
      type: '', // Added new field
      size: '', // Added new field
      no_of_edges: 0, // Added new field
      thickness: 0, // Added new field
      corner_radius: 0, // Added new field
      suitable_for: 'Aluminum',
      tool_material: 'Carbide',
      project: 'Milling',
      stock: 10,
      status: 'Available',
    },
    {
      key: '2',
      bel_part_number: '3105 120 201 56',
      bel_part_description: 'low precision end mill',
      configuration: '2', // Added new field
      type: '2', // Added new field
      size: '2', // Added new field
      no_of_edges: 0, // Added new field
      thickness: 0, // Added new field
      corner_radius: 0, // Added new field
      suitable_for: 'Aluminum',
      tool_material: 'Carbide',
      project: 'Mill',
      stock: 10,
      status: 'In Use',
    },
    // ... other existing data ...
  ]);

  const showDrawer = () => {
    setSelectedFilters({}); // Reset selected filters when opening the drawer
    form.resetFields(); // Reset all form fields to initial empty state
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    if (!Object.keys(selectedFilters).length) {
      // If no filters are applied, reset the data to original state
      setFilteredData(InsertsData);
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
        const filtered = InsertsData.filter(item => {
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
    setFilteredData(InsertsData); // Reset table dat
    setSelectedBelParts([]);
    setSelectedSuitableFor([]);
    setSelectedToolMaterials([]);
    setSelectedProjects([]);
    setSelectedConfiguration([0, 100]);
    setSelectedType([0, 100]);
    setSelectedSize([0, 100]);
    setSelectedNoOfEdges([0, 100]);
    setSelectedThickness([0, 100]);
    setSelectedCornerRadius([0, 100]);
    setSelectedStock([0, 100]);
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
      const updatedData = InsertsData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setInsertsData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${InsertsData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setInsertsData([...InsertsData, newTool]); // Add new tool to the list
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
        setInsertsData(InsertsData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(InsertsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inserts Data");
    XLSX.writeFile(wb, "Inserts_template.xlsx");
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
                key: item.key || `T${InsertsData.length + index + 1}`, // Generate a new key if not present
                bel_part_number: item.bel_part_number || '',
                bel_part_description: item.bel_part_description || '',
                configuration: item.configuration || '', // New field
                type: item.type || '', // New field
                size: item.size || '', // New field
                no_of_edges: parseInt(item.no_of_edges) || 0, // New field
                thickness: parseFloat(item.thickness) || 0, // New field
                corner_radius: parseFloat(item.corner_radius) || 0, // New field
                suitable_for: item.suitable_for || '',
                tool_material: item.tool_material || '', // New field
                project: item.project || '', // New field
                stock: parseInt(item.stock) || 0,
            }));
  
            setInsertsData([...InsertsData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} Inserts`);
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
      title: 'SL. No',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: 'BEL Part Number',
      dataIndex: 'bel_part_number',
      key: 'bel_part_number',
      sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
    },
    {
      title: 'BEL Part Description',
      dataIndex: 'bel_part_description',
      key: 'bel_part_description',
      sorter: (a, b) => a.bel_part_description.localeCompare(b.bel_part_description),
    },
    {
      title: 'Configuration', // Added new column
      dataIndex: 'configuration',
      key: 'configuration',
      sorter: (a, b) => a.configuration.localeCompare(b.configuration),
    },
    {
      title: 'Type', // Added new column
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: 'Size', // Added new column
      dataIndex: 'size',
      key: 'size',
      sorter: (a, b) => a.size.localeCompare(b.size),
    },
    {
      title: 'No. of Edges', // Added new column
      dataIndex: 'no_of_edges',
      key: 'no_of_edges',
      sorter: (a, b) => a.no_of_edges - b.no_of_edges,
    },
    {
      title: 'Thickness', // Added new column
      dataIndex: 'thickness',
      key: 'thickness',
      sorter: (a, b) => a.thickness - b.thickness,
    },
    {
      title: 'Corner Radius', // Added new column
      dataIndex: 'corner_radius',
      key: 'corner_radius',
      sorter: (a, b) => a.corner_radius - b.corner_radius,
    },
    {
      title: 'Suitable For',
      dataIndex: 'suitable_for',
      key: 'suitable_for',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.suitable_for))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.suitable_for.includes(value),
    },
    {
      title: 'Tool Material',
      dataIndex: 'tool_material',
      key: 'tool_material',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.tool_material))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.tool_material.includes(value),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.project))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.project.includes(value),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
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
      const filtered = InsertsData.filter(item => 
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(InsertsData);
    }
  }, [filters, InsertsData]);

  return (
    <div>
      <Card 
        title="Inserts Data"
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
            lastUpdated: dayjs(),
            status: 'Available'
          }}
        >
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="bel_part_number"
                label="BEL Part Number"
                rules={[{ required: true, message: 'Please input the BEL Part Number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bel_part_description"
                label="BEL Part Description"
                rules={[{ required: true, message: 'Please input the BEL Part Description!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="configuration" // Added new field
                label="Configuration"
                rules={[{ required: true, message: 'Please input the Configuration!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="type" // Added new field
                label="Type"
                rules={[{ required: true, message: 'Please input the Type!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="size" // Added new field
                label="Size"
                rules={[{ required: true, message: 'Please input the Size!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="no_of_edges" // Added new field
                label="No. of Edges"
                rules={[{ required: true, message: 'Please input the No. of Edges!' }]}
              >
                <Input type="number" min={0} step="1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="thickness" // Added new field
                label="Thickness"
                rules={[{ required: true, message: 'Please input the Thickness!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="corner_radius" // Added new field
                label="Corner Radius"
                rules={[{ required: true, message: 'Please input the Corner Radius!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="suitable_for"
                label="Suitable For"
                rules={[{ required: true, message: 'Please input what the tool is suitable for!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tool_material"
                label="Tool Material"
                rules={[{ required: true, message: 'Please input the Tool Material!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="project"
                label="Project"
                rules={[{ required: true, message: 'Please input the Project!' }]}
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
                <Input type="number" min={0} step="1"/>
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
          <Form.Item label={<span className="font-bold">BEL Part Number</span>}>
            <Select
              mode="multiple"
              allowClear
              showSearch
              value={selectedBelParts}
              placeholder="Select BEL Part Numbers"
              style={{ width: '100%' }}
              options={[...new Set(InsertsData.map(item => item.bel_part_number))].map(value => ({
                label: value,
                value: value,
              }))}
              onChange={(values) => {
                setSelectedBelParts(values);
                handleCheckboxChange('bel_part_number', values);
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold">Suitable For</span>}>
            <Select
              mode="multiple"
              allowClear
              showSearch
              value={selectedSuitableFor}
              placeholder="Select Suitable For"
              style={{ width: '100%' }}
              options={[...new Set(InsertsData.map(item => item.suitable_for))].map(value => ({
                label: value,
                value: value,
              }))}
              onChange={(values) => {
                setSelectedSuitableFor(values);
                handleCheckboxChange('suitable_for', values);
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          
          <Form.Item label={<span className="font-bold">Tool Material</span>}>
          <Select
            mode="multiple"
            allowClear
            showSearch
            value={selectedToolMaterials}
            placeholder="Select Tool Material"
            style={{ width: '100%' }}
            options={[...new Set(InsertsData.map(item => item.tool_material))].map(value => ({
              label: value,
              value: value,
            }))}
            onChange={(values) => {
              setSelectedToolMaterials(values);
              handleCheckboxChange('tool_material', values);
            }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold">Project</span>}>
          <Select
            mode="multiple"
            allowClear
            showSearch
            value={selectedProjects}
            placeholder="Select Project"
            style={{ width: '100%' }}
            options={[...new Set(InsertsData.map(item => item.project))].map(value => ({
              label: value,
              value: value,
            }))}
            onChange={(values) => {
              setSelectedProjects(values);
              handleCheckboxChange('project', values);
            }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold">Configuration</span>}>
          <Slider
            range
            value={selectedConfiguration}
            min={0}
            max={100}
            onChange={(values) => {
              setSelectedConfiguration(values);
              handleSliderChange('configuration', values);
            }}
            marks={{ 0: '0', 100: '100' }}
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold">Type</span>}>
          <Slider
            range
            value={selectedType}
            min={0}
            max={100}
            onChange={(values) => {
              setSelectedType(values);
              handleSliderChange('type', values);
            }}
            marks={{ 0: '0', 100: '100' }}
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold">Size</span>}>
          <Slider
            range
            value={selectedSize}
            min={0}
            max={100}
            onChange={(values) => {
              setSelectedSize(values);
              handleSliderChange('size', values);
            }}
            marks={{ 0: '0', 100: '100' }}
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold">Number of Edges</span>}>
          <Slider
            range
            value={selectedNoOfEdges}
            min={0}
            max={100}
            onChange={(values) => {
              setSelectedNoOfEdges(values);
              handleSliderChange('no_of_edges', values);
            }}
            marks={{ 0: '0', 100: '100' }}
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold">Thickness</span>}>
          <Slider
            range
            value={selectedThickness}
            min={0}
            max={100}
            onChange={(values) => {
              setSelectedThickness(values);
              handleSliderChange('thickness', values);
            }}
            marks={{ 0: '0', 100: '100' }}
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold">Corner Radius</span>}>
          <Slider
            range
            value={selectedCornerRadius}
            min={0}
            max={100}
            onChange={(values) => {
              setSelectedCornerRadius(values);
              handleSliderChange('corner_radius', values);
            }}
            marks={{ 0: '0', 100: '100' }}
          />
        </Form.Item>
          
          <Form.Item label={<span className="font-bold">Stock</span>}>
            <Slider
              range
              value={selectedStock}
              min={0}
              max={Math.max(...InsertsData.map(item => item.stock))}
              onChange={(values) => {
                setSelectedStock(values);
                handleSliderChange('stock', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...InsertsData.map(item => item.stock))]: 
                  Math.max(...InsertsData.map(item => item.stock))
              }}
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

export default Inserts;