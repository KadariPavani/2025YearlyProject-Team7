import React from "react";

const MetricCard = ({ icon, title, value }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-blue-50">{icon}</div>
    </div>
    <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs sm:text-sm text-gray-500 mt-1">{title}</p>
  </div>
);

export default MetricCard;
