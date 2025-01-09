// useMachineStore.js
import create from 'zustand';

const useMachineStore = create((set) => ({
  selectedMachine: 'all', // Default to 'all' machine selected
  selectedMachines: ['all'], // Default to 'all' machine selected in multiple select

  setSelectedMachine: (machine) => set({ selectedMachine: machine }),
  setSelectedMachines: (machines) => set({ selectedMachines: machines }),
}));

export { useMachineStore }; // Named export