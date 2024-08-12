import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Point {
  x: number;
  y: number;
  isGhost?: boolean;
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas
      #canvas
      [attr.width]="width"
      [attr.height]="height"
      class="editor-canvas"
      (mousedown)="handleCanvasMouseDown($event)"
      (mousemove)="handleCanvasMouseMove($event)"
      (mouseup)="handleCanvasMouseUp()"
      (mouseleave)="handleCanvasMouseUp()"
    ></canvas>
  `,
  styles: [`
    .editor-canvas {
      border: 2px solid #ccc;
      border-radius: 4px;
      cursor: crosshair;
      background-color: white;
      margin-bottom: 20px;
    }
  `]
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() width!: number;
  @Input() height!: number;
  @Input() shape!: Point[];
  @Input() selectedKeyframe: number | null = null;
  @Input() keyframes!: { [time: number]: Point[] };
  @Input() currentTime!: number;

  @Output() pointAdded = new EventEmitter<Point>();
  @Output() pointMoved = new EventEmitter<{ index: number, point: Point }>();

  private activePoint: number | null = null;
  private isDragging = false;

  ngAfterViewInit() {
    this.drawCanvas();
  }

  drawCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.width, this.height);

    // Draw onion skin
    const prevTime = this.getPreviousKeyframe(this.currentTime);
    const nextTime = this.getNextKeyframe(this.currentTime);
    if (prevTime !== null && prevTime !== this.selectedKeyframe) {
      this.drawShape(ctx, this.keyframes[prevTime], 'rgba(128, 128, 128, 0.3)');
    }
    if (nextTime !== null && nextTime !== this.selectedKeyframe && nextTime !== this.currentTime) {
      this.drawShape(ctx, this.keyframes[nextTime], 'rgba(128, 128, 128, 0.3)');
    }

    // Draw current shape or selected keyframe shape
    const shapeToShow = this.selectedKeyframe !== null ? this.keyframes[this.selectedKeyframe] : this.shape;
    this.drawShape(ctx, shapeToShow, 'blue');
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

    const shapeToEdit = this.selectedKeyframe !== null ? this.keyframes[this.selectedKeyframe] : this.shape;
    const existingPointIndex = shapeToEdit.findIndex(p => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < 10);

    if (existingPointIndex !== -1) {
      this.activePoint = existingPointIndex;
      this.isDragging = true;
    } else {
      this.pointAdded.emit({ x, y });
    }
    this.drawCanvas();
  }

  handleCanvasMouseMove(event: MouseEvent) {
    if (this.isDragging && this.activePoint !== null) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      this.pointMoved.emit({ index: this.activePoint, point: { x, y } });
      this.drawCanvas();
    }
  }

  handleCanvasMouseUp() {
    this.activePoint = null;
    this.isDragging = false;
  }

  private getPreviousKeyframe(time: number): number | null {
    const times = Object.keys(this.keyframes).map(Number).sort((a, b) => b - a);
    return times.find(t => t <= time) || null;
  }

  private getNextKeyframe(time: number): number | null {
    const times = Object.keys(this.keyframes).map(Number).sort((a, b) => a - b);
    return times.find(t => t > time) || null;
  }
}