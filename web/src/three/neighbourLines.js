/**
 * The neighbour-pairing search at the heart of `HeroField`'s line mesh,
 * factored out of the `useFrame` callback so it can be unit-tested without
 * a live WebGL frame loop — the same reason `colorTransition.js` was
 * extracted. This is the frame budget for the whole scene: with 260
 * points a naive pairwise loop is 33k distance checks per frame, so the
 * two things that keep it cheap (comparing squared distances instead of
 * calling `Math.sqrt`, and only running every other frame) both need to
 * stay provably true, not just readable-and-hopefully-correct.
 */

/**
 * Scans every pair of particles once and writes a line segment (both
 * endpoints, xyz each) into `output` for every pair closer than
 * `linkDistanceSq` — compared as squared distances so this never needs
 * `Math.sqrt`. Stops as soon as `maxSegments` is reached, so `output` only
 * ever needs to be sized for the cap, not for the worst-case pair count.
 *
 * Returns the number of segments actually written, so the caller can set
 * `geometry.setDrawRange(0, segmentCount * 2)`.
 */
export function findNeighbourPairs({ positions, particleCount, linkDistanceSq, maxSegments, output }) {
  let segmentCount = 0;
  findPairs: for (let i = 0; i < particleCount; i++) {
    const ix = positions[i * 3];
    const iy = positions[i * 3 + 1];
    const iz = positions[i * 3 + 2];
    for (let j = i + 1; j < particleCount; j++) {
      const dx = ix - positions[j * 3];
      const dy = iy - positions[j * 3 + 1];
      const dz = iz - positions[j * 3 + 2];
      const distanceSq = dx * dx + dy * dy + dz * dz;
      if (distanceSq < linkDistanceSq) {
        if (segmentCount >= maxSegments) break findPairs;
        const base = segmentCount * 6;
        output[base + 0] = ix;
        output[base + 1] = iy;
        output[base + 2] = iz;
        output[base + 3] = positions[j * 3];
        output[base + 4] = positions[j * 3 + 1];
        output[base + 5] = positions[j * 3 + 2];
        segmentCount++;
      }
    }
  }
  return segmentCount;
}

/** Advances the every-other-frame parity flag: 0 -> 1 -> 0 -> 1 ... */
export function nextFramePairParity(parity) {
  return (parity + 1) % 2;
}

/** Whether the neighbour graph should rebuild at this parity value. */
export function isNeighbourRebuildFrame(parity) {
  return parity === 0;
}
