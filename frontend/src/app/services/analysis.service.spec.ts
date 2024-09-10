// src/app/services/analysis.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AnalysisService } from './analysis.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { AnalysisResult, LanguageAnalysis } from './analysis.service'; // Import your interfaces

describe('AnalysisService', () => {
  let service: AnalysisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AnalysisService]
    });
    service = TestBed.inject(AnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should analyze a repository', () => {
    const repoUrl = 'https://github.com/testuser/testrepo.git';
    const mockResponse: AnalysisResult = {
      nodes: [],
      links: [],
      success: true,
      messages: [],
      id: 123
    };

    service.analyzeRepository(repoUrl).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}analyze/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ repo_url: repoUrl });
    req.flush(mockResponse);
  });

  it('should get analysis results', () => {
    const analysisId = 123;
    const mockResponse: AnalysisResult = {
      nodes: [],
      links: [],
      success: true,
      messages: [],
      id: analysisId
    };

    service.getAnalysisResults(analysisId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}analysis/${analysisId}/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get language analysis', () => {
    const analysisId = 123;
    const mockResponse: LanguageAnalysis[] = [
      {
        language: 'python',
        nodes: [{ id: 'test.py', type: 'file', complexity: 1, code: 'print("Hello")', parent: '' }],
        links: []
      },
      {
        language: 'java',
        nodes: [{ id: 'Main.java', type: 'file', complexity: 2, code: 'public class Main {}', parent: '' }],
        links: []
      }
    ];

    service.getLanguageAnalysis(analysisId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}analysis/${analysisId}/languages/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get C++ analysis', () => {
    const analysisId = 123;
    const mockResponse: LanguageAnalysis = {
      language: 'cpp',
      nodes: [{ id: 'main.cpp', type: 'file', complexity: 3, code: '// C++ code', parent: '' }],
      links: []
    };

    service.getCppAnalysis(analysisId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}analysis/${analysisId}/cpp/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get Python analysis', () => {
    const analysisId = 123;
    const mockResponse: LanguageAnalysis = {
      language: 'python',
      nodes: [{ id: 'test.py', type: 'file', complexity: 1, code: 'print("Hello")', parent: '' }],
      links: []
    };

    service.getPythonAnalysis(analysisId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}analysis/${analysisId}/python/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get Java analysis', () => {
    const analysisId = 123;
    const mockResponse: LanguageAnalysis = {
      language: 'java',
      nodes: [{ id: 'Main.java', type: 'file', complexity: 2, code: '// Java code', parent: '' }],
      links: []
    };

    service.getJavaAnalysis(analysisId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}analysis/${analysisId}/java/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get TypeScript analysis', () => {
    const analysisId = 123;
    const mockResponse: LanguageAnalysis = {
      language: 'typescript',
      nodes: [{ id: 'app.ts', type: 'file', complexity: 4, code: '// TypeScript code', parent: '' }],
      links: []
    };

    service.getTypescriptAnalysis(analysisId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}analysis/${analysisId}/typescript/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

});



// // frontend/src/app/services/analysis.service.spec.ts
// import { TestBed } from '@angular/core/testing';
// import { AnalysisService } from './analysis.service';
// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// describe('AnalysisService', () => {
//   let service: AnalysisService;
//   let httpMock: HttpTestingController;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       imports: [HttpClientTestingModule],
//       providers: [AnalysisService]
//     });
//     service = TestBed.inject(AnalysisService);
//     httpMock = TestBed.inject(HttpTestingController);
//   });

//   afterEach(() => {
//     httpMock.verify();
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });

//   it('should analyze a repository', () => {
//     const repoUrl = 'https://github.com/testuser/testrepo.git';
//     const mockResponse = {
//       id: 123,
//       repo_url: repoUrl,
//       created_at: '2024-01-01T00:00:00Z',
//       status: 'pending'
//     };

//     service.analyzeRepository(repoUrl).subscribe(response => {
//       expect(response).toEqual(mockResponse);
//     });

//     const req = httpMock.expectOne(`${service['apiUrl']}/analyze/`);
//     expect(req.request.method).toBe('POST');
//     expect(req.request.body).toEqual({ repo_url: repoUrl });
//     req.flush(mockResponse);
//   });

//   it('should get analysis results', () => {
//     const analysisId = 123;
//     const mockResponse = {
//       id: analysisId,
//       repo_url: 'https://github.com/testuser/testrepo.git',
//       created_at: '2024-01-01T00:00:00Z',
//       status: 'completed'
//     };

//     service.getAnalysisResults(analysisId).subscribe(response => {
//       expect(response).toEqual(mockResponse);
//     });

//     const req = httpMock.expectOne(`${service['apiUrl']}/analysis/${analysisId}/`);
//     expect(req.request.method).toBe('GET');
//     req.flush(mockResponse);
//   });

//   it('should get language analysis', () => {
//     const analysisId = 123;
//     const mockResponse = [
//       {
//         language: 'python',
//         nodes: [{ id: 'test.py', type: 'file' }],
//         links: []
//       },
//       {
//         language: 'java',
//         nodes: [{ id: 'Main.java', type: 'file' }],
//         links: []
//       }
//     ];

//     service.getLanguageAnalysis(analysisId).subscribe(response => {
//       expect(response).toEqual(mockResponse);
//     });

//     const req = httpMock.expectOne(`${service['apiUrl']}/analysis/${analysisId}/languages/`);
//     expect(req.request.method).toBe('GET');
//     req.flush(mockResponse);
//   });

//   it('should get C++ analysis data', () => {
//     const analysisId = 123;
//     const mockCppAnalysis = {
//       language: 'cpp',
//       nodes: [{ id: 'main.cpp', type: 'file' }],
//       links: []
//     };

//     service.getCppAnalysis(analysisId).subscribe(analysis => {
//       expect(analysis).toEqual(mockCppAnalysis);
//     });

//     const req = httpMock.expectOne(`${service['apiUrl']}/analysis/${analysisId}/cpp/`);
//     expect(req.request.method).toBe('GET');
//     req.flush(mockCppAnalysis);
//   });

//   it('should get Python analysis data', () => {
//     const analysisId = 123;
//     const mockPythonAnalysis = {
//       language: 'python',
//       nodes: [{ id: 'test.py', type: 'file' }],
//       links: []
//     };

//     service.getPythonAnalysis(analysisId).subscribe(analysis => {
//       expect(analysis).toEqual(mockPythonAnalysis);
//     });

//     const req = httpMock.expectOne(`${service['apiUrl']}/analysis/${analysisId}/python/`);
//     expect(req.request.method).toBe('GET');
//     req.flush(mockPythonAnalysis);
//   });

//   it('should get Java analysis data', () => {
//     const analysisId = 123;
//     const mockJavaAnalysis = {
//       language: 'java',
//       nodes: [{ id: 'Main.java', type: 'file' }],
//       links: []
//     };

//     service.getJavaAnalysis(analysisId).subscribe(analysis => {
//       expect(analysis).toEqual(mockJavaAnalysis);
//     });

//     const req = httpMock.expectOne(`${service['apiUrl']}/analysis/${analysisId}/java/`);
//     expect(req.request.method).toBe('GET');
//     req.flush(mockJavaAnalysis);
//   });

//   it('should get TypeScript analysis data', () => {
//     const analysisId = 123;
//     const mockTypescriptAnalysis = {
//       language: 'typescript',
//       nodes: [{ id: 'app.ts', type: 'file' }],
//       links: []
//     };

//     service.getTypescriptAnalysis(analysisId).subscribe(analysis => {
//       expect(analysis).toEqual(mockTypescriptAnalysis);
//     });

//     const req = httpMock.expectOne(`${service['apiUrl']}/analysis/${analysisId}/typescript/`);
//     expect(req.request.method).toBe('GET');
//     req.flush(mockTypescriptAnalysis);
//   });
// });