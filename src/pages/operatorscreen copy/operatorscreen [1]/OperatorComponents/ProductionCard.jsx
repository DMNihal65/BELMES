import React, { useState } from 'react';
import { Card, Progress, DatePicker, InputNumber, Button, Input, Tooltip, Statistic, Spin, Row, Col, Steps, Badge } from 'antd';
import { Activity, Clock, AlertCircle, CheckCircle2, ArrowRight, Target, BarChart3, CalendarClock } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Step } = Steps;

const ProductionCard = () => {
  const {
    selectedOperation,
    productionStats,
    submitOperatorLog,
    fetchProductionStats
  } = useOperatorStore();

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [quantityCompleted, setQuantityCompleted] = useState(0);
  const [quantityRejected, setQuantityRejected] = useState(0);
  const [notes, setNotes] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Calculate hours between start and end dates
  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    return moment(end).diff(moment(start), 'hours', true).toFixed(2);
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
      setTotalHours(calculateHours(dates[0], dates[1]));
      setCurrentStep(1);
    } else {
      setStartDate(null);
      setEndDate(null);
      setTotalHours(0);
      setCurrentStep(0);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (completed, rejected) => {
    if (completed !== undefined) setQuantityCompleted(completed);
    if (rejected !== undefined) setQuantityRejected(rejected);
    
    if ((completed > 0 || rejected > 0) && currentStep < 2) {
      setCurrentStep(2);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      return;
    }

    setIsSubmitting(true);

    try {
      const logData = {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        quantity_completed: parseInt(quantityCompleted) || 0,
        quantity_rejected: parseInt(quantityRejected) || 0,
        notes: notes
      };

      const result = await submitOperatorLog(logData);

      if (result.success) {
        // Reset form
        setStartDate(null);
        setEndDate(null);
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
                <Spin tip="Loading..." />
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

            <div className="mb-2">
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                placeholder={['Start', 'End']}
                onChange={handleDateRangeChange}
                value={startDate && endDate ? [startDate, endDate] : null}
                className="w-full text-xs"
                size="small"
                allowClear
                disabled={!selectedOperation}
              />
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
                !startDate || 
                !endDate || 
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