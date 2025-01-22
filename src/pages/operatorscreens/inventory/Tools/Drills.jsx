import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Modal, Row, Col, Form, InputNumber, Alert, Input as AntInput, Drawer, Checkbox, Slider, Select, Space, } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

const Drills = ({filters}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedTool, setSelectedTool] = useState(null);
  const [requestStock, setRequestStock] = useState(1);
  const [stockError, setStockError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [belPartNumber, setBelPartNumber] = useState('');
  const [orderNumbers] = useState([
    'ORD-001', 'ORD-002', 'ORD-003', 'ORD-004', 'ORD-005'  // Add your order numbers here
  ]);
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
      no_of_flutes: 4,
      flute_length: 50,
      clearance_length: 50,
      total_length: 100,
      angle: 45, // Added new field
      suitable_for: 'Aluminum',
      tool_material: 'Carbide', // Added new field
      project: 'Milling', // Added new field
      stock: 20,
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
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Button 
        type="primary"
        disabled={record.status === 'In Use'}
        onClick={() => handleRequest(record)}
      >
        Request
      </Button>
    ),
  },
   
  ];

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

  const handleBelPartsSelect = (value) => {
    selectedBelParts(value || '');
  };

  // Add this function to handle order number input
  const handleOrderNumberSelect = (value) => {
    setOrderNumber(value || '');
  };

  const handleRequest = (record) => {
    setSelectedTool(record);
    setRequestStock(1);
    setStockError(false);
    setIsModalVisible(true);
  };

    // Update the handleStockChange function
    const handleStockChange = (value) => {
      if (value === null || value === undefined) {
        setRequestStock('');
        setStockError(false);
        return;
      }
      
      setRequestStock(value);
      if (value > selectedTool.stock) {
        setStockError(true);
      } else {
        setStockError(false);
      }
    };

    // Update the handleSubmit function
    const handleSubmit = () => {
      if (!requestStock || requestStock <= 0) {
        message.error('Please enter a valid quantity');
        return;
      }
      
      if (!orderNumber) {
        message.error('Please enter an order number');
        return;
      }
  
      if (!belPartNumber) {
        message.error('Please enter a part number');
        return;
      }

      if (requestStock > selectedTool.stock) {
        message.error('Please enter a lower quantity');
        return;
      }

      console.log('Submitted request:', {
        tool: selectedTool,
        requestedStock: requestStock
      });
      
      message.success(`Successfully requested ${requestStock} ${requestStock === 1 ? 'stock' : 'stocks'}`);
      setIsModalVisible(false);
      setSelectedTool(null);
      setRequestStock('');
      setOrderNumber('');
      setBelPartNumber('');
      setStockError(false);
    };

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

        {/* Request Tool Modal */}
       <Modal
      title={<div className="border-b border-gray-200 py-2">Request Drills Tool</div>}
      open={isModalVisible}
      onOk={handleSubmit}
      onCancel={() => {
        setIsModalVisible(false);
        setStockError(false);
      }}
      okText="Submit Request"
      okButtonProps={{ 
        disabled: stockError,
        className: 'bg-blue-500'
      }}
      width={800}
    >
      {selectedTool && (
        <div className="py-4">
          {/* Tool Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="m-0 mb-4">Tool Information</h3>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div className="mb-3">
                  <div className="text-gray-500">BEL Part Number</div>
                  <div className="font-medium">{selectedTool.bel_part_number}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Tool Diameter</div>
                  <div className="font-medium">{selectedTool.tool_diameter}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">No. of Flutes</div>
                  <div className="font-medium">{selectedTool.no_of_flutes}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Clearance Length</div>
                  <div className="font-medium">{selectedTool.clearance_length}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-3">
                  <div className="text-gray-500">BEL Part Description</div>
                  <div className="font-medium">{selectedTool.bel_part_description}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Shank Diameter</div>
                  <div className="font-medium">{selectedTool.shank_diameter}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Flute Length</div>
                  <div className="font-medium">{selectedTool.flute_length}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Total Length</div>
                  <div className="font-medium">{selectedTool.total_length}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-3">
                  <div className="text-gray-500">Corner Radius</div>
                  <div className="font-medium">{selectedTool.corner_radius}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Suitable For</div>
                  <div className="font-medium">{selectedTool.suitable_for}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Type Project</div>
                  <div className="font-medium">{selectedTool.type_project}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Available Stock</div>
                  <div className="font-medium">{selectedTool.stock}</div>
                </div>
              </Col>
            </Row>
          </div>

      {/* Request Stock Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="m-0 mb-4">Request Details</h3>
          <div>
            <Row gutter={[0, 16]}>
            <Col span={24}>
              <div className="text-gray-500 mb-2">Order Number</div>
              <Select
                id="orderNumberSelect"
                showSearch
                placeholder="Select or search order number"
                value={orderNumber || undefined}
                onChange={handleOrderNumberSelect}
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onSelect={() => document.getElementById('belPartNumberSelect').focus()}
              >
                {orderNumbers.map(order => (
                  <Select.Option key={order} value={order}>
                    {order}
                  </Select.Option>
                ))}
              </Select>
            </Col> 

            <Col span={24}>
              <div className="text-gray-500 mb-2">Part Number</div>
              <Select
                id="belPartNumberSelect"
                showSearch
                placeholder="Select part number"
                value={belPartNumber || undefined}
                onChange={handleBelPartsSelect}
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onSelect={() => document.getElementById('stockInput').focus()}
              >
                {DrillsData.map(drill => (
                  <Select.Option key={drill.bel_part_number} value={drill.bel_part_number}>
                    {drill.bel_part_number}
                  </Select.Option>
                ))}
              </Select>
            </Col>

              <Col span={24}>
                <div className="text-gray-500 mb-2">
                  Enter Stock Quantity
                </div>
                <InputNumber
                  placeholder="Enter quantity"
                  value={requestStock}
                  onChange={handleStockChange}
                  className="w-full"
                  status={stockError ? 'error' : ''}
                />
              </Col>
              
              <Col span={24}>
                {stockError && (
                  <Alert
                    message="Please Enter Lower Stock Quantity"
                    description={`Maximum available stock is ${selectedTool.stock}. Please enter a lower quantity.`}
                    type="error"
                    showIcon
                  />
                )}
              </Col>
            </Row>
          </div>
        </div>
        </div>
          )}
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