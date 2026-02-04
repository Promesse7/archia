import React from 'react';
import BottomNav from './navigation/BottomNav';
import ScreenContainer from './motion/ScreenContainer';

export default function AppShell({ currentPage, onNavigate, fragmentCount, children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="min-h-screen pb-24">
        <ScreenContainer screenKey={currentPage}>{children}</ScreenContainer>
      </div>

      <BottomNav
        currentPage={currentPage}
        onNavigate={onNavigate}
        fragmentCount={fragmentCount}
      />
    </div>
  );
}
