import React from 'react';
import { ArrowUpIcon } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out w-64">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
          <div className="flex items-center gap-1.5">
            <ArrowUpIcon className="w-5 h-5 text-sky-500" />
            <span className="text-sky-500 text-sm font-medium">{trend}%</span>
          </div>
          <span className="text-gray-500 text-sm">{trendPeriod}</span>
        </div>
        <div className="p-2 bg-sky-100 rounded-xl mr-1">
          <Icon style={{ fontSize: '40px', color: '#0EA5E9' }} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;