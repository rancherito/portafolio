// svg-preview.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-svg-preview',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="svg-preview-card" *ngIf="svgString">
      <mat-card-content>
        <div class="svg-preview" [innerHTML]="svgString"></div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .svg-preview-card {
      max-width: 600px;
      margin: 20px auto;
    }
    .svg-preview {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
    }
  `]
})
export class SvgPreviewComponent {
  @Input() svgString: string = '';
}