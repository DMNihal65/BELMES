import React, { useRef } from 'react';
import { Typography, Button, Table, Space, Row, Col } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import belLogo from '../../../assets/bel.png';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const { Title, Text } = Typography;

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, machineData, returnPath , fromDate , toDate} = location.state || { date: null, machineData: [], returnPath: '/supervisor/energy-monitoring-bel' };
  const reportRef = useRef(null);
  const chartRef = useRef(null);
  
  // Calculate totals from the new data format
  const totalEnergy = machineData.reduce((sum, machine) => sum + (machine.energy || 0), 0);
  const totalFirstShift = machineData.reduce((sum, machine) => sum + (machine.first_shift || 0), 0);
  const totalSecondShift = machineData.reduce((sum, machine) => sum + (machine.second_shift || 0), 0);
  const totalThirdShift = machineData.reduce((sum, machine) => sum + (machine.third_shift || 0), 0);
  const totalCost = machineData.reduce((sum, machine) => sum + (machine.cost || 0), 0);

  // Table columns configuration
  const columns = [
    {
      title: 'MACHINES',
      dataIndex: 'machine_name',
      key: 'machine_name',
      width: '25%',
    },
    {
      title: 'FIRST SHIFT (kWh)',
      dataIndex: 'first_shift',
      key: 'first_shift',
      render: (value) => parseFloat(value || 0).toFixed(3),
      align: 'right',
      width: '15%',
    },
    {
      title: 'SECOND SHIFT (kWh)',
      dataIndex: 'second_shift',
      key: 'second_shift',
      render: (value) => parseFloat(value || 0).toFixed(3),
      align: 'right',
      width: '15%',
    },
    {
      title: 'THIRD SHIFT (kWh)',
      dataIndex: 'third_shift',
      key: 'third_shift',
      render: (value) => parseFloat(value || 0).toFixed(3),
      align: 'right',
      width: '15%',
    },
    {
      title: 'ALL SHIFTS (kWh)',
      dataIndex: 'energy',
      key: 'energy',
      render: (value) => parseFloat(value || 0).toFixed(3),
      align: 'right',
      width: '15%',
    },
    {
      title: 'TOTAL COST (₹)',
      dataIndex: 'cost',
      key: 'cost',
      render: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
      align: 'right',
      width: '15%',
    }
  ];

  // Prepare data for stacked bar chart - limit to top 10 machines for better readability
  const getChartOptions = () => {
    const sortedData = [...machineData].sort((a, b) => (b.energy || 0) - (a.energy || 0));
    const topMachines = sortedData.slice(0, Math.min(10, sortedData.length));
    
    return {
      chart: {
        type: 'column',
        height: 500,
        style: {
          fontFamily: 'Arial, sans-serif'
        }
      },
      title: {
        text: 'Energy Consumption by Machine and Shift',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }
      },
      subtitle: {
        text: `Date: ${date ? moment(date).format('MMMM D, YYYY') : moment().format('MMMM D, YYYY')}`,
        style: {
          fontSize: '14px',
          color: '#666'
        }
      },
      xAxis: {
        categories: topMachines.map(machine => machine.machine_name),
        title: {
          text: 'Machines',
          style: {
            fontWeight: 'bold',
            color: '#333'
          }
        },
        labels: {
          rotation: -45,
          style: {
            fontSize: '12px',
            color: '#333'
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Energy (kWh)',
          style: {
            fontWeight: 'bold',
            color: '#333'
          }
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: '#333',
            textOutline: 'none'
          },
          formatter: function() {
            return this.total.toFixed(2);
          }
        },
        gridLineColor: '#e6e6e6'
      },
      legend: {
        align: 'right',
        verticalAlign: 'top',
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        layout: 'vertical',
        x: -10,
        y: 70,
        shadow: false
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y:.2f} kWh<br/>Total: {point.stackTotal:.2f} kWh',
        style: {
          fontSize: '12px'
        }
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
            formatter: function() {
              if (this.y > 0.05) {
                return this.y.toFixed(2);
              }
            },
            style: {
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#fff',
              textOutline: '1px contrast'
            }
          },
          borderWidth: 0
        }
      },
      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      series: [
        {
          name: 'First Shift',
          data: topMachines.map(machine => parseFloat(machine.first_shift || 0)),
          color: '#34D399' // green
        },
        {
          name: 'Second Shift',
          data: topMachines.map(machine => parseFloat(machine.second_shift || 0)),
          color: '#FBBF24' // yellow
        },
        {
          name: 'Third Shift',
          data: topMachines.map(machine => parseFloat(machine.third_shift || 0)),
          color: '#EF4444' // red
        }
      ]
    };
  };

  // Add this function for landscape-optimized chart options
  const getLandscapeChartOptions = () => {
    // Remove the slice limit to show all machines
    const displayedMachines = machineData;
    
    return {
      chart: {
        type: 'column',
        height: 500,
        width: 1000,
        style: {
          fontFamily: 'Arial, sans-serif'
        },
        spacing: [20, 20, 20, 20]
      },
      title: {
        text: 'Energy Consumption by Machine and Shift',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }
      },
      subtitle: {
        text: `Date: ${date ? moment(date).format('MMMM D, YYYY') : moment().format('MMMM D, YYYY')}`,
        style: {
          fontSize: '14px',
          color: '#666'
        }
      },
      xAxis: {
        categories: displayedMachines.map(machine => machine.machine_name),
        title: {
          text: 'Machines',
          style: {
            fontWeight: 'bold',
            color: '#333'
          }
        },
        labels: {
          rotation: -45,
          style: {
            fontSize: '10px', // Reduced font size for better fit
            color: '#333'
          },
          y: 35,
          x: -5
        },
        tickLength: 0
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Energy (kWh)',
          style: {
            fontWeight: 'bold',
            color: '#333'
          }
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: '#333',
            textOutline: 'none'
          },
          formatter: function() {
            return (this.total || 0).toFixed(2);
          }
        },
        gridLineColor: '#e6e6e6',
        labels: {
          formatter: function() {
            return this.value.toFixed(2);
          }
        }
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        layout: 'horizontal',
        shadow: false,
        itemStyle: {
          fontWeight: 'bold'
        }
      },
      tooltip: {
        shared: true,
        formatter: function() {
          let tooltipText = `<b>${this.x}</b><br/>`;
          
          this.points.forEach(point => {
            tooltipText += `<span style="color:${point.color}">●</span> ${point.series.name}: ${point.y.toFixed(2)} kWh<br/>`;
          });
          
          return tooltipText;
        },
        style: {
          fontSize: '12px'
        }
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
            formatter: function() {
              if (this.y > 0.05) {
                return this.y.toFixed(2);
              }
            },
            style: {
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#fff',
              textOutline: '1px contrast'
            },
            y: -5
          },
          borderWidth: 0,
          pointPadding: 0.1,
          groupPadding: 0.2
        }
      },
      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      series: [
        {
          name: 'First Shift',
          type: 'column',
          data: displayedMachines.map(machine => parseFloat(machine.first_shift || 0)),
          color: '#34D399', // green
          stack: 'shifts'
        },
        {
          name: 'Second Shift',
          type: 'column',
          data: displayedMachines.map(machine => parseFloat(machine.second_shift || 0)),
          color: '#FBBF24', // yellow
          stack: 'shifts'
        },
        {
          name: 'Third Shift',
          type: 'column',
          data: displayedMachines.map(machine => parseFloat(machine.third_shift || 0)),
          color: '#EF4444', // red
          stack: 'shifts'
        },
        {
          name: 'Total Energy',
          type: 'column',
          data: displayedMachines.map(machine => parseFloat(machine.energy || 0)),
          color: '#3B82F6', // blue
          stack: 'total',
          pointPadding: 0.1,
          pointPlacement: 0,
          dataLabels: {
            enabled: true,
            format: '{point.y:.2f}',
            style: {
              fontWeight: 'bold',
              color: '#fff',
              textOutline: '1px contrast'
            }
          }
        }
      ]
    };
  };

  // Energy distribution summary data
  const energyDistributionData = [
    {
      key: '1',
      shift: 'First Shift',
      energy: totalFirstShift.toFixed(2),
      percentage: totalEnergy > 0 ? `${((totalFirstShift / totalEnergy) * 100).toFixed(1)}%` : '0%'
    },
    {
      key: '2',
      shift: 'Second Shift',
      energy: totalSecondShift.toFixed(2),
      percentage: totalEnergy > 0 ? `${((totalSecondShift / totalEnergy) * 100).toFixed(1)}%` : '0%'
    },
    {
      key: '3',
      shift: 'Third Shift',
      energy: totalThirdShift.toFixed(2),
      percentage: totalEnergy > 0 ? `${((totalThirdShift / totalEnergy) * 100).toFixed(1)}%` : '0%'
    },
    {
      key: '4',
      shift: 'Total',
      energy: totalEnergy.toFixed(2),
      percentage: '100%'
    }
  ];

  // Function to generate a PDF with multiple A4 pages (portrait and landscape)
  const handlePrint = async () => {
    try {
      // Set up loading indicator
      const loadingElement = document.createElement('div');
      loadingElement.style.position = 'fixed';
      loadingElement.style.top = '0';
      loadingElement.style.left = '0';
      loadingElement.style.width = '100%';
      loadingElement.style.height = '100%';
      loadingElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
      loadingElement.style.display = 'flex';
      loadingElement.style.justifyContent = 'center';
      loadingElement.style.alignItems = 'center';
      loadingElement.style.zIndex = '9999';
      loadingElement.innerHTML = '<div style="background: white; padding: 20px; border-radius: 8px;"><h3>Generating PDF, please wait...</h3></div>';
      document.body.appendChild(loadingElement);
      
      // Create a new PDF with first page in portrait orientation
    const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Capture and add the first page (portrait)
      const reportElement = document.getElementById('report-content');
      const reportCanvas = await html2canvas(reportElement, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const reportImgData = reportCanvas.toDataURL('image/jpeg', 1.0);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const reportWidth = pageWidth - 20;
      const reportHeight = (reportCanvas.height * reportWidth) / reportCanvas.width;
      
      pdf.addImage(reportImgData, 'JPEG', 10, 10, reportWidth, Math.min(reportHeight, 277));
      
      // Add a second page in landscape orientation
      pdf.addPage([297, 210], 'landscape');
      
      // Capture and add the second page (landscape)
      const chartElement = document.getElementById('chart-content');
      const chartCanvas = await html2canvas(chartElement, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const chartImgData = chartCanvas.toDataURL('image/jpeg', 1.0);
      const landscapeWidth = 277; // 297 - 20 (margins)
      const landscapeHeight = (chartCanvas.height * landscapeWidth) / chartCanvas.width;
      
      pdf.addImage(chartImgData, 'JPEG', 10, 10, landscapeWidth, Math.min(landscapeHeight, 190));
      
      // Save the PDF
      pdf.save(`BEL-Energy-Report-${date || moment().format('YYYY-MM-DD')}.pdf`);
      
      // Remove loading element
      document.body.removeChild(loadingElement);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
      
      // Remove loading element in case of error
      const loadingElement = document.querySelector('div[style*="position: fixed"]');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }
    }
  };

  // Format date for display
  const formattedDate = date ? moment(date).format('MMMM D, YYYY') : moment().format('MMMM D, YYYY');

  return (
    <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: '#f0f2f5',
        padding: '12px 16px',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/energy-monitoring-bel')}
            style={{ marginRight: '12px' }}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>Energy Consumption Report</Title>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            style={{
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb'
            }}
          >
            Export PDF
          </Button>
        </Space>
      </div>
      
      <Row gutter={[24, 24]} style={{ marginBottom: '20px' }}>
        {/* First A4 page - Table */}
        <Col xs={24}>
          <div 
            id="report-content" 
            ref={reportRef}
            style={{ 
              backgroundColor: 'white', 
              padding: '24px', 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: '210mm', // A4 width
              width: '100%',
              minHeight: '297mm', // A4 height
              margin: '0 auto',
              overflow: 'hidden'
            }}
          >
        {/* Header Section with Logo and Date Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <img 
              src={belLogo} 
              alt="Bharat Electronics Limited" 
              style={{ height: '50px' }}
            />
            
            <div style={{ marginTop: '20px' }}>
              <Text strong style={{ display: 'block', fontSize: '16px' }}>FAB-C workshop</Text>
              <Text style={{ display: 'block', color: '#666' }}>BEL</Text>
              <Text style={{ display: 'block', color: '#1890ff' }}>Bengaluru</Text>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text strong style={{ fontSize: '16px' }}>
              From Date: {fromDate} &nbsp;&nbsp;|&nbsp;&nbsp; To Date: {toDate}
            </Text>
                <Text style={{ display: 'block', color: '#666', marginTop: '8px' }}>
                  Report Generated: {moment().format('MMMM D, YYYY, h:mm A')}
            </Text>
          </div>
        </div>
        
            {/* Main Title */}
            <div style={{ textAlign: 'center', margin: '20px 0', border: '1px solid #e8e8e8', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <Title level={3} style={{ margin: 0 }}>Energy Consumption Report</Title>
              <Text style={{ display: 'block', color: '#666', marginTop: '8px' }}>
                Data for {formattedDate}
          </Text>
        </div>
        
        {/* Energy Table */}
        <Table
          columns={columns}
          dataSource={machineData}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
          style={{ marginBottom: '20px' }}
          summary={pageData => {
            return (
              <>
                <Table.Summary.Row style={{ backgroundColor: '#f5f5f5' }}>
                  <Table.Summary.Cell index={0}><Text strong>Total Usage:</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right"><Text strong>{totalFirstShift.toFixed(2)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right"><Text strong>{totalSecondShift.toFixed(2)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right"><Text strong>{totalThirdShift.toFixed(2)}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right"><Text strong>{totalEnergy.toFixed(2)} kWh</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right"><Text strong>₹{totalCost.toFixed(2)}</Text></Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            );
          }}
        />
        
            {/* Page Number */}
        <div style={{ 
              textAlign: 'right', 
              marginTop: '40px',
              borderTop: '1px solid #e8e8e8',
              paddingTop: '12px',
              color: '#888'
            }}>
              <Text>BEL Energy Monitoring System • Page 1 of 2</Text>
            </div>
          </div>
        </Col>
        
        {/* Second A4 page - Graph (Landscape) */}
        <Col xs={24}>
          <div 
            id="chart-content" 
            ref={chartRef}
            style={{ 
              backgroundColor: 'white', 
              padding: '24px', 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: '297mm', // A4 landscape width
              width: '100%',
              minHeight: '210mm', // A4 landscape height
              margin: '0 auto',
              overflow: 'hidden'
            }}
          >
            {/* Header Section with Logo and Date Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <img 
                  src={belLogo} 
                  alt="Bharat Electronics Limited" 
                  style={{ height: '50px' }}
                />
                
                <div style={{ marginTop: '20px' }}>
                  <Text strong style={{ display: 'block', fontSize: '16px' }}>FAB-C workshop</Text>
                  <Text style={{ display: 'block', color: '#666' }}>BEL</Text>
                  <Text style={{ display: 'block', color: '#1890ff' }}>Bengaluru</Text>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text strong style={{ display: 'block', fontSize: '16px' }}>
                  {formattedDate}
                </Text>
                <Text style={{ display: 'block', color: '#666', marginTop: '8px' }}>
                  Report Generated: {moment().format('MMMM D, YYYY, h:mm A')}
                </Text>
              </div>
            </div>
            
            {/* Main Title */}
            <div style={{ textAlign: 'center', margin: '20px 0', border: '1px solid #e8e8e8', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <Title level={3} style={{ margin: 0 }}>Energy Consumption Analysis</Title>
              <Text style={{ display: 'block', color: '#666', marginTop: '8px' }}>
                Visual representation for {formattedDate}
              </Text>
            </div>
            
            {/* Stacked Bar Chart for energy by shift - optimized for landscape */}
            <div style={{ marginBottom: '30px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '8px' }}>
              <HighchartsReact
                highcharts={Highcharts}
                options={getLandscapeChartOptions()}
              />
        </div>
        
        {/* Page Number */}
            <div style={{ 
              textAlign: 'right', 
              marginTop: '40px',
              borderTop: '1px solid #e8e8e8',
              paddingTop: '12px',
              color: '#888'
            }}>
              <Text>BEL Energy Monitoring System • Page 2 of 2</Text>
        </div>
      </div>
        </Col>
      </Row>
    </div>
  );
};

export default Report; 