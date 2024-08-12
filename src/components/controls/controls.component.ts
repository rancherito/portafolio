// controls.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatSliderModule, MatIconModule],
  template: `
    <div class="controls-container">
      <div class="button-group">
        <button mat-raised-button color="primary" (click)="playPauseClicked.emit()">
          <mat-icon>{{ isPlaying ? 'pause' : 'play_arrow' }}</mat-icon>
          {{ isPlaying ? 'Pause' : 'Play' }}
        </button>
        <button mat-raised-button color="warn" (click)="resetClicked.emit()">
          <mat-icon>replay</mat-icon>
          Reset
        </button>
        <button mat-raised-button color="accent" (click)="recordClicked.emit()">
          <mat-icon>fiber_manual_record</mat-icon>
          Record
        </button>
      </div>
      <mat-slider
        [min]="0"
        [max]="totalDuration"
        [step]="0.1"
        [displayWith]="formatSliderLabel"
        (change)="onTimeChange($event)"
      >
        <input matSliderThumb [(ngModel)]="currentTime" />
      </mat-slider>
      <div class="time-display">
        Time: {{ currentTime.toFixed(1) }}s / {{ totalDuration }}s
      </div>
    </div>
  `,
  styles: [`
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
  `]
})
export class ControlsComponent {
  @Input() isPlaying!: boolean;
  @Input() currentTime!: number;
  @Input() totalDuration!: number;

  @Output() playPauseClicked = new EventEmitter<void>();
  @Output() resetClicked = new EventEmitter<void>();
  @Output() recordClicked = new EventEmitter<void>();
  @Output() timeChanged = new EventEmitter<number>();

  onTimeChange(event: any) {
    this.timeChanged.emit(event.value);
  }

  formatSliderLabel(value: number): string {
    return value.toFixed(1) + 's';
  }
}