import React from 'react';
import { cn } from '../../utils/cn';

export function ThreadList({ threads, selectedThread, onThreadSelect }) {
  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      {threads.map((thread) => (
        <div
          key={thread.id}
          onClick={() => onThreadSelect(thread)}
          className={cn(
            "p-4 rounded-lg border cursor-pointer transition-all duration-200",
            selectedThread?.id === thread.id
              ? "bg-zinc-800 border-amber-600 shadow-lg shadow-amber-900/20"
              : "bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
          )}
        >
          {/* Thread Title */}
          <h3 className="font-medium text-white mb-2 text-sm leading-tight">
            {thread.title}
          </h3>

          {/* Thread Meta */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                thread.status === 'Under Review'
                  ? "bg-amber-900/40 text-amber-400"
                  : thread.status === 'Resolved'
                    ? "bg-green-900/40 text-green-400"
                    : "bg-blue-900/40 text-blue-400"
              )}>
                {thread.status}
              </span>

              {/* Category */}
              <span className="text-xs text-zinc-500">
                {thread.category}
              </span>
            </div>

            {/* Message Count */}
            <span className="text-xs text-zinc-500">
              {thread.messages.length} messages
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-zinc-800 text-xs text-zinc-300 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Last activity: {thread.messages[thread.messages.length - 1]?.timestamp}</span>
            <div className="flex items-center gap-1">
              {/* Expert Participants */}
              {thread.messages
                .filter(msg => msg.role === 'Archaeologist')
                .slice(0, 2)
                .map((msg, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-xs font-medium text-white"
                    title={msg.user}
                  >
                    {msg.user.charAt(0)}
                  </div>
                ))}
              {thread.messages.filter(msg => msg.role === 'Archaeologist').length > 2 && (
                <span className="text-zinc-500">+{thread.messages.filter(msg => msg.role === 'Archaeologist').length - 2}</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {threads.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-sm">No discussions in this category yet</p>
          <p className="text-xs mt-1">Start a new discussion thread</p>
        </div>
      )}
    </div>
  );
}
