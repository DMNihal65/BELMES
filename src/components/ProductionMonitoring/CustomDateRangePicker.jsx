// Production Schedule Date and Time Picker Component
import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const CustomDateRangePicker = ({ value, onChange, disabled }) => {
  const handleChange = (dates) => {
    if (!dates) {
      onChange(null);
      return;
    }

    // Ensure we preserve the time component
    const [start, end] = dates;
    
    // Debug log
    console.log('Date picker change:', {
      rawStart: start,
      rawEnd: end,
      formattedStart: start.format('YYYY-MM-DD HH:mm:ss'),
      formattedEnd: end.format('YYYY-MM-DD HH:mm:ss')
    });

    onChange([start, end]);
  };

  return (
    <RangePicker
      value={value}
      onChange={handleChange}
      showTime={{ format: 'HH:mm:ss' }}
      format="YYYY-MM-DD HH:mm:ss"
      className="min-w-[300px]"
      allowClear={true}
      disabled={disabled}
      presets={[
        {
          label: 'Today',
          value: [dayjs().startOf('day'), dayjs().endOf('day')]
        },
        {
          label: 'This Week',
          value: [dayjs().startOf('week'), dayjs().endOf('week')]
        },
        {
          label: 'This Month',
          value: [dayjs().startOf('month'), dayjs().endOf('month')]
        }
      ]}
    />
  );
};

export default CustomDateRangePicker;