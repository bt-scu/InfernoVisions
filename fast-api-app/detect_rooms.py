import json
import cv2
import numpy as np
from datetime import datetime, timezone

IMAGE_PATH = "heafey_floor1.png"
OUT_JSON = "rooms_corrected_schema.json"

# ── Tunables ─────────────────────────────────────────────────────────────
BLACK_THRESH = 85          # lower = stricter (only very dark pixels count as walls)
CANNY_LOW = 60
CANNY_HIGH = 180

HOUGH_THRESH = 60
MIN_LINE_LEN = 25
MAX_LINE_GAP = 6

WALL_THICKNESS = 3
CLOSE_KERNEL = 7
CLOSE_ITERS = 2
DILATE_ITERS = 1

MIN_ROOM_AREA = 1500
MAX_ROOM_AREA = 400000
ASPECT_MAX = 25.0
ASPECT_MIN = 0.04
# ────────────────────────────────────────────────────────────────────────

img = cv2.imread(IMAGE_PATH)
if img is None:
    raise FileNotFoundError(f"Cannot open {IMAGE_PATH}")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
h, w = gray.shape

# 1) Dark "ink" mask (focus on black walls)
_, ink = cv2.threshold(gray, BLACK_THRESH, 255, cv2.THRESH_BINARY_INV)
ink = cv2.morphologyEx(ink, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=1)

# 2) Edges + Hough lines (straight wall segments)
edges = cv2.Canny(ink, CANNY_LOW, CANNY_HIGH)
lines = cv2.HoughLinesP(
    edges, rho=1, theta=np.pi / 180,
    threshold=HOUGH_THRESH,
    minLineLength=MIN_LINE_LEN,
    maxLineGap=MAX_LINE_GAP,
)

line_img = np.zeros_like(gray)
if lines is not None:
    for (x1, y1, x2, y2) in lines[:, 0]:
        cv2.line(line_img, (x1, y1), (x2, y2), 255, WALL_THICKNESS)

# 3) Combine ink + lines into final wall mask, then seal small gaps
walls = cv2.bitwise_or(ink, line_img)

k_close = cv2.getStructuringElement(cv2.MORPH_RECT, (CLOSE_KERNEL, CLOSE_KERNEL))
walls = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, k_close, iterations=CLOSE_ITERS)
walls = cv2.dilate(walls, np.ones((3, 3), np.uint8), iterations=DILATE_ITERS)

# 4) Flood-fill outside on free space, so "inside_free" = enclosed room regions
free = (walls == 0).astype(np.uint8) * 255
temp = free.copy()
ff_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)

for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    x, y = seed
    if temp[y, x] == 255:
        cv2.floodFill(temp, ff_mask, seed, 128, flags=4)

outside = (temp == 128).astype(np.uint8) * 255
inside_free = cv2.bitwise_and(free, cv2.bitwise_not(outside))

# 5) Connected components on inside_free
num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(inside_free, connectivity=4)

raw_rooms = []
for i in range(1, num_labels):
    x, y, ww, hh, area = stats[i]

    if area < MIN_ROOM_AREA or area > MAX_ROOM_AREA:
        continue

    aspect = ww / hh if hh > 0 else 0.0
    if aspect > ASPECT_MAX or aspect < ASPECT_MIN:
        continue

    raw_rooms.append((int(y), int(x), int(ww), int(hh)))

# Sort top-to-bottom, left-to-right for stable room numbering
raw_rooms.sort(key=lambda r: (r[0], r[1]))

rooms = []
updated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
for idx, (y, x, ww, hh) in enumerate(raw_rooms, start=1):
    rooms.append({
        "room_number": str(idx),
        "status": "clear",
        "firefighters": "None",
        "x_pos": float(x),
        "y_pos": float(y),
        "width": float(ww),
        "height": float(hh),
        "shape_type": "rectangle",
        "updated_at": updated_at,
    })

out = {
    "name": "Heafey Building",
    "floors": [
        {
            "level": 1,
            "rooms": rooms,
        }
    ],
}

with open(OUT_JSON, "w") as f:
    json.dump(out, f, indent=2)

print(f"Saved {OUT_JSON} with {len(rooms)} rooms")
