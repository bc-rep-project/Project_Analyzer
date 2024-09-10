import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalysisResultsComponent } from './analysis-results.component';
import { AnalysisService } from '../../services/analysis.service';
import { of } from 'rxjs';
import { D3GraphService } from '../../shared/d3-graph.service';

// Mock services
class MockAnalysisService {
  getAnalysisResults(analysisId: number) {
    return of({ nodes: [], links: [] }); // Mock data
  }
}

class MockD3GraphService {
  createGraph(data: any, elementId: string) {} // Mock implementation
}

describe('AnalysisResultsComponent', () => {
  let component: AnalysisResultsComponent;
  let fixture: ComponentFixture<AnalysisResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisResultsComponent],
      providers: [
        { provide: AnalysisService, useClass: MockAnalysisService },
        { provide: D3GraphService, useClass: MockD3GraphService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisResultsComponent);
    component = fixture.componentInstance;
    component.analysisId = 1; // Set a mock analysis ID
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch analysis data on init', () => {
    const fetchAnalysisDataSpy = spyOn(component, 'fetchAnalysisData');
    component.ngOnInit();
    expect(fetchAnalysisDataSpy).toHaveBeenCalled();
  });

  // ... add more tests for data handling, error handling, and graph creation
});