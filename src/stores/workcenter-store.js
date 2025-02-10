const BASE_URL = 'http://172.18.7.85:4723';

export const fetchAllMachines = async () => {
  try {
    const response = await fetch(`${BASE_URL}/master-order/all-machines`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch machines: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // Debug log
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Network Error:', error);
    return [];
  }
};

export const createMachine = async (machineData) => {
  try {
    const response = await fetch(`${BASE_URL}/master-order/machines/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(machineData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create machine');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating machine:', error);
    throw error;
  }
};

export const fetchMachineDetails = async (machineId) => {
  try {
    const response = await fetch(`${BASE_URL}/master-order/machines/${machineId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch machine details: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching machine details:', error);
    throw error;
  }
};

export const createWorkcenter = async (workcenterData) => {
  try {
    // Only include the required fields in the request
    const payload = {
      code: workcenterData.code,
      plant_id: workcenterData.plant_id,
      description: workcenterData.description,
      operation: workcenterData.operation
    };

    const response = await fetch(`${BASE_URL}/master-order/workcenters/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create workcenter');
    }

    const data = await response.json();
    console.log('Workcenter created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating workcenter:', error);
    throw error;
  }
}; 