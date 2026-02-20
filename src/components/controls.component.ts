
import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaletteResponse, GeminiService } from '../services/gemini.service';
import { NoiseType } from '../services/noise';
import { VisualMode } from './visualizer.component';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed top-4 left-4 z-50 w-80 max-h-[90vh] overflow-y-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl text-white transition-all duration-300 hover:bg-black/80">
      
      <!-- Header -->
      <div class="mb-6 border-b border-white/10 pb-4">
        <h1 class="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          ChromaNoise
        </h1>
        <p class="text-xs text-gray-400 mt-1">Tactile Generative Visualizer</p>
      </div>

      <!-- AI Generator -->
      <div class="mb-6">
        <label class="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2 block">
          AI Theme Generator
        </label>
        <div class="flex gap-2">
          <input 
            type="text" 
            [(ngModel)]="promptText" 
            (keydown.enter)="generateTheme()"
            placeholder="e.g. Cyberpunk Rain, Cotton Candy..." 
            class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
          />
          <button 
            (click)="generateTheme()" 
            [disabled]="geminiService.isLoading()"
            class="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-colors flex items-center justify-center min-w-[44px]"
          >
            @if (geminiService.isLoading()) {
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            }
          </button>
        </div>
        @if (geminiService.error()) {
          <p class="text-red-400 text-xs mt-2">{{ geminiService.error() }}</p>
        }
      </div>

      <!-- Current Palette Display -->
      <div class="mb-6">
         <div class="flex justify-between items-end mb-2">
            <label class="text-xs font-medium text-gray-300 uppercase tracking-wider block">
              Current Palette
            </label>
            <span class="text-xs text-purple-300 font-mono">{{ paletteName() }}</span>
         </div>
        
        <div class="flex h-8 rounded-lg overflow-hidden border border-white/20">
          @for (color of colors(); track $index) {
            <div [style.background-color]="color" class="flex-1 h-full transition-all duration-500 hover:flex-[1.5]" [title]="color"></div>
          }
        </div>
        <p class="text-xs text-gray-500 mt-2 italic line-clamp-2">{{ paletteDesc() }}</p>
      </div>

      <!-- Parameters -->
      <div class="space-y-5">
        
        <!-- Noise Type Selector -->
        <div>
          <label class="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2 block">
            Noise Type
          </label>
          <select 
            [ngModel]="noiseType()" 
            (ngModelChange)="onNoiseTypeChange($event)"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 [&>option]:bg-gray-900"
          >
            @for (type of availableNoiseTypes; track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <!-- Brightness -->
            <div>
            <div class="flex justify-between mb-1">
                <label class="text-xs text-gray-400">Brightness</label>
            </div>
            <input 
                type="range" min="0.5" max="2.0" step="0.1" 
                [ngModel]="brightness()" 
                (ngModelChange)="brightnessChange.emit($event)"
                class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            </div>

            <!-- Contrast -->
            <div>
            <div class="flex justify-between mb-1">
                <label class="text-xs text-gray-400">Contrast</label>
            </div>
            <input 
                type="range" min="0.5" max="3.0" step="0.1" 
                [ngModel]="contrast()" 
                (ngModelChange)="contrastChange.emit($event)"
                class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            </div>
        </div>

        <!-- Raw Toggle -->
        <div class="flex items-center justify-between py-1">
            <label class="text-xs font-medium text-gray-300 uppercase tracking-wider">
                Show Raw Noise
            </label>
            <button 
                (click)="showRawNoiseChange.emit(!showRawNoise())"
                [class]="showRawNoise() ? 'bg-purple-600' : 'bg-white/10'"
                class="w-10 h-5 rounded-full relative transition-colors duration-200"
            >
                <div 
                    [class]="showRawNoise() ? 'translate-x-5' : 'translate-x-1'"
                    class="w-3 h-3 bg-white rounded-full absolute top-1 transition-transform duration-200"
                ></div>
            </button>
        </div>

        <div class="h-px bg-white/10 w-full my-2"></div>

        <!-- Speed -->
        <div>
           <div class="flex justify-between mb-1">
            <label class="text-xs text-gray-400">Flow Speed</label>
            <span class="text-xs text-gray-500">{{ speed() }}x</span>
          </div>
          <input 
            type="range" min="0.1" max="5.0" step="0.1" 
            [ngModel]="speed()" 
            (ngModelChange)="onSpeedChange($event)"
            class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
          />
        </div>

        <!-- Zoom -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="text-xs text-gray-400">Noise Scale</label>
            <span class="text-xs text-gray-500">{{ scale() }}</span>
          </div>
          <input 
            type="range" min="50" max="800" step="10" 
            [ngModel]="scale()" 
            (ngModelChange)="onScaleChange($event)"
            class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
          />
        </div>

        <!-- Particles -->
        <div>
           <div class="flex justify-between mb-1">
            <label class="text-xs text-gray-400">Density / Count</label>
            <span class="text-xs text-gray-500">{{ particleCount() }}</span>
          </div>
          <input 
            type="range" min="100" max="5000" step="100" 
            [ngModel]="particleCount()" 
            (ngModelChange)="onParticleChange($event)"
            class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
          />
        </div>
      </div>

       <!-- Mode Switcher -->
       <div class="mt-6 pt-4 border-t border-white/10">
          <label class="text-xs font-medium text-gray-300 uppercase tracking-wider mb-2 block">
            Visual Mode
          </label>
          <div class="grid grid-cols-2 gap-1 bg-white/5 rounded-lg p-1">
            <button (click)="setMode('flow')" [class]="getModeClass('flow')" class="py-1.5 text-xs font-medium rounded-md transition-all">Flow</button>
            <button (click)="setMode('grid')" [class]="getModeClass('grid')" class="py-1.5 text-xs font-medium rounded-md transition-all">Grid</button>
            <button (click)="setMode('waves')" [class]="getModeClass('waves')" class="py-1.5 text-xs font-medium rounded-md transition-all">Waves</button>
            <button (click)="setMode('bubbles')" [class]="getModeClass('bubbles')" class="py-1.5 text-xs font-medium rounded-md transition-all">Bubbles</button>
          </div>
       </div>

    </div>
  `
})
export class ControlsComponent {
  colors = input.required<string[]>();
  paletteName = input.required<string>();
  paletteDesc = input.required<string>();
  
  speed = input.required<number>();
  scale = input.required<number>();
  particleCount = input.required<number>();
  mode = input.required<VisualMode>();
  noiseType = input.required<NoiseType>();
  brightness = input.required<number>();
  contrast = input.required<number>();
  showRawNoise = input.required<boolean>();

  speedChange = output<number>();
  scaleChange = output<number>();
  particleCountChange = output<number>();
  modeChange = output<VisualMode>();
  noiseTypeChange = output<NoiseType>();
  brightnessChange = output<number>();
  contrastChange = output<number>();
  showRawNoiseChange = output<boolean>();
  
  newPalette = output<PaletteResponse>();

  promptText = '';
  
  availableNoiseTypes: NoiseType[] = ([
    'Box Noise', 'Blistered Turbulence', 'Buya', 'Cell Noise', 'Cranal', 
    'Dents', 'Displaced Turbulence', 'FBM', 'Hama', 'Luka', 'Mod Noise', 
    'Naki', 'Nutous', 'Ober', 'Pezo', 'Poxo', 'Sema', 'Stipl', 
    'Turbulence', 'VL Noise', 'Wavy Turbulence', 'Cell Voronoi', 
    'Displaced Voronoi', 'Sparse Convolution', 'Voronoi', 'Zada', 
    'Fire', 'Electric', 'Gaseous', 'Ridged Multi Fractal'
  ] as NoiseType[]).sort();

  constructor(public geminiService: GeminiService) {}

  async generateTheme() {
    if (!this.promptText.trim()) return;
    const result = await this.geminiService.generatePalette(this.promptText);
    if (result) {
      this.newPalette.emit(result);
    }
  }

  onSpeedChange(val: number) { this.speedChange.emit(val); }
  onScaleChange(val: number) { this.scaleChange.emit(val); }
  onParticleChange(val: number) { this.particleCountChange.emit(val); }
  onNoiseTypeChange(val: NoiseType) { this.noiseTypeChange.emit(val); }
  setMode(m: VisualMode) { this.modeChange.emit(m); }
  
  getModeClass(m: VisualMode) {
    return this.mode() === m 
        ? 'bg-white/10 text-white shadow-sm' 
        : 'text-gray-500 hover:text-gray-300';
  }
}
