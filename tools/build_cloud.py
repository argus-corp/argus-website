#!/usr/bin/env python3
"""
ARGUS — point cloud web asset builder.

Turns the intermediate data/pointcloud.json into the three files the site
actually loads. The JSON is ~22 MB of text: too slow to download on cellular
and costly to JSON.parse on a phone. Geometry is emitted instead as raw
little-endian Float32, which the browser drops straight into a Float32Array.

    data/cloud-full.bin   full resolution, used on desktop
    data/cloud-lite.bin   stride-decimated, used on phones and tablets
    data/cloud-meta.json  measurements, paths, keypoints, point counts

Pipeline:
    XL250_*_export/  --preprocess.py-->  data/pointcloud.json  --this-->  data/cloud-*

data/pointcloud.json is an intermediate and is deliberately not deployed
(see .gitignore). Regenerate it with preprocess.py if it is missing.

Usage:
    python3 tools/build_cloud.py
"""

import json
import os
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'pointcloud.json')

# Points kept for the compact build. Around 90k stays visually indistinguishable
# from the full set at phone width while cutting the payload to roughly 1 MB.
LITE_TARGET = 90_000


def main():
    if not os.path.exists(SRC):
        sys.exit(
            f"missing {os.path.relpath(SRC, ROOT)}\n"
            "Run preprocess.py first to regenerate it from the raw export."
        )

    src = json.load(open(SRC))
    n = src['pointCount']
    pts = np.asarray(src['points'], dtype='<f4')
    if pts.size != n * 3:
        sys.exit(f"expected {n * 3} floats, found {pts.size}")

    out = lambda name: os.path.join(ROOT, 'data', name)

    pts.tofile(out('cloud-full.bin'))

    # Stride sampling rather than a random subset: it keeps the scanned surface
    # evenly covered instead of thinning unevenly across the garment.
    stride = max(1, int(np.ceil(n / LITE_TARGET)))
    lite = pts.reshape(n, 3)[::stride].reshape(-1)
    lite.tofile(out('cloud-lite.bin'))

    meta = {k: v for k, v in src.items() if k != 'points'}
    meta['pointCountFull'] = int(n)
    meta['pointCountLite'] = int(lite.size // 3)
    json.dump(meta, open(out('cloud-meta.json'), 'w'), separators=(',', ':'))

    mb = lambda p: os.path.getsize(p) / 1e6
    print(f"source  pointcloud.json : {mb(SRC):7.2f} MB  ({n} pts)")
    print(f"        cloud-full.bin  : {mb(out('cloud-full.bin')):7.2f} MB  ({n} pts)")
    print(f"        cloud-lite.bin  : {mb(out('cloud-lite.bin')):7.2f} MB  "
          f"({meta['pointCountLite']} pts, stride {stride})")
    print(f"        cloud-meta.json : {mb(out('cloud-meta.json')):7.2f} MB")


if __name__ == '__main__':
    main()
