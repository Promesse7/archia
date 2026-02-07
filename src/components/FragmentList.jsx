import React from 'react';
import { Badge } from './ui';

const FragmentList = ({
  fragments,
  activeFragmentId,
  onFragmentClick
}) => {
  if (!fragments?.length) return null;

  return (
    <div className="absolute top-4 right-4 bg-zinc-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-xs max-h-[80vh] overflow-y-auto">
      <h3 className="text-sm font-semibold mb-2 text-zinc-300">Fragments</h3>
      <div className="space-y-2">
        {fragments.map((fragment) => (
          <div
            key={fragment.id || fragment.timestamp}
            onClick={() => onFragmentClick(fragment.id || fragment.timestamp)}
            className={`p-2 rounded cursor-pointer transition-colors ${(fragment.id || fragment.timestamp) === activeFragmentId
                ? 'bg-amber-600/30'
                : 'hover:bg-zinc-700/50'
              }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm truncate">
                {fragment.classification?.fragmentType || 'Fragment'} #{String(fragment.id || fragment.timestamp).slice(0, 6)}
              </span>
              <Badge variant={fragment.classification?.fragmentType || 'unknown'}>
                {fragment.classification?.fragmentType || 'Unknown'}
              </Badge>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {new Date(fragment.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FragmentList;
