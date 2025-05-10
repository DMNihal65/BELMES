import { create } from 'zustand';
import { message } from 'antd';

export const fetchAllMachines = async () => {
  try {
    const response = await fetch('http://172.18.7.88:2327/api/v1/master-order/machines/');
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
    const response = await fetch(`http://172.18.7.88:2327/api/v1/master-order/machines/${machineId}`);
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
    const response = await fetch('http://172.18.7.88:2327/api/v1/master-order/machines/', {
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

const useWorkcentreStore = create((set, get) => ({
  workcentres: [],
  workcentreCodes: [],
  machineNames: [],
  workcentresList: [],
  isLoading: false,
  error: null,

  fetchWorkcentres: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:2327/api/v1/master-order/all-machines/');
      if (!response.ok) {
        throw new Error('Failed to fetch workcentres');
      }
      const data = await response.json();
      console.log('Fetched workcentres:', data);

      // Ensure data is an array and filter by work_centre_boolean
      const workcentresArray = Array.isArray(data) ? data.filter(item => item.work_centre_boolean === true) : [];

      // Extract unique workcentre codes and their details
      const uniqueWorkcentres = [...new Map(workcentresArray.map(item => 
        [item.work_centre?.code, item.work_centre]
      )).values()];

      set({ 
        workcentres: workcentresArray,
        isLoading: false,
        // Extract unique codes and machine names
        workcentreCodes: uniqueWorkcentres.map(wc => wc?.code).filter(Boolean),
        machineNames: [...new Set(workcentresArray.map(item => item.type).filter(Boolean))]
      });
    } catch (err) {
      console.error('Error fetching workcentres:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  fetchWorkcentresList: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:2327/api/v1/master-order/workcentres/?skip=0&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch workcentres list');
      }
      const data = await response.json();
      console.log('Fetched workcentres list:', data);

      set({ 
        workcentresList: data,
        isLoading: false 
      });
    } catch (err) {
      console.error('Error fetching workcentres list:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  updateWorkcentre: async (updatedItem) => {
    set({ isLoading: true });
    try {
      const requestBody = {
        work_centre_id: updatedItem.work_centre_id,
        type: updatedItem.type || '',
        make: updatedItem.make || '',
        model: updatedItem.model || '',
        year_of_installation: updatedItem.year_of_installation ? parseInt(updatedItem.year_of_installation) : 0,
        cnc_controller: updatedItem.cnc_controller || '',
        cnc_controller_series: updatedItem.cnc_controller_series || '',
        remarks: updatedItem.remarks || '',
        calibration_date: updatedItem.calibration_date || null,
        calibration_due_date: updatedItem.calibration_due_date || null,
        last_maintenance_date: updatedItem.last_maintenance_date || null
      };

      console.log('Sending update request with data:', requestBody);

      const response = await fetch(`http://172.18.7.88:2327/api/v1/master-order/machines/${updatedItem.id}`, {
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
      await get().fetchWorkcentres();

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
        work_centre_id: machineData.work_centre_id,
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

      const response = await fetch('http://172.18.7.88:2327/api/v1/master-order/machines/', {
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
      await get().fetchWorkcentres();
      
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

  createWorkcentre: async (workcentreData) => {
    set({ isLoading: true, error: null });
    try {
      // Prepare the request body according to API requirements
      const requestBody = {
        code: workcentreData.code,
        plant_id: workcentreData.plant_id || 'PLANT001',
        description: workcentreData.description,
        operation: workcentreData.operation,
        is_active: true,
        is_schedulable: true,
        type: "MACHINE",
        work_centre_name: workcentreData.work_centre_name
      };

      console.log('Creating workcentre with payload:', requestBody);

      // Create new workcentre
      const response = await fetch('http://172.18.7.88:2327/api/v1/master-order/workcentres/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create workcentre');
      }

      const newWorkcentre = await response.json();
      console.log('New workcentre created:', newWorkcentre);

      // Fetch all updated data
      const [workcentresResponse, allMachinesResponse] = await Promise.all([
        fetch('http://172.18.7.88:2327/api/v1/master-order/workcentres/?skip=0&limit=100'),
        fetch('http://172.18.7.88:2327/api/v1/master-order/all-machines/')
      ]);

      if (!workcentresResponse.ok || !allMachinesResponse.ok) {
        throw new Error('Failed to fetch updated workcentre data');
      }

      const [workcentresData, allMachinesData] = await Promise.all([
        workcentresResponse.json(),
        allMachinesResponse.json()
      ]);

      // Update all relevant data in the store
      set({
        workcentresList: workcentresData,
        workcentres: allMachinesData,
        workcentreCodes: [...new Set(workcentresData.map(wc => wc.code))].filter(Boolean),
        isLoading: false
      });

      message.success('Workcentre added successfully');
      return newWorkcentre;

    } catch (error) {
      console.error('Error creating workcentre:', error);
      set({ error: error.message, isLoading: false });
      message.error(error.message || 'Failed to create workcentre');
      throw error;
    }
  },
}));

export default useWorkcentreStore;
