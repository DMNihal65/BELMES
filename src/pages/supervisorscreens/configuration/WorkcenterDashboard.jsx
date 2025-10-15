//WorkcenterDashboard
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
  Tabs,
  Tag,
  Switch,
  Popconfirm
} from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, EyeOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';
import workcenterAnimation from '../../../assets/workcenter (2).json';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import useWorkcenterStore from '../../../store/workcenter-store';
import { fetchAllMachines, createMachine, fetchMachineDetails, deleteMachine } from '../../../store/workcenter-store';

const { Option } = Select;
const { Title, Text } = Typography;

const Workcenter = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [data, setData] = useState([]);
  const [configData, setConfigData] = useState([]);
  const [selectedWorkcenter, setSelectedWorkcenter] = useState(null);
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
  const [selectedWorkcenterId, setSelectedWorkcenterId] = useState(null);
  const [selectedMachineDetails, setSelectedMachineDetails] = useState([]);
  const [workcenterOptions, setWorkcenterOptions] = useState([]);
  const [editingConfigKey, setEditingConfigKey] = useState('');
  const [originalConfigData, setOriginalConfigData] = useState(null);

  const { 
    fetchWorkcenters, 
    updateWorkcenter, 
    createWorkcenter,
    fetchWorkcenterConfig,
    updateWorkcenterSchedulable,
    deleteMachine,
    workcenters, 
    workcenterConfig,
    isLoading,
    workcenterCodes,
    machineNames
  } = useWorkcenterStore();

  useEffect(() => {
    console.log('Fetching workcenters...');
    fetchWorkcenters();
    fetchWorkcenterConfig();
  }, [fetchWorkcenters, fetchWorkcenterConfig]);

  useEffect(() => {
    console.log('Workcenters updated:', workcenters);
    // Filter out rows where type, make, or model is 'Default'
    const filtered = (workcenters || []).filter(item =>
      item.type !== 'Default' &&
      item.make !== 'Default' &&
      item.model !== 'Default'
    );
    setData(filtered);
  }, [workcenters]);

  useEffect(() => {
    console.log('Workcenter config updated:', workcenterConfig);
    // Sort the data by ID before setting it
    const sortedData = [...(workcenterConfig || [])].sort((a, b) => a.id - b.id);
    setConfigData(sortedData);
  }, [workcenterConfig]);

  const isEditing = (record) => record.id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      type: record.type,
      make: record.make,
      model: record.model,
      year_of_installation: record.year_of_installation ? dayjs(String(record.year_of_installation), 'YYYY') : null,
      cnc_controller: record.cnc_controller,
      cnc_controller_series: record.cnc_controller_series,
      remarks: record.remarks,
      calibration_date: record.calibration_date ? dayjs(record.calibration_date) : null,
      calibration_due_date: record.calibration_due_date ? dayjs(record.calibration_due_date) : null,
      last_maintenance_date: record.last_maintenance_date ? dayjs(record.last_maintenance_date) : null,
      pm_due_date: record.pm_due_date ? dayjs(record.pm_due_date) : null,
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
      
      // Cross-field validations
      const effectiveInstallationYear = row.year_of_installation
        ? row.year_of_installation.year()
        : (currentRecord.year_of_installation || null);

      const calibrationDateValue = row.calibration_date
        ? row.calibration_date
        : (currentRecord.calibration_date ? dayjs(currentRecord.calibration_date) : null);

      const calibrationDueDateValue = row.calibration_due_date
        ? row.calibration_due_date
        : (currentRecord.calibration_due_date ? dayjs(currentRecord.calibration_due_date) : null);

      const lastMaintenanceDateValue = row.last_maintenance_date
        ? row.last_maintenance_date
        : (currentRecord.last_maintenance_date ? dayjs(currentRecord.last_maintenance_date) : null);

      const pmDueDateValue = row.pm_due_date
        ? row.pm_due_date
        : (currentRecord.pm_due_date ? dayjs(currentRecord.pm_due_date) : null);

      if (effectiveInstallationYear !== null && calibrationDateValue && calibrationDateValue.year() < effectiveInstallationYear) {
        toast.error('Calibration Date cannot be before Installation Year');
        return;
      }

      if (calibrationDateValue && calibrationDueDateValue && calibrationDueDateValue.isBefore(calibrationDateValue, 'day')) {
        toast.error('Calibration Due Date cannot be before Calibration Date');
        return;
      }

      if (effectiveInstallationYear !== null && !calibrationDateValue && calibrationDueDateValue && calibrationDueDateValue.year() < effectiveInstallationYear) {
        toast.error('Calibration Due Date cannot be before Installation Year');
        return;
      }

      if (effectiveInstallationYear !== null && lastMaintenanceDateValue && lastMaintenanceDateValue.year() < effectiveInstallationYear) {
        toast.error('Last Maintenance cannot be before Installation Year');
        return;
      }

      if (effectiveInstallationYear !== null && pmDueDateValue && pmDueDateValue.year() < effectiveInstallationYear) {
        toast.error('PM Due Date cannot be before Installation Year');
        return;
      }

      const updatedItem = {
        id: currentRecord.id,
        work_center_id: currentRecord.work_center_id,
        type: row.type?.trim() || '',
        make: row.make?.trim() || '',
        model: row.model?.trim() || '',
        year_of_installation: row.year_of_installation ? row.year_of_installation.year() : 0,
        cnc_controller: row.cnc_controller?.trim() || '',
        cnc_controller_series: row.cnc_controller_series?.trim() || '',
        remarks: row.remarks?.trim() || '',
        calibration_date: row.calibration_date?.format('YYYY-MM-DD') || null,
        calibration_due_date: row.calibration_due_date?.format('YYYY-MM-DD') || null,
        last_maintenance_date: row.last_maintenance_date?.format('YYYY-MM-DD') || null,
        pm_due_date: row.pm_due_date?.format('YYYY-MM-DD') || null
      };

      console.log('Updating machine with data:', updatedItem);

      await updateWorkcenter(updatedItem);
      setEditingKey('');
      toast.success('Machine updated successfully');
      await fetchWorkcenters(); // Refresh the table data
    } catch (errInfo) {
      console.error('Save failed:', errInfo);
      toast.error(errInfo.message || 'Failed to update machine');
    }
  };

  const handleEdit = (record) => {
    console.log('Editing record:', record);
    setEditingRecord(record);
    setIsEditModalVisible(true);
    form.setFieldsValue({
      workcenterCode: record.work_center?.code,
      machineIds: record.machine_ids,
      description: record.work_center?.description,
      operation: record.work_center?.operation,
      plant_id: record.work_center?.plant_id || 'PLANT001'
    });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting edit with values:', values);
      
      await updateWorkcenter({
        ...editingRecord,
        ...values,
        work_center: {
          ...editingRecord.work_center,
          code: values.workcenterCode,
          description: values.description,
          operation: values.operation,
          plant_id: values.plant_id
        }
      });

      setIsEditModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      await fetchWorkcenters();
    } catch (error) {
      console.error('Edit failed:', error);
      toast.error('Failed to update workcenter: ' + error.message);
    }
  };

  const handleDelete = async (record) => {
    try {
      const response = await deleteMachine(record.id);
      console.log('Delete response:', response);
      // Display the message from the API response
      const responseMessage = response?.message || 'Machine deleted successfully';
      toast.success(responseMessage);
      await fetchWorkcenters(); // Refresh the table data
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete machine');
    }
  };

 const columns = [
  // {
  //   title: 'Sl.No',
  //   dataIndex: 'work_center_id',
  //   width: 120,
  //   sorter: (a, b) => {
    
  //     const aId = a.work_center_id || '';
  //     const bId = b.work_center_id || '';
      
      
  //     const aNum = parseInt(aId);
  //     const bNum = parseInt(bId);
      
  //     if (!isNaN(aNum) && !isNaN(bNum)) {
  //       return aNum - bNum;
  //     }
      
    
  //     return String(aId).localeCompare(String(bId));
  //   },
  //   sortDirections: ['ascend', 'descend'],
  //   defaultSortOrder: 'ascend',
  //   render: (text) => text,
  //   filters: [...new Set(data
  //     .map(item => item.work_center_id)
  //     .filter(Boolean)
  //   )]
  //   .sort((a, b) => {
  //     const aNum = parseInt(a);
  //     const bNum = parseInt(b);
      
  //     if (!isNaN(aNum) && !isNaN(bNum)) {
  //       return aNum - bNum;
  //     }
  //     return String(a).localeCompare(String(b));
  //   })
  //   .map(id => ({ text: String(id), value: id })),
  //   filterMode: 'menu',
  //   filterSearch: true,
  //   onFilter: (value, record) => {
  //     if (!record.work_center_id) return false;
  {
    title: 'Workcenter Code',
    dataIndex: ['work_center', 'code'],
    width: 150,
    render: (text) => text || '-',
    sorter: (a, b) => {
      const aCode = a.work_center?.code || '';
      const bCode = b.work_center?.code || '';
      return aCode.localeCompare(bCode);
    },
    sortDirections: ['ascend', 'descend'],
  },
  {
    title: 'Operation Description',
    dataIndex: ['work_center', 'description'],
    width: 250,
    render: (text, record) => {
      const editable = isEditing(record);
      return editable ? (
        <Form.Item
          name="operation_description"
          style={{ margin: 0 }}
          initialValue={text}
          rules={[{ required: true, message: 'Please enter Operation Description' }]}
        >
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
      ) : (
        <span>{text || '-'}</span>
      );
    },
    filterSearch: true,
    filters: [...new Set(data.map(item => item.work_center?.description).filter(Boolean))].map(desc => ({
      text: desc,
      value: desc
    })),
    onFilter: (value, record) => record.work_center?.description === value,
    sorter: (a, b) => (a.work_center?.description || '').localeCompare(b.work_center?.description || ''),
    sortDirections: ['ascend', 'descend'],
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
    sortDirections: ['ascend', 'descend'],
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
          <DatePicker 
            style={{ width: '100%' }}
            disabledDate={current => {
              // Only allow dates from tomorrow onwards
              return current && current < dayjs().endOf('day');
            }}
          />
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
      title: 'Last PM Date',
      dataIndex: 'last_maintenance_date',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="last_maintenance_date" style={{ margin: 0 }}>
          <DatePicker 
            style={{ width: '100%' }}
            disabledDate={current => {
              // Only allow previous dates (not today or future)
              return current && current >= dayjs().startOf('day');
            }}
          />
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
      title: 'PM Due Date',
      dataIndex: 'pm_due_date',
      width: 150,
      editable: true,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="pm_due_date" style={{ margin: 0 }}>
          <DatePicker 
            style={{ width: '100%' }}
            disabledDate={current => {
              // Only allow dates from tomorrow onwards
              return current && current < dayjs().endOf('day');
            }}
          />
        </Form.Item>
      ) : text ? dayjs(text).format('YYYY-MM-DD') : '-',
      filterSearch: true,
      filters: [...new Set(data.map(item => item.pm_due_date ? dayjs(item.pm_due_date).format('YYYY-MM-DD') : null))]
        .filter(Boolean)
        .map(date => ({ text: date, value: date })),
      onFilter: (value, record) => record.pm_due_date ? dayjs(record.pm_due_date).format('YYYY-MM-DD') === value : false,
      sorter: (a, b) => {
        if (!a.pm_due_date && !b.pm_due_date) return 0;
        if (!a.pm_due_date) return -1;
        if (!b.pm_due_date) return 1;
        return dayjs(a.pm_due_date).unix() - dayjs(b.pm_due_date).unix();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
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
            {/* <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              className="text-gray-600 hover:text-gray-700"
            >
              View
            </Button> */}
            <Popconfirm
              title="Are you sure you want to delete this machine?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              {/* <Button
            type="link"
                icon={<DeleteOutlined />}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button> */}
            </Popconfirm>
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
    setSelectedWorkcenter(record);
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

  const handleAddWorkcenter = async () => {
    try {
      const values = await addForm.validateFields();
      console.log('Form values:', values);
      
      if (!values.workcenterCode || !values.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Remove operation from workcenterData
      const workcenterData = {
        code: values.workcenterCode.trim(),
        plant_id: values.plant_id?.trim() || 'PLANT001', // Add fallback
        description: values.description.trim(),
        is_active: true,
        is_schedulable: true,
        type: "MACHINE",
        work_center_name: values.workcenterName?.trim() || values.workcenterCode.trim(),
        operation: "" // Add empty operation field to prevent API errors
      };

      console.log('Creating workcenter with data:', workcenterData);
      
      await createWorkcenter(workcenterData);
      setIsAddModalVisible(false);
      addForm.resetFields();
      toast.success('Workcenter added successfully');
      // Refresh the workcenters data immediately
      await fetchWorkcenters();
      await fetchWorkcenterConfig();
      
    } catch (error) {
      console.error('Add failed:', error);
      if (error.errorFields) {
        const errorMessages = error.errorFields.map(field => field.errors.join(', '));
        toast.error('Validation failed: ' + errorMessages.join('; '));
      } else {
        toast.error('Failed to add new workcenter: ' + (error.message || 'Unknown error'));
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
        const workcenterId = values.work_center_id;

        try {
          const machinePromises = selectedMachines.map(machineName => {
            const machineData = {
              work_center_id: workcenterId,
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

          const responses = await Promise.all(machinePromises);
          // Display the message from the API response
          const responseMessage = responses[0]?.message || 'Existing machines added successfully';
          toast.success(responseMessage);
          
          setIsAddMachineModalVisible(false);
          setMachineModalStep('select');
          addMachineForm.resetFields();
          fetchWorkcenters();
        } catch (error) {
          console.error('Error adding existing machine:', error);
          toast.error(error.message || 'Failed to add machine. Please try again.');
        }
      } else if (machineModalStep === 'new') {
        // Handle new machine creation
        const machineData = {
          work_center_id: values.work_center_id,
          type: values.machine_name?.trim(),
          make: values.make?.trim(),
          model: values.model?.trim(),
          year_of_installation: values.year_of_installation ? values.year_of_installation.year() : null,
          cnc_controller: values.cnc_controller?.trim() || '',
          cnc_controller_series: values.cnc_controller_series?.trim() || '',
          remarks: values.remarks?.trim() || '',
          calibration_date: values.calibration_date?.format('YYYY-MM-DD') || null,
          calibration_due_date: values.calibration_due_date?.format('YYYY-MM-DD') || null,
          last_maintenance_date: values.last_maintenance_date?.format('YYYY-MM-DD') || null,
          pm_due_date: values.pm_due_date?.format('YYYY-MM-DD') || null
        };

        console.log('Creating new machine with data:', machineData);
        try {
          const response = await createMachine(machineData);
          // Display the message from the API response
          console.log('API response:', response);
          const responseMessage = response?.message || 'New machine added successfully';
          toast.success(responseMessage);
          
          setIsAddMachineModalVisible(false);
          setMachineModalStep('select');
          addMachineForm.resetFields();
          fetchWorkcenters();
        } catch (error) {
          console.error('Error creating new machine:', error);
          toast.error(error.message || 'Failed to add machine. Please try again.');
        }
      }
    } catch (error) {
      console.error('General error adding machine:', error);
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
    }
  };


  

  const addWorkcenterForm = (
    <Form
      form={addForm}
      layout="vertical"
      validateMessages={{
        required: '${label} is required'
      }}
    >
      <Form.Item
        name="workcenterCode"
        label="Workcenter Code"
        rules={[
          { required: true, message: 'Please enter Workcenter Code' },
          { whitespace: true, message: 'Workcenter Code cannot be empty' },
          { max: 20, message: 'Workcenter Code cannot be longer than 20 characters' }
        ]}
      >
        <Input 
          placeholder="Enter Workcenter Code" 
          maxLength={20}
        />
      </Form.Item>

      <Form.Item
        name="plant_id"
        label="Plant ID"
        rules={[
          { required: true, message: 'Please enter Plant ID' },
          { whitespace: true, message: 'Plant ID cannot be empty' },
          { max: 20, message: 'Plant ID cannot be longer than 20 characters' }
        ]}
      >
        <Input 
          placeholder="Enter Plant ID" 
          maxLength={20}
        />
      </Form.Item>

      <Form.Item
        name="workcenterName"
        label="Workcenter Name"
        rules={[
          { required: true, message: 'Please enter Workcenter Name' },
          { whitespace: true, message: 'Workcenter Name cannot be empty' },
          { max: 50, message: 'Workcenter Name cannot be longer than 50 characters' }
        ]}
      >
        <Input 
          placeholder="Enter Workcenter Name" 
          maxLength={50}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Operation Description"
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

      {/* <Form.Item
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
      </Form.Item> */}
    </Form>
  );

  const handleWorkcenterSelect = async (value, option) => {
    if (!value || !option.data?.id) {
      setSelectedWorkcenterId(null);
      return;
    }
    console.log('Selected workcenter:', { value, id: option.data?.id });
    setSelectedWorkcenterId(option.data?.id);
    addMachineForm.setFieldsValue({ 
      work_center_id: option.data?.id,
      work_center_code: value 
    });
  };

  const handleNextStep = async () => {
    try {
      // Validate the form before proceeding
      await addMachineForm.validateFields(['work_center_code']);
      setMachineModalStep('existing');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const fetchWorkcenterOptions = async () => {
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/workcenters/?skip=0&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch workcenters');
      }
      const data = await response.json();
      console.log('Fetched workcenter options:', data);
      // Filter to only include schedulable workcenters
      const schedulableWorkcenters = data.filter(wc => wc.is_schedulable === true);
      setWorkcenterOptions(schedulableWorkcenters);
    } catch (error) {
      console.error('Error fetching workcenter options:', error);
      toast.error('Failed to load workcenter options');
    }
  };

  useEffect(() => {
    if (isAddMachineModalVisible && machineModalStep === 'select') {
      fetchWorkcenterOptions();
    }
  }, [isAddMachineModalVisible, machineModalStep]);

  const addMachineFormContent = () => {
    if (machineModalStep === 'select') {
      return (
        <div className="flex flex-col gap-6">
          {/* Progress Steps */}
          <div className="flex items-center mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 ${selectedWorkcenterId ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  selectedWorkcenterId ? 'bg-blue-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcenter
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 transition-colors duration-300 ${selectedWorkcenterId ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                  selectedWorkcenterId ? 'bg-blue-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-500'
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
              name="work_center_code"
              label="Workcenter Code"
              rules={[{ required: true, message: 'Please select Workcenter Code' }]}
            >
              <Select 
                placeholder="Select Workcenter Code"
                showSearch
                optionFilterProp="children"
                size="large"
                onChange={handleWorkcenterSelect}
                onClear={() => {
                  setSelectedWorkcenterId(null);
                  addMachineForm.setFieldsValue({ 
                    work_center_id: null,
                    work_center_code: null 
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
                options={workcenterOptions
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
              disabled={!selectedWorkcenterId}
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
          <div className="flex items-center mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcenter
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
                  2
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Machine Details
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            {/* <Button 
              type="primary" 
              size="large"
              onClick={() => setMachineModalStep('existing_form')}
              className="w-48"
              icon={<PlusOutlined />}
            >
              Existing Machine
            </Button> */}
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
          <div className="flex items-center mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcenter
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
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
            initialValues={{ work_center_id: selectedWorkcenterId }}
          >
            <Form.Item
              name="work_center_id"
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
          <div className="flex items-center mb-8 px-4">
            <div className="flex-1 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -left-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
                  1
                </div>
                <div className="absolute top-6 -left-8 text-xs text-gray-500 whitespace-nowrap">
                  Select Workcenter
                </div>
              </div>
            </div>
            
            <div className="w-32 relative">
              <div className={`h-0.5 bg-blue-500`} />
              <div className="absolute -top-3 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
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
  initialValues={{ work_center_id: selectedWorkcenterId }}
>
  <Form.Item name="work_center_id" hidden>
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
  rules={[
    { required: true, message: 'Please select Calibration Date' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const installationDate = getFieldValue('year_of_installation');
        if (!value || !installationDate) {
          return Promise.resolve();
        }
        if (value.year() < installationDate.year()) {
          return Promise.reject(new Error('Calibration Date cannot be before Installation Year'));
        }
        return Promise.resolve();
      },
    }),
  ]}
>
  <DatePicker 
    style={{ width: '100%' }} 
    disabledDate={(current) => {
      const installationDate = addMachineForm.getFieldValue('year_of_installation');
      return installationDate ? current && current.year() < installationDate.year() : false;
    }}
  />
</Form.Item>

<Form.Item
  name="calibration_due_date"
  label="Calibration Due Date"
  rules={[
    { required: true, message: 'Please select Calibration Due Date' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const calibrationDate = getFieldValue('calibration_date');
        if (!value || !calibrationDate) {
          return Promise.resolve();
        }
        if (value.isBefore(calibrationDate, 'day')) {
          return Promise.reject(new Error('Due Date cannot be before Calibration Date'));
        }
        return Promise.resolve();
      },
    }),
  ]}
>
  <DatePicker 
    style={{ width: '100%' }} 
    disabledDate={(current) => {
      const calibrationDate = addMachineForm.getFieldValue('calibration_date');
      return calibrationDate ? current && current.isBefore(calibrationDate, 'day') : false;
    }}
  />
</Form.Item>

<Form.Item
  name="last_maintenance_date"
  label="Last PM Date"
  rules={[
    { required: true, message: 'Please select Last PM Date' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const installationDate = getFieldValue('year_of_installation');
        if (!value || !installationDate) {
          return Promise.resolve();
        }
        if (value.year() < installationDate.year()) {
          return Promise.reject(new Error('Last PM Date cannot be before Installation Year'));
        }
        return Promise.resolve();
      },
    }),
  ]}
>
  <DatePicker 
    style={{ width: '100%' }} 
    disabledDate={(current) => {
      const installationDate = addMachineForm.getFieldValue('year_of_installation');
      return installationDate ? current && current.year() < installationDate.year() : false;
    }}
  />
</Form.Item>

<Form.Item
  name="pm_due_date"
  label="PM Due Date"
  rules={[
    { required: true, message: 'Please select PM Due Date' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const installationDate = getFieldValue('year_of_installation');
        if (!value || !installationDate) {
          return Promise.resolve();
        }
        if (value.year() < installationDate.year()) {
          return Promise.reject(new Error('PM Due Date cannot be before Installation Year'));
        }
        return Promise.resolve();
      },
    }),
  ]}
>
  <DatePicker 
    style={{ width: '100%' }} 
    disabledDate={(current) => {
      const installationDate = addMachineForm.getFieldValue('year_of_installation');
      return installationDate ? current && current.year() < installationDate.year() : false;
    }}
  />
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
        toast.warning('No machines found. The server might be unavailable.');
        setMachines([]);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Failed to fetch machines. Please try again later.');
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
      toast.error('Failed to fetch machine details');
    }
  };

  const viewModalContent = selectedWorkcenter && (
    <Form layout="vertical">
      <Form.Item label="Workcenter Code">
        <Input value={selectedWorkcenter.work_center.code} readOnly />
      </Form.Item>
      <Form.Item label="Plant ID">
        <Input value={selectedWorkcenter.work_center.plant_id} readOnly />
      </Form.Item>
      <Form.Item label="Description">
        <Input.TextArea value={selectedWorkcenter.work_center.description} readOnly />
      </Form.Item>
      <Form.Item label="Operation">
        <Input.TextArea value={selectedWorkcenter.work_center.operation} readOnly />
      </Form.Item>
    </Form>
  );

  const handleSchedulableToggle = async (record) => {
    try {
      await updateWorkcenterSchedulable(record.id, !record.is_schedulable);
    } catch (error) {
      console.error('Error toggling schedulable status:', error);
    }
  };

  const isConfigEditing = (record) => record.id === editingConfigKey;

  const handleConfigEdit = (record) => {
    setEditingConfigKey(record.id);
    // Store the original data for this record
    setOriginalConfigData(record);
  };

  const handleConfigCancel = () => {
    // Restore the original data if it exists
    if (originalConfigData) {
      setConfigData(configData.map(item => 
        item.id === originalConfigData.id ? originalConfigData : item
      ));
    }
    setEditingConfigKey('');
    setOriginalConfigData(null);
  };

  const handleConfigSave = async (record) => {
    try {
      // First update the schedulable status
      await updateWorkcenterSchedulable(record.id, record.is_schedulable);
      
      // Then update the workcenter details
      const response = await fetch(`http://172.19.224.1:8002/api/v1/master-order/workcenters/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: record.code,
          plant_id: record.plant_id,
          description: record.description,
          is_schedulable: record.is_schedulable,
          is_active: true,
          type: "MACHINE",
          work_center_name: record.work_center_name || record.code,
          operation: record.operation || ""
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update workcenter details');
      }

      // Refresh the workcenter config data
      await fetchWorkcenterConfig();
      
      setEditingConfigKey('');
      setOriginalConfigData(null);
      toast.success('Workcenter updated successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(error.message || 'Failed to update workcenter');
    }
  };

  const configColumns = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   width: 80,
    //   sorter: (a, b) => a.id - b.id,
    // },
    {
      title: 'work centre Name',
      dataIndex: 'code',
      width: 120,
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Plant ID',
      dataIndex: 'plant_id',
      width: 120,
      render: (text, record) => {
        const editable = isConfigEditing(record);
        return editable ? (
          <Input
            value={text}
            onChange={(e) => {
              const updatedRecord = { ...record, plant_id: e.target.value };
              setConfigData(configData.map(item => 
                item.id === record.id ? updatedRecord : item
              ));
            }}
            style={{ width: '100%' }}
          />
        ) : (
          text || '-'
        );
      },
    },
    // {
    //   title: 'work centre Name',
    //   dataIndex: 'work_center_name',
    //   width: 150,
    // },
    {
      title: 'Operation Description',
      dataIndex: 'description',
      width: 200,
      render: (text, record) => {
        const editable = isConfigEditing(record);
        return editable ? (
          <Input.TextArea
            value={text}
            onChange={(e) => {
              const updatedRecord = { ...record, description: e.target.value };
              setConfigData(configData.map(item => 
                item.id === record.id ? updatedRecord : item
              ));
            }}
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ width: '100%' }}
          />
        ) : (
          text || '-'
        );
      },
    },
    {
      title: 'Schedulable',
      dataIndex: 'is_schedulable',
      width: 120,
      render: (isSchedulable, record) => {
        const editable = isConfigEditing(record);
        return editable ? (
          <div className="flex items-center space-x-2">
            <Switch
              checked={isSchedulable}
              onChange={(checked) => {
                const updatedRecord = { ...record, is_schedulable: checked };
                setConfigData(configData.map(item => 
                  item.id === record.id ? updatedRecord : item
                ));
              }}
              checkedChildren="TRUE"
              unCheckedChildren="FALSE"
            />
            <Tag color={isSchedulable ? 'success' : 'error'}>
              {isSchedulable ? 'TRUE' : 'FALSE'}
            </Tag>
          </div>
        ) : (
          <Tag color={isSchedulable ? 'success' : 'error'}>
            {isSchedulable ? 'TRUE' : 'FALSE'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        const editable = isConfigEditing(record);
        return editable ? (
          <Space>
            <Button
              type="link"
              icon={<SaveOutlined />}
              onClick={() => handleConfigSave(record)}
              className="text-green-600 hover:text-green-700"
            >
              Save
            </Button>
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={handleConfigCancel}
              className="text-red-600 hover:text-red-700"
            >
              Cancel
            </Button>
          </Space>
        ) : (
          <Button
            type="link"
            icon={<EditOutlined />}
            disabled={editingConfigKey !== ''}
            onClick={() => handleConfigEdit(record)}
            className="text-blue-600 hover:text-blue-700"
          >
            Edit
          </Button>
        );
      },
    },
  ];

  const handleSearch = (searchText) => {
    setSearchText(searchText);
    
    if (!searchText.trim()) {
      setFilteredData([]);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/); // Split by any whitespace

    const filteredData = data.filter((workcenter) => {
      // Create a string with all searchable fields
      const searchableFields = [
        workcenter.work_center_id?.toString().toLowerCase() || '',
        workcenter.work_center?.code?.toString().toLowerCase() || '',
        workcenter.type?.toString().toLowerCase() || '',
        workcenter.make?.toString().toLowerCase() || '',
        workcenter.model?.toString().toLowerCase() || '',
        workcenter.year_of_installation?.toString().toLowerCase() || '',
        workcenter.cnc_controller?.toString().toLowerCase() || '',
        workcenter.cnc_controller_series?.toString().toLowerCase() || '',
        workcenter.remarks?.toString().toLowerCase() || '',
        workcenter.calibration_date ? dayjs(workcenter.calibration_date).format('YYYY-MM-DD') : '',
        workcenter.calibration_due_date ? dayjs(workcenter.calibration_due_date).format('YYYY-MM-DD') : '',
        workcenter.last_maintenance_date ? dayjs(workcenter.last_maintenance_date).format('YYYY-MM-DD') : '',
        workcenter.pm_due_date ? dayjs(workcenter.pm_due_date).format('YYYY-MM-DD') : ''
      ].join(' ');

      // Check if all search terms are found in any of the fields
      return searchTerms.every(term => 
        searchableFields.includes(term)
      );
    });

    setFilteredData(filteredData);
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Card className="shadow-sm">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              
                <Lottie 
                  animationData={workcenterAnimation}
                  style={{ width: 60, height: 60, marginTop: 4 }}
                  loop={true}
                  autoplay={true}
                />
        
              <div>
                <h1 className="text-2xl font-bold m-0 text-gray-800">WORKCENTRE MANAGEMENT</h1>
                <p className="text-sm text-indigo-00 m-0">Link and configure work centres with their respective machines</p>
              </div>
            </div>
            <div className="flex gap-3">
              {/* <Input.Search
                placeholder="Search workcenters..."
                size="middle"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 250 }}
                allowClear
              /> */}
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
          
          <Tabs 
            defaultActiveKey="workcenter" 
            className="mb-4"
            items={[
              {
                key: 'workcenter',
                label: <span className="font-semibold">Work centre</span>,
                children: (
                  <div className="border rounded-lg bg-white">
                    <Form form={form} component={false}>
                      <Table
                        components={{
                          body: {
                            cell: EditableCell,
                          },
                        }}
                        dataSource={searchText ? filteredData : data}
                        columns={mergedColumns}
                        rowClassName={(record) => 
                          `${isEditing(record) ? 'bg-blue-50' : 'hover:bg-gray-50'}`
                        }
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
scroll={{ x: 'max-content' }}
                      />
                    </Form>
                  </div>
                ),
              },
              {
                key: 'configure',
                label: <span className="font-semibold">Configure Workcentre</span>,
                children: (
                  <div className="border rounded-lg bg-white">
                    <Table
                      dataSource={configData}
                      columns={configColumns}
                      loading={isLoading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        position: ['bottomCenter'],
                        showTotal: (total, range) => (
                          <span className="text-gray-600">
                            Showing {range[0]}-{range[1]} of {total} items
                          </span>
                        ),
                      }}
                      scroll={{ 
                        x: 'max-content',
                        y: 'calc(100vh - 460px)'
                      }}
                      sticky
                      bordered
                      className="ant-table-striped"
                      size="middle"
                      rowKey="id"
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>

        <Modal
          title={`Workcenter Details - ${selectedWorkcenter?.work_center?.code}`}
          visible={isViewModalVisible}
          onOk={handleViewModalOk}
          onCancel={handleViewModalOk}
          width={400}
        >
          {viewModalContent}
        </Modal>

        <Modal
          title="Add New Workcenter"
          open={isAddModalVisible}
          onOk={handleAddWorkcenter}
          onCancel={() => {
            setIsAddModalVisible(false);
            addForm.resetFields();
          }}
          width={500}
          className="top-20"
        >
          {addWorkcenterForm}
        </Modal>

        <Modal
          title="Edit Workcenter"
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
              name="workcenterCode"
              label="Workcenter Code"
              rules={[{ required: true, message: 'Please select Workcenter Code' }]}
            >
              <Select placeholder="Select Workcenter Code">
                {workcenterCodes.map(code => (
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
              if (selectedWorkcenterId) {
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
                   dataIndex === 'last_maintenance_date' ||
                   dataIndex === 'pm_due_date' ? (
    <DatePicker style={{ width: '100%' }} />
  ) : dataIndex === 'year_of_installation' ? (
    <DatePicker 
      picker="year"
      style={{ width: '100%' }}
      format="YYYY"
      disabledDate={current => current && current.year() > 2029}
    />
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
                        dataIndex === 'last_maintenance_date' ||
                        dataIndex === 'pm_due_date' ? 'value' : undefined}
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

export default Workcenter;