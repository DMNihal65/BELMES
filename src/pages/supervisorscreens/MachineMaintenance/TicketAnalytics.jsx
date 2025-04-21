import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Modal, Alert } from 'antd';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';

const TicketAnalytics = () => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [mttr, setMttr] = useState(0);
  const [mtbf, setMtbf] = useState(0);
  const [totalFailures, setTotalFailures] = useState(0);
  const [monthlyData, setMonthlyData] = useState({
    dates: [],
    mtbf: [],
    mttr: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://172.18.7.85:8078/api/v1/maintainance/metrics/machine-performance');
        const data = response.data;

        // Update MTTR, MTBF, and total failures with rounded values
        setMttr(Math.round(data.mttr_shop));
        setMtbf(Math.round(data.mtbf_shop));
        setTotalFailures(data.total_failures); // Assuming total_failures is an integer

        // Assuming you want to keep the monthly data structure
        setMonthlyData({
          dates: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          mtbf: Array(12).fill(Math.round(data.mtbf_shop)), // Round off for monthly data
          mttr: Array(12).fill(Math.round(data.mttr_shop))  // Round off for monthly data
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleOk = () => {
    setIsModalVisible(false);
  };

  // Data for MTBF-MTTR line chart
  const downtimeData = {
    machines: ['Machine A', 'Machine B', 'Machine C', 'Machine D'],
    categories: ['Mechanical', 'Electrical', 'Others', 'Operational'],
    values: [
      [4.2, 2.8, 1.5, 3.0],
      [3.5, 4.0, 2.0, 1.8],
      [2.8, 3.2, 2.5, 2.0],
      [5.0, 2.5, 1.8, 2.2],
    ]
  };

  const lineChartOption = {
    title: {
      text: 'MTBF, MTTR',
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
${params[0].axisValue}
----------------------------------------
${params[0].seriesName}: ${params[0].value}h
${params[1].seriesName}: ${params[1].value}h
`;
      },
      textStyle: {
        fontSize: 14
      },
      padding: [10, 15],
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      extraCssText: 'white-space: pre-line; line-height: 1.5'
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
      data: monthlyData.dates,
      boundaryGap: false,
      axisLabel: {
        fontSize: 12
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
        data: monthlyData.mtbf,
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
        data: monthlyData.mttr,
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
          <Card title="Mean Time To Repair (MTTR)">
            <Statistic title="Average MTTR" value={mttr} suffix="hours" />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Mean Time Between Failures (MTBF)">
            <Statistic title="Average MTBF" value={mtbf} suffix="hours" />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Total Failures">
            <Statistic title="Total Failures" value={totalFailures} />
          </Card>
        </Col>
      </Row>
      
      {/* MTBF-MTTR Line Chart */}
      <Row className="mt-4">
        <Col span={24}>
          <Card>
            <ReactECharts 
              option={lineChartOption} 
              style={{ height: '400px' }}
            />
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default TicketAnalytics; 