import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Spin, Radio, Tabs, DatePicker, message, Select, Form } from 'antd';
import ReactECharts from 'echarts-for-react';
import useScheduleStore from '../../../../store/schedule-store';
import debounce from 'lodash/debounce';
import { ReloadOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const ProductionStatus = () => {
  const [partNumber, setPartNumber] = useState([]);
  const [selectedDetailPartNumber, setSelectedDetailPartNumber] = useState([]);
  const [timeRange, setTimeRange] = useState('daily');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [partNumberOptions, setPartNumberOptions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const { 
    productionStatusData, 
    productionStatusLoading, 
    productionStatusError,
    fetchProductionStatus,
    fetchWeeklyProductionStatus,
    fetchMonthlyProductionStatus,
    clearProductionStatus,
    fetchPartNumberSuggestions
  } = useScheduleStore();

  // Load initial part numbers when component mounts
  useEffect(() => {
    const loadInitialPartNumbers = async () => {
      try {
        const suggestions = await fetchPartNumberSuggestions('');
        setPartNumberOptions(suggestions);
      } catch (error) {
        console.error('Error loading initial part numbers:', error);
      }
    };
    loadInitialPartNumbers();
  }, [fetchPartNumberSuggestions]);

  // Handle part number search/select
  const handlePartNumberSearch = async (value) => {
    if (value) {
      setFetching(true);
      try {
        const suggestions = await fetchPartNumberSuggestions(value);
        setPartNumberOptions(suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setFetching(false);
      }
    } else {
      const suggestions = await fetchPartNumberSuggestions('');
      setPartNumberOptions(suggestions);
    }
  };

  const handlePartNumberChange = (value) => {
    setPartNumber(value);
    
    // If we have already searched and have valid dates, trigger a new search
    if (hasSearched && startDate && endDate) {
      const startEpoch = Math.floor(startDate.valueOf() / 1000);
      const endEpoch = Math.floor(endDate.valueOf() / 1000);
      
      switch (timeRange) {
        case 'daily':
          fetchProductionStatus(value || '', startEpoch, endEpoch); // Pass empty string if value is null
          break;
        case 'weekly':
          fetchWeeklyProductionStatus(value || '', startEpoch, endEpoch);
          break;
        case 'monthly':
          fetchMonthlyProductionStatus(value || '', startEpoch, endEpoch);
          break;
      }
    }
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    if (hasSearched && startDate && endDate) {
      // If we have valid dates, automatically search with new time range
      const startEpoch = Math.floor(startDate.valueOf() / 1000);
      const endEpoch = Math.floor(endDate.valueOf() / 1000);
      
      switch (e.target.value) {
        case 'daily':
          fetchProductionStatus(partNumber, startEpoch, endEpoch);
          break;
        case 'weekly':
          fetchWeeklyProductionStatus(partNumber, startEpoch, endEpoch);
          break;
        case 'monthly':
          fetchMonthlyProductionStatus(partNumber, startEpoch, endEpoch);
          break;
      }
    } else {
      // If we don't have valid dates, just clear the data
      setHasSearched(false);
    }
  };

  const handleSearch = () => {
    if (!startDate || !endDate) {
      message.error('Please select both start and end dates');
      return;
    }

    const startEpoch = Math.floor(startDate.valueOf() / 1000);
    const endEpoch = Math.floor(endDate.valueOf() / 1000);
    setHasSearched(true);

    switch (timeRange) {
      case 'daily':
        fetchProductionStatus(partNumber, startEpoch, endEpoch);
        break;
      case 'weekly':
        fetchWeeklyProductionStatus(partNumber, startEpoch, endEpoch);
        break;
      case 'monthly':
        fetchMonthlyProductionStatus(partNumber, startEpoch, endEpoch);
        break;
    }
  };

  const handleReset = () => {
    setPartNumber('');
    setSelectedDetailPartNumber('');
    setTimeRange('daily');
    setStartDate(null);
    setEndDate(null);
    setHasSearched(false);
    clearProductionStatus();
  };

  const getStackedBarChartOption = () => {
    if (!hasSearched || !productionStatusData?.daily_production) return null;

    const data = productionStatusData.daily_production;
    const uniquePartNumbers = [...new Set(data.map(item => item.part_number))];
    const dateField = timeRange === 'daily' ? 'date' : 
                     timeRange === 'weekly' ? 'week_start_date' : 'month_start_date';
    const dates = [...new Set(data.map(item => item[dateField]))];

    return {
      title: {
        text: partNumber ? `Production Status for ${partNumber}` : 'Overall Production Status',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          let tooltip = `${params[0].axisValue}<br/>`;
          params.forEach(param => {
            const record = data.find(item => 
              item.part_number === param.seriesName && 
              item[dateField] === param.axisValue
            );
            tooltip += `${param.marker} ${param.seriesName}<br/>`;
            tooltip += `Operation: ${record?.operation_description || 'N/A'}<br/>`;
            tooltip += `Completed: ${param.value}<br/><br/>`;
          });
          return tooltip;
        }
      },
      legend: {
        data: uniquePartNumbers,
        top: 30,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        top: uniquePartNumbers.length > 10 ? 100 : 80
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: 'Quantity'
      },
      series: uniquePartNumbers.map(part => ({
        name: part,
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: dates.map(date => {
          const record = data.find(item => 
            item.part_number === part && item[dateField] === date
          );
          return record ? record.completed_quantity : 0;
        })
      }))
    };
  };

  const getDetailedChartOption = () => {
    if (!hasSearched || !productionStatusData?.daily_production) return null;

    let data = productionStatusData.daily_production;
    
    // Filter data if a specific part number is selected for detailed view
    if (selectedDetailPartNumber) {
      data = data.filter(item => item.part_number === selectedDetailPartNumber);
    }

    const dateField = timeRange === 'daily' ? 'date' : 
                     timeRange === 'weekly' ? 'week_start_date' : 'month_start_date';
    const dates = [...new Set(data.map(item => item[dateField]))];

    return {
      title: {
        text: `Detailed Production Analysis${selectedDetailPartNumber ? ` for ${selectedDetailPartNumber}` : ''}`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const date = params[0].axisValue;
          const record = data.find(item => item[dateField] === date);
          let tooltip = `${date}<br/>`;
          if (record) {
            tooltip += `Part Number: ${record.part_number}<br/>`;
            tooltip += `Operation: ${record.operation_description}<br/><br/>`;
          }
          params.forEach(param => {
            tooltip += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
          });
          return tooltip;
        }
      },
      legend: {
        data: ['Planned', 'Completed', 'Remaining'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        top: 80
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: 'Quantity'
      },
      series: [
        {
          name: 'Planned',
          type: 'bar',
          data: data.map(item => item.planned_quantity),
          itemStyle: { color: '#1890ff' }
        },
        {
          name: 'Completed',
          type: 'bar',
          data: data.map(item => item.completed_quantity),
          itemStyle: { color: '#52c41a' }
        },
        {
          name: 'Remaining',
          type: 'bar',
          data: data.map(item => item.remaining_quantity),
          itemStyle: { color: '#ff4d4f' }
        }
      ]
    };
  };

  const getPieChartOption = () => {
    if (!hasSearched || !productionStatusData?.total_planned || !productionStatusData?.total_completed) return null;

    const partNumbers = Object.keys(productionStatusData.total_planned);
    const data = partNumbers.map(part => ({
      name: part,
      value: productionStatusData.total_completed[part] || 0
    }));

    return {
      title: {
        text: 'Total Completion by Part Number',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        type: 'scroll'
      },
      series: [
        {
          name: 'Completed Quantity',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '20',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  };

  // Add function to get unique part numbers
  const getUniquePartNumbers = () => {
    if (!productionStatusData?.daily_production) return [];
    return [...new Set(productionStatusData.daily_production.map(item => item.part_number))];
  };

  return (
    <Card className="mt-4">
      <div className="flex flex-wrap gap-4 mb-6">
        <Form.Item
          label="Part Number"
          className="mb-2 sm:mb-0"
          style={{ minWidth: '250px', flex: '1 1 250px' }}
        >
          <Select
            placeholder="Select Part Number"
            showSearch
            value={partNumber}
            style={{ width: '200px' }}
            defaultActiveFirstOption={false}
            showArrow={true}
            onSearch={handlePartNumberSearch}
            onChange={handlePartNumberChange}
            loading={fetching}
            options={partNumberOptions}
            allowClear
            filterOption={false}
            notFoundContent={fetching ? <Spin size="small" /> : 'No matches found'}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          />
        </Form.Item>
        <div className="flex flex-wrap gap-4 items-start" style={{ flex: '1 1 auto' }}>
          <DatePicker
            placeholder="Start Date"
            onChange={(date) => setStartDate(date)}
            className="w-[140px]"
            value={startDate}
          />
          <DatePicker
            placeholder="End Date"
            onChange={(date) => setEndDate(date)}
            className="w-[140px]"
            value={endDate}
          />
          <Radio.Group value={timeRange} onChange={handleTimeRangeChange} className="flex-shrink-0">
            <Radio.Button value="daily">Daily</Radio.Button>
            <Radio.Button value="weekly">Weekly</Radio.Button>
            <Radio.Button value="monthly">Monthly</Radio.Button>
          </Radio.Group>
          <div className="flex gap-2 flex-shrink-0">
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
              title="Reset Filters"
            />
          </div>
        </div>
      </div>

      {productionStatusLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Spin size="large" />
        </div>
      ) : productionStatusError ? (
        <div className="text-red-500 text-center min-h-[400px] flex items-center justify-center">
          Error: {productionStatusError}
        </div>
      ) : !hasSearched ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
          <div className="text-lg mb-2">Welcome to Production Status Dashboard</div>
          <div>Please select date range and click search to view production data</div>
        </div>
      ) : productionStatusData?.daily_production?.length > 0 ? (
        <Tabs defaultActiveKey="1" className="production-status-tabs">
          <TabPane tab="Stacked Overview" key="1">
            <div className="chart-container">
              <ReactECharts
                option={getStackedBarChartOption()}
                style={{ height: '500px', minHeight: '400px', width: '100%' }}
                opts={{ renderer: 'svg' }}
                onEvents={{
                  resize: () => {
                    // Force chart resize on container resize
                    window.dispatchEvent(new Event('resize'));
                  }
                }}
              />
            </div>
          </TabPane>
          <TabPane tab="Detailed Analysis" key="2">
            <div className="flex flex-wrap justify-end mb-4 items-center gap-4">
              <Form.Item
                label="Filter by Part Number"
                className="mb-0 flex-1"
                style={{ minWidth: '250px', maxWidth: '400px' }}
              >
                <Select
                  placeholder="Select Part Number"
                  style={{ width: '100%' }}
                  value={selectedDetailPartNumber}
                  onChange={setSelectedDetailPartNumber}
                  allowClear
                  options={getUniquePartNumbers().map(pn => ({ value: pn, label: pn }))}
                />
              </Form.Item>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => setSelectedDetailPartNumber('')}
                title="Reset Part Number Filter"
              />
            </div>
            {!selectedDetailPartNumber ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <div className="text-lg mb-2">Select a Part Number</div>
                <div>Please select a part number from the dropdown above to view detailed analysis</div>
              </div>
            ) : (
              <div className="chart-container">
                <ReactECharts
                  option={getDetailedChartOption()}
                  style={{ height: '500px', minHeight: '400px', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                  onEvents={{
                    resize: () => {
                      window.dispatchEvent(new Event('resize'));
                    }
                  }}
                />
              </div>
            )}
          </TabPane>
          <TabPane tab="Total Completion" key="3">
            <div className="chart-container">
              <ReactECharts
                option={getPieChartOption()}
                style={{ height: '500px', minHeight: '400px', width: '100%' }}
                opts={{ renderer: 'svg' }}
                onEvents={{
                  resize: () => {
                    window.dispatchEvent(new Event('resize'));
                  }
                }}
              />
            </div>
          </TabPane>
        </Tabs>
      ) : (
        <div className="text-center text-gray-500 min-h-[400px] flex items-center justify-center">
          No data available for the selected criteria.
        </div>
      )}
    </Card>
  );
};

export default ProductionStatus; 