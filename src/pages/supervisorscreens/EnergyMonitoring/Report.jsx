import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Button, message, Table, Spin } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment';
import QRCode from 'react-qr-code';
import cmtiImage from '../../../assets/cmti.png';
import ReactECharts from 'echarts-for-react';
import useEnergyStore from '../../../store/energyMonitoring';
// import { API_ENDPOINTS } from './apiEndpoints';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsXRange from 'highcharts/modules/xrange';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Content } = Layout;
const { Title, Text } = Typography;

// Initialize xrange module
if (typeof Highcharts === 'object') {
  HighchartsXRange(Highcharts);
}

// Add these style constants at the top of your file
const styles = {
  tableHeader: {
    backgroundColor: '#3B97B4',  // The blue color from your image
    color: 'white',
    fontWeight: 'bold',
  },
  pageContainer: {
    width: '21cm',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  }
};

function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const date = location.state?.date || new Date(); // Default date if none provided
  const [loading, setLoading] = useState(true);
  const { weeklyEnergyData, fetchDailyEnergyConsumption, fetchShiftHistoricalData, shiftLiveData, workshopProductionData, fetchWorkshopProductionData, graphData, fetchGraphData } = useEnergyStore();
  const [shiftData, setShiftData] = useState(null);
  const [costData, setCostData] = useState({
    weekly_cost: 0,
    monthly_cost: 0
  });
  const [productionData, setProductionData] = useState(null);
  const [machines, setMachines] = useState([]);

  // Table columns configuration
  const columns = [
    {
      title: 'MACHINES',
      dataIndex: 'machine_name',
      key: 'machine_name',
      onHeaderCell: () => ({
        style: styles.tableHeader
      })
    },
    {
      title: 'FIRST SHIFT (kWh)',
      dataIndex: 'first_shift',
      key: 'first_shift',
      render: (value) => value?.toFixed(2) || '0.00',
      onHeaderCell: () => ({
        style: styles.tableHeader
      })
    },
    {
      title: 'SECOND SHIFT (kWh)',
      dataIndex: 'second_shift',
      key: 'second_shift',
      render: (value) => value?.toFixed(2) || '0.00',
      onHeaderCell: () => ({
        style: styles.tableHeader
      })
    },
    {
      title: 'THIRD SHIFT (kWh)',
      dataIndex: 'third_shift',
      key: 'third_shift',
      render: (value) => value?.toFixed(2) || '0.00',
      onHeaderCell: () => ({
        style: styles.tableHeader
      })
    },
    {
      title: 'ALL SHIFTS (kWh)',
      dataIndex: 'total_energy',
      key: 'total_energy',
      render: (value) => value?.toFixed(3) || '0.000',
      onHeaderCell: () => ({
        style: styles.tableHeader
      })
    },
    {
      title: 'TOTAL COST (Rs)',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (value) => `₹${value?.toFixed(2) || '0.00'}`,
      onHeaderCell: () => ({
        style: styles.tableHeader
      })
    },
  ];

  // Fetch all required data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch daily energy consumption
        await fetchDailyEnergyConsumption(date);
        
        // Fetch shift data
        const shiftResponse = await fetch(
          `/api/v5/shift_live_history/?date=${moment(date).format('YYYY-MM-DD')}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        const shiftData = await shiftResponse.json();
        setShiftData(shiftData);

        // Fetch cost data
        const costResponse = await fetch(
          `/api/v5/total_energy_costs/?date=${moment(date).format('YYYY-MM-DD')}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        const costData = await costResponse.json();
        setCostData({
          weekly_cost: costData.total_weekly_cost || 0,
          monthly_cost: costData.total_monthly_cost || 0
        });

        // Fetch shift historical data
        await fetchShiftHistoricalData(moment(date).format('YYYY-MM-DD'));

        // Fetch production data
        const productionUrl = `${API_ENDPOINTS.PROD_GRAPH_DATA}?date=${moment(date).format('YYYY-MM-DD')}`;
        const productionResponse = await fetch(productionUrl);
        if (!productionResponse.ok) {
          throw new Error(`HTTP error! status: ${productionResponse.status}`);
        }
        const productionResult = await productionResponse.json();
        setProductionData(productionResult);

        // Fetch workshop production data
        await fetchWorkshopProductionData(date);

      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (date) {
      fetchAllData();
    }
  }, [date, fetchDailyEnergyConsumption, fetchShiftHistoricalData, fetchWorkshopProductionData]);

  useEffect(() => {
    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchWorkshopProductionData(date);
            console.log('Loaded production data:', data);
        } catch (error) {
            console.error('Error loading workshop production data:', error);
            message.error('Using default production data');
        } finally {
            setLoading(false);
        }
    };

    loadData();
}, [date, fetchWorkshopProductionData]);

  const handlePrint = async () => {
    try {
      const pages = document.querySelectorAll('.page-container');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }
      
      pdf.save(`Workshop_Report_${moment(date).format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  // Function to get bar chart options
  const getBarChartOptions = () => {
    const startDate = moment(date).subtract(6, 'days');
    const endDate = moment(date);

    // Process the weekly energy data
    const chartData = Array.isArray(weeklyEnergyData) ? weeklyEnergyData : [];
    console.log('Weekly Energy Data:', chartData);

    return {
      title: {
        text: `Week At Glance from: ${startDate.format('MMMM DD, YYYY')} \nto ${endDate.format('MMMM DD, YYYY')}`,
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        },
        left: 'center',
        top: 0
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} kWh'
      },
      grid: {
        top: 60,
        left: 40,
        right: 20,
        bottom: 30
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item.day.substring(0, 3)) || [],
        axisLine: { show: true },
        axisTick: { show: true, alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        name: 'Energy (kWh)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: Math.max(...chartData.map(item => item.energy_consumption)) * 1.2 || 200,
        interval: 20,
        axisLabel: { formatter: '{value}' }
      },
      series: [{
        name: 'Daily Energy',
        type: 'bar',
        barWidth: '40%',
        data: chartData.map(item => ({
          value: parseFloat(item.energy_consumption) || 0,
          itemStyle: { color: '#FF6B6B' }
        }))
      }]
    };
  };

  // Function to get doughnut chart options
  const getDoughnutChartOptions = () => {
    // Process shift data for the doughnut chart using total_cost from table data
    const machineData = shiftData?.map((machine, index) => ({
      value: parseFloat(machine.total_cost) || 0,
      name: machine.machine_name,
      itemStyle: { 
        color: getChartColors()[index]
      }
    })) || [];

    // Calculate total cost for center label
    const totalCost = machineData.reduce((sum, item) => sum + item.value, 0);

    return {
      title: {
        text: 'Machine-wise Distribution',
        left: 'center',
        top: '5%',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `${params.name}: ₹${params.value.toFixed(2)}`;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: '0%',
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 11 },
        formatter: (name) => name
      },
      graphic: [{
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: [
            'Total Amount for',
            moment(date).format('MMM DD'),
            `₹${totalCost.toFixed(2)}`
          ].join('\n'),
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 'normal'
        }
      }],
      series: [{
        name: 'Machine Cost',
        type: 'pie',
        radius: ['40%', '60%'],
        center: ['50%', '50%'],
        startAngle: 0,
        clockwise: true,
        avoidLabelOverlap: true,
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff'
        },
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        emphasis: {
          scale: true,
          scaleSize: 10
        },
        data: machineData.map((item, index) => ({
          ...item,
          itemStyle: {
            color: getChartColors()[index]
          }
        }))
      }]
    };
  };

  // Function to get consistent colors for the chart
  const getChartColors = () => {
    return [
      '#4B7BE5',  // Blue (MCV450)
      '#FF6B6B',  // Red (Mazak)
      '#FDB022',  // Yellow (LT 500)
      '#63CF6C',  // Green (HMT VTC)
      '#9747FF',  // Purple (SCHAUBLIN)
      '#45B1A3'   // Teal (HMT Station)
    ];
  };

  // Helper function to ensure equal distribution
  const distributeColors = (data) => {
    const totalItems = data.length;
    const anglePerItem = 360 / totalItems;
    
    return data.map((item, index) => ({
      ...item,
      startAngle: index * anglePerItem,
      endAngle: (index + 1) * anglePerItem
    }));
  };

  // Helper function to calculate total amount
  const getTotalAmount = () => {
    return shiftData?.reduce((sum, machine) => 
      sum + (parseFloat(machine.total_cost) || 0), 0
    )?.toFixed(2) || '0.00';
  };

  // Function to get energy time details
  const getEnergyTimeDetails = (shiftData) => {
    const machines = shiftData.map(machine => machine.machine_name);
    const energyShift1 = shiftData.map(machine => machine.first_shift || 0);
    const energyShift2 = shiftData.map(machine => machine.second_shift || 0);
    const energyShift3 = shiftData.map(machine => machine.third_shift || 0);
    const timeData = shiftData.map(machine => machine.time || 0); // Assuming you have a time field

    return {
      machines,
      energyShift1,
      energyShift2,
      energyShift3,
      timeData
    };
  };

  const getEnergyTimeChartOptions = () => {
    return {
      title: {
       
        left: 'center',
        top: 20
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Energy Shift 1', 'Energy Shift 2', 'Energy Shift 3', 'Time'],
        top: 60
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 100,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: shiftData?.map(item => item.machine_name) || [],
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: [{
        type: 'value',
        name: 'Energy',
        min: 0,
        max: 25,
        interval: 5,
        axisLabel: {
          formatter: '{value}'
        }
      }, {
        type: 'value',
        name: 'Time',
        min: 0,
        max: 25,
        interval: 5,
        axisLabel: {
          formatter: '{value}'
        }
      }],
      series: [
        {
          name: 'Energy Shift 1',
          type: 'bar',
          stack: 'energy',
          itemStyle: { color: '#ff9999' },
          data: shiftData?.map(item => item.first_shift) || []
        },
        {
          name: 'Energy Shift 2',
          type: 'bar',
          stack: 'energy',
          itemStyle: { color: '#ffb366' },
          data: shiftData?.map(item => item.second_shift) || []
        },
        {
          name: 'Energy Shift 3',
          type: 'bar',
          stack: 'energy',
          itemStyle: { color: '#99ccff' },
          data: shiftData?.map(item => item.third_shift) || []
        },
        {
          name: 'Time',
          type: 'bar',
          itemStyle: { color: '#b3d9ff' },
          yAxisIndex: 1,
          data: shiftData?.map(() => 24) || [] // Assuming 24 hours for each machine
        }
      ]
    };
  };

  const getProductionTimelineOptions = () => ({
    chart: {
      type: 'xrange',
      height: 400,
      marginLeft: 150,
      backgroundColor: '#ffffff'
    },
    title: {
      text: 'Workshop Production',
      align: 'left',
      style: { 
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    xAxis: {
      type: 'datetime',
      min: moment(date).startOf('day').set({ hour: 8 }).valueOf(),
      max: moment(date).add(1, 'day').set({ hour: 8 }).valueOf(),
      labels: {
        format: '{value:%H:%M}',
        style: { fontSize: '12px' }
      },
      tickInterval: 3600 * 1000, // 1 hour intervals
      gridLineWidth: 1,
      gridLineColor: '#E0E0E0'
    },
    yAxis: {
      title: { text: '' },
      categories: [
        'LT 500',
        'Mazak H-400',
        'SCHAUBLIN33 CNC',
        'HMT VTC 800',
        'HMT Stallion 200',
        'MCV450',
        'Mono200'
      ],
      reversed: false,
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 'normal',
          color: '#333333'
        },
        align: 'right'
      },
      gridLineWidth: 0
    },
    tooltip: {
      formatter: function() {
        return `<b>${this.yCategory}</b><br/>
                Status: ${this.point.status}<br/>
                Time: ${moment(this.x).format('HH:mm')} - ${moment(this.x2).format('HH:mm')}`;
      }
    },
    plotOptions: {
      xrange: {
        borderRadius: 0,
        borderWidth: 0,
        pointPadding: 0.1,
        groupPadding: 0,
        colorByPoint: false,
        dataLabels: {
          enabled: false
        }
      }
    },
    series: [{
      name: 'Machine Status',
      pointWidth: 25,
      data: graphData,
      states: {
        hover: {
          enabled: false
        }
      }
    }],
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    }
  });

  const getStatusColor = (status) => {
    const colorMap = {
      'PRODUCTION': '#006400',  // Dark Green
      'ON': '#FF8C00',         // Dark Orange
      'OFF': '#808080'         // Light Grey
    };
    return colorMap[status] || '#808080';
  };

  const handleReportClick = () => {
    console.log('Report button clicked'); // Debugging log
    navigate('/report');
  };

  // Add this useEffect to fetch graph data when date changes
  useEffect(() => {
    if (date) {
      const formattedDate = moment(date).format('YYYY-MM-DD');
      fetchGraphData(formattedDate);
    }
  }, [date]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-white">
      <Content className="p-8">
        {/* Print and Back Buttons */}
        <div className="flex justify-end mb-4">
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            size="large"
          >
            Print Report
          </Button>
          <Button 
            type="default" 
            onClick={() => navigate('/supervisor/energy-monitoring')}
            size="large"
            className="ml-4"
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
        </div>

        {/* Container for both pages side by side */}
        <div className="flex justify-center gap-8">
          {/* Page 1 */}
          <div className="w-[21cm] bg-white shadow-lg rounded-lg">
            {/* Page 1 content remains the same */}
            <div className="page-container">
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b">
                <img src={cmtiImage} alt="CMTI Logo" className="h-16" />
                <div className="text-right">
                  <Text className="block text-lg">{moment(date).format('MMMM D, YYYY')}</Text>
                  <div className="mt-2">
                      <Text className="block mt-2 text-blue-800">
                  Weekly Cost: <span className="font-semibold">Rs. {costData?.total_weekly_cost?.toFixed(2) || '0.00'}</span>
                  <br />
                  Monthly Cost: <span className="font-semibold">Rs. {costData?.total_monthly_cost?.toFixed(2) || '0.00'}</span>
                </Text>
                  </div>
                </div>
              </div>

              {/* Workshop Details */}
              <div className="p-6">
                <Title level={4} style={{ color: '#000', marginBottom: '4px' }}>SMDDC, Workshop</Title>
                <Text className="block">CMTI,</Text>
                <Text>Bengaluru</Text>
              </div>

              {/* Energy Data Table */}
              <div className="p-6">
                <Title level={5} style={{ color: '#000', marginBottom: '16px' }}>
                  Energy Data from: {moment(date).format('MMMM D, YYYY')}
                </Title>
                <Table 
                  dataSource={shiftData || []}
                  columns={columns}
                  pagination={false}
                  bordered
                  className="mt-4"
                  size="small"
                  summary={(pageData) => {
                    const totalEnergy = pageData.reduce((sum, row) => sum + (Number(row.total_energy) || 0), 0);
                    const totalCost = pageData.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0);
                    return (
                      <Table.Summary.Row style={{ backgroundColor: '#f0f8ff', fontWeight: 'bold' }}>
                        <Table.Summary.Cell>Total Usage:</Table.Summary.Cell>
                        <Table.Summary.Cell colSpan={3}></Table.Summary.Cell>
                        <Table.Summary.Cell>{totalEnergy.toFixed(2)} kWh</Table.Summary.Cell>
                        <Table.Summary.Cell>₹{totalCost.toFixed(2)}</Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </div>

              {/* Total display below table */}
              <div className="text-right px-6">
                <Text strong>Total Usage: {shiftData?.reduce((acc, curr) => acc + (Number(curr.total_energy) || 0), 0).toFixed(2)} kWh</Text>
                <Text strong className="ml-8">Total Cost: ₹{shiftData?.reduce((acc, curr) => acc + (Number(curr.total_cost) || 0), 0).toFixed(2)}</Text>
              </div>

              {/* Charts Section */}
              <div className="p-6 grid grid-cols-2 gap-16">
                {/* Weekly Graph */}
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  {loading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <ReactECharts 
                      option={getBarChartOptions()} 
                      style={{ height: '300px' }}
                      notMerge={true}
                    />
                  )}
                </div>

                {/* Machine Distribution Doughnut Chart */}
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <ReactECharts 
                    option={getDoughnutChartOptions()} 
                    style={{ height: '300px' }}
                  />
                </div>
              </div>

              <div className="text-right p-4 border-t">
                <Text>Page 1 of 2</Text>
              </div>
            </div>
          </div>

          {/* Page 2 */}
          <div className="w-[21cm] bg-white shadow-lg rounded-lg">
            {/* Page 2 content remains the same */}
            <div className="page-container mt-8">
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b">
                <img src={cmtiImage} alt="CMTI Logo" className="h-16" />
                <Text>{moment(date).format('MMMM D, YYYY')}</Text>
              </div>

              {/* Energy Time Details Chart */}
              <div className="p-6">
                <Title level={5}>Energy Time Details of Workshop - {moment(date).format('MMMM D, YYYY')}</Title>
                <ReactECharts 
                  option={getEnergyTimeChartOptions()} 
                  style={{ height: '400px' }} 
                />
              </div>

              {/* Workshop Production */}
              <div className="p-6 border-t">
                <Title level={5} className="text-blue-800 mb-4">Workshop Production</Title>
                {loading ? (
                  <Spin />
                ) : workshopProductionData.length > 0 ? (
                  <>
                    <div style={{ height: '400px', width: '100%' }}>
                      <HighchartsReact
                        highcharts={Highcharts}
                        options={getProductionTimelineOptions()}
                        constructorType={'chart'}
                      />
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-[#006400] mr-2"></div>
                        <span>Production</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-[#FF8C00] mr-2"></div>
                        <span>ON</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-[#808080] mr-2"></div>
                        <span>OFF</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">No production data available</div>
                )}
              </div>

              <div className="text-right p-4 border-t">
                <Text>Page 2 of 2</Text>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default Report; 
