
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, input, effect } from '@angular/core';
import { FastNoise, NoiseType } from '../services/noise';

export type VisualMode = 'flow' | 'grid' | 'waves' | 'bubbles';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  color: string;
}

@Component({
  selector: 'app-visualizer',
  standalone: true,
  template: `
    <canvas #canvas class="absolute top-0 left-0 w-full h-full block"></canvas>
  `,
  host: {
    '(window:resize)': 'resize()'
  }
})
export class VisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Inputs
  colors = input.required<string[]>();
  speed = input.required<number>();
  scale = input.required<number>();
  particleCount = input.required<number>();
  mode = input.required<VisualMode>();
  noiseType = input.required<NoiseType>();
  
  brightness = input.required<number>();
  contrast = input.required<number>();
  showRawNoise = input.required<boolean>();

  private ctx!: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private animationId = 0;
  private noise = new FastNoise();
  private particles: Particle[] = [];
  private time = 0;
  
  constructor() {
    // Re-init particles when count changes
    effect(() => {
      const count = this.particleCount();
      this.initParticles(count);
    });

    // Re-init when mode changes (clears canvas)
    effect(() => {
      const m = this.mode();
      if (this.ctx) {
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.width, this.height);
      }
    });
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d', { alpha: false })!;
    this.resize();
    this.initParticles(this.particleCount());
    this.loop();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvasRef.nativeElement.width = this.width;
    this.canvasRef.nativeElement.height = this.height;
    // Clear on resize
    if(this.ctx) {
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private initParticles(count: number) {
    this.particles = [];
    const colors = this.colors();
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        age: Math.random() * 100,
        maxAge: 100 + Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }
  
  private processNoise(val: number): number {
    // Input val is approx -1 to 1. Normalize to 0..1
    let n = (val + 1) / 2;
    
    // Apply contrast: (n - 0.5) * contrast + 0.5
    n = (n - 0.5) * this.contrast() + 0.5;
    
    // Apply brightness (simple multiplier or offset - using offset logic for "brightness" feel)
    // Actually, image processing brightness usually adds constant. 
    // Let's do a mix: center point shift.
    n = n * this.brightness();
    
    return Math.max(0, Math.min(1, n));
  }

  private loop = () => {
    this.time += 0.005 * this.speed();
    
    // Render based on mode
    switch(this.mode()) {
        case 'flow': this.renderFlow(); break;
        case 'grid': this.renderGrid(); break;
        case 'waves': this.renderWaves(); break;
        case 'bubbles': this.renderBubbles(); break;
    }

    this.animationId = requestAnimationFrame(this.loop);
  }

  private renderFlow() {
    // Fade out effect
    this.ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const noiseScale = this.scale();
    const speed = this.speed();
    const currentColors = this.colors();
    const nType = this.noiseType();
    const isRaw = this.showRawNoise();

    for (let p of this.particles) {
      const rawN = this.noise.getNoise(nType, p.x / noiseScale, p.y / noiseScale, this.time);
      const n = this.processNoise(rawN);
      const angle = rawN * Math.PI * 4; // Use raw for direction to keep movement interesting even if clipped

      p.x += Math.cos(angle) * speed;
      p.y += Math.sin(angle) * speed;
      p.age++;

      // Wrap around
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      if (p.age > p.maxAge) {
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.age = 0;
        p.color = currentColors[Math.floor(Math.random() * currentColors.length)];
      }

      if (isRaw) {
        const v = Math.floor(n * 255);
        this.ctx.fillStyle = `rgb(${v},${v},${v})`;
      } else {
        this.ctx.fillStyle = p.color;
      }
      
      const size = 1.5 + (n * 2); 
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderGrid() {
     // Clear screen for grid mode (it doesn't trail usually, or trails differently)
     // Let's do partial clear for a smoother look
     this.ctx.fillStyle = '#050505';
     this.ctx.fillRect(0, 0, this.width, this.height);

     const cellSize = Math.max(10, 80 - (this.particleCount() / 50)); 
     const cols = Math.ceil(this.width / cellSize);
     const rows = Math.ceil(this.height / cellSize);
     const noiseScale = this.scale();
     const currentColors = this.colors();
     const nType = this.noiseType();
     const isRaw = this.showRawNoise();

     for (let x = 0; x < cols; x++) {
       for (let y = 0; y < rows; y++) {
         const px = x * cellSize;
         const py = y * cellSize;
         
         const rawN = this.noise.getNoise(nType, px / noiseScale, py / noiseScale, this.time);
         const n = this.processNoise(rawN);
         
         if (isRaw) {
             const v = Math.floor(n * 255);
             this.ctx.fillStyle = `rgb(${v},${v},${v})`;
         } else {
             const colorIdx = Math.floor(n * currentColors.length);
             const clampedIdx = Math.max(0, Math.min(colorIdx, currentColors.length - 1));
             this.ctx.fillStyle = currentColors[clampedIdx];
         }

         // Draw rectangle
         this.ctx.fillRect(px, py, cellSize + 1, cellSize + 1);
       }
     }
  }

  private renderWaves() {
      this.ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; // Faster fade
      this.ctx.fillRect(0, 0, this.width, this.height);

      const noiseScale = this.scale();
      const currentColors = this.colors();
      const nType = this.noiseType();
      const isRaw = this.showRawNoise();
      
      const gap = Math.max(10, 100 - (this.particleCount() / 50));
      const detail = 5; // Horizontal resolution
      
      this.ctx.lineWidth = 2;

      for (let y = gap/2; y < this.height; y += gap) {
          this.ctx.beginPath();
          let colorIndex = Math.floor((y / this.height) * currentColors.length);
          if (colorIndex >= currentColors.length) colorIndex = currentColors.length - 1;
          
          let firstVal = 0;
          
          for (let x = 0; x <= this.width; x += detail) {
              const rawN = this.noise.getNoise(nType, x / noiseScale, y / noiseScale, this.time);
              const n = this.processNoise(rawN);
              
              const displacement = (rawN * gap * 2 * this.contrast()); // Amplitude driven by contrast
              
              if (x === 0) {
                  this.ctx.moveTo(x, y + displacement);
                  firstVal = n;
              } else {
                  this.ctx.lineTo(x, y + displacement);
              }
          }
          
          if (isRaw) {
              const v = Math.floor(firstVal * 255); // Use first value for line color approximation in raw mode
              this.ctx.strokeStyle = `rgb(${v},${v},${v})`;
          } else {
              this.ctx.strokeStyle = currentColors[colorIndex];
          }
          this.ctx.stroke();
      }
  }

  private renderBubbles() {
    this.ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cellSize = Math.max(20, 100 - (this.particleCount() / 50));
    const cols = Math.ceil(this.width / cellSize);
    const rows = Math.ceil(this.height / cellSize);
    const noiseScale = this.scale();
    const currentColors = this.colors();
    const nType = this.noiseType();
    const isRaw = this.showRawNoise();

    for (let x = 0; x <= cols; x++) {
      for (let y = 0; y <= rows; y++) {
        const px = x * cellSize;
        const py = y * cellSize;
        
        const rawN = this.noise.getNoise(nType, px / noiseScale, py / noiseScale, this.time);
        const n = this.processNoise(rawN); // 0 to 1

        const maxRadius = cellSize * 0.8;
        const radius = n * maxRadius;

        if (radius < 1) continue;

        if (isRaw) {
            const v = Math.floor(n * 255);
            this.ctx.fillStyle = `rgb(${v},${v},${v})`;
        } else {
             // Pick color based on noise value too
            const colorIdx = Math.floor(n * currentColors.length);
            const clampedIdx = Math.max(0, Math.min(colorIdx, currentColors.length - 1));
            this.ctx.fillStyle = currentColors[clampedIdx];
        }

        this.ctx.beginPath();
        this.ctx.arc(px, py, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
}
