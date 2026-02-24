import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Video, FileText, Link, Eye, Tag } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

const COLORS = [
  { bg: 'bg-blue-500', tag: 'bg-blue-100 text-blue-700', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  { bg: 'bg-indigo-500', tag: 'bg-indigo-100 text-indigo-700', text: 'text-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
  { bg: 'bg-violet-500', tag: 'bg-violet-100 text-violet-700', text: 'text-violet-600', border: 'border-violet-200', light: 'bg-violet-50' },
  { bg: 'bg-cyan-500', tag: 'bg-cyan-100 text-cyan-700', text: 'text-cyan-600', border: 'border-cyan-200', light: 'bg-cyan-50' },
  { bg: 'bg-teal-500', tag: 'bg-teal-100 text-teal-700', text: 'text-teal-600', border: 'border-teal-200', light: 'bg-teal-50' },
  { bg: 'bg-emerald-500', tag: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
];

export default function PublicReferences() {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/references/all`, { withCredentials: true });
        setReferences(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchRefs();
  }, []);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 sm:mb-8">
          <div className="h-6 sm:h-10 w-48 sm:w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 sm:h-5 w-64 sm:w-80 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 sm:gap-4 px-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="ref-card shrink-0 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (references.length === 0) return null;

  // Ensure enough cards to always fill the screen seamlessly
  // We need at least ~10 cards per copy so the second copy is off-screen
  const repeatCount = Math.max(2, Math.ceil(20 / references.length));
  const repeatedOnce = Array.from({ length: repeatCount }, () => references).flat();
  // Double it so translateX(-50%) loops seamlessly
  const doubled = [...repeatedOnce, ...repeatedOnce];

  const renderCard = (ref, index, globalIndex) => {
    const color = COLORS[index % COLORS.length];
    const trainerName = ref.trainerId?.name || 'Trainer';
    const hasLinks = ref.referenceVideoLink || ref.referenceNotesLink || (ref.files && ref.files.length > 0);

    return (
      <div
        key={`${ref._id}-${globalIndex}`}
        className="ref-card shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
      >
        {/* Color strip */}
        <div className={`${color.bg} h-1 sm:h-1.5`} />

        <div className="p-1.5 sm:p-3 md:p-4 flex flex-col flex-1 overflow-hidden">
          {/* Subject badge */}
          <span className={`self-start inline-block px-1 sm:px-2 py-px text-[6px] sm:text-[9px] md:text-[10px] font-semibold rounded-full ${color.tag} mb-0.5 sm:mb-1.5`}>
            {ref.subject}
          </span>

          {/* Topic */}
          <h3 className="font-semibold text-[8px] sm:text-xs md:text-sm text-gray-800 leading-tight sm:leading-snug line-clamp-2 mb-1 sm:mb-2">
            {ref.topicName}
          </h3>

          {/* Trainer */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2">
            <div className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full ${color.bg} flex items-center justify-center text-[6px] sm:text-[8px] font-bold text-white shrink-0`}>
              {trainerName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[7px] sm:text-[10px] md:text-xs text-gray-500 truncate">{trainerName}</span>
          </div>

          {/* Resource links */}
          {hasLinks && (
            <div className="flex flex-wrap gap-0.5 sm:gap-1.5 mb-1 sm:mb-2">
              {ref.referenceVideoLink && (
                <a href={ref.referenceVideoLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-px sm:gap-0.5 px-1 py-px sm:px-2 sm:py-1 bg-red-50 text-red-600 text-[6px] sm:text-[9px] md:text-[10px] font-medium rounded sm:rounded-md border border-red-200 hover:bg-red-100 transition-colors">
                  <Video className="w-1.5 h-1.5 sm:w-3 sm:h-3" /> Video
                </a>
              )}
              {ref.referenceNotesLink && (
                <a href={ref.referenceNotesLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-px sm:gap-0.5 px-1 py-px sm:px-2 sm:py-1 bg-green-50 text-green-600 text-[6px] sm:text-[9px] md:text-[10px] font-medium rounded sm:rounded-md border border-green-200 hover:bg-green-100 transition-colors">
                  <Link className="w-1.5 h-1.5 sm:w-3 sm:h-3" /> Notes
                </a>
              )}
              {ref.files && ref.files.slice(0, 1).map((file, fi) => (
                <a key={fi} href={file.url} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-px sm:gap-0.5 px-1 py-px sm:px-2 sm:py-1 ${color.light} ${color.text} text-[6px] sm:text-[9px] md:text-[10px] font-medium rounded sm:rounded-md border ${color.border} hover:shadow-sm transition-colors`}>
                  <FileText className="w-1.5 h-1.5 sm:w-3 sm:h-3" /> File
                </a>
              ))}
              {/* Show extra files on desktop */}
              <span className="hidden sm:contents">
                {ref.files && ref.files.slice(1).map((file, fi) => (
                  <a key={fi + 1} href={file.url} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-0.5 px-2 py-1 ${color.light} ${color.text} text-[9px] md:text-[10px] font-medium rounded-md border ${color.border} hover:shadow-sm transition-colors`}>
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[70px] truncate">{file.filename}</span>
                  </a>
                ))}
              </span>
            </div>
          )}

          {/* Tags - hidden on mobile */}
          {ref.tags && ref.tags.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1 mb-2">
              {ref.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-px text-[8px] md:text-[9px] text-gray-400 bg-gray-50 px-1.5 py-px rounded-full border border-gray-100">
                  <Tag className="w-2 h-2" />{tag}
                </span>
              ))}
              {ref.tags.length > 2 && (
                <span className="text-[8px] text-gray-300">+{ref.tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-1 sm:pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[6px] sm:text-[9px] md:text-[10px] text-gray-400">
              {new Date(ref.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {ref.viewCount > 0 && (
              <span className="inline-flex items-center gap-px sm:gap-0.5 text-[6px] sm:text-[9px] md:text-[10px] text-gray-400">
                <Eye className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5" />{ref.viewCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
            Learning Resources
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-0.5 sm:mt-1">
            Public references from our trainers
          </p>
        </div>
      </div>

      {/* Auto-scrolling horizontal row */}
      <div className="ref-scroll-container overflow-hidden">
        <div className="ref-scroll-track flex gap-2 sm:gap-4 w-max hover:[animation-play-state:paused]">
          {doubled.map((ref, globalIndex) => {
            const origIndex = globalIndex % references.length;
            return renderCard(ref, origIndex, globalIndex);
          })}
        </div>
      </div>

      <style>{`
        .ref-card {
          width: 140px;
          height: 140px;
        }
        @media (min-width: 640px) {
          .ref-card {
            width: 240px;
            height: auto;
          }
        }
        @media (min-width: 768px) {
          .ref-card {
            width: 280px;
          }
        }
        @media (min-width: 1024px) {
          .ref-card {
            width: 300px;
          }
        }

        @keyframes refScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ref-scroll-track {
          animation: refScroll ${repeatedOnce.length * 3}s linear infinite;
        }

        @media (max-width: 639px) {
          .ref-scroll-track {
            animation-duration: ${repeatedOnce.length * 2}s;
          }
        }
      `}</style>
    </section>
  );
}
