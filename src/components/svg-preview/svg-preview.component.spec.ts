import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgPreviewComponent } from './svg-preview.component';

describe('SvgPreviewComponent', () => {
  let component: SvgPreviewComponent;
  let fixture: ComponentFixture<SvgPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvgPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
