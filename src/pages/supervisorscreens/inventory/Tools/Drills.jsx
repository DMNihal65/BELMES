import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input, Row, Col,  Input as AntInput,  Drawer, Checkbox, Slider, Select  } from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined , FilterOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const Drills = ({filters}) => {
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
  const [selectedToolDiameter, setSelectedToolDiameter] = useState([0, 100]);
  const [selectedShankDiameter, setSelectedShankDiameter] = useState([0, 100]);
  const [selectedNoOfFlutes, setSelectedNoOfFlutes] = useState([0, 100]);
  const [selectedFluteLength, setSelectedFluteLength] = useState([0, 100]);
  const [selectedClearanceLength, setSelectedClearanceLength] = useState([0, 100]);
  const [selectedTotalLength, setSelectedTotalLength] = useState([0, 100]);
  const [selectedAngle, setSelectedAngle] = useState([0, 100]);
  const [selectedStock, setSelectedStock] = useState([0, 100]);
  const [DrillsData, setDrillsData] = useState([
    {
      key: '1',
      bel_part_number: '3105 120 201 59',
      bel_part_description: 'High precision end mill',
      tool_diameter: 8,
      shank_diameter: 6,
      no_of_flutes: 2,
      flute_length: 50,
      clearance_length: 50,
      total_length: 100,
      angle: 45, // Added new field
      suitable_for: 'Aluminum',
      tool_material: 'Carbide', // Added new field
      project: 'Milling', // Added new field
      stock: 10,
      // status: 'Available',
    },
    {
      key: '2',
      bel_part_number: '4104 120 201 49',
      bel_part_description: 'LOW',
      tool_diameter: 8,
      shank_diameter: 6,
      no_of_flutes: 4,
      flute_length: 50,
      clearance_length: 50,
      total_length: 100,
      angle: 45, // Added new field
      suitable_for: 'Aluminum',
      tool_material: 'Carbide', // Added new field
      project: 'Milling', // Added new field
      stock: 10,
      // status: 'In Use',
    },
    // ... other existing data ...
  ]);


  const showDrawer = () => {
    setSelectedFilters({});  // Reset selected filters state
    form.resetFields();  // Reset all form fields to initial empty state
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    if (!Object.keys(selectedFilters).length) {
  // If no filters are applied, reset the data to original state
      setFilteredData(DrillsData);
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
        // If no filters are selected, show all data
        setFilteredData(DrillsData);
        message.info('No filters applied - showing all data');
      } else {
        const filtered = DrillsData.filter(item => {
          return Object.keys(selectedFilters).every(column => {
            const filterValue = selectedFilters[column];
            if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
              return true;
            }
            if (Array.isArray(filterValue)) {
              // For checkboxes and multi-select
              return filterValue.includes(item[column]);
            } else if (typeof filterValue === 'object') {
              // For sliders
              const itemValue = parseFloat(item[column]);
              return itemValue >= filterValue[0] && itemValue <= filterValue[1];
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
      console.error(error);
    }
  };

  const resetFilters = () => {
    setSelectedFilters({}); 
    setFilteredData(DrillsData); 
    setSelectedBelParts([]);
    setSelectedSuitableFor([]);
    setSelectedToolMaterials([]);
    setSelectedProjects([]);  
    setSelectedAngle([0, 100]);
    setSelectedShankDiameter([0, 100]);
    setSelectedNoOfFlutes([0, 100]);
    setSelectedFluteLength([0, 100]);
    setSelectedClearanceLength([0, 100]);
    setSelectedTotalLength([0, 100]);
    setSelectedToolDiameter([0, 100]);
    setSelectedStock([0, 100]);
    form.resetFields(); 
    setIsDrawerVisible(false);
    message.success('Filters have been reset');
  };

  useEffect(() => {
    if (!isDrawerVisible) {
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
    form.resetFields(); 
    setIsModalVisible(true);
    setEditingKey(null); 
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingKey(null); // Reset editing key
  };

  const handleSubmit = (values) => {
    if (editingKey) { // Check if we are editing an existing row
      const updatedData = DrillsData.map(item => 
        item.key === editingKey ? { ...item, ...values } : item // Update the specific item
      );
      setDrillsData(updatedData);
      message.success('Tool updated successfully');
    } else {
      const newTool = {
        key: `T${DrillsData.length + 1}`, // Generate a new key
        ...values, // Spread the form values
      };
      setDrillsData([...DrillsData, newTool]); // Add new tool to the list
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
        setDrillsData(DrillsData.filter(item => item.key !== record.key)); // Remove the selected item
        message.success('Tool deleted successfully');
      },
    });
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(DrillsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drills Data");
    XLSX.writeFile(wb, "Drills_template.xlsx");
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
          bel_part_number: item.bel_part_number || '',
          bel_part_description: item.bel_part_description || '',
          tool_diameter: parseFloat(item.tool_diameter) || 0,
          shank_diameter: parseFloat(item.shank_diameter) || 0,
          no_of_flutes: parseInt(item.no_of_flutes) || 0,
          flute_length: parseFloat(item.flute_length) || 0,
          clearance_length: parseFloat(item.clearance_length) || 0,
          total_length: parseFloat(item.total_length) || 0,
          angle: parseFloat(item.angle) || 0, // Added new field
          suitable_for: item.suitable_for || '',
          tool_material: item.tool_material || '', // Added new field
          project: item.project || '', // Added new field
          stock: parseInt(item.stock) || 0,
        }));
  
        setDrillsData([...DrillsData, ...formattedData]);
        message.success(`Successfully added ${formattedData.length} Drills`);
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
    onFilter: (value, record) => record.key === value,
  },
  {
    title: 'BEL Part Number',
    dataIndex: 'bel_part_number',
    key: 'bel_part_number',
    sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.bel_part_number))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.bel_part_number.includes(value),
  },
  {
    title: 'BEL Part Description',
    dataIndex: 'bel_part_description',
    key: 'bel_part_description',
    sorter: (a, b) => a.bel_part_description.localeCompare(b.bel_part_description),
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.bel_part_description))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.bel_part_description.includes(value),
  },
  {
    title: 'Tool Diameter',
    dataIndex: 'tool_diameter',
    key: 'tool_diameter',
    sorter: (a, b) => a.tool_diameter - b.tool_diameter,
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.tool_diameter))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.tool_diameter === value,
  },
  {
    title: 'Shank Diameter',
    dataIndex: 'shank_diameter',
    key: 'shank_diameter',
    sorter: (a, b) => a.shank_diameter - b.shank_diameter,
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.shank_diameter))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.shank_diameter === value,
  },
  {
    title: 'No. of Flutes',
    dataIndex: 'no_of_flutes',
    key: 'no_of_flutes',
    sorter: (a, b) => a.no_of_flutes - b.no_of_flutes,
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.no_of_flutes))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.no_of_flutes === value,
  },
  {
    title: 'Flute Length',
    dataIndex: 'flute_length',
    key: 'flute_length',
    sorter: (a, b) => a.flute_length - b.flute_length,
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.flute_length))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.flute_length === value,
  },
  {
    title: 'Clearance Length',
    dataIndex: 'clearance_length',
    key: 'clearance_length',
    sorter: (a, b) => a.clearance_length - b.clearance_length,
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.clearance_length))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.clearance_length === value,
  },
  {
    title: 'Total Length',
    dataIndex: 'total_length',
    key: 'total_length',
    sorter: (a, b) => a.total_length - b.total_length,
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.total_length))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.total_length === value,
  },
  {
    title: 'Angle', // Added new column
    dataIndex: 'angle',
    key: 'angle',
    sorter: (a, b) => a.angle - b.angle,
    filterSearch: true,
  },
  {
    title: 'Suitable For',
    dataIndex: 'suitable_for',
    key: 'suitable_for',
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.suitable_for))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.suitable_for.includes(value),
  },
  {
    title: 'Tool Material', // Added new column
    dataIndex: 'tool_material',
    key: 'tool_material',
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.tool_material))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.tool_material.includes(value),
  },
  {
    title: 'Project', // Added new column
    dataIndex: 'project',
    key: 'project',
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.project))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.project.includes(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    sorter: (a, b) => a.stock - b.stock,
    filterSearch: true,
    filters: [...new Set(DrillsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.stock === value,
  },
  // {
  //   title: 'Status',
  //   dataIndex: 'status',
  //   key: 'status',
  //   filters: [
  //     { text: 'Available', value: 'Available' },
  //     { text: 'In Use', value: 'In Use' },
  //   ],
  //   onFilter: (value, record) => record.status === value,
  //   filterSearch: true,
  //   render: (status) => (
  //     <span style={{ color: status === 'Available' ? '#52c41a' : '#faad14' }}>
  //       {status}
  //     </span>
  //   ),
  // },
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
      const filtered = DrillsData.filter(item => 
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(DrillsData);
    }
  }, [filters, DrillsData]);

  return (
    <div>
      <Card 
        title="Drills Data"
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
                name="tool_diameter"
                label="Tool Diameter"
                rules={[{ required: true, message: 'Please input the Tool Diameter!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="shank_diameter"
                label="Shank Diameter"
                rules={[{ required: true, message: 'Please input the Shank Diameter!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="no_of_flutes"
                label="No. of Flutes"
                rules={[{ required: true, message: 'Please input the No. of Flutes!' }]}
              >
                <Input type="number" min={0} step="0.1"/>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="flute_length"
                label="Flute Length"
                rules={[{ required: true, message: 'Please input the Flute Length!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="clearance_length"
                label="Clearance Length"
                rules={[{ required: true, message: 'Please input the Clearance Length!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="total_length"
                label="Total Length"
                rules={[{ required: true, message: 'Please input the Total Length!' }]}
              >
                <Input type="number" min={0} step="0.1"/>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="angle" // Added new field
                label="Angle"
                rules={[{ required: true, message: 'Please input the Angle!' }]}
              >
                <Input type="number" min={0} step="0.1" />
              </Form.Item>
            </Col>
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
                name="tool_material" // Added new field
                label="Tool Material"
                rules={[{ required: true, message: 'Please input the Tool Material!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="project" // Added new field
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
                <Input type="number" min={0} step="0.1"/>
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
              options={[...new Set(DrillsData.map(item => item.bel_part_number))].map(value => ({
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
              options={[...new Set(DrillsData.map(item => item.suitable_for))].map(value => ({
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
            options={[...new Set(DrillsData.map(item => item.tool_material))].map(value => ({
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
            options={[...new Set(DrillsData.map(item => item.project))].map(value => ({
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

            <Form.Item label={<span className="font-bold">Tool Diameter</span>}> 
            <Slider
              range
              value={selectedToolDiameter}
              min={0}
              max={Math.max(...DrillsData.map(item => item.tool_diameter))}
              onChange={(values) => {
                setSelectedToolDiameter(values);
                handleSliderChange('tool_diameter', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]} // Blue highlight color
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]} // Blue handle color
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.tool_diameter))]: 
                  Math.max(...DrillsData.map(item => item.tool_diameter))
              }}
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold">Shank Diameter</span>}>  
            <Slider
              range
              value={selectedShankDiameter}
              min={0}
              max={Math.max(...DrillsData.map(item => item.shank_diameter))}
              onChange={(values) => {
                setSelectedShankDiameter(values);
                handleSliderChange('shank_diameter', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.shank_diameter))]: 
                  Math.max(...DrillsData.map(item => item.shank_diameter))
              }}
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold">No. of Flutes</span>}> 
            <Slider
              range
              value={selectedNoOfFlutes}
              min={0}
              max={Math.max(...DrillsData.map(item => item.no_of_flutes))}
              onChange={(values) => {
                setSelectedNoOfFlutes(values);
                handleSliderChange('no_of_flutes', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.no_of_flutes))]: 
                  Math.max(...DrillsData.map(item => item.no_of_flutes))
              }}
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold">Flute Length</span>}>  
            <Slider
              range
              value={selectedFluteLength}
              min={0}
              max={Math.max(...DrillsData.map(item => item.flute_length))}
              onChange={(values) => {
                setSelectedFluteLength(values);
                handleSliderChange('flute_length', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.flute_length))]: 
                  Math.max(...DrillsData.map(item => item.flute_length))
              }}
            />
          </Form.Item>
      
          <Form.Item label={<span className="font-bold">Clearance Length</span>}>   
            <Slider
              range
              value={selectedClearanceLength}
              min={0}
              max={Math.max(...DrillsData.map(item => item.clearance_length))}
              onChange={(values) => {
                setSelectedClearanceLength(values);
                handleSliderChange('clearance_length', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.clearance_length))]: 
                  Math.max(...DrillsData.map(item => item.clearance_length))
              }}
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold">Total Length</span>}>
            <Slider
              range
              value={selectedTotalLength}
              min={0}
              max={Math.max(...DrillsData.map(item => item.total_length))}
              onChange={(values) => {
                setSelectedTotalLength(values);
                handleSliderChange('total_length', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.total_length))]: 
                  Math.max(...DrillsData.map(item => item.total_length))
              }}
            />
          </Form.Item>

          <Form.Item label={<span className="font-bold">Angle</span>}>
            <Slider
              range
              value={selectedAngle}
              min={0}
              max={Math.max(...DrillsData.map(item => item.angle))}
              onChange={(values) => {
                setSelectedAngle(values);
                handleSliderChange('angle', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.angle))]: 
                  Math.max(...DrillsData.map(item => item.angle))
              }}
            />
          </Form.Item>
          
          <Form.Item label={<span className="font-bold">Stock</span>}>
            <Slider
              range
              value={selectedStock}
              min={0}
              max={Math.max(...DrillsData.map(item => item.stock))}
              onChange={(values) => {
                setSelectedStock(values);
                handleSliderChange('stock', values);
              }}
              trackStyle={[{ backgroundColor: '#1890ff' }]}
              handleStyle={[{ borderColor: '#1890ff' }, { borderColor: '#1890ff' }]}
              marks={{
                0: '0',
                [Math.max(...DrillsData.map(item => item.stock))]: 
                  Math.max(...DrillsData.map(item => item.stock))
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

export default Drills;