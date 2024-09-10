import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { MatInputModule } from '@angular/material/input'; // Import required Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css'],
  standalone: true, // Make the component standalone
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ]
})
export class LanguageSelectorComponent {
  @Output() languageSelected = new EventEmitter<string>();
  selectedLanguage: string = 'All Languages';
  languages: string[] = ['All Languages', 'Python', 'Java', 'TypeScript', 'C++'];

  onLanguageSelect(language: string): void {
    this.selectedLanguage = language;
    this.languageSelected.emit(language);
  }
}