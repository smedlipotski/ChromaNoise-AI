
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizerComponent, VisualMode } from './components/visualizer.component';
import { ControlsComponent } from './components/controls.component';
import { PaletteResponse } from './services/gemini.service';
import { NoiseType } from './services/noise';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, VisualizerComponent, ControlsComponent],
  template: `
    <app-visualizer 
      [colors]="currentColors()" 
      [speed]="speed()" 
      [scale]="scale()" 
      [particleCount]="particleCount()" 
      [mode]="mode()" 
      [noiseType]="noiseType()"
      [brightness]="brightness()"
      [contrast]="contrast()"
      [showRawNoise]="showRawNoise()"
    ></app-visualizer>
    <app-controls 
      [colors]="currentColors()"
      [paletteName]="paletteName()"
      [paletteDesc]="paletteDesc()"
      [speed]="speed()" 
      (speedChange)="speed.set($event)"
      [scale]="scale()" 
      (scaleChange)="scale.set($event)"
      [particleCount]="particleCount()" 
      (particleCountChange)="particleCount.set($event)"
      [mode]="mode()" 
      (modeChange)="mode.set($event)"
      [noiseType]="noiseType()"
      (noiseTypeChange)="noiseType.set($event)"
      [brightness]="brightness()"
      (brightnessChange)="brightness.set($event)"
      [contrast]="contrast()"
      (contrastChange)="contrast.set($event)"
      [showRawNoise]="showRawNoise()"
      (showRawNoiseChange)="showRawNoise.set($event)"
      (newPalette)="updatePalette($event)"
    ></app-controls>
  `
})
export class AppComponent {
  // State Signals
  // Updated default palette
  currentColors = signal<string[]>(['#1B998B', '#2D3047', '#FFFD82', '#FF9B71', '#E84855']);
  paletteName = signal<string>("Modern Geometric");
  paletteDesc = signal<string>("A balanced mix of deep tones and vibrant highlights.");
  
  speed = signal<number>(1.5);
  scale = signal<number>(300);
  particleCount = signal<number>(2000);
  mode = signal<VisualMode>('flow');
  noiseType = signal<NoiseType>('Turbulence');
  
  // New Visual Params
  brightness = signal<number>(1.0);
  contrast = signal<number>(1.0);
  showRawNoise = signal<boolean>(false);

  updatePalette(palette: PaletteResponse) {
    this.currentColors.set(palette.colors);
    this.paletteName.set(palette.name);
    this.paletteDesc.set(palette.description);
  }
}
