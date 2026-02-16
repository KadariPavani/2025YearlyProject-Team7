import React from 'react';

const StatisticsTab = ({ placementBatchData }) => {
  return (
    <div>
      <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h2>
      {Object.keys(placementBatchData).sort().reverse().map(year => (
        <div key={year} className="mb-5">
          <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Academic Year {year}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(placementBatchData[year]).map(college => {
              const totalBatches = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0);
              const totalStudents = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0);

              return (
                <div key={college} className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">{college}</h4>
                  <p className="text-sm text-gray-600 mb-3">{totalBatches} batches - {totalStudents} students</p>
                  {Object.keys(placementBatchData[year][college]).map(techStack => (
                    <div key={techStack} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{techStack}</span>
                      <span className="text-gray-700 font-medium">{placementBatchData[year][college][techStack].totalBatches} batches</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsTab;
