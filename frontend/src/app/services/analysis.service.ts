import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface LanguageAnalysisNode {
  id: string;
  type: string;
  parent?: string;
  complexity?: number;
  code?: string;
}

interface AnalysisResult {
  nodes: LanguageAnalysisNode[];
  links: any[];
  success: boolean;
  messages: string[];
  id?: number;
}

interface LanguageAnalysis {
  language: string;
  nodes: any[];
  links: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  analyzeRepository(repoUrl: string): Observable<AnalysisResult> {
    const headers = new HttpHeaders({
      'Authorization': `Token ${this.authService.getToken()}`
    });

    return this.http.post<AnalysisResult>(`${this.apiUrl}api/v1/analyze/`, { repo_url: repoUrl }, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getAnalysisResults(analysisId: number): Observable<AnalysisResult> {
    return this.http.get<AnalysisResult>(`${this.apiUrl}api/v1/analysis/${analysisId}/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getLanguageAnalysis(analysisId: number, language?: string): Observable<LanguageAnalysis | LanguageAnalysis[]> {
    let url = `${this.apiUrl}api/v1/analysis/${analysisId}/languages/`;
    if (language) {
      url = `${this.apiUrl}api/v1/analysis/${analysisId}/${language.toLowerCase()}/`;
    }
    return this.http.get<LanguageAnalysis | LanguageAnalysis[]>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      console.error('An error occurred:', error.error.message);
    } else {
      // Server-side error
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
  
      // Use success and messages from the response
      if (error.error && !error.error.success) {
        const messages = error.error.messages || [];
        const errorMessage = messages.join('\n');
        return throwError(() => new Error(errorMessage));
      }
    }
  
    // Return a generic error message if specific details are not available
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}