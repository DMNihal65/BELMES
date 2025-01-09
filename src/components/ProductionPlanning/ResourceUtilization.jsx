import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Space, 
  DatePicker, Select, Button, Statistic,
  Typography,Progress
} from 'antd';
import ReactApexChart from 'react-apexcharts';
import { 
  ClockCircleOutlined, ToolOutlined, 
  AlertOutlined, CheckCircleOutlined,
  FilterOutlined, ReloadOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const ResourceUtilization = ({ machines = [], selectedJob = null }) => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Initial chart state
  const [chartState, setChartState] = useState({
    series: [
      {
        name: 'Used Capacity',
        data: machines.map(m => m.usedCapacity || 0)
      },
      {
        name: 'Planned Capacity',
        data: machines.map(m => m.plannedCapacity || 0)
      },
      {
        name: 'Available Capacity',
        data: machines.map(m => (
          (m.totalCapacity || 0) - (m.usedCapacity || 0) - (m.plannedCapacity || 0)
        ))
      }
    ],
    options: {
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: true
        },
        zoom: {
          enabled: true
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 10,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '13px',
                fontWeight: 900
              }
            }
          }
        },
      },
      xaxis: {
        type: 'category',
        categories: machines.map(m => m.name)
      },
      legend: {
        position: 'right',
        offsetY: 40
      },
      fill: {
        opacity: 1
      },
      colors: ['#faad14', '#1890ff', '#52c41a']
    },
  });

  const handleFilter = () => {
    setLoading(true);
    
    // Filter the data based on selection
    let filteredMachines = [...machines];
    
    if (selectedMachine) {
      filteredMachines = filteredMachines.filter(m => m.id === selectedMachine);
    }
    
    if (dateRange) {
      // Add date filtering logic here
      // This is a placeholder - you'll need to implement actual date filtering
      // based on your data structure
    }
    
    // Update chart data
    setChartState(prev => ({
      ...prev,
      series: [
        {
          name: 'Used Capacity',
          data: filteredMachines.map(m => m.usedCapacity || 0)
        },
        {
          name: 'Planned Capacity',
          data: filteredMachines.map(m => m.plannedCapacity || 0)
        },
        {
          name: 'Available Capacity',
          data: filteredMachines.map(m => (
            (m.totalCapacity || 0) - (m.usedCapacity || 0) - (m.plannedCapacity || 0)
          ))
        }
      ],
      options: {
        ...prev.options,
        xaxis: {
          ...prev.options.xaxis,
          categories: filteredMachines.map(m => m.name)
        }
      }
    }));

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setDateRange(null);
    setSelectedMachine(null);
    
    // Reset chart to show all machines
    setChartState(prev => ({
      ...prev,
      series: [
        {
          name: 'Used Capacity',
          data: machines.map(m => m.usedCapacity || 0)
        },
        {
          name: 'Planned Capacity',
          data: machines.map(m => m.plannedCapacity || 0)
        },
        {
          name: 'Available Capacity',
          data: machines.map(m => (
            (m.totalCapacity || 0) - (m.usedCapacity || 0) - (m.plannedCapacity || 0)
          ))
        }
      ],
      options: {
        ...prev.options,
        xaxis: {
          ...prev.options.xaxis,
          categories: machines.map(m => m.name)
        }
      }
    }));
  };

  // Stats calculations
  const stats = {
    totalCapacity: machines.reduce((acc, m) => acc + (m.totalCapacity || 0), 0),
    usedCapacity: machines.reduce((acc, m) => acc + (m.usedCapacity || 0), 0),
    plannedCapacity: machines.reduce((acc, m) => acc + (m.plannedCapacity || 0), 0),
    averageEfficiency: machines.length ? Math.round(
      machines.reduce((acc, m) => acc + (m.efficiency || 0), 0) / machines.length
    ) : 0
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow bg-sky-50">
          <div className="flex justify-between items-center ">
            <Space>
              <div className="p-3 rounded-full bg-sky-100">
                <ClockCircleOutlined className="text-sky-900 text-xl" />
              </div>
              <Text strong className="text-lg">Total Capacity</Text>
            </Space>
            <Text strong className="text-blue-500 text-xl">{`${stats.totalCapacity}h`}</Text>
          </div>
          <div className="mt-4">
            <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow bg-sky-50">
          <div className="flex justify-between items-center">
            <Space>
              <div className="p-3 rounded-full bg-sky-100">
                <ToolOutlined className="text-blue-500 text-xl" />
              </div>
              <Text strong className="text-lg">Used Capacity</Text>
            </Space>
            <Text strong className="text-blue-500 text-xl">{`${stats.usedCapacity}h`}</Text>
          </div>
          <div className="mt-4">
            <Progress
              percent={Math.round((stats.usedCapacity / stats.totalCapacity) * 100)}
              strokeColor="#faad14"
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow bg-sky-50">
          <div className="flex justify-between items-center">
            <Space>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertOutlined className="text-orange-500 text-xl" />
              </div>
              <Text strong className="text-lg">Planned Capacity</Text>
            </Space>
            <Text strong className="text-orange-500 text-xl">{`${stats.plannedCapacity}h`}</Text>
          </div>
          <div className="mt-4">
            <Progress
              percent={Math.round((stats.plannedCapacity / stats.totalCapacity) * 100)}
              strokeColor="#1890ff"
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow bg-sky-50">
          <div className="flex justify-between items-center">
            <Space>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleOutlined className="text-green-500 text-xl" />
              </div>
              <Text strong className="text-lg">Average Efficiency</Text>
            </Space>
            <Text strong className="text-green-500 text-xl">{`${stats.averageEfficiency}%`}</Text>
          </div>
          <div className="mt-4">
            <Progress percent={stats.averageEfficiency} strokeColor="#52c41a" />
          </div>
        </Card>
      </Col>
    </Row>

      {/* Filters */}
      <Card className="shadow-sm">
        <Space size="large" wrap className="flex justify-between">
          <Space size="large" wrap>
            <RangePicker 
              onChange={setDateRange}
              value={dateRange}
              placeholder={['Start Date', 'End Date']}
              className="w-64"
            />
            <Select
              placeholder="Select Machine"
              style={{ width: 200 }}
              onChange={setSelectedMachine}
              value={selectedMachine}
              allowClear
            >
              {machines.map(machine => (
                <Select.Option key={machine.id} value={machine.id}>
                  {machine.name}
                </Select.Option>
              ))}
            </Select>
            <Space>
              <Button 
                type="primary" 
                icon={<FilterOutlined />}
                onClick={handleFilter}
                loading={loading}
              >
                Apply Filters
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Space>
          </Space>
          
          <Button 
            type="primary"
            size="large"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/supervisor/production-planning/scheduling')}
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            Open Scheduler
          </Button>
        </Space>
      </Card>

      {/* ApexCharts Graph */}
      <Card 
        title={<Title level={5}>Machine Utilization Overview</Title>}
        className="shadow-sm"
      >
        <div id="chart">
          <ReactApexChart
            options={chartState.options}
            series={chartState.series}
            type="bar"
            height={350}
          />
        </div>
      </Card>

      {/* Machine Details Table */}
      {/* <Card 
        title={<Title level={5}>Machine Details</Title>}
        className="shadow-sm"
      >
        <Table 
          columns={columns} 
          dataSource={machines}
          pagination={false}
          scroll={{ x: 1000 }}
          loading={loading}
          rowKey="id"
        />
      </Card> */}

      {/* Selected Job Alert if applicable */}
      {selectedJob && selectedJob.machineTypes && (
        <Alert
          message="Selected Job Resource Requirements"
          description={
            <Space direction="vertical">
              <Text>Required Machine Types: {selectedJob.machineTypes.join(', ')}</Text>
              <Text>Estimated Total Time: {(selectedJob.cycleTime || 0) + (selectedJob.setupTime || 0)} minutes</Text>
            </Space>
          }
          type="info"
          showIcon
          className="shadow-sm"
        />
      )}
    </div>
  );
};

export default ResourceUtilization;