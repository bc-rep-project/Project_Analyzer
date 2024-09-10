// frontend/src/app/components/complexity-summary/complexity-summary.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule

interface LanguageAnalysis {
  language: string;
  nodes: any[];
  links: any[];
  // ... other properties based on your backend API response
}

@Component({
  selector: 'app-complexity-summary',
  template: `
    <table>
      <thead>
        <tr>
          <th>Language</th>
          <th>Total Complexity</th>
          <th>Average Complexity</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let languageAnalysis of languageAnalyses">
          <td>{{ languageAnalysis.language }}</td>
          <td>{{ getTotalComplexity(languageAnalysis) }}</td>
          <td>{{ getAverageComplexity(languageAnalysis) }}</td>
        </tr>
      </tbody>
    </table>
  `,
  standalone: true,
  imports: [CommonModule] // Add CommonModule to imports
})
export class ComplexitySummaryComponent {
  @Input() languageAnalyses: LanguageAnalysis[] = [];

  getTotalComplexity(languageAnalysis: LanguageAnalysis): number {
    return languageAnalysis.nodes.reduce((sum, node) => sum + (node.complexity || 0), 0);
  }

  getAverageComplexity(languageAnalysis: LanguageAnalysis): number {
    const totalComplexity = this.getTotalComplexity(languageAnalysis);
    return languageAnalysis.nodes.length > 0 ? totalComplexity / languageAnalysis.nodes.length : 0;
  }
}