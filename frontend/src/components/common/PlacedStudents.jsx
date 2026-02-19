import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
console.log('[PlacedStudents] Using API_BASE:', API_BASE);

export default function PlacedStudents() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

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
        console.log('[PlacedStudents] Fetched data:', res.data);
        if (res.data && res.data.success) {
          setStudents(res.data.data.students || []);
        }
      } catch (err) {
        if (err?.code === 'ERR_CANCELED') return;
        console.error('[PlacedStudents] Fetch error:', {
          message: err.message,
          status: err?.response?.status,
          data: err?.response?.data,
          url: err?.config?.url
        });
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

    if (position === 0) {
      return {
        transform: 'translateX(-230px) translateY(-30%) scale(1)',
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'none',
        transition: 'all 0.8s ease-in-out',
      };
    } else if (position === 1) {
      return {
        transform: 'translateX(26%) translateY(-30%) scale(0.75)',
        opacity: 0.5,
        zIndex: 20,
        transition: 'all 0.8s ease-in-out',
      };
    } else if (position === -1) {
      return {
        transform: 'translateX(-130%) translateY(-30%) scale(0.75)',
        opacity: 0.5,
        zIndex: 20,
        transition: 'all 0.8s ease-in-out',
      };
    } else if (position === 2) {
      return {
        transform: 'translateX(60%) translateY(-30%) scale(0.6)',
        opacity: 0.3,
        zIndex: 10,
        transition: 'all 0.8s ease-in-out',
      };
    } else if (position === -2) {
      return {
        transform: 'translateX(-160%) translateY(-30%) scale(0.6)',
        opacity: 0.3,
        zIndex: 10,
        transition: 'all 0.8s ease-in-out',
      };
    } else {
      return {
        transform: 'translateX(0) translateY(-30%) scale(0.5)',
        opacity: 0,
        zIndex: 0,
        transition: 'all 0.8s ease-in-out',
      };
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
  className="w-full flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 px-0 bg-[#5791ED] min-h-[380px] md:min-h-[500px]"
>

      <div className="text-center mb-6 w-full px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left w-full sm:w-auto">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Placement Success Stories
          </h1>
          <p className="text-sm md:text-lg lg:text-xl text-white/90 max-w-2xl">
            Hear what our successful candidates have to say about their journey with us
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/placed-students"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-blue-600 rounded-md shadow hover:opacity-95 transition"
          >
            View All Students
          </a>
        </div>
      </div>

{/* 🟩 Shift cards slightly upward */}

{/* Desktop carousel - visible on md+; hidden on smaller screens */}
<div className="hidden md:block relative w-full max-w-7xl h-80 -mt-12 px-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
  {students.map((s, index) => {
    const style = getCardStyle(index);
    return (
      <div
        key={`${s.studentId || s.rollNumber}-${index}`}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md transition-all duration-700 ease-in-out cursor-pointer"
        style={style}
        onClick={() => handleCardClick(index)}
      >
        <div
          className={`rounded-2xl shadow-2xl p-6 text-center transition-all duration-700 ${
            index === currentIndex ? 'bg-white scale-105' : 'bg-blue-200'
          }`}
        >
          <div className="flex justify-center mb-4">
            <img
              loading="lazy"
              decoding="async"
              src={s.profileImageUrl || 'https://ui-avatars.com/api/?background=1e40af&color=fff&name=' + encodeURIComponent(s.name)}
              alt={s.name}
              className="w-32 h-32 rounded-full border-4 border-blue-600 object-cover"
            />
          </div>

          <h3
            className={`font-semibold text-xl sm:text-2xl mb-1 ${
              index === currentIndex ? 'text-gray-900' : 'text-blue-900'
            }`}
          >
            {s.name}
          </h3>

          <div className="text-sm mb-3" style={{ color: index === currentIndex ? '#374151' : '#1e3a8a' }}>
            {s.companyName && <div className="font-medium">{s.companyName}</div>}
            <div className="text-xs font-semibold text-blue-600">
              Roll No: {s.rollNumber || s.rollNo || '—'}
            </div>
            {s.batchName && s.batchName !== 'NA' && (
              <div className="text-xs">Batch: {s.batchName}</div>
            )}
          </div>
        </div>
      </div>
    );
  })}

  {/* Controls (optional) */}
  <button aria-label="Previous" onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow">
    &larr;
  </button>
  <button aria-label="Next" onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow">
    &rarr;
  </button>
</div>

{/* Mobile stacked list with matching card styles (shown below md) */}
    <div className="md:hidden -mt-6 space-y-3 w-full max-w-4xl mx-auto px-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
  {loading ? (
    <div className="text-center py-6 text-white">Loading…</div>
  ) : students.length === 0 ? (
    <div className="text-center py-6 text-white">No placed students yet</div>
  ) : (
    students.map((t, index) => (
      <div 
        key={`${t.studentId || t.rollNumber}-${index}`} 
        className={`bg-white rounded-lg shadow p-2 sm:p-4 flex items-center gap-3 sm:gap-4 border border-blue-50 transition-all duration-500 ${
          index === currentIndex ? 'scale-105 shadow-xl border-blue-300' : 'scale-100'
        }`}
        style={{
          animation: `slideInUp 0.5s ease-out ${index * 0.05}s both`
        }}
      >
        <img loading="lazy" decoding="async" src={t.profileImageUrl || 'https://ui-avatars.com/api/?background=1e40af&color=fff&name=' + encodeURIComponent(t.name)} alt={t.name} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-blue-600 object-cover" />
        <div className="min-w-0">
          <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{t.name}</div>
          <div className="text-xs sm:text-sm text-blue-600 font-medium truncate">
            Roll No: {t.rollNumber || t.rollNo || '—'}
          </div>
          {t.companyName && (
            <div className="text-xs sm:text-sm text-gray-600 truncate">{t.companyName}</div>
          )}
          {t.batchName && t.batchName !== 'NA' && (
            <div className="text-xs text-gray-500 mt-0.5">Batch: {t.batchName}</div>
          )}
          {t.hometown && t.hometown !== 'NA' && (
            <div className="text-xs text-gray-500 mt-0.5">Hometown: {t.hometown}</div>
          )}
        </div>
      </div>
    ))
  )}
</div>

<style>{`
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style>

{/* Bring note text closer to cards */}




    </section>
  );
}
