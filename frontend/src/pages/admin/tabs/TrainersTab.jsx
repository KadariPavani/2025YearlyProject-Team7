import React from "react";
import { Slash, Trash2 } from "lucide-react";
import TabHeader from "../components/TabHeader";
import SearchFilter from "../components/SearchFilter";
import SectionTable from "../components/SectionTable";

const TrainersTab = ({
  adminData,
  trainersLoading,
  trainerSearch,
  setTrainerSearch,
  filteredTrainers,
  navigate,
  handleSuspendToggle,
  handleDelete,
}) => {
  return (
    <div className="relative">
      <TabHeader
        title="Trainers"
        showAdd={adminData?.permissions?.trainerControls?.add}
        onAdd={() => navigate("/add-trainer")}
        addLabel="Add Trainer"
      />

      <SearchFilter
        value={trainerSearch}
        onChange={setTrainerSearch}
        placeholder="Search trainers..."
      />

      <SectionTable
        loading={trainersLoading}
        data={filteredTrainers}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Employee ID", key: "employeeId" },
          { label: "Subject", key: "subjectDealing" },
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
                <Slash className="h-4 w-4" />
              </button>
            )}
            {adminData.permissions?.trainerControls?.delete && (
              <button
                onClick={() => handleDelete("trainers", trainer._id)}
                className="text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      />
    </div>
  );
};

export default TrainersTab;
