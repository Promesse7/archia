import React from 'react';
import { NAV_ITEMS } from './navConfig';

export default function BottomNav({ currentPage, onNavigate, fragmentCount = 0 }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/50 shadow-lg">
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={
                `relative flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs transition-all duration-200 ` +
                (active
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5')
              }
            >
              <div className={active ? 'text-base' : 'text-sm'}>{item.icon}</div>
              <div className={active ? 'opacity-100' : 'opacity-80'}>{item.label}</div>

              {item.id === 'gallery' && fragmentCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-semibold flex items-center justify-center">
                  {fragmentCount}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
