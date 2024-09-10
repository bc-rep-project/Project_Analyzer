import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

interface LanguageAnalysisNode {
  id: string;
  type: string;
  parent?: string;
  complexity?: number;
  code?: string;
}

@Component({
  selector: 'app-complexity-metrics',
  templateUrl: './complexity-metrics.component.html',
  styleUrls: ['./complexity-metrics.component.css'],
  standalone: true,
  imports: [CommonModule, MatTableModule]
})
export class ComplexityMetricsComponent {
  @Input() metrics: LanguageAnalysisNode[] = []; // Use LanguageAnalysisNode directly
  displayedColumns: string[] = ['functionName', 'cyclomaticComplexity'];
}