import React from 'react';
import { Typography, Button, Card, Table, Space, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, machineData } = location.state || { date: null, machineData: [] };

  // Calculate total energy and cost
  const totalEnergy = machineData.reduce((sum, machine) => sum + machine.energy, 0);
  const totalCost = machineData.reduce((sum, machine) => sum + machine.cost, 0);
  const averageEnergy = totalEnergy / machineData.length;

  // Table columns configuration
  const columns = [
    {
      title: 'Machine Name',
      dataIndex: 'machine_name',
      key: 'machine_name',
      fixed: 'left',
    },
    {
      title: 'Energy Consumption (kWh)',
      dataIndex: 'energy',
      key: 'energy',
      render: (value) => value.toFixed(2),
      sorter: (a, b) => a.energy - b.energy,
    },
    {
      title: 'Cost (₹)',
      dataIndex: 'cost',
      key: 'cost',
      render: (value) => value.toFixed(2),
      sorter: (a, b) => a.cost - b.cost,
    },
    {
      title: 'Efficiency',
      key: 'efficiency',
      render: (_, record) => {
        const efficiency = ((record.energy / record.max_energy) * 100).toFixed(1);
        let color = '#22c55e';
        if (efficiency > 80) color = '#ef4444';
        else if (efficiency > 50) color = '#f59e0b';
        
        return <Text style={{ color }}>{efficiency}%</Text>;
      },
    },
  ];

  const handlePrint = async () => {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`energy-report-${date}.pdf`);
  };

  return (
    <div style={{ padding: '20px' }} id="report-content">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Space>
          <Button 
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/supervisor/energy-monitoring-bel')}
            style={{
              backgroundColor: '#1890ff',
              borderRadius: '6px'
            }}
          >
            Back
          </Button>
        </Space>
        <Title 
          level={2} 
          style={{ 
            margin: 0,
            color: '#000000',
            fontWeight: 600
          }}
        >
          Energy Consumption Report
        </Title>
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

      {/* Report Date */}
      <Card className="mb-6">
        <Text strong>Report Date: </Text>
        <Text>{moment(date).format('MMMM D, YYYY')}</Text>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Energy Consumption"
              value={totalEnergy}
              precision={2}
              suffix="kWh"
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Cost"
              value={totalCost}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Energy per Machine"
              value={averageEnergy}
              precision={2}
              suffix="kWh"
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Machine Data */}
      <Card title="Machine-wise Energy Consumption" className="mb-6">
        <Table
          columns={columns}
          dataSource={machineData}
          rowKey="id"
          scroll={{ x: true }}
          pagination={false}
        />
      </Card>

      {/* Footer */}
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Generated on {moment().format('MMMM D, YYYY [at] HH:mm:ss')}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Report; 