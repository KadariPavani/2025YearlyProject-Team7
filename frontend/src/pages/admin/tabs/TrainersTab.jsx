import React from "react";
import { ChevronDown, ChevronUp, Plus, Slash, Trash2 } from "lucide-react";

const TrainersTab = ({
  adminData,
  trainersLoading,
  trainerSearch,
  setTrainerSearch,
  filteredTrainers,
  navigate,
  handleSuspendToggle,
  handleDelete,
  SectionTable,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Trainers</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="sm:hidden inline-flex items-center px-2 py-2 border rounded-md text-sm bg-white"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {adminData?.permissions?.trainerControls?.add && (
            <button
              onClick={() => navigate("/add-trainer")}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md focus:outline-none ml-2"
              aria-label="Add Trainer"
              title="Add Trainer"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters (collapsible like Admin) */}
      <div className={`mb-6 bg-gray-50 p-3 rounded-lg border ${showFilters ? 'block' : 'hidden'} sm:block`}>
        <input
          type="search"
          value={trainerSearch}
          onChange={(e) => setTrainerSearch(e.target.value)}
          placeholder="Search trainers..."
          className="border border-gray-300 rounded px-2 py-1 h-8 text-xs w-full"
        />
      </div>


      <SectionTable
        // title="Trainer Details"
        loading={trainersLoading}
        searchValue={trainerSearch}
        onSearchChange={setTrainerSearch}
        data={filteredTrainers}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Employee ID", key: "employeeId" },
          { label: "Experience", key: "experience" },
          { label: "Subject", key: "subjectDealing" },
          { label: "Category", key: "category" },
          { label: "LinkedIn", key: "linkedIn" },
          { label: "Status", key: "status" },
        ]}
        actions={(trainer) => (
          <>
            {adminData.permissions?.trainerControls?.suspend && (
              <button
                onClick={() => handleSuspendToggle("trainers", trainer._id)}
                className={`mr-2 ${trainer.status === "active" ? "text-blue-600" : "text-gray-400"} hover:text-opacity-80`}
                title={trainer.status === "active" ? "Suspend" : "Activate"}
              >
                <Slash className="h-5 w-5" />
              </button>
            )}
            {adminData.permissions?.trainerControls?.delete && (
              <button
                onClick={() => handleDelete("trainers", trainer._id)}
                className="text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      />
    </div>
  );
};

export default TrainersTab;
