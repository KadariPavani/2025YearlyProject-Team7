import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeletons';

const CoordinatorsTab = ({ loadingPlacementBatches, placementBatchData, fetchPlacementTrainingBatches }) => {
  // Flatten all batches for stats
  const allBatches = [];
  if (placementBatchData) {
    Object.keys(placementBatchData).forEach(year => {
      Object.entries(placementBatchData[year]).flatMap(([college, techMap]) =>
        Object.values(techMap).flatMap(group => group.batches.map(batch => allBatches.push({ college, batch, year })))
      );
    });
  }

  const totalCoordinators = allBatches.reduce((sum, { batch }) =>
    sum + (batch.coordinators?.length || 0), 0);
  const batchesWithCoord = allBatches.filter(({ batch }) =>
    batch.coordinators && batch.coordinators.length > 0).length;

  const getCoordEmail = (coord) => {
    const email = coord.email || coord.student?.email || '';
    return email.replace(/\.coordinator@/i, '@');
  };
  const getCoordPhone = (coord) => coord.phone || coord.student?.phonenumber || '';
  const getCoordName = (coord) => coord.name || coord.student?.name || 'NA';
  const getCoordRoll = (coord) => coord.rollNo || coord.student?.rollNo || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Batch Coordinators</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{allBatches.length} batches across all years</p>
        </div>
        <button
          onClick={fetchPlacementTrainingBatches}
          className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Batches</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{allBatches.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><Users className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Coordinators</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{totalCoordinators}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-amber-50 items-center justify-center"><Users className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Assigned</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{batchesWithCoord}/{allBatches.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-purple-50 items-center justify-center"><Users className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Unassigned</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{allBatches.length - batchesWithCoord}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loadingPlacementBatches ? (
        <LoadingSkeleton />
      ) : (!placementBatchData || Object.keys(placementBatchData).length === 0) ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-xs sm:text-sm font-medium">No placement batches found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(placementBatchData).sort().reverse().map(year => {
            const yearBatches = Object.entries(placementBatchData[year]).flatMap(([college, techMap]) =>
              Object.values(techMap).flatMap(group => group.batches.map(batch => ({ college, batch })))
            );

            return (
              <div key={year} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-gray-200">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Academic Year {year}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batch</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">College</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Students</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Coordinator</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Start Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {yearBatches.map(({ college, batch }) => {
                        const coords = batch.coordinators || [];
                        const studentCount = batch.studentCount || (batch.students ? batch.students.length : 0);
                        const rowCount = Math.max(coords.length, 1);

                        return coords.length <= 1 ? (
                          <tr key={batch._id} className="hover:bg-blue-50 transition-colors">
                            <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{batch.batchNumber}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{batch.techStack}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{college}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{studentCount}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {coords.length > 0 ? (
                                <div>
                                  {getCoordEmail(coords[0]) ? (
                                    <a href={`mailto:${getCoordEmail(coords[0])}`} className="text-xs sm:text-sm font-medium text-blue-600 hover:underline">
                                      {getCoordName(coords[0])}
                                    </a>
                                  ) : (
                                    <span className="text-xs sm:text-sm font-medium text-gray-900">{getCoordName(coords[0])}</span>
                                  )}
                                  {getCoordRoll(coords[0]) && (
                                    <div className="text-[10px] sm:text-xs text-gray-500">{getCoordRoll(coords[0])}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-400 italic">Not assigned</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                              {coords.length > 0 && getCoordPhone(coords[0]) ? getCoordPhone(coords[0]) : '—'}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                              {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ) : (
                          coords.map((coord, cIdx) => (
                            <tr key={`${batch._id}-${cIdx}`} className="hover:bg-blue-50 transition-colors">
                              {cIdx === 0 && (
                                <>
                                  <td rowSpan={rowCount} className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap border-r border-gray-100">{batch.batchNumber}</td>
                                  <td rowSpan={rowCount} className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap border-r border-gray-100">{batch.techStack}</td>
                                  <td rowSpan={rowCount} className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap border-r border-gray-100">{college}</td>
                                  <td rowSpan={rowCount} className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700 border-r border-gray-100">{studentCount}</td>
                                </>
                              )}
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div>
                                  {getCoordEmail(coord) ? (
                                    <a href={`mailto:${getCoordEmail(coord)}`} className="text-xs sm:text-sm font-medium text-blue-600 hover:underline">
                                      {getCoordName(coord)}
                                    </a>
                                  ) : (
                                    <span className="text-xs sm:text-sm font-medium text-gray-900">{getCoordName(coord)}</span>
                                  )}
                                  {getCoordRoll(coord) && (
                                    <div className="text-[10px] sm:text-xs text-gray-500">{getCoordRoll(coord)}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                {getCoordPhone(coord) || '—'}
                              </td>
                              {cIdx === 0 && (
                                <td rowSpan={rowCount} className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap border-l border-gray-100">
                                  {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '—'}
                                </td>
                              )}
                            </tr>
                          ))
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoordinatorsTab;
