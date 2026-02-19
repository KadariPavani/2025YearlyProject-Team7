import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { BookOpen, Video, FileText, Link, Eye, Tag, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

const CARD_COLOR = { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };

export default function PublicReferences() {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);
  const directionRef = useRef(1);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  // Drag state (works for both mouse & touch)
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/references/all`, { withCredentials: true });
        setReferences(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('[PublicReferences] Fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRefs();
  }, []);

  const pauseAndResume = useCallback((delay = 3000) => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, delay);
  }, []);

  // Smooth auto-scroll ping-pong — identical on all devices
  useEffect(() => {
    if (references.length === 0 || !scrollRef.current) return;
    const container = scrollRef.current;
    const speed = 0.4;

    const animate = () => {
      if (!isPausedRef.current && container) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 0) {
          const next = container.scrollLeft + speed * directionRef.current;
          if (next >= maxScroll) { container.scrollLeft = maxScroll; directionRef.current = -1; }
          else if (next <= 0) { container.scrollLeft = 0; directionRef.current = 1; }
          else { container.scrollLeft = next; }
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [references]);

  // Unified pointer handlers (mouse + touch)
  const getX = (e) => e.touches ? e.touches[0].pageX : e.pageX;

  const onPointerDown = useCallback((e) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = getX(e);
    dragScrollLeftRef.current = scrollRef.current.scrollLeft;
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const dx = getX(e) - dragStartXRef.current;
    if (Math.abs(dx) > 5) hasDraggedRef.current = true;
    scrollRef.current.scrollLeft = dragScrollLeftRef.current - dx;
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    pauseAndResume(2500);
  }, [pauseAndResume]);

  useEffect(() => {
    const opts = { passive: true };
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, opts);
    window.addEventListener('touchend', onPointerUp, opts);
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const scrollByBtn = (dir) => {
    if (!scrollRef.current) return;
    pauseAndResume(3000);
    scrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  // Prevent link clicks when user was dragging
  const guardClick = (e) => { if (hasDraggedRef.current) e.preventDefault(); };

  if (loading) {
    return (
      <section className="py-8 md:py-14 px-4">
        <div className="max-w-7xl mx-auto flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[220px] md:w-[260px] h-52 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (references.length === 0) return null;

  return (
    <section className="py-8 md:py-14 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-5 md:mb-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                Learning Resources
              </h2>
              <p className="text-gray-400 text-[10px] md:text-xs">
                Public references from our trainers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => scrollByBtn(-1)} className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm active:scale-90 transition-all" aria-label="Scroll left">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => scrollByBtn(1)} className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm active:scale-90 transition-all" aria-label="Scroll right">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards row */}
      <div
        ref={scrollRef}
        className="ref-scroll flex gap-3 md:gap-4 px-4 overflow-x-auto select-none"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab' }}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
      >
        {references.map((ref, index) => {
          const color = CARD_COLOR;
          const trainerName = ref.trainerId?.name || 'Trainer';

          return (
            <div key={ref._id} className="w-[220px] md:w-[260px] flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
                {/* Header */}
                <div className={`bg-gradient-to-r ${color.bg} px-3 py-2.5 md:px-4 md:py-3 relative`}>
                  <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
                  <div className="absolute -left-2 -bottom-4 w-10 h-10 bg-white/10 rounded-full" />
                  <div className="relative">
                    <span className="inline-block px-1.5 py-px bg-white/20 text-white text-[9px] md:text-[10px] font-medium rounded-full mb-1">
                      {ref.subject}
                    </span>
                    <h3 className="text-white font-semibold text-xs md:text-sm leading-snug line-clamp-2">
                      {ref.topicName}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="px-3 py-2 md:px-3.5 md:py-2.5 flex flex-col flex-1">
                  {/* Trainer */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[8px] font-bold text-gray-500">
                      {trainerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-500 font-medium truncate">{trainerName}</span>
                  </div>

                  {/* Resource links */}
                  {(ref.referenceVideoLink || ref.referenceNotesLink || (ref.files && ref.files.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ref.referenceVideoLink && (
                        <a href={ref.referenceVideoLink} target="_blank" rel="noopener noreferrer" draggable="false" onClick={guardClick}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-[9px] md:text-[10px] font-medium rounded border border-red-200 hover:bg-red-100 active:scale-95 transition-all">
                          <Video className="w-2.5 h-2.5" /> Video <ExternalLink className="w-2 h-2" />
                        </a>
                      )}
                      {ref.referenceNotesLink && (
                        <a href={ref.referenceNotesLink} target="_blank" rel="noopener noreferrer" draggable="false" onClick={guardClick}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] md:text-[10px] font-medium rounded border border-green-200 hover:bg-green-100 active:scale-95 transition-all">
                          <Link className="w-2.5 h-2.5" /> Notes <ExternalLink className="w-2 h-2" />
                        </a>
                      )}
                      {ref.files && ref.files.map((file, fi) => (
                        <a key={fi} href={file.url} target="_blank" rel="noopener noreferrer" draggable="false" onClick={guardClick}
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 ${color.light} ${color.text} text-[9px] md:text-[10px] font-medium rounded ${color.border} border hover:shadow-sm active:scale-95 transition-all`}>
                          <FileText className="w-2.5 h-2.5" />
                          <span className="max-w-[60px] md:max-w-[80px] truncate">{file.filename}</span>
                          <ExternalLink className="w-2 h-2" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {ref.tags && ref.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ref.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-px text-[8px] md:text-[9px] text-gray-400 bg-gray-50 px-1.5 py-px rounded-full">
                          <Tag className="w-2 h-2" />{tag}
                        </span>
                      ))}
                      {ref.tags.length > 2 && (
                        <span className="text-[8px] md:text-[9px] text-gray-300">+{ref.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-1.5 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[9px] md:text-[10px] text-gray-400">
                      {new Date(ref.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {ref.viewCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] md:text-[10px] text-gray-400">
                        <Eye className="w-2.5 h-2.5" />{ref.viewCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .ref-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
