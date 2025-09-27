import React, { useState, useEffect } from "react";
import axios from "axios";

// SVG Icons
const icons = {
  YouTube: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3.5a1.5 1.5 0 00-1.5 1.5V9A1.5 1.5 0 0010 10.5h1.5A1.5 1.5 0 0013 9V5A1.5 1.5 0 0011.5 3.5H10zM10.5 11.5a1.5 1.5 0 011.5 1.5v2a1.5 1.5 0 01-1.5 1.5H8.5A1.5 1.5 0 017 15.5v-2a1.5 1.5 0 011.5-1.5H10.5z" />
    </svg>
  ),
};

// Extract YouTube video ID from a given URL
const getYouTubeEmbedUrl = (url) => {
  try {
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch (e) {
    return null;
  }
};

const ResourceItem = ({ resource }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-stretch justify-between transition-transform duration-200 hover:scale-[1.02]">
    <div className="flex-1 pr-0 md:pr-4 mb-4 md:mb-0">
      <h2 className="text-lg font-bold text-gray-800">{resource.topicName}</h2>
      <p className="text-sm text-gray-500 mt-1">{resource.description || ""}</p>
    </div>
    <div className="flex flex-col items-center md:items-end space-y-4 md:space-y-2">
      {resource.referenceVideoLink && (
        <div className="relative w-full md:w-64" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-xl shadow-md"
            src={getYouTubeEmbedUrl(resource.referenceVideoLink)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={resource.topicName}
          ></iframe>
        </div>
      )}
      {resource.referenceVideoLink && (
        <a
          href={resource.referenceVideoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full md:w-auto font-semibold py-2 px-4 rounded-lg shadow-md text-white transition-colors bg-red-500 hover:bg-red-600"
        >
          {icons.YouTube}
          Watch on YouTube
        </a>
      )}
      {resource.referenceNotesLink && (
        <a
          href={resource.referenceNotesLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full md:w-auto font-semibold py-2 px-4 rounded-lg shadow-md text-white transition-colors bg-green-500 hover:bg-green-600"
        >
          📄 View Notes
        </a>
      )}
    </div>
  </div>
);

export default function StudentResources() {
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get('/api/reference/all');
      setResources(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource =>
    (resource.topicName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 sm:mb-0">
          Resources
        </h1>
      </header>
      <main className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Resources</h2>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Resources</h2>
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <ResourceItem key={resource._id} resource={resource} />
            ))
          ) : (
            <p className="text-center text-gray-500">No resources found.</p>
          )}
        </div>
      </main>
    </div>
  );
}