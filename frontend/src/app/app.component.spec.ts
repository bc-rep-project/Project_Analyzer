import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { RepositoryInputComponent } from './components/repository-input/repository-input.component'; // Adjust path if needed
import { AnalysisResultsComponent } from './components/analysis-results/analysis-results.component'; // Adjust path if needed
import { LanguageSelectorComponent } from './components/language-selector/language-selector.component'; // Adjust path if needed
import { ComplexityMetricsComponent } from './components/complexity-metrics/complexity-metrics.component'; // Adjust path if needed
import { CodeViewerComponent } from './components/code-viewer/code-viewer.component'; // Adjust path if needed
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AnalysisService } from './services/analysis.service';
import { of, throwError } from 'rxjs';
import { D3GraphService } from './shared/d3-graph.service'; // Adjust path if needed

// Mock D3 object
const mockD3 = {
  select: () => ({
    attr: jasmine.createSpy('attr').and.returnValue(100),
    append: jasmine.createSpy('append').and.returnValue({
      attr: jasmine.createSpy('attr'),
      selectAll: jasmine.createSpy('selectAll').and.returnValue({
        data: jasmine.createSpy('data').and.returnValue({
          enter: jasmine.createSpy('enter').and.returnValue({
            append: jasmine.createSpy('append').and.returnValue({
              attr: jasmine.createSpy('attr'),
              on: jasmine.createSpy('on').and.returnValue({
                call: jasmine.createSpy('call')
              }),
              text: jasmine.createSpy('text')
            })
          }),
          exit: jasmine.createSpy('exit').and.returnValue({
            remove: jasmine.createSpy('remove')
          }),
          merge: jasmine.createSpy('merge').and.returnValue({
            attr: jasmine.createSpy('attr')
          })
        })
      }),
      call: jasmine.createSpy('call')
    }),
    call: jasmine.createSpy('call')
  }),
  forceSimulation: jasmine.createSpy('forceSimulation').and.returnValue({
    force: jasmine.createSpy('force').and.returnValue({
      links: jasmine.createSpy('links').and.returnValue([]),
      id: jasmine.createSpy('id'),
      distance: jasmine.createSpy('distance'),
      strength: jasmine.createSpy('strength')
    }),
    nodes: jasmine.createSpy('nodes').and.returnValue([]),
    alphaTarget: jasmine.createSpy('alphaTarget'),
    restart: jasmine.createSpy('restart'),
    on: jasmine.createSpy('on'),
    alpha: jasmine.createSpy('alpha')
  }),
  // ... mock other D3 methods as needed
};

describe('AppComponent', () => {
  let analysisService: AnalysisService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatProgressSpinnerModule,
        MatSliderModule,
        HttpClientTestingModule,
        AppComponent, // Import AppComponent here
        RepositoryInputComponent,
        AnalysisResultsComponent,
        LanguageSelectorComponent,
        ComplexityMetricsComponent,
        CodeViewerComponent
      ],
      providers: [
        AnalysisService,
        { provide: D3GraphService, useClass: D3GraphService }, // Use the actual service
        { provide: 'd3', useValue: mockD3 } // Provide the mock D3 object
      ]
    }).compileComponents();

    analysisService = TestBed.inject(AnalysisService);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should analyze repository on form submit', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const mockRepoUrl = 'https://github.com/test/repo';
    const mockAnalysisResult = {
      nodes: [],
      links: [],
      success: true,
      messages: [],
      id: 123
    };

    spyOn(analysisService, 'analyzeRepository').and.returnValue(of(mockAnalysisResult));
    spyOn(app, 'fetchLanguageAnalyses');

    app.onAnalyzeRepo(mockRepoUrl);

    expect(analysisService.analyzeRepository).toHaveBeenCalledWith(mockRepoUrl);
    expect(app.analysisResults).toEqual(mockAnalysisResult);
    expect(app.analysisId).toBe(123);
    expect(app.fetchLanguageAnalyses).toHaveBeenCalledWith(123);
  });

  it('should fetch language analyses after successful repository analysis', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const mockAnalysisId = 456;
    const mockLanguageAnalyses = [
      { language: 'python', nodes: [], links: [] },
      { language: 'java', nodes: [], links: [] }
    ];

    spyOn(analysisService, 'getLanguageAnalysis').and.returnValue(of(mockLanguageAnalyses));
    spyOn(app, 'updateSelectedCode');

    app.fetchLanguageAnalyses(mockAnalysisId);

    expect(analysisService.getLanguageAnalysis).toHaveBeenCalledWith(mockAnalysisId);
    expect(app.languageAnalyses).toEqual(mockLanguageAnalyses);
    expect(app.updateSelectedCode).toHaveBeenCalled();
  });

  it('should update selected code when language analyses are fetched', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.analysisResults = { nodes: [], links: [], success: true, messages: [] };
    app.languageAnalyses = [
      { language: 'python', nodes: [{ id: 'node1', type: 'function', code: 'def my_func():\n  pass' }], links: [] },
      { language: 'java', nodes: [{ id: 'node2', type: 'class', code: 'public class MyClass {\n}' }], links: [] }
    ];

    app.selectedLanguage = 'python';
    app.updateSelectedCode();
    expect(app.selectedCode).toBe('def my_func():\n  pass');

    app.selectedLanguage = 'java';
    app.updateSelectedCode();
    expect(app.selectedCode).toBe('public class MyClass {\n}');

    app.selectedLanguage = 'All Languages';
    app.updateSelectedCode();
    expect(app.selectedCode).toBe('def my_func():\n  pass\npublic class MyClass {\n}');
  });

  it('should handle analysis error', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const mockError = new Error('Analysis failed');

    spyOn(analysisService, 'analyzeRepository').and.returnValue(throwError(() => mockError));

    app.onAnalyzeRepo('invalid-repo-url');

    expect(app.errorMessage).toBe('Analysis failed');
  });

  it('should filter the graph based on complexity threshold', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const d3GraphService = TestBed.inject(D3GraphService);

    // Spy on the filterNodesByComplexity method of the actual service
    spyOn(d3GraphService, 'filterNodesByComplexity');

    app.complexityThreshold = 10;
    app.filterGraph();

    expect(d3GraphService.filterNodesByComplexity).toHaveBeenCalledWith(10);
  });
});


// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { AppComponent } from './app.component';
// import { AnalysisService } from './services/analysis.service';
// import { of, throwError } from 'rxjs';
// import { ActivatedRoute } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSliderModule } from '@angular/material/slider';
// import { RepositoryInputComponent } from './components/repository-input/repository-input.component';
// import { AnalysisResultsComponent } from './components/analysis-results/analysis-results.component';
// import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
// import { ComplexityMetricsComponent } from './components/complexity-metrics/complexity-metrics.component';
// import { CodeViewerComponent } from './components/code-viewer/code-viewer.component';
// import { D3GraphService } from './shared/d3-graph.service';

// // Mock services
// class MockAnalysisService {
//   analyzeRepository(repoUrl: string) {
//     return of({ id: 1, repo_url: repoUrl, created_at: '2024-08-15T12:00:00Z', status: 'pending' });
//   }

//   getPythonAnalysis(analysisId: number) {
//     return of({ language: 'python', nodes: [{ id: 'file1.py', type: 'file', complexity: 1, code: 'print("Hello")' }], links: [] });
//   }

//   // ... mock other methods as needed
// }

// class MockD3GraphService {
//   createGraph(data: any, elementId: string) {} // Mock implementation
// }

// describe('AppComponent', () => {
//   let component: AppComponent;
//   let fixture: ComponentFixture<AppComponent>;
//   let mockAnalysisService: MockAnalysisService;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [
//         AppComponent,
//         FormsModule,
//         MatProgressSpinnerModule,
//         MatSliderModule,
//         RepositoryInputComponent,
//         AnalysisResultsComponent,
//         LanguageSelectorComponent,
//         ComplexityMetricsComponent,
//         CodeViewerComponent
//       ],
//       providers: [
//         { provide: AnalysisService, useClass: MockAnalysisService },
//         { provide: D3GraphService, useClass: MockD3GraphService },
//         { 
//           provide: ActivatedRoute, 
//           useValue: {
//             queryParams: of({}) // Provide an empty observable for queryParams
//           }
//         }
//       ]
//     }).compileComponents();

//     fixture = TestBed.createComponent(AppComponent);
//     component = fixture.componentInstance;
//     mockAnalysisService = TestBed.inject(AnalysisService) as unknown as MockAnalysisService;
//     fixture.detectChanges();
//   });

//   it('should create the app', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should analyze repository on form submit', () => {
//     const analyzeRepoSpy = spyOn(mockAnalysisService, 'analyzeRepository').and.callThrough();
//     component.repoUrl = 'https://github.com/test/repo';
//     component.analyzeRepository();
//     expect(analyzeRepoSpy).toHaveBeenCalledWith(component.repoUrl);
//   });

//   it('should handle analysis error', () => {
//     spyOn(mockAnalysisService, 'analyzeRepository').and.returnValue(throwError(() => new Error('Analysis failed')));
//     component.repoUrl = 'https://github.com/test/repo';
//     component.analyzeRepository();
//     expect(component.errorMessage).toBe('Error analyzing repository: Analysis failed');
//   });

//   // ... add more tests for other functionalities and error handling
// });