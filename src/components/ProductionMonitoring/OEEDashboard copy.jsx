import React, { useEffect, useState } from 'react';
import { 
  Card, Row, Col, Progress, Statistic, Space, DatePicker, 
  Select, Empty, Spin, Alert, Tabs, Table, Badge, Tooltip,
  Button, Divider
} from 'antd';
import { Line, Pie, Column } from '@ant-design/plots';
import useProductionStore from '../../stores/productionStore';
import { 
  Activity, TrendingUp, BarChart2, Clock, 
  AlertTriangle, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const OEEDashboard = () => {
  const { 
    machines, 
    oeeData,
    fetchShiftSummary,
    fetchMachineOEEAnalysis,
    setOEEDateRange,
    setOEESelectedMachine,
    setOEESelectedShift
  } = useProductionStore();
  
  const [activeTab, setActiveTab] = useState('1');
  
  // Initialize data on component mount
  useEffect(() => {
    fetchShiftSummary();
  }, []);
  
  // Calculate overall OEE metrics from shift summary data
  const calculateOverallMetrics = () => {
    if (!oeeData.shiftSummary || oeeData.shiftSummary.length === 0) {
      return {
        oee: 0,
        availability: 0,
        performance: 0,
        quality: 0
      };
    }
    
    let totalOEE = 0;
    let totalAvailability = 0;
    let totalPerformance = 0;
    let totalQuality = 0;
    let count = 0;
    
    oeeData.shiftSummary.forEach(shift => {
      if (shift.oee_metrics) {
        totalOEE += shift.oee_metrics.oee || 0;
        totalAvailability += shift.oee_metrics.availability || 0;
        totalPerformance += shift.oee_metrics.performance || 0;
        totalQuality += shift.oee_metrics.quality || 0;
        count++;
      }
    });
    
    return {
      oee: count ? (totalOEE / count) : 0,
      availability: count ? (totalAvailability / count) : 0,
      performance: count ? (totalPerformance / count) : 0,
      quality: count ? (totalQuality / count) : 0
    };
  };
  
  // Prepare data for OEE trend chart
  const prepareOEETrendData = () => {
    if (!oeeData.shiftSummary || oeeData.shiftSummary.length === 0) {
      return [];
    }
    
    // Group by date
    const groupedByDate = oeeData.shiftSummary.reduce((acc, shift) => {
      const date = shift.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(shift);
      return acc;
    }, {});
    
    // Calculate average for each date
    const result = Object.entries(groupedByDate).map(([date, shifts]) => {
      let totalOEE = 0;
      let totalAvailability = 0;
      let totalPerformance = 0;
      let totalQuality = 0;
      let count = 0;
      
      shifts.forEach(shift => {
        if (shift.oee_metrics) {
          totalOEE += shift.oee_metrics.oee || 0;
          totalAvailability += shift.oee_metrics.availability || 0;
          totalPerformance += shift.oee_metrics.performance || 0;
          totalQuality += shift.oee_metrics.quality || 0;
          count++;
        }
      });
      
      return {
        date,
        OEE: count ? (totalOEE / count) : 0,
        Availability: count ? (totalAvailability / count) : 0,
        Performance: count ? (totalPerformance / count) : 0,
        Quality: count ? (totalQuality / count) : 0
      };
    }).sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
    
    // Convert to format needed for Line chart
    const chartData = [];
    result.forEach(item => {
      chartData.push({ date: item.date, type: 'OEE', value: item.OEE });
      chartData.push({ date: item.date, type: 'Availability', value: item.Availability });
      chartData.push({ date: item.date, type: 'Performance', value: item.Performance });
      chartData.push({ date: item.date, type: 'Quality', value: item.Quality });
    });
    
    return chartData;
  };
  
  // Prepare data for loss analysis pie chart
  const prepareLossAnalysisData = () => {
    if (!oeeData.shiftSummary || oeeData.shiftSummary.length === 0) {
      return [];
    }
    
    let totalAvailabilityLoss = 0;
    let totalPerformanceLoss = 0;
    let totalQualityLoss = 0;
    let totalEffectiveProduction = 0;
    let count = 0;
    
    oeeData.shiftSummary.forEach(shift => {
      if (shift.loss_analysis && shift.oee_metrics) {
        totalAvailabilityLoss += shift.loss_analysis.availability_loss || 0;
        totalPerformanceLoss += shift.loss_analysis.performance_loss || 0;
        totalQualityLoss += shift.loss_analysis.quality_loss || 0;
        totalEffectiveProduction += shift.oee_metrics.oee || 0;
        count++;
      }
    });
    
    if (count === 0) return [];
    
    return [
      { type: 'Availability Loss', value: totalAvailabilityLoss / count },
      { type: 'Performance Loss', value: totalPerformanceLoss / count },
      { type: 'Quality Loss', value: totalQualityLoss / count },
      { type: 'Effective Production', value: totalEffectiveProduction / count }
    ];
  };
  
  // Prepare data for machine comparison chart
  const prepareMachineComparisonData = () => {
    if (!oeeData.shiftSummary || oeeData.shiftSummary.length === 0) {
      return [];
    }
    
    // Group by machine
    const groupedByMachine = oeeData.shiftSummary.reduce((acc, shift) => {
      const machineName = shift.machine_name;
      if (!acc[machineName]) {
        acc[machineName] = [];
      }
      acc[machineName].push(shift);
      return acc;
    }, {});
    
    // Calculate average for each machine
    const result = Object.entries(groupedByMachine).map(([machineName, shifts]) => {
      let totalOEE = 0;
      let totalAvailability = 0;
      let totalPerformance = 0;
      let totalQuality = 0;
      let count = 0;
      
      shifts.forEach(shift => {
        if (shift.oee_metrics) {
          totalOEE += shift.oee_metrics.oee || 0;
          totalAvailability += shift.oee_metrics.availability || 0;
          totalPerformance += shift.oee_metrics.performance || 0;
          totalQuality += shift.oee_metrics.quality || 0;
          count++;
        }
      });
      
      return {
        machine: machineName,
        OEE: count ? (totalOEE / count) : 0,
        Availability: count ? (totalAvailability / count) : 0,
        Performance: count ? (totalPerformance / count) : 0,
        Quality: count ? (totalQuality / count) : 0
      };
    });
    
    // Convert to format needed for Column chart
    const chartData = [];
    result.forEach(item => {
      chartData.push({ machine: item.machine, type: 'OEE', value: item.OEE });
      chartData.push({ machine: item.machine, type: 'Availability', value: item.Availability });
      chartData.push({ machine: item.machine, type: 'Performance', value: item.Performance });
      chartData.push({ machine: item.machine, type: 'Quality', value: item.Quality });
    });
    
    return chartData;
  };
  
  // Prepare shift summary table data
  const prepareShiftSummaryTableData = () => {
    if (!oeeData.shiftSummary || oeeData.shiftSummary.length === 0) {
      return [];
    }
    
    return oeeData.shiftSummary.map((shift, index) => ({
      key: index,
      date: shift.date,
      shift: shift.shift,
      machine: shift.machine_name,
      productionTime: shift.production_time,
      idleTime: shift.idle_time,
      offTime: shift.off_time,
      totalParts: shift.total_parts,
      goodParts: shift.good_parts,
      badParts: shift.bad_parts,
      availability: shift.oee_metrics?.availability || 0,
      performance: shift.oee_metrics?.performance || 0,
      quality: shift.oee_metrics?.quality || 0,
      oee: shift.oee_metrics?.oee || 0
    }));
  };
  
  // Get machine analysis data
  const getMachineAnalysisData = () => {
    return oeeData.machineAnalysis || null;
  };
  
  // Calculate metrics
  const overallMetrics = calculateOverallMetrics();
  const oeeChartData = prepareOEETrendData();
  const lossAnalysisData = prepareLossAnalysisData();
  const machineComparisonData = prepareMachineComparisonData();
  const shiftSummaryData = prepareShiftSummaryTableData();
  const machineAnalysis = getMachineAnalysisData();
  
  // Handle refresh
  const handleRefresh = () => {
    fetchShiftSummary();
    if (oeeData.selectedMachine) {
      fetchMachineOEEAnalysis(oeeData.selectedMachine);
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (range) => {
    if (range) {
      setOEEDateRange(range);
    }
  };
  
  // Handle machine selection
  const handleMachineChange = (value) => {
    setOEESelectedMachine(value === 'all' ? null : value);
  };
  
  // Handle shift selection
  const handleShiftChange = (value) => {
    setOEESelectedShift(value === 'all' ? null : value);
  };
  
  // Chart configurations
  const lineConfig = {
    data: oeeChartData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    yAxis: {
      min: 0,
      max: 100,
      title: {
        text: 'Percentage (%)'
      }
    },
    xAxis: {
      title: {
        text: 'Date'
      }
    },
    legend: {
      position: 'top'
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'],
    point: {
      size: 5,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#1890ff',
        lineWidth: 2
      }
    }
  };
  
  const pieConfig = {
    data: lossAnalysisData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    interactions: [{ type: 'element-active' }],
    color: ['#ff4d4f', '#faad14', '#722ed1', '#52c41a'],
    legend: {
      layout: 'horizontal',
      position: 'bottom'
    }
  };
  
  const columnConfig = {
    data: machineComparisonData,
    isGroup: true,
    xField: 'machine',
    yField: 'value',
    seriesField: 'type',
    yAxis: {
      min: 0,
      max: 100,
      title: {
        text: 'Percentage (%)'
      }
    },
    xAxis: {
      title: {
        text: 'Machine'
      }
    },
    legend: {
      position: 'top'
    },
    color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'],
    label: {
      position: 'middle',
      layout: [
        { type: 'interval-adjust-position' },
        { type: 'interval-hide-overlap' },
        { type: 'adjust-color' }
      ],
      style: {
        fill: '#fff',
        fontSize: 12
      },
      formatter: (datum) => {
        return datum.value.toFixed(1) + '%';
      }
    }
  };
  
  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).diff(dayjs(b.date)),
      width: 120
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      width: 80
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      width: 150
    },
    {
      title: 'Production Time',
      dataIndex: 'productionTime',
      key: 'productionTime',
      width: 150
    },
    {
      title: 'Idle Time',
      dataIndex: 'idleTime',
      key: 'idleTime',
      width: 120
    },
    {
      title: 'Off Time',
      dataIndex: 'offTime',
      key: 'offTime',
      width: 120
    },
    {
      title: 'Total Parts',
      dataIndex: 'totalParts',
      key: 'totalParts',
      width: 120
    },
    {
      title: 'Good Parts',
      dataIndex: 'goodParts',
      key: 'goodParts',
      width: 120
    },
    {
      title: 'Bad Parts',
      dataIndex: 'badParts',
      key: 'badParts',
      width: 120
    },
    {
      title: 'Availability',
      dataIndex: 'availability',
      key: 'availability',
      render: (value) => (
        <Tooltip title={`${value.toFixed(1)}%`}>
          <Progress 
            percent={value} 
            size="small" 
            strokeColor="#1890ff"
            format={(percent) => `${percent.toFixed(1)}%`}
          />
        </Tooltip>
      ),
      width: 150
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (value) => (
        <Tooltip title={`${value.toFixed(1)}%`}>
          <Progress 
            percent={value} 
            size="small" 
            strokeColor="#faad14"
            format={(percent) => `${percent.toFixed(1)}%`}
          />
        </Tooltip>
      ),
      width: 150
    },
    {
      title: 'Quality',
      dataIndex: 'quality',
      key: 'quality',
      render: (value) => (
        <Tooltip title={`${value.toFixed(1)}%`}>
          <Progress 
            percent={value} 
            size="small" 
            strokeColor="#722ed1"
            format={(percent) => `${percent.toFixed(1)}%`}
          />
        </Tooltip>
      ),
      width: 150
    },
    {
      title: 'OEE',
      dataIndex: 'oee',
      key: 'oee',
      render: (value) => (
        <Tooltip title={`${value.toFixed(1)}%`}>
          <Progress 
            percent={value} 
            size="small" 
            strokeColor={
              value >= 85 ? '#52c41a' : 
              value >= 60 ? '#faad14' : '#ff4d4f'
            }
            format={(percent) => `${percent.toFixed(1)}%`}
          />
        </Tooltip>
      ),
      width: 150,
      sorter: (a, b) => a.oee - b.oee
    }
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <Card className="shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              placeholder="Select Machine"
              style={{ width: 200 }}
              value={oeeData.selectedMachine || 'all'}
              onChange={handleMachineChange}
            >
              <Option value="all">All Machines</Option>
              {machines.map(m => (
                <Option key={m.machine_id} value={m.machine_id}>
                  {m.machine_name}
                </Option>
              ))}
            </Select>
            
            <Select
              placeholder="Select Shift"
              style={{ width: 150 }}
              value={oeeData.selectedShift || 'all'}
              onChange={handleShiftChange}
            >
              <Option value="all">All Shifts</Option>
              <Option value="1">Shift 1</Option>
              <Option value="2">Shift 2</Option>
              <Option value="3">Shift 3</Option>
            </Select>
            
            <RangePicker
              value={oeeData.dateRange}
              onChange={handleDateRangeChange}
              className="w-80"
            />
          </div>
          
          <Button 
            type="primary" 
            icon={<RefreshCw size={16} />} 
            onClick={handleRefresh}
            loading={oeeData.isLoading}
          >
            Refresh
          </Button>
        </div>
      </Card>
      
      {oeeData.error && (
        <Alert
          message="Error"
          description={oeeData.error}
          type="error"
          showIcon
          closable
        />
      )}
      
      {oeeData.isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Overall OEE Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="dashboard-stat-card shadow-sm">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-blue-500" />
                      <span>Overall OEE</span>
                    </div>
                  }
                  value={overallMetrics.oee}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: overallMetrics.oee >= 85 ? '#3f8600' : 
                           overallMetrics.oee >= 60 ? '#faad14' : '#cf1322' 
                  }}
                />
                <Progress 
                  percent={overallMetrics.oee} 
                  status={overallMetrics.oee >= 85 ? 'success' : 'normal'}
                  strokeColor={
                    overallMetrics.oee >= 85 ? '#3f8600' : 
                    overallMetrics.oee >= 60 ? '#faad14' : '#cf1322'
                  }
                  className="mt-2"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="dashboard-stat-card shadow-sm">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-green-500" />
                      <span>Availability</span>
                    </div>
                  }
                  value={overallMetrics.availability}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress 
                  percent={overallMetrics.availability}
                  strokeColor="#1890ff"
                  className="mt-2"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="dashboard-stat-card shadow-sm">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-yellow-500" />
                      <span>Performance</span>
                    </div>
                  }
                  value={overallMetrics.performance}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#faad14' }}
                />
                <Progress 
                  percent={overallMetrics.performance}
                  strokeColor="#faad14"
                  className="mt-2"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="dashboard-stat-card shadow-sm">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-purple-500" />
                      <span>Quality</span>
                    </div>
                  }
                  value={overallMetrics.quality}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#722ed1' }}
                />
                <Progress 
                  percent={overallMetrics.quality}
                  strokeColor="#722ed1"
                  className="mt-2"
                />
              </Card>
            </Col>
          </Row>
          
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="OEE Overview" key="1">
              {/* Charts */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card title="OEE Trend" className="shadow-sm">
                    {oeeChartData.length > 0 ? (
                      <Line {...lineConfig} />
                    ) : (
                      <Empty description="No trend data available" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="OEE Loss Analysis" className="shadow-sm">
                    {lossAnalysisData.length > 0 ? (
                      <Pie {...pieConfig} />
                    ) : (
                      <Empty description="No loss analysis data available" />
                    )}
                  </Card>
                </Col>
              </Row>
              
              {/* Machine Comparison */}
              <Card title="Machine Comparison" className="shadow-sm mt-4">
                {machineComparisonData.length > 0 ? (
                  <Column {...columnConfig} />
                ) : (
                  <Empty description="No machine comparison data available" />
                )}
              </Card>
            </TabPane>
            
            <TabPane tab="Shift Summary" key="2">
              <Card className="shadow-sm">
                {shiftSummaryData.length > 0 ? (
                  <Table 
                    columns={columns} 
                    dataSource={shiftSummaryData} 
                    scroll={{ x: 1300 }}
                    pagination={{ pageSize: 10 }}
                  />
                ) : (
                  <Empty description="No shift summary data available" />
                )}
              </Card>
            </TabPane>
            
            <TabPane tab="Machine Analysis" key="3">
              {machineAnalysis ? (
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold">{machineAnalysis.machine_name}</h2>
                      <p className="text-gray-500">Machine ID: {machineAnalysis.machine_id}</p>
                    </div>
                    
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Average OEE"
                          value={machineAnalysis.average_oee}
                          precision={1}
                          suffix="%"
                          valueStyle={{ 
                            color: machineAnalysis.average_oee >= 85 ? '#3f8600' : 
                                  machineAnalysis.average_oee >= 60 ? '#faad14' : '#cf1322' 
                          }}
                        />
                        <Progress 
                          percent={machineAnalysis.average_oee} 
                          status={machineAnalysis.average_oee >= 85 ? 'success' : 'normal'}
                          strokeColor={
                            machineAnalysis.average_oee >= 85 ? '#3f8600' : 
                            machineAnalysis.average_oee >= 60 ? '#faad14' : '#cf1322'
                          }
                          className="mt-2"
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Average Availability"
                          value={machineAnalysis.average_availability}
                          precision={1}
                          suffix="%"
                          valueStyle={{ color: '#1890ff' }}
                        />
                        <Progress 
                          percent={machineAnalysis.average_availability}
                          strokeColor="#1890ff"
                          className="mt-2"
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Average Performance"
                          value={machineAnalysis.average_performance}
                          precision={1}
                          suffix="%"
                          valueStyle={{ color: '#faad14' }}
                        />
                        <Progress 
                          percent={machineAnalysis.average_performance}
                          strokeColor="#faad14"
                          className="mt-2"
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Average Quality"
                          value={machineAnalysis.average_quality}
                          precision={1}
                          suffix="%"
                          valueStyle={{ color: '#722ed1' }}
                        />
                        <Progress 
                          percent={machineAnalysis.average_quality}
                          strokeColor="#722ed1"
                          className="mt-2"
                        />
                      </Col>
                    </Row>
                    
                    <Divider>Loss Analysis</Divider>
                    
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Card className="text-center">
                          <Statistic
                            title="Availability Loss"
                            value={machineAnalysis.losses?.availability_loss || 0}
                            precision={1}
                            suffix="%"
                            valueStyle={{ color: '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card className="text-center">
                          <Statistic
                            title="Performance Loss"
                            value={machineAnalysis.losses?.performance_loss || 0}
                            precision={1}
                            suffix="%"
                            valueStyle={{ color: '#faad14' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card className="text-center">
                          <Statistic
                            title="Quality Loss"
                            value={machineAnalysis.losses?.quality_loss || 0}
                            precision={1}
                            suffix="%"
                            valueStyle={{ color: '#722ed1' }}
                          />
                        </Card>
                      </Col>
                    </Row>
                    
                    <Divider>OEE Trends</Divider>
                    
                    {machineAnalysis.oee_trends && machineAnalysis.oee_trends.length > 0 ? (
                      <Line 
                        data={machineAnalysis.oee_trends.flatMap(trend => [
                          { date: trend.date, type: 'OEE', value: trend.oee },
                          { date: trend.date, type: 'Availability', value: trend.availability },
                          { date: trend.date, type: 'Performance', value: trend.performance },
                          { date: trend.date, type: 'Quality', value: trend.quality }
                        ])}
                        xField="date"
                        yField="value"
                        seriesField="type"
                        yAxis={{
                          min: 0,
                          max: 100,
                          title: {
                            text: 'Percentage (%)'
                          }
                        }}
                        color={['#1890ff', '#52c41a', '#faad14', '#722ed1']}
                        legend={{
                          position: 'top'
                        }}
                      />
                    ) : (
                      <Empty description="No trend data available" />
                    )}
                  </Card>
                </div>
              ) : (
                <Card className="shadow-sm">
                  <div className="text-center py-8">
                    <Empty 
                      description={
                        <div>
                          <p className="text-lg mb-4">Select a machine to view detailed analysis</p>
                          <Select
                            placeholder="Select a machine"
                            style={{ width: 300 }}
                            onChange={setOEESelectedMachine}
                          >
                            {machines.map(machine => (
                              <Option key={machine.machine_id} value={machine.machine_id}>
                                {machine.machine_name}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      }
                    />
                  </div>
                </Card>
              )}
            </TabPane>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default OEEDashboard;