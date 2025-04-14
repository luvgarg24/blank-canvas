import { GOOGLE_VISION_API_KEY } from './visionConfig';

// Convert array of paths (strokes) to image data URL
export function strokesToDataURL(paths, width = 400, height = 120) {
  // Fit all points to the canvas
  const allPoints = paths.flat();
  if (allPoints.length === 0) return null;
  const minX = Math.min(...allPoints.map(pt => pt.x));
  const minY = Math.min(...allPoints.map(pt => pt.y));
  const maxX = Math.max(...allPoints.map(pt => pt.x));
  const maxY = Math.max(...allPoints.map(pt => pt.y));
  const pad = 10;
  const scale = Math.min(
    (width - 2 * pad) / (maxX - minX || 1),
    (height - 2 * pad) / (maxY - minY || 1)
  );

  // Draw to offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  for (const path of paths) {
    if (path.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(
      pad + (path[0].x - minX) * scale,
      pad + (path[0].y - minY) * scale
    );
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(
        pad + (path[i].x - minX) * scale,
        pad + (path[i].y - minY) * scale
      );
    }
    ctx.stroke();
  }
  return canvas.toDataURL('image/png');
}

// Call Google Vision API for handwriting recognition
export async function recognizeHandwritingWithVision(paths) {
  const dataUrl = strokesToDataURL(paths);
  if (!dataUrl) {
    alert('No image generated from strokes.');
    return '';
  }
  // For debugging: show the image being sent
  window._lastVisionImage = dataUrl;
  console.log('[Vision] Image sent to Google Vision:', dataUrl);
  const base64 = dataUrl.split(',')[1];
  let json;
  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
            }
          ]
        })
      }
    );
    json = await res.json();
    console.log('[Vision] API response:', json);
    if (json.error) {
      alert('Vision API error: ' + JSON.stringify(json.error));
      return '';
    }
    const text = json.responses?.[0]?.fullTextAnnotation?.text?.trim() || '';
    if (!text) {
      alert('Vision did not recognize any text.');
    }
    return text;
  } catch (err) {
    alert('Vision API call failed: ' + err);
    console.error('[Vision] API call failed:', err, json);
    return '';
  }
}
