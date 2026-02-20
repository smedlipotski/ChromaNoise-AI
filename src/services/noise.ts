
export type NoiseType = 
  'Box Noise' | 'Blistered Turbulence' | 'Buya' | 'Cell Noise' | 'Cranal' | 
  'Dents' | 'Displaced Turbulence' | 'FBM' | 'Hama' | 'Luka' | 'Mod Noise' | 
  'Naki' | 'Nutous' | 'Ober' | 'Pezo' | 'Poxo' | 'Sema' | 'Stipl' | 
  'Turbulence' | 'VL Noise' | 'Wavy Turbulence' | 'Cell Voronoi' | 
  'Displaced Voronoi' | 'Sparse Convolution' | 'Voronoi' | 'Zada' | 
  'Fire' | 'Electric' | 'Gaseous' | 'Ridged Multi Fractal';

export class FastNoise {
  private p: number[] = new Uint8Array(256) as any;
  private perm: number[] = new Uint8Array(512) as any;
  private permMod12: number[] = new Uint8Array(512) as any;
  private grad3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);

  constructor() {
    this.seed(Math.random());
  }

  seed(seed: number) {
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    // Shuffle
    for (let i = 255; i > 0; i--) {
      const r = Math.floor((seed * (i + 1) + i) % 256);
      const temp = this.p[i];
      this.p[i] = this.p[r];
      this.p[r] = temp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  // Core Simplex Noise
  simplex3D(xin: number, yin: number, zin: number): number {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;
    let n0, n1, n2, n3;

    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;

    let i1, j1, k1;
    let i2, j2, k2;

    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0 + this.grad3[gi0 + 2] * z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1 + this.grad3[gi1 + 2] * z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2 + this.grad3[gi2 + 2] * z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] * 3;
      t3 *= t3;
      n3 = t3 * t3 * (this.grad3[gi3] * x3 + this.grad3[gi3 + 1] * y3 + this.grad3[gi3 + 2] * z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  }

  // Helpers for complex noises
  private fbm(x: number, y: number, z: number, octaves: number, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for(let i=0; i<octaves; i++) {
        total += this.simplex3D(x * frequency, y * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return total / maxValue;
  }

  private turbulence(x: number, y: number, z: number, octaves: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    for(let i=0; i<octaves; i++) {
        total += Math.abs(this.simplex3D(x * frequency, y * frequency, z * frequency)) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return total;
  }

  // Simple Cellular/Voronoi approximation (Worley Noise)
  private voronoi(x: number, y: number, z: number, type: 'dist' | 'cell' | 'crackle' = 'dist'): number {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const floorZ = Math.floor(z);
    
    let minDist = 1.0;
    let secondMinDist = 1.0;
    
    // Check 3x3x3 neighbor cubes
    for (let k = -1; k <= 1; k++) {
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          // Hash to get random point in cube
          const cx = floorX + i;
          const cy = floorY + j;
          const cz = floorZ + k;
          
          // Fast pseudo-random hash
          const h = (cx * 15485863 + cy * 2038074743 + cz * 39989) | 0; // simple hash
          const randX = ((h & 255) / 255.0);
          const randY = (((h >> 8) & 255) / 255.0);
          const randZ = (((h >> 16) & 255) / 255.0);
          
          const dx = (cx + randX) - x;
          const dy = (cy + randY) - y;
          const dz = (cz + randZ) - z;
          
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          
          if (dist < minDist) {
            secondMinDist = minDist;
            minDist = dist;
          } else if (dist < secondMinDist) {
            secondMinDist = dist;
          }
        }
      }
    }

    if (type === 'dist') return minDist;
    if (type === 'cell') return this.simplex3D(floorX, floorY, floorZ); // Pseudo-random cell value
    if (type === 'crackle') return secondMinDist - minDist;
    
    return minDist;
  }

  // Main switching function
  getNoise(type: NoiseType, x: number, y: number, z: number): number {
    switch (type) {
        case 'Box Noise':
            // Step function of noise
            return Math.floor(this.simplex3D(x, y, z) * 4) / 4;
        
        case 'Blistered Turbulence':
             // Inverted turbulence
             const bt = this.turbulence(x, y, z, 3);
             return -1.0 + 2.0 * (1.0 - bt);

        case 'Buya':
            // Wavy sine modulation
            return Math.sin(x * 5 + this.simplex3D(x,y,z)) * Math.cos(y * 5 + this.simplex3D(x,y,z));

        case 'Cell Noise':
            // Blocky
            return this.voronoi(x, y, z, 'cell');
        
        case 'Cranal':
            // High frequency turbulence mixed with sine
            return this.turbulence(x, y, z, 4) * Math.sin(x*10);

        case 'Dents':
             // Sparse inverted spots
             const d = this.voronoi(x*2, y*2, z*2, 'dist');
             return Math.pow(1-d, 4);

        case 'Displaced Turbulence':
            const dx = this.simplex3D(x, y, z);
            return this.turbulence(x + dx, y + dx, z, 3);

        case 'FBM':
            return this.fbm(x, y, z, 5);

        case 'Hama':
            // Sawtooth-like
            const h = this.simplex3D(x,y,z);
            return h - Math.floor(h);

        case 'Luka':
            // Abs value of ridge
            return Math.abs(this.simplex3D(x,y,z)) > 0.4 ? 1 : 0;

        case 'Mod Noise':
            return this.simplex3D(x,y,z) * this.simplex3D(x*2, y*2, z*2);

        case 'Naki':
            // Smooth swirls
            return Math.sin(x + this.fbm(x,y,z, 2));

        case 'Nutous':
            // Bulby
            return Math.pow(this.simplex3D(x,y,z), 3);

        case 'Ober':
             // Zigzag
             const ob = this.simplex3D(x,y,z);
             return Math.abs(ob) * 2 - 1;

        case 'Pezo':
             // Ridged
             return 1 - Math.abs(this.simplex3D(x,y,z));

        case 'Poxo':
            // Quantized cells
            return Math.floor(this.voronoi(x,y,z) * 5) / 5;

        case 'Sema':
            // Smooth blend
            return (Math.sin(x) + Math.cos(y) + this.simplex3D(x,y,z)) / 3;

        case 'Stipl':
             // High frequency noise
             return this.simplex3D(x*10, y*10, z*10);

        case 'Turbulence':
            return this.turbulence(x, y, z, 4);

        case 'VL Noise':
             // Variable lacunarity/distortion
             return this.fbm(x + Math.sin(y), y + Math.cos(x), z, 3);

        case 'Wavy Turbulence':
             return Math.sin(this.turbulence(x,y,z, 3) * 10);

        case 'Cell Voronoi':
             return this.voronoi(x, y, z, 'cell');

        case 'Displaced Voronoi':
             return this.voronoi(x + Math.sin(z), y + Math.cos(z), z, 'dist');

        case 'Sparse Convolution':
             // Approximate with thresholded noise
             const sc = this.simplex3D(x,y,z);
             return sc > 0.5 ? (sc - 0.5) * 2 : 0;

        case 'Voronoi':
             return this.voronoi(x, y, z, 'dist');
        
        case 'Zada':
             // Staircase
             return Math.ceil(this.simplex3D(x,y,z) * 5) / 5;

        case 'Fire':
             // High Y scaling, reddish turbulence
             // (Mapping happens in render, here we return the scalar)
             const fire = this.turbulence(x, y * 3, z * 3, 4);
             return fire * fire; // sharp falloff

        case 'Electric':
             // Thin lines
             const elec = Math.abs(this.simplex3D(x,y,z));
             return 1.0 - Math.pow(elec, 0.1);

        case 'Gaseous':
             // Smooth FBM
             return this.fbm(x,y,z, 3, 0.7);

        case 'Ridged Multi Fractal':
             let val = 0;
             let amp = 1;
             for(let i=0; i<4; i++) {
                 val += (1 - Math.abs(this.simplex3D(x * (2**i), y * (2**i), z * (2**i)))) * amp;
                 amp *= 0.5;
             }
             return val - 1.0; // Normalize roughly

        default: 
            return this.simplex3D(x, y, z);
    }
  }
}
