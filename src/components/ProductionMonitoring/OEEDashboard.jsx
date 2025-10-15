import React, { useEffect, useState } from 'react';
import { 
  Card, Row, Col, Progress, Space, DatePicker, 
  Select, Empty, Spin, Alert, Tabs, Table, Tag, Tooltip,
  Button, Divider, Modal, Input, Statistic
} from 'antd';
import { Line, Pie, Column } from '@ant-design/plots';
import useProductionStore from '../../store/productionStore';
import { 
  Activity, BarChart2, 
  AlertTriangle, RefreshCw,
  ArrowUp, ArrowDown, Wrench,
  Percent, Award, Clock, 
  CheckCircle, XCircle, Target,
  TrendingUp, PieChart, BarChart
} from 'lucide-react';
import dayjs from 'dayjs';
import { InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

// const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search: SearchInput } = Input;

// Status badge component
const getStatusBadge = (oee) => {
  if (oee >= 85) {
    return <Tag color="success" className="rounded-full px-2 py-0.5 text-xs">Excellent</Tag>;
  } else if (oee >= 60) {
    return <Tag color="warning" className="rounded-full px-2 py-0.5 text-xs">Average</Tag>;
  } else {
    return <Tag color="error" className="rounded-full px-2 py-0.5 text-xs">Poor</Tag>;
  }
};

const OEEDashboard = () => {
  const { 
    machines, 
    oeeData,
    fetchShiftSummary,
    setOEEDateRange,
    setOEESelectedMachine,
    setOEESelectedShift
  } = useProductionStore();
  
  const [activeTab, setActiveTab] = useState('3');
  const [trendModalVisible, setTrendModalVisible] = useState(false);
  const [trendModalLoading, setTrendModalLoading] = useState(false);
  const [selectedMachineForTrend, setSelectedMachineForTrend] = useState(null);
  const [shiftSummaryFilter, setShiftSummaryFilter] = useState({
    search: '',
    sortBy: 'oee',
    sortDirection: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [allMachinesOEE, setAllMachinesOEE] = useState([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [selectedMachineData, setSelectedMachineData] = useState(null);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [shiftSummaryData, setShiftSummaryData] = useState([]);
  const [isLoadingShiftSummary, setIsLoadingShiftSummary] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [overallOEEData, setOverallOEEData] = useState(null);
  const [isLoadingOverallOEE, setIsLoadingOverallOEE] = useState(false);
  
  // Initialize data on component mount
  useEffect(() => {
    loadShiftSummaryData();
    fetchAllMachinesOEE();
    fetchOverallOEEAnalytics();
    // Set default machine selection to 'all'
    setOEESelectedMachine('all');
  }, [oeeData.dateRange, oeeData.selectedShift]);
  
  // Update filtered machines when selection changes
  useEffect(() => {
    if (oeeData.selectedMachine && oeeData.selectedMachine !== 'all') {
      setFilteredMachines(allMachinesOEE.filter(m => m.machine_id === oeeData.selectedMachine));
    } else {
      setFilteredMachines(allMachinesOEE);
    }
  }, [oeeData.selectedMachine, allMachinesOEE]);
  
  const fetchOverallOEEAnalytics = async () => {
  setIsLoadingOverallOEE(true);
  try {
    const selectedDate = dayjs(oeeData.dateRange).format('YYYY-MM-DD');
    
    const params = new URLSearchParams();
    params.append('date', selectedDate);
    
    if (oeeData.selectedShift !== null && oeeData.selectedShift !== 'all') {
      params.append('shift', oeeData.selectedShift);
    } else {
      params.append('shift', 'all');
    }
    
    const response = await axios.get(
      `http://172.19.224.1:8002/production_monitoring/overall-oee-analytics/?${params.toString()}`
    );
    
    setOverallOEEData(response.data);
  } catch (error) {
    console.error('Error fetching overall OEE analytics:', error);
  } finally {
    setIsLoadingOverallOEE(false);
  }
};


  // // Load shift summary data
  // const loadShiftSummaryData = async () => {
  //   setIsLoadingShiftSummary(true);
  //   try {
  //     const [startDate, endDate] = oeeData.dateRange;
  //     const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
  //     const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');
      
  //     const params = new URLSearchParams();
  //     params.append('start_date', formattedStartDate);
  //     params.append('end_date', formattedEndDate);
      
  //     if (oeeData.selectedShift !== null && oeeData.selectedShift !== 'all') {
  //       params.append('shift', oeeData.selectedShift);
  //     }
      
  //     if (oeeData.selectedMachine !== null && oeeData.selectedMachine !== 'all') {
  //       params.append('machine_id', oeeData.selectedMachine);
  //     }
      
  //     const response = await axios.get(
  //       `http://172.19.224.1:8002/production_monitoring/detailed-shift-summary/?${params.toString()}`
  //     );
      
  //     // Transform data for table
  //     const tableData = response.data.map((item, index) => ({
  //       key: index,
  //       date: item.date,
  //       shift: item.shift,
  //       machine: item.machine_name,
  //       machineId: item.machine_id,
  //       productionTime: item.production_time,
  //       idleTime: item.idle_time,
  //       offTime: item.off_time,
  //       totalParts: item.total_parts,
  //       goodParts: item.good_parts,
  //       badParts: item.bad_parts,
  //       availability: item.oee_metrics?.availability || 0,
  //       performance: item.oee_metrics?.performance || 0,
  //       quality: item.oee_metrics?.quality || 0,
  //       oee: item.oee_metrics?.oee || 0
  //     }));
      
  //     setShiftSummaryData(tableData);
  //   } catch (error) {
  //     console.error('Error loading shift summary data:', error);
  //   } finally {
  //     setIsLoadingShiftSummary(false);
  //   }
  // };

  const loadShiftSummaryData = async () => {
  setIsLoadingShiftSummary(true);
  try {
    const selectedDate = dayjs(oeeData.dateRange).format('YYYY-MM-DD');
    
    const params = new URLSearchParams();
    params.append('date', selectedDate);
    
    if (oeeData.selectedShift !== null && oeeData.selectedShift !== 'all') {
      params.append('shift', oeeData.selectedShift);
    } else {
      params.append('shift', 'all');
    }
    
    if (oeeData.selectedMachine !== null && oeeData.selectedMachine !== 'all') {
      params.append('machine_id', oeeData.selectedMachine);
    }
    
    const response = await axios.get(
      `http://172.19.224.1:8002/production_monitoring/detailed-shift-summary/?${params.toString()}`
    );
    
    // Transform data for table (rest remains same)
    const tableData = response.data.map((item, index) => ({
      key: index,
      date: item.date,
      shift: item.shift,
      machine: item.machine_name,
      machineId: item.machine_id,
      productionTime: item.production_time,
      idleTime: item.idle_time,
      offTime: item.off_time,
      totalParts: item.total_parts,
      goodParts: item.good_parts,
      badParts: item.bad_parts,
      availability: item.oee_metrics?.availability || 0,
      performance: item.oee_metrics?.performance || 0,
      quality: item.oee_metrics?.quality || 0,
      oee: item.oee_metrics?.oee || 0
    }));
    
    setShiftSummaryData(tableData);
  } catch (error) {
    console.error('Error loading shift summary data:', error);
  } finally {
    setIsLoadingShiftSummary(false);
  }
};
  
  // // Fetch OEE data for all machines
  // const fetchAllMachinesOEE = async () => {
  //   setIsLoadingMachines(true);
  //   try {
  //     const [startDate, endDate] = oeeData.dateRange;
  //     const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
  //     const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');
      
  //     // Get all machine IDs
  //     const machineIds = machines.map(m => m.machine_id);
      
  //     // Fetch data for each machine
  //     const promises = machineIds.map(id => 
  //       axios.get(`http://172.19.224.1:8002/production_monitoring/machine-oee-analysis/${id}?start_date=${formattedStartDate}&end_date=${formattedEndDate}`)
  //     );
      
  //     const results = await Promise.allSettled(promises);
  //     const machineData = results
  //       .filter(result => result.status === 'fulfilled')
  //       .map(result => result.value.data);
      
  //     setAllMachinesOEE(machineData);
  //     setFilteredMachines(machineData);
  //   } catch (error) {
  //     console.error('Error fetching all machines OEE:', error);
  //   } finally {
  //     setIsLoadingMachines(false);
  //   }
  // };
  const fetchAllMachinesOEE = async () => {
  setIsLoadingMachines(true);
  try {
    const selectedDate = dayjs(oeeData.dateRange).format('YYYY-MM-DD');
    
    // Get all machine IDs
    const machineIds = machines.map(m => m.machine_id);
    
    // Fetch data for each machine
    const promises = machineIds.map(id => {
      const params = new URLSearchParams();
      params.append('date', selectedDate);
      
      if (oeeData.selectedShift !== null && oeeData.selectedShift !== 'all') {
        params.append('shift', oeeData.selectedShift);
      } else {
        params.append('shift', 'all');
      }
      
      return axios.get(`http://172.19.224.1:8002/production_monitoring/machine-oee-analysis/${id}?${params.toString()}`);
    });
    
    const results = await Promise.allSettled(promises);
    const machineData = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value.data);
    
    setAllMachinesOEE(machineData);
    setFilteredMachines(machineData);
  } catch (error) {
    console.error('Error fetching all machines OEE:', error);
  } finally {
    setIsLoadingMachines(false);
  }
};
  // Show trend modal and fetch data
  // const showTrendModal = async (machineId) => {
  //   setSelectedMachineForTrend(machineId);
  //   const machine = allMachinesOEE.find(m => m.machine_id === machineId);
  //   setSelectedMachineData(machine);
  //   setTrendModalVisible(true);
  //   setTrendModalLoading(true);
    
  //   try {
  //     const [startDate, endDate] = oeeData.dateRange;
  //     const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
  //     const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');
      
  //     const response = await axios.get(
  //       `http://172.19.224.1:8002/production_monitoring/machine-oee-analysis/${machineId}?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
  //     );
      
  //     if (response.data && response.data.oee_trends) {
  //       // Transform data for chart
  //       const chartData = response.data.oee_trends.flatMap(trend => [
  //         { date: trend.date, type: 'OEE', value: trend.oee },
  //         { date: trend.date, type: 'Availability', value: trend.availability },
  //         { date: trend.date, type: 'Performance', value: trend.performance },
  //         { date: trend.date, type: 'Quality', value: trend.quality }
  //       ]);
        
  //       setTrendData(chartData);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching trend data:', error);
  //   } finally {
  //     setTrendModalLoading(false);
  //   }
  // };

  const showTrendModal = async (machineId) => {
  setSelectedMachineForTrend(machineId);
  const machine = allMachinesOEE.find(m => m.machine_id === machineId);
  setSelectedMachineData(machine);
  setTrendModalVisible(true);
  setTrendModalLoading(true);
  
  try {
    const selectedDate = dayjs(oeeData.dateRange).format('YYYY-MM-DD');
    
    const params = new URLSearchParams();
    params.append('date', selectedDate);
    
    if (oeeData.selectedShift !== null && oeeData.selectedShift !== 'all') {
      params.append('shift', oeeData.selectedShift);
    } else {
      params.append('shift', 'all');
    }
    
    const response = await axios.get(
      `http://172.19.224.1:8002/production_monitoring/machine-oee-analysis/${machineId}?${params.toString()}`
    );
    
    if (response.data && response.data.oee_trends) {
      // Transform data for chart
      const chartData = response.data.oee_trends.flatMap(trend => [
        { date: trend.date, type: 'OEE', value: trend.oee },
        { date: trend.date, type: 'Availability', value: trend.availability },
        { date: trend.date, type: 'Performance', value: trend.performance },
        { date: trend.date, type: 'Quality', value: trend.quality }
      ]);
      
      setTrendData(chartData);
    }
  } catch (error) {
    console.error('Error fetching trend data:', error);
  } finally {
    setTrendModalLoading(false);
  }
};
  
  // Handle date range change
  const handleDateChange = (date) => {
  if (date) {
    setOEEDateRange(date);
  }
};
  
  // Handle machine selection change
  const handleMachineChange = (value) => {
    setOEESelectedMachine(value);
  };
  
  // Handle shift selection change
  const handleShiftChange = (value) => {
    setOEESelectedShift(value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadShiftSummaryData();
    fetchAllMachinesOEE();
    fetchOverallOEEAnalytics();
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };
  
  // Sort shift summary data
  const sortedShiftSummaryData = [...shiftSummaryData].sort((a, b) => {
    const sortField = shiftSummaryFilter.sortBy;
    const sortOrder = shiftSummaryFilter.sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'date') {
      return sortOrder * (new Date(a.date) - new Date(b.date));
    }
    
    if (typeof a[sortField] === 'string') {
      return sortOrder * a[sortField].localeCompare(b[sortField]);
    }
    
    return sortOrder * (a[sortField] - b[sortField]);
  });
  
  // Filter shift summary data by search term
  const filteredShiftSummaryData = sortedShiftSummaryData.filter(item => {
    const searchTerm = shiftSummaryFilter.search.toLowerCase();
    return (
      item.machine.toLowerCase().includes(searchTerm) ||
      item.date.toLowerCase().includes(searchTerm)
    );
  });
  
  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      fixed: 'left'
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      width: 80,
      fixed: 'left',
      render: (value) => value || 'All'
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      key: 'machine',
      width: 150,
      fixed: 'left'
    },
    {
      title: 'Production Time',
      dataIndex: 'productionTime',
      key: 'productionTime',
      width: 120,
      render: (value) => (
        <Tooltip title={`${value} minutes`}>
          <div className="font-medium text-emerald-600">
            {value} min
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Idle Time',
      dataIndex: 'idleTime',
      key: 'idleTime',
      width: 120,
      render: (value) => (
        <Tooltip title={`${value} minutes`}>
          <div className="font-medium text-amber-600">
            {value} min
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Off Time',
      dataIndex: 'offTime',
      key: 'offTime',
      width: 120,
      render: (value) => (
        <Tooltip title={`${value} minutes`}>
          <div className="font-medium text-red-600">
            {value} min
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Parts',
      dataIndex: 'parts',
      key: 'parts',
      width: 60,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Total:</span>
            <span className="font-medium">{record.totalParts}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-600">Good:</span>
            <span className="font-medium text-green-600">{record.goodParts}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-600">Bad:</span>
            <span className="font-medium text-red-600">{record.badParts}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Availability',
      dataIndex: 'availability',
      key: 'availability',
      width: 100,
      render: (value) => (
        <Tooltip title={`${value.toFixed(1)}%`}>
          <div className="font-medium text-blue-600">
            {value.toFixed(1)}%
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      width: 100,
      render: (value) => (
        <Tooltip title={`${value.toFixed(1)}%`}>
          <div className="font-medium text-amber-600">
            {value.toFixed(1)}%
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Quality',
      dataIndex: 'quality',
      key: 'quality',
      width: 100,
      render: (value) => (
        <Tooltip title={`${value.toFixed(1)}%`}>
          <div className="font-medium text-purple-600">
            {value.toFixed(1)}%
          </div>
        </Tooltip>
      )
    },
    {
      title: 'OEE',
      dataIndex: 'oee',
      key: 'oee',
      width: 120,
      fixed: 'right',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="font-medium" style={{ 
            color: value >= 85 ? '#10b981' : 
                   value >= 60 ? '#f59e0b' : '#ef4444' 
          }}>
            {value.toFixed(1)}%
          </div>
          {/* {getStatusBadge(value)} */}
        </div>
      ),
      sorter: (a, b) => a.oee - b.oee,
      defaultSortOrder: 'descend'
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
  <span className="text-gray-500">Date:</span>
  <DatePicker
    value={oeeData.dateRange}
    onChange={handleDateChange}
    allowClear={false}
    format="YYYY-MM-DD"
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
                <Option value="all">All Shifts</Option>
                <Option value={1}>Shift 1</Option>
                <Option value={2}>Shift 2</Option>
                <Option value={3}>Shift 3</Option>
              </Select>
        </Space>
            
            <Button 
              icon={<RefreshCw size={16} />} 
              onClick={handleRefresh}
              loading={isLoadingOverallOEE || isLoadingShiftSummary || isLoadingMachines}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Overall OEE Analytics Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main OEE Score */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col justify-between border border-blue-100">
              <div>
                <h3 className="text-lg font-medium text-gray-600 mb-2 flex items-center">
                  <Award className="mr-2 text-blue-500" size={24} />
                  Overall Equipment Effectiveness
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div className="relative">
                    <div className="text-6xl font-bold" style={{ 
                      color: (overallOEEData?.overall_oee || 0) >= 85 ? '#10b981' : 
                             (overallOEEData?.overall_oee || 0) >= 60 ? '#f59e0b' : '#ef4444' 
                    }}>
                      {(overallOEEData?.overall_oee || 0).toFixed(1)}%
                    </div>
                    <div className="absolute -right-16 top-2">
                      {/* {getStatusBadge(overallOEEData?.overall_oee || 0)} */}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Progress 
                  percent={(overallOEEData?.overall_oee || 0).toFixed(1)} 
                  strokeColor={{
                    '0%': '#ef4444',
                    '60%': '#f59e0b',
                    '85%': '#10b981',
                  }}
                  size="large"
                  strokeWidth={12}
                />
                {/* <div className="flex justify-between text-xs mt-2 text-gray-500">
                  <span>Poor (&lt;60%)</span>
                  <span>Average (60-85%)</span>
                  <span>Excellent (&gt;85%)</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* OEE Components */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Availability Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
                  <div className="absolute inset-0 bg-blue-500 opacity-10 rounded-full"></div>
                </div>
                <div className="relative">
                  <h4 className="text-gray-600 mb-2 flex items-center">
                    <Clock className="mr-2 text-blue-500" size={20} />
                    Availability
                  </h4>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-blue-600">
                      {(overallOEEData?.overall_availability || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Planned vs. Actual Uptime</div>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      percent={(overallOEEData?.overall_availability || 0).toFixed(3)} 
                      strokeColor="#1890ff"
                      size="small"
                      strokeWidth={8}
                    />
                  </div>
                </div>
              </div>

              {/* Performance Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
                  <div className="absolute inset-0 bg-amber-500 opacity-10 rounded-full"></div>
                </div>
                <div className="relative">
                  <h4 className="text-gray-600 mb-2 flex items-center">
                    <Target className="mr-2 text-amber-500" size={20} />
                    Performance
                  </h4>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-amber-600">
                      {(overallOEEData?.overall_performance || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Actual vs. Ideal Cycle Time</div>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      percent={(overallOEEData?.overall_performance || 0).toFixed(3)} 
                      strokeColor="#faad14"
                      size="small"
                      strokeWidth={8}
                    />
                  </div>
                </div>
              </div>

              {/* Quality Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
                  <div className="absolute inset-0 bg-purple-500 opacity-10 rounded-full"></div>
                </div>
                <div className="relative">
                  <h4 className="text-gray-600 mb-2 flex items-center">
                    <CheckCircle className="mr-2 text-purple-500" size={20} />
                    Quality
                  </h4>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-purple-600">
                      {(overallOEEData?.overall_quality || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Good Parts vs. Total Parts</div>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      percent={(overallOEEData?.overall_quality || 0).toFixed(3)} 
                      strokeColor="#722ed1"
                      size="small"
                      strokeWidth={8}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Production Stats */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Production</div>
                    <div className="text-2xl font-semibold mt-1">{overallOEEData?.total_production || 0}</div>
                  </div>
                  <div className="p-3 rounded-full bg-gray-50">
                    <Target size={24} className="text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Good Parts</div>
                    <div className="text-2xl font-semibold text-green-600 mt-1">{overallOEEData?.total_good_parts || 0}</div>
                  </div>
                  <div className="p-3 rounded-full bg-green-50">
                    <CheckCircle size={24} className="text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Bad Parts</div>
                    <div className="text-2xl font-semibold text-red-600 mt-1">{overallOEEData?.total_bad_parts || 0}</div>
                  </div>
                  <div className="p-3 rounded-full bg-red-50">
                    <XCircle size={24} className="text-red-500" />
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span className="flex items-center gap-2">
              <BarChart2 size={16} />
              Machine-wise Analysis
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
                <Option value="all">All Machines</Option>
                {machines.map(machine => (
                  <Option key={machine.machine_id} value={machine.machine_id}>
                    {machine.machine_name}
                  </Option>
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
              {filteredMachines.map(machine => (
                <Card 
                  key={machine.machine_id}
                  className="shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden border-t-4"
                  style={{ borderTopColor: machine.average_oee >= 85 ? '#10b981' : machine.average_oee >= 60 ? '#f59e0b' : '#ef4444' }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold">{machine.machine_name}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Wrench size={12} className="mr-1" />
                        ID: {machine.machine_id}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {/* {getStatusBadge(machine.average_oee)} */}
                      <div className="text-2xl font-bold mt-1" style={{ 
                        color: machine.average_oee >= 85 ? '#10b981' : 
                              machine.average_oee >= 60 ? '#f59e0b' : '#ef4444' 
                      }}>
                        {machine.average_oee.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">OEE Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Availability</div>
                      <div className="text-xl font-bold text-blue-600">
                        {machine.average_availability.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Performance</div>
                      <div className="text-xl font-semibold text-amber-600">
                        {machine.average_performance.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Quality</div>
                      <div className="text-xl font-semibold text-purple-600">
                        {machine.average_quality.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <Divider className="my-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <AlertTriangle size={12} className="mr-1 text-red-500" />
                      Loss Analysis
                    </span>
                  </Divider>
                  
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Availability Loss</div>
                      <div className="text-sm font-semibold text-red-500">
                        {machine.losses?.availability_loss.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Performance Loss</div>
                      <div className="text-sm font-semibold text-orange-500">
                        {machine.losses?.performance_loss.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Quality Loss</div>
                      <div className="text-sm font-semibold text-pink-500">
                        {machine.losses?.quality_loss.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* <Button 
                    type="primary"
                    block
                    icon={<BarChart2 size={16} />}
                    onClick={() => showTrendModal(machine.machine_id)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    View OEE Trends
                  </Button> */}
      </Card>
              ))}
            </div>
          )}
        </TabPane>

        <TabPane 
          tab={
            <span className="flex items-center gap-2">
              <Activity size={16} />
              Shift Summary
            </span>
          } 
          key="2"
        >
          <Card className="shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <div className="flex items-center gap-4">
                <SearchInput
                  placeholder="Search by machine name or date..."
                  style={{ width: 250 }}
                  value={shiftSummaryFilter.search}
                  onChange={e => setShiftSummaryFilter({
                    ...shiftSummaryFilter,
                    search: e.target.value
                  })}
                  allowClear
                />
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Sort by:</span>
                  <Select
                    style={{ width: 150 }}
                    value={shiftSummaryFilter.sortBy}
                    onChange={value => setShiftSummaryFilter({
                      ...shiftSummaryFilter,
                      sortBy: value
                    })}
                  >
                    <Option value="date">Date</Option>
                    <Option value="machine">Machine</Option>
                    <Option value="productionTime">Production Time</Option>
                    <Option value="idleTime">Idle Time</Option>
                    <Option value="offTime">Off Time</Option>
                    <Option value="oee">OEE</Option>
                  </Select>
                  
                  {/* <Select
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
                  </Select> */}
                </div>
              </div>
              
             
            </div>
            
            {isLoadingShiftSummary ? (
              <div className="flex justify-center items-center py-10">
                <Spin size="large" />
              </div>
            ) : filteredShiftSummaryData.length > 0 ? (
              <Table 
                columns={columns} 
                dataSource={filteredShiftSummaryData} 
                scroll={{ x: 1500, y: 600 }}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
                }}
                onChange={handleTableChange}
                size="middle"
                bordered
                className="custom-table"
              />
            ) : (
              <Empty description="No shift summary data available" />
            )}
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Trend Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <BarChart2 size={18} className="mr-2 text-blue-500" />
            <span>OEE Trends - {selectedMachineData?.machine_name || 'Machine'}</span>
          </div>
        }
        open={trendModalVisible}
        onCancel={() => setTrendModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setTrendModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {trendModalLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spin size="large" />
          </div>
        ) : trendData.length > 0 ? (
          <div style={{ height: 500 }}>
            <Line 
              data={trendData}
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
              animation={false}
            />
          </div>
        ) : (
          <Empty description="No trend data available for this machine" />
        )}
      </Modal>
    </div>
  );
};

export default OEEDashboard; 