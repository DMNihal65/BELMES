import React from 'react';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';

const AllMachineAnalytics = () => {
  return (
    <div className="flex space-x-4 p-4">
      {/* Scheduled Jobs Card */}
      <div
        className="w-52 h-28 text-sky-700 rounded-lg shadow-lg p-3 flex flex-col justify-between"
        style={{
          background: 'linear-gradient(180deg, rgb(191, 234, 255) 0%, rgb(144, 202, 249) 100%)'
        }}
      >
        <div className="flex items-center space-x-2 mb-1">
          <Clock className="w-6 h-6 text-sky-700" />
          <h3 className="text-sm font-semibold text-sky-700">Scheduled Jobs</h3>
        </div>
        <div className="flex justify-end items-center mt-auto">
          <p className="text-lg font-bold text-sky-700">15</p>
        </div>
      </div>

      {/* Machine Utilization (%) Card */}
      <div
        className="w-52 h-28 text-sky-700 rounded-lg shadow-lg p-3 flex flex-col justify-between"
        style={{
          background: 'linear-gradient(180deg, rgb(191, 234, 255) 0%, rgb(144, 202, 249) 100%)'
        }}
      >
        <div className="flex items-center space-x-2 mb-1">
          <TrendingUp className="w-6 h-6 text-sky-700" />
          <h3 className="text-sm font-semibold text-sky-700">Machine Utilization (%)</h3>
        </div>
        <div className="flex justify-end items-center mt-auto">
          <p className="text-lg font-bold text-sky-700">85%</p>
        </div>
      </div>

      {/* Delayed Jobs Card */}
      <div
        className="w-52 h-28 text-sky-700 rounded-lg shadow-lg p-3 flex flex-col justify-between"
        style={{
          background: 'linear-gradient(180deg, rgb(191, 234, 255) 0%, rgb(144, 202, 249) 100%)'
        }}
      >
        <div className="flex items-center space-x-2 mb-1">
          <AlertCircle className="w-6 h-6 text-sky-700" />
          <h3 className="text-sm font-semibold text-sky-700">Delayed Jobs</h3>
        </div>
        <div className="flex justify-end items-center mt-auto">
          <p className="text-lg font-bold text-sky-700">5</p>
        </div>
      </div>
    </div>
  );
};

export default AllMachineAnalytics;