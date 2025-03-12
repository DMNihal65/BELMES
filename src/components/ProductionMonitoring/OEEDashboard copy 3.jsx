import React, { useEffect, useState, useRef } from 'react';
import { 
  Card, Row, Col, Progress, Statistic, Space, DatePicker, 
  Select, Empty, Spin, Alert, Tabs, Table, Badge, Tooltip,
  Button, Divider, Modal, Tag, Radio, Input
} from 'antd';
import { Line, Pie, Column, Gauge } from '@ant-design/plots';
import useProductionStore from '../../stores/productionStore';
import { 
  Activity, TrendingUp, BarChart2, Clock, 
  AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Filter, Calendar, Search, ChevronRight, Maximize2,
  PieChart, BarChart, ArrowUp, ArrowDown,
  Wrench
} from 'lucide-react';
import dayjs from 'dayjs';
import { InfoCircleOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search: SearchInput } = Input;




// Create a custom ring progress component
const CustomRingProgress = ({ percent, color, title, value }) => {
  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <Progress 
        type="circle" 
        percent={percent * 100} 
        width={80}
        strokeColor={color}
        format={() => ''}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs text-gray-500">{title}</div>
        <div className="text-base font-semibold" style={{ color }}>{value}</div>
      </div>
    </div>
  );
};

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
  const [trendModalVisible, setTrendModalVisible] = useState(false);
  const [selectedMachineForTrend, setSelectedMachineForTrend] = useState(null);
  const [shiftSummaryFilter, setShiftSummaryFilter] = useState({
    search: '',
    sortBy: 'oee',
    sortDirection: 'desc',
    dateFilter: 'all'
  });
  const [allMachinesOEE, setAllMachinesOEE] = useState([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [selectedMachineData, setSelectedMachineData] = useState(null);
  
  // Refs to prevent chart re-renders
  const oeeChartRef = useRef(null);
  const lossChartRef = useRef(null);
  const comparisonChartRef = useRef(null);
  
  // Initialize data on component mount
  useEffect(() => {
    fetchShiftSummary();
    fetchAllMachinesOEE();
  }, []);
  
  // Fetch OEE data for all machines
  const fetchAllMachinesOEE = async () => {
    setIsLoadingMachines(true);
    try {
      const [startDate, endDate] = oeeData.dateRange;
      const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
      const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');
      
      // Get all machine IDs
      const machineIds = machines.map(m => m.machine_id);
      
      // Fetch data for each machine
      const promises = machineIds.map(id => 
        axios.get(`http://172.18.7.89:4470/production_monitoring/machine-oee-analysis/${id}?start_date=${formattedStartDate}&end_date=${formattedEndDate}`)
      );
      
      const results = await Promise.allSettled(promises);
      const machineData = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.data);
      
      setAllMachinesOEE(machineData);
    } catch (error) {
      console.error('Error fetching all machines OEE:', error);
    } finally {
      setIsLoadingMachines(false);
    }
  };
  
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
    let count = 0;
    
    oeeData.shiftSummary.forEach(shift => {
      if (shift.loss_analysis) {
        totalAvailabilityLoss += shift.loss_analysis.availability_loss || 0;
        totalPerformanceLoss += shift.loss_analysis.performance_loss || 0;
        totalQualityLoss += shift.loss_analysis.quality_loss || 0;
        count++;
      }
    });
    
    if (count === 0) return [];
    
    return [
      { type: 'Availability Loss', value: totalAvailabilityLoss / count },
      { type: 'Performance Loss', value: totalPerformanceLoss / count },
      { type: 'Quality Loss', value: totalQualityLoss / count }
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
        Quality: count ? (totalQuality / count) : 0,
        machineId: shifts[0].machine_id
      };
    });
    
    // Convert to format needed for Column chart
    const chartData = [];
    result.forEach(item => {
      chartData.push({ machine: item.machine, type: 'OEE', value: item.OEE, machineId: item.machineId });
      chartData.push({ machine: item.machine, type: 'Availability', value: item.Availability, machineId: item.machineId });
      chartData.push({ machine: item.machine, type: 'Performance', value: item.Performance, machineId: item.machineId });
      chartData.push({ machine: item.machine, type: 'Quality', value: item.Quality, machineId: item.machineId });
    });
    
    return chartData;
  };
  
  // Prepare shift summary table data
  const prepareShiftSummaryTableData = () => {
    if (!oeeData.shiftSummary || oeeData.shiftSummary.length === 0) {
      return [];
    }
    
    let data = oeeData.shiftSummary.map((shift, index) => ({
      key: index,
      date: shift.date,
      shift: shift.shift,
      machine: shift.machine_name,
      machineId: shift.machine_id,
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
    
    // Apply search filter
    if (shiftSummaryFilter.search) {
      const searchTerm = shiftSummaryFilter.search.toLowerCase();
      data = data.filter(item => 
        item.machine.toLowerCase().includes(searchTerm) ||
        item.date.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply date filter
    if (shiftSummaryFilter.dateFilter !== 'all') {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      const thisWeekStart = dayjs().startOf('week').format('YYYY-MM-DD');
      
      if (shiftSummaryFilter.dateFilter === 'today') {
        data = data.filter(item => item.date === today);
      } else if (shiftSummaryFilter.dateFilter === 'yesterday') {
        data = data.filter(item => item.date === yesterday);
      } else if (shiftSummaryFilter.dateFilter === 'thisWeek') {
        data = data.filter(item => dayjs(item.date).isAfter(thisWeekStart) || dayjs(item.date).isSame(thisWeekStart));
      }
    }
    
    // Apply sorting
    const { sortBy, sortDirection } = shiftSummaryFilter;
    data = data.sort((a, b) => {
      const factor = sortDirection === 'asc' ? 1 : -1;
      return (a[sortBy] - b[sortBy]) * factor;
    });
    
    return data;
  };



  // Improved circular progress component
const EnhancedRingProgress = ({ percent, color, title, value }) => {
  const strokeWidth = 5;
  const size = 72;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - percent * circumference;
  
  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-gray-500 mt-0.5">{title}</span>
      </div>
    </div>
  );
};

// Machine Analysis TabPane Component
const getStatusBadge = (value) => {
    if (value >= 85) {
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check size={12} className="mr-1" />
          Excellent
        </div>
      );
    } else if (value >= 60) {
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle size={12} className="mr-1" />
          Average
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle size={12} className="mr-1" />
          Poor
        </div>
      );
    }
  };

  
  // Render machine card
  const renderMachineCard = (machine) => {
    if (!machine) return null;
    
    const oeeColor = 
      machine.average_oee >= 85 ? '#52c41a' : 
      machine.average_oee >= 60 ? '#faad14' : '#ff4d4f';
      
    return (
      <Card 
        key={machine.machine_id}
        className="h-full shadow-sm hover:shadow-md transition-shadow border-t-4"
        style={{ borderTopColor: oeeColor }}
        bodyStyle={{ padding: '16px' }}
        actions={[
          <Button 
            type="primary" 
            icon={<BarChart2 size={16} />}
            onClick={() => showTrendModal(machine)}
            size="small"
          >
            View Trends
          </Button>
        ]}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold">{machine.machine_name}</div>
            <div className="text-xs text-gray-500">ID: {machine.machine_id}</div>
          </div>
          <div className="text-center">
            <Gauge 
              percent={machine.average_oee / 100}
              height={80}
              width={80}
              range={{
                color: oeeColor,
              }}
              indicator={{
                pointer: {
                  style: {
                    stroke: oeeColor,
                  },
                },
                pin: {
                  style: {
                    stroke: oeeColor,
                  },
                },
              }}
              statistic={{
                title: {
                  style: {
                    fontSize: '12px',
                    color: '#4B535E',
                  },
                  formatter: () => 'OEE',
                },
                content: {
                  style: {
                    fontSize: '16px',
                    color: oeeColor,
                    fontWeight: 'bold',
                  },
                  formatter: () => `${machine.average_oee.toFixed(1)}%`,
                },
              }}
            />
          </div>
        </div>
        
        <Row gutter={[8, 8]} className="mb-3">
          <Col span={8}>
            <Card size="small" className="text-center h-full bg-blue-50">
              <Statistic
                title="Availability"
                value={machine.average_availability}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="text-center h-full bg-orange-50">
              <Statistic
                title="Performance"
                value={machine.average_performance}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#faad14', fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="text-center h-full bg-purple-50">
              <Statistic
                title="Quality"
                value={machine.average_quality}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#722ed1', fontSize: '16px' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Divider className="my-2">Loss Analysis</Divider>
        
        <Row gutter={[8, 8]}>
          <Col span={8}>
            <div className="text-center">
              <div className="text-xs text-gray-500">Availability Loss</div>
              <div className="text-sm font-semibold text-red-500">
                {(machine.losses?.availability_loss || 0).toFixed(1)}%
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-xs text-gray-500">Performance Loss</div>
              <div className="text-sm font-semibold text-orange-500">
                {(machine.losses?.performance_loss || 0).toFixed(1)}%
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-xs text-gray-500">Quality Loss</div>
              <div className="text-sm font-semibold text-purple-500">
                {(machine.losses?.quality_loss || 0).toFixed(1)}%
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };
  
  // Render shift summary card
  const renderShiftSummaryCard = (shift) => {
    const oeeColor = 
      shift.oee >= 85 ? '#52c41a' : 
      shift.oee >= 60 ? '#faad14' : '#ff4d4f';
      
    return (
      <Card 
        key={shift.key}
        className="shadow-sm hover:shadow-md transition-shadow border-t-4"
        style={{ borderTopColor: oeeColor }}
        bodyStyle={{ padding: '16px' }}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-base font-semibold">{shift.machine}</div>
            <div className="text-xs text-gray-500">
              Date: {shift.date} | Shift: {shift.shift}
            </div>
          </div>
          <Tag color={oeeColor}>
            OEE: {shift.oee.toFixed(1)}%
          </Tag>
        </div>
        
        <Row gutter={[8, 8]} className="mb-3">
          <Col span={8}>
            <Card size="small" className="text-center h-full bg-blue-50">
              <Statistic
                title="Availability"
                value={shift.availability}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="text-center h-full bg-orange-50">
              <Statistic
                title="Performance"
                value={shift.performance}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#faad14', fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="text-center h-full bg-purple-50">
              <Statistic
                title="Quality"
                value={shift.quality}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#722ed1', fontSize: '16px' }}
              />
            </Card>
          </Col>
        </Row>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500">Production Time</div>
            <div className="text-sm">{shift.productionTime}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Good Parts</div>
            <div className="text-sm text-green-600">{shift.goodParts}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Bad Parts</div>
            <div className="text-sm text-red-500">{shift.badParts}</div>
          </div>
        </div>
      </Card>
    );
  };
  
  // Show trend modal
  const showTrendModal = (machine) => {
    setSelectedMachineData(machine);
    setTrendModalVisible(true);
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setOEEDateRange(dates);
      fetchAllMachinesOEE();
    }
  };
  
  // Handle machine selection change
  const handleMachineChange = (value) => {
    setOEESelectedMachine(value);
    if (value) {
      fetchMachineOEEAnalysis(value);
    }
  };
  
  // Handle shift selection change
  const handleShiftChange = (value) => {
    setOEESelectedShift(value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchShiftSummary();
    fetchAllMachinesOEE();
  };
  
  // Calculate metrics
  const overallMetrics = calculateOverallMetrics();
  const oeeChartData = prepareOEETrendData();
  const lossAnalysisData = prepareLossAnalysisData();
  const machineComparisonData = prepareMachineComparisonData();
  const shiftSummaryData = prepareShiftSummaryTableData();
  
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
    color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'],
    legend: {
      position: 'top'
    },
    smooth: true,
    animation: false,
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: datum.value.toFixed(1) + '%' };
      }
    }
  };
  
  const pieConfig = {
    data: lossAnalysisData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.64,
    color: ['#ff4d4f', '#faad14', '#722ed1'],
    label: {
      type: 'outer',
      formatter: (datum) => `${datum.type}: ${datum.value.toFixed(1)}%`
    },
    statistic: {
      title: {
        formatter: () => 'OEE',
        style: {
          fontSize: '14px'
        }
      },
      content: {
        formatter: () => `${overallMetrics.oee.toFixed(1)}%`,
        style: {
          fontSize: '20px',
          color: overallMetrics.oee >= 85 ? '#52c41a' : 
                 overallMetrics.oee >= 60 ? '#faad14' : '#ff4d4f'
        }
      }
    },
    interactions: [
      { type: 'element-active' }
    ],
    animation: false
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
    color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'],
    label: false,
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: datum.value.toFixed(1) + '%' };
      }
    },
    interactions: [
      { type: 'element-active' }
    ],
    animation: false,
    height: 400
  };
  
  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      width: 80,
      render: (value) => value || 'All'
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
      title: 'Parts',
      children: [
        {
          title: 'Total',
          dataIndex: 'totalParts',
          key: 'totalParts',
          width: 80
        },
        {
          title: 'Good',
          dataIndex: 'goodParts',
          key: 'goodParts',
          width: 80,
          render: (value) => (
            <span className="text-green-600">{value}</span>
          )
        },
        {
          title: 'Bad',
          dataIndex: 'badParts',
          key: 'badParts',
          width: 80,
          render: (value) => (
            <span className="text-red-500">{value}</span>
          )
        }
      ]
    },
    {
      title: 'OEE Metrics',
      children: [
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
          width: 150,
          sorter: (a, b) => a.availability - b.availability
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
          width: 150,
          sorter: (a, b) => a.performance - b.performance
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
          width: 150,
          sorter: (a, b) => a.quality - b.quality
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
          sorter: (a, b) => a.oee - b.oee,
          defaultSortOrder: 'descend'
        }
      ]
    }
  ];
  
  return (
    <div className="p-4 space-y-4">
      {/* Header with filters */}
      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold m-0">OEE Dashboard</h1>
            <Tooltip title="Overall Equipment Effectiveness">
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Space>
              <span className="text-gray-500">Date Range:</span>
              <RangePicker 
                value={oeeData.dateRange}
                onChange={handleDateRangeChange}
                allowClear={false}
              />
            </Space>
            
            <Space>
              <span className="text-gray-500">Shift:</span>
              <Select
                placeholder="Select shift"
                style={{ width: 120 }}
                value={oeeData.selectedShift}
                onChange={handleShiftChange}
                allowClear
              >
                <Option value={1}>Shift 1</Option>
                <Option value={2}>Shift 2</Option>
                <Option value={3}>Shift 3</Option>
              </Select>
            </Space>
            
            <Button 
              icon={<RefreshCw size={16} />} 
              onClick={handleRefresh}
              loading={oeeData.isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      
      {oeeData.isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow-sm">
          <Spin size="large" />
        </div>
      ) : oeeData.error ? (
        <Alert
          message="Error"
          description={oeeData.error}
          type="error"
          showIcon
        />
      ) : (
        <>
          {/* OEE Overview Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-500 mb-1">Overall OEE</div>
                    <div className="text-2xl font-bold" style={{ 
                      color: overallMetrics.oee >= 85 ? '#52c41a' : 
                             overallMetrics.oee >= 60 ? '#faad14' : '#ff4d4f' 
                    }}>
                      {overallMetrics.oee.toFixed(1)}%
                    </div>
                  </div>
                  <CustomRingProgress
                    percent={overallMetrics.oee / 100}
                    color={
                      overallMetrics.oee >= 85 ? '#52c41a' : 
                      overallMetrics.oee >= 60 ? '#faad14' : '#ff4d4f'
                    }
                    title="OEE"
                    value={`${overallMetrics.oee.toFixed(1)}%`}
                  />
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">World Class OEE: 85%</div>
                  <Progress 
                    percent={overallMetrics.oee} 
                    strokeColor={{
                      '0%': '#ff4d4f',
                      '60%': '#faad14',
                      '85%': '#52c41a',
                    }}
                    size="small"
                    showInfo={false}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-500 mb-1">Availability</div>
                    <div className="text-2xl font-bold" style={{ color: '#1890ff' }}>
                      {overallMetrics.availability.toFixed(1)}%
                    </div>
                  </div>
                  <CustomRingProgress
                    percent={overallMetrics.availability / 100}
                    color="#1890ff"
                    title="Availability"
                    value={`${overallMetrics.availability.toFixed(1)}%`}
                  />
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Planned vs. Actual Uptime</div>
                  <Progress 
                    percent={overallMetrics.availability} 
                    strokeColor="#1890ff"
                    size="small"
                  />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-500 mb-1">Performance</div>
                    <div className="text-2xl font-bold" style={{ color: '#faad14' }}>
                      {overallMetrics.performance.toFixed(1)}%
                    </div>
                  </div>
                  <CustomRingProgress
                    percent={overallMetrics.performance / 100}
                    color="#faad14"
                    title="Performance"
                    value={`${overallMetrics.performance.toFixed(1)}%`}
                  />
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Actual vs. Ideal Cycle Time</div>
                  <Progress 
                    percent={overallMetrics.performance} 
                    strokeColor="#faad14"
                    size="small"
                  />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-500 mb-1">Quality</div>
                    <div className="text-2xl font-bold" style={{ color: '#722ed1' }}>
                      {overallMetrics.quality.toFixed(1)}%
                    </div>
                  </div>
                  <CustomRingProgress
                    percent={overallMetrics.quality / 100}
                    color="#722ed1"
                    title="Quality"
                    value={`${overallMetrics.quality.toFixed(1)}%`}
                  />
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Good Parts vs. Total Parts</div>
                  <Progress 
                    percent={overallMetrics.quality} 
                    strokeColor="#722ed1"
                    size="small"
                  />
                </div>
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
                      <div ref={oeeChartRef}>
                        <Line {...lineConfig} />
                      </div>
                    ) : (
                      <Empty description="No trend data available" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="OEE Loss Analysis" className="shadow-sm">
                    {lossAnalysisData.length > 0 ? (
                      <div ref={lossChartRef}>
                        <Pie {...pieConfig} />
                      </div>
                    ) : (
                      <Empty description="No loss analysis data available" />
                    )}
                  </Card>
                </Col>
              </Row>
              
              {/* Machine Comparison */}
              <Card title="Machine Comparison" className="shadow-sm mt-4">
                {machineComparisonData.length > 0 ? (
                  <div ref={comparisonChartRef}>
                    <Column {...columnConfig} />
                  </div>
                ) : (
                  <Empty description="No machine comparison data available" />
                )}
              </Card>
            </TabPane>
            
            <TabPane tab="Shift Summary" key="2">
              <Card className="shadow-sm">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <SearchInput
                      placeholder="Search by machine or date"
                      style={{ width: 250 }}
                      value={shiftSummaryFilter.search}
                      onChange={e => setShiftSummaryFilter({
                        ...shiftSummaryFilter,
                        search: e.target.value
                      })}
                      allowClear
                    />
                    
                    <Select
                      placeholder="Sort by"
                      style={{ width: 150 }}
                      value={shiftSummaryFilter.sortBy}
                      onChange={value => setShiftSummaryFilter({
                        ...shiftSummaryFilter,
                        sortBy: value
                      })}
                    >
                      <Option value="date">Date</Option>
                      <Option value="machine">Machine</Option>
                      <Option value="oee">OEE</Option>
                      <Option value="availability">Availability</Option>
                      <Option value="performance">Performance</Option>
                      <Option value="quality">Quality</Option>
                    </Select>
                    
                    <Select
                      style={{ width: 120 }}
                      value={shiftSummaryFilter.sortDirection}
                      onChange={value => setShiftSummaryFilter({
                        ...shiftSummaryFilter,
                        sortDirection: value
                      })}
                    >
                      <Option value="asc">
                        <Space>
                          <ArrowUp size={14} />
                          Ascending
                        </Space>
                      </Option>
                      <Option value="desc">
                        <Space>
                          <ArrowDown size={14} />
                          Descending
                        </Space>
                      </Option>
                    </Select>
                  </div>
                  
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => {/* Export functionality */}}
                  >
                    Export
                  </Button>
                </div>
                
                {shiftSummaryData.length > 0 ? (
                  <Table 
                    columns={columns} 
                    dataSource={shiftSummaryData} 
                    scroll={{ x: 1300 }}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                  />
                ) : (
                  <Empty description="No shift summary data available" />
                )}
              </Card>
            </TabPane>


          

            
            <TabPane 
      tab={
        <span className="flex items-center">
          <Wrench size={16} className="mr-2" />
          Machine Analysis
        </span>
      } 
      key="3"
      className="p-1"
    >
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center">
          <Activity size={18} className="text-blue-500 mr-3" />
          <Select
            placeholder="Select a machine"
            style={{ width: 300 }}
            onChange={handleMachineChange}
            value={oeeData.selectedMachine}
            allowClear
            className="min-w-[250px]"
            dropdownStyle={{ borderRadius: '8px' }}
          >
            {machines.map(machine => (
              <Select.Option key={machine.machine_id} value={machine.machine_id}>
                {machine.machine_name}
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <Button
          icon={<RefreshCw size={16} />}
          onClick={() => fetchAllMachinesOEE()}
          loading={isLoadingMachines}
          className="flex items-center hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700"
        >
          Refresh Data
        </Button>
      </div>
      
      {isLoadingMachines ? (
        <div className="flex flex-col justify-center items-center h-64 bg-white rounded-lg shadow-sm">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Loading machine data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allMachinesOEE.map(machine => (
            <Card 
              key={machine.machine_id}
              className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden border-0"
              bodyStyle={{ padding: '20px' }}
              actions={[
                <Button 
                  type="text" 
                  icon={<BarChart2 size={16} />}
                  onClick={() => showTrendModal(machine.machine_id)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors flex items-center justify-center py-3"
                >
                  View Trends
                </Button>
              ]}
            >
              {/* Header with status badge */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold mb-1">{machine.machine_name}</h3>
                    <div className="ml-2">
                      {getStatusBadge(machine.average_oee)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">ID: {machine.machine_id}</div>
                </div>
                <EnhancedRingProgress
                  percent={machine.average_oee / 100}
                  color={
                    machine.average_oee >= 85 ? '#10b981' : 
                    machine.average_oee >= 60 ? '#f59e0b' : '#ef4444'
                  }
                  title="OEE"
                  value={`${machine.average_oee.toFixed(1)}%`}
                />
              </div>
              
              {/* APQ Metrics with improved visualization */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 transition-colors duration-150 hover:bg-blue-100">
                  <div className="text-base font-semibold text-blue-600">
                    {machine.average_availability.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Availability</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-yellow-50 transition-colors duration-150 hover:bg-yellow-100">
                  <div className="text-base font-semibold text-yellow-600">
                    {machine.average_performance.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Performance</div>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-purple-50 transition-colors duration-150 hover:bg-purple-100">
                  <div className="text-base font-semibold text-purple-600">
                    {machine.average_quality.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Quality</div>
                </div>
              </div>
              
              <Divider className="my-3">
                <span className="text-xs font-medium text-gray-500">LOSS ANALYSIS</span>
              </Divider>
              
              {/* Loss Analysis with bar visualization */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-700">Availability Loss</span>
                    <span className="text-xs font-semibold text-red-600">
                      {machine.losses?.availability_loss.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${machine.losses?.availability_loss}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-700">Performance Loss</span>
                    <span className="text-xs font-semibold text-orange-600">
                      {machine.losses?.performance_loss.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${machine.losses?.performance_loss}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-700">Quality Loss</span>
                    <span className="text-xs font-semibold text-pink-600">
                      {machine.losses?.quality_loss.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full"
                      style={{ width: `${machine.losses?.quality_loss}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
            </TabPane>
          </Tabs>
          
          {/* Trend Modal */}
          <Modal
        title={
          <div className="flex items-center py-1">
            <BarChart2 size={20} className="mr-2 text-blue-600" />
            <span className="text-lg font-medium">{`OEE Trends - ${selectedMachineData?.machine_name || 'Machine'}`}</span>
          </div>
        }
        open={trendModalVisible}
        onCancel={() => setTrendModalVisible(false)}
        width={900}
        centered
        bodyStyle={{ padding: '24px' }}
        footer={[
          <Button 
            key="close" 
            onClick={() => setTrendModalVisible(false)}
            className="px-5"
          >
            Close
          </Button>
        ]}
        className="trend-modal"
      >
        {selectedMachineData?.oee_trends && selectedMachineData.oee_trends.length > 0 ? (
          <div className="p-2">
            <div className="flex justify-end mb-4">
              <div className="inline-flex rounded-md shadow-sm">
                <Button className="rounded-l-lg border-r-0" type="default">Day</Button>
                <Button className="rounded-none border-r-0" type="primary">Week</Button>
                <Button className="rounded-r-lg" type="default">Month</Button>
              </div>
            </div>
            <Line 
              data={selectedMachineData.oee_trends.flatMap(trend => [
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
              color={['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']}
              legend={{
                position: 'top',
                itemName: {
                  style: {
                    fontSize: 12
                  }
                }
              }}
              height={500}
              animation={{
                appear: {
                  animation: 'path-in',
                  duration: 1000
                }
              }}
              smooth
              point={{
                size: 5,
                shape: 'circle',
                style: {
                  stroke: '#fff',
                  lineWidth: 2,
                }
              }}
              tooltip={{
                crosshairs: {
                  type: 'x',
                  line: {
                    style: {
                      stroke: '#ddd',
                      lineWidth: 1,
                      lineDash: [5, 5]
                    }
                  }
                },
                domStyles: {
                  'g2-tooltip': {
                    backgroundColor: '#fff',
                    boxShadow: '0 0 12px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '6px'
                  }
                }
              }}
            />
          </div>
        ) : (
          <Empty 
            description={
              <span className="text-gray-500">No trend data available for this machine</span>
            } 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-12"
          />
        )}
      </Modal>
        </>
      )}
    </div>
  );
};

export default OEEDashboard;