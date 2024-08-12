import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface Point {
  x: number;
  y: number;
  isGhost?: boolean;
}

@Component({
  selector: 'app-svg-animation-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSliderModule,
    MatCardModule,
    MatIconModule,
  ],
  template: `
    <mat-card class="editor-card">
      <mat-card-content>
        <canvas
          #canvas
          [attr.width]="CANVAS_WIDTH"
          [attr.height]="CANVAS_HEIGHT"
          class="editor-canvas"
          (mousedown)="handleCanvasMouseDown($event)"
          (mousemove)="handleCanvasMouseMove($event)"
          (mouseup)="handleCanvasMouseUp()"
          (mouseleave)="handleCanvasMouseUp()"
        >
        </canvas>
        <div class="controls-container">
          <div class="button-group">
            <button
              mat-raised-button
              color="primary"
              (click)="togglePlayback()"
            >
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
            [max]="TOTAL_DURATION"
            [step]="0.1"
            [displayWith]="formatSliderLabel"
            (change)="onTimeChange($event)"
          >
            <input matSliderThumb [(ngModel)]="currentTime" />
          </mat-slider>
          <div class="time-display">
            Time: {{ currentTime.toFixed(1) }}s / {{ TOTAL_DURATION }}s
          </div>
          <div class="keyframe-buttons">
            @for (time of getKeyframeTimes(); track time) {
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
      </mat-card-content>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="generateSVG()">
          <mat-icon>file_download</mat-icon>
          Generate SVG
        </button>
      </mat-card-actions>
    </mat-card>
    @if (svgString) {
    <mat-card class="svg-preview-card">
      <mat-card-content>
        <div class="svg-preview" [innerHTML]="svgString"></div>
      </mat-card-content>
    </mat-card>
    }
  `,
  styles: [
    `
      .editor-card {
        max-width: 600px;
        margin: 20px auto;
      }
      .editor-canvas {
        border: 2px solid #ccc;
        border-radius: 4px;
        cursor: crosshair;
        background-color: white;
        margin-bottom: 20px;
      }
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
      .svg-preview-card {
        max-width: 600px;
        margin: 20px auto;
      }
      .svg-preview {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
      }
    `,
  ],
})
export class SvgAnimationEditorComponent {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  shape: Point[] = [];
  keyframes: { [time: number]: Point[] } = { 0: [] };
  currentTime = 0;
  isPlaying = false;
  svgString = '';
  activePoint: number | null = null;
  selectedKeyframe: number | null = null;
  isDragging = false;

  readonly TOTAL_DURATION = 5; // 5 seconds
  readonly CANVAS_WIDTH = 300;
  readonly CANVAS_HEIGHT = 300;

  private animationFrameId: number | null = null;

  ngOnInit() {
    // Initialization logic here
  }

  ngAfterViewInit() {
    this.drawCanvas();
    this.updateSVG();
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  drawCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

    // Draw onion skin
    const prevTime = this.getPreviousKeyframe(this.currentTime);
    const nextTime = this.getNextKeyframe(this.currentTime);
    if (prevTime !== null && prevTime !== this.selectedKeyframe) {
      this.drawShape(ctx, this.keyframes[prevTime], 'rgba(128, 128, 128, 0.3)');
    }
    if (
      nextTime !== null &&
      nextTime !== this.selectedKeyframe &&
      nextTime !== this.currentTime
    ) {
      this.drawShape(ctx, this.keyframes[nextTime], 'rgba(128, 128, 128, 0.3)');
    }

    // Draw current shape or selected keyframe shape
    const shapeToShow =
      this.selectedKeyframe !== null
        ? this.keyframes[this.selectedKeyframe]
        : this.shape;
    this.drawShape(ctx, shapeToShow, 'blue');
  }

  drawShape(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    lineWidth = 2
  ) {
    if (points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point, i) => {
        if (i > 0) ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = index === this.activePoint ? 'red' : color;
        ctx.fill();
      });
    }
  }

  updateSVG() {
    const keyframeTimes = Object.keys(this.keyframes).sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );
    const maxPoints = Math.max(
      ...Object.values(this.keyframes).map((frame) => frame.length)
    );

    const animations = keyframeTimes
      .map((time, index) => {
        const nextTime =
          keyframeTimes[index + 1] || this.TOTAL_DURATION.toString();
        const duration = parseFloat(nextTime) - parseFloat(time);
        const fromPoints = this.normalizePoints(
          this.keyframes[parseFloat(time)],
          maxPoints
        );
        const toPoints = this.normalizePoints(
          this.keyframes[parseFloat(nextTime)] ||
            this.keyframes[parseFloat(time)],
          maxPoints
        );

        const fromStr = fromPoints.map((p) => `${p.x},${p.y}`).join(' ');
        const toStr = toPoints.map((p) => `${p.x},${p.y}`).join(' ');

        return `
        <animate
          attributeName="points"
          from="${fromStr}"
          to="${toStr}"
          dur="${duration}s"
          begin="${time}s"
          fill="freeze"
        />
      `;
      })
      .join('');

    const initialPoints = this.normalizePoints(this.keyframes[0], maxPoints)
      .map((p) => `${p.x},${p.y}`)
      .join(' ');

    this.svgString = `
      <svg width="${this.CANVAS_WIDTH}" height="${this.CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <polyline points="${initialPoints}" fill="none" stroke="black" stroke-width="2">
          ${animations}
        </polyline>
      </svg>
    `;
  }

  normalizePoints(points: Point[], targetLength: number): Point[] {
    if (points.length === targetLength) return points;
    const normalized = [...points];
    while (normalized.length < targetLength) {
      normalized.push({ ...normalized[normalized.length - 1], isGhost: true });
    }
    return normalized;
  }

  handleCanvasMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const shapeToEdit =
      this.selectedKeyframe !== null
        ? this.keyframes[this.selectedKeyframe]
        : this.shape;
    const existingPointIndex = shapeToEdit.findIndex(
      (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < 10
    );

    if (existingPointIndex !== -1) {
      this.activePoint = existingPointIndex;
      this.isDragging = true;
    } else {
      const newShape = [...shapeToEdit, { x, y }];
      if (this.selectedKeyframe !== null) {
        this.keyframes = {
          ...this.keyframes,
          [this.selectedKeyframe]: newShape,
        };
      } else {
        this.shape = newShape;
      }
    }
    this.drawCanvas();
  }

  handleCanvasMouseMove(event: MouseEvent) {
    if (this.isDragging && this.activePoint !== null) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (this.selectedKeyframe !== null) {
        const newKeyframes = { ...this.keyframes };
        newKeyframes[this.selectedKeyframe] = [
          ...newKeyframes[this.selectedKeyframe],
        ];
        newKeyframes[this.selectedKeyframe][this.activePoint] = { x, y };
        this.keyframes = newKeyframes;
      } else {
        const newShape = [...this.shape];
        newShape[this.activePoint] = { x, y };
        this.shape = newShape;
      }
      this.drawCanvas();
    }
  }

  handleCanvasMouseUp() {
    this.activePoint = null;
    this.isDragging = false;
  }

  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    this.selectedKeyframe = null;
    if (this.isPlaying) {
      this.playAnimation();
    } else {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  playAnimation() {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime =
        ((timestamp - startTime) / 1000) % this.TOTAL_DURATION;
      this.currentTime = elapsedTime;
      this.shape = this.interpolateShape(elapsedTime);
      this.drawCanvas();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  resetAnimation() {
    this.currentTime = 0;
    this.shape = this.keyframes[0] || [];
    this.isPlaying = false;
    this.selectedKeyframe = null;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.drawCanvas();
  }

  generateSVG() {
    const blob = new Blob([this.svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  recordKeyframe() {
    this.keyframes = { ...this.keyframes, [this.currentTime]: [...this.shape] };
    this.updateSVG();
  }

  getPreviousKeyframe(time: number): number | null {
    const times = Object.keys(this.keyframes)
      .map(Number)
      .sort((a, b) => b - a);
    return times.find((t) => t <= time) || null;
  }

  getNextKeyframe(time: number): number | null {
    const times = Object.keys(this.keyframes)
      .map(Number)
      .sort((a, b) => a - b);
    return times.find((t) => t > time) || null;
  }

  interpolateShape(time: number): Point[] {
    const prevTime = this.getPreviousKeyframe(time);
    const nextTime = this.getNextKeyframe(time);
    if (prevTime === null) return this.keyframes[0] || [];
    if (nextTime === null) return this.keyframes[prevTime];

    const prevShape = this.keyframes[prevTime];
    const nextShape = this.keyframes[nextTime];
    const maxPoints = Math.max(prevShape.length, nextShape.length);

    const normalizedPrev = this.normalizePoints(prevShape, maxPoints);
    const normalizedNext = this.normalizePoints(nextShape, maxPoints);

    const t = (time - prevTime) / (nextTime - prevTime);

    return normalizedPrev.map((point, i) => ({
      x: point.x + (normalizedNext[i].x - point.x) * t,
      y: point.y + (normalizedNext[i].y - point.y) * t,
      isGhost: point.isGhost && normalizedNext[i].isGhost,
    }));
  }

  selectKeyframe(time: number) {
    this.selectedKeyframe = time;
    this.shape = this.keyframes[time];
    this.currentTime = time;
    this.drawCanvas();
  }

  onTimeChange($event: Event) {
    this.shape = this.interpolateShape(this.currentTime);
    this.selectedKeyframe = null;
    this.drawCanvas();
  }
  getKeyframeTimes(): string[] {
    return Object.keys(this.keyframes).sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );
  }
  formatSliderLabel(value: number): string {
    return value.toFixed(1) + 's';
  }
}
