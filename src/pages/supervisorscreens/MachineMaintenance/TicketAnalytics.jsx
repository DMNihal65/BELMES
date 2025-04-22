import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Modal, Alert, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import useMachineMaintenanceStore from '../../../store/maintenance';

const TicketAnalytics = () => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [mttr, setMttr] = useState(0);
  const [mtbf, setMtbf] = useState(0);
  const [totalFailures, setTotalFailures] = useState(0);
  const [tableData, setTableData] = useState([]);
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

  return (
    <div className="p-4">
      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
      <Col span={8}>
        <div className="shadow-lg rounded-xl">
          <Card title="Mean Time To Repair (MTTR)" >
            <Statistic title="Shop Average MTTR" value={mttr} suffix="hours" />
          </Card>
        </div>
      </Col>
      <Col span={8}>
        <div className="shadow-lg rounded-xl">
          <Card title="Mean Time Between Failures (MTBF)">
            <Statistic title="Shop Average MTBF" value={mtbf} suffix="hours" />
          </Card>
        </div>
      </Col>
      <Col span={8}>
        <div className="shadow-lg rounded-xl">
          <Card title="Total Failures">
            <Statistic title="Total Failures" value={totalFailures} />
          </Card>
        </div>
      </Col>
    </Row>

      
      {/* MTBF-MTTR Line Chart */}
      <Row className="mt-4">
        <Col span={24}>
          <div className="shadow-lg rounded-xl">
            <Card>
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
          <div className="shadow-lg rounded-xl">
            <Card title="Machine Performance Metrics">
              <Table
                dataSource={tableData}
                columns={[
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
                ]}
                pagination={false}
              />
            </Card>
          </div>
        </Col>
      </Row>

    </div>
  );
};

export default TicketAnalytics; 














