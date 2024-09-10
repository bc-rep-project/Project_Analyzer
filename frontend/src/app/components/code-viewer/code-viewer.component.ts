import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Prism from 'prismjs';

// Import required PrismJS languages and plugins
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-typescript';
// import 'prismjs/components/prism-cpp'; // Import C++ grammar
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Import for loading indicator

@Component({
  selector: 'app-code-viewer',
  templateUrl: './code-viewer.component.html',
  styleUrls: ['./code-viewer.component.css'],
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule] // Add MatProgressSpinnerModule
})
export class CodeViewerComponent implements OnInit {
  @Input() code: string = '';
  @Input() language: string = 'typescript'; // Default language
  highlightedCode: string = ''; 
  highlightingError: boolean = false; 
  isLoading = false; // Add isLoading property

  ngOnInit(): void {
    this.highlightCode();
  }

  highlightCode() {
    this.isLoading = true;
    this.highlightingError = false;

    if (this.language === 'All Languages' || this.language.toLowerCase() === 'cpp') {
      // Bypass PrismJS for "All Languages" and C++
      this.highlightedCode = this.code; 
    } else if (Prism.languages[this.language]) {
      // Use PrismJS for other languages
      try {
        this.highlightedCode = Prism.highlight(this.code, Prism.languages[this.language], this.language);
      } catch (error) {
        console.error('Error highlighting code:', error);
        this.highlightingError = true;
        this.highlightedCode = this.code;
      } 
    } else {
      console.warn(`PrismJS grammar for language "${this.language}" not found.`);
      this.highlightedCode = this.code;
    }

    this.isLoading = false; // Hide loading indicator
  }
}