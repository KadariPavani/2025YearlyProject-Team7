import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

const HighlightTicker = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  // Announce latest update for screen readers (combined)
  const [announcement, setAnnouncement] = useState('');

  const fetchRef = useRef(null);

  const fetchData = async () => {
    // Cancel any ongoing request before starting a new one
    if (fetchRef.current) fetchRef.current.abort();
    const controller = new AbortController();
    fetchRef.current = controller;

    try {
      const [uRes, rRes] = await Promise.all([
        axios.get(`${API_BASE}/api/public/upcoming-events`, { 
          params: { limit: 6 }, 
          signal: controller.signal,
          withCredentials: true
        }),
        axios.get(`${API_BASE}/api/public/placed-students`, { 
          params: { limit: 10 }, 
          signal: controller.signal,
          withCredentials: true
        })
      ]);

      if (uRes.data?.success) setUpcoming(uRes.data.data.events || []);
      if (rRes.data?.success) setRecent(rRes.data.data.students || []);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') return; // request was cancelled
      console.error('[HighlightTicker] Fetch error:', {
        message: err.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url
      });
      const status = err?.response?.status;
      setError(status ? `Could not load highlights (server ${status})` : 'Could not load highlights');
    } finally {
      if (fetchRef.current === controller) fetchRef.current = null;
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (fetchRef.current) fetchRef.current.abort();
    };
  }, []);

  // Respect reduced-motion: if user prefers reduced motion, show compact list without animation
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // build single-line messages (no static fallbacks)
  const upcomingMsgs = (upcoming || []).map(ev => {
    const datePart = ev.startDate ? ` on ${new Date(ev.startDate).toLocaleDateString()}` : '';
    return `New company ${ev.companyName}${datePart}`.replace(/\s+/g, ' ').trim();
  });

  // Only show company-level recent placement notifications (no student names)
  const recentCompanies = Array.from(new Set((recent || []).map(s => s.companyName).filter(Boolean)));

  // Limit recent companies to most recent 3
  const recentLimited = recentCompanies.slice(0, 3);
  const recentMsgsLimited = recentLimited.map(name => `New placement at ${name}`.replace(/\s+/g, ' ').trim());

  const combined = [...upcomingMsgs, ...recentMsgsLimited];

  useEffect(() => {
    // Update announcement when combined changes
    if (combined && combined.length > 0) setAnnouncement(combined[0]);
  }, [upcoming.join('|'), recent.map(r=>r.companyName).join('|')]);

  // If there are no updates, hide the ticker entirely
  if (combined.length === 0) return null; 

  // handle navigation to placements
  const handleNavigate = (e, text) => {
    e?.preventDefault();
    // if on home, smooth scroll to section; otherwise navigate to home with hash
    if (typeof window === 'undefined') return;
    const go = () => {
      const el = document.querySelector('#placements');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // fallback set hash
        window.location.hash = '#placements';
      }
    };

    if (window.location.pathname === '/') {
      go();
    } else {
      // navigate to home with hash
      window.location.href = '/#placements';
    }
  };

  return (
    <div className="bg-blue-45">
      <div className="flex items-center px-2 py-0.5">
        <div className="hidden sm:block w-36 text-sm font-medium text-gray-700">Updates</div>
        <div className="overflow-hidden flex-1">
          {prefersReduced ? (
            <div className="flex items-center gap-4 ml-3">
              {combined.map((text, i) => (
                <button key={i}
                  onClick={(e) => handleNavigate(e, text)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(e, text); }}
                  className="mr-6 text-gray-800 text-sm font-medium cursor-pointer text-left focus:outline-none"
                  aria-label={`View placements for ${text}`}
                >
                  {text}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-block animate-marquee ml-3" aria-live="polite">
              {combined.map((text, i) => (
                <button key={i}
                  onClick={(e) => handleNavigate(e, text)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(e, text); }}
                  className="mr-8 text-gray-800 text-sm font-medium cursor-pointer focus:outline-none inline-block"
                  aria-label={`View placements for ${text}`}
                >
                  {text}
                </button>
              ))}
              {combined.map((text, i) => (
                <button key={i + 100}
                  onClick={(e) => handleNavigate(e, text)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(e, text); }}
                  className="mr-8 text-gray-800 text-sm font-medium cursor-pointer focus:outline-none inline-block"
                  aria-label={`View placements for ${text}`}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screen reader announcement when items change */}
      <div aria-live="polite" className="sr-only">{announcement}</div>

      {error && (
        <div className="px-2 py-1 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
};

export default HighlightTicker;
