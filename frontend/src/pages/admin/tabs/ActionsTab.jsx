import React from "react";
import SectionTable from "../components/SectionTable";

const ActionsTab = ({
  adminData,
  trainers,
  tpos,
  trainersLoading,
  tposLoading,
  handleSuspendToggle,
  handleDelete,
}) => {
  const suspendedTrainers = trainers.filter((t) => t.status === "inactive");
  const suspendedTpos = tpos.filter((t) => t.status === "inactive");

  return (
    <div className="space-y-8">
      <SectionTable
        title="Suspended Trainers"
        loading={trainersLoading}
        data={suspendedTrainers}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Employee ID", key: "employeeId" },
          { label: "Status", key: "status" },
        ]}
        actions={(trainer) => (
          <div className="flex items-center gap-2">
            {adminData.permissions?.canSuspendTrainer && (
              <button
                onClick={() => handleSuspendToggle("trainers", trainer._id)}
                className="px-2 py-0.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
              >
                Unsuspend
              </button>
            )}
            {adminData.permissions?.canDeleteTrainer && (
              <button
                onClick={() => handleDelete("trainers", trainer._id)}
                className="px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      />

      <SectionTable
        title="Suspended TPOs"
        loading={tposLoading}
        data={suspendedTpos}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Status", key: "status" },
        ]}
        actions={(tpo) => (
          <div className="flex items-center gap-2">
            {adminData.permissions?.canSuspendTPO && (
              <button
                onClick={() => handleSuspendToggle("tpos", tpo._id)}
                className="px-2 py-0.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
              >
                Unsuspend
              </button>
            )}
            {adminData.permissions?.canDeleteTPO && (
              <button
                onClick={() => handleDelete("tpos", tpo._id)}
                className="px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ActionsTab;
