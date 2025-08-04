import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  DatePicker, 
  Input, 
  Select, 
  Badge,
  Tooltip,
  Modal,
  Form,
  message,
  Alert,
  Statistic,
  Row,
  Col,
  Progress
} from 'antd';
import { 
  CalendarOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import moment from 'moment';
import dayjs from 'dayjs';
import useMachineMaintenanceStore from '../../../store/maintenance';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const MachineCalibrationDueDates = () => {
  const [loading, setLoading] = useState(false);
  const [calibrationData, setCalibrationData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();

  const { fetchAllMachines } = useMachineMaintenanceStore();

  // Mock data for calibration due dates
  const mockCalibrationData = [
    {
      id: 1,
      machine_id: 'M001',
      machine_name: 'CNC Lathe - DMU 60',
      machine_type: 'CNC Lathe',
      instrument_name: 'Digital Caliper',
      instrument_id: 'CAL-001',
      last_calibration_date: '2024-01-15',
      calibration_due_date: '2024-07-15',
      calibration_interval: '6 months',
      responsible_person: 'John Smith',
      status: 'due_soon', // due_soon, overdue, completed, upcoming
      priority: 'high',
      location: 'Shop Floor A',
      manufacturer: 'Mitutoyo',
      model: '500-196-30',
      accuracy: '±0.02mm',
      remarks: 'Regular calibration required'
    },
    {
      id: 2,
      machine_id: 'M002',
      machine_name: 'CNC Milling - VMC 800',
      machine_type: 'CNC Milling',
      instrument_name: 'Dial Indicator',
      instrument_id: 'DIAL-002',
      last_calibration_date: '2024-02-20',
      calibration_due_date: '2024-05-20',
      calibration_interval: '3 months',
      responsible_person: 'Sarah Johnson',
      status: 'overdue',
      priority: 'critical',
      location: 'Shop Floor B',
      manufacturer: 'Starrett',
      model: '196-5',
      accuracy: '±0.01mm',
      remarks: 'Overdue - Immediate attention required'
    },
    {
      id: 3,
      machine_id: 'M003',
      machine_name: 'EDM Machine - ROBOFIL 240',
      machine_type: 'EDM',
      instrument_name: 'Micrometer',
      instrument_id: 'MIC-003',
      last_calibration_date: '2024-03-10',
      calibration_due_date: '2024-09-10',
      calibration_interval: '6 months',
      responsible_person: 'Mike Wilson',
      status: 'upcoming',
      priority: 'medium',
      location: 'Shop Floor C',
      manufacturer: 'Mitutoyo',
      model: '293-340-30',
      accuracy: '±0.001mm',
      remarks: 'Scheduled for next month'
    },
    {
      id: 4,
      machine_id: 'M004',
      machine_name: 'Turning Center - CTX BETA 1250',
      machine_type: 'Turning Center',
      instrument_name: 'Height Gauge',
      instrument_id: 'HG-004',
      last_calibration_date: '2024-01-05',
      calibration_due_date: '2024-04-05',
      calibration_interval: '3 months',
      responsible_person: 'David Brown',
      status: 'completed',
      priority: 'low',
      location: 'Shop Floor A',
      manufacturer: 'Mitutoyo',
      model: '192-101',
      accuracy: '±0.02mm',
      remarks: 'Calibration completed on time'
    },
    {
      id: 5,
      machine_id: 'M005',
      machine_name: '5-Axis Milling - DMU 60MB',
      machine_type: '5-Axis Milling',
      instrument_name: 'Surface Plate',
      instrument_id: 'SP-005',
      last_calibration_date: '2024-02-28',
      calibration_due_date: '2024-08-28',
      calibration_interval: '6 months',
      responsible_person: 'Lisa Chen',
      status: 'due_soon',
      priority: 'high',
      location: 'Quality Lab',
      manufacturer: 'Starrett',
      model: '123-456',
      accuracy: 'Grade 0',
      remarks: 'Due within 30 days'
    }
  ];

  useEffect(() => {
    fetchCalibrationData();
  }, []);

  const fetchCalibrationData = async () => {
    try {
      setLoading(true);
      const response = await fetchAllMachines();
      console.log('API Response:', response);
      
      // Filter out default machines and transform the API data
      const filteredResponse = response.filter(machine => 
        machine.type !== 'Default' && 
        machine.make !== 'Default' && 
        machine.model !== 'Default'
      );
      
      console.log('Filtered Response (excluding Default machines):', filteredResponse);
      
      // Transform the filtered API data to match our table structure
      const transformedData = filteredResponse.map((machine, index) => ({
        id: machine.id || index + 1,
        machine_id: machine.work_center_id || machine.id,
        machine_name: machine.make || machine.machine_name || `Machine ${machine.id}`,
        machine_type: machine.type || 'Unknown',
        instrument_name: machine.cnc_controller || 'N/A',
        instrument_id: machine.cnc_controller_series || 'N/A',
        last_calibration_date: machine.calibration_date || null,
        calibration_due_date: machine.calibration_due_date || null,
        calibration_interval: '6 months', // Default interval
        responsible_person: machine.remarks || 'Not Assigned',
        status: getCalibrationStatus(machine.calibration_due_date),
        priority: getPriority(machine.calibration_due_date),
        location: 'Shop Floor', // Default location
        manufacturer: machine.make || 'Unknown',
        model: machine.model || 'N/A',
        accuracy: '±0.02mm', // Default accuracy
        remarks: machine.remarks || 'No remarks',
        last_maintenance_date: machine.last_maintenance_date || null
      }));
      
      setCalibrationData(transformedData);
      setFilteredData(transformedData);
    } catch (error) {
      console.error('Error fetching calibration data:', error);
      message.error('Failed to load calibration data');
      // Fallback to mock data if API fails
      setCalibrationData(mockCalibrationData);
      setFilteredData(mockCalibrationData);
    } finally {
      setLoading(false);
    }
  };

  const getCalibrationStatus = (dueDate) => {
    if (!dueDate) return 'upcoming';
    
    const today = dayjs();
    const due = dayjs(dueDate);
    const diff = due.diff(today, 'day');
    
    if (diff < 0) return 'overdue';
    if (diff <= 30) return 'due_soon';
    return 'upcoming';
  };

  const getPriority = (dueDate) => {
    if (!dueDate) return 'low';
    
    const today = dayjs();
    const due = dayjs(dueDate);
    const diff = due.diff(today, 'day');
    
    if (diff < 0) return 'critical';
    if (diff <= 7) return 'high';
    if (diff <= 30) return 'medium';
    return 'low';
  };

  useEffect(() => {
    filterData();
  }, [searchText, statusFilter, dateRange, calibrationData]);

  const filterData = () => {
    let filtered = [...calibrationData];

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(item =>
        item.machine_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.machine_id.toString().toLowerCase().includes(searchText.toLowerCase()) ||
        item.machine_type.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.responsible_person && item.responsible_person.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by date range
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(item => {
        const dueDate = dayjs(item.calibration_due_date);
        return dueDate.isAfter(startDate) && dueDate.isBefore(endDate);
      });
    }

    setFilteredData(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'error';
      case 'due_soon':
        return 'warning';
      case 'completed':
        return 'success';
      case 'upcoming':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due_soon':
        return 'Due Soon';
      case 'completed':
        return 'Completed';
      case 'upcoming':
        return 'Upcoming';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = dayjs();
    const due = dayjs(dueDate);
    const diff = due.diff(today, 'day');
    return diff;
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleUpdateCalibration = (record) => {
    Modal.confirm({
      title: 'Update Calibration Status',
      content: `Are you sure you want to mark the calibration for ${record.instrument_name} as completed?`,
      onOk: () => {
        // Update the record status
        const updatedData = calibrationData.map(item =>
          item.id === record.id ? { ...item, status: 'completed' } : item
        );
        setCalibrationData(updatedData);
        message.success('Calibration status updated successfully');
      }
    });
  };

  const columns = [
    {
      title: 'Machine Name',
      dataIndex: 'machine_name',
      key: 'machine_name',
      width: 300,
      render: (text, record) => (
        <div>
          <div className="font-bold text-sm">{text}</div>
          {/* <div className="text-xs text-gray-500">ID: {record.machine_id}</div>
          <div className="text-xs text-gray-500">Type: {record.machine_type}</div> */}
        </div>
      ),
      sorter: (a, b) => a.machine_name.localeCompare(b.machine_name),
    },
    {
      title: 'Calibration Due Date',
      dataIndex: 'calibration_due_date',
      key: 'calibration_due_date',
      width: 250,
      render: (date, record) => {
        if (!date) {
          return <Text type="secondary">-</Text>;
        }
        
        const daysUntilDue = getDaysUntilDue(date);
        const isOverdue = daysUntilDue < 0;
        const isDueSoon = daysUntilDue <= 30 && daysUntilDue >= 0;
        
        return (
          <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50 border border-red-200' : isDueSoon ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-700'}`}>
              {dayjs(date).format('DD-MM-YYYY')}
            </div>
            {/* <div className="text-xs">
              {isOverdue ? (
                <Text type="danger">{Math.abs(daysUntilDue)} days overdue</Text>
              ) : isDueSoon ? (
                <Text type="warning">{daysUntilDue} days left</Text>
              ) : (
                <Text type="secondary">{daysUntilDue} days left</Text>
              )}
            </div> */}
            {/* {record.last_calibration_date && (
              <div className="text-xs text-gray-500">
                Last: {dayjs(record.last_calibration_date).format('DD-MM-YYYY')}
              </div>
            )} */}
          </div>
        );
      },
      sorter: (a, b) => {
        if (!a.calibration_due_date && !b.calibration_due_date) return 0;
        if (!a.calibration_due_date) return 1;
        if (!b.calibration_due_date) return -1;
        return dayjs(a.calibration_due_date).unix() - dayjs(b.calibration_due_date).unix();
      },
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'last_maintenance_date',
      key: 'last_maintenance_date',
      width: 200,
      render: (date) => {
        if (!date) {
          return <Text type="secondary">Not Available</Text>;
        }
        return (
          <div>
            <div className="font-medium">{dayjs(date).format('DD-MM-YYYY')}</div>
            {/* <div className="text-xs text-gray-500">
              {dayjs(date).fromNow()}
            </div> */}
          </div>
        );
      },
      sorter: (a, b) => {
        if (!a.last_maintenance_date && !b.last_maintenance_date) return 0;
        if (!a.last_maintenance_date) return 1;
        if (!b.last_maintenance_date) return -1;
        return dayjs(a.last_maintenance_date).unix() - dayjs(b.last_maintenance_date).unix();
      },
    },
  ];

  // Calculate statistics
  const getStatistics = () => {
    const total = calibrationData.length;
    const overdue = calibrationData.filter(item => item.status === 'overdue').length;
    const dueSoon = calibrationData.filter(item => item.status === 'due_soon').length;
    const completed = calibrationData.filter(item => item.status === 'completed').length;
    const upcoming = calibrationData.filter(item => item.status === 'upcoming').length;

    return { total, overdue, dueSoon, completed, upcoming };
  };

  const stats = getStatistics();

  return (
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <Title level={3} className="mb-2">
          <CalendarOutlined className="mr-2 text-blue-500" />
          Machine Calibration Due Dates
        </Title>
        <Text type="secondary">
          Monitor and manage calibration schedules for all machines and instruments
        </Text>
      </div>

      {/* Statistics Cards
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Instruments"
              value={stats.total}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={stats.overdue}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Due Soon"
              value={stats.dueSoon}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row> */}

      {/* Progress Overview
      <Card className="mb-6">
        <div className="mb-4">
          <Text strong>Calibration Status Overview</Text>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0}
                format={percent => `${stats.overdue}`}
                strokeColor="#cf1322"
                size={80}
              />
              <div className="mt-2 text-sm text-red-600">Overdue</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.total > 0 ? Math.round((stats.dueSoon / stats.total) * 100) : 0}
                format={percent => `${stats.dueSoon}`}
                strokeColor="#fa8c16"
                size={80}
              />
              <div className="mt-2 text-sm text-orange-600">Due Soon</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
                format={percent => `${stats.completed}`}
                strokeColor="#3f8600"
                size={80}
              />
              <div className="mt-2 text-sm text-green-600">Completed</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.total > 0 ? Math.round((stats.upcoming / stats.total) * 100) : 0}
                format={percent => `${stats.upcoming}`}
                strokeColor="#1890ff"
                size={80}
              />
              <div className="mt-2 text-sm text-blue-600">Upcoming</div>
            </div>
          </Col>
        </Row>
      </Card> */}

      {/* Alerts
      {stats.overdue > 0 && (
        <Alert
          message={`${stats.overdue} calibration(s) overdue`}
          description="Immediate attention required for overdue calibrations. Please schedule calibration as soon as possible."
          type="error"
          showIcon
          className="mb-4"
          icon={<ExclamationCircleOutlined />}
        />
      )} */}

      {/* {stats.dueSoon > 0 && (
        <Alert
          message={`${stats.dueSoon} calibration(s) due within 30 days`}
          description="Please schedule these calibrations to avoid delays."
          type="warning"
          showIcon
          className="mb-4"
          icon={<WarningOutlined />}
        />
      )} */}

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search machines by name, ID, or type..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            placeholder="Filter by status"
          >
            <Option value="all">All Status</Option>
            <Option value="overdue">Overdue</Option>
            <Option value="due_soon">Due Soon</Option>
            <Option value="completed">Completed</Option>
            <Option value="upcoming">Upcoming</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['Start Date', 'End Date']}
            style={{ width: 250 }}
            disabledDate={(current) => {
              // Disable previous dates (before today)
              return current && current < dayjs().startOf('day');
            }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            // showSizeChanger: true,
            // showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 750 }}
          size="middle"
          bordered
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Calibration Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          selectedRecord && selectedRecord.status !== 'completed' && (
            <Button
              key="complete"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                handleUpdateCalibration(selectedRecord);
                setIsModalVisible(false);
              }}
            >
              Mark as Completed
            </Button>
          )
        ]}
        width={600}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Machine:</Text>
                <div>{selectedRecord.machine_name}</div>
              </Col>
              <Col span={12}>
                <Text strong>Machine ID:</Text>
                <div>{selectedRecord.machine_id}</div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Instrument:</Text>
                <div>{selectedRecord.instrument_name}</div>
              </Col>
              <Col span={12}>
                <Text strong>Instrument ID:</Text>
                <div>{selectedRecord.instrument_id}</div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Last Calibration:</Text>
                <div>{dayjs(selectedRecord.last_calibration_date).format('DD-MM-YYYY')}</div>
              </Col>
              <Col span={12}>
                <Text strong>Due Date:</Text>
                <div className={getDaysUntilDue(selectedRecord.calibration_due_date) < 0 ? 'text-red-600' : ''}>
                  {dayjs(selectedRecord.calibration_due_date).format('DD-MM-YYYY')}
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Interval:</Text>
                <div>{selectedRecord.calibration_interval}</div>
              </Col>
              <Col span={12}>
                <Text strong>Status:</Text>
                <div>
                  <Tag color={getStatusColor(selectedRecord.status)}>
                    {getStatusText(selectedRecord.status)}
                  </Tag>
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Responsible Person:</Text>
                <div>{selectedRecord.responsible_person}</div>
              </Col>
              <Col span={12}>
                <Text strong>Location:</Text>
                <div>{selectedRecord.location}</div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Manufacturer:</Text>
                <div>{selectedRecord.manufacturer}</div>
              </Col>
              <Col span={12}>
                <Text strong>Model:</Text>
                <div>{selectedRecord.model}</div>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Accuracy:</Text>
                <div>{selectedRecord.accuracy}</div>
              </Col>
              <Col span={12}>
                <Text strong>Priority:</Text>
                <div>
                  <Tag color={getPriorityColor(selectedRecord.priority)}>
                    {selectedRecord.priority.charAt(0).toUpperCase() + selectedRecord.priority.slice(1)}
                  </Tag>
                </div>
              </Col>
            </Row>
            <div>
              <Text strong>Remarks:</Text>
              <div className="mt-1">{selectedRecord.remarks}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MachineCalibrationDueDates; 