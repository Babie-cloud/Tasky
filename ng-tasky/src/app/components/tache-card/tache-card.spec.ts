import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { TacheCard } from './tache-card';

describe('TacheCard', () => {
  let component: TacheCard;
  let fixture: ComponentFixture<TacheCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacheCard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // RouterLink (utilisé dans le template pour le bouton "Ajouter une tâche")
        // a besoin d'un ActivatedRoute injectable même sans navigation réelle.
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParams: {},
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TacheCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});