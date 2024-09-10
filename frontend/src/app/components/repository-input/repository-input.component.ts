import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { MatInputModule } from '@angular/material/input'; // Import required Material modules
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-repository-input',
  templateUrl: './repository-input.component.html',
  styleUrls: ['./repository-input.component.css'],
  standalone: true, // Make the component standalone
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ]
})
export class RepositoryInputComponent {
  repoUrl = new FormControl('', [Validators.required]);
  @Output() analyzeRepo = new EventEmitter<string>();

  onSubmit(event: Event) {
    event.preventDefault(); // Prevent default form submission
    if (this.repoUrl.valid) {
      this.analyzeRepo.emit(this.repoUrl.value || ''); 
      this.repoUrl.reset();
    }
  }
}