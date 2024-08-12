import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Point {
  x: number;
  y: number;
  isGhost?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private keyframesSubject = new BehaviorSubject<{ [time: number]: Point[] }>({ 0: [] });
  keyframes$ = this.keyframesSubject.asObservable();

  private shapeSubject = new BehaviorSubject<Point[]>([]);
  shape$ = this.shapeSubject.asObservable();

  private currentTimeSubject = new BehaviorSubject<number>(0);
  currentTime$ = this.currentTimeSubject.asObservable();

  readonly TOTAL_DURATION = 5; // 5 seconds

  constructor() {}

  updateKeyframes(keyframes: { [time: number]: Point[] }) {
    this.keyframesSubject.next(keyframes);
  }

  updateShape(shape: Point[]) {
    this.shapeSubject.next(shape);
  }

  updateCurrentTime(time: number) {
    this.currentTimeSubject.next(time);
  }

  recordKeyframe(time: number, shape: Point[]) {
    const currentKeyframes = this.keyframesSubject.value;
    this.updateKeyframes({ ...currentKeyframes, [time]: [...shape] });
  }

  getPreviousKeyframe(time: number): number | null {
    const times = Object.keys(this.keyframesSubject.value)
      .map(Number)
      .sort((a, b) => b - a);
    return times.find((t) => t <= time) || null;
  }

  getNextKeyframe(time: number): number | null {
    const times = Object.keys(this.keyframesSubject.value)
      .map(Number)
      .sort((a, b) => a - b);
    return times.find((t) => t > time) || null;
  }

  interpolateShape(time: number): Point[] {
    const keyframes = this.keyframesSubject.value;
    const prevTime = this.getPreviousKeyframe(time);
    const nextTime = this.getNextKeyframe(time);
    if (prevTime === null) return keyframes[0] || [];
    if (nextTime === null) return keyframes[prevTime];

    const prevShape = keyframes[prevTime];
    const nextShape = keyframes[nextTime];
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

  private normalizePoints(points: Point[], targetLength: number): Point[] {
    if (points.length === targetLength) return points;
    const normalized = [...points];
    while (normalized.length < targetLength) {
      normalized.push({ ...normalized[normalized.length - 1], isGhost: true });
    }
    return normalized;
  }

  getKeyframeTimes(): string[] {
    return Object.keys(this.keyframesSubject.value).sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );
  }

  generateSVG(width: number, height: number): string {
    const keyframeTimes = this.getKeyframeTimes();
    const maxPoints = Math.max(
      ...Object.values(this.keyframesSubject.value).map((frame) => frame.length)
    );

    const animations = keyframeTimes
      .map((time, index) => {
        const nextTime =
          keyframeTimes[index + 1] || this.TOTAL_DURATION.toString();
        const duration = parseFloat(nextTime) - parseFloat(time);
        const fromPoints = this.normalizePoints(
          this.keyframesSubject.value[parseFloat(time)],
          maxPoints
        );
        const toPoints = this.normalizePoints(
          this.keyframesSubject.value[parseFloat(nextTime)] ||
            this.keyframesSubject.value[parseFloat(time)],
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

    const initialPoints = this.normalizePoints(this.keyframesSubject.value[0], maxPoints)
      .map((p) => `${p.x},${p.y}`)
      .join(' ');

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <polyline points="${initialPoints}" fill="none" stroke="black" stroke-width="2">
          ${animations}
        </polyline>
      </svg>
    `;
  }
}