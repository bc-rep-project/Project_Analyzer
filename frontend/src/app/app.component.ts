// frontend/src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnalysisService } from './services/analysis.service';
import { AuthService } from './services/auth.service';
import { D3GraphService } from './shared/d3-graph.service';
import { CommonModule } from '@angular/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Output, EventEmitter } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { RepositoryInputComponent } from './components/repository-input/repository-input.component';
import { AnalysisResultsComponent } from './components/analysis-results/analysis-results.component';
import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
import { ComplexityMetricsComponent } from './components/complexity-metrics/complexity-metrics.component';
import { CodeViewerComponent } from './components/code-viewer/code-viewer.component';
import { MatSelectionList, MatListOption } from '@angular/material/list';
import { ComplexitySummaryComponent } from './components/complexity-summary/complexity-summary.component';

interface AnalysisResult {
  nodes: LanguageAnalysisNode[];
  links: any[];
  success: boolean;
  messages: string[];
  id?: number;
}

interface LanguageAnalysisNode {
  id: string;
  type: string;
  parent?: string;
  complexity?: number;
  code?: string;
}

interface LanguageAnalysis {
  language: string;
  nodes: LanguageAnalysisNode[]; 
  links: any[];
}

interface AnalysisResponse {
  success: boolean;
  messages: string[];
  analysis_id?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RepositoryInputComponent,
    AnalysisResultsComponent,
    LanguageSelectorComponent,
    ComplexityMetricsComponent,
    CodeViewerComponent,
    MatProgressSpinnerModule,
    MatSliderModule,
    ComplexitySummaryComponent,
    FormsModule
  ]
})
export class AppComponent implements OnInit {
  repoUrl = '';
  selectedLanguage = 'python'; // Default language
  analysisId: number | undefined = undefined;
  errorMessage: string | null = null;
  isLoading = false;
  analysisData: LanguageAnalysis | null = null;
  analysisResults: AnalysisResult | null = null; 
  selectedCode: string = '';
  languageAnalyses: LanguageAnalysis[] = []; 
  selectedLanguageAnalysis: LanguageAnalysis | undefined;
  complexityThreshold = 5;

  constructor(
    private route: ActivatedRoute,
    private analysisService: AnalysisService,
    //to make private
    public d3GraphService: D3GraphService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.repoUrl = params['repoUrl'] || '';
      this.selectedLanguage = params['language'] || this.selectedLanguage;
      if (this.repoUrl) {
        this.analyzeRepository();
      }
    });
  }

  analyzeRepository() {
    this.isLoading = true;
    this.errorMessage = null;
  
    this.analysisService.analyzeRepository(this.repoUrl)
      .subscribe({
        next: (data: AnalysisResult) => {
          this.isLoading = false;
          if (data.success) {
            this.analysisResults = data; // Assign the data directly
            // ... other logic to extract analysisId if needed ...
          } else {
            this.errorMessage = data.messages.join('\n');
          }
        },
        error: (error: HttpErrorResponse) => { // Use HttpErrorResponse
          this.isLoading = false;
          if (error.error && error.error.error && error.error.error.message) {
            this.errorMessage = error.error.error.message; // Extract error message
          } else {
            this.errorMessage = 'An unknown error occurred.';
          }
        }
      });
  }

  fetchAnalysisData(): void {
    if (this.analysisId && this.selectedLanguage) {
      this.isLoading = true;
      this.errorMessage = null;
  
      this.analysisService.getLanguageAnalysis(this.analysisId, this.selectedLanguage) // Pass selectedLanguage
        .pipe(
          catchError(error => {
            this.isLoading = false;
            this.errorMessage = `Error fetching ${this.selectedLanguage} analysis: ${error.message || 'Unknown error'}`;
            console.error(error);
            return throwError(() => error); 
          })
        )
        .subscribe((data: LanguageAnalysis | LanguageAnalysis[]) => { // Correct type here
          this.isLoading = false;
          if (Array.isArray(data)) {
            // Handle array response
            this.analysisData = data.length > 0 ? data[0] : null; // Get the first element if available
          } else {
            // Handle single object response
            this.analysisData = data;
          }
          this.createGraph();
        });
      }
  }

  filterGraph() {
    this.d3GraphService.filterNodesByComplexity(this.complexityThreshold);
  }

  createGraph() {
    if (this.analysisData && this.selectedLanguage) {
      this.d3GraphService.createGraph(this.analysisData, this.selectedLanguage + 'Graph');
    } else {
      this.errorMessage = "Error fetching graph data.";
      console.error("Analysis data or selected language is not available.");
    }
  }

  onLanguageSelected(language: string): void {
    this.selectedLanguage = language;
    this.selectedLanguageAnalysis = this.languageAnalyses.find(la => la.language === language);
    this.fetchAnalysisData(); // Fetch data for the selected language
  }

  onAnalyzeRepo(repoUrl: string): void {
    console.log(`Analyzing repository: ${repoUrl}`);
    if (this.authService.getToken()) {
      this.repoUrl = repoUrl;
      this.errorMessage = null; 
      this.isLoading = true; 
      this.analysisService.analyzeRepository(repoUrl)
        .subscribe({
          next: (data: AnalysisResult) => {
            console.log('Analysis successful:', data);
            this.isLoading = false; 
            this.analysisResults = data;
            if (data.id) {
              this.analysisId = data.id;
              this.fetchLanguageAnalyses(this.analysisId); 
              this.analysisIdChange.emit(this.analysisId); 
            } else {
              this.errorMessage = "Analysis failed: No ID returned";
            }
          },
          error: (error) => {
            console.error('Analysis failed:', error);
            this.isLoading = false; 
            this.errorMessage = error.message; 
          }
        })
      } else {
        // Redirect to login or show a message
        console.error('User must be logged in to analyze repositories.');
      };
  }

  fetchLanguageAnalyses(analysisId: number): void {
    console.log(`Fetching language analyses for analysis ID: ${analysisId}`);
    this.isLoading = true;
    this.analysisService.getLanguageAnalysis(analysisId) // No language argument here
      .subscribe({
        next: (data: LanguageAnalysis | LanguageAnalysis[]) => {
          this.isLoading = false;
          if (Array.isArray(data)) {
            this.languageAnalyses = data;
          } else {
            this.languageAnalyses = [data]; // Wrap single analysis in an array
          }
          this.updateSelectedCode();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message;
        }
      });
  }

  getCodeForLanguage(language: string): string {
    const languageAnalysis = this.languageAnalyses.find(la => la.language === language);
    return languageAnalysis ? languageAnalysis.nodes.map(node => node.code || '').join('\n') : '';
  }

  getSelectedCode(selectedOptions: MatListOption[]): string {
    if (!this.selectedLanguageAnalysis) {
      return '';
    }
    const selectedNodes = selectedOptions.map(option => this.selectedLanguageAnalysis!.nodes.find(node => node.id === option.value));
    return selectedNodes.map(node => node?.code || '').join('\n');
  }

  updateSelectedCode(): void {
    if (this.analysisResults && this.languageAnalyses.length > 0) {
      if (this.selectedLanguage === 'All Languages') {
        this.selectedCode = this.languageAnalyses.map(la =>
          la.nodes.map((node: LanguageAnalysisNode) => node.code || '').join('\n')
        ).join('\n');
      } else {
        const selectedLanguageAnalysis = this.languageAnalyses.find(la => la.language === this.selectedLanguage);
        this.selectedCode = selectedLanguageAnalysis
          ? selectedLanguageAnalysis.nodes.map((node: LanguageAnalysisNode) => node.code || '').join('\n')
          : '';
      }
    } else {
      this.selectedCode = '';
    }
  }
  // --- Add an Output EventEmitter for analysisId ---
  @Output() analysisIdChange = new EventEmitter<number>();
}



// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { AnalysisService } from './services/analysis.service';
// import { D3GraphService } from './shared/d3-graph.service';
// import { CommonModule } from '@angular/common';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { FormsModule } from '@angular/forms';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSliderModule } from '@angular/material/slider';
// import { RepositoryInputComponent } from './components/repository-input/repository-input.component';
// import { AnalysisResultsComponent } from './components/analysis-results/analysis-results.component';
// import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
// import { ComplexityMetricsComponent } from './components/complexity-metrics/complexity-metrics.component';
// import { CodeViewerComponent } from './components/code-viewer/code-viewer.component';

// interface AnalysisResult {
//   nodes: LanguageAnalysisNode[];
//   links: any[];
//   success: boolean;
//   messages: string[];
//   id?: number;
// }

// interface LanguageAnalysisNode {
//   id: string;
//   type: string;
//   parent?: string;
//   complexity?: number;
//   code?: string;
// }

// interface LanguageAnalysis {
//   language: string;
//   nodes: LanguageAnalysisNode[]; 
//   links: any[];
// }

// interface AnalysisResponse {
//   success: boolean;
//   messages: string[];
//   analysis_id?: number;
// }

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css'],
//   standalone: true,
//   imports: [
//     CommonModule,
//     RepositoryInputComponent,
//     AnalysisResultsComponent,
//     LanguageSelectorComponent,
//     ComplexityMetricsComponent,
//     CodeViewerComponent,
//     MatProgressSpinnerModule,
//     MatSliderModule,
//     FormsModule
//   ]
// })
// export class AppComponent implements OnInit {
//   repoUrl = '';
//   selectedLanguage = 'python'; // Default language
//   analysisId: number | undefined = undefined;
//   errorMessage: string | null = null;
//   isLoading = false;
//   analysisData: LanguageAnalysis | null = null;
//   analysisResults: AnalysisResult | null = null; 
//   selectedCode: string = '';
//   languageAnalyses: LanguageAnalysis[] = []; 
//   selectedLanguageAnalysis: LanguageAnalysis | undefined;
//   complexityThreshold = 5;

//   constructor(
//     private route: ActivatedRoute,
//     private analysisService: AnalysisService,
//     //to make public
//     public d3GraphService: D3GraphService
//   ) { }

//   ngOnInit(): void {
//     this.route.queryParams.subscribe(params => {
//       this.repoUrl = params['repoUrl'] || '';
//       this.selectedLanguage = params['language'] || this.selectedLanguage;
//       if (this.repoUrl) {
//         this.analyzeRepository();
//       }
//     });
//   }

//   analyzeRepository() {
//     this.isLoading = true;
//     this.errorMessage = null;
  
//     this.analysisService.analyzeRepository(this.repoUrl)
//       .subscribe({
//         next: (data: AnalysisResult) => {
//           this.isLoading = false;
//           if (data.success) {
//             this.analysisResults = data; // Assign the data directly
//             // ... other logic to extract analysisId if needed ...
//           } else {
//             this.errorMessage = data.messages.join('\n');
//           }
//         },
//         error: (error) => {
//           this.isLoading = false;
//           this.errorMessage = error.message;
//         }
//       });
//   }

//   fetchAnalysisData(): void {
//     if (this.analysisId) {
//       this.isLoading = true;
//       this.errorMessage = null;

//       let analysisObservable: Observable<LanguageAnalysis>;

//       switch (this.selectedLanguage) {
//         case 'python':
//           analysisObservable = this.analysisService.getPythonAnalysis(this.analysisId);
//           break;
//         case 'java':
//           analysisObservable = this.analysisService.getJavaAnalysis(this.analysisId);
//           break;
//         case 'cpp':
//           analysisObservable = this.analysisService.getCppAnalysis(this.analysisId);
//           break;
//         case 'typescript':
//           analysisObservable = this.analysisService.getTypescriptAnalysis(this.analysisId);
//           break;
//         default:
//           console.error("Unsupported language:", this.selectedLanguage);
//           this.isLoading = false;
//           this.errorMessage = "Unsupported language: " + this.selectedLanguage;
//           return;
//       }

//       analysisObservable.pipe(
//         catchError(error => {
//           this.isLoading = false;
//           this.errorMessage = "Error fetching " + this.selectedLanguage + " analysis: " + error;
//           console.error(error);
//           return throwError(() => error);
//         })
//       ).subscribe((data: LanguageAnalysis) => {
//         this.isLoading = false;
//         this.analysisData = data;
//         this.createGraph();
//       });

//     } else {
//       this.isLoading = false;
//       this.errorMessage = "Analysis ID not available";
//     }
//   }

//   filterGraph() {
//     this.d3GraphService.filterNodesByComplexity(this.complexityThreshold);
//   }

//   createGraph() {
//     if (this.analysisData && this.selectedLanguage) {
//       this.d3GraphService.createGraph(this.analysisData, this.selectedLanguage + 'Graph');
//     } else {
//       this.errorMessage = "Error fetching graph data.";
//       console.error("Analysis data or selected language is not available.");
//     }
//   }

//   onLanguageSelected(language: string): void {
//     this.selectedLanguage = language;
//     this.selectedLanguageAnalysis = this.languageAnalyses.find(la => la.language === language);
//     this.fetchAnalysisData(); // Fetch data for the selected language
//   }

//   onAnalyzeRepo(repoUrl: string): void {
//     this.repoUrl = repoUrl;
//     this.errorMessage = null; 
//     this.isLoading = true; 
//     this.analysisService.analyzeRepository(repoUrl)
//       .subscribe({
//         next: (data: AnalysisResult) => {
//           this.isLoading = false; 
//           this.analysisResults = data;
//           if (data.id) {
//             this.analysisId = data.id;
//             this.fetchLanguageAnalyses(this.analysisId); 
//           } else {
//             this.errorMessage = "Analysis failed: No ID returned"; 
//           }
//         },
//         error: (error) => {
//           this.isLoading = false; 
//           this.errorMessage = error.message; 
//         }
//       });
//   }

//   fetchLanguageAnalyses(analysisId: number): void {
//     this.isLoading = true;
//     this.analysisService.getLanguageAnalysis(analysisId)
//       .subscribe({
//         next: (data: LanguageAnalysis[]) => {
//           this.isLoading = false;
//           this.languageAnalyses = data;
//           this.updateSelectedCode();
//         },
//         error: (error) => {
//           this.isLoading = false;
//           this.errorMessage = error.message;
//         }
//       });
//   }

//   updateSelectedCode(): void {
//     if (this.analysisResults && this.languageAnalyses.length > 0) {
//       if (this.selectedLanguage === 'All Languages') {
//         this.selectedCode = this.languageAnalyses.map(la =>
//           la.nodes.map((node: LanguageAnalysisNode) => node.code || '').join('\n')
//         ).join('\n');
//       } else {
//         const selectedLanguageAnalysis = this.languageAnalyses.find(la => la.language === this.selectedLanguage);
//         this.selectedCode = selectedLanguageAnalysis
//           ? selectedLanguageAnalysis.nodes.map((node: LanguageAnalysisNode) => node.code || '').join('\n')
//           : '';
//       }
//     } else {
//       this.selectedCode = '';
//     }
//   }
// }



// import { Component } from '@angular/core';
// import { AnalysisService } from './services/analysis.service';
// import { CommonModule } from '@angular/common'; 
// import { RepositoryInputComponent } from './components/repository-input/repository-input.component';
// import { AnalysisResultsComponent } from './components/analysis-results/analysis-results.component';
// import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
// import { ComplexityMetricsComponent } from './components/complexity-metrics/complexity-metrics.component';
// import { CodeViewerComponent } from './components/code-viewer/code-viewer.component';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// interface AnalysisResult {
//   id: number;
//   repo_url: string;
//   created_at: string;
//   status: string;
//   // ... other properties based on your backend API response
// }

// interface LanguageAnalysis {
//   language: string;
//   nodes: { id: string; type: string; complexity: number; code?: string; parent?: string }[];
//   links: { source: string; target: string; parent?: string }[];
//   // ... other properties based on your backend API response
// }

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css'],
//   standalone: true,
//   imports: [
//     CommonModule,
//     RepositoryInputComponent,
//     AnalysisResultsComponent,
//     LanguageSelectorComponent,
//     ComplexityMetricsComponent,
//     CodeViewerComponent,
//     MatProgressSpinnerModule // Add MatProgressSpinnerModule
//   ]
// })
// export class AppComponent {
//   analysisId: number | null = null;
//   selectedCode: string = '';
//   selectedLanguage: string = 'All Languages';
//   complexityMetrics: any[] = [];
//   analysisResults: AnalysisResult | null = null;
//   languageAnalyses: LanguageAnalysis[] = [];
//   isLoading = false; // Add isLoading property
//   errorMessage: string | null = null; // Add errorMessage property

//   constructor(private analysisService: AnalysisService) {}

//   onAnalyzeRepo(repoUrl: string): void {
//     this.errorMessage = null; // Clear any previous error messages
//     this.isLoading = true; // Show loading indicator
//     this.analysisService.analyzeRepository(repoUrl)
//       .subscribe({
//         next: (data: AnalysisResult) => {
//           this.isLoading = false; // Hide loading indicator on success
//           this.analysisId = data.id;
//           this.analysisResults = data;
//           this.fetchLanguageAnalyses(this.analysisId);
//         },
//         error: (error) => {
//           this.isLoading = false; // Hide loading indicator on error
//           this.errorMessage = error.message; // Display error message
//         }
//       });
//   }

//   onLanguageSelected(language: string): void {
//     this.errorMessage = null; // Clear any previous error messages
//     this.selectedLanguage = language;
//     this.updateSelectedCode();
//   }

//   fetchLanguageAnalyses(analysisId: number): void {
//     this.isLoading = true; // Show loading indicator
//     this.analysisService.getLanguageAnalysis(analysisId)
//       .subscribe({
//         next: (data: LanguageAnalysis[]) => {
//           this.isLoading = false; // Hide loading indicator on success
//           this.languageAnalyses = data;
//           this.updateSelectedCode();
//         },
//         error: (error) => {
//           this.isLoading = false; // Hide loading indicator on error
//           this.errorMessage = error.message; // Display error message
//         }
//       });
//   }

//   updateSelectedCode(): void {
//     if (this.analysisResults && this.languageAnalyses.length > 0) {
//       if (this.selectedLanguage === 'All Languages') {
//         this.selectedCode = this.languageAnalyses.map(la => 
//           la.nodes.map(node => node.code || '').join('\n')
//         ).join('\n');
//       } else {
//         const selectedLanguageAnalysis = this.languageAnalyses.find(la => la.language === this.selectedLanguage);
//         this.selectedCode = selectedLanguageAnalysis 
//           ? selectedLanguageAnalysis.nodes.map(node => node.code || '').join('\n')
//           : '';
//       }
//     } else {
//       this.selectedCode = '';
//     }
//   }
// }