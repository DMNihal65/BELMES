import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, Select } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useScheduleStore from '../../../../store/schedule-store';

const { Option } = Select;

// Define fixed colors for consistency
const COLORS = {
  '0': '#1890ff',  // Blue
  '1': '#52c41a',  // Green
  '2': '#faad14',  // Orange
  '3': '#f5222d',  // Red
  '4': '#722ed1',  // Purple
  '5': '#13c2c2',  // Cyan
  '6': '#eb2f96',  // Magenta
  '7': '#a0d911'   // Lime
};

const ProductionStatus = () => {
  const [partNumber, setPartNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [partNumberColors, setPartNumberColors] = useState({});
  const itemsPerPage = 10;
  const { 
    productionStatusData, 
    productionStatusLoading, 
    productionStatusError,
    timeFrame,
    fetchProductionStatus,
    fetchAvailablePartNumbers,
    availablePartNumbers
  } = useScheduleStore();

  // Set up color mapping when data changes
  useEffect(() => {
    if (productionStatusData && productionStatusData.length > 0) {
      const uniquePartNumbers = [...new Set(productionStatusData.map(item => item.part_number))];
      const newColorMap = {};
      uniquePartNumbers.forEach((pn, index) => {
        newColorMap[pn] = COLORS[index % Object.keys(COLORS).length];
      });
      setPartNumberColors(newColorMap);
    }
  }, [productionStatusData]);

  useEffect(() => {
    fetchAvailablePartNumbers();
    fetchProductionStatus('', 'daily');
  }, []);

  const handleSearch = () => {
    setPartNumber('');
    fetchProductionStatus('', timeFrame);
  };

  const handleTimeFrameChange = (value) => {
    fetchProductionStatus(partNumber, value);
  };

  const handlePartNumberChange = (value) => {
    setPartNumber(value);
    fetchProductionStatus(value, timeFrame);
  };

  const prepareChartData = () => {
    if (!productionStatusData || productionStatusData.length === 0) return [];

    // Get unique dates
    const allDates = [...new Set(productionStatusData.map(item => item.date))].sort();
    
    // Get top 4 part numbers if not filtered
    const selectedPartNumbers = partNumber 
      ? [partNumber] 
      : [...new Set(productionStatusData.map(item => item.part_number))].slice(0, 4);

    // Create chart data
    const chartData = allDates.map(date => {
      const dateData = { date };
      selectedPartNumbers.forEach(pn => {
        const record = productionStatusData.find(
          item => item.date === date && item.part_number === pn
        );
        dateData[pn] = record ? record.completed_quantity : 0;
      });
      return dateData;
    });

    console.log('Chart Data:', chartData); // Debug log
    return chartData;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <div key={index} className="mb-2">
              <div className="font-semibold" style={{ color: partNumberColors[entry.name] || COLORS[0] }}>
                {entry.name}
              </div>
              <div>Completed: {entry.value}</div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getPaginatedData = () => {
    if (!productionStatusData) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return productionStatusData.slice(startIndex, endIndex);
  };

  const totalPages = () => {
    if (!productionStatusData) return 1;
    return Math.ceil(productionStatusData.length / itemsPerPage);
  };

  const handlePageChange = (direction) => {
    setCurrentPage(prev => Math.max(1, Math.min(totalPages(), prev + direction)));
  };

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6 items-center">
        <Select
          showSearch
          placeholder="Select Part Number"
          value={partNumber}
          onChange={handlePartNumberChange}
          style={{ width: 200 }}
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          allowClear
        >
          {availablePartNumbers.map(pn => (
            <Option key={pn} value={pn}>{pn}</Option>
          ))}
        </Select>
        <Select
          style={{ width: 120 }}
          onChange={handleTimeFrameChange}
          value={timeFrame || 'daily'}
        >
          <Option value="daily">Daily</Option>
          <Option value="weekly">Weekly</Option>
          <Option value="monthly">Monthly</Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>
          Refresh
        </Button>
      </div>

      {productionStatusLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Spin size="large" />
        </div>
      ) : productionStatusError ? (
        <div className="text-red-500 text-center">
          Error: {productionStatusError}
        </div>
      ) : productionStatusData && productionStatusData.length > 0 ? (
        <>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  label={{ 
                    value: 'Completed Quantity', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -5
                  }} 
                />
                <Tooltip content={<CustomTooltip />} />
                {(partNumber ? [partNumber] : [...new Set(productionStatusData.map(item => item.part_number))].slice(0, 4))
                  .map((pn) => (
                    <Bar
                      key={pn}
                      dataKey={pn}
                      name={pn}
                      fill={partNumberColors[pn] || COLORS[0]}
                      maxBarSize={50}
                    />
                  ))
                }
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">Production Details</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border border-gray-300">Part Number</th>
                <th className="p-2 border border-gray-300">Date</th>
                <th className="p-2 border border-gray-300">Completed</th>
                <th className="p-2 border border-gray-300">Planned</th>
                <th className="p-2 border border-gray-300">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedData().map((item, index) => (
                <tr key={`${item.part_number}-${item.date}-${index}`}>
                  <td className="p-2 border border-gray-300">{item.part_number}</td>
                  <td className="p-2 border border-gray-300">{item.date}</td>
                  <td className="p-2 border border-gray-300">{item.completed_quantity}</td>
                  <td className="p-2 border border-gray-300">{item.planned_quantity}</td>
                  <td className="p-2 border border-gray-300">{item.remaining_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => handlePageChange(-1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages()}
            </span>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === totalPages()}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">
          No data available. Please select a part number or refresh.
        </div>
      )}
    </div>
  );
};

export default ProductionStatus; 