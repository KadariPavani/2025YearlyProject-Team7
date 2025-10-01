import React, { useEffect, useState } from 'react';

const StudentSyllabus = () => {
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSyllabi() {
      try {
        setLoading(true);
        const response = await fetch('/api/syllabi/public');
        const data = await response.json();
        setSyllabi(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to fetch syllabi');
        setSyllabi([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSyllabi();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-10 text-center">Academic Syllabus</h1>
      {loading && (
        <div className="text-center py-8">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 inline-block"></span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-center">{error}</div>
      )}
      <div className="max-w-3xl mx-auto space-y-8">
        {syllabi.length === 0 && !loading ? (
          <div className="text-center text-gray-500 py-10">No syllabi available.</div>
        ) : (
          syllabi.map((syllabus) => (
            <div key={syllabus._id || syllabus.id} className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-2">{syllabus.title}</h2>
              {syllabus.description && (
                <p className="text-gray-700 mb-6">{syllabus.description}</p>
              )}
              <div>
                <h3 className="font-semibold mb-4 text-lg text-blue-600">Topics</h3>
                {Array.isArray(syllabus.topics) && syllabus.topics.length > 0 ? (
                  <div className="space-y-4">
                    {syllabus.topics.map((topic, idx) => (
                      <div key={idx} className="bg-blue-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <span className="text-lg font-semibold text-blue-800">{topic.topicName}</span>
                          {topic.description && (
                            <div className="text-gray-600 mt-1">{topic.description}</div>
                          )}
                        </div>
                        <div className="mt-2 md:mt-0 md:ml-6 flex-shrink-0">
                          <span className="inline-block bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-medium text-sm">
                            {topic.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No topics listed.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentSyllabus;
