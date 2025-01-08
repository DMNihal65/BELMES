import React from 'react';
import { ArrowUpIcon } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
  return (
    <div className="bg-sky-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out  w-3/4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
          <div className="flex items-center gap-1.5">
          </div>
        </div>
        <div className="p-4 bg-sky-100 rounded-xl">
          <Icon style={{ fontSize: '40px', color: '#0EA5E9' }} />
        </div>
      </div>
    </div>
  );
};

// const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
//   return (
//     <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform duration-300 ease-in-out w-3/4">
//       <div className="flex items-start justify-between">
//         <div className="space-y-1">
//           <h3 className="text-white text-sm font-medium">{title}</h3>
//           <p className="text-4xl font-bold text-white">{value}</p>
//           <div className="flex items-center gap-1.5">
//           </div>
//         </div>
//         <div className="p-4 bg-white rounded-full">
//           <Icon style={{ fontSize: '40px', color: '#4F46E5' }} />
//         </div>
//       </div>
//     </div>
//   );
// };

// const MetricCard = ({ title, value, trend, trendPeriod, icon: Icon }) => {
//   return (
//     <div className="border border-gray-300 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out w-3/4">
//       <div className="flex flex-col items-center">
//         <div className="p-4 bg-white rounded-full mb-2">
//           <Icon style={{ fontSize: '40px', color: '#4F46E5' }} />
//         </div>
//         <h3 className="text-gray-700 text-sm font-medium text-center">{title}</h3>
//         <p className="text-3xl font-semibold text-gray-900 text-center">{value}</p>
//       </div>
//     </div>
//   );
// };

export default MetricCard;