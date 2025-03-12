import React, { useEffect, useState } from 'react';
import { 
  Card, Row, Col, Progress, Statistic, Space, DatePicker, 
  Select, Empty, Spin, Alert, Tabs, Table, Badge, Tooltip,
  Button, Divider, Modal, Tag, Radio, Segmented, Input
} from 'antd';
import { Line, Pie, Column, Gauge } from '@ant-design/plots';
import useProductionStore from '../../stores/productionStore';
import { 
  Activity, TrendingUp, BarChart2, Clock, 
  AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Filter, Calendar, Search, ChevronRight, Maximize2,
  PieChart, BarChart, List, Grid, ArrowUp, ArrowDown
} from 'lucide-react';
import dayjs from 'dayjs';
import { InfoCircleOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search: SearchInput } = Input;

// Create a custom ring progress component since RingProgress is not available
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
  const [shiftSummaryView, setShiftSummaryView] = useState('table');
  const [shiftSummaryFilter, setShiftSummaryFilter] = useState({
    search: '',
    sortBy: 'oee',
    sortDirection: 'desc',
    dateFilter: 'all'
  });
  const [machineCardView, setMachineCardView] = useState('grid');
  
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
      { type: 'Availability Loss', value: totalAvailabilityLoss / count, color: '#ff4d4f' },
      { type: 'Performance Loss', value: totalPerformanceLoss / count, color: '#faad14' },
      { type: 'Quality Loss', value: totalQualityLoss / count, color: '#722ed1' },
      { type: 'Effective Production', value: totalEffectiveProduction / count, color: '#52c41a' }
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
  
  // Get machine analysis data
  const getMachineAnalysisData = () => {
    return oeeData.machineAnalysis || null;
  };
  
  // Get all machines OEE data
  const getAllMachinesOEEData = () => {
    // Group shift summary by machine
    if (!oeeData.shiftSummary || oeeData.shiftSummary.length === 0) {
      return [];
    }
    
    const groupedByMachine = oeeData.shiftSummary.reduce((acc, shift) => {
      const machineId = shift.machine_id;
      if (!acc[machineId]) {
        acc[machineId] = {
          machine_id: shift.machine_id,
          machine_name: shift.machine_name,
          shifts: []
        };
      }
      acc[machineId].shifts.push(shift);
      return acc;
    }, {});
    
    return Object.values(groupedByMachine).map(machine => {
      // Calculate averages
      let totalOEE = 0;
      let totalAvailability = 0;
      let totalPerformance = 0;
      let totalQuality = 0;
      let totalParts = 0;
      let totalGoodParts = 0;
      let totalBadParts = 0;
      let count = 0;
      
      machine.shifts.forEach(shift => {
        if (shift.oee_metrics) {
          totalOEE += shift.oee_metrics.oee || 0;
          totalAvailability += shift.oee_metrics.availability || 0;
          totalPerformance += shift.oee_metrics.performance || 0;
          totalQuality += shift.oee_metrics.quality || 0;
          totalParts += shift.total_parts || 0;
          totalGoodParts += shift.good_parts || 0;
          totalBadParts += shift.bad_parts || 0;
          count++;
        }
      });
      
      return {
        ...machine,
        average_oee: count ? (totalOEE / count) : 0,
        average_availability: count ? (totalAvailability / count) : 0,
        average_performance: count ? (totalPerformance / count) : 0,
        average_quality: count ? (totalQuality / count) : 0,
        total_parts: totalParts,
        good_parts: totalGoodParts,
        bad_parts: totalBadParts,
        shifts_count: count
      };
    });
  };
  
  // Calculate metrics
  const overallMetrics = calculateOverallMetrics();
  const oeeChartData = prepareOEETrendData();
  const lossAnalysisData = prepareLossAnalysisData();
  const machineComparisonData = prepareMachineComparisonData();
  const shiftSummaryData = prepareShiftSummaryTableData();
  const machineAnalysis = getMachineAnalysisData();
  const allMachinesOEE = getAllMachinesOEEData();
  
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
  
  // Handle showing trend modal
  const showTrendModal = (machineId) => {
    setSelectedMachineForTrend(machineId);
    fetchMachineOEEAnalysis(machineId);
    setTrendModalVisible(true);
  };
  
  // Handle shift summary search
  const handleShiftSummarySearch = (value) => {
    setShiftSummaryFilter({
      ...shiftSummaryFilter,
      search: value
    });
  };
  
  // Handle shift summary sort
  const handleShiftSummarySort = (field) => {
    setShiftSummaryFilter(prev => {
      if (prev.sortBy === field) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          ...prev,
          sortBy: field,
          sortDirection: 'desc'
        };
      }
    });
  };
  
  // Handle shift summary date filter
  const handleShiftSummaryDateFilter = (value) => {
    setShiftSummaryFilter({
      ...shiftSummaryFilter,
      dateFilter: value
    });
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
    color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'],
    legend: {
      position: 'top'
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000
      }
    },
    point: {
      size: 5,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#5B8FF9',
        lineWidth: 2
      }
    },
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
    color: ({ type }) => {
      const item = lossAnalysisData.find(d => d.type === type);
      return item ? item.color : '#d9d9d9';
    },
    label: {
      type: 'outer',
      formatter: (datum) => `${datum.type}: ${datum.value.toFixed(1)}%`
    },
    statistic: {
      title: {
        formatter: () => 'Loss Analysis',
        style: {
          fontSize: '14px'
        }
      },
      content: {
        formatter: () => '',
        style: {
          fontSize: '20px'
        }
      }
    },
    legend: {
      layout: 'vertical',
      position: 'right'
    },
    interactions: [
      { type: 'element-active' }
    ]
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
    label: {
      position: 'middle',
      layout: [
        { type: 'interval-adjust-position' },
        { type: 'interval-hide-overlap' },
        { type: 'adjust-color' }
      ],
      formatter: (datum) => `${datum.value.toFixed(0)}%`
    },
    legend: {
      position: 'top'
    },
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: datum.value.toFixed(1) + '%' };
      }
    },
    interactions: [
      { type: 'element-highlight-by-color' },
      { 
        type: 'element-active',
        cfg: {
          start: [{ trigger: 'element:click', action: (evt) => {
            const { data } = evt.event.target.get('origin');
            if (data && data.machineId) {
              showTrendModal(data.machineId);
            }
          }}]
        }
      }
    ]
  };
  
  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => a.date.localeCompare(b.date)
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      width: 80,
      render: (shift) => `Shift ${shift}`,
      sorter: (a, b) => a.shift - b.shift
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      width: 150,
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => showTrendModal(record.machineId)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
      sorter: (a, b) => a.machine.localeCompare(b.machine)
    },
    {
      title: 'Production Time',
      dataIndex: 'productionTime',
      key: 'productionTime',
      width: 140
    },
    {
      title: 'Parts',
      children: [
        {
          title: 'Total',
          dataIndex: 'totalParts',
          key: 'totalParts',
          width: 80,
          sorter: (a, b) => a.totalParts - b.totalParts
        },
        {
          title: 'Good',
          dataIndex: 'goodParts',
          key: 'goodParts',
          width: 80,
          sorter: (a, b) => a.goodParts - b.goodParts
        },
        {
          title: 'Bad',
          dataIndex: 'badParts',
          key: 'badParts',
          width: 80,
          render: (value) => (
            <span style={{ color: value > 0 ? '#ff4d4f' : 'inherit' }}>
              {value}
            </span>
          ),
          sorter: (a, b) => a.badParts - b.badParts
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
          sorter: (a, b) => a.oee - b.oee
        }
      ]
    }
  ];
  
  // Render machine card
  const renderMachineCard = (machine) => {
    const oeeColor = 
      machine.average_oee >= 85 ? '#52c41a' : 
      machine.average_oee >= 60 ? '#faad14' : '#ff4d4f';
      
    return (
      <Card 
        key={machine.machine_id}
        className="h-full shadow-sm hover:shadow-md transition-shadow"
        bodyStyle={{ padding: '16px' }}
        actions={[
          <Button 
            type="text" 
            icon={<BarChart2 size={16} />}
            onClick={() => showTrendModal(machine.machine_id)}
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
          <CustomRingProgress
            percent={machine.average_oee / 100}
            color={oeeColor}
            title="OEE"
            value={`${machine.average_oee.toFixed(1)}%`}
          />
        </div>
        
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Availability</span>
              <span>{machine.average_availability.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={machine.average_availability} 
              size="small" 
              strokeColor="#1890ff"
              showInfo={false}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Performance</span>
              <span>{machine.average_performance.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={machine.average_performance} 
              size="small" 
              strokeColor="#faad14"
              showInfo={false}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Quality</span>
              <span>{machine.average_quality.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={machine.average_quality} 
              size="small" 
              strokeColor="#722ed1"
              showInfo={false}
            />
          </div>
        </div>
        
        <Divider className="my-3" />
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500">Total Parts</div>
            <div className="text-base font-semibold">{machine.total_parts}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Good Parts</div>
            <div className="text-base font-semibold text-green-600">{machine.good_parts}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Bad Parts</div>
            <div className="text-base font-semibold text-red-500">{machine.bad_parts}</div>
          </div>
        </div>
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
        className="shadow-sm hover:shadow-md transition-shadow"
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
        
        <div className="space-y-2 mb-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Availability</span>
              <span>{shift.availability.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={shift.availability} 
              size="small" 
              strokeColor="#1890ff"
              showInfo={false}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Performance</span>
              <span>{shift.performance.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={shift.performance} 
              size="small" 
              strokeColor="#faad14"
              showInfo={false}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Quality</span>
              <span>{shift.quality.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={shift.quality} 
              size="small" 
              strokeColor="#722ed1"
              showInfo={false}
            />
          </div>
        </div>
        
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
  
  return (
    <div className="p-4">
      {oeeData.isLoading && !oeeData.shiftSummary.length ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : oeeData.error ? (
        <Alert
          message="Error"
          description={oeeData.error}
          type="error"
          showIcon
          className="mb-4"
        />
      ) : (
        <>
          {/* Controls */}
          <Card className="mb-4 shadow-sm">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex flex-wrap gap-4 items-center">
                <RangePicker 
                  value={oeeData.dateRange}
                  onChange={handleDateRangeChange}
                  allowClear={false}
                />
                
                <Select
                  placeholder="Select Machine"
                  style={{ width: 200 }}
                  value={oeeData.selectedMachine}
                  onChange={handleMachineChange}
                  allowClear
                >
                  <Option value={null}>All Machines</Option>
                  {machines.map(machine => (
                    <Option key={machine.machine_id} value={machine.machine_id}>
                      {machine.machine_name}
                    </Option>
                  ))}
                </Select>
                
                <Select
                  placeholder="Select Shift"
                  style={{ width: 150 }}
                  value={oeeData.selectedShift}
                  onChange={handleShiftChange}
                  allowClear
                >
                  <Option value={null}>All Shifts</Option>
                  <Option value={1}>Shift 1</Option>
                  <Option value={2}>Shift 2</Option>
                  <Option value={3}>Shift 3</Option>
                </Select>
              </div>
              
              <Button 
                type="primary"
                icon={<RefreshCw size={16} />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </Card>
          
          {/* OEE Metrics */}
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="dashboard-stat-card shadow-sm">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-green-500" />
                      <span>Overall OEE</span>
                    </div>
                  }
                  value={overallMetrics.oee}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: overallMetrics.oee >= 85 ? '#52c41a' : 
                           overallMetrics.oee >= 60 ? '#faad14' : '#ff4d4f' 
                  }}
                />
                <Progress 
                  percent={overallMetrics.oee}
                  strokeColor={
                    overallMetrics.oee >= 85 ? '#52c41a' : 
                    overallMetrics.oee >= 60 ? '#faad14' : '#ff4d4f'
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
                      <Clock size={16} className="text-blue-500" />
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
                  <Card 
                    title={
                      <div className="flex items-center justify-between">
                        <span>OEE Trend</span>
                        <Tooltip title="Download CSV">
                          <Button 
                            type="text" 
                            icon={<DownloadOutlined />} 
                            size="small"
                          />
                        </Tooltip>
                      </div>
                    } 
                    className="shadow-sm"
                  >
                    {oeeChartData.length > 0 ? (
                      <Line {...lineConfig} />
                    ) : (
                      <Empty description="No trend data available" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card 
                    title={
                      <div className="flex items-center justify-between">
                        <span>OEE Loss Analysis</span>
                        <Tooltip title="Learn about OEE losses">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </div>
                    } 
                    className="shadow-sm"
                  >
                    {lossAnalysisData.length > 0 ? (
                      <Pie {...pieConfig} />
                    ) : (
                      <Empty description="No loss analysis data available" />
                    )}
                  </Card>
                </Col>
              </Row>
              
              {/* Machine Comparison */}
              <Card 
                title={
                  <div className="flex items-center justify-between">
                    <span>Machine Comparison</span>
                    <div className="text-xs text-gray-500">Click on bars to view detailed machine analysis</div>
                  </div>
                } 
                className="shadow-sm mt-4"
              >
                {machineComparisonData.length > 0 ? (
                  <Column {...columnConfig} />
                ) : (
                  <Empty description="No machine comparison data available" />
                )}
              </Card>
            </TabPane>
            
            <TabPane tab="Shift Summary" key="2">
              <Card className="shadow-sm">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <SearchInput
                      placeholder="Search by machine or date"
                      style={{ width: 250 }}
                      value={shiftSummaryFilter.search}
                      onChange={e => setShiftSummaryFilter({...shiftSummaryFilter, search: e.target.value})}
                      allowClear
                    />
                    
                    <Select
                      placeholder="Date Filter"
                      style={{ width: 150 }}
                      value={shiftSummaryFilter.dateFilter}
                      onChange={value => setShiftSummaryFilter({...shiftSummaryFilter, dateFilter: value})}
                    >
                      <Option value="all">All Dates</Option>
                      <Option value="today">Today</Option>
                      <Option value="yesterday">Yesterday</Option>
                      <Option value="thisWeek">This Week</Option>
                    </Select>
                    
                    <Select
                      placeholder="Sort By"
                      style={{ width: 150 }}
                      value={shiftSummaryFilter.sortBy}
                      onChange={value => setShiftSummaryFilter({...shiftSummaryFilter, sortBy: value})}
                    >
                      <Option value="oee">OEE</Option>
                      <Option value="availability">Availability</Option>
                      <Option value="performance">Performance</Option>
                      <Option value="quality">Quality</Option>
                      <Option value="totalParts">Total Parts</Option>
                    </Select>
                    
                    <Button
                      type="text"
                      icon={shiftSummaryFilter.sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      onClick={() => setShiftSummaryFilter({
                        ...shiftSummaryFilter, 
                        sortDirection: shiftSummaryFilter.sortDirection === 'asc' ? 'desc' : 'asc'
                      })}
                    />
                  </div>
                  
                  <Segmented
                    options={[
                      {
                        value: 'table',
                        icon: <List size={16} />
                      },
                      {
                        value: 'cards',
                        icon: <Grid size={16} />
                      }
                    ]}
                    value={shiftSummaryView}
                    onChange={setShiftSummaryView}
                  />
                </div>
                
                {shiftSummaryData.length > 0 ? (
                  shiftSummaryView === 'table' ? (
                    <Table 
                      columns={columns} 
                      dataSource={shiftSummaryData} 
                      scroll={{ x: 1300 }}
                      pagination={{ pageSize: 10 }}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shiftSummaryData.map(shift => renderShiftSummaryCard(shift))}
                    </div>
                  )
                ) : (
                  <Empty description="No shift summary data available" />
                )}
              </Card>
            </TabPane>
            
            <TabPane tab="Machine Analysis" key="3">
              <div className="mb-4">
                <Card className="shadow-sm">
                  <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex flex-wrap gap-4 items-center">
                      <Select
                        placeholder="Select Machine"
                        style={{ width: 250 }}
                        value={oeeData.selectedMachine}
                        onChange={handleMachineChange}
                      >
                        <Option value={null}>All Machines</Option>
                        {machines.map(machine => (
                          <Option key={machine.machine_id} value={machine.machine_id}>
                            {machine.machine_name}
                          </Option>
                        ))}
                      </Select>
                      
                      <div className="text-sm text-gray-500">
                        {oeeData.selectedMachine ? 
                          "Showing detailed analysis for selected machine" : 
                          "Showing overview for all machines"}
                      </div>
                    </div>
                    
                    <Segmented
                      options={[
                        {
                          value: 'grid',
                          icon: <Grid size={16} />
                        },
                        {
                          value: 'list',
                          icon: <List size={16} />
                        }
                      ]}
                      value={machineCardView}
                      onChange={setMachineCardView}
                    />
                  </div>
                </Card>
              </div>
              
              {oeeData.selectedMachine ? (
                machineAnalysis ? (
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
                      
                      <Button 
                        type="primary" 
                        icon={<Maximize2 size={16} />}
                        onClick={() => setTrendModalVisible(true)}
                        className="mb-4"
                      >
                        View Full Trend Chart
                      </Button>
                      
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
                  <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allMachinesOEE.map(machine => renderMachineCard(machine))}
                </div>
              )}
            </TabPane>
          </Tabs>
          
          {/* Trend Modal */}
          <Modal
            title={`OEE Trends - ${machineAnalysis?.machine_name || 'Machine'}`}
            open={trendModalVisible}
            onCancel={() => setTrendModalVisible(false)}
            width={900}
            footer={[
              <Button key="close" onClick={() => setTrendModalVisible(false)}>
                Close
              </Button>
            ]}
          >
            {machineAnalysis?.oee_trends && machineAnalysis.oee_trends.length > 0 ? (
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
                height={500}
              />
            ) : (
              <Empty description="No trend data available" />
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default OEEDashboard;