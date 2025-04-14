// recognizer.js
// Uses a simple classifier based on the Quick, Draw! dataset for demo purposes.
// For production, you can train your own Teachable Machine or custom model.
import * as tf from '@tensorflow/tfjs';

// For demo, we'll use a simple heuristic classifier for a few shapes (pen, C, lightbulb)
// since loading a full QuickDraw model is too large for most web use.
// This is a stub. You can replace with a real model later.

export const KNOWN_CLASSES = [
  { key: 'pen', label: 'Pen', hint: 'Draw a pen ✏️ to reveal Copywriting' },
  { key: 'c', label: 'C', hint: 'Draw a C to reveal Copywriting' },
  { key: 'lightbulb', label: 'Lightbulb', hint: 'Draw a lightbulb 💡 to reveal Ideation' },
  { key: 'star', label: 'Star', hint: 'Draw a star ⭐ to reveal Design' }
];

// Simple stub recognizer based on path heuristics
export function recognizeSketch(paths) {
  if (!paths || !paths.length) return null;
  const centroid = getCentroid(paths);
  // If the user draws a "C" shape (open arc)
  const arc = isOpenArc(paths);
  if (arc) return { key: 'c', centroid };
  // If the user draws a star (5 spikes)
  if (isStar(paths)) return { key: 'star', centroid };
  // If the user draws a long, thin shape (pen)
  if (isPen(paths)) return { key: 'pen', centroid };
  // If the user draws a bulb (circle + line)
  if (isLightbulb(paths)) return { key: 'lightbulb', centroid };
  return null;
}

function getCentroid(paths) {
  let x = 0, y = 0, n = 0;
  for (const path of paths) {
    for (const pt of path) {
      x += pt.x;
      y += pt.y;
      n++;
    }
  }
  return n ? { x: x / n, y: y / n } : { x: 0, y: 0 };
}


function isOpenArc(paths) {
  // Detects a single path that's a large arc (C)
  const path = paths[paths.length-1];
  if (!path || path.length < 10) return false;
  const x0 = path[0].x, y0 = path[0].y;
  const xn = path[path.length-1].x, yn = path[path.length-1].y;
  // Endpoints not close (open), but arc covers a large angle
  const dist = Math.hypot(xn-x0, yn-y0);
  const bbox = getBoundingBox(path);
  const arcLen = getPathLength(path);
  return dist > bbox.width/2 && arcLen > bbox.width*1.8 && bbox.width > bbox.height*0.8;
}
function isPen(paths) {
  // Looks for a long, thin stroke
  const path = paths[paths.length-1];
  if (!path || path.length < 8) return false;
  const bbox = getBoundingBox(path);
  return bbox.height > bbox.width*2 && bbox.height > 60;
}
function isLightbulb(paths) {
  // Looks for a circle + line (2 paths)
  if (paths.length < 2) return false;
  const p1 = paths[paths.length-2];
  const p2 = paths[paths.length-1];
  return isCircle(p1) && isLine(p2);
}
function isStar(paths) {
  // Looks for a spiky path
  const path = paths[paths.length-1];
  if (!path || path.length < 15) return false;
  // Count sharp angles
  let spikes = 0;
  for (let i=2; i<path.length-2; i++) {
    const a = angle(path[i-2], path[i-1], path[i], path[i+1], path[i+2]);
    if (a < 70) spikes++;
  }
  return spikes >= 4;
}
function isCircle(path) {
  if (!path || path.length < 10) return false;
  const x0 = path[0].x, y0 = path[0].y;
  const xn = path[path.length-1].x, yn = path[path.length-1].y;
  const dist = Math.hypot(xn-x0, yn-y0);
  const bbox = getBoundingBox(path);
  return dist < bbox.width/3 && bbox.width > 30 && bbox.height > 30 && Math.abs(bbox.width-bbox.height) < 10;
}
function isLine(path) {
  if (!path || path.length < 5) return false;
  const bbox = getBoundingBox(path);
  return bbox.height > 30 && bbox.width < 10;
}
function getBoundingBox(path) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of path) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }
  return { x: minX, y: minY, width: maxX-minX, height: maxY-minY };
}
function getPathLength(path) {
  let len = 0;
  for (let i=1; i<path.length; i++) {
    len += Math.hypot(path[i].x-path[i-1].x, path[i].y-path[i-1].y);
  }
  return len;
}
function angle(p0, p1, p2, p3, p4) {
  // Compute angle at p2
  const v1x = p2.x-p1.x, v1y = p2.y-p1.y;
  const v2x = p3.x-p2.x, v2y = p3.y-p2.y;
  const dot = v1x*v2x + v1y*v2y;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);
  return Math.acos(dot/(mag1*mag2+1e-6))*180/Math.PI;
}
