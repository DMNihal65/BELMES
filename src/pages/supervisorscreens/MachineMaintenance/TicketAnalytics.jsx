import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Modal, Alert, Table, Button, Input, Space } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import useMachineMaintenanceStore from '../../../store/maintenance';

const TicketAnalytics = () => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [mttr, setMttr] = useState(0);
  const [mtbf, setMtbf] = useState(0);
  const [totalFailures, setTotalFailures] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });
  const [machineData, setMachineData] = useState({
    machines: [],
    mtbf: [],
    mttr: []
  });

  const fetchMachinePerformanceMetrics = useMachineMaintenanceStore(state => state.fetchMachinePerformanceMetrics);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchMachinePerformanceMetrics();
        
        // Set shop-level metrics with 2 decimal places instead of rounding
        setMttr(Number(data.mttr_shop.toFixed(2)));
        setMtbf(Number(data.mtbf_shop.toFixed(2)));
        setTotalFailures(data.total_failures);

        // Process machine-specific data
        const machines = [];
        const mttrValues = [];
        const mtbfValues = [];
        const tableRows = [];

        // Process machine-specific data
        Object.entries(data.machines).forEach(([machineId, metrics]) => {
          machines.push(metrics.machine_name);
          mttrValues.push(Number(metrics.mttr.toFixed(2)));
          mtbfValues.push(Number(metrics.mtbf.toFixed(2)));
          
          // Add data for table with 2 decimal places
          tableRows.push({
            key: machineId,
            machine: metrics.machine_name,
            failures: metrics.total_failures,
            mttr: Number(metrics.mttr.toFixed(2)),
            mtbf: Number(metrics.mtbf.toFixed(2))
          });
        });

        // Update machine-specific data for the chart
        setMachineData({
          machines: machines,
          mtbf: mtbfValues,
          mttr: mttrValues
        });

        // Set table data
        setTableData(tableRows);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [fetchMachinePerformanceMetrics]);

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const lineChartOption = {
    title: {
      text: 'Machine-wise MTBF and MTTR Analysis',
      left: 'left',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `
          <div style="font-weight: bold; color: #1f1f1f; margin-bottom: 8px;">
            Machine Name: ${params[0].axisValue}
          </div>
          <div style="border-top: 1px solid #eee; margin: 5px 0;"></div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span style="color: #1890ff;">⬤ ${params[0].seriesName}:</span>
            <span style="font-weight: bold; color: #1890ff;">${params[0].value}h</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span style="color: #666666;">⬤ ${params[1].seriesName}:</span>
            <span style="font-weight: bold;">${params[1].value}h</span>
          </div>`;
      },
      textStyle: {
        fontSize: 13,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'
      },
      padding: [12, 16],
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#eee',
      borderWidth: 1,
      extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); border-radius: 4px;'
    },
    legend: {
      data: ['MTBF', 'MTTR'],
      top: 10,
      right: 10
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: machineData.machines,
      boundaryGap: true,
      axisLabel: {
        fontSize: 12,
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'HOURS',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        fontSize: 12
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'MTBF',
        type: 'line',
        data: machineData.mtbf,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#1890ff'
        },
        itemStyle: {
          color: '#1890ff'
        }
      },
      {
        name: 'MTTR',
        type: 'line',
        data: machineData.mttr,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#666666'
        },
        itemStyle: {
          color: '#666666'
        }
      }
    ]
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleReset = () => {
    setSelectedRowKeys([]);
    setSearchText('');
    setPagination({
      current: 1,
      pageSize: 5,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const getFilteredData = () => {
    if (!searchText) return tableData;
    
    return tableData.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  const columns = [
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      sorter: (a, b) => a.machine.localeCompare(b.machine),
      filterSearch: true,
      filters: [...new Set(tableData.map(item => item.machine))].map(machine => ({
        text: machine,
        value: machine,
      })),
      onFilter: (value, record) => record.machine === value,
    },
    {
      title: 'No of Failures',
      dataIndex: 'failures',
      key: 'failures',
      sorter: (a, b) => a.failures - b.failures,
      filters: [...new Set(tableData.map(item => item.failures))].map(failures => ({
        text: failures.toString(),
        value: failures,
      })),
      onFilter: (value, record) => record.failures === value,
    },
    {
      title: 'MTTR (hours)',
      dataIndex: 'mttr',
      key: 'mttr',
      sorter: (a, b) => a.mttr - b.mttr,
      filterSearch: true,
      filters: [...new Set(tableData.map(item => item.mttr))].map(mttr => ({
        text: mttr.toFixed(2),
        value: mttr,
      })),
      onFilter: (value, record) => record.mttr === value,
      render: (text) => text.toFixed(2)
    },
    {
      title: 'MTBF (hours)',
      dataIndex: 'mtbf',
      key: 'mtbf',
      sorter: (a, b) => a.mtbf - b.mtbf,
      filterSearch: true,
      filters: [...new Set(tableData.map(item => item.mtbf))].map(mtbf => ({
        text: mtbf.toFixed(2),
        value: mtbf,
      })),
      onFilter: (value, record) => record.mtbf === value,
      render: (text) => text.toFixed(2)
    }
  ];

  const cardStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: 'none',
  };

  const statisticStyle = {
    '.ant-statistic-title': {
      color: '#666',
      fontSize: '16px',
      marginBottom: '8px',
    },
    '.ant-statistic-content': {
      color: '#1890ff',
      fontSize: '24px',
      fontWeight: '600',
    },
  };




  
  return (
    <div className="p-4">
      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <Card 
              style={cardStyle}
              title={
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-blue-500 rounded mr-3"></div>
                  <span className="text-lg font-semibold text-gray-700">Mean Time To Repair (MTTR)</span>
                </div>
              }
            >
              <Statistic 
                title="Shop Average MTTR" 
                value={mttr} 
                suffix="hours"
                style={statisticStyle}
              />
            </Card>
          </div>
        </Col>
        <Col span={8}>
          <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <Card 
              style={cardStyle}
              title={
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-green-500 rounded mr-3"></div>
                  <span className="text-lg font-semibold text-gray-700">Mean Time Between Failures (MTBF)</span>
                </div>
              }
            >
              <Statistic 
                title="Shop Average MTBF" 
                value={mtbf} 
                suffix="hours"
                style={statisticStyle}
              />
            </Card>
          </div>
        </Col>
        <Col span={8}>
          <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <Card 
              style={cardStyle}
              title={
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-red-500 rounded mr-3"></div>
                  <span className="text-lg font-semibold text-gray-700">Total Failures</span>
                </div>
              }
            >
              <Statistic 
                title="Total Failures" 
                value={totalFailures}
                style={statisticStyle}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* MTBF-MTTR Line Chart */}
      <Row className="mt-4">
        <Col span={24}>
          <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <Card style={cardStyle}>
              <ReactECharts 
                option={lineChartOption} 
                style={{ height: '400px' }}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* Machine Performance Table */}
      <Row className="mt-4">
        <Col span={24}>
          <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <Card 
              style={cardStyle}
              title={
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-2 h-8 bg-purple-500 rounded mr-3"></div>
                    <span className="text-lg font-semibold text-gray-700">Machine Performance Metrics</span>
                  </div>
                  <Space>
                    <Input
                      placeholder="Search across all columns"
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={{ 
                        width: 250,
                        borderRadius: '6px',
                        border: '1px solid #d9d9d9',
                      }}
                    />
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                      title="Reset to default view"
                    >
                      Reset
                    </Button>
                  </Space>
                </div>
              }
            >
              <Table
                rowSelection={rowSelection}
                dataSource={getFilteredData()}
                columns={columns}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  pageSizeOptions: ['5', '10', '20', '50'],
                  showQuickJumper: true,
                  position: ['bottomCenter'],
                  onChange: handleTableChange,
                  onShowSizeChange: handleTableChange
                }}
                style={{
                  '.ant-table-thead > tr > th': {
                    background: '#f8f9fa',
                    color: '#666',
                    fontWeight: '600',
                  },
                  '.ant-table-tbody > tr:hover > td': {
                    background: '#f0f7ff',
                  },
                }}
              />
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default TicketAnalytics; 














