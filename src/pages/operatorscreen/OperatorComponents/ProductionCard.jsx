import React, { useState } from 'react';
import { Card, Progress, DatePicker, InputNumber, Button, Input, Tooltip, Statistic, Spin, Row, Col, Steps, Badge } from 'antd';
import { Activity, Clock, AlertCircle, CheckCircle2, ArrowRight, Target, BarChart3 } from 'lucide-react';
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

  return (
    <Card
      className="status-card h-full"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-500" size={18} />
            <span className="font-semibold">Production Progress</span>
          </div>
          {productionStats ? (
            <Badge 
              count={`${getCompletionPercentage()}%`} 
              style={{ 
                backgroundColor: getCompletionPercentage() >= 75 ? '#52c41a' : '#1890ff',
                fontWeight: 'bold'
              }} 
            />
          ) : (
            <Badge count="No data" style={{ backgroundColor: '#d9d9d9' }} />
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Progress Circle & Production Stats */}
        <Row gutter={16} align="middle">
          <Col span={12}>
            {productionStats ? (
              <Progress
                type="dashboard"
                percent={getCompletionPercentage()}
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#52c41a',
                }}
                status={getProgressStatus()}
                width={120}
              />
            ) : (
              <div className="py-4 flex justify-center">
                <Spin tip="Loading data..." />
              </div>
            )}
          </Col>
          <Col span={12}>
            {productionStats && (
              <div className="space-y-2">
                <div className="bg-blue-50 p-2 rounded-lg flex justify-between items-center">
                  <div className="text-xs text-blue-700">Total</div>
                  <div className="text-lg font-bold text-blue-700">{productionStats.total_quantity}</div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg flex justify-between items-center">
                  <div className="text-xs text-green-700">Completed</div>
                  <div className="text-lg font-bold text-green-700">{productionStats.completed_quantity}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg flex justify-between items-center">
                  <div className="text-xs text-amber-700">Remaining</div>
                  <div className="text-lg font-bold text-amber-700">{getRemainingQuantity()}</div>
                </div>
              </div>
            )}
          </Col>
        </Row>

        {/* Production Log Form */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700 mb-3 flex items-center gap-1 font-medium">
            <BarChart3 size={16} />
            <span>Production Log Entry</span>
          </div>

          <Steps
            current={currentStep}
            size="small"
            className="mb-4"
            items={[
              {
                title: 'Time',
                icon: <Clock size={16} />
              },
              {
                title: 'Quantity',
                icon: <Target size={16} />
              },
              {
                title: 'Submit',
                icon: <CheckCircle2 size={16} />
              },
            ]}
          />

          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Time Period</div>
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder={['Start Time', 'End Time']}
              onChange={handleDateRangeChange}
              value={startDate && endDate ? [startDate, endDate] : null}
              className="w-full"
            />
          </div>

          {totalHours > 0 && (
            <div className="bg-blue-50 p-2 rounded flex items-center gap-2 mb-3">
              <Clock className="text-blue-500" size={14} />
              <span className="text-sm text-blue-700 font-medium">Total: {totalHours} hours</span>
            </div>
          )}

          <Row gutter={12} className="mb-3">
            <Col span={12}>
              <div className="text-xs text-gray-500 mb-1">Completed</div>
              <InputNumber
                min={0}
                value={quantityCompleted}
                onChange={(value) => handleQuantityChange(value, undefined)}
                className="w-full"
                placeholder="Qty completed"
                addonAfter={<CheckCircle2 size={16} className="text-green-500" />}
              />
            </Col>
            <Col span={12}>
              <div className="text-xs text-gray-500 mb-1">Rejected</div>
              <InputNumber
                min={0}
                value={quantityRejected}
                onChange={(value) => handleQuantityChange(undefined, value)}
                className="w-full"
                placeholder="Qty rejected"
                addonAfter={<AlertCircle size={16} className="text-red-500" />}
              />
            </Col>
          </Row>

          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <TextArea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this production run..."
            />
          </div>

          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!startDate || !endDate}
            loading={isSubmitting}
            className="w-full"
            icon={<ArrowRight size={16} />}
          >
            Submit Production Log
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductionCard; 