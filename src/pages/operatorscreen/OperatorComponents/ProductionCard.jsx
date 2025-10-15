import React, { useState, useEffect } from 'react';
import { Card, Progress, InputNumber, Button, Input, Tooltip, Statistic, Spin, Row, Col, Steps, Badge } from 'antd';
import { Activity, Clock, AlertCircle, CheckCircle2, ArrowRight, Target, BarChart3, CalendarClock } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const { TextArea } = Input;
const { Step } = Steps;

const ProductionCard = () => {
  const {
    selectedOperation,
    productionStats,
    submitOperatorLog,
    fetchProductionStats
  } = useOperatorStore();

  // From Date states
  const [fromDate, setFromDate] = useState(null);
  const [fromHour, setFromHour] = useState("");
  const [fromMinute, setFromMinute] = useState("");

  // To Date states
  const [toDate, setToDate] = useState(null);
  const [toHour, setToHour] = useState("");
  const [toMinute, setToMinute] = useState("");

  const [quantityCompleted, setQuantityCompleted] = useState(0);
  const [quantityRejected, setQuantityRejected] = useState(0);
  const [notes, setNotes] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [scheduleStartDate, setScheduleStartDate] = useState(null);
  const [isLoadingStartDate, setIsLoadingStartDate] = useState(false);

  const now = new Date();

  const fetchScheduleStartDate = async () => {
  try {
    setIsLoadingStartDate(true);
    
    // Get production order and part number from localStorage
    const userSelectedJob = localStorage.getItem('user-selected-job');
    if (!userSelectedJob) {
      console.error('No user-selected-job found in localStorage');
      return;
    }
    
    const jobData = JSON.parse(userSelectedJob);
    const { production_order, part_number } = jobData;
    
    if (!production_order || !part_number) {
      console.error('Missing production_order or part_number in user-selected-job');
      return;
    }
    
    // Make API call to fetch start date
    const response = await fetch(
      `http://172.19.224.1:8002/api/v1/scheduling/part-schedule-start-date/${encodeURIComponent(production_order)}/${encodeURIComponent(part_number)}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const startDate = new Date(data.start_date);
      setScheduleStartDate(startDate);
    } else {
      console.error('Failed to fetch schedule start date:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching schedule start date:', error);
  } finally {
    setIsLoadingStartDate(false);
  }
};

// Add this useEffect to fetch start date when component mounts or selectedOperation changes
useEffect(() => {
  if (selectedOperation) {
    fetchScheduleStartDate();
  }
}, [selectedOperation]);

  // Allowed hours for a given date
  const allowedHours = (date) => {
    if (!date) return [];
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return [...Array(now.getHours() + 1).keys()];
    return [...Array(24).keys()];
  };

  // Allowed minutes for a given date and hour
  const allowedMinutes = (date, hour) => {
    if (!date || hour === "") return [];
    const isToday = date.toDateString() === now.toDateString();
    const hourNum = Number(hour);
    if (isToday && hourNum === now.getHours()) {
      return [...Array(now.getMinutes() + 1).keys()];
    }
    return [...Array(60).keys()];
  };

  // Reset invalid minutes on hour or date change (From)
  useEffect(() => {
    if (fromMinute === "") return;
    if (!allowedMinutes(fromDate, fromHour).includes(Number(fromMinute))) {
      setFromMinute("");
    }
  }, [fromDate, fromHour]);

  // Reset invalid minutes on hour or date change (To)
  useEffect(() => {
    if (toMinute === "") return;
    if (!allowedMinutes(toDate, toHour).includes(Number(toMinute))) {
      setToMinute("");
    }
  }, [toDate, toHour]);

  // Reset time fields if dates change
  useEffect(() => {
    setFromHour("");
    setFromMinute("");
  }, [fromDate]);

  useEffect(() => {
    setToHour("");
    setToMinute("");
  }, [toDate]);

  // Calculate hours between dates
  const calculateHours = () => {
    if (
      !fromDate ||
      fromHour === "" ||
      fromMinute === "" ||
      !toDate ||
      toHour === "" ||
      toMinute === ""
    ) return 0;

    const from = new Date(fromDate);
    from.setHours(Number(fromHour), Number(fromMinute), 0, 0);

    const to = new Date(toDate);
    to.setHours(Number(toHour), Number(toMinute), 0, 0);

    const diffInMs = to.getTime() - from.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours.toFixed(2);
  };

  // Update total hours and step when dates/times change
  useEffect(() => {
    const hours = calculateHours();
    setTotalHours(hours);
    
    if (hours > 0) {
      setCurrentStep(1);
    } else if (fromDate && toDate && fromHour !== "" && toHour !== "") {
      setCurrentStep(0);
    } else {
      setCurrentStep(0);
    }
  }, [fromDate, fromHour, fromMinute, toDate, toHour, toMinute]);

  // Handle quantity change
  const handleQuantityChange = (completed, rejected) => {
    if (completed !== undefined) setQuantityCompleted(completed);
    if (rejected !== undefined) setQuantityRejected(rejected);
    
    if ((completed > 0 || rejected > 0) && currentStep < 2) {
      setCurrentStep(2);
    }
  };

  // Validate that From datetime <= To datetime and both <= now
  const isValidRange = () => {
    if (
      !fromDate ||
      fromHour === "" ||
      fromMinute === "" ||
      !toDate ||
      toHour === "" ||
      toMinute === ""
    )
      return false;

    const from = new Date(fromDate);
    from.setHours(Number(fromHour), Number(fromMinute), 0, 0);

    const to = new Date(toDate);
    to.setHours(Number(toHour), Number(toMinute), 0, 0);

    return from <= to && to <= now && from <= now;
  };

  // Convert local time to IST and then to ISO string
  const convertToIST = (date) => {
    // Create a new date object
    const istDate = new Date(date);
    // Add 5 hours and 30 minutes (IST offset)
    istDate.setHours(istDate.getHours() + 5);
    istDate.setMinutes(istDate.getMinutes() + 30);
    return istDate.toISOString();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isValidRange()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const from = new Date(fromDate);
      from.setHours(Number(fromHour), Number(fromMinute), 0, 0);

      const to = new Date(toDate);
      to.setHours(Number(toHour), Number(toMinute), 0, 0);

      const logData = {
        start_time: convertToIST(from),
        end_time: convertToIST(to),
        quantity_completed: parseInt(quantityCompleted) || 0,
        quantity_rejected: parseInt(quantityRejected) || 0,
        notes: notes
      };

      const result = await submitOperatorLog(logData);

      if (result.success) {
        // Reset form
        setFromDate(null);
        setFromHour("");
        setFromMinute("");
        setToDate(null);
        setToHour("");
        setToMinute("");
        setQuantityCompleted(0);
        setQuantityRejected(0);
        setNotes('');
        setTotalHours(0);
        setCurrentStep(0);

        // Refresh production stats
        if (selectedOperation?.id) {
          await fetchProductionStats(selectedOperation.id);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate remaining quantity
  const getRemainingQuantity = () => {
    if (!productionStats) return 0;
    return productionStats.remaining_quantity || 0;
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!productionStats || productionStats.total_quantity <= 0) return 0;
    return Math.round((productionStats.completed_quantity / productionStats.total_quantity) * 100);
  };

  // Get progress status
  const getProgressStatus = () => {
    const percentage = getCompletionPercentage();
    if (percentage === 100) return 'success';
    if (percentage >= 75) return 'active';
    return 'normal';
  };

  // Get progress color
  const getProgressColor = () => {
    const percentage = getCompletionPercentage();
    if (percentage >= 90) return '#22c55e';
    if (percentage >= 50) return '#0ea5e9';
    return '#0284c7';
  };

     const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

  return (
    <Card
      className="status-card h-full shadow-sm"
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-sky-500" size={18} />
            <span className="font-semibold">Production Progress</span>
          </div>
          {!selectedOperation ? (
            <Badge count="No operation" style={{ backgroundColor: '#d9d9d9' }} />
          ) : selectedOperation.can_log === false ? (
            <Tooltip title={selectedOperation.validation_reason || "Cannot log production"}>
              <Badge count="Cannot Log" style={{ backgroundColor: '#faad14' }} />
            </Tooltip>
          ) : productionStats ? (
            <Badge 
              count={`${getCompletionPercentage()}%`} 
              style={{ 
                backgroundColor: getProgressColor(),
                fontWeight: 'bold'
              }} 
            />
          ) : (
            <Badge count="No data" style={{ backgroundColor: '#d9d9d9' }} />
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {/* Progress & Production Stats */}
        <Row gutter={12} align="middle">
          <Col span={10}>
            {productionStats ? (
              <Progress
                type="circle"
                percent={getCompletionPercentage()}
                strokeColor={getProgressColor()}
                status={getProgressStatus()}
                width={90}
                format={percent => `${percent}%`}
              />
            ) : (
              <div className="py-3 flex justify-center">
              </div>
            )}
          </Col>
          <Col span={14}>
            {productionStats && (
              <div className="space-y-1">
                <div className="bg-sky-50 p-1 rounded-lg flex justify-between items-center border border-sky-100">
                  <div className="text-xs text-sky-700">Total</div>
                  <div className="text-base font-bold text-sky-700">{productionStats.total_quantity}</div>
                </div>
                <div className="bg-green-50 p-1 rounded-lg flex justify-between items-center border border-green-100">
                  <div className="text-xs text-green-700">Completed</div>
                  <div className="text-base font-bold text-green-700">{productionStats.completed_quantity}</div>
                </div>
                <div className="bg-amber-50 p-1 rounded-lg flex justify-between items-center border border-amber-100">
                  <div className="text-xs text-amber-700">Remaining</div>
                  <div className="text-base font-bold text-amber-700">{getRemainingQuantity()}</div>
                </div>
              </div>
            )}
          </Col>
        </Row>

        {/* Production Log Form - Disable when can_log=false */}
        {selectedOperation?.can_log === false ? (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
            <AlertCircle className="text-amber-500 mx-auto mb-2" size={24} />
            <div className="text-amber-700 font-medium mb-1">Production Logging Disabled</div>
            <div className="text-xs text-amber-600">
              {selectedOperation.validation_reason || "This operation cannot be logged at this time"}
            </div>
          </div>
        ) : (
          <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
            <div className="text-xs text-sky-700 mb-2 flex items-center gap-1 font-medium">
              <BarChart3 size={14} />
              <span>Production Log Entry</span>
            </div>

            <Steps
              current={currentStep}
              size="small"
              className="mb-2"
              items={[
                {
                  title: <span className="text-xs">Time</span>,
                  icon: <Clock size={14} />
                },
                {
                  title: <span className="text-xs">Qty</span>,
                  icon: <Target size={14} />
                },
                {
                  title: <span className="text-xs">Log</span>,
                  icon: <CheckCircle2 size={14} />
                },
              ]}
            />

            {/* From Date */}
            <div className="mb-2">
              <div className="text-xs text-gray-600 mb-1">From Date & Time</div>
              <div className="flex gap-2">
                <DatePicker
                      selected={fromDate}
                      onChange={setFromDate}
                      minDate={scheduleStartDate} // Use fetched start date as min
                      maxDate={now} // Current date/time as max
                      placeholderText={isLoadingStartDate ? "Loading..." : "Select From Date"}
                      dateFormat="MMMM d, yyyy"
                      className="flex-1 text-xs p-1 border border-gray-300 rounded"
                      disabled={!selectedOperation || isLoadingStartDate}
                    />
                    <select
                      value={fromHour}
                      onChange={(e) => setFromHour(e.target.value)}
                      disabled={!fromDate || !selectedOperation}
                      className="w-20 text-xs p-1 border border-gray-300 rounded"
                    >
                      <option value="">Hour</option>
                      {allowedHours(fromDate).map((h) => (
                        <option key={h} value={h}>
                          {h.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      value={fromMinute}
                      onChange={(e) => setFromMinute(e.target.value)}
                      disabled={!fromHour || !selectedOperation}
                      className="w-20 text-xs p-1 border border-gray-300 rounded"
                    >
                      <option value="">Minute</option>
                      {allowedMinutes(fromDate, fromHour).map((m) => (
                        <option key={m} value={m}>
                          {m.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

            {/* To Date */}
            <div className="mb-2">
              <div className="text-xs text-gray-600 mb-1">To Date & Time</div>
              <div className="flex gap-2">
              <DatePicker
                selected={toDate}
                onChange={setToDate}
                maxDate={now}
                minDate={fromDate}
                placeholderText="Select To Date"
                dateFormat="MMMM d, yyyy"
                className="flex-1 text-xs p-1 border border-gray-300 rounded"
                disabled={!fromDate || !selectedOperation}
              />
                <select
                  value={toHour}
                  onChange={(e) => setToHour(e.target.value)}
                  disabled={!toDate || !selectedOperation}
                  className="w-20 text-xs p-1 border border-gray-300 rounded"
                >
                  <option value="">Hour</option>
                  {allowedHours(toDate).map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <select
                  value={toMinute}
                  onChange={(e) => setToMinute(e.target.value)}
                  disabled={!toHour || !selectedOperation}
                  className="w-20 text-xs p-1 border border-gray-300 rounded"
                >
                  <option value="">Minute</option>
                  {allowedMinutes(toDate, toHour).map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {totalHours > 0 && (
              <div className="bg-sky-100 p-1 rounded flex items-center gap-1 mb-2 text-xs">
                <CalendarClock className="text-sky-500" size={12} />
                <span className="text-sky-700">{totalHours} hours</span>
              </div>
            )}

            <Row gutter={8} className="mb-2">
              <Col span={12}>
                <InputNumber
                  min={0}
                  value={quantityCompleted}
                  onChange={(value) => handleQuantityChange(value, undefined)}
                  className="w-full"
                  placeholder="Completed"
                  size="small"
                  addonAfter={<CheckCircle2 size={14} className="text-green-500" />}
                  disabled={!selectedOperation}
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  min={0}
                  value={quantityRejected}
                  onChange={(value) => handleQuantityChange(undefined, value)}
                  className="w-full"
                  placeholder="Rejected"
                  size="small"
                  addonAfter={<AlertCircle size={14} className="text-red-500" />}
                  disabled={!selectedOperation}
                />
              </Col>
            </Row>

            <TextArea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mb-2"
              rows={2}
              disabled={!selectedOperation}
            />

            <Button
              type="primary"
              block
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={
                !selectedOperation ||
                !isValidRange() ||  localStorage.getItem('activeOperation') === false ||
                (quantityCompleted <= 0 && quantityRejected <= 0)
              }
              className="bg-sky-500"
              icon={<ArrowRight size={16} />}
            >
              Submit Production Log
            </Button>
          </div>
        )}

        {/* No Operation Selected Message */}
        {!selectedOperation && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
            <AlertCircle className="text-gray-400 mx-auto mb-2" size={24} />
            <div className="text-gray-600">No operation selected</div>
            <div className="text-xs text-gray-500 mt-1">Select an operation to log production</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductionCard;