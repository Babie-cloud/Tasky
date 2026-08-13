import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';

import { TacheCard } from './tache-card';

@Component({ standalone: true, template: '' })
class DummyDashboardComponent {}

describe('TacheCard', () => {
  let component: TacheCard;
  let fixture: ComponentFixture<TacheCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacheCard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Fournit la route /dashboard-user pour éviter l'erreur NG04002
        provideRouter([
          { path: 'dashboard-user', component: DummyDashboardComponent }
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ boardId: '12345' }), // boardId simulé pour éviter la redirection par défaut
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