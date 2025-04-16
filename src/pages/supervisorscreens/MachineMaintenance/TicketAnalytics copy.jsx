import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Modal, Alert } from 'antd';
import ReactECharts from 'echarts-for-react';

const TicketAnalytics = () => {
  const [isModalVisible, setIsModalVisible] = useState(true);

  useEffect(() => {
    setIsModalVisible(true);
  }, []);

  const handleOk = () => {
    setIsModalVisible(false);
  };

  // Data for MTBF-MTTR line chart
  const monthlyData = {
    dates: ['Jan 23', 'Feb 23', 'Mar 23', 'Apr 23', 'May 23', 'Jun 23', 
            'Jul 23', 'Aug 23', 'Sep 23', 'Oct 23', 'Nov 23', 'Dec 23'],
    mtbf: [200, 250, 220, 230, 240, 235, 400, 450, 4026, 350, 280, 150],
    mttr: [150, 180, 160, 170, 165, 175, 200, 350, 654, 200, 190, 140]
  };

  // Data for downtime categories bar chart
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
----------------------------------------
Your organization aims for:
• Asset MTBF greater than 200h
• Asset MTTR less than 35h`;
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

  const barChartOption = {
    title: {
      text: 'Machine Downtime by Category',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let tooltip = `${params[0].axisValue}\n`;
        tooltip += '----------------------------------------\n';
        
        // Add each category's value on a new line
        params.forEach(param => {
          if (param.value > 0) { // Only show categories with values
            tooltip += `${param.seriesName}: ${param.value}h\n`;
          }
        });
        
        // Calculate and add total
        const total = params.reduce((sum, param) => sum + (param.value || 0), 0);
        tooltip += '----------------------------------------\n';
        tooltip += `Total Downtime: ${total.toFixed(1)}h`;
        
        return tooltip;
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
      data: downtimeData.categories,
      top: 60,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '25%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: downtimeData.machines,
      name: 'Machines',
      nameLocation: 'middle',
      nameGap: 45,
      axisLabel: {
        rotate: 0,
        fontSize: 12,
        interval: 0
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: 'Duration (hours)',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        fontSize: 12
      }
    },
    series: downtimeData.categories.map((category, index) => ({
      name: category,
      type: 'bar',
      stack: 'total',
      emphasis: {
        focus: 'series'
      },
      barWidth: '60%',
      data: downtimeData.values.map(machine => machine[index])
    }))
  };

  return (
    <div className="p-4">
      <Alert
        message="Coming Soon"
        description="This feature is currently under development and will be available soon."
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />
      <Modal
        title="Coming Soon"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleOk}
        centered
      >
        <p>This feature is currently under development and will be available soon.</p>
      </Modal>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Mean Time To Repair (MTTR)">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Average MTTR" value="2.5" suffix="hours" />
              </Col>
              <Col span={12}>
                <Statistic title="MTTR This Month" value="1.8" suffix="hours" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Mean Time Between Failures (MTBF)">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Average MTBF" value="168" suffix="hours" />
              </Col>
              <Col span={12}>
                <Statistic title="MTBF This Month" value="192" suffix="hours" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

    {/* Downtime Bar Chart */}
    <Row className="mt-4">
        <Col span={24}>
          <Card>
            <ReactECharts 
              option={barChartOption} 
              style={{ height: '500px' }}
            />
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