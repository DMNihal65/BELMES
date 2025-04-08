import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tabs, 
  Tooltip, 
  Badge, 
  Progress, 
  Tag, 
  Statistic,
  Typography,
  Divider,
  Spin,
  Empty,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  CalendarOutlined, 
  BarChartOutlined, 
  PieChartOutlined,
  ClockCircleOutlined,
  AlertOutlined, 
  CheckCircleOutlined
} from '@ant-design/icons';
import ReactApexChart from 'react-apexcharts';
import dayjs from 'dayjs';
import usePlanningStore from '../../store/planning-store';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

const CapacityPlanning = () => {
  const [workCenters, setWorkCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState([]);
  // Set default date range - current month
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'), // Start of current month
    dayjs() // Current date
  ]);
  const [machineUtilizationData, setMachineUtilizationData] = useState([]);
  const [chartData, setChartData] = useState({
    series: [],
    options: {
      chart: {
        type: 'bar',
        height: 280,
        stacked: true,
        stackType: 'normal',
        fontFamily: 'Helvetica, Arial, sans-serif',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          },
          export: {
            csv: {
              filename: 'Machine Capacity Utilization',
            },
            svg: {
              filename: 'Machine Capacity Utilization',
            },
            png: {
              filename: 'Machine Capacity Utilization',
            }
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        dropShadow: {
          enabled: true,
          top: 2,
          left: 0,
          blur: 4,
          opacity: 0.1
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          borderRadius: 6,
          barHeight: '100%',
          distributed: false
        }
      },
      states: {
        hover: {
          filter: {
            type: 'lighten',
            value: 0.05
          }
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'darken',
            value: 0.35
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: [],
        labels: {
          rotate: 0,
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#505050'
          },
          trim: false
        },
        axisTicks: {
          show: false
        },
        axisBorder: {
          show: true,
          color: '#e0e0e0'
        },
        tooltip: {
          enabled: false
        }
      },
      grid: {
        show: true,
        borderColor: '#f0f0f0',
        strokeDashArray: 3,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      yaxis: {
        title: {
          text: 'Hours',
          style: {
            fontSize: '13px',
            fontWeight: 500,
            color: '#505050'
          }
        },
        labels: {
          formatter: function (val) {
            return val.toFixed(0);
          },
          style: {
            fontSize: '12px',
            colors: '#505050'
          }
        }
      },
      fill: {
        opacity: 1,
        type: 'solid'
      },
      colors: ['#22c55e', '#ef4444', '#3b82f6'], // Brighter green, red, blue
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '13px',
        fontWeight: 500,
        markers: {
          radius: 4,
          width: 12,
          height: 12,
          offsetX: -2
        },
        itemMargin: {
          horizontal: 15,
          vertical: 5
        }
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        followCursor: true,
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Helvetica, Arial, sans-serif'
        },
        custom: function({series, seriesIndex, dataPointIndex, w}) {
          const machine = w.globals.labels[dataPointIndex];
          
          // Get all three values for this machine
          const availableHours = series[0][dataPointIndex];
          const utilizedHours = series[1] ? series[1][dataPointIndex] : 0;
          const remainingHours = series[2] ? series[2][dataPointIndex] : 0;
          
          // Get the colors from the chart
          const availableColor = w.globals.colors[0];
          const utilizedColor = w.globals.colors[1]; 
          const remainingColor = w.globals.colors[2];
          
          // Calculate percentage of utilization
          const utilizationPercentage = availableHours > 0 
            ? (utilizedHours / availableHours * 100).toFixed(1) 
            : 0;
          
          return `
            <div class="apexcharts-tooltip-box" style="padding: 10px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border: none; min-width: 200px; border-radius: 6px;">
              <div style="margin-bottom: 10px; font-weight: bold; font-size: 14px; color: #333;">${machine}</div>
              
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: ${availableColor}; margin-right: 8px; border-radius: 50%;"></span>
                <span style="color: #505050;">Available Hours: </span>
                <span style="font-weight: bold; margin-left: 4px; color: #333;">${availableHours.toFixed(0)}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: ${utilizedColor}; margin-right: 8px; border-radius: 50%;"></span>
                <span style="color: #505050;">Utilized Hours: </span>
                <span style="font-weight: bold; margin-left: 4px; color: #333;">${utilizedHours.toFixed(0)}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: ${remainingColor}; margin-right: 8px; border-radius: 50%;"></span>
                <span style="color: #505050;">Remaining Hours: </span>
                <span style="font-weight: bold; margin-left: 4px; color: #333;">${remainingHours.toFixed(0)}</span>
              </div>
              
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <span style="color: #505050;">Utilization: </span>
                <span style="font-weight: bold; color: ${utilizedHours/availableHours > 0.8 ? '#ef4444' : utilizedHours/availableHours > 0.5 ? '#f59e0b' : '#22c55e'};">
                  ${utilizationPercentage}%
                </span>
              </div>
            </div>
          `;
        }
      }
    },
  });

  const { fetchMachineUtilizationByDateRange, isLoading: storeLoading } = usePlanningStore();

  // Update chart with machine utilization data
  const updateChartWithUtilizationData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      // Reset chart when no data
      setChartData(prev => ({
        ...prev,
        series: [],
        options: {
          ...prev.options,
          xaxis: {
            ...prev.options.xaxis,
            categories: []
          }
        }
      }));
      return;
    }

    // Extract machine models/makes with cleaner names for display
    const machines = data.map(item => {
      // Use make and model but format nicely
      return item.machine_make ? 
        `${item.machine_make}${item.machine_model !== 'Default' ? ' ' + item.machine_model : ''}` 
        : `Machine ${item.machine_id}`;
    });
    
    // Prepare data for the chart
    const availableHours = data.map(item => parseFloat(item.available_hours.toFixed(1)));
    const utilizedHours = data.map(item => parseFloat(item.utilized_hours.toFixed(1)));
    const remainingHours = data.map(item => parseFloat(item.remaining_hours.toFixed(1)));
    
    // Create a new series configuration with proper stacking
    setChartData(prev => ({
      ...prev,
      series: [
        {
          name: 'Available Hours',
          data: availableHours,
          group: 'available'
        },
        {
          name: 'Utilized Hours',
          data: utilizedHours,
          group: 'utilization'
        },
        {
          name: 'Remaining Hours',
          data: remainingHours,
          group: 'utilization'
        }
      ],
      options: {
        ...prev.options,
        xaxis: {
          ...prev.options.xaxis,
          categories: machines
        },
        // The key settings for proper stacking
        chart: {
          ...prev.options.chart,
          stacked: true,
          stackType: 'normal'
        },
        plotOptions: {
          ...prev.options.plotOptions,
          bar: {
            ...prev.options.plotOptions.bar,
            columnWidth: '40%'
          }
        }
      }
    }));
  };

  // Fetch machine utilization data for the selected date range
  const fetchMachineData = async (startDate = dateRange[0], endDate = dateRange[1]) => {
    try {
      setLoading(true);
      const data = await fetchMachineUtilizationByDateRange(startDate, endDate);
      if (Array.isArray(data) && data.length > 0) {
        setMachineUtilizationData(data);
        updateChartWithUtilizationData(data);
      } else {
        setMachineUtilizationData([]);
        updateChartWithUtilizationData([]); // Reset chart with empty data
        message.info('No machine utilization data available for the selected date range');
      }
    } catch (error) {
      console.error('Error fetching machine utilization data:', error);
      message.error('Failed to fetch machine utilization data');
      setMachineUtilizationData([]);
      updateChartWithUtilizationData([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when component mounts
  useEffect(() => {
    // Fetch data for default date range when component mounts
    fetchMachineData(dateRange[0], dateRange[1]);
    
    // Fetch work centers 
    const fetchWorkCentersList = async () => {
      try {
        const { fetchWorkCenters } = usePlanningStore.getState();
        const centers = await fetchWorkCenters();
        setWorkCenters(centers || []);
      } catch (error) {
        console.error('Error fetching work centers:', error);
      }
    };

    fetchWorkCentersList();
  }, []);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  // Function to handle refresh button click
  const handleRefreshClick = () => {
    if (dateRange && dateRange.length === 2) {
      fetchMachineData(dateRange[0], dateRange[1]);
    } else {
      message.warning('Please select a valid date range');
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return date ? date.format('YYYY-MM-DD') : '';
  };

  // Calculate summary statistics
  const calculateStats = () => {
    if (!machineUtilizationData.length) {
      return {
        totalMachines: 0,
        totalAvailable: 0,
        totalUtilized: 0,
        totalRemaining: 0,
        avgUtilizationPercentage: 0
      };
    }

    const totalMachines = machineUtilizationData.length;
    const totalAvailable = machineUtilizationData.reduce((sum, item) => sum + item.available_hours, 0);
    const totalUtilized = machineUtilizationData.reduce((sum, item) => sum + item.utilized_hours, 0);
    const totalRemaining = machineUtilizationData.reduce((sum, item) => sum + item.remaining_hours, 0);
    const avgUtilizationPercentage = totalAvailable > 0 
      ? (totalUtilized / totalAvailable) * 100 
      : 0;

    return {
      totalMachines,
      totalAvailable,
      totalUtilized,
      totalRemaining,
      avgUtilizationPercentage
    };
  };

  const stats = calculateStats();

  return (
    <div className="capacity-planning">
      <div className="mb-6">
        <Title level={4}>Machine Capacity Utilization</Title>
        
      </div>

      {/* Filter controls */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Space size="middle" align="center">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date Range</label>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  allowClear={false}
                  style={{ width: 280 }}
                />
              </div>
              
              <div style={{ marginTop: '18px' }}>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />} 
                  onClick={handleRefreshClick}
                  loading={loading}
                  size="middle"
                >
                  Get Data
                </Button>
              </div>
            </Space>
          </Col>
          <Col span={12} className="text-right">
            <Text type="secondary">
              Showing data for: <Tag color="blue">{formatDate(dateRange[0])} to {formatDate(dateRange[1])}</Tag>
            </Text>
          </Col>
        </Row>
      </Card>


      {/* Utilization Chart */}
      <Card 
        className="mb-6"
        bodyStyle={{ padding: '16px' }}
        bordered={false}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px' }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : machineUtilizationData.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4 px-2">
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>Machine Capacity Utilization</Title>
              
            </div>
            <ReactApexChart 
              options={chartData.options} 
              series={chartData.series} 
              type="bar" 
              height={280} 
            />
          </div>
        ) : (
          <Empty description="No utilization data available" className="py-20" />
        )}
      </Card>
    </div>
  );
};

export default CapacityPlanning;