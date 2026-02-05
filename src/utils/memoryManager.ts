import { useEffect } from 'react';

// Memory management utilities for production optimization
export class MemoryManager {
  private static disposables = new Set<() => void>();
  private static observers = new Set<{ disconnect: () => void }>();
  private static timers = new Set<NodeJS.Timeout>();
  private static intervals = new Set<NodeJS.Timeout>();

  // Register disposable resources
  static registerDisposable(dispose: () => void) {
    this.disposables.add(dispose);
  }

  // Register observer for cleanup
  static registerObserver(observer: { disconnect: () => void }) {
    this.observers.add(observer);
  }

  // Register timer for cleanup
  static registerTimer(timer: NodeJS.Timeout) {
    this.timers.add(timer);
  }

  // Register interval for cleanup
  static registerInterval(interval: NodeJS.Timeout) {
    this.intervals.add(interval);
  }

  // Dispose all resources
  static disposeAll() {
    // Clear all disposables
    this.disposables.forEach(dispose => {
      try {
        dispose();
      } catch (error) {
        console.warn('Error disposing resource:', error);
      }
    });
    this.disposables.clear();

    // Disconnect all observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    this.observers.clear();

    // Clear all timers
    this.timers.forEach(timer => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.warn('Error clearing timer:', error);
      }
    });
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.warn('Error clearing interval:', error);
      }
    });
    this.intervals.clear();
  }

  // Get memory usage stats
  static getMemoryStats() {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
    return null;
  }

  // Check if memory usage is high
  static isMemoryHigh(threshold: number = 80) {
    const stats = this.getMemoryStats();
    return stats ? stats.percentage > threshold : false;
  }

  // Force garbage collection if available
  static forceGC() {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }
}

// React hook for memory management
export const useMemoryManager = () => {
  useEffect(() => {
    return () => {
      MemoryManager.disposeAll();
    };
  }, []);
};

export default MemoryManager;
