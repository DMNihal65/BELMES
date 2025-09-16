import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Select, 
  DatePicker, 
  Space, 
  Tooltip, 
  Tag, 
  Typography,
  Spin,
  Empty,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  CalendarOutlined, 
  AlertOutlined, 
} from '@ant-design/icons';
import Lottie from 'lottie-react';
import capacityPlanAnimation from "../../assets/capacityplan.json";
import ReactApexChart from 'react-apexcharts';
import dayjs from 'dayjs';
import usePlanningStore from '../../store/planning-store';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;

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
        height: 350,
        stacked: true,
        stackType: 'normal',
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
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
          columnWidth: '65%',
          endingShape: 'rounded',
          borderRadius: 4,
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
      // Updated colors for better visual distinction
      colors: ['#3b82f6', '#ef4444', '#10b981'], // Blue, Red, Green
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
          fontFamily: 'Inter, Helvetica, Arial, sans-serif'
        },
        custom: function({series, seriesIndex, dataPointIndex, w}) {
          const machine = w.globals.labels[dataPointIndex];
          const machineData = machineUtilizationData[dataPointIndex];
          
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

          // Get work centre name
          const workCenterName = machineData ? machineData.work_center_name : 'Unknown';
          
          return `
            <div class="apexcharts-tooltip-box" style="padding: 10px; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: none; min-width: 220px; border-radius: 8px;">
              <div style="margin-bottom: 10px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px;">${machine}</div>
              <div style="margin-bottom: 8px; font-size: 13px; color: #1f2937; font-weight: 500;">
                work centre: <span style="color: #3b82f6">${workCenterName}</span>
              </div>
              
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${availableColor}; margin-right: 8px; border-radius: 50%;"></span>
                  <span style="color: #6b7280;">Available Hours:</span>
                </div>
                <span style="font-weight: 600; color: #374151;">${availableHours.toFixed(0)}</span>
              </div>
              
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${utilizedColor}; margin-right: 8px; border-radius: 50%;"></span>
                  <span style="color: #6b7280;">Planned Hours:</span>
                </div>
                <span style="font-weight: 600; color: #374151;">${utilizedHours.toFixed(0)}</span>
              </div>
              
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${remainingColor}; margin-right: 8px; border-radius: 50%;"></span>
                  <span style="color: #6b7280;">Remaining Hours:</span>
                </div>
                <span style="font-weight: 600; color: #374151;">${remainingHours.toFixed(0)}</span>
              </div>
              
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280;">Utilization:</span>
                <span style="font-weight: 600; color: ${
                  utilizedHours/availableHours > 0.8 ? '#ef4444' : 
                  utilizedHours/availableHours > 0.5 ? '#f59e0b' : 
                  '#10b981'
                };">
                  ${utilizationPercentage}%
                </span>
              </div>
            </div>
          `;
        }
      }
    },
  });

 const { fetchMachinePlanningByDateRange, isLoading: storeLoading } = usePlanningStore();

  const fetchMachineData = async (startDate = dateRange[0], endDate = dateRange[1]) => {
  try {
    setLoading(true);
    
    // const adjustedEndDate = dayjs(startDate).isSame(endDate, 'day') 
    //   ? dayjs(endDate).add(1, 'day') 
    //   : endDate;
    
    
    const data = await fetchMachinePlanningByDateRange(startDate, endDate);

      
      if (Array.isArray(data) && data.length > 0) {
        // Filter machines to only include those with work_center_bool = true AND exclude "Default" machines
        const filteredData = data.filter(machine => 
          machine.work_center_bool === true && 
          machine.machine_make !== 'Default' && 
          machine.machine_model !== 'Default'
        );
        
        if (filteredData.length > 0) {
          // Store the full machine data first
          setMachineUtilizationData(filteredData);
          // Then update the chart
          updateChartWithUtilizationData(filteredData);
        } else {
          setMachineUtilizationData([]);
          updateChartWithUtilizationData([]);
          message.info('No valid work centre machines available for the selected date range');
        }
      } else {
        setMachineUtilizationData([]);
        updateChartWithUtilizationData([]);
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

  // Update chart with machine utilization data
  const updateChartWithUtilizationData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
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
      // Since we filter out "Default" machines, we can safely use make and model
      const machineName = item.machine_make && item.machine_model ? 
        `${item.machine_make} ${item.machine_model}` 
        : item.machine_make || `Machine ${item.machine_id}`;
      return machineName;
    });
    
    // Prepare data for the chart
    const availableHours = data.map(item => parseFloat(item.available_hours.toFixed(1)));
    const utilizedHours = data.map(item => parseFloat(item.utilized_hours.toFixed(1)));
    const remainingHours = data.map(item => parseFloat(item.remaining_hours.toFixed(1)));
    
    // Determine if we have many machines (adjust layout for mobile)
    const hasManyMachines = machines.length > 5;

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
          name: 'Planned Hours',
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
          categories: machines,
          labels: {
            ...prev.options.xaxis.labels,
            rotate: hasManyMachines ? -45 : 0,
            trim: hasManyMachines,
            style: {
              ...prev.options.xaxis.labels.style,
              fontSize: hasManyMachines ? '10px' : '12px'
            }
          }
        },
        tooltip: {
          ...prev.options.tooltip,
          custom: function({series, seriesIndex, dataPointIndex, w}) {
            const machine = w.globals.labels[dataPointIndex];
            const machineData = data[dataPointIndex]; // Use data directly instead of machineUtilizationData
            
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

            // Get work centre name directly from the data
            const workCenterName = machineData.work_center_name;
            
            return `
              <div class="apexcharts-tooltip-box" style="padding: 10px; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: none; min-width: 220px; border-radius: 8px;">
                <div style="margin-bottom: 10px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px;">${machine}</div>
                <div style="margin-bottom: 8px; font-size: 13px; color: #1f2937; font-weight: 500;">
                  work centre: <span style="color: #3b82f6">${workCenterName}</span>
                </div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center;">
                    <span style="display: inline-block; width: 10px; height: 10px; background: ${availableColor}; margin-right: 8px; border-radius: 50%;"></span>
                    <span style="color: #6b7280;">Available Hours:</span>
                  </div>
                  <span style="font-weight: 600; color: #374151;">${availableHours.toFixed(1)}</span>
                </div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center;">
                    <span style="display: inline-block; width: 10px; height: 10px; background: ${utilizedColor}; margin-right: 8px; border-radius: 50%;"></span>
                    <span style="color: #6b7280;">Planned Hours:</span>
                  </div>
                  <span style="font-weight: 600; color: #374151;">${utilizedHours.toFixed(1)}</span>
                </div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center;">
                    <span style="display: inline-block; width: 10px; height: 10px; background: ${remainingColor}; margin-right: 8px; border-radius: 50%;"></span>
                    <span style="color: #6b7280;">Remaining Hours:</span>
                  </div>
                  <span style="font-weight: 600; color: #374151;">${remainingHours.toFixed(1)}</span>
                </div>
                
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6b7280;">Utilization:</span>
                  <span style="font-weight: 600; color: ${
                    utilizedHours/availableHours > 0.8 ? '#ef4444' : 
                    utilizedHours/availableHours > 0.5 ? '#f59e0b' : 
                    '#10b981'
                  };">
                    ${utilizationPercentage}%
                  </span>
                </div>
              </div>
            `;
          }
        },
        // Other chart options remain the same
        chart: {
          ...prev.options.chart,
          stacked: true,
          stackType: 'normal'
        },
        plotOptions: {
          ...prev.options.plotOptions,
          bar: {
            ...prev.options.plotOptions.bar,
            columnWidth: hasManyMachines ? '80%' : '55%'
          }
        },
        legend: {
          ...prev.options.legend,
          position: window.innerWidth < 768 ? 'bottom' : 'top',
          fontSize: '12px',
          itemMargin: {
            horizontal: window.innerWidth < 768 ? 8 : 15,
            vertical: window.innerWidth < 768 ? 8 : 5
          }
        }
      }
    }));
  };

  // Effect to fetch data when component mounts
  useEffect(() => {
    // Fetch data for default date range when component mounts
    fetchMachineData(dateRange[0], dateRange[1]);
    
    // Fetch work centres 
    const fetchWorkCentersList = async () => {
      try {
        const { fetchWorkCenters } = usePlanningStore.getState();
        const centers = await fetchWorkCenters();
        setWorkCenters(centers || []);
      } catch (error) {
        console.error('Error fetching work centres:', error);
      }
    };

    fetchWorkCentersList();
    
    // Add resize listener to update chart on window resize
    const handleResize = () => {
      if (machineUtilizationData.length > 0) {
        updateChartWithUtilizationData(machineUtilizationData);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect to update chart when machine data changes
  useEffect(() => {
    if (machineUtilizationData.length > 0) {
      updateChartWithUtilizationData(machineUtilizationData);
    }
  }, [machineUtilizationData]);

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

  const differentDateReferesh =()=>{
    window.location.reload();
  }


  // Format date for display
  const formatDate = (date) => {
    return date ? date.format('YYYY-MM-DD') : '';
  };

  return (
    <div className="capacity-planning px-2 sm:px-4 md:px-6">
      <div className="mb-6 bg-white p-4 md:p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center">
          <Lottie
            animationData={capacityPlanAnimation}
            autoplay={true}
            loop={true}
            style={{ width: 55, height: 50 }}
          />
          <div>
            <Title level={4} style={{ margin: 0, color: 'black', fontWeight: 'bold' }}>Machine Capacity Planning</Title>
            <Text type="secondary">Monitor and analyze machine utilization across the shop floor</Text>
            <div className="mt-2">
              <Tag color="blue" icon={<AlertOutlined />}>Only valid work centre machines (excluding "Default" machines) are displayed</Tag>
            </div>
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <Card 
        className="mb-6 shadow-sm hover:shadow-md transition-shadow"
        bordered={false}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={16}>
            <Space size="middle" align="center" wrap className="w-full justify-center md:justify-start">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-bold">Select Date Range</label>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  allowClear={false}
                  style={{ width: '100%', minWidth: '240px' }}
                  className="rounded-md"
                  ranges={{
                    'Today': [dayjs(), dayjs()],
                    'This Week': [dayjs().startOf('week'), dayjs().endOf('week')],
                    'This Month': [dayjs().startOf('month'), dayjs()],
                    'Last Month': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
                  }}
                />
              </div>
              
              <div style={{ marginTop: '24px' }}>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />} 
                  onClick={handleRefreshClick}
                  loading={loading}
                  size="middle"
                  className="bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  Get Data
                </Button>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={8} className="text-center lg:text-right">
            <div className="flex items-center justify-center lg:justify-end mt-1 md:mt-0">
              <Text type="secondary" className="mr-2 whitespace-nowrap">
                Showing data for:
              </Text>
              <Tag 
                color="blue" 
                className="text-sm rounded-md py-1 px-2"
                icon={<CalendarOutlined />}
              >
                {formatDate(dateRange[0])} to {formatDate(dateRange[1])}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Utilization Chart */}
      <Card 
        className="mb-6"
        bodyStyle={{ padding: '16px', overflow: 'auto' }}
        bordered={false}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', borderRadius: '0.75rem' }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-36">
            <Spin size="large" tip="Loading utilization data..." />
          </div>
        ) : machineUtilizationData.length > 0 ? (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 px-2">
              <div className="mb-3 md:mb-0">
                <Title level={5} style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
                  Machine Utilization Chart
                </Title>
                <Text type="secondary">
                  Hours distribution per machine for the selected period
                </Text>
              </div>
              <Space className="self-start md:self-auto">
                <Tooltip title="The chart shows available hours, Planned Hours, and remaining hours for each machine">
                  <Button type="text" icon={<AlertOutlined />} />
                </Tooltip>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefreshClick}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            </div>
            <div className="overflow-x-auto min-w-full">
              <ReactApexChart 
                options={chartData.options} 
                series={chartData.series} 
                type="bar" 
                height={450}
                width="100%"
              />
            </div>
          </div>
        ) : (
          <Empty 
            description={
              <div>
                <p className="text-gray-500 mb-4">No utilization data available for the selected date range</p>
                <Button 
                  type="primary" 
                  onClick={differentDateReferesh} 
                  icon={<ReloadOutlined />}
                  className="bg-blue-500"
                >
                  Try Different Dates
                </Button>
              </div>
            } 
            className="py-20" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        )}
      </Card>
    </div>
  );
};

export default CapacityPlanning;