import React, { useState } from 'react';
import { Card, Table, Button, Space, Upload, message, Modal, Form, Input } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const Fixtures = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // Complete data for fixtures
  const [fixturesData, setFixturesData] = useState([
    { key: '1', project: 'RFFE', part_no: '62805080AA', rev: 'B', description: 'Closing Cover', fixture_no: 'FX~62805080AA~70.80~Rev.01' },
    { key: '2', project: 'RFFE', part_no: '62805275AA', rev: 'A', description: 'Hyper Cover', fixture_no: 'FX~62805275AA~30~Rev.01' },
    { key: '3', project: 'RFFE', part_no: '63759630AA', rev: '--', description: 'HYPER STRUCTURE', fixture_no: 'FX~63759630AA~10~REV 01' },
    { key: '4', project: 'DCU2', part_no: '62027914AA', rev: 'B', description: 'STRUCTURE FI 2 CMS', fixture_no: 'FX~62027914AA~10~Rev.01' },
    { key: '5', project: 'DCU2', part_no: '62027915AA', rev: 'A', description: 'IF2 MICROWAVE COVER', fixture_no: 'FX~62027922AA~10~Rev.01' },
    { key: '6', project: 'DCU2', part_no: '62027922AA', rev: 'B', description: 'OL2 REF STRUCTURE', fixture_no: 'FX~62027922AA~10~Rev.01' },
    { key: '7', project: 'DCU2', part_no: '62027923AA', rev: 'A', description: 'MICROWAVE COVER OL2 REF', fixture_no: 'FX~62027923AA~10~Rev.01' },
    { key: '8', project: 'DCU2', part_no: '62028419AA', rev: 'A', description: 'POWER SUPPLY DC2 DRAIN', fixture_no: 'FX~62028419~10~REV 01' },
    { key: '9', project: 'DCU2', part_no: '62027912AA', rev: 'A', description: 'DC2 DRAIN', fixture_no: 'FX~62027912~10~REV01' },
    { key: '10', project: 'DCU2', part_no: '62029135AA', rev: '--.--', description: 'FRONT FACE', fixture_no: 'FX~62029135~10~Rev.01' },
    { key: '11', project: 'DCU1', part_no: '62024188AA', rev: 'A', description: 'DRAIN DC1', fixture_no: 'FX~62024188AA~10~Rev.01' },
    { key: '12', project: 'DCU1', part_no: '62028418AA', rev: 'A', description: 'POWER SUPPLY DC1 DRAIN', fixture_no: 'FX~62028418AA~10~Rev.01' },
    { key: '13', project: 'DCU1', part_no: '62027494AA', rev: 'C', description: 'OL1 STRUCTURE', fixture_no: 'FX~62027494AA~10~Rev.01' },
    { key: '14', project: 'DCU1', part_no: '62027457AA', rev: 'D', description: 'FI1 STRUCTURE', fixture_no: 'FX~62027457AA~Rev.01' },
    { key: '15', project: 'DCU1', part_no: '62028609AA', rev: 'A', description: 'FI1 MICROWAVE COVER', fixture_no: 'FX~62028609AA~10~Rev.01' },
    { key: '16', project: 'IS&A1', part_no: '213301840171', rev: 'A', description: 'Body', fixture_no: 'FX~21330184~00~Rev.01' },
    { key: '17', project: 'IS&A1', part_no: '213301850162', rev: 'A', description: 'Barrier', fixture_no: 'FX~21330185~20~Rev.01' },
    { key: '18', project: 'IS&A1', part_no: '213301910108', rev: 'A', description: 'Solenoid Bobbin', fixture_no: 'FX~21330191~20.30.40~Rev.01' },
    { key: '19', project: 'SSTD', part_no: '61036583', rev: 'B', description: 'Structure', fixture_no: 'FX~61036583~50.60~Rev.01' },
    { key: '20', project: 'SLB', part_no: '61039470', rev: 'C', description: 'Structure', fixture_no: 'FX~61039470~50.60~Rev.01' },
  ]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleSubmit = (values) => {
    const newFixture = {
      key: `${fixturesData.length + 1}`,
      project: values.project,
      part_no: values.part_no,
      rev: values.rev,
      description: values.description,
      fixture_no: values.fixture_no,
    };
    
    setFixturesData([...fixturesData, newFixture]);
    message.success('Fixture added successfully');
    handleCancel();
  };

  const handleDownloadData = () => {
    const ws = XLSX.utils.json_to_sheet(fixturesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fixtures Data");
    XLSX.writeFile(wb, "fixtures_template.xlsx");
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            const formattedData = data.map((item, index) => ({
                key: `T${fixturesData.length + index + 1}`,
                project: item.project || '',
                part_no: item.part_no || '',
                rev: item.rev || '',
                description: item.description || '',
                fixture_no: item.fixture_no || '', 
            }));

            setFixturesData([...fixturesData, ...formattedData]);
            message.success(`Successfully added ${formattedData.length} tools`);
        } catch (error) {
            message.error('Error processing file');
            console.error(error);
        }
    };
    reader.readAsBinaryString(file);
    return false; // Prevent automatic upload
};

  const columns = [
    {
      title: 'Sl. No.',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      sorter: (a, b) => a.project.localeCompare(b.project),
      filterSearch: true,
      filters: [...new Set(fixturesData.map(item => item.project))].map(type => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.project.indexOf(value) === 0,
    },
    {
      title: 'Part No.',
      dataIndex: 'part_no',
      key: 'part_no',
      sorter: (a, b) => a.part_no.localeCompare(b.part_no),
      filterSearch: true,
        filters: [...new Set(fixturesData.map(item => item.part_no))].map(part_no => ({
          text: part_no,
          value: part_no,
        })),
        onFilter: (value, record) => record.part_no.indexOf(value) === 0,
    },
    {
      title: 'Rev',
      dataIndex: 'rev',
      key: 'rev',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Fixture No.',
      dataIndex: 'fixture_no',
      key: 'fixture_no',
      sorter: (a, b) => a.fixture_no.localeCompare(b.fixture_no),
      filterSearch: true,
        filters: [...new Set(fixturesData.map(item => item.fixture_no))].map(fixture_no => ({
          text: fixture_no,
          value: fixture_no,
        })),
        onFilter: (value, record) => record.fixture_no.indexOf(value) === 0,
    },
  ];

  return (
    <div>
      <Card 
        title="Fixtures"
        extra={
          <Space>
            <Button className='bg-sky-500 ' style={{ color: '#FFFFFF'}} onMouseEnter={(e) => e.currentTarget.style.color = '#0EA5E9'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}   onClick={showModal}>Add New Fixture</Button>
           <Button icon={<DownloadOutlined />} onClick={handleDownloadData}>
                  Download
                </Button>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleFileUpload}
            >
              <Button icon={<UploadOutlined />}>
                Upload Excel
              </Button>
            </Upload>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={fixturesData}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="Add New Fixture"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="project"
            label="Project"
            rules={[{ required: true, message: 'Please input the Project!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="part_no"
            label="Part No."
            rules={[{ required: true, message: 'Please input the Part No.!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="rev"
            label="Rev"
            rules={[{ required: true, message: 'Please input the Rev!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the Description!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="fixture_no"
            label="Fixture No."
            rules={[{ required: true, message: 'Please input the Fixture No.!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">Submit</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Fixtures;