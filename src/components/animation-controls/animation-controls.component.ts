import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { AnimationService } from '../animation.service';

@Component({
  selector: 'app-animation-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSliderModule,
    MatIconModule,
  ],
  template: `
    <div class="controls-container">
      <div class="button-group">
        <button mat-raised-button color="primary" (click)="togglePlayback()">
          <mat-icon>{{ isPlaying ? 'pause' : 'play_arrow' }}</mat-icon>
          {{ isPlaying ? 'Pause' : 'Play' }}
        </button>
        <button mat-raised-button color="warn" (click)="resetAnimation()">
          <mat-icon>replay</mat-icon>
          Reset
        </button>
        <button mat-raised-button color="accent" (click)="recordKeyframe()">
          <mat-icon>fiber_manual_record</mat-icon>
          Record
        </button>
      </div>
      <mat-slider
        [min]="0"
        [max]="animationService.TOTAL_DURATION"
        [step]="0.1"
        [displayWith]="formatSliderLabel"
        (change)="onTimeChange($event)"
      >
        <input matSliderThumb [(ngModel)]="currentTime" />
      </mat-slider>
      <div class="time-display">
        Time: {{ currentTime.toFixed(1) }}s / {{ animationService.TOTAL_DURATION }}s
      </div>
      <div class="keyframe-buttons">
        @for (time of animationService.getKeyframeTimes(); track time) {
        <button
          mat-mini-fab
          [color]="selectedKeyframe === +time ? 'accent' : ''"
          (click)="selectKeyframe(+time)"
        >
          {{ (+time).toFixed(1) }}
        </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .controls-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .button-group {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .time-display {
        text-align: center;
        font-size: 14px;
      }
      .keyframe-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }
    `,
  ],
})
export class AnimationControlsComponent {
  @Input() isPlaying = false;
  @Input() currentTime = 0;
  @Input() selectedKeyframe: number | null = null;

  @Output() playToggled = new EventEmitter<void>();
  @Output() resetClicked = new EventEmitter<void>();
  @Output() keyframeRecorded = new EventEmitter<void>();
  @Output() timeChanged = new EventEmitter<number>();
  @Output() keyframeSelected = new EventEmitter<number>();

  constructor(public animationService: AnimationService) {}

  togglePlayback() {
    this.playToggled.emit();
  }

  resetAnimation() {
    this.resetClicked.emit();
  }

  recordKeyframe() {
    this.keyframeRecorded.emit();
  }

  onTimeChange(event: Event) {
    this.timeChanged.emit(this.currentTime);
  }

  selectKeyframe(time: number) {
    this.keyframeSelected.emit(time);
  }

  formatSliderLabel(value: number): string {
    return value.toFixed(1) + 's';
  }
}