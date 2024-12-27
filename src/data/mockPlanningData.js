export const mockMachineData = [
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo linear',
    status: 'running',
    totalCapacity: 24,
    usedCapacity: 18,
    plannedCapacity: 4,
    efficiency: 92,
    currentJob: {
      partNumber: 'PART-001',
      progress: 75,
      startTime: '08:00',
      endTime: '16:00',
      quantity: 100,
      completed: 75
    },
    nextJob: {
      partNumber: 'PART-002',
      startTime: '14:00',
      quantity: 50,
      estimatedHours: 6
    }
  },
  {
    id: 'DMG-002',
    name: 'DMG DMU 50 mB',
    status: 'idle',
    totalCapacity: 24,
    usedCapacity: 12,
    plannedCapacity: 8,
    efficiency: 85,
    currentJob: null,
    nextJob: {
      partNumber: 'PART-003',
      startTime: '12:00',
      quantity: 75,
      estimatedHours: 8
    }
  },
  {
    id: 'HMC-001',
    name: 'Horizontal Machining Center 01',
    status: 'maintenance',
    totalCapacity: 24,
    usedCapacity: 20,
    plannedCapacity: 2,
    efficiency: 78,
    currentJob: {
      partNumber: 'PART-004',
      progress: 90,
      startTime: '06:00',
      endTime: '14:00',
      quantity: 150,
      completed: 135
    },
    nextJob: null
  }
];

export const mockCapacityData = [
  {
    machineId: 'DMG-001',
    date: '2024-01-19',
    type: 'production',
    jobDetails: 'PART-001 (75/100)',
    status: 'processing',
    shift: '1',
    startTime: '08:00',
    endTime: '16:00',
    efficiency: 92,
    downtime: 0
  },
  {
    machineId: 'DMG-001',
    date: '2024-01-19',
    type: 'planned',
    jobDetails: 'PART-002 (0/50)',
    status: 'pending',
    shift: '2',
    startTime: '14:00',
    endTime: '20:00',
    efficiency: null,
    downtime: null
  },
  {
    machineId: 'DMG-002',
    date: '2024-01-19',
    type: 'maintenance',
    jobDetails: 'Scheduled Maintenance',
    status: 'completed',
    shift: '1',
    startTime: '08:00',
    endTime: '10:00',
    efficiency: null,
    downtime: 2
  },
  {
    machineId: 'HMC-001',
    date: '2024-01-19',
    type: 'production',
    jobDetails: 'PART-004 (135/150)',
    status: 'processing',
    shift: '1',
    startTime: '06:00',
    endTime: '14:00',
    efficiency: 78,
    downtime: 1.5
  }
];

// Add more dates for calendar view
const generateCapacityData = () => {
  const dates = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    
    mockMachineData.forEach(machine => {
      dates.push({
        machineId: machine.id,
        date: date.toISOString().split('T')[0],
        type: Math.random() > 0.7 ? 'maintenance' : 'production',
        jobDetails: `Sample Job ${i + 1}`,
        status: Math.random() > 0.5 ? 'processing' : 'pending',
        shift: Math.random() > 0.5 ? '1' : '2',
        startTime: '08:00',
        endTime: '16:00',
        efficiency: Math.floor(Math.random() * 20) + 80,
        downtime: Math.random() * 2
      });
    });
  }
  
  return dates;
};

export const mockCalendarData = generateCapacityData(); 

export const mockPartNumbers = [
  {
    id: 'PART-001',
    name: 'Aluminum Casting Component',
    cycleTime: 45, // minutes
    setupTime: 30, // minutes
    machineTypes: ['DMG-001', 'DMG-002'],
    priority: 'high',
    specifications: {
      material: 'Aluminum',
      weight: '2.5kg',
      dimensions: '200x150x100mm'
    }
  },
  {
    id: 'PART-002',
    name: 'Steel Bearing Housing',
    cycleTime: 60,
    setupTime: 45,
    machineTypes: ['DMG-001', 'HMC-001'],
    priority: 'medium',
    specifications: {
      material: 'Steel',
      weight: '4.2kg',
      dimensions: '180x180x150mm'
    }
  },
  {
    id: 'PART-003',
    name: 'Precision Shaft Assembly',
    cycleTime: 75,
    setupTime: 60,
    machineTypes: ['DMG-002'],
    priority: 'high',
    specifications: {
      material: 'Hardened Steel',
      weight: '3.8kg',
      dimensions: '400x100x100mm'
    }
  },
  {
    id: 'PART-004',
    name: 'Gear Box Housing',
    cycleTime: 90,
    setupTime: 40,
    machineTypes: ['HMC-001', 'DMG-002'],
    priority: 'medium',
    specifications: {
      material: 'Cast Iron',
      weight: '7.5kg',
      dimensions: '300x250x200mm'
    }
  }
]; 