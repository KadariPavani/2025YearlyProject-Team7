// src/components/student/StudentSyllabus.jsx
import React from 'react';
import { BookOpen, Clock } from 'lucide-react';

const StudentSyllabus = ({ syllabi = [] }) => {
  if (syllabi.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          Course Syllabus
        </h3>
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No syllabus available</p>
          <p className="text-gray-400 text-sm">Course syllabus will appear here once uploaded by trainers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {syllabi.map((syllabus) => (
        <div
          key={syllabus._id}
          className="bg-white rounded-2xl shadow border border-gray-200 p-8 print:shadow-none print:border print:p-6 print:break-inside-avoid"
        >
          {/* Title & Description */}
          <div className="border-b border-gray-200 pb-5 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{syllabus.title}</h3>
            {syllabus.description && (
              <p className="text-gray-700 leading-relaxed">{syllabus.description}</p>
            )}
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Topics Covered
            </h4>

            {Array.isArray(syllabus.topics) && syllabus.topics.length > 0 ? (
              <div className="space-y-5">
                {syllabus.topics.map((topic, idx) => (
                  <div key={idx} className="flex gap-4 items-start group">
                    <div className="flex-shrink-0 w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors">
                        {topic.topicName}
                      </h5>
                      {topic.description && (
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                          {topic.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          {topic.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No topics listed.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentSyllabus;