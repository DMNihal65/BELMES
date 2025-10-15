import { create } from 'zustand';
import axios from 'axios';

const useSchedulePlannedStore = create((set, get) => ({
  // State
  scheduleData: null,
  loading: false,
  error: null,
  machines: [],
  workCenters: [],
  productionOrders: [],
  components: [],
  selectedMachines: [],
  selectedProductionOrders: [],
  selectedComponents: [],
  dateRange: null,
  viewType: 'week',

  // API Base URL
  API_BASE_URL: 'http://172.19.224.1:8002/api/v1/scheduling-planned',

  // Fetch schedule data from the endpoint
  fetchScheduleData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${get().API_BASE_URL}/schedule/planned`);
      const data = response.data;

      // Extract and process data
      const processedData = get().processScheduleData(data);
      
      set({ 
        scheduleData: data,
        machines: processedData.machines,
        workCenters: processedData.workCenters,
        productionOrders: processedData.productionOrders,
        components: processedData.components,
        loading: false 
      });

      return data;
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to fetch schedule data', 
        loading: false 
      });
      throw error;
    }
  },

  // Process raw schedule data
  processScheduleData: (data) => {
    const { scheduled_operations = [], work_centers = [] } = data;

    // Extract unique machines from work_centers - THIS IS THE KEY CHANGE
    const machinesMap = new Map();
    work_centers.forEach(workCenter => {
      workCenter.machines?.forEach(machine => {
        const machineKey = `${workCenter.work_center_code}-${machine.name}`;
        machinesMap.set(machineKey, {
          id: machineKey,
          name: machine.name,
          fullName: `${workCenter.work_center_code} - ${machine.name}`,
          workCenterCode: workCenter.work_center_code,
          workCenterName: workCenter.work_center_name,
          machineId: machine.id,
          model: machine.model,
          type: machine.type,
          isSchedulable: workCenter.is_schedulable,
          hasOperations: false // Initialize as false
        });
      });
    });

    // Mark machines that have operations
    const machinesWithOperations = new Set();
    scheduled_operations.forEach(op => {
      machinesWithOperations.add(op.machine);
      if (machinesMap.has(op.machine)) {
        const machine = machinesMap.get(op.machine);
        machine.hasOperations = true;
        machinesMap.set(op.machine, machine);
      }
    });

    // Convert to array - ALL machines from work_centers will be included
    const machines = Array.from(machinesMap.values());
    
    // Add any machines from operations that aren't in work_centers (edge case)
    scheduled_operations.forEach(op => {
      if (!machinesMap.has(op.machine)) {
        machines.push({
          id: op.machine,
          name: op.machine,
          fullName: op.machine,
          workCenterCode: 'UNKNOWN',
          workCenterName: 'Unknown Work Center',
          machineId: op.machine,
          model: 'Unknown',
          type: 'Unknown',
          isSchedulable: true,
          hasOperations: true
        });
      }
    });

    // Sort machines by work center and then by name
    machines.sort((a, b) => {
      if (a.workCenterCode !== b.workCenterCode) {
        return a.workCenterCode.localeCompare(b.workCenterCode);
      }
      return a.name.localeCompare(b.name);
    });

    // Extract unique production orders
    const productionOrders = [...new Set(scheduled_operations.map(op => op.production_order))]
      .filter(Boolean)
      .map(order => ({
        id: order,
        name: order,
        value: order
      }));

    // Extract unique components
    const components = [...new Set(scheduled_operations.map(op => op.component))]
      .filter(Boolean)
      .map(component => ({
        id: component,
        name: component,
        value: component,
        description: scheduled_operations.find(op => op.component === component)?.part_description || component
      }));

    // Process work centers
    const workCenters = work_centers.map(wc => ({
      id: wc.work_center_code,
      code: wc.work_center_code,
      name: wc.work_center_name,
      isSchedulable: wc.is_schedulable,
      machines: wc.machines?.map(machine => ({
        id: machine.id,
        name: machine.name,
        model: machine.model,
        type: machine.type,
        fullName: `${wc.work_center_code} - ${machine.name}`
      })) || []
    }));

    return {
      machines,
      workCenters,
      productionOrders,
      components
    };
  },

  // Generate distinct colors for production orders
  generateProductionOrderColors: () => {
    const { productionOrders } = get();
    const baseColors = [
      '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d',
      '#722ed1', '#eb2f96', '#fa8c16', '#a0d911', '#fadb14',
      '#2f54eb', '#fa541c', '#52c41a', '#1890ff', '#13c2c2'
    ];

    const colors = [...baseColors];
    while (colors.length < productionOrders.length) {
      const hue = (colors.length * 137.508) % 360;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }

    return productionOrders.reduce((acc, order, index) => {
      acc[order.id] = colors[index];
      return acc;
    }, {});
  },

  // Get filtered operations based on current filters
  getFilteredOperations: () => {
    const { 
      scheduleData, 
      selectedMachines, 
      selectedProductionOrders, 
      selectedComponents,
      dateRange 
    } = get();

    if (!scheduleData?.scheduled_operations) return [];

    let operations = [...scheduleData.scheduled_operations];

    // Filter by machines
    if (selectedMachines.length > 0) {
      operations = operations.filter(op => selectedMachines.includes(op.machine));
    }

    // Filter by production orders
    if (selectedProductionOrders.length > 0) {
      operations = operations.filter(op => selectedProductionOrders.includes(op.production_order));
    }

    // Filter by components
    if (selectedComponents.length > 0) {
      operations = operations.filter(op => selectedComponents.includes(op.component));
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day').toDate();
      const endDate = dateRange[1].endOf('day').toDate();
      
      operations = operations.filter(op => {
        const opStart = new Date(op.start_time);
        const opEnd = new Date(op.end_time);
        return (opStart >= startDate && opStart <= endDate) || 
               (opEnd >= startDate && opEnd <= endDate) ||
               (opStart <= startDate && opEnd >= endDate);
      });
    }

    return operations;
  },

  // Get timeline items for vis-timeline
  getTimelineItems: () => {
    const operations = get().getFilteredOperations();
    const colors = get().generateProductionOrderColors();

    return operations.map((op, index) => ({
      id: `${op.component}-${op.production_order}-${index}`,
      group: op.machine,
      content: `
        <div class="timeline-item" style="padding: 4px 8px; color: white; font-size: 12px; font-weight: 500;">
          <div>${op.production_order}</div>
        
        </div>
      `,
      start: new Date(op.start_time),
      end: new Date(op.end_time),
      className: `order-${op.production_order.replace(/[^a-zA-Z0-9]/g, '-')}`,
      style: `
        background-color: ${colors[op.production_order] || '#1890ff'};
        border-color: ${colors[op.production_order] || '#1890ff'};
        border-width: 2px;
        border-radius: 4px;
      `,
      operation: op
    }));
  },

  // MODIFIED: Get timeline groups (machines) - Show ALL machines by default
  getTimelineGroups: () => {
    const { machines, selectedMachines } = get();
    
    // If machines are specifically selected, show only those
    // Otherwise, show ALL machines from work_centers
    const visibleMachines = selectedMachines.length > 0 
      ? machines.filter(machine => selectedMachines.includes(machine.id))
      : machines; // Show ALL machines

    return visibleMachines.map((machine, index) => ({
      id: machine.id,
      content: `
        <div class="machine-group" style="padding: 8px 12px; font-size: 13px; font-weight: 500; ${!machine.hasOperations ? 'opacity: 0.6;' : ''}">
          ${machine.fullName}
          ${!machine.hasOperations ? '<span style="font-size: 10px; color: #999; margin-left: 8px;">(No Operations)</span>' : ''}
        </div>
      `,
      order: index
    }));
  },

  // Get machine utilization
  getMachineUtilization: (machineId) => {
    const operations = get().getFilteredOperations();
    const machineOps = operations.filter(op => op.machine === machineId);
    
    if (machineOps.length === 0) return { utilization: 0, operations: 0 };

    const totalDuration = machineOps.reduce((acc, op) => {
      const duration = new Date(op.end_time) - new Date(op.start_time);
      return acc + duration;
    }, 0);

    // Assume 8-hour working days
    const workingHours = 8 * 60 * 60 * 1000;
    const utilization = Math.min(100, (totalDuration / workingHours) * 100);

    return {
      utilization: Math.round(utilization * 10) / 10,
      operations: machineOps.length,
      totalHours: Math.round((totalDuration / (1000 * 60 * 60)) * 10) / 10
    };
  },

  // Get production order details
  getProductionOrderDetails: (productionOrder) => {
    const { scheduleData } = get();
    if (!scheduleData) return null;

    const operations = scheduleData.scheduled_operations.filter(
      op => op.production_order === productionOrder
    );

    if (operations.length === 0) return null;

    const startTimes = operations.map(op => new Date(op.start_time));
    const endTimes = operations.map(op => new Date(op.end_time));
    const earliestStart = new Date(Math.min(...startTimes));
    const latestEnd = new Date(Math.max(...endTimes));

    const componentStatus = scheduleData.component_status?.[`${operations[0].component}_${productionOrder}`];

    return {
      productionOrder,
      component: operations[0].component,
      partDescription: operations[0].part_description,
      operations: operations.length,
      startTime: earliestStart,
      endTime: latestEnd,
      duration: ((latestEnd - earliestStart) / (1000 * 60 * 60)).toFixed(1),
      machines: [...new Set(operations.map(op => op.machine))],
      status: componentStatus,
      operations: operations
    };
  },

  // Setters
  setSelectedMachines: (machines) => set({ selectedMachines: machines }),
  setSelectedProductionOrders: (orders) => set({ selectedProductionOrders: orders }),
  setSelectedComponents: (components) => set({ selectedComponents: components }),
  setDateRange: (range) => set({ dateRange: range }),
  setViewType: (type) => set({ viewType: type }),

  // Clear all filters
  clearFilters: () => set({
    selectedMachines: [],
    selectedProductionOrders: [],
    selectedComponents: [],
    dateRange: null
  }),

  // Refresh data
  refreshData: async () => {
    get().clearFilters();
    await get().fetchScheduleData();
  },

  // Get operation conflicts (operations on same machine at same time)
  getOperationConflicts: () => {
    const operations = get().getFilteredOperations();
    const conflicts = [];
    
    operations.forEach((op1, i) => {
      operations.slice(i + 1).forEach(op2 => {
        if (op1.machine === op2.machine) {
          const start1 = new Date(op1.start_time);
          const end1 = new Date(op1.end_time);
          const start2 = new Date(op2.start_time);
          const end2 = new Date(op2.end_time);
          
          // Check for time overlap
          if ((start1 < end2 && end1 > start2)) {
            conflicts.push({ 
              operation1: op1, 
              operation2: op2,
              machine: op1.machine,
              overlapStart: new Date(Math.max(start1.getTime(), start2.getTime())),
              overlapEnd: new Date(Math.min(end1.getTime(), end2.getTime()))
            });
          }
        }
      });
    });
    
    return conflicts;
  },

  // Get daily production summary
  getDailyProductionSummary: () => {
    const { scheduleData } = get();
    if (!scheduleData?.daily_production) return {};
    
    return scheduleData.daily_production;
  },

  // Get overall metrics
  getOverallMetrics: () => {
    const { scheduleData } = get();
    if (!scheduleData) return null;

    const operations = get().getFilteredOperations();
    const conflicts = get().getOperationConflicts();
    const machines = [...new Set(operations.map(op => op.machine))];
    const totalDuration = operations.reduce((acc, op) => {
      return acc + (new Date(op.end_time) - new Date(op.start_time));
    }, 0);

    return {
      totalOperations: operations.length,
      totalMachines: machines.length,
      totalProductionOrders: [...new Set(operations.map(op => op.production_order))].length,
      totalComponents: [...new Set(operations.map(op => op.component))].length,
      totalDurationHours: Math.round((totalDuration / (1000 * 60 * 60)) * 10) / 10,
      conflicts: conflicts.length,
      overallEndTime: scheduleData.overall_end_time,
      overallTime: scheduleData.overall_time
    };
  },

  // Get work center summary
  getWorkCenterSummary: () => {
    const { workCenters } = get();
    const operations = get().getFilteredOperations();

    return workCenters.map(workCenter => {
      const workCenterOperations = operations.filter(op => 
        workCenter.machines.some(machine => 
          `${workCenter.code}-${machine.name}` === op.machine
        )
      );

      return {
        ...workCenter,
        operationCount: workCenterOperations.length,
        utilization: workCenter.machines.reduce((acc, machine) => {
          const machineId = `${workCenter.code}-${machine.name}`;
          const util = get().getMachineUtilization(machineId);
          return acc + util.utilization;
        }, 0) / workCenter.machines.length
      };
    });
  }
}));

export default useSchedulePlannedStore;