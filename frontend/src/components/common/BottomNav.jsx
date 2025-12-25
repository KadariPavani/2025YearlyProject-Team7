import React, { useState } from 'react';
import { HiChevronUp } from 'react-icons/hi';

const BottomNav = ({ tabs = [], active, onChange = () => {} }) => {
  const [expanded, setExpanded] = useState(false);
  // chunk tabs into rows of 5
  const chunkSize = 5;
  const rows = [];
  for (let i = 0; i < tabs.length; i += chunkSize) rows.push(tabs.slice(i, i + chunkSize));
  const firstRow = rows[0] || [];
  const remainingRows = rows.slice(1);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-t-3xl shadow-2xl z-40 overflow-hidden transition-all duration-300 ease-out border-t border-blue-400`}
      style={{ height: expanded ? 'auto' : '72px' }}
    >
      <div className={`max-w-3xl mx-auto px-4 h-full flex flex-col`}>
        <div className="w-full flex items-center justify-around h-16">
          {firstRow.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onChange(tab.id); setExpanded(false); }}
                aria-label={tab.label}
                title={tab.label}
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-md transition-all transform-gpu ${isActive ? 'bg-blue-200/30 text-white scale-105 shadow-md' : 'text-white/80 hover:bg-blue-200/10'}`}>
                <Icon className={`h-4 w-4 antialiased text-white`} style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: 'transform' }} />
              </button>
            );
          })}

          {remainingRows.length > 0 && (
            <button
              onClick={() => setExpanded((s) => !s)}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              className="flex items-center justify-center w-9 h-9 text-white transition-colors transform-gpu hover:text-white/90 z-50"
            >
              <HiChevronUp
                className="h-5 w-5 text-white transition-transform"
                style={{
                  transform: expanded ? 'translateZ(0) rotate(180deg)' : 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform',
                  transformOrigin: 'center'
                }}
              />
            </button>
          )} 
        </div>

        <div
          className={`mt-2 w-full transition-all ${expanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          style={{
            maxHeight: expanded ? 'none' : 0,
            overflowY: expanded ? 'visible' : 'hidden'
          }}
        >
          <div className="w-full space-y-2">
            {remainingRows.map((row, idx) => (
              <div key={idx} className="w-full flex items-center justify-around">
                {row.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = active === tab.id;
                  return (
                    <div key={tab.id} className="flex flex-col items-center">
                      <button
                        onClick={() => { onChange(tab.id); setExpanded(false); }}
                        aria-label={tab.label}
                        className={`flex items-center justify-center w-10 h-10 rounded-md transition-all transform-gpu ${isActive ? 'bg-blue-200/30 text-white' : 'text-white/80 hover:bg-blue-200/10'}`}>
                        <Icon className={`h-4 w-4 antialiased text-white`} style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: 'transform' }} />
                      </button>
                      <div className="mt-1 h-3" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
