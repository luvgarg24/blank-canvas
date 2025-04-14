import React, { useEffect, useState } from 'react';
import { KNOWN_CLASSES } from './recognizer';
import './HintOverlay.css';

const HINT_INTERVAL = 5000;

export default function HintOverlay({ visible }) {
  const [hintIdx, setHintIdx] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setHintIdx(idx => (idx + 1) % KNOWN_CLASSES.length);
    }, HINT_INTERVAL);
    return () => clearInterval(timer);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="hint-overlay">
      <div className="hint-text">{KNOWN_CLASSES[hintIdx].hint}</div>
    </div>
  );
}
