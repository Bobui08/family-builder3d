import * as THREE from 'three';

// Vietnam Flag Ratio 2:3
const FLAG_WIDTH = 30;
const FLAG_HEIGHT = 20;

// Star Geometry
const STAR_RADIUS = 6; // Proportional to height (approx 3/10 of height is standard, adjusted for visual impact)
const STAR_CENTER = { x: 0, y: 0 };

function isPointInStar(x: number, y: number): boolean {
  // Translate to center
  const dx = x - STAR_CENTER.x;
  const dy = y - STAR_CENTER.y;
  
  // Convert to polar
  const angle = Math.atan2(dy, dx);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 5-pointed star formula
  // r(theta) = R * cos(2PI/5) / cos(2PI/5 - (theta % (2PI/10 * 2)))
  // Simplified visually:
  // A star has 5 outer points and 5 inner points.
  
  // Calculate angle offset to align top point
  const offsetAngle = angle - Math.PI / 2;
  const segment = Math.PI * 2 / 5;
  
  // Normalize angle to defined segment
  let a = offsetAngle % segment;
  if (a < 0) a += segment;
  
  // Check against star boundary
  // Outer radius R, Inner radius r
  // For a standard 5-point star, r approx 0.382 * R
  const R = STAR_RADIUS;
  const r = STAR_RADIUS * 0.382;
  
  // Simple check: if distance is less than inner radius, it's inside
  if (dist < r) return true;
  // If distance > outer radius, outside
  if (dist > R) return false;

  // Use triangle check for edges between inner and outer
  // Use a simpler approach: multiple triangles
  // Or distance field. 
  
  // Let's use a ray-casting approach for a pre-defined star polygon
  const points: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const currRadius = i % 2 === 0 ? R : r;
    const currAngle = Math.PI / 2 + i * Math.PI / 5;
    points.push([
      Math.cos(currAngle) * currRadius,
      Math.sin(currAngle) * currRadius
    ]);
  }
  
  // Point in Polygon
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0], yi = points[i][1];
    const xj = points[j][0], yj = points[j][1];
    
    const intersect = ((yi > dy) !== (yj > dy))
        && (dx < (xj - xi) * (dy - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export function generateFlagParticles(count: number) {
  const particles = [];
  const colors = [];
  
  // Grid dimensions
  const ratio = FLAG_WIDTH / FLAG_HEIGHT;
  const cols = Math.round(Math.sqrt(count * ratio));
  const rows = Math.round(count / cols);
  
  const stepX = FLAG_WIDTH / cols;
  const stepY = FLAG_HEIGHT / rows;
  
  // Pre-calculate colors
  const colorRed = new THREE.Color('#DA251D'); // Official VN Flag Red
  const colorYellow = new THREE.Color('#FFFF00'); // Official VN Flag Yellow

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i * stepX) - (FLAG_WIDTH / 2);
      const y = (j * stepY) - (FLAG_HEIGHT / 2);
      
      const isStar = isPointInStar(x, y);
      
      particles.push(x, y, 0);
      
      const c = isStar ? colorYellow : colorRed;
      colors.push(c.r, c.g, c.b);
    }
  }
  
  return {
    positions: new Float32Array(particles),
    colors: new Float32Array(colors),
    count: particles.length / 3
  };
}
