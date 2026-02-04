import React, { useEffect, useState } from 'react';

export default function ScreenContainer({ screenKey, children }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [screenKey]);

  return (
    <div className="relative min-h-screen">
      <div
        key={screenKey}
        className={
          `transition-all duration-300 ease-out will-change-transform ` +
          (entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
        }
      >
        {children}
      </div>
    </div>
  );
}
