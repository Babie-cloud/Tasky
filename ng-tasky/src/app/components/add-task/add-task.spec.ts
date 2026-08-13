import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { AddTask } from './add-task';

@Component({ standalone: true, template: '' })
class DummyDashboardComponent {}

describe('AddTask', () => {
  let component: AddTask;
  let fixture: ComponentFixture<AddTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTask],
      providers: [
        provideRouter([
          { path: 'dashboard-user', component: DummyDashboardComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddTask);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});