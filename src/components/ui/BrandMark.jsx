import React from 'react';
import PropTypes from 'prop-types';

export const BrandMark = ({
  variant = 'default',
  className = '',
  showTagline = false,
  position = 'inline' // New prop for positioning
}) => {

  const baseClasses =
    'relative inline-flex flex-col select-none font-semibold uppercase tracking-[0.35em]';

  const variants = {
    default:
      'text-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent',

    minimal:
      'text-lg text-amber-500/70 tracking-[0.25em]',

    viewer:
      'text-sm text-amber-400/60 tracking-[0.3em]',

    watermark:
      'text-[10rem] text-white/5 tracking-[0.4em] pointer-events-none',

    footer:
      'text-sm text-amber-500/30 tracking-[0.2em] pointer-events-none'
  };

  const taglineStyles =
    'text-[10px] tracking-[0.2em] text-zinc-400/70 font-normal mt-2';

  // Position classes for different layouts
  const positionClasses = {
    inline: '', // Default inline behavior
    footer: 'fixed bottom-4 right-4 z-10', // Bottom right corner
    'bottom-left': 'fixed bottom-4 left-4 z-10',
    'bottom-right': 'fixed bottom-4 right-4 z-10'
  };

  const getPositionClasses = () => {
    if (position === 'inline') return '';
    return positionClasses[position] || positionClasses.footer;
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className} ${getPositionClasses()}`}>

      {/* Brand text */}
      <span className="relative">
        ARCHIA - Made with LOVE by Team APEX 2026
      </span>

      {/* Elegant underline accent */}
      {variant !== 'watermark' && variant !== 'footer' && (
        <span className="mt-2 h-[1px] w-2/3 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      )}

      {showTagline && variant !== 'watermark' && (
        <span className={taglineStyles}>
          Archaeological Intelligence
        </span>
      )}

      {/* Footer-specific styling */}
      {variant === 'footer' && (
        <span className="text-xs text-amber-400/20 mt-1 text-center">
          Archaeological Intelligence 2026
        </span>
      )}
    </div>
  );
};

BrandMark.propTypes = {
  variant: PropTypes.oneOf(['default', 'minimal', 'viewer', 'watermark', 'footer']),
  className: PropTypes.string,
  showTagline: PropTypes.bool,
  position: PropTypes.oneOf(['inline', 'footer', 'bottom-left', 'bottom-right'])
};

export default BrandMark;
