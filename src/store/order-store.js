import { create } from 'zustand';
import dayjs from 'dayjs';

const mockWorkcenters = [
  {
    id: 1,
    code: 'MMC1',
    machine_id: 'MCH001',
    type: 'CNC',
    make: 'HAAS',
    model: 'VF-2',
    year_of_installation: '2019',
    cnc_controller: 'FANUC',
    cnc_controller_series: '31i-B',
    remarks: 'High precision machining',
    callibration_date: '2024-01-15',
    last_maintainance_date: '2024-02-20',
    plant_id: 'PLT01',
    description: '5-axis machining center',
    operation: 'Milling'
  },
  {
    id: 2,
    code: 'MMM3',
    machine_id: 'MCH002',
    type: 'Manual',
    make: 'DMG MORI',
    model: 'NLX 2500',
    year_of_installation: '2020',
    cnc_controller: 'SIEMENS',
    cnc_controller_series: '840D',
    remarks: 'General purpose lathe',
    callibration_date: '2024-02-01',
    last_maintainance_date: '2024-03-01',
    plant_id: 'PLT02',
    description: 'Turning center',
    operation: 'Turning'
  },
  {
    id: 3,
    code: 'CNCM',
    machine_id: 'MCH003',
    type: 'CNC',
    make: 'Mazak',
    model: 'INTEGREX i-200',
    year_of_installation: '2021',
    cnc_controller: 'MAZATROL',
    cnc_controller_series: 'SmoothX',
    remarks: 'Multi-tasking machine',
    callibration_date: '2024-02-15',
    last_maintainance_date: '2024-03-10',
    plant_id: 'PLT01',
    description: 'Multi-axis machining',
    operation: 'Mill-Turn'
  },
  {
    id: 4,
    code: 'NEWC',
    machine_id: 'MCH004',
    type: 'CNC',
    make: 'Okuma',
    model: 'MB-5000H',
    year_of_installation: '2022',
    cnc_controller: 'OSP',
    cnc_controller_series: 'P300',
    remarks: 'Horizontal machining',
    callibration_date: '2024-03-01',
    last_maintainance_date: '2024-03-15',
    plant_id: 'PLT03',
    description: 'Horizontal machining center',
    operation: 'Milling'
  },
  {
    id: 5,
    code: 'SMFD',
    machine_id: 'MCH005',
    type: 'Manual',
    make: 'Doosan',
    model: 'PUMA 2600',
    year_of_installation: '2018',
    cnc_controller: 'FANUC',
    cnc_controller_series: '0i-TF',
    remarks: 'Production turning',
    callibration_date: '2024-01-20',
    last_maintainance_date: '2024-02-25',
    plant_id: 'PLT02',
    description: 'CNC turning center',
    operation: 'Turning'
  },
  {
    id: 6,
    code: 'QFAB',
    machine_id: 'MCH006',
    type: 'CNC',
    make: 'DMG MORI',
    model: 'DMU 50',
    year_of_installation: '2023',
    cnc_controller: 'HEIDENHAIN',
    cnc_controller_series: 'TNC 640',
    remarks: '5-axis machining',
    callibration_date: '2024-03-05',
    last_maintainance_date: '2024-03-20',
    plant_id: 'PLT01',
    description: '5-axis milling center',
    operation: 'Milling'
  },
  {
    id: 7,
    code: 'CNCT',
    machine_id: 'MCH007',
    type: 'CNC',
    make: 'Makino',
    model: 'A51nx',
    year_of_installation: '2021',
    cnc_controller: 'FANUC',
    cnc_controller_series: '31i-B5',
    remarks: 'High-speed machining',
    callibration_date: '2024-02-10',
    last_maintainance_date: '2024-03-05',
    plant_id: 'PLT03',
    description: 'Horizontal machining center',
    operation: 'Milling'
  }
];

const useOrderStore = create((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  // Add workcenter-related state
  workcenters: [],
  isLoadingWorkcenters: false,
  workcenterError: null,

  clearOrderDetails: () => set({ 
    orderDetails: null, 
    error: null,
    isLoading: false 
  }),

  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.85:6641/api/v1/planning/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      // Sort orders by priority
      const sortedOrders = data.sort((a, b) => a.project.priority - b.project.priority);

      // Transform each order to include deliveryDate
      const transformedOrders = sortedOrders.map(order => ({
        ...order,
      }));

      set({ orders: transformedOrders, isLoading: false });
      return transformedOrders;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  uploadPDF: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('http://172.18.7.85:6641/api/v1/planning/upload-pdf', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload PDF');
      }

      // Transform the API response to match form fields
      const transformedData = {
        orderNumber: data['Prod Order No'],
        salesOrderNumber: data['Sale Order'],
        wbsElement: data['WBS'],
        partNumber: data['Part No'],
        materialDescription: data['Part Desc'],
        totalOperations: data.Operations?.length || 0,
        targetQuantity: parseInt(data['Required Qty']),
        launchedQuantity: parseInt(data['Launched Qty']),
        plant: data['Plant'],
        projectName: data['Project Name'],
        // Additional fields
        priority: 'normal', // Default priority since it's not in the response
        rawMaterials: data['Raw Materials']?.map(material => ({
          child_part_number: material['Child Part No'],
          description: material['Description'],
          quantity: material['Qty Per Set'],
          unit: { name: material['UoM'] },
          status: { name: 'Available' } // Default status
        })) || [],
        // Add operations data
        operations: data.Operations?.map(op => ({
          operation_number: op['Oprn No'],
          workcenter: op['Wc/Plant'],
          plant_number: op['Plant Number'],
          operation_description: op['Operation'],
          setup_time: parseFloat(op['Setup Time']),
          per_piece_time: parseFloat(op['Per Pc Time']),
          jump_quantity: parseInt(op['Jmp Qty']),
          total_quantity: parseInt(op['Tot Qty']),
          allowed_time: parseFloat(op['Allowed Time']),
          confirmation_number: op['Confirm No'],
          long_text: op['Long Text']
        })) || []
      };

      set({ orderDetails: transformedData, isLoading: false });
      return transformedData;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateOrder: async (orderId, payload, orderNumber) => {
    set({ isLoading: true, error: null });
    try {
      // Transform the payload to match API expectations
      const transformedPayload = {
        production_order: payload.orderNumber,
        sale_order: payload.salesOrderNumber,
        wbs_element: payload.wbsElement,
        part_number: payload.partNumber,
        part_description: payload.materialDescription,
        total_operations: payload.totalOperations,
        required_quantity: payload.targetQuantity,
        launched_quantity: payload.launchedQuantity,
        plant_id: payload.plant,
        project_name: payload.projectName,
        priority: payload.priority,
        delivery_date: payload.deliveryDate 
          ? Math.floor(payload.deliveryDate.valueOf() / 1000)
          : null
      };

      console.log('Transformed Payload:', transformedPayload);

      // Use the orderNumber parameter instead of hardcoded value
      const response = await fetch(
        `http://172.18.7.85:6641/api/v1/planning/update_order/${payload.orderNumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transformedPayload),
        }
      );
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Server Error Response:', data);
        const errorMessage = data.detail 
          ? Array.isArray(data.detail)
            ? data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('; ')
            : data.detail
          : 'Failed to update order';
        throw new Error(errorMessage);
      }
      
      // Update the orders list with the new data
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? data : order
        ),
        isLoading: false
      }));
  
      return data;
    } catch (error) {
      console.error('Update Error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Add createOrder function to the store
  createOrder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('http://172.18.7.85:6641/api/v1/planning/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        throw new Error(data.message || data.detail || 'Failed to create order');
      }
  
      // Transform the response data to match your application's format
      const transformedData = {
        ...data,
      };
  
      // Update the orders list with the new order
      set((state) => ({ 
        orders: [...state.orders, transformedData], 
        isLoading: false 
      }));
  
      return transformedData;
    } catch (error) {
      console.error('Create Order Error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearOrderDetails: () => set({ orderDetails: null, error: null }),

  // Fetch all workcenters from the correct endpoint
  fetchWorkcenters: async () => {
    set({ isLoadingWorkcenters: true, workcenterError: null });
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data instead of API call
      set({ 
        workcenters: mockWorkcenters,
        isLoadingWorkcenters: false 
      });
      return mockWorkcenters;
    } catch (error) {
      console.error('Fetch workcenters error:', error);
      set({ 
        workcenterError: error.message,
        isLoadingWorkcenters: false 
      });
      throw error;
    }
  },

  // Update workcenter details
  updateWorkcenter: async (workcenterData) => {
    set({ isLoadingWorkcenters: true, workcenterError: null });
    try {
      const response = await fetch(`http://172.18.7.85:6641/api/v1/work_centers/${workcenterData.workcenter_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workcenterData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update workcenter');
      }
      
      const updatedWorkcenter = await response.json();
      
      set(state => ({
        workcenters: state.workcenters.map(w => 
          w.workcenter_id === updatedWorkcenter.workcenter_id ? updatedWorkcenter : w
        ),
        isLoadingWorkcenters: false
      }));
      
      return updatedWorkcenter;
    } catch (error) {
      console.error('Update workcenter error:', error);
      set({ 
        workcenterError: error.message,
        isLoadingWorkcenters: false 
      });
      throw error;
    }
  },

  addWorkcenter: async (newWorkcenter) => {
    set((state) => {
      const currentWorkcenters = state.workcenters;
      const newId = currentWorkcenters.length + 1;
      const workcenterWithId = { ...newWorkcenter, id: newId };
      return {
        workcenters: [...currentWorkcenters, workcenterWithId],
      };
    });
  },

  uploadMppFile: async (file, productionOrder, documentName, description, version) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('production_order', productionOrder);
      formData.append('document_name', documentName);
      formData.append('description', description || '');
      formData.append('version_number', version);
      formData.append('metadata', JSON.stringify({}));

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('http://172.18.7.85:6641/api/v1/documents/mpp/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload MPP file');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MPP Upload Error:', error);
      throw error;
    }
  },

  uploadEngineeringDrawing: async (file, productionOrder, documentName, description, version) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('production_order', productionOrder);
      formData.append('document_name', documentName);
      formData.append('description', description || '');
      formData.append('version_number', version);
      formData.append('metadata', JSON.stringify({}));

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('http://172.18.7.85:6641/api/v1/documents/engineering-drawing/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload engineering drawing');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Engineering Drawing Upload Error:', error);
      throw error;
    }
  },
}));

export default useOrderStore;