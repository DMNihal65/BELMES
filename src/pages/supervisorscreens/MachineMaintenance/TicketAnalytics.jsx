import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Modal, Alert, Table, Button, Input, Space } from 'antd';
import { ReloadOutlined, SearchOutlined, ClockCircleOutlined, WarningOutlined, ToolOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import useMachineMaintenanceStore from '../../../store/maintenance';
import failureData from '../../../assets/failure.json'; // Adjust the import path as necessary

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
    filters: [
      // { text: 'Select All', value: 'all' },
      ...Array.from(new Set(tableData.map(item => item.machine))).map(machine => ({
        text: machine,
        value: machine,
      })),
    ],
    onFilter: (value, record) => {
      if (value === 'all') {
        // When 'Select All' is chosen, show all machines
        return true;
      }
      // When a specific machine is selected, filter by that machine
      return record.machine === value;
    },
    filterMode: 'menu',
    filterMultiple: true,
  },
  {
    title: 'No of Failures',
    dataIndex: 'failures',
    key: 'failures',
    sorter: (a, b) => a.failures - b.failures,
    filters: [
      // { text: 'Select All', value: 'all' },
      ...Array.from(new Set(tableData.map(item => item.failures))).map(failures => ({
        text: failures.toString(),
        value: failures,
      })),
    ],
    onFilter: (value, record) => {
      if (value === 'all') return true;
      return record.failures === value;
    },
  },
  {
    title: 'MTTR (hours)',
    dataIndex: 'mttr',
    key: 'mttr',
    sorter: (a, b) => a.mttr - b.mttr,
    filterSearch: true,
    filters: [
      // { text: 'Select All', value: 'all' },
      ...Array.from(new Set(tableData.map(item => item.mttr))).map(mttr => ({
        text: mttr.toFixed(2),
        value: mttr,
      })),
    ],
    onFilter: (value, record) => {
      if (value === 'all') return true;
      return record.mttr === value;
    },
    render: (text) => text.toFixed(2)
  },
  {
    title: 'MTBF (hours)',
    dataIndex: 'mtbf',
    key: 'mtbf',
    sorter: (a, b) => a.mtbf - b.mtbf,
    filterSearch: true,
    filters: [
      // { text: 'Select All', value: 'all' },
      ...Array.from(new Set(tableData.map(item => item.mtbf))).map(mtbf => ({
        text: mtbf.toFixed(2),
        value: mtbf,
      })),
    ],
    onFilter: (value, record) => {
      if (value === 'all') return true;
      return record.mtbf === value;
    },
    render: (text) => text.toFixed(2)
  }
];


  const cardStyle = {
    // background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    // border: '1px solid #d9d9d9',
  };

  const statisticStyle = {
    // We will apply these styles directly using Tailwind CSS classes in the JSX
    // '.ant-statistic-title': {
    //   color: '#8c8c8c',
    //   fontSize: '16px',
    //   marginBottom: '8px',
    // },
    // '.ant-statistic-content': {
    //   color: '#1890ff',
    //   fontSize: '28px',
    //   fontWeight: '700',
    // },
  };

  return (
    <div className="p-4">
      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
  <Col span={8}>
    <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
      <Card 
        className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-50 to-blue-100 hover:scale-[1.02] overflow-hidden"
        bodyStyle={{ padding: '20px', position: 'relative' }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
          <ToolOutlined className="text-7xl text-blue-600" />
        </div>
        <Statistic 
          title={<span className="text-blue-800 font-medium text-base flex items-center gap-2">
            <ToolOutlined className="text-blue-600" /> Mean Time To Repair (MTTR)
          </span>} 
          value={mttr} 
          valueStyle={{ color: '#1e3a8a', fontWeight: 700, fontSize: '28px' }}
          suffix={<span className="text-xs text-blue-400 ml-1">hours</span>}
        />
      </Card>
    </div>
  </Col>
  <Col span={8}>
    <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
      <Card 
        className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-teal-50 to-teal-100 hover:scale-[1.02] overflow-hidden"
        bodyStyle={{ padding: '20px', position: 'relative' }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
          <ClockCircleOutlined className="text-7xl text-teal-600" />
        </div>
        <Statistic 
          title={<span className="text-teal-800 font-medium text-base flex items-center gap-2">
            <ClockCircleOutlined className="text-teal-600" /> Mean Time Between Failures (MTBF)
          </span>} 
          value={mtbf} 
          valueStyle={{ color: '#065f46', fontWeight: 700, fontSize: '28px' }}
          suffix={<span className="text-xs text-teal-400 ml-1">hours</span>}
        />
      </Card>
    </div>
  </Col>
  <Col span={8}>
    <div className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
      <Card 
        className="rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-rose-50 to-rose-100 hover:scale-[1.02] overflow-hidden"
        bodyStyle={{ padding: '20px', position: 'relative' }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rotate-12 transform translate-x-8 -translate-y-8">
          <WarningOutlined className="text-7xl text-rose-600" />
        </div>
        <Statistic 
          title={<span className="text-rose-800 font-medium text-base flex items-center gap-2">
            <WarningOutlined className="text-rose-600" /> Total Failures
          </span>} 
          value={totalFailures} 
          valueStyle={{ color: '#b91c1c', fontWeight: 700, fontSize: '28px' }}
          suffix={<span className="text-xs text-rose-400 ml-1">failures</span>}
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
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-t-xl">
                  <div className="flex items-center">
                    <div className="w-2 h-8 bg-amber-600 rounded mr-3"></div>
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
                // rowSelection={rowSelection}
                dataSource={getFilteredData()}
                columns={columns}
                // pagination={{
                //   ...pagination,
                //   showSizeChanger: true,
                //   showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                //   pageSizeOptions: ['5', '10', '20', '50'],
                //   showQuickJumper: true,
                //   position: ['bottomCenter'],
                //   onChange: handleTableChange,
                //   onShowSizeChange: handleTableChange
                // }}
                style={{
                  '.ant-table-thead > tr > th': {
                    background: '#f0f2f5',
                    color: '#595959',
                    fontWeight: '600',
                  },
                  '.ant-table-tbody > tr:hover > td': {
                    background: '#e6f7ff',
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













