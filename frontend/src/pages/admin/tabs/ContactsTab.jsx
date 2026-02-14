import React from "react";
import { Trash2 } from "lucide-react";
import SearchFilter from "../components/SearchFilter";
import SectionTable from "../components/SectionTable";

const ContactsTab = ({
  adminData,
  contactsLoading,
  contactSearch,
  setContactSearch,
  filteredContacts,
  handleDeleteContact,
}) => {
  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Contact Submissions</h2>
      </div>

      <SearchFilter
        value={contactSearch}
        onChange={setContactSearch}
        placeholder="Search contacts..."
      />

      <SectionTable
        loading={contactsLoading}
        data={filteredContacts}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Submitted At", key: "createdAt" },
        ]}
        actions={(contact) => (
          <>
            {adminData?.permissions?.adminControls?.delete && (
              <button
                onClick={() => handleDeleteContact(contact._id)}
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

export default ContactsTab;
