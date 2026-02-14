import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Mail, Phone, User, MessageSquare, Calendar } from "lucide-react";

const ContactsTab = ({
  adminData,
  contactsLoading,
  contactSearch,
  setContactSearch,
  filteredContacts,
  handleDeleteContact,
  SectionTable,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Contact Submissions</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="sm:hidden inline-flex items-center px-2 py-2 border rounded-md text-sm bg-white"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`mb-6 bg-gray-50 p-3 rounded-lg border ${showFilters ? 'block' : 'hidden'} sm:block`}>
        <input
          type="search"
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          placeholder="Search contacts by name, email, phone..."
          className="border border-gray-300 rounded px-2 py-1 h-8 text-xs w-full"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <SectionTable
          loading={contactsLoading}
          searchValue={contactSearch}
          onSearchChange={setContactSearch}
          data={filteredContacts}
          columns={[
            { label: "Name", key: "name" },
            { label: "Email", key: "email" },
            { label: "Phone", key: "phone" },
            { label: "Message", key: "message" },
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
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </>
          )}
        />
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {contactsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No contact submissions found.</div>
        ) : (
          filteredContacts.map((contact) => (
            <article
              key={contact._id}
              className="w-full bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {contact.name}
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span>{contact.phone}</span>
                    </div>

                    {contact.message && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-700 break-words">
                            {contact.message}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(contact.createdAt).toLocaleDateString()} {new Date(contact.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {adminData?.permissions?.adminControls?.delete && (
                  <button
                    onClick={() => handleDeleteContact(contact._id)}
                    className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactsTab;
