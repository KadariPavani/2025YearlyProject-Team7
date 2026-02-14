import React from "react";
import { Plus } from "lucide-react";

const TabHeader = ({ title, showAdd, onAdd, addLabel = "Add" }) => (
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-sm sm:text-lg font-semibold text-gray-900">{title}</h2>
    {showAdd && (
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
        aria-label={addLabel}
        title={addLabel}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{addLabel}</span>
      </button>
    )}
  </div>
);

export default TabHeader;
