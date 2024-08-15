import { Routes } from '@angular/router';
import { MathTutorComponent } from '../components/math-tutor/math-tutor.component';
import { AnimationControlsComponent } from '../components/animation-controls/animation-controls.component';
import { HomeComponent } from '../components/home/home.component';

export const routes: Routes = [
	{
		path: '',
		component: HomeComponent,
	},
    {
        path: 'api-test',
        component: MathTutorComponent,
    },
    {
        path: 'animation-svg',
        component: AnimationControlsComponent,
    },
];
