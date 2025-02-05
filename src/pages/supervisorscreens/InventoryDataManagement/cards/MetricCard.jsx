import React from 'react';
import { ArrowUpIcon } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
  return (
    <div className="bg-white rounded-lg p-2 lg:p-3 xl:p-4 shadow-sm hover:shadow-md transition-all duration-300 h-32">
      <div className="flex flex-col justify-between h-full">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-gray-500 text-sm lg:text-base font-medium leading-tight flex-1">{title}</h3>
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 mr-2">
            <Icon className="text-2xl lg:text-3xl xl:text-4xl text-blue-500"/>
          </div>
        </div>
        <div className="mt-1.5 lg:mt-2">
          <p className="text-xl lg:text-2xl xl:text-3xl font-semibold items-center">{value}</p>
          {/* <div className="flex items-center gap-1.5">
            <ArrowUpIcon className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500 text-sm font-medium">{trend}%</span>
          </div> */}
          {/* <span className="text-gray-500 text-sm">{trendPeriod}</span> */}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;