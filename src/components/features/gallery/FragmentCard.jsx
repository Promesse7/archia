import React, { useState, useCallback } from 'react';
import { Card, CardContent, Button, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface FragmentCardProps {
  fragment: any;
  isSelected: boolean;
  onSelect: (fragmentId: string) => void;
  onView: (fragmentId: string) => void;
  className?: string;
}

export const FragmentCard = React.forwardRef<HTMLDivElement, FragmentCardProps>(
  ({ fragment, isSelected, onSelect, onView, className, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const fragmentId = fragment.timestamp || fragment.id;
    const confidence = fragment.classification?.confidence || 0;
    const fragmentType = fragment.classification?.fragmentType || 'Unknown';
    const pointCount = fragment.pointCloud?.length || 0;
    
    const handleClick = useCallback(() => {
      onSelect(fragmentId);
    }, [fragmentId, onSelect]);
    
    const handleView = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onView(fragmentId);
    }, [fragmentId, onView]);
    
    const getVariantColor = (type: string) => {
      const variants = {
        rim: 'success',
        body: 'info',
        base: 'warning',
        unknown: 'neutral'
      };
      return variants[type] || variants.unknown;
    };
    
    return (
      <Card
        ref={ref}
        className={cn(
          'cursor-pointer transition-all duration-300 transform',
          isSelected 
            ? 'ring-2 ring-amber-500/50 border-amber-500/50 scale-105' 
            : 'border-zinc-700/50 hover:border-amber-500/30 hover:scale-[1.02] hover:-translate-y-1',
          isHovered && !isSelected && 'scale-[1.03] -translate-y-2',
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <CardContent className="p-0">
          {/* Fragment Image */}
          <div className="relative aspect-square bg-zinc-950 overflow-hidden">
            <img
              src={fragment.image}
              alt={`Fragment ${fragmentType}`}
              className="w-full h-full object-cover"
            />
            
            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            {/* Hover Overlay */}
            {isHovered && (
              <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm flex items-center justify-center">
                <div className="text-amber-400 text-sm font-medium">
                  {isSelected ? 'Deselect' : 'Select'}
                </div>
              </div>
            )}
          </div>
          
          {/* Fragment Info */}
          <div className="p-4 space-y-3">
            {/* Classification Badge */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={getVariantColor(fragmentType)}
                size="sm"
              >
                {fragmentType}
              </Badge>
              
              <div className="text-xs text-zinc-500">
                {(confidence * 100).toFixed(1)}%
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Points:</span>
                <span className="text-white font-medium">
                  {pointCount}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-zinc-500">Captured:</span>
                <span className="text-white font-medium text-xs">
                  {new Date(fragment.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleClick}
              >
                {isSelected ? 'Selected' : 'Select'}
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleView}
              >
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

FragmentCard.displayName = 'FragmentCard';

export { FragmentCard };
