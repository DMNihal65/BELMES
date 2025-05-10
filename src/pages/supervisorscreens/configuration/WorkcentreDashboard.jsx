import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Select, 
  message,
  DatePicker,
  Typography,
  Card,
  Tabs
} from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useWorkcentreStore from '../../../store/workcentre-store';
import { fetchAllMachines, createMachine, fetchMachineDetails } from '../../../store/workcentre-store';

const { Option } = Select;
const { Title, Text } = Typography;

const Workcentre = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [data, setData] = useState([]);
  const [selectedWorkcentre, setSelectedWorkcentre] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isAddMachineModalVisible, setIsAddMachineModalVisible] = useState(false);
  const [isNewMachineFormVisible, setIsNewMachineFormVisible] = useState(false);
  const [machineModalStep, setMachineModalStep] = useState('select');
  const [addMachineForm] = Form.useForm();
  const [machines, setMachines] = useState([]);
  const [selectedWorkcentreId, setSelectedWorkcentreId] = useState(null);
  const [selectedMachineDetails, setSelectedMachineDetails] = useState([]);
  const [workcentreOptions, setWorkcentreOptions] = useState([]);

  const { 
    fetchWorkcentres, 
    updateWorkcentre, 
    createWorkcentre,
    workcentres, 
    isLoading,
    workcentreCodes,
    machineNames
  } = useWorkcentreStore();

  useEffect(() => {
    console.log('Fetching workcentres...');
    fetchWorkcentres();
  }, [fetchWorkcentres]);

  useEffect(() => {
    console.log('Workcentres updated:', workcentres);
    setData(workcentres || []);
  }, [workcentres]);

  const isEditing = (record) => record.id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      type: record.type,
      make: record.make,
      model: record.model,
      year_of_installation: record.year_of_installation,
      cnc_controller: record.cnc_controller,
      cnc_controller_series: record.cnc_controller_series,
      remarks: record.remarks,
      calibration_date: record.calibration_date ? dayjs(record.calibration_date) : null,
      calibration_due_date: record.calibration_due_date ? dayjs(record.calibration_due_date) : null,
      last_maintenance_date: record.last_maintenance_date ? dayjs(record.last_maintenance_date) : null,
    });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const currentRecord = data.find(item => item.id === key);
      
      const updatedItem = {
        id: currentRecord.id,
        work_centre_id: currentRecord.work_centre_id,
        type: row.type?.trim() || '',
        make: row.make?.trim() || '',
        model: row.model?.trim() || '',
        year_of_installation: row.year_of_installation ? parseInt(row.year_of_installation) : 0,
        cnc_controller: row.cnc_controller?.trim() || '',
        cnc_controller_series: row.cnc_controller_series?.trim() || '',
        remarks: row.remarks?.trim() || '',
        calibration_date: row.calibration_date?.format('YYYY-MM-DD') || null,
        calibration_due_date: row.calibration_due_date?.format('YYYY-MM-DD') || null,
        last_maintenance_date: row.last_maintenance_date?.format('YYYY-MM-DD') || null
      };

      console.log('Updating machine with data:', updatedItem);

      await updateWorkcentre(updatedItem);
      setEditingKey('');
      message.success('Machine updated successfully');
      await fetchWorkcentres(); // Refresh the table data
    } catch (errInfo) {
      console.error('Save failed:', errInfo);
      message.error(errInfo.message || 'Failed to update machine');
    }
  };

  const handleEdit = (record) => {
    console.log('Editing record:', record);
    setEditingRecord(record);
    setIsEditModalVisible(true);
    form.setFieldsValue({
      workcentreCode: record.work_centre?.code,
      machineIds: record.machine_ids,
      description: record.work_centre?.description,
      operation: record.work_centre?.operation,
      plant_id: record.work_centre?.plant_id || 'PLANT001'
    });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting edit with values:', values);
      
      await updateWorkcentre({
        ...editingRecord,
        ...values,
        work_centre: {
          ...editingRecord.work_centre,
          code: values.workcentreCode,
          description: values.description,
          operation: values.operation,
          plant_id: values.plant_id
        }
      });

      setIsEditModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      await fetchWorkcentres();
    } catch (error) {
      console.error('Edit failed:', error);
      message.error('Failed to update workcentre: ' + error.message);
    }
  };

  const columns = [
    {
      title: 'Workcentre ID',
      dataIndex: 'work_centre_id',
      width: 120,
      sorter: (a, b) => {
        // Extract numeric values if possible
        const numA = parseInt(String(a.work_centre_id).replace(/\D/g, ''));
        const numB = parseInt(String(b.work_centre_id).replace(/\D/g, ''));
        
        // If both are valid numbers, compare numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        // Otherwise, compare as strings
        return String(a.work_centre_id || '').localeCompare(String(b.work_centre_id || ''));
      },
      sortDirections: ['ascend'],
      defaultSortOrder: 'ascend',
      sortOrder: 'ascend',
      render: (text) => text,
      filters: [...new Set(data
        .map(item => item.work_centre_id)
        .filter(Boolean)
      )]
      .sort((a, b) => {
        if (!isNaN(a) && !isNaN(b)) {
          return Number(a) - Number(b);
        }
        return String(a).localeCompare(String(b));
      })
      .map(id => ({ text: String(id), value: id })),
      filterMode: 'menu',
      filterSearch: true,
      onFilter: (value, record) => {
        if (!record.work_centre_id) return false;
        return String(record.work_centre_id).toLowerCase().includes(String(value).toLowerCase());
      },
      className: 'filter-column',
      showSorterTooltip: { title: 'Click to sort' }
    },
    {
      title: 'Workcentre Code',
      dataIndex: ['work_centre', 'code'],
      width: 150,
      render: (text) => text || '-',
      sorter: (a, b) => (a.work_centre?.code || '').localeCompare(b.work_centre?.code || ''),
    },
    {
      title: 'Machine Type',
      dataIndex: 'type',
      width: 130,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="type"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Please enter Machine Name' }]}
          >
            <Input />
          </Form.Item>
        ) : (
          <span>{text}</span>
        );
      },
      filterSearch: true,
      filters: [...new Set(data.map(item => item.type))].filter(Boolean).map(type => ({ text: type, value: type })),
      onFilter: (value, record) => record.type === value,
      sorter: (a, b) => (a.type || '').localeCompare(b.type || ''),
    },
    {
      title: 'Machine Name',
      dataIndex: 'make',
      width: 130,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="make"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Please enter Make' }]}
          >
            <Input />
          </Form.Item>
        ) : (
          <span>{text}</span>
        );
      },
      filterSearch: true,
      filters: [...new Set(data.map(item => item.make))].filter(Boolean).map(make => ({ text: make, value: make })),
      onFilter: (value, record) => record.make === value,
      sorter: (a, b) => (a.make || '').localeCompare(b.make || ''),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      width: 150,
      editable: true,
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="model"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Please enter Model' }]}
          >
            <Input />
          </Form.Item>
        ) : (
          <span>{text}</span>
        );
      },
      filterSearch: true,
      filters: [...new Set(data.map(item => item.model))].filter(Boolean).map(model => ({ text: model, value: model })),
      onFilter: (value, record) => record.model === value,
      sorter: (a, b) => (a.model || '').localeCompare(b.model || ''),
    },
    {
      title: 'Year of Installation',
      dataIndex: 'year_of_installation',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="year_of_installation" style={{ margin: 0 }}>
          <DatePicker 
            picker="year"
            style={{ width: '100%' }}
            format="YYYY"
            disabledDate={(current) => {
              return current && current.year() > 2029;
            }}
          />
        </Form.Item>
      ) : text,
      filterSearch: true,
      filters: [...new Set(data.map(item => item.year_of_installation))].filter(Boolean).map(year => ({ text: year.toString(), value: year })),
      onFilter: (value, record) => record.year_of_installation === value,
      sorter: (a, b) => (a.year_of_installation || 0) - (b.year_of_installation || 0),
    },
    {
      title: 'CNC Controller',
      dataIndex: 'cnc_controller',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="cnc_controller" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
      filterSearch: true,
      filters: [...new Set(data.map(item => item.cnc_controller))].filter(Boolean).map(controller => ({ text: controller, value: controller })),
      onFilter: (value, record) => record.cnc_controller === value,
      sorter: (a, b) => (a.cnc_controller || '').localeCompare(b.cnc_controller || ''),
    },
    {
      title: 'Controller Series',
      dataIndex: 'cnc_controller_series',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="cnc_controller_series" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
      filterSearch: true,
      filters: [...new Set(data.map(item => item.cnc_controller_series))].filter(Boolean).map(series => ({ text: series, value: series })),
      onFilter: (value, record) => record.cnc_controller_series === value,
      sorter: (a, b) => (a.cnc_controller_series || '').localeCompare(b.cnc_controller_series || ''),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 200,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="remarks" style={{ margin: 0 }}>
          <Input />
        </Form.Item>
      ) : text,
      filterSearch: true,
      filters: [...new Set(data.map(item => item.remarks))].filter(Boolean).map(remark => ({ text: remark, value: remark })),
      onFilter: (value, record) => record.remarks === value,
      sorter: (a, b) => (a.remarks || '').localeCompare(b.remarks || ''),
    },
    {
      title: 'Calibration Date',
      dataIndex: 'calibration_date',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="calibration_date" style={{ margin: 0 }}>
          <DatePicker />
        </Form.Item>
      ) : text ? dayjs(text).format('YYYY-MM-DD') : '-',
      filterSearch: true,
      filters: [...new Set(data.map(item => item.calibration_date ? dayjs(item.calibration_date).format('YYYY-MM-DD') : null))]
        .filter(Boolean)
        .map(date => ({ text: date, value: date })),
      onFilter: (value, record) => record.calibration_date ? dayjs(record.calibration_date).format('YYYY-MM-DD') === value : false,
      sorter: (a, b) => {
        if (!a.calibration_date && !b.calibration_date) return 0;
        if (!a.calibration_date) return -1;
        if (!b.calibration_date) return 1;
        return dayjs(a.calibration_date).unix() - dayjs(b.calibration_date).unix();
      },
    },
    {
      title: 'Calibration Due Date',
      dataIndex: 'calibration_due_date',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="calibration_due_date" style={{ margin: 0 }}>
          <DatePicker />
        </Form.Item>
      ) : text ? dayjs(text).format('YYYY-MM-DD') : '-',
      filterSearch: true,
      filters: [...new Set(data.map(item => item.calibration_due_date ? dayjs(item.calibration_due_date).format('YYYY-MM-DD') : null))]
        .filter(Boolean)
        .map(date => ({ text: date, value: date })),
      onFilter: (value, record) => record.calibration_due_date ? dayjs(record.calibration_due_date).format('YYYY-MM-DD') === value : false,
      sorter: (a, b) => {
        if (!a.calibration_due_date && !b.calibration_due_date) return 0;
        if (!a.calibration_due_date) return -1;
        if (!b.calibration_due_date) return 1;
        return dayjs(a.calibration_due_date).unix() - dayjs(b.calibration_due_date).unix();
      },
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'last_maintenance_date',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="last_maintenance_date" style={{ margin: 0 }}>
          <DatePicker />
        </Form.Item>
      ) : text ? dayjs(text).format('YYYY-MM-DD') : '-',
      filterSearch: true,
      filters: [...new Set(data.map(item => item.last_maintenance_date ? dayjs(item.last_maintenance_date).format('YYYY-MM-DD') : null))]
        .filter(Boolean)
        .map(date => ({ text: date, value: date })),
      onFilter: (value, record) => record.last_maintenance_date ? dayjs(record.last_maintenance_date).format('YYYY-MM-DD') === value : false,
      sorter: (a, b) => {
        if (!a.last_maintenance_date && !b.last_maintenance_date) return 0;
        if (!a.last_maintenance_date) return -1;
        if (!b.last_maintenance_date) return 1;
        return dayjs(a.last_maintenance_date).unix() - dayjs(b.last_maintenance_date).unix();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="link"
              icon={<SaveOutlined />}
              onClick={() => save(record.id)}
              style={{ marginRight: 8 }}
              className="text-green-600 hover:text-green-700"
            >
              Save
            </Button>
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={cancel}
              className="text-red-600 hover:text-red-700"
            >
              Cancel
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              disabled={editingKey !== ''}
              onClick={() => edit(record)}
              className="text-blue-600 hover:text-blue-700"
            >
              Edit
            </Button>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              className="text-gray-600 hover:text-gray-700"
            >
              View
            </Button>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const handleView = (record) => {
    setSelectedWorkcentre(record);
    setIsViewModalVisible(true);
  };

  const handleViewModalOk = () => {
    setIsViewModalVisible(false);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setEditingKey('');
    
    if (sorter && sorter.field) {
      console.log('Sort by:', sorter.field, sorter.order);
    }

    if (filters && Object.keys(filters).length > 0) {
      console.log('Filters applied:', filters);
    }
  };

  const getStartId = (pageNumber) => {
    return (pageNumber - 1) * pageSize + 1;
  };

  const handleAddWorkcentre = async () => {
    try {
      const values = await addForm.validateFields();
      console.log('Form values:', values);
      
      if (!values.workcentreCode || !values.description || !values.operation) {
        message.error('Please fill in all required fields');
        return;
      }

      const workcentreData = {
        code: values.workcentreCode.trim(),
        plant_id: "PLANT001",
        description: values.description.trim(),
        operation: values.operation.trim(),
        is_active: true,
        is_schedulable:true,
        type: "MACHINE",
        work_centre_name: values.workcentreName?.trim() || values.workcentreCode.trim()
      };

      console.log('Creating workcentre with data:', workcentreData);
      
      await createWorkcentre(workcentreData);
      
      setIsAddModalVisible(false);
      addForm.resetFields();
      message.success('Workcentre added successfully');
      
      // The store will automatically refresh both lists
    } catch (error) {
      console.error('Add failed:', error);
      if (error.errorFields) {
        const errorMessages = error.errorFields.map(field => field.errors.join(', '));
        message.error('Validation failed: ' + errorMessages.join('; '));
      } else {
        message.error('Failed to add new workcentre: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleAddMachineClick = () => {
    setMachineModalStep('select');
    setIsAddMachineModalVisible(true);
  };

  const handleAddMachineCancel = () => {
    setIsAddMachineModalVisible(false);
    setMachineModalStep('select');
    addMachineForm.resetFields();
  };

  const handleAddMachine = async (values) => {
    try {
      if (machineModalStep === 'existing_form') {
        // Handle existing machine selection
        const selectedMachines = values.machine_names;
        const workcentreId = values.work_centre_id;

        const machinePromises = selectedMachines.map(machineName => {
          const machineData = {
            work_centre_id: workcentreId,
            type: machineName,
            make: "Default",
            model: "Default",
            year_of_installation: new Date().getFullYear(),
            cnc_controller: "",
            cnc_controller_series: "",
            remarks: ""
          };
          return createMachine(machineData);
        });

        await Promise.all(machinePromises);
        message.success('Existing machines added successfully');
      } else if (machineModalStep === 'new') {
        // Handle new machine creation
        const machineData = {
          work_centre_id: values.work_centre_id,
          type: values.machine_name?.trim(),
          make: values.make?.trim(),
          model: values.model?.trim(),
          year_of_installation: values.year_of_installation ? values.year_of_installation.year() : null,
          cnc_controller: values.cnc_controller?.trim() || '',
          cnc_controller_series: values.cnc_controller_series?.trim() || '',
          remarks: values.remarks?.trim() || '',
          calibration_date: values.calibration_date?.format('YYYY-MM-DD') || null,
          calibration_due_date: values.calibration_due_date?.format('YYYY-MM-DD') || null,
          last_maintenance_date: values.last_maintenance_date?.format('YYYY-MM-DD') || null
        };

        console.log('Creating new machine with data:', machineData);
        await createMachine(machineData);
        message.success('New machine added successfully');
      }

      setIsAddMachineModalVisible(false);
      setMachineModalStep('select');
      addMachineForm.resetFields();
      fetchWorkcentres(); // Refresh the workcentre list
    } catch (error) {
      console.error('Error adding machine:', error);
      message.error('Failed to add machine. Please try again.');
    }
  };

  const addWorkcentreForm = (
    <Form
      form={addForm}
      layout="vertical"
      validateMessages={{
        required: '${label} is required'
      }}
    >
      <Form.Item
        name="workcentreCode"
        label="Workcentre Code"
        rules={[
          { required: true, message: 'Please enter Workcentre Code' },
          { whitespace: true, message: 'Workcentre Code cannot be empty' },
          { max: 20, message: 'Workcentre Code cannot be longer than 20 characters' }
        ]}
      >
        <Input 
          placeholder="Enter Workcentre Code" 
          maxLength={20}
        />
      </Form.Item>

      <Form.Item
        name="workcentreName"
        label="Workcentre Name"
        rules={[
          { required: true, message: 'Please enter Workcentre Name' },
          { whitespace: true, message: 'Workcentre Name cannot be empty' },
          { max: 50, message: 'Workcentre Name cannot be longer than 50 characters' }
        ]}
      >
        <Input 
          placeholder="Enter Workcentre Name" 
          maxLength={50}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please enter Description' },
          { whitespace: true, message: 'Description cannot be empty' },
          { max: 200, message: 'Description cannot be longer than 200 characters' }
        ]}
      >
        <Input.TextArea 
          rows={3} 
          placeholder="Enter Description"
          maxLength={200}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="operation"
        label="Operation"
        rules={[
          { required: true, message: 'Please enter Operation' },
          { whitespace: true, message: 'Operation cannot be empty' },
          { max: 100, message: 'Operation cannot be longer than 100 characters' }
        ]}
      >
        <Input.TextArea 
          rows={2} 
          placeholder="Enter Operation"
          maxLength={100}
          showCount
        />
      </Form.Item>
    </Form>
  );

  const handleWorkcentreSelect = async (value, option) => {
    if (!value || !option.data?.id) {
      setSelectedWorkcentreId(null);
      return;
    }
    console.log('Selected workcentre:', { value, id: option.data?.id });
    setSelectedWorkcentreId(option.data?.id);
    addMachineForm.setFieldsValue({ 
      work_centre_id: option.data?.id,
      work_centre_code: value 
    });
  };

  const handleNextStep = async () => {
    try {
      // Validate the form before proceeding
      await addMachineForm.validateFields(['work_centre_code']);
      setMachineModalStep('existing');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const fetchWorkcentreOptions = async () => {
    try {
      const response = await fetch('http://172.18.7.88:2327/api/v1/master-order/workcentres/?skip=0&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch workcentres');
      }
      const data = await response.json();
      console.log('Fetched workcentre options:', data);
      setWorkcentreOptions(data);
    } catch (error) {
      console.error('Error fetching workcentre options:', error);
      message.error('Failed to load workcentre options');
    }
  };

  useEffect(() => {
    if (isAddMachineModalVisible && machineModalStep === 'select') {
      fetchWorkcentreOptions();
    }
  }, [isAddMachineModalVisible, machineModalStep]);

  const addMachineFormContent = () => {
    if (machineModalStep === 'select') {
      return (
        <div className="flex flex-col gap-6">
          {/* Progress Steps */}
          <div className="flex items-centre mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 ${selectedWorkcentreId ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium ${
                  selectedWorkcentreId ? 'bg-blue-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcentre
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 transition-colors duration-300 ${selectedWorkcentreId ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium transition-colors duration-300 ${
                  selectedWorkcentreId ? 'bg-blue-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Machine Details
                </div>
              </div>
            </div>
          </div>

          <Form
            form={addMachineForm}
            layout="vertical"
          >
            <Form.Item
              name="work_centre_code"
              label="Workcentre Code"
              rules={[{ required: true, message: 'Please select Workcentre Code' }]}
            >
              <Select 
                placeholder="Select Workcentre Code"
                showSearch
                optionFilterProp="children"
                size="large"
                onChange={handleWorkcentreSelect}
                onClear={() => {
                  setSelectedWorkcentreId(null);
                  addMachineForm.setFieldsValue({ 
                    work_centre_id: null,
                    work_centre_code: null 
                  });
                }}
                allowClear
                filterOption={(input, option) =>
                  (option?.label?.toLowerCase() || '').includes(input.toLowerCase())
                }
                dropdownStyle={{ 
                  maxHeight: '300px',
                  overflow: 'auto',
                  zIndex: 1050
                }}
                style={{
                  width: '100%'
                }}
                options={workcentreOptions
                  .filter(wc => wc.is_schedulable)
                  .map(wc => ({
                    value: wc.code,
                    label: wc.code,
                    key: wc.id,
                    data: { id: wc.id },
                    description: wc.description
                  }))}
                optionRender={(option) => (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px 0'
                  }}>
                    <span style={{ 
                      fontWeight: 500,
                      color: '#000000d9'
                    }}>
                      {option.data.label}
                    </span>
                    {option.data.description && (
                      <span style={{ 
                        fontSize: '12px',
                        color: '#00000073'
                      }}>
                        {option.data.description}
                      </span>
                    )}
                  </div>
                )}
                labelInValue
              />
            </Form.Item>
          </Form>

          <div className="flex justify-between mt-4">
            <Button 
              size="large"
              onClick={handleAddMachineCancel}
            >
              Back
            </Button>
            <Button 
              type="primary" 
              size="large"
              disabled={!selectedWorkcentreId}
              onClick={handleNextStep}
            >
              Next
            </Button>
          </div>
        </div>
      );
    }

    if (machineModalStep === 'existing') {
      return (
        <div className="flex flex-col gap-6">
          {/* Progress Steps */}
          <div className="flex items-centre mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium bg-blue-500 text-white`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcentre
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium bg-blue-500 text-white`}>
                  2
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Machine Details
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-centre gap-4 mt-4">
            <Button 
              type="primary" 
              size="large"
              onClick={() => setMachineModalStep('existing_form')}
              className="w-48"
              icon={<PlusOutlined />}
            >
              Existing Machine
            </Button>
            <Button 
              type="primary" 
              size="large"
              onClick={() => setMachineModalStep('new')}
              className="w-48"
              icon={<PlusOutlined />}
            >
              New Machine
            </Button>
          </div>

          <div className="flex justify-between mt-4">
            <Button 
              size="large"
              onClick={() => setMachineModalStep('select')}
            >
              Back
            </Button>
          </div>
        </div>
      );
    }

    if (machineModalStep === 'existing_form') {
      return (
        <div className="flex flex-col gap-6">
          {/* Progress Steps */}
          <div className="flex items-centre mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium bg-blue-500 text-white`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcentre
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium bg-blue-500 text-white`}>
                  2
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Machine Details
                </div>
              </div>
            </div>
          </div>

          <Form
            form={addMachineForm}
            layout="vertical"
            onFinish={handleAddMachine}
            initialValues={{ work_centre_id: selectedWorkcentreId }}
          >
            <Form.Item
              name="work_centre_id"
              hidden
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="machine_names"
              label="Machine Name"
              rules={[{ required: true, message: 'Please select at least one Machine' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select Machines"
                showSearch
                optionFilterProp="children"
                size="large"
                loading={!machines.length}
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onChange={(values, options) => {
                  const ids = options.map(opt => opt.key);
                  handleMachineSelect(ids);
                }}
                notFoundContent={machines.length === 0 ? "No machines available" : "No matches found"}
                maxTagCount="responsive"
              >
                {machines.map(machine => (
                  <Option 
                    key={machine.id} 
                    value={machine.make}
                  >
                    {machine.make}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedMachineDetails.length > 0 && (
              <div className="mt-4">
                <Title level={5}>Selected Machine Details:</Title>
                {selectedMachineDetails.map((machine, index) => (
                  <div key={machine.id} className="bg-gray-50 p-4 rounded-lg mb-2">
                    <Text strong>{index + 1}. {machine.type}</Text>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div><Text type="secondary">Make:</Text> {machine.make}</div>
                      <div><Text type="secondary">Model:</Text> {machine.model}</div>
                      <div><Text type="secondary">Year:</Text> {machine.year_of_installation}</div>
                      <div><Text type="secondary">Controller:</Text> {machine.cnc_controller}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form>

          <div className="flex justify-between mt-4">
            <Button 
              size="large"
              onClick={() => setMachineModalStep('existing')}
            >
              Back
            </Button>
            <Button 
              type="primary"
              size="large"
              onClick={() => addMachineForm.submit()}
              disabled={!machines.length}
            >
              Submit
            </Button>
          </div>
        </div>
      );
    }

    if (machineModalStep === 'new') {
      return (
        <div className="flex flex-col gap-6">
          {/* Progress Steps */}
          <div className="flex items-centre mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium bg-blue-500 text-white`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcentre
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-centre justify-centre text-sm font-medium bg-blue-500 text-white`}>
                  2
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Machine Details
                </div>
              </div>
            </div>
          </div>

          <Form
            form={addMachineForm}
            layout="vertical"
            onFinish={handleAddMachine}
            initialValues={{ work_centre_id: selectedWorkcentreId }}
          >
            <Form.Item
              name="work_centre_id"
              hidden
            >
              <Input />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="machine_name"
                label="Machine Type"
                rules={[{ required: true, message: 'Please enter Machine Name' }]}
              >
                <Input placeholder="Enter Machine Name" />
              </Form.Item>

              <Form.Item
                name="make"
                label="Machine Name"
                rules={[{ required: true, message: 'Please enter Make' }]}
              >
                <Input placeholder="Enter Make" />
              </Form.Item>

              <Form.Item
                name="model"
                label="Model"
                rules={[{ required: true, message: 'Please enter Model' }]}
              >
                <Input placeholder="Enter Model" />
              </Form.Item>

              <Form.Item
                name="year_of_installation"
                label="Year of Installation"
                rules={[{ required: true, message: 'Please select Year of Installation' }]}
              >
                <DatePicker 
                  picker="year" 
                  style={{ width: '100%' }}
                  format="YYYY"
                  disabledDate={(current) => {
                    return current && current.year() > 2029;
                  }}
                />
              </Form.Item>

              <Form.Item
                name="cnc_controller"
                label="CNC Controller"
                rules={[{ required: true, message: 'Please enter CNC Controller' }]}
              >
                <Input placeholder="Enter CNC Controller" />
              </Form.Item>

              <Form.Item
                name="cnc_controller_series"
                label="Controller Series"
                rules={[{ required: true, message: 'Please enter Controller Series' }]}
              >
                <Input placeholder="Enter Controller Series" />
              </Form.Item>

              <Form.Item
                name="calibration_date"
                label="Calibration Date"
                rules={[{ required: true, message: 'Please select Calibration Date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="calibration_due_date"
                label="Calibration Due Date"
                rules={[{ required: true, message: 'Please select Calibration Due Date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="last_maintenance_date"
                label="Last Maintenance Date"
                rules={[{ required: true, message: 'Please select Last Maintenance Date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="remarks"
                label="Remarks"
                className="col-span-2"
                rules={[{ required: true, message: 'Please Enter Remarks or any other Related information' }]}
              >
                <Input.TextArea rows={2} placeholder="Enter Remarks" />
              </Form.Item>
            </div>
          </Form>

          <div className="flex justify-between mt-4">
            <Button 
              size="large"
              onClick={() => setMachineModalStep('existing')}
            >
              Back
            </Button>
            <Button 
              type="primary"
              size="large"
              onClick={() => addMachineForm.submit()}
            >
              Submit
            </Button>
          </div>
        </div>
      );
    }
  };

  const fetchMachinesData = async () => {
    try {
      setMachines([]); // Clear existing machines
      const machinesData = await fetchAllMachines();
      console.log('Fetched machines:', machinesData);
      
      if (Array.isArray(machinesData) && machinesData.length > 0) {
        setMachines(machinesData);
      } else {
        message.warning('No machines found. The server might be unavailable.');
        setMachines([]);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      message.error('Failed to fetch machines. Please try again later.');
      setMachines([]);
    }
  };

  useEffect(() => {
    if (machineModalStep === 'existing_form') {
      fetchMachinesData();
    }
  }, [machineModalStep]);

  const handleMachineSelect = async (selectedMachineIds) => {
    try {
      // Clear previous details
      setSelectedMachineDetails([]);
      
      // Fetch details for each selected machine
      const detailsPromises = selectedMachineIds.map(id => fetchMachineDetails(id));
      const details = await Promise.all(detailsPromises);
      
      console.log('Fetched machine details:', details);
      setSelectedMachineDetails(details);
    } catch (error) {
      console.error('Error fetching machine details:', error);
      message.error('Failed to fetch machine details');
    }
  };

  const viewModalContent = selectedWorkcentre && (
    <Form layout="vertical">
      <Form.Item label="Workcentre Code">
        <Input value={selectedWorkcentre.work_centre.code} readOnly />
      </Form.Item>
      <Form.Item label="Plant ID">
        <Input value={selectedWorkcentre.work_centre.plant_id} readOnly />
      </Form.Item>
      <Form.Item label="Description">
        <Input.TextArea value={selectedWorkcentre.work_centre.description} readOnly />
      </Form.Item>
      <Form.Item label="Operation">
        <Input.TextArea value={selectedWorkcentre.work_centre.operation} readOnly />
      </Form.Item>
    </Form>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Main Content Card */}
      <Card className="shadow-sm">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex justify-between items-centre mb-4">
            <div>
              <Title level={4} className="!mb-1">Work centre Machine Linking</Title>
              <Text type="secondary">Link and configure work centres with their respective machines</Text>
            </div>
            <div className="flex gap-3">
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddMachineClick}
              >
                Add Machine
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalVisible(true)}
              >
                Add Workcentre
              </Button>
            </div>
          </div>
          
          {/* Tabs for future expansion */}
          <Tabs 
            defaultActiveKey="workcentre" 
            className="mb-4"
            items={[
              {
                key: 'workcentre',
                label: 'Work centre',
                children: (
                  <div className="border rounded-lg bg-white">
                    <Form form={form} component={false}>
                      <Table
                        components={{
                          body: {
                            cell: EditableCell,
                          },
                        }}
                        dataSource={data.map((item, index) => ({
                          ...item,
                          key: `${item.work_centre_id}_${index}`,
                          sequential_id: index + 1,
                        }))}
                        columns={mergedColumns}
                        rowClassName={(record) => 
                          `${isEditing(record) ? 'bg-blue-50' : 'hover:bg-gray-50'}`
                        }
                        loading={isLoading}
                        pagination={{
                          current: currentPage,
                          pageSize: 6,
                          total: data.length,
                          showSizeChanger: false,
                          showQuickJumper: true,
                          position: ['bottomcentre'],
                          showTotal: (total, range) => (
                            <span className="text-gray-600">
                              Showing {range[0]}-{range[1]} of {total} items
                            </span>
                          ),
                          onChange: (page) => {
                            setCurrentPage(page);
                            setEditingKey('');
                          }
                        }}
                        scroll={{ 
                          x: 'max-content',
                          y: 'calc(100vh - 460px)'
                        }}
                        sticky
                        bordered
                        className="ant-table-striped"
                        size="middle"
                        rowKey={(record) => `${record.work_centre_id}_${record.sequential_id}`}
                        defaultSortField="work_centre_id"
                        defaultSortOrder="ascend"
                        onChange={(pagination, filters, sorter) => {
                          handleTableChange(pagination, filters, sorter);
                          // Ensure work_centre_id stays sorted in ascending order
                          if (!sorter.field) {
                            const sortedData = [...data].sort((a, b) => {
                              const valueA = String(a.work_centre_id || '');
                              const valueB = String(b.work_centre_id || '');
                              return valueA.localeCompare(valueB);
                            });
                            setData(sortedData);
                          }
                        }}
                      />
                    </Form>
                  </div>
                ),
              },
              // Add more tabs here in the future
            ]}
          />
        </div>

        {/* Keep all your existing modals */}
        <Modal
          title={`Workcentre Details - ${selectedWorkcentre?.work_centre?.code}`}
          visible={isViewModalVisible}
          onOk={handleViewModalOk}
          onCancel={handleViewModalOk}
          width={400}
        >
          {viewModalContent}
        </Modal>

        <Modal
          title="Add New Workcentress"
          open={isAddModalVisible}
          onOk={handleAddWorkcentre}
          onCancel={() => {
            setIsAddModalVisible(false);
            addForm.resetFields();
          }}
          width={500}
          className="top-20"
        >
          {addWorkcentreForm}
        </Modal>

        <Modal
          title="Edit Workcentre"
          open={isEditModalVisible}
          onOk={handleEditSubmit}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingRecord(null);
            form.resetFields();
          }}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="workcentreCode"
              label="Workcentre Code"
              rules={[{ required: true, message: 'Please select Workcentre Code' }]}
            >
              <Select placeholder="Select Workcentre Code">
                {workcentreCodes.map(code => (
                  <Option key={code} value={code}>
                    {code}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="machineIds"
              label="Machine ID"
              rules={[{ required: true, message: 'Please select Machine ID' }]}
            >
              <Select mode="multiple" placeholder="Select Machine IDs">
                {machineNames.map((machine, index) => (
                  <Option key={index} value={machine}>
                    {machine}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter Description' }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="operation"
              label="Operation"
              rules={[{ required: true, message: 'Please enter Operation' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="plant_id"
              label="Plant ID"
              initialValue="PLANT001"
              hidden
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={
            machineModalStep === 'select' ? 'Add Machine' :
            machineModalStep === 'existing' ? 'Select Existing Machine' :
            'Add New Machine'
          }
          open={isAddMachineModalVisible}
          onOk={() => {
            if (machineModalStep === 'select') {
              if (selectedWorkcentreId) {
                setMachineModalStep('existing');
              }
              return;
            }
            addMachineForm.submit();
          }}
          onCancel={() => {
            if (machineModalStep === 'select') {
              handleAddMachineCancel();
            } else {
              setMachineModalStep('select');
            }
          }}
          width={800}
          className="top-20"
          footer={null}
        >
          {addMachineFormContent()}
        </Modal>
      </Card>
    </div>
  );
};

const EditableCell = ({
  editing,
  dataIndex,
  title,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = dataIndex === 'calibration_date' || 
                   dataIndex === 'calibration_due_date' || 
                   dataIndex === 'last_maintenance_date' ? (
    <DatePicker style={{ width: '100%' }} />
  ) : (
    <Input />
  );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          valuePropName={dataIndex === 'calibration_date' || 
                        dataIndex === 'calibration_due_date' || 
                        dataIndex === 'last_maintenance_date' ? 'value' : undefined}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const tableStyles = {
  '.ant-table-cell-fix-left, .ant-table-cell-fix-right': {
    backgroundColor: '#fff',
    boxShadow: '-6px 0 6px -4px rgba(0,0,0,0.15)',
  },
  '.ant-table-cell-fix-left-first': {
    boxShadow: 'none',
  },
  '.ant-table-row-selected .ant-table-cell-fix-left, .ant-table-row-selected .ant-table-cell-fix-right': {
    backgroundColor: '#e6f7ff',
  },
  '.filter-column': {
    background: '#fafafa',
  },
  '.filter-column .ant-table-filter-trigger': {
    color: '#1890ff',
  },
  '.filter-column .ant-table-filter-trigger.active': {
    color: '#1890ff',
    backgroundColor: '#e6f7ff',
  },
  '.ant-table-filter-dropdown': {
    padding: '8px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  '.ant-table-filter-dropdown input': {
    width: '100%',
    marginBottom: '8px',
  },
  '.ant-table-filter-dropdown-btns': {
    borderTop: '1px solid #f0f0f0',
    padding: '7px 8px',
  }
};

export default Workcentre;