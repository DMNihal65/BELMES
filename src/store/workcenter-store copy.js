import { create } from 'zustand';
import { message } from 'antd';

export const fetchAllMachines = async () => {
  try {
    const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/machines/');
    if (!response.ok) {
      throw new Error('Failed to fetch machines');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching machines:', error);
    throw error;
  }
};

export const fetchMachineDetails = async (machineId) => {
  try {
    const response = await fetch(`http://172.19.224.1:8002/api/v1/master-order/machines/${machineId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch machine details');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching machine details:', error);
    throw error;
  }
};

export const createMachine = async (machineData) => {
  try {
    const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/machines/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(machineData),
    });
    if (!response.ok) {
      throw new Error('Failed to create machine');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating machine:', error);
    throw error;
  }
};

const useWorkcenterStore = create((set, get) => ({
  workcenters: [],
  workcenterCodes: [],
  machineNames: [],
  workcentersList: [],
  isLoading: false,
  error: null,

  fetchWorkcenters: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/all-machines/');
      if (!response.ok) {
        throw new Error('Failed to fetch workcenters');
      }
      const data = await response.json();
      console.log('Fetched workcenters:', data);

      // Ensure data is an array and filter by work_center_boolean
      const workcentersArray = Array.isArray(data) ? data.filter(item => item.work_center_boolean === true) : [];

      // Extract unique workcenter codes and their details
      const uniqueWorkcenters = [...new Map(workcentersArray.map(item => 
        [item.work_center?.code, item.work_center]
      )).values()];

      set({ 
        workcenters: workcentersArray,
        isLoading: false,
        // Extract unique codes and machine names
        workcenterCodes: uniqueWorkcenters.map(wc => wc?.code).filter(Boolean),
        machineNames: [...new Set(workcentersArray.map(item => item.type).filter(Boolean))]
      });
    } catch (err) {
      console.error('Error fetching workcenters:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  fetchWorkcentersList: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/workcenters/?skip=0&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch workcenters list');
      }
      const data = await response.json();
      console.log('Fetched workcenters list:', data);

      set({ 
        workcentersList: data,
        isLoading: false 
      });
    } catch (err) {
      console.error('Error fetching workcenters list:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  updateWorkcenter: async (updatedItem) => {
    set({ isLoading: true });
    try {
      const requestBody = {
        work_center_id: updatedItem.work_center_id,
        type: updatedItem.type || '',
        make: updatedItem.make || '',
        model: updatedItem.model || '',
        year_of_installation: updatedItem.year_of_installation ? parseInt(updatedItem.year_of_installation) : 0,
        cnc_controller: updatedItem.cnc_controller || '',
        cnc_controller_series: updatedItem.cnc_controller_series || '',
        remarks: updatedItem.remarks || '',
        calibration_date: updatedItem.calibration_date || null,
        calibration_due_date: updatedItem.calibration_due_date || null,
        last_maintenance_date: updatedItem.last_maintenance_date || null,
        pm_due_date: updatedItem.pm_due_date || null
      };

      console.log('Sending update request with data:', requestBody);

      const response = await fetch(`http://172.19.224.1:8002/api/v1/master-order/machines/${updatedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to update machine';
        if (responseData.detail) {
          errorMessage = typeof responseData.detail === 'object' 
            ? JSON.stringify(responseData.detail) 
            : responseData.detail;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
        throw new Error(errorMessage);
      }

      console.log('Update response:', responseData);

      // Fetch the updated data to refresh the table
      await get().fetchWorkcenters();

      set({ isLoading: false, error: null });
      message.success('Machine updated successfully');
      return responseData;

    } catch (error) {
      console.error('Error updating machine:', error);
      set({ error: error.message, isLoading: false });
      message.error(error.message || 'Failed to update machine');
      throw error;
    }
  },

  createMachine: async (machineData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Creating machine with data:', machineData);

      const newMachinePayload = {
        work_center_id: machineData.work_center_id,
        type: machineData.type,
        make: machineData.make,
        model: machineData.model,
        year_of_installation: machineData.year_of_installation,
        cnc_controller: machineData.cnc_controller || '',
        cnc_controller_series: machineData.cnc_controller_series || '',
        remarks: machineData.remarks || '',
        calibration_date: machineData.calibration_date,
        calibration_due_date: machineData.calibration_due_date,
        last_maintenance_date: machineData.last_maintenance_date
      };

      console.log('Sending payload to API:', newMachinePayload);

      const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/machines/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newMachinePayload)
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Network error: Please check your connection and try again');
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        let errorMessage = 'Failed to create machine';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail[0]?.msg || errorData.detail[0] || errorMessage;
          } else if (typeof errorData.detail === 'object') {
            errorMessage = JSON.stringify(errorData.detail);
          } else {
            errorMessage = errorData.detail;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Fetch updated data after successful creation
      await get().fetchWorkcenters();
      
      set({ isLoading: false });
      message.success('Machine added successfully');
      
      return data;
    } catch (error) {
      console.error('Error creating machine:', error);
      set({ error: error.message, isLoading: false });
      message.error(error.message || 'Failed to create machine');
      throw error;
    }
  },

  createWorkcenter: async (workcenterData) => {
    set({ isLoading: true, error: null });
    try {
      // Prepare the request body according to API requirements
      const requestBody = {
        code: workcenterData.code,
        plant_id: workcenterData.plant_id || 'PLANT001',
        description: workcenterData.description,
        operation: workcenterData.operation,
        is_active: true,
        is_schedulable: true,
        type: "MACHINE",
        work_center_name: workcenterData.work_center_name
      };

      console.log('Creating workcenter with payload:', requestBody);

      // Create new workcenter
      const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/workcenters/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create workcenter');
      }

      const newWorkcenter = await response.json();
      console.log('New workcenter created:', newWorkcenter);

      // Fetch all updated data
      const [workcentersResponse, allMachinesResponse] = await Promise.all([
        fetch('http://172.19.224.1:8002/api/v1/master-order/workcenters/?skip=0&limit=100'),
        fetch('http://172.19.224.1:8002/api/v1/master-order/all-machines/')
      ]);

      if (!workcentersResponse.ok || !allMachinesResponse.ok) {
        throw new Error('Failed to fetch updated workcenter data');
      }

      const [workcentersData, allMachinesData] = await Promise.all([
        workcentersResponse.json(),
        allMachinesResponse.json()
      ]);

      // Update all relevant data in the store
      set({
        workcentersList: workcentersData,
        workcenters: allMachinesData,
        workcenterCodes: [...new Set(workcentersData.map(wc => wc.code))].filter(Boolean),
        isLoading: false
      });

      message.success('Workcenter added successfully');
      return newWorkcenter;

    } catch (error) {
      console.error('Error creating workcenter:', error);
      set({ error: error.message, isLoading: false });
      message.error(error.message || 'Failed to create workcenter');
      throw error;
    }
  },
}));

export default useWorkcenterStore;
