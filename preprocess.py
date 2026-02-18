"""
ARGUS — Point Cloud Data Preprocessor
Converts xyz.npy + measurement data into web-ready pointcloud.json

=== CONFIGURATION ===
Adjust CROP percentages to trim edges of the garment point cloud.
Rows go top→bottom, Cols go left→right in the depth image.
"""

import numpy as np
import json
import os

# ──────────────────────────────────────────────────────────────
# CONFIGURATION — adjust these as needed
# ──────────────────────────────────────────────────────────────

# Input paths
NPY_PATH = 'XL250_2700_tshirt_export_20260218_123302/xyz.npy'
MESH_PATHS_JSON = 'XL250_2700_tshirt_export_20260218_123302/mesh_paths.json'
MEASUREMENTS_JSON = 'XL250_2700_tshirt_export_20260218_123302/measurements.json'
KEYPOINTS_JSON = 'XL250_2700_tshirt_export_20260218_123302/keypoints.json'

# Output
OUTPUT_PATH = 'data/pointcloud.json'

# Crop percentages (0.0 to 1.0) — fraction to REMOVE from each side
CROP_TOP    = 0.10   # remove top 10% of valid garment rows
CROP_BOTTOM = 0.00   # remove bottom 0%
CROP_LEFT   = 0.10   # remove left 0%
CROP_RIGHT  = 0.00   # remove right 10%

# Downsampling — random sample to this many points (0 = keep all)
TARGET_POINTS = 0

# Path subsampling — keep every Nth pixel from measurement paths
PATH_SUBSAMPLE = 2

# Random seed for reproducibility
SEED = 42

# ──────────────────────────────────────────────────────────────
# PROCESSING
# ──────────────────────────────────────────────────────────────

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    
    # Load depth map
    npy_path = os.path.join(base, NPY_PATH)
    data = np.load(npy_path)
    print(f"Loaded {npy_path}: shape {data.shape}, dtype {data.dtype}")
    
    # Find valid (non-NaN) pixels
    valid_mask = ~np.isnan(data).any(axis=2)
    rows, cols = np.where(valid_mask)
    print(f"Total valid pixels: {len(rows)}")
    
    # Bounding box of valid region
    r_min, r_max = rows.min(), rows.max()
    c_min, c_max = cols.min(), cols.max()
    r_span = r_max - r_min
    c_span = c_max - c_min
    print(f"Valid bbox: rows [{r_min}, {r_max}] (span {r_span}), cols [{c_min}, {c_max}] (span {c_span})")
    
    # Apply crop
    r_lo = r_min + int(r_span * CROP_TOP)
    r_hi = r_max - int(r_span * CROP_BOTTOM)
    c_lo = c_min + int(c_span * CROP_LEFT)
    c_hi = c_max - int(c_span * CROP_RIGHT)
    print(f"Crop bounds: rows [{r_lo}, {r_hi}], cols [{c_lo}, {c_hi}]")
    print(f"  Removed: top {r_lo - r_min} rows, bottom {r_max - r_hi} rows, left {c_lo - c_min} cols, right {c_max - c_hi} cols")
    
    crop_mask = (rows >= r_lo) & (rows <= r_hi) & (cols >= c_lo) & (cols <= c_hi)
    c_rows = rows[crop_mask]
    c_cols = cols[crop_mask]
    c_xyz = data[c_rows, c_cols]
    print(f"After crop: {len(c_xyz)} points")
    
    # Random downsample
    np.random.seed(SEED)
    if TARGET_POINTS > 0 and len(c_xyz) > TARGET_POINTS:
        idx = np.random.choice(len(c_xyz), TARGET_POINTS, replace=False)
        idx.sort()
        c_xyz = c_xyz[idx]
        c_rows = c_rows[idx]
        c_cols = c_cols[idx]
    print(f"After downsample: {len(c_xyz)} points")
    
    # Center and normalize
    center = c_xyz.mean(axis=0)
    centered = c_xyz - center
    scale = np.abs(centered).max()
    normalized = (centered / scale).astype(np.float32)
    
    print(f"Center: {center}")
    print(f"Scale: {scale}")
    print(f"Normalized range X: [{normalized[:,0].min():.4f}, {normalized[:,0].max():.4f}]")
    print(f"Normalized range Y: [{normalized[:,1].min():.4f}, {normalized[:,1].max():.4f}]")
    print(f"Normalized range Z: [{normalized[:,2].min():.4f}, {normalized[:,2].max():.4f}]")
    
    # Real-world Z stats (for frontend depth coloring)
    real_z_min = c_xyz[:, 2].min()
    real_z_max = c_xyz[:, 2].max()
    real_z_span_mm = real_z_max - real_z_min
    print(f"Real Z range: [{real_z_min:.1f}, {real_z_max:.1f}] mm (span {real_z_span_mm:.1f} mm = {real_z_span_mm/10:.1f} cm)")
    
    # Load measurement data
    with open(os.path.join(base, MESH_PATHS_JSON)) as f:
        mesh_paths = json.load(f)
    with open(os.path.join(base, MEASUREMENTS_JSON)) as f:
        measurements = json.load(f)
    with open(os.path.join(base, KEYPOINTS_JSON)) as f:
        keypoints = json.load(f)
    
    # Convert measurement paths to normalized 3D
    path_data = []
    for mp in mesh_paths:
        path_3d = []
        for px, py in mp['path_pixels'][::PATH_SUBSAMPLE]:
            if 0 <= py < data.shape[0] and 0 <= px < data.shape[1]:
                pt = data[py, px]
                if not np.isnan(pt).any():
                    n = ((pt - center) / scale).tolist()
                    path_3d.append([round(n[0], 5), round(n[1], 5), round(n[2], 5)])
        path_data.append({'name': mp['name'], 'path3d': path_3d})
        print(f"  Path '{mp['name']}': {len(path_3d)} 3D points")
    
    # Keypoints in normalized 3D
    kp_data = []
    for kp in keypoints:
        px, py = int(round(kp['finetuned_x'])), int(round(kp['finetuned_y']))
        found = False
        for dy in range(-5, 6):
            for dx in range(-5, 6):
                ny, nx = py + dy, px + dx
                if 0 <= ny < data.shape[0] and 0 <= nx < data.shape[1]:
                    pt = data[ny, nx]
                    if not np.isnan(pt).any():
                        n = ((pt - center) / scale).tolist()
                        kp_data.append({'id': kp['id'], 'pos': [round(n[0], 5), round(n[1], 5), round(n[2], 5)]})
                        found = True
                        break
            if found:
                break
    print(f"Keypoints found: {len(kp_data)} / {len(keypoints)}")
    
    # Flatten point array
    flat = []
    for p in np.round(normalized, 5).tolist():
        flat.extend(p)
    
    output = {
        'points': flat,
        'pointCount': len(normalized),
        'measurements': measurements,
        'paths': path_data,
        'keypoints': kp_data,
        'center': center.tolist(),
        'scale': float(scale),
        'zSpanMm': float(real_z_span_mm),
    }
    
    os.makedirs(os.path.dirname(os.path.join(base, OUTPUT_PATH)), exist_ok=True)
    with open(os.path.join(base, OUTPUT_PATH), 'w') as f:
        json.dump(output, f)
    
    sz = os.path.getsize(os.path.join(base, OUTPUT_PATH)) / 1024 / 1024
    print(f"\n✓ Saved {OUTPUT_PATH}: {len(normalized)} points, {sz:.1f} MB")


if __name__ == '__main__':
    main()
