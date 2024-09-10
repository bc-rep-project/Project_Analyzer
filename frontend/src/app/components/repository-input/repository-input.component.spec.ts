import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepositoryInputComponent } from './repository-input.component';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('RepositoryInputComponent', () => {
  let component: RepositoryInputComponent;
  let fixture: ComponentFixture<RepositoryInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryInputComponent, ReactiveFormsModule, BrowserAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoryInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the repository URL on submit', () => {
    spyOn(component.analyzeRepo, 'emit');
    component.repoUrl.setValue('https://github.com/test/repo');
    component.onSubmit();
    expect(component.analyzeRepo.emit).toHaveBeenCalledWith('https://github.com/test/repo');
  });

  // ... add more tests for validation, error handling, etc.
});