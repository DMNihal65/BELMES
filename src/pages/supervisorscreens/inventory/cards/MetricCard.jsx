import React from 'react';
import { ArrowUpIcon } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="space-y-2 md:space-y-3">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-2xl md:text-3xl font-semibold">{value}</p>
          {/* <div className="flex items-center gap-1.5">
            <ArrowUpIcon className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500 text-sm font-medium">{trend}%</span>
          </div> */}
          {/* <span className="text-gray-500 text-sm">{trendPeriod}</span> */}
        </div>
        <div className="p-2 bg-blue-100 rounded-xl -mr-3 mt-4 md:mt-0">
          <Icon className="text-3xl md:text-4xl text-blue-500"/>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;