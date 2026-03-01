// Color extraction and utility functions

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number }
): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Extract dominant colors from an image
 * Uses a simple quantization algorithm
 */
export async function extractColorsFromImage(
  imageSrc: string,
  maxColors: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        const maxSize = 100; // Scale down for performance
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Sample colors (every 4th pixel for performance)
        const colorCounts = new Map<string, number>();
        for (let i = 0; i < pixels.length; i += 16) { // Step by 4 pixels
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize to reduce color space (divide by 32 and multiply back)
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;

          const hex = rgbToHex(qr, qg, qb);
          colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }

        // Sort by frequency and take top colors
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color);

        // Cluster similar colors to get diverse palette
        const palette: string[] = [];
        const minDistance = 80; // Minimum distance between colors

        for (const color of sortedColors) {
          if (palette.length >= maxColors) break;

          const rgb = hexToRgb(color);
          if (!rgb) continue;

          // Check if color is different enough from existing palette
          const isDifferent = palette.every(existingColor => {
            const existingRgb = hexToRgb(existingColor);
            if (!existingRgb) return true;
            return colorDistance(rgb, existingRgb) >= minDistance;
          });

          if (isDifferent) {
            palette.push(color);
          }
        }

        // Fill with most common colors if we don't have enough diverse colors
        if (palette.length < maxColors) {
          for (const color of sortedColors) {
            if (palette.length >= maxColors) break;
            if (!palette.includes(color)) {
              palette.push(color);
            }
          }
        }

        resolve(palette.slice(0, maxColors));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
}

/**
 * Get a contrasting text color (black or white) for a given background color
 */
export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Generate a random color
 */
export function randomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex(r, g, b);
}
