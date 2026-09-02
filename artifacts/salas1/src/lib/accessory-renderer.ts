/**
 * FarmCity — Layered accessory renderer
 *
 * The uploaded accessory sheets contain the character on a white background.
 * We keep only the non-white pixels inside the head-mounted accessory bounds,
 * then draw that layer on top of the body and hair sprites.
 */

import idleAccessorySheetUrl from '@assets/9_sin_título_Restaurado_20260901161013_1788301128227.png';
import walkAccessorySheetUrl from '@assets/8_sin_título_20260901170908_1788301127979.png';

export const ACCESSORY_STYLES: readonly string[] = ['vr-goggles'];

export const ACCESSORY_STYLE_LABELS: Record<string, string> = {
  'vr-goggles': 'Gafas VR',
  none: 'Sin accesorio',
};

type AccessoryAnimation = 'idle' | 'walk';

type SheetConfig = {
  url: string;
  columns: number;
  cellHeight: number;
  frameMap: readonly number[];
};

const SHEET_WIDTH = 460;
const SHEET_SCALE = 0.20;
const SHEET_FOOT_Y = 430;
const ACCESSORY_MASK_RADIUS = 9;

const SHEETS: Record<AccessoryAnimation, SheetConfig> = {
  idle: {
    url: idleAccessorySheetUrl,
    columns: 2,
    cellHeight: 453,
    frameMap: [0, 1, 0, 1, 0, 1, 0, 1],
  },
  walk: {
    url: walkAccessorySheetUrl,
    columns: 4,
    cellHeight: 460,
    frameMap: [0, 1, 2, 3, 2, 1],
  },
};

/**
 * The source art shows the goggles in the first three direction rows. Rows
 * 3 and 4 are the rear views, where the asset intentionally has no visible
 * goggles.
 */
const ACCESSORY_BOUNDS: ReadonlyArray<readonly [number, number, number, number] | null> = [
  [130, 160, 210, 100], // front
  [120, 145, 220, 120], // diagonal
  [140, 175, 145, 90],  // profile
  null,
  null,
];

const sheetCache = new Map<AccessoryAnimation, HTMLImageElement>();
const maskCache = new Map<string, HTMLCanvasElement>();

function getSheet(animation: AccessoryAnimation): HTMLImageElement {
  let image = sheetCache.get(animation);
  if (!image) {
    image = new Image();
    image.src = SHEETS[animation].url;
    sheetCache.set(animation, image);
  }
  return image;
}

function resolveFrame(animation: AccessoryAnimation, frame: number): number {
  const config = SHEETS[animation];
  const safeFrame = Math.max(0, Math.round(frame));
  return (config.frameMap[safeFrame % config.frameMap.length] ?? 0) % config.columns;
}

function getMask(
  animation: AccessoryAnimation,
  row: number,
  frame: number,
): HTMLCanvasElement | null {
  const config = SHEETS[animation];
  const image = getSheet(animation);
  if (!image.complete || image.naturalWidth === 0) return null;

  const safeRow = Math.max(0, Math.min(4, Math.round(row)));
  const safeFrame = resolveFrame(animation, frame);
  const key = `${animation}:${safeRow}:${safeFrame}`;
  const cached = maskCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = SHEET_WIDTH;
  canvas.height = config.cellHeight;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    safeFrame * SHEET_WIDTH,
    safeRow * config.cellHeight,
    SHEET_WIDTH,
    config.cellHeight,
    0,
    0,
    SHEET_WIDTH,
    config.cellHeight,
  );

  const bounds = ACCESSORY_BOUNDS[safeRow];
  if (!bounds) return canvas;

  const [boundX, boundY, boundWidth, boundHeight] = bounds;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const gogglePixels = new Uint8Array(canvas.width * canvas.height);
  const nearGogglePixels = new Uint8Array(canvas.width * canvas.height);

  // The source sheet is a complete character, not an isolated accessory.
  // Cyan/teal pixels are unique to the goggles, so use them as seeds and
  // recover only their nearby frame/outline. This prevents the source head,
  // hair and body outlines from being painted over the player's own layers.
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const insideBounds =
        x >= boundX &&
        x < boundX + boundWidth &&
        y >= boundY &&
        y < boundY + boundHeight;

      const red = pixels.data[index];
      const green = pixels.data[index + 1];
      const blue = pixels.data[index + 2];
      if (
        insideBounds &&
        green >= red + 12 &&
        blue >= red + 12 &&
        green >= 80
      ) {
        gogglePixels[y * canvas.width + x] = 1;
      }
    }
  }

  // Dilate from each colored seed instead of scanning a neighborhood around
  // every pixel. The resulting mask is equivalent but much cheaper for the
  // animation renderer.
  for (let y = boundY; y < boundY + boundHeight; y += 1) {
    for (let x = boundX; x < boundX + boundWidth; x += 1) {
      if (!gogglePixels[y * canvas.width + x]) continue;
      for (let offsetY = -ACCESSORY_MASK_RADIUS; offsetY <= ACCESSORY_MASK_RADIUS; offsetY += 1) {
        for (let offsetX = -ACCESSORY_MASK_RADIUS; offsetX <= ACCESSORY_MASK_RADIUS; offsetX += 1) {
          if (
            offsetX * offsetX + offsetY * offsetY >
            ACCESSORY_MASK_RADIUS * ACCESSORY_MASK_RADIUS
          ) continue;
          const neighborX = x + offsetX;
          const neighborY = y + offsetY;
          if (
            neighborX >= 0 &&
            neighborX < canvas.width &&
            neighborY >= 0 &&
            neighborY < canvas.height
          ) {
            nearGogglePixels[neighborY * canvas.width + neighborX] = 1;
          }
        }
      }
    }
  }

  for (let y = boundY; y < boundY + boundHeight; y += 1) {
    for (let x = boundX; x < boundX + boundWidth; x += 1) {
      const index = (y * canvas.width + x) * 4;
      // Include the dark/gray frame around the colored visor without
      // reaching the separate head outline or hairstyle.
      if (!nearGogglePixels[y * canvas.width + x]) {
        pixels.data[index + 3] = 0;
        continue;
      }

      const brightness =
        (pixels.data[index] + pixels.data[index + 1] + pixels.data[index + 2]) / 3;
      const isCharacterOutline =
        pixels.data[index] < 100 &&
        pixels.data[index + 1] < 55 &&
        pixels.data[index + 2] < 100;
      // The sheet background is slightly off-white (#FEFEFF). Any nearly
      // white pixel must be fully transparent; even a tiny alpha would reveal
      // the rectangular crop against the dark plaza background.
      const isSheetBackground =
        pixels.data[index] >= 245 &&
        pixels.data[index + 1] >= 245 &&
        pixels.data[index + 2] >= 245;
      pixels.data[index + 3] = isSheetBackground
        ? 0
        : isCharacterOutline
          ? 0
        : Math.max(0, Math.min(255, (255 - brightness) * 4));
    }
  }

  context.putImageData(pixels, 0, 0);
  maskCache.set(key, canvas);
  return canvas;
}

function drawSheetCrop(
  context: CanvasRenderingContext2D,
  feetX: number,
  feetY: number,
  row: number,
  flip: boolean,
  animation: AccessoryAnimation,
  frame: number,
): boolean {
  const config = SHEETS[animation];
  const bounds = ACCESSORY_BOUNDS[Math.max(0, Math.min(4, Math.round(row)))];
  if (!bounds) return true;

  const mask = getMask(animation, row, frame);
  if (!mask) return false;

  const [sourceX, sourceY, sourceWidth, sourceHeight] = bounds;
  const fullWidth = SHEET_WIDTH * SHEET_SCALE;
  const fullX = feetX - fullWidth / 2;
  const fullY = feetY - SHEET_FOOT_Y * SHEET_SCALE;

  context.save();
  context.imageSmoothingEnabled = false;
  if (flip) {
    context.translate(feetX, 0);
    context.scale(-1, 1);
    context.translate(-feetX, 0);
  }
  context.drawImage(
    mask,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    fullX + sourceX * SHEET_SCALE,
    fullY + sourceY * SHEET_SCALE,
    sourceWidth * SHEET_SCALE,
    sourceHeight * SHEET_SCALE,
  );
  context.restore();
  return true;
}

export function drawAccessoryLayer(
  context: CanvasRenderingContext2D,
  feetX: number,
  feetY: number,
  row: number,
  flip: boolean,
  accessory: string | null | undefined,
  animation = 'idle',
  frame = 0,
): void {
  if (!accessory || accessory === 'none') return;
  const resolvedAnimation: AccessoryAnimation = animation === 'walk' ? 'walk' : 'idle';
  drawSheetCrop(context, feetX, feetY, row, flip, resolvedAnimation, frame);
}

/**
 * Draws a catalog thumbnail and returns false while the image is still loading.
 * Callers can retry on the next animation frame.
 */
export function drawAccessoryThumbnail(
  context: CanvasRenderingContext2D,
  size: number,
  accessory: string,
): boolean {
  if (accessory === 'none') return true;

  const mask = getMask('idle', 0, 0);
  if (!mask) return false;

  const bounds = ACCESSORY_BOUNDS[0];
  if (!bounds) return true;
  const [sourceX, sourceY, sourceWidth, sourceHeight] = bounds;
  const padding = Math.round(size * 0.08);
  const targetWidth = size - padding * 2;
  const targetHeight = targetWidth * (sourceHeight / sourceWidth);

  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = false;
  context.drawImage(
    mask,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    padding,
    (size - targetHeight) / 2,
    targetWidth,
    targetHeight,
  );
  return true;
}