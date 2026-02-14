import React, { useState, useRef, useLayoutEffect } from 'react';
import { HiChevronUp } from 'react-icons/hi';

const TabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={tab.label}
      className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'bg-transparent text-gray-500'
        }`}
        style={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span
        className={`text-[10px] leading-tight truncate max-w-[60px] text-center ${
          isActive ? 'text-blue-600 font-semibold' : 'text-gray-400 font-medium'
        }`}
        style={{ transition: 'color 0.3s ease' }}
      >
        {tab.label}
      </span>
    </button>
  );
};

const MAX_PER_ROW = 4;

const BottomNav = ({ tabs = [], active, onChange = () => {} }) => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  // if all tabs fit in one row (<=MAX_PER_ROW), show them all; otherwise reserve last slot for More
  const hasMore = tabs.length > MAX_PER_ROW;
  const firstRow = hasMore ? tabs.slice(0, MAX_PER_ROW) : tabs;
  const remaining = hasMore ? tabs.slice(MAX_PER_ROW) : [];

  const extraRows = [];
  for (let i = 0; i < remaining.length; i += MAX_PER_ROW) {
    extraRows.push(remaining.slice(i, i + MAX_PER_ROW));
  }

  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [tabs]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-40 border-t border-gray-100">
      {/* drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-8 h-1 bg-gray-200 rounded-full" />
      </div>

      <div className="mx-auto px-3">
        {/* First row */}
        <div className="flex items-start pb-2">
          {firstRow.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={active === tab.id}
              onClick={() => { onChange(tab.id); setExpanded(false); }}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded((s) => !s)}
              aria-label={expanded ? 'Show less' : 'Show more'}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500">
                <HiChevronUp
                  className="h-5 w-5"
                  style={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
              <span className="text-[10px] leading-tight text-gray-400 font-medium">
                {expanded ? 'Less' : 'More'}
              </span>
            </button>
          )}
        </div>

        {/* Expanded rows */}
        {hasMore && (
          <div
            style={{
              height: expanded ? `${contentHeight}px` : '0px',
              opacity: expanded ? 1 : 0,
              transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
              overflow: 'hidden',
            }}
          >
            <div ref={contentRef} className="pt-2 pb-3">
              {extraRows.map((row, rIdx) => (
                <div key={rIdx} className="flex items-start py-1">
                  {row.map((tab) => (
                    <TabButton
                      key={tab.id}
                      tab={tab}
                      isActive={active === tab.id}
                      onClick={() => { onChange(tab.id); setExpanded(false); }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
