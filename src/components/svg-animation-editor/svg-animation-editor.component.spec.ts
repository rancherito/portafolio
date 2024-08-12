import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgAnimationEditorComponent } from './svg-animation-editor.component';

describe('SvgAnimationEditorComponent', () => {
  let component: SvgAnimationEditorComponent;
  let fixture: ComponentFixture<SvgAnimationEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgAnimationEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvgAnimationEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
