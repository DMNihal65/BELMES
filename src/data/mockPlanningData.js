// Mock Machines Data
export const mockMachines = [
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo',
    type: 'VMC',
    status: 'available',
    capabilities: ['milling', 'drilling', 'boring'],
    maxRPM: 12000,
    workingArea: '600x500x500',
    toolCapacity: 30,
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
    }
  },
  {
    id: 'DMG-002',
    name: 'DMG DMU 50',
    type: 'VMC',
    status: 'running',
    capabilities: ['milling', 'drilling'],
    maxRPM: 10000,
    workingArea: '500x450x400',
    toolCapacity: 24
  },
  {
    id: 'HMC-001',
    name: 'Makino A81',
    type: 'HMC',
    status: 'maintenance',
    capabilities: ['milling', 'drilling', 'boring', 'tapping'],
    maxRPM: 15000,
    workingArea: '800x700x700',
    toolCapacity: 40
  }
];

// For backward compatibility
export const mockMachineData = mockMachines;

// Mock Capacity Data for Calendar
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
  // ... other capacity data
];

// Generate Calendar Data
const generateCapacityData = () => {
  const dates = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    
    mockMachines.forEach(machine => {
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

// Mock Tools Data
export const mockTools = [
  {
    id: 'T101',
    description: 'Face Mill 63mm',
    type: 'Face Mill',
    diameter: 63,
    length: 120,
    material: 'Carbide',
    status: 'available'
  },
  {
    id: 'T102',
    description: 'End Mill 16mm',
    type: 'End Mill',
    diameter: 16,
    length: 100,
    material: 'Carbide',
    status: 'in-use'
  },
  {
    id: 'T201',
    description: 'Drill 12mm',
    type: 'Drill',
    diameter: 12,
    length: 150,
    material: 'HSS',
    status: 'available'
  }
];

// Mock Fixtures Data
export const mockFixtures = [
  {
    id: 'F-123',
    description: 'Universal Vice 160mm',
    type: 'Vice',
    status: 'available'
  },
  {
    id: 'F-124',
    description: 'Custom Fixture Assembly',
    type: 'Custom',
    status: 'in-use'
  }
];

// Mock Operations Data
export const mockOperations = [
  {
    key: '1',
    opNo: 'OP10',
    description: 'Face Milling',
    machine: 'DMG-001',
    cycleTime: '00:15:00',
    setupTime: '00:30:00',
    tools: ['T101', 'T102'],
    fixtures: ['F-123'],
    status: 'planned',
    precedingOps: [],
    parameters: {
      speed: 1200,
      feed: 300,
      doc: 0.5
    },
    qualityChecks: [
      { parameter: 'Flatness', specification: '0.02mm' },
      { parameter: 'Surface Finish', specification: 'Ra 1.6' }
    ]
  },
  {
    key: '2',
    opNo: 'OP20',
    description: 'Drilling',
    machine: 'DMG-002',
    cycleTime: '00:10:00',
    setupTime: '00:20:00',
    tools: ['T201'],
    fixtures: ['F-124'],
    status: 'planned',
    precedingOps: ['OP10'],
    parameters: {
      speed: 800,
      feed: 200,
      doc: 2.0
    },
    qualityChecks: [
      { parameter: 'Hole Diameter', specification: '12±0.02mm' },
      { parameter: 'Position', specification: '±0.05mm' }
    ]
  }
];

// Mock Job Data
export const mockJobData = {
  id: 'JOB-001',
  partNumber: 'PART-001',
  partName: 'Aluminum Housing',
  project: 'Project A',
  customer: 'Customer X',
  quantity: 100,
  priority: 'high',
  dueDate: '2024-02-01',
  status: 'planning',
  material: 'Aluminum 6061',
  operations: mockOperations,
  documents: {
    drawings: ['drawing1.pdf', 'drawing2.pdf'],
    instructions: ['instruction1.pdf'],
    quality: ['qc_plan.pdf']
  }
};

// Add Part Numbers data back
export const mockPartNumbers = [
  {
    id: 'PART-001',
    name: 'Aluminum Casting Component',
    cycleTime: 45,
    setupTime: 30,
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
  // ... other parts
]; 