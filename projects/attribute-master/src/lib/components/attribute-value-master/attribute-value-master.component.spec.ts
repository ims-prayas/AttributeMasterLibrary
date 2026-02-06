import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributeValueMasterComponent } from './attribute-value-master.component';

describe('AttributeValueMasterComponent', () => {
  let component: AttributeValueMasterComponent;
  let fixture: ComponentFixture<AttributeValueMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttributeValueMasterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttributeValueMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
