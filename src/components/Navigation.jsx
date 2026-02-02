import React from 'react';
import { NAVIGATION_ITEMS } from '../router';

export default function Navigation({ currentPage, onNavigate, fragmentCount }) {
  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              ARCHIA
            </div>
            {fragmentCount > 0 && (
              <span className="px-2 py-1 bg-amber-500/20 border border-amber-500 rounded-full text-xs text-amber-500">
                {fragmentCount}
              </span>
            )}
          </div>

          {/* Navigation items */}
          <div className="flex items-center space-x-6">
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentPage === item.id 
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
