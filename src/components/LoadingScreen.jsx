import React from 'react';

export default function LoadingScreen({ progress, stage, error }) {
  const percentage = Math.min(100, Math.max(0, progress));
  
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1a1a1a",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
      padding: "20px"
    }}>
      {/* Pottery Icon with Animation */}
      <div style={{
        fontSize: "5em",
        marginBottom: "30px",
        animation: "float 3s ease-in-out infinite"
      }}>
        🏺
      </div>
      
      {/* Title */}
      <h2 style={{ 
        margin: "0 0 8px 0",
        fontSize: "2em",
        background: "linear-gradient(45deg, #c2a070, #8b6f47)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text"
      }}>
        Loading ARCHIA
      </h2>
      
      {/* Stage Description */}
      <p style={{ 
        color: "#aaa", 
        fontSize: "1em",
        marginBottom: "30px",
        textAlign: "center",
        maxWidth: "500px",
        minHeight: "24px"
      }}>
        {stage || "Initializing..."}
      </p>

      {/* Progress Bar Container */}
      <div style={{
        width: "400px",
        maxWidth: "90vw",
        height: "8px",
        backgroundColor: "#333",
        borderRadius: "4px",
        overflow: "hidden",
        marginBottom: "16px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
      }}>
        {/* Progress Bar Fill */}
        <div style={{
          width: `${percentage}%`,
          height: "100%",
          background: error 
            ? "linear-gradient(90deg, #ff6b6b, #ff4444)"
            : "linear-gradient(90deg, #c2a070, #8b6f47)",
          transition: "width 0.3s ease-out",
          boxShadow: "0 0 10px rgba(194, 160, 112, 0.5)"
        }} />
      </div>

      {/* Percentage Display */}
      <div style={{
        fontSize: "1.5em",
        fontWeight: "bold",
        marginBottom: "20px",
        color: error ? "#ff6b6b" : "#c2a070",
        fontVariant: "tabular-nums"
      }}>
        {percentage.toFixed(0)}%
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: "rgba(255, 107, 107, 0.1)",
          border: "1px solid rgba(255, 107, 107, 0.3)",
          borderRadius: "8px",
          padding: "16px",
          maxWidth: "500px",
          marginTop: "20px",
          color: "#ff6b6b"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading Stages Indicator */}
      {!error && (
        <div style={{
          marginTop: "30px",
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}>
          {['TensorFlow', 'Depth', 'MobileNet', 'Classifier'].map((label, idx) => {
            const stageProgress = (percentage / 100) * 4;
            const isComplete = stageProgress > idx + 1;
            const isCurrent = stageProgress > idx && stageProgress <= idx + 1;
            
            return (
              <div key={label} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: isComplete ? "#c2a070" : isCurrent ? "#8b6f47" : "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2em",
                  transition: "all 0.3s ease",
                  transform: isCurrent ? "scale(1.1)" : "scale(1)",
                  boxShadow: isCurrent ? "0 0 15px rgba(194, 160, 112, 0.6)" : "none"
                }}>
                  {isComplete ? "✓" : isCurrent ? "○" : "○"}
                </div>
                <div style={{
                  fontSize: "0.7em",
                  color: isComplete ? "#c2a070" : isCurrent ? "#aaa" : "#555",
                  textAlign: "center",
                  maxWidth: "60px"
                }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      {!error && percentage < 50 && (
        <div style={{
          marginTop: "40px",
          color: "#666",
          fontSize: "0.85em",
          textAlign: "center",
          maxWidth: "400px",
          fontStyle: "italic"
        }}>
          💡 First load may take 30-60 seconds on slower connections.<br />
          Subsequent loads will be instant (cached).
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}