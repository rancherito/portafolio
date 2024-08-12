import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-keyframe-buttons',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div class="keyframe-buttons">
      @for (time of getKeyframeTimes(); track time) {
        <button
          mat-mini-fab
          [color]="selectedKeyframe === +time ? 'accent' : ''"
          (click)="onKeyframeSelected(+time)"
        >
          {{ (+time).toFixed(1) }}
        </button>
      }
    </div>
  `,
  styles: [`
    .keyframe-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
  `]
})
export class KeyframeButtonsComponent {
  @Input() keyframes!: { [time: number]: any[] };
  @Input() selectedKeyframe: number | null = null;
  @Output() keyframeSelected = new EventEmitter<number>();

  getKeyframeTimes(): string[] {
    return Object.keys(this.keyframes).sort((a, b) => parseFloat(a) - parseFloat(b));
  }

  onKeyframeSelected(time: number) {
    this.keyframeSelected.emit(time);
  }
}