import React, { useEffect, useState } from 'react';
import { Table, Button, Space, DatePicker, Input, Select, Card, Tag, Tooltip, Modal, Divider, Steps, Result, Alert, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, FileTextOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import usePokayokeStore from '../../../store/pokayoke-store';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Step } = Steps;

const LogsTab = () => {
  const { 
    completionLogs, 
    currentLog, 
    totalLogs, 
    filters, 
    loading, 
    error,
    machines,
    fetchMachines,
    fetchChecklistLogs, 
    fetchLogDetails, 
    setFilters, 
    resetFilters 
  } = usePokayokeStore();
  
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  useEffect(() => {
    fetchChecklistLogs();
    fetchMachines();
  }, [fetchChecklistLogs, fetchMachines]);
  
  const handleSearch = () => {
    fetchChecklistLogs();
  };
  
  const handleReset = () => {
    resetFilters();
    setSearchText('');
    fetchChecklistLogs();
  };
  
  const handleTableChange = (pagination) => {
    setFilters({ 
      ...filters, 
      page: pagination.current, 
      page_size: pagination.pageSize 
    });
    
    fetchChecklistLogs();
  };
  
  const handleViewDetails = async (logId) => {
    await fetchLogDetails(logId);
    setIsDetailModalVisible(true);
  };
  
  const refreshData = () => {
    fetchChecklistLogs();
    fetchMachines();
  };
  
  const getMachineName = (machine) => {
    if (!machine) return 'Unknown Machine';
    const make = machine.make || '';
    const model = machine.model || '';
    const wc = machine.work_center || {};
    const wcDesc = wc.description || '';
    const wcCode = wc.code || '';
    let label = '';
    if (make) label += make;
    if (model) label += (label ? ' ' : '') + model;
    if (wcDesc) label += (label ? ' (' : '(') + wcDesc + ')';
    if (wcCode) label += ` [${wcCode}]`;
    return label.trim() || `Machine ${machine.id}`;
  };
  
  const renderItemResponseStatus = (response) => {
    if (response.is_conforming) {
      return <Tag color="success">PASSED</Tag>;
    } else {
      return <Tag color="error">FAILED</Tag>;
    }
  };
  
  const renderItemResponse = (response) => {
    const { item_type, response_value, is_conforming } = response;
    
    if (item_type === 'boolean') {
      return (
        <Tag color={response_value === 'true' ? 'blue' : 'volcano'}>
          {response_value === 'true' ? 'YES' : 'NO'}
        </Tag>
      );
    } else if (item_type === 'numerical') {
      return <span>{response_value}</span>;
    } else {
      return <span>{response_value || '-'}</span>;
    }
  };
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '5%',
    },
    {
      title: 'Checklist',
      dataIndex: 'checklist_name',
      key: 'checklist_name',
      width: '20%',
    },
    {
      title: 'Machine',
      dataIndex: 'machine_id',
      key: 'machine_id',
      width: '10%',
      render: (machineId) => {
        const machine = machines.find(m => m.id === machineId);
        return machine ? getMachineName(machine) : machineId;
      }
    },
    {
      title: 'Operator',
      dataIndex: 'operator_id',
      key: 'operator_id',
      width: '10%',
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: '10%',
    },
    {
      title: 'Completed At',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: '15%',
      render: (date) => {
        if (!date) return '-';
        const dateObj = new Date(date);
        const timezoneOffset = dateObj.getTimezoneOffset() * 60000; // in milliseconds
        const localDate = new Date(dateObj.getTime() - timezoneOffset);
        return localDate.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      },
      sorter: (a, b) => new Date(b.completed_at) - new Date(a.completed_at),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Status',
      dataIndex: 'all_items_passed',
      key: 'all_items_passed',
      width: '10%',
      render: (allPassed) => (
        <Tag color={allPassed ? 'success' : 'error'}>
          {allPassed ? 'ALL PASSED' : 'HAS FAILURES'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              icon={<FileTextOutlined />} 
              onClick={() => handleViewDetails(record.id)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  // Helper to check if machine is 'Default'
  const isDefaultMachine = (machine) => {
    const name = machine?.name || '';
    const make = machine?.make || '';
    const model = machine?.model || '';
    const wcDesc = machine?.work_center?.description || '';
    return (
      name.trim().toLowerCase() === 'default' ||
      make.trim().toLowerCase() === 'default' ||
      model.trim().toLowerCase() === 'default' ||
      wcDesc.trim().toLowerCase() === 'default'
    );
  };
  
  // Update filter and fetch logs immediately
  const handleMachineFilter = (value) => {
    setFilters({ ...filters, machine_id: value, page: 1 });
    fetchChecklistLogs();
  };
  const handleProductionOrderFilter = (value) => {
    setFilters({ ...filters, production_order: value, page: 1 });
    fetchChecklistLogs();
  };
  const handleDateRangeFilter = (dates) => {
    if (dates) {
      setFilters({
        ...filters,
        from_date: dates[0]?.format('YYYY-MM-DD'),
        to_date: dates[1]?.format('YYYY-MM-DD'),
        page: 1
      });
    } else {
      setFilters({
        ...filters,
        from_date: null,
        to_date: null,
        page: 1
      });
    }
    fetchChecklistLogs();
  };
  
  return (
    <div>
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Checklist Completion Logs</h2>
          <p className="text-sm text-gray-500">View and analyze checklist completion data</p>
        </div>
        <Space>
          <Tooltip title="Refresh Data">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              loading={loading}
            />
          </Tooltip>
        </Space>
      </div>
      
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="mb-2 font-medium">Machine</div>
            <Select
              placeholder="Select Machine"
              style={{ width: '100%' }}
              allowClear
              onChange={handleMachineFilter}
              value={filters.machine_id}
            >
              {machines.filter(machine => !isDefaultMachine(machine)).map(machine => (
                <Option key={machine.id} value={machine.id}>
                  {getMachineName(machine)}
                </Option>
              ))}
            </Select>
          </div>
          
          
          
          
        </div>
        
        
      </Card>
      
      <Table
        columns={columns}
        dataSource={completionLogs}
        rowKey="id"
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.page_size,
          total: totalLogs,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total ${total} logs`,
          onChange: (page, pageSize) => {
            setFilters({ ...filters, page, page_size: pageSize });
            fetchChecklistLogs();
          },
        }}
      />
      
      {/* Log Details Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <span className="mr-2">Checklist Completion Details</span>
            {currentLog?.all_items_passed ? (
              <Badge status="success" text="All Items Passed" />
            ) : (
              <Badge status="error" text="Has Failures" />
            )}
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {currentLog && (
          <div>
            <Card className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <div className="text-sm text-gray-500">Checklist</div>
                  <div className="font-medium">{currentLog.checklist_name}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Machine</div>
                  <div className="font-medium">
                    {machines.find(m => m.id === currentLog.machine_id) 
                      ? getMachineName(machines.find(m => m.id === currentLog.machine_id))
                      : currentLog.machine_id}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Operator</div>
                  <div className="font-medium">{currentLog.operator_id}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Production Order</div>
                  <div className="font-medium">{currentLog.production_order}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Part Number</div>
                  <div className="font-medium">{currentLog.part_number}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Completed At</div>
                  <div className="font-medium">
                    {currentLog.completed_at ? (() => {
                      const dateObj = new Date(currentLog.completed_at);
                      const timezoneOffset = dateObj.getTimezoneOffset() * 60000;
                      const localDate = new Date(dateObj.getTime() - timezoneOffset);
                      return localDate.toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                      });
                    })() : '-'}
                  </div>
                </div>
              </div>
            </Card>
            
            {currentLog.comments && (
              <Alert
                message="Operator Comments"
                description={currentLog.comments}
                type="info"
                className="mb-4"
              />
            )}
            
            <Divider orientation="left">Checklist Responses</Divider>
            
            <div className="mb-4">
              {!currentLog.all_items_passed && (
                <Alert
                  message="Some items did not meet the requirements"
                  type="warning"
                  showIcon
                  className="mb-4"
                />
              )}
              
              <Steps
                direction="vertical"
                progressDot
                current={currentLog.responses.length}
              >
                {currentLog.responses.map((response) => (
                  <Step
                    key={response.id}
                    title={response.item_text}
                    description={
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        <div>
                          <div className="text-xs text-gray-500">Response</div>
                          <div>{renderItemResponse(response)}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500">Status</div>
                          <div>{renderItemResponseStatus(response)}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500">Timestamp</div>
                          <div>{new Date(response.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    }
                    status={response.is_conforming ? "finish" : "error"}
                    icon={response.is_conforming ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                  />
                ))}
              </Steps>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogsTab; 