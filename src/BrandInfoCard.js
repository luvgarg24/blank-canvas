import React, { useRef, useState } from 'react';
import './BrandInfoCard.css';

export default function BrandInfoCard({ info, x, y, onClose, draggable, onDrag, isEraserActive, onErase }) {
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  function handleDragStart(e) {
    if (isEraserActive) return;
    setDragging(true);
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    offset.current = { x: startX - x, y: startY - y };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
  }
  function handleDragMove(e) {
    if (!dragging) return;
    const moveX = e.touches ? e.touches[0].clientX : e.clientX;
    const moveY = e.touches ? e.touches[0].clientY : e.clientY;
    onDrag && onDrag(moveX - offset.current.x, moveY - offset.current.y);
  }
  function handleDragEnd() {
    setDragging(false);
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
  }
  return (
    <div
      className="brand-info-card"
      style={{ left: x, top: y, borderColor: info.color, cursor: isEraserActive ? 'url("/eraser-cursor.svg"), pointer' : draggable ? 'grab' : 'default' }}
      draggable={draggable}
      onMouseDown={draggable ? e => handleDragStart(e) : undefined}
      onTouchStart={draggable ? e => handleDragStart(e) : undefined}
      onClick={isEraserActive ? (e => { e.stopPropagation(); onErase && onErase(); }) : undefined}
    >
      <button className="close-btn" onClick={onClose} title="Close">×</button>
      <div className="brand-info-title" style={{ color: info.color }}>{info.title}</div>
      <div className="brand-info-content">
        {info.img && <img src={info.img} alt={info.title} className="brand-info-img" />}
        <div className="brand-info-text">{info.text}</div>
        {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="brand-info-link">See more</a>}
      </div>
    </div>
  );
}
