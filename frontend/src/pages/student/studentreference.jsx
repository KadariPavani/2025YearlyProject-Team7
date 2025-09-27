import React, { useState } from "react";

// Mock data for student resources, now only featuring YouTube videos.
const initialResources = [
  {
    id: 1,
    title: "React Hooks Tutorial",
    subject: "Web Development",
    description: "A beginner-friendly guide to modern React hooks.",
    fileType: "YouTube",
    url: "https://www.youtube.com/watch?v=dpw9EHDh2bM",
  },
  {
    id: 5,
    title: "Cellular Biology Video Lecture",
    subject: "Science",
    description: "An animated video explaining the structure and function of cells.",
    fileType: "YouTube",
    url: "https://youtu.be/t5DvF5OVr1Y?si=tVUvduxuhlT68EFH",
  },
];

// SVG Icons
const icons = {
  YouTube: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3.5a1.5 1.5 0 00-1.5 1.5V9A1.5 1.5 0 0010 10.5h1.5A1.5 1.5 0 0013 9V5A1.5 1.5 0 0011.5 3.5H10zM10.5 11.5a1.5 1.5 0 011.5 1.5v2a1.5 1.5 0 01-1.5 1.5H8.5A1.5 1.5 0 017 15.5v-2a1.5 1.5 0 011.5-1.5H10.5z" />
    </svg>
  ),
};

// Component for a single resource item
const ResourceItem = ({ resource }) => {
  // Extract YouTube video ID from a given URL
  const getYouTubeEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
      console.error("Invalid URL:", url);
      return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-stretch justify-between transition-transform duration-200 hover:scale-[1.02]">
      <div className="flex-1 pr-0 md:pr-4 mb-4 md:mb-0">
        <h2 className="text-lg font-bold text-gray-800">{resource.title}</h2>
        <p className="text-sm text-gray-500 mt-1">Subject: <span className="font-semibold">{resource.subject}</span></p>
        <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
      </div>
      <div className="flex flex-col items-center md:items-end space-y-4 md:space-y-2">
        <div className="relative w-full md:w-64" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-xl shadow-md"
            src={getYouTubeEmbedUrl(resource.url)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={resource.title}
          ></iframe>
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full md:w-auto font-semibold py-2 px-4 rounded-lg shadow-md text-white transition-colors bg-red-500 hover:bg-red-600"
        >
          {icons.YouTube}
          Watch on YouTube
        </a>
      </div>
    </div>
  );
};

// Component for the student resources page
const StudentResources = ({ resources, searchTerm, onSearch, selectedSubject, onSubjectFilter }) => {
  const allSubjects = [...new Set(resources.map(r => r.subject))];
  const filteredResources = resources
    .filter(resource =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(resource => selectedSubject === "All" || resource.subject === selectedSubject);

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Search & Filter Resources</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectFilter(e.target.value)}
            className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
          >
            <option value="All">All Subjects</option>
            {allSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Resources</h2>
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} />
          ))
        ) : (
          <p className="text-center text-gray-500">No resources found.</p>
        )}
      </div>
    </>
  );
};

// Component for the teacher resources management page
const TeacherResources = ({ resources, onResourceCreate, onResourceDelete }) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState("YouTube");
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title && subject && url) {
      const newResource = {
        id: Date.now(),
        title,
        subject,
        description,
        fileType,
        url,
      };
      onResourceCreate(newResource);
      setTitle("");
      setSubject("");
      setDescription("");
      setUrl("");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto mt-10">
      {/* <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Resource</h2> */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="resource-title" className="block text-sm font-medium text-gray-700">
            Resource Title
          </label>
          <input
            type="text"
            id="resource-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            required
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject/Category
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            required
          />
        </div>
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            YouTube Video URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            required
          />
        </div>
        <div>
          <label htmlFor="resource-description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="resource-description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Add Resource
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Existing Resources</h3>
        <ul className="space-y-2">
          {resources.map((resource) => (
            <li key={resource.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-700 font-medium">
                {resource.title} ({resource.subject})
              </span>
              <button
                onClick={() => onResourceDelete(resource.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function Resources() {
  const [resources, setResources] = useState(initialResources);
  const [userRole, setUserRole] = useState("student");
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [selectedResourceSubject, setSelectedResourceSubject] = useState("All");

  const handleCreateResource = (newResource) => {
    setResources([newResource, ...resources]);
  };

  const handleResourceDelete = (id) => {
    setResources(resources.filter(resource => resource.id !== id));
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 sm:mb-0">
          Resources
        </h1>
        {/* <div className="flex space-x-4">
          <button
            onClick={() => setUserRole(userRole === "student" ? "teacher" : "student")}
            className="bg-gray-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
          >
            Switch to {userRole === "student" ? "Teacher" : "Student"} View
          </button>
        </div> */}
      </header>

      <main className="max-w-4xl mx-auto">
        {userRole === "student" ? (
          <StudentResources
            resources={resources}
            searchTerm={resourceSearchTerm}
            onSearch={setResourceSearchTerm}
            selectedSubject={selectedResourceSubject}
            onSubjectFilter={setSelectedResourceSubject}
          />
        ) : (
          <TeacherResources resources={resources} onResourceCreate={handleCreateResource} onResourceDelete={handleResourceDelete} />
        )}
      </main>
    </div>
  );
}
