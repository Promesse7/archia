import React, { useState, useCallback } from 'react';
import { FragmentCard } from './FragmentCard';
import { cn } from '../../utils/cn';


export const FragmentGrid = React.forwardRef(
  ({
    fragments,
    selectedFragments,
    onSelectFragment,
    onViewFragment,
    viewMode = 'grid',
    className,
    ...props
  }, ref) => {

    const getGridClasses = () => {
      if (viewMode === 'list') return 'space-y-4';
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    };

    const handleFragmentSelect = useCallback((fragmentId) => {
      onSelectFragment(fragmentId);
    }, [onSelectFragment]);

    const handleFragmentView = useCallback((fragmentId) => {
      onViewFragment(fragmentId);
    }, [onViewFragment]);

    if (fragments.length === 0) {
      return (
        <div ref={ref} className={cn('text-center py-12', className)} {...props}>
          <div className="text-zinc-400 text-lg">No fragments captured yet</div>
          <div className="text-zinc-500 text-sm mt-2">Start by capturing some pottery fragments</div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(getGridClasses(), className)}
        role="grid"
        aria-label="Fragment gallery"
        {...props}
      >
        {fragments.map((fragment, index) => {
          const fragmentId = fragment.timestamp || fragment.id || index;
          const isSelected = selectedFragments.has(fragmentId);

          return (
            <FragmentCard
              key={fragmentId}
              fragment={fragment}
              isSelected={isSelected}
              onSelect={handleFragmentSelect}
              onView={handleFragmentView}
            />
          );
        })}
      </div>
    );
  }
);

FragmentGrid.displayName = 'FragmentGrid';

export { FragmentGrid };
