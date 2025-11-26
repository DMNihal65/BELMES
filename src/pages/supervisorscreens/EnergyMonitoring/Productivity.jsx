import React, { useEffect } from 'react';
import { Layout, Typography, DatePicker, Button, Card, Space, Empty, Spin } from 'antd';
import { BarChartOutlined, FileTextOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsMore from 'highcharts/highcharts-more';
import solidGauge from 'highcharts/modules/solid-gauge';
import HighchartsXRange from 'highcharts/modules/xrange';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import cmtiImage from '../../../assets/cmti.png';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import useEnergyStore from '../../../store/energyMonitoring';
import { message } from 'antd';

// Initialize Highcharts modules
highchartsMore(Highcharts);
solidGauge(Highcharts);

// Initialize xrange module
if (typeof Highcharts === 'object') {
  HighchartsXRange(Highcharts);
}

const { Content } = Layout;
const { Title, Text } = Typography;

function Productivity() {
  const navigate = useNavigate();
  const { 
    shiftLiveData, 
    machines, 
    selectedDate,
    showReport,
    reportData,
    isLoading,
    fetchShiftLiveData,
    fetchShiftHistoricalData,
    fetchReportData,
    clearSelectedDate,
    setSelectedDate,
    setShowReport,
    fetchMachines
  } = useEnergyStore();

  const getGaugeOptions = (machine) => ({
    chart: {
      type: 'solidgauge',
      height: '200px',
      backgroundColor: 'transparent',
    },
    title: {
      text: machine.machine_name,
      style: { fontSize: '16px', fontWeight: '600' }
    },
    pane: {
      center: ['50%', '50%'],
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: [{
        backgroundColor: '#EEE',
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc',
        borderWidth: 0
      }]
    },
    tooltip: {
      enabled: true,
      formatter: function() {
        return `<b>${machine.machine_name}</b><br/>
                Energy: ${this.y} kWh<br/>
                Total: ${machine?.total_energy || 0} kWh`;
      }
    },
    yAxis: {
      min: 0,
      max: Math.max(machine?.first_shift || 0, 100),
      stops: [
        [0.1, '#34D399'],
        [0.5, '#FBBF24'],
        [0.9, '#EF4444']
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      labels: {
        y: 16,
        style: {
          fontSize: '12px'
        }
      }
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: -25,
          borderWidth: 0,
          useHTML: true
        }
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      name: 'Energy',
      data: [machine?.first_shift || 0],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:20px;color:black">{y:.1f}</span><br/>' +
               '<span style="font-size:12px;color:silver">kWh</span></div>'
      }
    }]
  });

  const handleDateChange = async (date) => {
    try {
      // Ensure machines are loaded first
      if (machines.length === 0) {
        await fetchMachines();
      }

      if (!date) {
        clearSelectedDate();
        await fetchShiftLiveData();
      } else {
        const formattedDate = date.format('YYYY-MM-DD');
        setSelectedDate(formattedDate);
        await fetchShiftHistoricalData(formattedDate);
      }
    } catch (error) {
      console.error('Error handling date change:', error);
      message.error('Failed to fetch data');
    }
  };

  const handleReportClick = () => {
    if (selectedDate) {
      navigate(`/report?date=${selectedDate}`, {
        state: { date: selectedDate }
      });
    }
  };

  const handleBackFromReport = () => {
    setShowReport(false);
  };

  // Fetch machines when component mounts
  useEffect(() => {
    fetchMachines();
  }, []);

  // Fetch live data when machines are loaded
  useEffect(() => {
    if (machines.length > 0 && !selectedDate) {
      fetchShiftLiveData();
      const interval = setInterval(fetchShiftLiveData, 60000);
      return () => clearInterval(interval);
    }
  }, [machines, selectedDate]);

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          {!showReport ? (
            <>
              <Card 
                className="mb-6 shadow-lg rounded-xl border-0 backdrop-blur-sm bg-white/90"
                styles={{ body: { padding: '24px' } }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <BarChartOutlined className="text-2xl text-emerald-600" />
                    </div>
                    <div>
                      <Title level={4} className="!m-0">
                        Energy Monitoring Dashboard
                      </Title>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <Text type="secondary">
                          {selectedDate ? 
                            `Historical Data for ${moment(selectedDate).format('MMMM D, YYYY')}` : 
                            'Live Data (Auto-updating)'}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Space size="middle" className="flex-wrap">
                    <DatePicker 
                      onChange={handleDateChange}
                      value={selectedDate ? moment(selectedDate) : null}
                      className="w-44"
                      placeholder="Select date"
                      allowClear
                      format="YYYY-MM-DD"
                      disabled={isLoading}
                    />
                    {selectedDate && (
                      <Button
                        type="primary"
                        onClick={handleReportClick}
                        icon={<FileTextOutlined />}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        View Report
                      </Button>
                    )}
                    {selectedDate ? (
                      <Button
                        type="primary"
                        onClick={fetchShiftLiveData}
                        icon={<ReloadOutlined spin={isLoading} />}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={isLoading}
                      >
                        Refresh Live
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={fetchShiftLiveData}
                        icon={<ReloadOutlined spin={isLoading} />}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={isLoading}
                      >
                        Refresh Live
                      </Button>
                    )}
                  </Space>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.isArray(shiftLiveData) && shiftLiveData.length > 0 ? (
                  shiftLiveData.map((machine, index) => {
                    return (
                      <Card 
                        key={machine.id || index}
                        className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 backdrop-blur-sm bg-white/90 transform hover:-translate-y-1"
                        bodyStyle={{ padding: '24px' }}
                      >
                        <HighchartsReact
                          highcharts={Highcharts}
                          options={getGaugeOptions(machine)}
                        />
                        <div className="text-center mt-4">
                          <Text strong className="text-lg block mb-3 text-gray-800">
                            {machine.machine_name}
                          </Text>
                          <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center px-3">
                              <Text type="secondary" className="text-sm">Energy:</Text>
                              <Text strong className="text-emerald-600">
                                {machine.first_shift?.toFixed(2) || 0} kWh
                              </Text>
                            </div>
                            <div className="flex justify-between items-center px-3">
                              <Text type="secondary" className="text-sm">Cost:</Text>
                              <Text strong className="text-emerald-600">
                                ₹{machine.total_cost?.toFixed(2) || 0}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full flex justify-center items-center h-64 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                    <Empty 
                      description={
                        <div className="text-center space-y-4">
                          <Text className="text-gray-500 text-lg block">
                            {selectedDate ? 'No data available for selected date' : 'No live data available'}
                          </Text>
                          <Button 
                            type="primary"
                            onClick={fetchShiftLiveData}
                            icon={<ReloadOutlined />}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-md"
                          >
                            Refresh Data
                          </Button>
                        </div>
                      }
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <Card 
              className="mb-6 shadow-lg rounded-xl border-0 backdrop-blur-sm bg-white/90"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={handleBackFromReport}
                    className="flex items-center"
                  >
                    Back
                  </Button>
                  <Title level={4} className="!m-0">
                    Energy Report - {selectedDate ? moment(selectedDate).format('MMMM D, YYYY') : 'No Date Selected'}
                  </Title>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <Title level={1} className="text-center">
                  hiii
                </Title>
              </div>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default Productivity; 