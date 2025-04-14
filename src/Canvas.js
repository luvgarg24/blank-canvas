import React, { useRef, useEffect, useState } from 'react';
import './Canvas.css';
import { recognizeSketch } from './recognizer';
import HintOverlay from './HintOverlay';

// Dotted background generator
function DottedBackground({ dotSpacing = 32, dotRadius = 1.2, color = '#bbb' }) {
  return (
    <svg className="dotted-bg" width="100%" height="100%">
      <defs>
        <pattern id="dots" x="0" y="0" width={dotSpacing} height={dotSpacing} patternUnits="userSpaceOnUse">
          <circle cx={dotSpacing/2} cy={dotSpacing/2} r={dotRadius} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

// Main drawing canvas
export default function Canvas({ onSectionReveal, isEraserActive, onErasePopup, onEraseStroke, onHandwritingFallback }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [allPaths, setAllPaths] = useState([]); // All finished paths for multi-stroke
  const [currentPath, setCurrentPath] = useState([]);
  const [showHint, setShowHint] = useState(true);

  // Listen for Enter/Space for finish
  useEffect(() => {
    function handleKey(e) {
      if ((e.key === 'Enter' || e.key === ' ') && allPaths.length > 0 && !drawing) {
        finishDrawing();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [allPaths, drawing]);

  // Resize canvas to fill window
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Set canvas width/height to match its display size and devicePixelRatio
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw paths
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    [...allPaths, currentPath].forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });
  }, [allPaths, currentPath]);

  // Mouse/touch handlers
  const startDrawing = e => {
    if (isEraserActive) {
      eraseAt(e);
      setDrawing(true);
      return;
    }
    setDrawing(true);
    const pos = getPos(e);
    setCurrentPath([pos]);
  };
  const draw = e => {
    if (!drawing) return;
    if (isEraserActive) {
      eraseAt(e);
      return;
    }
    const pos = getPos(e);
    setCurrentPath(path => [...path, pos]);
  };
  const endDrawing = () => {
    if (!isEraserActive && currentPath.length > 1) {
      setAllPaths(paths => [...paths, currentPath]);
    }
    setCurrentPath([]);
    setDrawing(false);
  };

  function finishDrawing() {
    if (allPaths.length === 0) return;
    const result = recognizeSketch(allPaths);
    if (result && onSectionReveal) {
      setShowHint(false);
      onSectionReveal(result.key, result.centroid);
    } else if (allPaths.length > 2 && typeof onHandwritingFallback === 'function') {
      // More than 2 strokes, likely handwriting: ask for brand name
      onHandwritingFallback(allPaths);
      setShowHint(false);
    } else {
      setShowHint(true);
    }
    setAllPaths([]);
    setCurrentPath([]);
  }

  function handleClear() {
    setAllPaths([]);
    setCurrentPath([]);
    setShowHint(true);
  }

  function eraseAt(e) {
    const pos = getPos(e);
    // Erase any stroke near the pointer
    setAllPaths(paths => {
      let erased = false;
      const newPaths = paths.filter((path, idx) => {
        if (erased) return true;
        for (const pt of path) {
          if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < 18) {
            erased = true;
            if (onEraseStroke) onEraseStroke(idx);
            return false;
          }
        }
        return true;
      });
      return newPaths;
    });
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }

  return (
    <div className="canvas-wrapper">
      <DottedBackground />
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{ cursor: isEraserActive ? 'url("/eraser-cursor.svg"), pointer' : 'url("/pencil-cursor.svg"), crosshair', border: '2px solid red' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      {allPaths.length > 0 && !drawing && (
        <div style={{ position: 'fixed', left: 40, bottom: 40, zIndex: 120, display: 'flex', gap: 12 }}>
          <button
            onClick={finishDrawing}
            style={{ fontSize: '1.1rem', padding: '0.7em 2.2em', borderRadius: '2em', border: '2px solid #2d6be6', background: '#fff', color: '#2d6be6', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1.5px 8px 0 rgba(0,0,0,0.04)' }}
          >
            Finish Drawing (⏎/Space)
          </button>
          <button
            onClick={handleClear}
            style={{ fontSize: '1.1rem', padding: '0.7em 2.2em', borderRadius: '2em', border: '2px solid #bbb', background: '#fff', color: '#888', fontWeight: 700, cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      )}
      <HintOverlay visible={showHint} />
    </div>
  );
}

