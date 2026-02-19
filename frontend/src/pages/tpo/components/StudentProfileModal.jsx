import React, { useState, useEffect } from 'react';
import {
  Building, Eye, Code2, GraduationCap, X, Download, BookOpen, FileText,
  User, Phone, Mail, MapPin as Location, GraduationCap as Education, Briefcase,
  ExternalLink, Star, Activity, Award
} from 'lucide-react';
import api from '../../../services/api';

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-500 text-xs sm:text-sm">{label}</span>
    <span className="font-medium text-gray-900 text-xs sm:text-sm flex items-center gap-1.5 text-right max-w-[55%] truncate">
      {Icon && <Icon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
      {value || 'N/A'}
    </span>
  </div>
);

const ProfileSection = ({ title, icon: Icon, children }) => (
  <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-blue-600 flex-shrink-0" />}
      {title}
    </h4>
    {children}
  </div>
);

const ProfileBadge = ({ text, variant = 'default' }) => {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${styles[variant]}`}>
      {text}
    </span>
  );
};

const getStatusVariant = (status) => {
  if (!status) return 'default';
  if (status === 'placed' || status.includes('approved')) return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'CRT') return 'primary';
  return 'default';
};

const PerformanceRing = ({ percentage, color, size = 48 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-800">
        {Math.round(pct)}%
      </span>
    </div>
  );
};

const StudentProfileModal = ({ student, onClose }) => {
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!student?._id) return;
    setActivityLoading(true);
    api.get(`/api/student-activity/${student._id}`)
      .then(res => { if (res.data?.success) setActivity(res.data.data); })
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [student?._id]);

  if (!student) return null;

  const handleResumeDownload = (resumeUrl, fileName) => {
    if (resumeUrl) {
      const link = document.createElement('a');
      link.href = resumeUrl;
      link.download = fileName || 'resume';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const totals = activity?.scores?.totals;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg md:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Sticky header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-3.5 sm:py-4 sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-white/10">
              {student.profileImageUrl ? (
                <img src={student.profileImageUrl} alt={student.name} className="w-full h-full object-cover" onClick={() => student.profileImageUrl && window.open(student.profileImageUrl, '_blank')} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                  {student.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{student.name}</h3>
              <p className="text-blue-200 text-[11px] sm:text-xs truncate">{student.rollNo} &bull; {student.college} &bull; {student.branch}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-white/20 active:bg-white/30 rounded-lg transition-colors text-white/70 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status badges bar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          {student.crtStatus && <ProfileBadge text={student.crtStatus} variant={getStatusVariant(student.crtStatus)} />}
          {student.status && <ProfileBadge text={student.status} variant={getStatusVariant(student.status)} />}
          {student.batchNumber && <ProfileBadge text={student.batchNumber} variant="primary" />}
          {student.yearOfPassing && <ProfileBadge text={`YOP: ${student.yearOfPassing}`} variant="default" />}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-3 sm:space-y-4">

          {/* Contact & Basic Info */}
          <ProfileSection title="Basic Information" icon={User}>
            <div className="space-y-0">
              <InfoRow label="Email" value={student.email} icon={Mail} />
              <InfoRow label="Phone" value={student.phonenumber} icon={Phone} />
              <InfoRow label="College" value={student.college} icon={Building} />
              <InfoRow label="Branch" value={student.branch} icon={GraduationCap} />
              <InfoRow label="Year of Passing" value={student.yearOfPassing} />
            </div>
          </ProfileSection>

          {/* Personal Info */}
          {(student.gender || student.dob || student.currentLocation || student.hometown) && (
            <ProfileSection title="Personal Information" icon={User}>
              <div className="space-y-0">
                {student.gender && <InfoRow label="Gender" value={student.gender} />}
                {student.dob && <InfoRow label="Date of Birth" value={new Date(student.dob).toLocaleDateString()} />}
                {student.currentLocation && <InfoRow label="Location" value={student.currentLocation} icon={Location} />}
                {student.hometown && <InfoRow label="Hometown" value={student.hometown} icon={Location} />}
              </div>
            </ProfileSection>
          )}

          {/* Resume */}
          {student.resumeUrl && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">Resume</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{student.resumeFileName || 'resume.pdf'}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => window.open(student.resumeUrl, '_blank')} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">View</span>
                </button>
                <button onClick={() => handleResumeDownload(student.resumeUrl, student.resumeFileName)} className="px-2.5 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-[10px] sm:text-xs font-medium hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>
          )}

          {/* Bio */}
          {student.bio && (
            <ProfileSection title="Professional Bio">
              <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">{student.bio}</p>
            </ProfileSection>
          )}

          {/* Academics */}
          {student.academics && (
            <ProfileSection title="Academic Records" icon={Education}>
              <div className="space-y-2">
                {student.academics.btechCGPA && (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">B.Tech CGPA</span>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-blue-700">{student.academics.btechCGPA}/10</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {student.academics.inter?.percentage && (
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-xs">12th / Inter</p>
                      <p className="text-base sm:text-lg font-bold text-gray-800 mt-0.5">{student.academics.inter.percentage}%</p>
                      {student.academics.inter.board && <p className="text-[10px] text-gray-500">{student.academics.inter.board}</p>}
                    </div>
                  )}
                  {student.academics.diploma?.percentage && (
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-xs">Diploma</p>
                      <p className="text-base sm:text-lg font-bold text-gray-800 mt-0.5">{student.academics.diploma.percentage}%</p>
                      {student.academics.diploma.board && <p className="text-[10px] text-gray-500">{student.academics.diploma.board}</p>}
                    </div>
                  )}
                </div>
                {student.academics.backlogs !== undefined && (
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">Active Backlogs</span>
                    <span className={`text-lg font-bold ${student.academics.backlogs === 0 ? 'text-green-600' : 'text-red-600'}`}>{student.academics.backlogs}</span>
                  </div>
                )}
              </div>
            </ProfileSection>
          )}

          {/* Tech Stack */}
          {student.techStack && student.techStack.length > 0 && (
            <ProfileSection title="Technical Skills" icon={Code2}>
              <div className="flex flex-wrap gap-1.5">
                {student.techStack.map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] sm:text-xs font-medium border border-blue-200">{tech}</span>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Performance Summary */}
          <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              Performance Summary
            </h4>
            {activityLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <span className="ml-2 text-xs text-gray-500">Loading performance data...</span>
              </div>
            ) : totals ? (
              <div className="space-y-3">
                <div className="flex items-center justify-around bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3">
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.overallPercentage} color="#4f46e5" size={56} />
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Overall</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.quizPercentage} color="#0891b2" size={44} />
                    <span className="text-[10px] sm:text-xs text-gray-600">Quiz</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.assignmentPercentage} color="#059669" size={44} />
                    <span className="text-[10px] sm:text-xs text-gray-600">Assignment</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.codingPercentage} color="#7c3aed" size={44} />
                    <span className="text-[10px] sm:text-xs text-gray-600">Coding</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2 sm:p-2.5 text-center">
                    <BookOpen className="h-3.5 w-3.5 text-cyan-600 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Quizzes</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{totals.quizScore}/{totals.quizTotalMarks}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400">{activity?.scores?.quizzes?.filter(q => q.submittedAt).length || 0} attempted</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 sm:p-2.5 text-center">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Assignments</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{totals.assignmentScore}/{totals.assignmentTotalMarks}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400">{activity?.scores?.assignments?.filter(a => a.submittedAt).length || 0} submitted</p>
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-2 sm:p-2.5 text-center">
                    <Code2 className="h-3.5 w-3.5 text-violet-600 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Coding</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{totals.codingScore}/{totals.codingTotalMarks}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400">{activity?.scores?.coding?.length || 0} solved</p>
                  </div>
                </div>

                {activity?.scores?.quizzes?.some(q => q.submittedAt) && (
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5">Recent Quizzes</p>
                    <div className="space-y-1">
                      {activity.scores.quizzes
                        .filter(q => q.submittedAt)
                        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                        .slice(0, 3)
                        .map((q, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{q.quizTitle}</p>
                              <p className="text-[9px] text-gray-400">{q.subject}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] sm:text-xs font-bold ${q.percentage >= 80 ? 'text-green-600' : q.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {q.score}/{q.totalMarks}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${q.percentage >= 80 ? 'bg-green-100 text-green-700' : q.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(q.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {activity?.scores?.assignments?.some(a => a.submittedAt) && (
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5">Recent Assignments</p>
                    <div className="space-y-1">
                      {activity.scores.assignments
                        .filter(a => a.submittedAt)
                        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                        .slice(0, 3)
                        .map((a, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{a.assignmentTitle}</p>
                              <p className="text-[9px] text-gray-400">{a.subject}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] sm:text-xs font-bold ${a.percentage >= 80 ? 'text-green-600' : a.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {a.score}/{a.totalMarks}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${a.percentage >= 80 ? 'bg-green-100 text-green-700' : a.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(a.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {activity?.scores?.coding?.length > 0 && (
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5">Coding Problems</p>
                    <div className="space-y-1">
                      {activity.scores.coding
                        .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
                        .slice(0, 3)
                        .map((c, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{c.questionTitle}</p>
                              <p className="text-[9px] text-gray-400">{c.contestName}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] sm:text-xs font-bold ${c.percentage >= 80 ? 'text-green-600' : c.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {c.score}/{c.totalMarks}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${c.percentage >= 80 ? 'bg-green-100 text-green-700' : c.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(c.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">No performance data available</p>
              </div>
            )}
          </div>

          {/* Projects */}
          {student.projects && student.projects.length > 0 && (
            <ProfileSection title={`Projects (${student.projects.length})`} icon={Briefcase}>
              <div className="space-y-2">
                {student.projects.slice(0, 5).map((project, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">{project.title}</h5>
                      <ProfileBadge text={project.verificationStatus?.replace('_', ' ') || 'pending'} variant={getStatusVariant(project.verificationStatus)} />
                    </div>
                    {project.description && <p className="text-gray-600 text-[10px] sm:text-xs line-clamp-2 mb-1.5">{project.description}</p>}
                    {project.techStack && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {project.techStack.map((tech, j) => (
                          <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] sm:text-[10px]">{tech}</span>
                        ))}
                      </div>
                    )}
                    {project.links?.github && (
                      <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[10px] sm:text-xs font-medium">
                        <ExternalLink className="h-3 w-3" /> GitHub
                      </a>
                    )}
                  </div>
                ))}
                {student.projects.length > 5 && <p className="text-center text-gray-500 text-[10px] sm:text-xs">+{student.projects.length - 5} more</p>}
              </div>
            </ProfileSection>
          )}

          {/* Internships */}
          {student.internships && student.internships.length > 0 && (
            <ProfileSection title={`Internships (${student.internships.length})`} icon={Briefcase}>
              <div className="space-y-2">
                {student.internships.map((intern, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="min-w-0">
                        <h5 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{intern.role}</h5>
                        <p className="text-gray-600 text-[10px] sm:text-xs">{intern.company}</p>
                      </div>
                      <ProfileBadge text={intern.verificationStatus?.replace('_', ' ') || 'pending'} variant={getStatusVariant(intern.verificationStatus)} />
                    </div>
                    {intern.location && <p className="text-gray-500 text-[10px] sm:text-xs flex items-center gap-1"><Location className="h-3 w-3" />{intern.location}</p>}
                    {(intern.startDate || intern.endDate) && (
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        {intern.startDate && new Date(intern.startDate).toLocaleDateString()} – {intern.endDate ? new Date(intern.endDate).toLocaleDateString() : 'Present'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Certifications */}
          {student.certifications && student.certifications.length > 0 && (
            <ProfileSection title={`Certifications (${student.certifications.length})`} icon={Award}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {student.certifications.map((cert, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-2.5">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="min-w-0">
                        <h5 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{cert.name}</h5>
                        <p className="text-gray-600 text-[10px] sm:text-xs">{cert.issuer}</p>
                      </div>
                      <ProfileBadge text={cert.verificationStatus?.replace('_', ' ') || 'pending'} variant={getStatusVariant(cert.verificationStatus)} />
                    </div>
                    {cert.credentialId && <p className="text-[10px] text-gray-400">ID: {cert.credentialId}</p>}
                    {cert.dateIssued && <p className="text-[10px] text-gray-400">Issued: {new Date(cert.dateIssued).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Placement Details */}
          {student.placementDetails && student.status === 'placed' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                <Star className="h-4 w-4 text-green-600" /> Placement Details
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <InfoRow label="Company" value={student.placementDetails.company} />
                <InfoRow label="Role" value={student.placementDetails.role} />
                <InfoRow label="Type" value={
                  (() => {
                    const t = student.placementDetails.type || 'PLACEMENT';
                    const s = { PLACEMENT: 'bg-green-100 text-green-700', INTERNSHIP: 'bg-blue-100 text-blue-700', TRAINING: 'bg-orange-100 text-orange-700' };
                    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s[t] || s.PLACEMENT}`}>{t}</span>;
                  })()
                } />
                {student.placementDetails.duration && student.placementDetails.duration !== 'FULL TIME' && (
                  <InfoRow label="Duration" value={`${student.placementDetails.duration} months`} />
                )}
                {(student.placementDetails.type || 'PLACEMENT') === 'PLACEMENT'
                  ? student.placementDetails.package && <InfoRow label="Package" value={`${student.placementDetails.package} LPA`} />
                  : <InfoRow label="Stipend" value={`${student.placementDetails.stipend || 0} K/month`} />
                }
                {student.placementDetails.location && <InfoRow label="Location" value={student.placementDetails.location} icon={Location} />}
              </div>
            </div>
          )}

          {/* Account Activity */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Account Activity</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center py-2 bg-white rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-500">Joined</p>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="text-center py-2 bg-white rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-500">Last Login</p>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">{student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
