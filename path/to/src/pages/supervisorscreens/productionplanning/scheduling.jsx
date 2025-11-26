import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { DatePicker } from 'antd';

const Scheduling = () => {
  const [dateRange, setDateRange] = useState([
    moment().subtract(3, 'days').startOf('day'),
    moment().add(3, 'days').endOf('day')
  ]);
  const [visibleRange, setVisibleRange] = useState([
    moment().subtract(3, 'days').startOf('day'),
    moment().add(3, 'days').endOf('day')
  ]);
  const [isDateRangeSetByUser, setIsDateRangeSetByUser] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [selectedProductionOrders, setSelectedProductionOrders] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const handleRefresh = () => {
    setSelectedMachines([]);
    setSelectedComponents([]);
    setSelectedProductionOrders([]);
    setDateRange([
      moment().subtract(3, 'days').startOf('day'),
      moment().add(3, 'days').endOf('day')
    ]);
    setIsDateRangeSetByUser(false);
    fetchScheduleData();
  };

  const fetchScheduleData = () => {
    // Implementation of fetchScheduleData
  };

  useEffect(() => {
    if (scheduleData) {
      let filtered = scheduleData;
      
      if (selectedMachines.length > 0) {
        filtered = filterScheduleByMachines(selectedMachines);
      }
      
      if (selectedProductionOrders.length > 0) {
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => 
            selectedProductionOrders.includes(op.production_order)
          )
        };
      }

      if (selectedComponents.length > 0) {
        filtered = {
          ...filtered,
          scheduled_operations: filtered.scheduled_operations.filter(op => 
            selectedComponents.includes(op.component)
          )
        };
      }
  
      setFilteredData(filtered);

      if (!isDateRangeSetByUser && filtered.scheduled_operations.length > 0) {
        const startDates = filtered.scheduled_operations.map(op => moment(op.start_time));
        const endDates = filtered.scheduled_operations.map(op => moment(op.end_time));
        const minDate = moment.min(startDates).startOf('day').subtract(1, 'day');
        const maxDate = moment.max(endDates).endOf('day').add(1, 'day');

        setDateRange([minDate, maxDate]);
        setVisibleRange([minDate, maxDate]);
      }
    }
  }, [scheduleData, selectedMachines, selectedComponents, selectedProductionOrders, isDateRangeSetByUser]);

  return (
    <div>
      {/* Rest of the component JSX */}
    </div>
  );
};

export default Scheduling; 