import React, { useRef, useState } from 'react';
import './SectionCard.css';

export default function SectionCard({ section, x, y, onClose, draggable, onDrag, isEraserActive, onErase }) {
  const [expanded, setExpanded] = useState(false);
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
      className={`section-card${expanded ? ' expanded' : ''}`}
      style={{ left: x, top: y, borderColor: section.color, cursor: isEraserActive ? 'url("/eraser-cursor.svg"), pointer' : draggable ? 'grab' : 'default' }}
      draggable={draggable}
      onMouseDown={draggable ? e => handleDragStart(e) : undefined}
      onTouchStart={draggable ? e => handleDragStart(e) : undefined}
      onClick={isEraserActive ? (e => { e.stopPropagation(); onErase && onErase(); }) : undefined}
    >
      <button className="close-btn" onClick={onClose} title="Close">×</button>
      <button className="expand-btn" onClick={() => setExpanded(e => !e)} title={expanded ? 'Collapse' : 'Expand'}>
        {expanded ? '−' : '+'}
      </button>
      <span className="section-card-icon" style={{ color: section.color }}>{section.icon}</span>
      <h3 style={{ color: section.color }}>{section.title}</h3>
      <div className="section-card-content">
        {section.projects ? (
          <div className="project-list">
            {section.projects.map((p, i) => (
              <div className="project-thumb" key={i}>
                {p.img && <img src={p.img} alt={p.title} />}
                <div className="project-info">
                  <div className="project-title">{p.title}</div>
                  <div className="project-desc">{p.desc}</div>
                  {expanded && p.mockDetails && (
                    <div className="project-details">
                      <div className="mock-video">
                        <img src={p.mockDetails.img} alt="mock video" />
                        <span className="mock-video-label">{p.mockDetails.label}</span>
                      </div>
                      <div className="mock-extra">{p.mockDetails.extra}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>{section.desc}</p>
        )}
        {expanded && section.mockExtra && (
          <div className="section-extra">
            {section.mockExtra}
          </div>
        )}
      </div>
    </div>
  );
}
