import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { AnimationControlsComponent } from '../animation-controls/animation-controls.component';
import { AnimationService, Point } from '../animation.service';

@Component({
  selector: 'app-svg-animation-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    AnimationControlsComponent,
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
        <app-animation-controls
          [isPlaying]="isPlaying"
          [currentTime]="currentTime"
          [selectedKeyframe]="selectedKeyframe"
          (playToggled)="togglePlayback()"
          (resetClicked)="resetAnimation()"
          (keyframeRecorded)="recordKeyframe()"
          (timeChanged)="onTimeChange($event)"
          (keyframeSelected)="selectKeyframe($event)"
        ></app-animation-controls>
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
export class SvgAnimationEditorComponent implements OnInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  shape: Point[] = [];
  currentTime = 0;
  isPlaying = false;
  svgString = '';
  activePoint: number | null = null;
  selectedKeyframe: number | null = null;
  isDragging = false;

  readonly CANVAS_WIDTH = 300;
  readonly CANVAS_HEIGHT = 300;

  private animationFrameId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private animationService: AnimationService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.animationService.shape$.subscribe(shape => {
        this.shape = shape;
        this.drawCanvas();
      }),
      this.animationService.currentTime$.subscribe(time => {
        this.currentTime = time;
        this.drawCanvas();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    const prevTime = this.animationService.getPreviousKeyframe(this.currentTime);
    const nextTime = this.animationService.getNextKeyframe(this.currentTime);
    if (prevTime !== null && prevTime !== this.selectedKeyframe) {
      this.drawShape(ctx, this.animationService.interpolateShape(prevTime), 'rgba(128, 128, 128, 0.3)');
    }
    if (nextTime !== null && nextTime !== this.selectedKeyframe && nextTime !== this.currentTime) {
      this.drawShape(ctx, this.animationService.interpolateShape(nextTime), 'rgba(128, 128, 128, 0.3)');
    }

    // Draw current shape or selected keyframe shape
    this.drawShape(ctx, this.shape, 'blue');
  }

  drawShape(ctx: CanvasRenderingContext2D, points: Point[], color: string, lineWidth = 2) {
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

  handleCanvasMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const existingPointIndex = this.shape.findIndex(
      (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < 10
    );

    if (existingPointIndex !== -1) {
      this.activePoint = existingPointIndex;
      this.isDragging = true;
    } else {
      const newShape = [...this.shape, { x, y }];
      this.animationService.updateShape(newShape);
    }
  }

  handleCanvasMouseMove(event: MouseEvent) {
    if (this.isDragging && this.activePoint !== null) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newShape = [...this.shape];
      newShape[this.activePoint] = { x, y };
      this.animationService.updateShape(newShape);
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
      const elapsedTime = ((timestamp - startTime) / 1000) % this.animationService.TOTAL_DURATION;
      this.animationService.updateCurrentTime(elapsedTime);
      this.animationService.updateShape(this.animationService.interpolateShape(elapsedTime));
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  resetAnimation() {
    this.animationService.updateCurrentTime(0);
    this.animationService.updateShape(this.animationService.interpolateShape(0));
    this.isPlaying = false;
    this.selectedKeyframe = null;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  generateSVG() {
    this.svgString = this.animationService.generateSVG(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
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
    this.animationService.recordKeyframe(this.currentTime, this.shape);
  }

  onTimeChange(time: number) {
    this.animationService.updateCurrentTime(time);
    this.animationService.updateShape(this.animationService.interpolateShape(time));
    this.selectedKeyframe = null;
  }

  selectKeyframe(time: number) {
    this.selectedKeyframe = time;
    this.animationService.updateCurrentTime(time);
    this.animationService.updateShape(this.animationService.interpolateShape(time));
  }
}