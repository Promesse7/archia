import React from 'react';

const AppShell = ({ children, className, ...props }) => {
  return (
    <div
      className={`
        min-h-screen bg-zinc-50
        ${className}
      `}
      {...props}
    >
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {children}
      </div>
    </div>
  );
};

const TopBar = ({ children, className, ...props }) => {
  return (
    <header
      className={`
        border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60
        ${className}
      `}
      {...props}
    >
      <div className="container mx-auto max-w-7xl px-4 py-4">
        {children}
      </div>
    </header>
  );
};

const MainContent = ({ children, className, ...props }) => {
  return (
    <main
      className={`
        grid grid-cols-1 lg:grid-cols-3 gap-6 py-6
        ${className}
      `}
      {...props}
    >
      {children}
    </main>
  );
};

const LeftPanel = ({ children, className, ...props }) => {
  return (
    <div
      className={`
        lg:col-span-2 space-y-6
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const RightPanel = ({ children, className, ...props }) => {
  return (
    <div
      className={`
        space-y-6
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const ReconstructionSection = ({ children, className, ...props }) => {
  return (
    <section
      className={`
        py-6
        ${className}
      `}
      {...props}
    >
      {children}
    </section>
  );
};

const GallerySection = ({ children, className, ...props }) => {
  return (
    <section
      className={`
        py-6
        ${className}
      `}
      {...props}
    >
      {children}
    </section>
  );
};

export {
  AppShell,
  TopBar,
  MainContent,
  LeftPanel,
  RightPanel,
  ReconstructionSection,
  GallerySection,
};
