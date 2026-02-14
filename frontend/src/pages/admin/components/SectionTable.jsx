import React from "react";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeletons";

const SectionTable = ({ title, loading, data, columns, actions }) => {
  if (loading) return <LoadingSkeleton />;

  const getNestedValue = (obj, key) =>
    key.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);

  const formatValue = (val, col) => {
    if (col.type === "boolean") return val ? "Yes" : "No";
    if ((col.key === "lastLogin" || col.key === "createdAt") && val)
      return new Date(val).toLocaleString();
    if (val === undefined || val === null) return "-";
    return val;
  };

  return (
    <section className="max-w-full">
      {title && <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4">{title}</h2>}

      {data.length === 0 ? (
        <p className="text-center text-xs sm:text-sm text-gray-500 py-8">No records found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-blue-50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, idx) => (
                <tr
                  key={item._id || item.email}
                  className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                >
                  {columns.map((col) => {
                    const val = formatValue(getNestedValue(item, col.key), col);
                    return (
                      <td key={col.key} className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                        {col.key === "status" ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              val === "active"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {val}
                          </span>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                  {actions && (
                    <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1">{actions(item)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default SectionTable;
