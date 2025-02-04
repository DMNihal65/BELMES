import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table, 
  Space, 
  Button, 
  Tooltip,
  Tag
} from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DashboardOutlined,
  AlertOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const InventoryOverview = () => {
  // Enhanced sample data
  const summaryData = {
    totalTools: 4689,
    totalToolsChange: 8.5,
    totalToolsPeriod: 'Up from past week',
    
    availableTools: 293,
    availableToolsChange: 1.3,
    availableToolsPeriod: 'Up from yesterday',
    
    inUseTools: 56,
    inUseToolsChange: 1.3,
    inUseToolsPeriod: 'Up from past week',
    
    totalRequests: 200,
    totalRequestsChange: 8.5,
    totalRequestsPeriod: 'Up from past week',
    
    rawMaterials: 689,
    rawMaterialsChange: 8.5,
    rawMaterialsPeriod: 'Up from past week',
    
    consumables: 89,
    consumablesChange: 8.5,
    consumablesPeriod: 'Up from past week'
  };

  // Sample chart options
  const categoryDistributionOption = {
    title: {
      text: 'Category Distribution',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: 'Categories',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: 'Tools' },
          { value: 735, name: 'Raw Materials' },
          { value: 580, name: 'Consumables' },
          { value: 484, name: 'Spare Parts' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  const stockTrendOption = {
    title: {
      text: 'Stock Level Trends',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Tools', 'Raw Materials', 'Consumables'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Tools',
        type: 'line',
        data: [150, 230, 224, 218, 135, 147]
      },
      {
        name: 'Raw Materials',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330]
      },
      {
        name: 'Consumables',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230]
      }
    ]
  };

  // Sample alerts data
  const alertsData = [
    {
      key: '1',
      type: 'Low Stock',
      item: 'Cutting Tool XYZ',
      status: 'Critical',
      action: 'Reorder Required'
    },
    // Add more alerts...
  ];

  const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon, color = 'sky' }) => {
    const isPositive = trend > 0;
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300`}>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <ArrowUpIcon className={`w-4 h-4 text-${color}-500`} />
              ) : (
                <ArrowDownIcon className={`w-4 h-4 text-red-500`} />
              )}
              <span className={`text-${isPositive ? color : 'red'}-500 text-sm font-medium`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-gray-500 text-sm">{trendPeriod}</span>
            </div>
          </div>
          <div className={`p-4 bg-${color}-100 rounded-xl`}>
            <Icon style={{ fontSize: '24px', color: `var(--${color}-500)` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Overview</h1>
        <Space>
          <Button icon={<ReloadOutlined />}>Refresh Data</Button>
          <Button icon={<DownloadOutlined />} type="primary">
            Export Report
          </Button>
        </Space>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Tools"
          value={summaryData.totalTools.toLocaleString()}
          trend={summaryData.totalToolsChange}
          trendPeriod={summaryData.totalToolsPeriod}
          icon={ToolOutlined}
        />
        <MetricCard
          title="Raw Materials"
          value={summaryData.rawMaterials.toLocaleString()}
          trend={summaryData.rawMaterialsChange}
          trendPeriod={summaryData.rawMaterialsPeriod}
          icon={BarChartOutlined}
        />
        <MetricCard
          title="Consumables"
          value={summaryData.consumables.toLocaleString()}
          trend={summaryData.consumablesChange}
          trendPeriod={summaryData.consumablesPeriod}
          icon={PieChartOutlined}
        />
        <MetricCard
          title="Available Tools"
          value={summaryData.availableTools.toLocaleString()}
          trend={summaryData.availableToolsChange}
          trendPeriod={summaryData.availableToolsPeriod}
          icon={CheckCircleOutlined}
        />
        <MetricCard
          title="In Use Tools"
          value={summaryData.inUseTools.toLocaleString()}
          trend={summaryData.inUseToolsChange}
          trendPeriod={summaryData.inUseToolsPeriod}
          icon={LineChartOutlined}
        />
        <MetricCard
          title="Total Requests"
          value={summaryData.totalRequests.toLocaleString()}
          trend={summaryData.totalRequestsChange}
          trendPeriod={summaryData.totalRequestsPeriod}
          icon={DashboardOutlined}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-sm">
          <ReactECharts option={categoryDistributionOption} style={{ height: '400px' }} />
        </Card>
        <Card className="shadow-sm">
          <ReactECharts option={stockTrendOption} style={{ height: '400px' }} />
        </Card>
      </div>

      {/* Alerts and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Inventory Alerts" extra={<Button type="link">View All</Button>} className="shadow-sm">
          <Table
            dataSource={alertsData}
            columns={[
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                render: (text) => (
                  <Space>
                    <AlertOutlined className="text-red-500" />
                    {text}
                  </Space>
                )
              },
              {
                title: 'Item',
                dataIndex: 'item',
                key: 'item'
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (text) => (
                  <Tag color={text === 'Critical' ? 'red' : 'orange'}>{text}</Tag>
                )
              },
              {
                title: 'Action',
                dataIndex: 'action',
                key: 'action',
                render: (text) => (
                  <Button type="link" size="small">{text}</Button>
                )
              }
            ]}
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Stock Levels" className="shadow-sm">
          <div className="space-y-4">
            {['Tools', 'Raw Materials', 'Consumables'].map((category) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-gray-600">{category}</span>
                <div className="flex-1 mx-4">
                  <Progress
                    percent={75}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
                <span className="text-gray-900 font-medium">75%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InventoryOverview; 