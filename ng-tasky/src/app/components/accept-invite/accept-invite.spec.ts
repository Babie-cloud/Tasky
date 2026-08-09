import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AcceptInvite } from './accept-invite';

describe('AcceptInvite', () => {
  let component: AcceptInvite;
  let fixture: ComponentFixture<AcceptInvite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptInvite],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParams: {},
              // Le composant lit ?token=... ici ; on simule "aucun token" pour ce test basique
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptInvite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});