import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export default function PlacedStudents() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // touch coordinates for swipe support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch recent placed students for landing page (public endpoint)
  const fetchRef = useRef(null);
  useEffect(() => {
    const fetchPlaced = async () => {
      if (fetchRef.current) fetchRef.current.abort();
      const controller = new AbortController();
      fetchRef.current = controller;

      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/public/placed-students`, { 
          params: { limit: 6 }, 
          signal: controller.signal,
          withCredentials: true
        });
        if (res.data && res.data.success) {
          setStudents(res.data.data.students || []);
        }
      } catch (err) {
        if (err?.code === 'ERR_CANCELED') return;
      } finally {
        setLoading(false);
        if (fetchRef.current === controller) fetchRef.current = null;
      }
    };

    fetchPlaced();
    return () => { if (fetchRef.current) fetchRef.current.abort(); };
  }, []);


  const nextSlide = () => {
    if (students.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % students.length);
  };

  const prevSlide = () => {
    if (students.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + students.length) % students.length);
  };

  const getCardStyle = (index) => {
    const diff = index - currentIndex;
    let position;

    if (diff === 0) position = 0;
    else if (diff === 1 || diff === -(students.length - 1)) position = 1;
    else if (diff === -1 || diff === students.length - 1) position = -1;
    else if (diff === 2 || diff === -(students.length - 2)) position = 2;
    else if (diff === -2 || diff === students.length - 2) position = -2;
    else position = 3;

    const base = { transition: 'all 0.6s ease-in-out', position: 'absolute', left: '50%', top: '50%' };

    if (isMobile) {
      switch (position) {
        case 0:
          return { ...base, transform: 'translate(-50%, -50%) scale(1)', opacity: 1, zIndex: 30 };
        case 1:
          return { ...base, transform: 'translate(30%, -50%) scale(0.65)', opacity: 0.3, zIndex: 20 };
        case -1:
          return { ...base, transform: 'translate(-130%, -50%) scale(0.65)', opacity: 0.3, zIndex: 20 };
        case 2:
          return { ...base, transform: 'translate(80%, -50%) scale(0.5)', opacity: 0.1, zIndex: 10 };
        case -2:
          return { ...base, transform: 'translate(-180%, -50%) scale(0.5)', opacity: 0.1, zIndex: 10 };
        default:
          return { ...base, transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0, zIndex: 0 };
      }
    }

    switch (position) {
      case 0:
        return { ...base, transform: 'translate(-50%, -50%) scale(1)', opacity: 1, zIndex: 30 };
      case 1:
        return { ...base, transform: 'translate(5%, -50%) scale(0.85)', opacity: 0.6, zIndex: 20 };
      case -1:
        return { ...base, transform: 'translate(-105%, -50%) scale(0.85)', opacity: 0.6, zIndex: 20 };
      case 2:
        return { ...base, transform: 'translate(50%, -50%) scale(0.7)', opacity: 0.25, zIndex: 10 };
      case -2:
        return { ...base, transform: 'translate(-150%, -50%) scale(0.7)', opacity: 0.25, zIndex: 10 };
      default:
        return { ...base, transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0, zIndex: 0 };
    }
  };

  const handleCardClick = (index) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  // 🕒 Auto-slide effect (only when we have students)
  useEffect(() => {
    if (students.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => clearInterval(interval);
  }, [students]);

  // 🎹 Keyboard navigation
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [students]);

  // touch handlers (swipe support)
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const dx = touchEndX.current - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = touchEndX.current = 0;
  };

  return (
<section
  id="students"
  className="w-full flex flex-col items-center justify-center py-6 sm:py-12 md:py-16 lg:py-20 px-0 bg-[#5791ED] min-h-[320px] sm:min-h-[420px] md:min-h-[520px]"
>

      <div className="relative mb-3 sm:mb-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="text-left">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-2">
            Placement Success Stories
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 max-w-2xl leading-snug sm:leading-normal">
            Hear what our successful candidates have to say about their journey with us
          </p>
        </div>

        <a
          href="/placed-students"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center px-1.5 py-0.5 sm:px-3 sm:py-2 bg-white text-blue-600 rounded sm:rounded-md shadow hover:opacity-95 transition text-[8px] sm:text-sm font-medium"
        >
          View All
        </a>
      </div>

{/* Unified carousel for all screen sizes */}
<div
  className="relative w-full max-w-5xl mx-auto h-44 sm:h-64 md:h-80 mt-1 sm:mt-2 px-10 sm:px-16 md:px-20 overflow-hidden"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {loading ? (
    <div className="absolute inset-0 flex items-center justify-center text-white">Loading...</div>
  ) : students.length === 0 ? (
    <div className="absolute inset-0 flex items-center justify-center text-white">No placed students yet</div>
  ) : (
    students.map((s, index) => {
      const style = getCardStyle(index);
      return (
        <div
          key={`${s.studentId || s.rollNumber}-${index}`}
          className="w-[130px] sm:w-[270px] md:w-[360px] cursor-pointer"
          style={style}
          onClick={() => handleCardClick(index)}
        >
          <div className={`rounded-lg sm:rounded-2xl shadow-2xl p-2 sm:p-4 md:p-6 text-center transition-colors duration-500 ${
            index === currentIndex ? 'bg-white' : 'bg-blue-200'
          }`}>
            <div className="flex justify-center mb-1.5 sm:mb-3 md:mb-4">
              <img
                loading="lazy"
                decoding="async"
                src={s.profileImageUrl || 'https://ui-avatars.com/api/?background=1e40af&color=fff&name=' + encodeURIComponent(s.name)}
                alt={s.name}
                className="w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full border-2 md:border-4 border-blue-600 object-cover"
              />
            </div>

            <h3 className={`font-semibold text-[10px] sm:text-base md:text-xl mb-0.5 sm:mb-1 truncate ${
              index === currentIndex ? 'text-gray-900' : 'text-blue-900'
            }`}>
              {s.name}
            </h3>

            <div className="text-[8px] sm:text-sm space-y-px sm:space-y-0" style={{ color: index === currentIndex ? '#374151' : '#1e3a8a' }}>
              {s.companyName && <div className="font-medium truncate">{s.companyName}</div>}
              {s.type && s.type !== 'PLACEMENT' && (
                <span className={`inline-block text-[7px] sm:text-[9px] md:text-[10px] font-semibold px-1 sm:px-1.5 md:px-2 py-px sm:py-0.5 rounded-full ${s.type === 'INTERNSHIP' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {s.type}
                </span>
              )}
              <div className="text-[7px] sm:text-xs font-semibold text-blue-600">
                {s.rollNumber || s.rollNo || '—'}
              </div>
            </div>
          </div>
        </div>
      );
    })
  )}

</div>

{/* Dot indicators */}
{students.length > 0 && (
  <div className="flex justify-center gap-1 sm:gap-2 mt-2 sm:mt-4">
    {students.map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentIndex(i)}
        className={`rounded-full transition-all duration-300 ${
          i === currentIndex ? 'w-4 sm:w-8 h-1.5 sm:h-2.5 bg-white' : 'w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 bg-white/40'
        }`}
      />
    ))}
  </div>
)}




    </section>
  );
}
