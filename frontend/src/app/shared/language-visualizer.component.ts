// frontend/src/app/shared/language-visualizer.component.ts
// frontend/src/app/shared/language-visualizer.component.ts
import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf, CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CodeVisualizerService } from '../code-visualizer/code-visualizer.service';
import { D3GraphService } from './d3-graph.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface LanguageAnalysis {
    nodes: any[];
    links: any[];
}

@Component({
    selector: 'app-language-visualizer',
    templateUrl: './language-visualizer.component.html',
    styleUrls: ['./language-visualizer.component.css'],
    standalone: true,
    imports: [MatProgressSpinnerModule, NgIf, CommonModule]
})
export class LanguageVisualizerComponent implements OnInit {
    @Input() analysisId!: number;
    @Input() language!: string;
    analysisData$: Observable<LanguageAnalysis | null> = of(null);
    isLoading = false;
    errorMessage = '';

    constructor(
        private codeVisualizerService: CodeVisualizerService,
        private d3GraphService: D3GraphService,
        @Inject(PLATFORM_ID) private platformId: any
    ) { }

    ngOnInit(): void {
        if (this.analysisId && this.language && isPlatformBrowser(this.platformId)) {
            this.fetchAnalysisData();
        }
    }

    private loadD3AndCreateGraph(data: LanguageAnalysis) {
        import('d3').then((d3) => {
            // Make sure this SVG element ID matches the one you are providing 
            // either here or in your routing configuration 
            this.d3GraphService.createGraph(data, `${this.language}Graph`);
        }).catch((error) => {
            console.error("Error loading D3.js:", error);
        });
    }

    fetchAnalysisData() {
        this.isLoading = true;
        this.errorMessage = '';

        // Initialize with an empty LanguageAnalysis object
        let analysisObservable: Observable<LanguageAnalysis> = of({ nodes: [], links: [] });

        // Determine the right API method to call
        switch (this.language) {
            case 'python':
                analysisObservable = this.codeVisualizerService.getPythonAnalysis(this.analysisId);
                break;
            case 'java':
                analysisObservable = this.codeVisualizerService.getJavaAnalysis(this.analysisId);
                break;
            case 'cpp':
                analysisObservable = this.codeVisualizerService.getCppAnalysis(this.analysisId);
                break;
            case 'typescript':
                analysisObservable = this.codeVisualizerService.getTypescriptAnalysis(this.analysisId);
                break;
            default:
                this.errorMessage = "Unsupported language!";
                this.isLoading = false;
                return; // Don't continue if unsupported language
        }

        this.analysisData$ = analysisObservable.pipe(
            catchError(error => {
                this.errorMessage = "Error loading " + this.language + " analysis data.";
                console.error(error);
                this.isLoading = false;
                return of(null);
            })
        );

        this.analysisData$.subscribe(data => {
            this.isLoading = false;
            // Only create graph in browser and if valid data
            if (isPlatformBrowser(this.platformId) && data && data.nodes && data.links) {
                this.loadD3AndCreateGraph(data);
            }
        });
    }
}


// import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core'; 
// import { isPlatformBrowser, NgIf } from '@angular/common';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
// import { CodeVisualizerService } from '../code-visualizer/code-visualizer.service';
// import { D3GraphService } from './d3-graph.service'; 
// import { Observable, of } from 'rxjs';  
// import { catchError } from 'rxjs/operators'; 

// interface LanguageAnalysis {
//     nodes: any[];
//     links: any[];
// }

// @Component({ 
//     selector: 'app-language-visualizer',
//     templateUrl: './language-visualizer.component.html',
//     styleUrls: ['./language-visualizer.component.css'],
//     standalone: true, 
//     imports: [MatProgressSpinnerModule, NgIf] 
// })
// export class LanguageVisualizerComponent implements OnInit { 
//    @Input() analysisId!: number; 
//    @Input() language!: string;  
//    analysisData$: Observable<LanguageAnalysis | null> = of(null);  
//    isLoading = false;
//    errorMessage = ''; 

//    constructor(
//        private codeVisualizerService: CodeVisualizerService, 
//        private d3GraphService: D3GraphService,  
//        @Inject(PLATFORM_ID) private platformId: any 
//     ) { } 
    

//     ngOnInit(): void {  
//         if (this.analysisId && this.language && isPlatformBrowser(this.platformId)) {
//             this.fetchAnalysisData();
//         }
//     } 

//     private loadD3AndCreateGraph(data: LanguageAnalysis) {
//         import('d3').then((d3) => {
//             // Make sure this SVG element ID matches the one you are providing 
//             // either here or in your routing configuration 
//             this.d3GraphService.createGraph(data, `${this.language}Graph`); 
//         }).catch((error) => {
//             console.error("Error loading D3.js:", error);
//         });  
//     }

//     fetchAnalysisData() {  
//         this.isLoading = true; 
//         this.errorMessage = ''; 
//         let analysisObservable: Observable<LanguageAnalysis> = of({}); // Start with empty  observable  
    
//        // Determine the right API method to  call  
//         switch (this.language)  {
//             case 'python': 
//                analysisObservable = this.codeVisualizerService.getPythonAnalysis(this.analysisId);
//                 break; 
//              case 'java': 
//                 analysisObservable = this.codeVisualizerService.getJavaAnalysis(this.analysisId); 
//                  break; 
//              case 'cpp': 
//                 analysisObservable  =  this.codeVisualizerService.getCppAnalysis(this.analysisId); 
//                  break;  
//              case  'typescript': 
//                analysisObservable = this.codeVisualizerService.getTypescriptAnalysis(this.analysisId); 
//                 break;  
//             default:  
//                 this.errorMessage  =  "Unsupported language!";  
//                 this.isLoading  =  false; 
//                  return; // Don't  continue  if  unsupported language 
//         }
 

//        this.analysisData$  =  analysisObservable.pipe( 
//           catchError(error  =>  {  
//             this.errorMessage  = "Error  loading  " + this.language  + "  analysis  data.";
//               console.error(error); 
//               this.isLoading  =  false;  
//                return  of(null);  
//             }) 
//        );
        
//         this.analysisData$.subscribe(data => { 
//             this.isLoading  = false;  
//             // Only create graph in  browser  and if  valid  data  
//              if (isPlatformBrowser(this.platformId) &&  data && data.nodes &&  data.links) { 
//                 this.loadD3AndCreateGraph(data);  
//              }
//          });
//      }
//  }