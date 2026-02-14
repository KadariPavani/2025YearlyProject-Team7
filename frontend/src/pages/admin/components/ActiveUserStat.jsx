import React from "react";

const ActiveUserStat = ({ label, value, total, icon }) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-blue-50">{icon}</div>
        <span className="text-xs sm:text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-xs sm:text-sm font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{percentage}%</p>
      </div>
    </div>
  );
};

export default ActiveUserStat;
