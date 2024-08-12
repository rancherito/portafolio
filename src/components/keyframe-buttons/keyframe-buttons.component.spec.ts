import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyframeButtonsComponent } from './keyframe-buttons.component';

describe('KeyframeButtonsComponent', () => {
  let component: KeyframeButtonsComponent;
  let fixture: ComponentFixture<KeyframeButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyframeButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyframeButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
