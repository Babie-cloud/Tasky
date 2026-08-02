import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TacheCard } from './tache-card';

describe('TacheCard', () => {
  let component: TacheCard;
  let fixture: ComponentFixture<TacheCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacheCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TacheCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
