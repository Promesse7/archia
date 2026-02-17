import React from 'react';
import { cn } from '../../utils/cn';

export function CategoryTabs({ categories, activeCategory, onCategoryChange, className }) {
  return (
    <div className={cn("flex border-b border-zinc-800 bg-zinc-900/30", className)}>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
            activeCategory === category
              ? "text-amber-400 border-amber-600 bg-zinc-800/50"
              : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/30"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
