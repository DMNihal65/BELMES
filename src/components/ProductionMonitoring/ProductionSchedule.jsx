import React, { useEffect } from 'react';
import { Card, Typography } from 'antd';
import dayjs from 'dayjs';
import SimpleGanttChart from './SimpleGanttChart';
import useGanttStore from '../../store/ganttChartStore';

const { Title, Text } = Typography;

const ProductionSchedule = () => {
  const {
    dateRange,
    selectedMachine,
    ganttData,
    machines,
    setDateRange,
    setSelectedMachine,
    fetchGanttData,
    resetData,
    isLoading,
    error,
  } = useGanttStore();

  // Initialize data on component mount
  useEffect(() => {
    fetchGanttData();
  }, [fetchGanttData]);

  const handleDateChange = (dates) => {
    if (!dates) {
      setDateRange([dayjs().startOf('day'), dayjs().endOf('day')]);
      return;
    }
    setDateRange(dates);
  };

  const handleMachineChange = (value) => {
    setSelectedMachine(value);
  };

  const handleSubmit = (forceRefresh = false) => {
    fetchGanttData(forceRefresh);
  };
  
  const handleClear = () => {
    resetData();
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <Title level={4} className="mb-1">
          Planned vs Actual
        </Title>
        <Text type="secondary">
          This chart displays scheduled operations against actual production logs. Only machines involved in currently active production orders are shown.
        </Text>
      </div>
      <Card 
        className="shadow-lg rounded-lg border-0"
        bodyStyle={{ padding: 0 }}
      >
        <SimpleGanttChart
          data={ganttData}
          machines={machines}
          dateRange={dateRange}
          selectedMachine={selectedMachine}
          onDateChange={handleDateChange}
          onMachineChange={handleMachineChange}
          onSubmit={handleSubmit}
          onClear={handleClear}
          isLoading={isLoading}
          error={error}
        />
      </Card>
    </div>
  );
};

export default ProductionSchedule; 