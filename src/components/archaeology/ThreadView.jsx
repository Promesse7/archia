import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export function ThreadView({ thread, experts, onMeshHighlight }) {
  const [hoveredMessage, setHoveredMessage] = useState(null);

  const handleMessageHover = (message, isHovering) => {
    setHoveredMessage(isHovering ? message.id : null);
    if (message.meshReferences && message.meshReferences.length > 0) {
      onMeshHighlight(isHovering ? message.meshReferences : []);
    }
  };

  const getRoleStyles = (role, verified) => {
    switch (role) {
      case 'Archaeologist':
        return {
          container: 'border-amber-700/30 bg-amber-900/10',
          header: 'text-amber-400',
          badge: 'bg-amber-600 text-white',
          glow: verified ? 'shadow-lg shadow-amber-600/20' : ''
        };
      case 'AI':
        return {
          container: 'border-cyan-700/30 bg-cyan-900/10',
          header: 'text-cyan-400',
          badge: 'bg-cyan-600 text-white',
          glow: ''
        };
      default:
        return {
          container: 'border-zinc-700 bg-zinc-900/30',
          header: 'text-zinc-300',
          badge: 'bg-zinc-600 text-white',
          glow: ''
        };
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp; // Already formatted in mock data
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-4">
        {thread.messages.map((message) => {
          const styles = getRoleStyles(message.role, message.verified);
          const expert = experts.find(e => e.name === message.user);

          return (
            <div
              key={message.id}
              onMouseEnter={() => handleMessageHover(message, true)}
              onMouseLeave={() => handleMessageHover(message, false)}
              className={cn(
                "relative p-4 rounded-lg border transition-all duration-200",
                styles.container,
                styles.glow,
                hoveredMessage === message.id && "ring-2 ring-zinc-600"
              )}
            >
              {/* Message Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    styles.badge
                  )}>
                    {message.user.charAt(0)}
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", styles.header)}>
                        {message.user}
                      </span>

                      {/* Role Badge */}
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        styles.badge
                      )}>
                        {message.role}
                      </span>

                      {/* Verification Badge */}
                      {message.verified && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Expert Details */}
                    {expert && (
                      <div className="text-xs text-zinc-500">
                        {expert.institution} • {expert.reputation} rep • {expert.publications} pubs
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-zinc-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>

              {/* Message Content */}
              <div className="text-zinc-100 leading-relaxed mb-3">
                {message.content}
              </div>

              {/* Confidence Score (for experts and AI) */}
              {message.confidence > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">Confidence:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 bg-zinc-700 rounded-full h-2">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          message.confidence >= 90 ? "bg-green-500" :
                            message.confidence >= 75 ? "bg-amber-500" :
                              "bg-red-500"
                        )}
                        style={{ width: `${message.confidence}%` }}
                      />
                    </div>
                    <span className={cn(
                      "font-medium",
                      message.confidence >= 90 ? "text-green-400" :
                        message.confidence >= 75 ? "text-amber-400" :
                          "text-red-400"
                    )}>
                      {message.confidence}%
                    </span>
                  </div>
                </div>
              )}

              {/* Mesh References */}
              {message.meshReferences && message.meshReferences.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-700">
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 0004zM10 4a2 2 0 100-4 2 2 0 0004zm0 14a2 2 0 100-4 2 2 0 0004z" />
                    </svg>
                    References mesh regions:
                    {message.meshReferences.map((ref, idx) => (
                      <span key={ref} className="px-2 py-0.5 bg-amber-900/30 rounded">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interaction Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-700">
                <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Reply
                </button>
                {message.role !== 'AI' && (
                  <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Ask AI
                  </button>
                )}
                {(message.role === 'Archaeologist' || message.verified) && (
                  <button className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                    Mark Authoritative
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
