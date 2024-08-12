import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SvgAnimationEditorComponent } from "../components/svg-animation-editor/svg-animation-editor.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SvgAnimationEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'portafolio';
}
