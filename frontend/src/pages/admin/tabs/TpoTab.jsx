import React from "react";
import { Slash, Trash2 } from "lucide-react";
import TabHeader from "../components/TabHeader";
import SearchFilter from "../components/SearchFilter";
import SectionTable from "../components/SectionTable";

const TpoTab = ({
  adminData,
  tposLoading,
  tpoSearch,
  setTpoSearch,
  filteredTpos,
  navigate,
  handleSuspendToggle,
  handleDelete,
}) => {
  return (
    <div className="relative">
      <TabHeader
        title="TPOs"
        showAdd={adminData?.permissions?.tpoControls?.add}
        onAdd={() => navigate("/add-tpo")}
        addLabel="Add TPO"
      />

      <SearchFilter
        value={tpoSearch}
        onChange={setTpoSearch}
        placeholder="Search TPOs..."
      />

      <SectionTable
        loading={tposLoading}
        data={filteredTpos}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Status", key: "status" },
        ]}
        actions={(tpo) => (
          <>
            {adminData.permissions?.tpoControls?.suspend && (
              <button
                onClick={() => handleSuspendToggle("tpos", tpo._id)}
                className={`mr-2 ${tpo.status === "active" ? "text-blue-600" : "text-gray-400"} hover:text-opacity-80`}
                title={tpo.status === "active" ? "Suspend" : "Activate"}
              >
                <Slash className="h-4 w-4" />
              </button>
            )}
            {adminData.permissions?.tpoControls?.delete && (
              <button
                onClick={() => handleDelete("tpos", tpo._id)}
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

export default TpoTab;
