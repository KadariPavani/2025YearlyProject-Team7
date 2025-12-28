import React, { useState } from 'react';
import { HiChevronUp } from 'react-icons/hi';

const BottomNav = ({ tabs = [], active, onChange = () => {}, counts = {} }) => {
  const [expanded, setExpanded] = useState(false);
  // chunk tabs into rows of 5
  const chunkSize = 5;
  const rows = [];
  for (let i = 0; i < tabs.length; i += chunkSize) rows.push(tabs.slice(i, i + chunkSize));
  const firstRow = rows[0] || [];
  const remainingRows = rows.slice(1);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-white text-blue-600 rounded-t-3xl shadow-2xl z-40 overflow-hidden transition-all duration-500 ease-in-out border-t border-blue-200`}
      style={{ height: expanded ? 'auto' : '96px', willChange: 'height, transform' }}
    >
      {/* top handle like the sheet modal */}
      <div className="absolute inset-x-0 top-0 flex justify-center pt-2 pointer-events-none">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
      </div>

      <div className={`max-w-3xl mx-auto px-4 h-full flex flex-col`}>
        <div className="w-full flex items-center justify-around h-20 relative">
          {firstRow.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onChange(tab.id); setExpanded(false); }}
                aria-pressed={isActive}
                aria-label={tab.label}
                title={tab.label}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-500 ease-in-out transform ${isActive ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-transparent text-blue-600 hover:scale-105'}`} style={{ willChange: 'transform' }}
              >
                <Icon className={`h-5 w-5`} />
              </button>
            );
          })}

          {remainingRows.length > 0 && (
            <button
              onClick={() => setExpanded((s) => !s)}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              className="flex items-center justify-center w-11 h-11 text-blue-600 transition-colors transform-gpu hover:text-blue-700 z-50"
            >
              <HiChevronUp
                className="h-5 w-5 text-current transition-transform duration-500 ease-in-out"
                style={{
                  transform: expanded ? 'translateZ(0) rotate(180deg)' : 'translateZ(0) rotate(0deg)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform',
                  transformOrigin: 'center'
                }}
              />
            </button>
          )} 
        </div>

        <div
          className={`mt-2 w-full transition-all duration-500 ease-in-out ${expanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}
          style={{
            maxHeight: expanded ? `${remainingRows.length * 84 + 20}px` : 0,
            overflowY: 'hidden',
            willChange: 'max-height, opacity, transform'
          }}
        >
          {/* Render remaining tabs in rows of up to 5 icons */}
          <div className="w-full py-2">
            {remainingRows.map((row, rIdx) => (
              <div key={rIdx} className="w-full flex items-center justify-around py-1">
                {row.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = active === tab.id;
                  return (
                    <div key={tab.id} className="flex items-center justify-center w-1/5 px-2">
                      <button
                        onClick={() => { onChange(tab.id); setExpanded(false); }}
                        aria-pressed={isActive}
                        aria-label={tab.label}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-500 ease-in-out transform ${isActive ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-transparent text-blue-600 hover:scale-105 hover:bg-gray-50'}`} style={{ willChange: 'transform' }}>
                        <Icon className={`h-5 w-5`} />
                      </button>
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
