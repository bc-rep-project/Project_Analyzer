import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisService } from '../../services/analysis.service';
import { D3GraphService } from '../../shared/d3-graph.service'; 

@Component({
  selector: 'app-analysis-results',
  templateUrl: './analysis-results.component.html',
  styleUrls: ['./analysis-results.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AnalysisResultsComponent implements OnInit {
  @Input() analysisId: number = 0;
  isLoading = false;
  errorMessage = '';

  constructor(
    private analysisService: AnalysisService,
    private d3GraphService: D3GraphService
  ) {}

  ngOnInit(): void {
    if (this.analysisId) {
      this.fetchAnalysisData();
    }
  }

  fetchAnalysisData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.analysisService.getAnalysisResults(this.analysisId)
      .subscribe({
        next: (data: any) => { // Adjust the type based on your API response
          this.isLoading = false;
          // Assuming your API response has 'nodes' and 'links' properties
          this.d3GraphService.createGraph(data, 'analysisGraph'); 
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = 'Error fetching analysis results: ' + (error.message || 'Unknown error');
          console.error(error);
        }
      });
  }
}


// import { Component, OnInit, Input } from '@angular/core';
// import * as d3 from 'd3';
// import { AnalysisService } from '../../services/analysis.service';


// interface Node extends d3.SimulationNodeDatum {
//   id: string;
//   type: string;
//   parent?: string;
//   complexity?: number;
//   code?: string;
// }

// interface Link {
//   source: string;
//   target: string;
//   parent?: string;
// }

// @Component({
//   selector: 'app-analysis-results',
//   templateUrl: './analysis-results.component.html',
//   styleUrls: ['./analysis-results.component.css']
// })
// export class AnalysisResultsComponent implements OnInit {
//   @Input() analysisId: number = 0;
//   nodes: Node[] = [];
//   links: Link[] = [];

//   constructor(private analysisService: AnalysisService) {}

//   ngOnInit(): void {
//     if (this.analysisId) {
//       this.analysisService.getAnalysisResults(this.analysisId)
//         .subscribe((data: any) => {
//           this.nodes = data.nodes;
//           this.links = data.links;
//           this.createCallGraph();
//         });
//     }
//   }

//   createCallGraph(): void {
//     const svg = d3.select('svg');
//     const width = +svg.attr('width');
//     const height = +svg.attr('height');

//     const simulation = d3.forceSimulation(this.nodes)
//       .force('link', d3.forceLink(this.links).id((d: any) => d.id))
//       .force('charge', d3.forceManyBody())
//       .force('center', d3.forceCenter(width / 2, height / 2));

//     const link = svg.append('g')
//       .attr('class', 'links')
//       .selectAll('line')
//       .data(this.links)
//       .enter().append('line')
//       .attr('stroke-width', 2);

//     const node = svg.append('g')
//       .attr('class', 'nodes')
//       .selectAll('circle')
//       .data(this.nodes)
//       .enter().append('circle')
//       .attr('r', 5)
//       .attr('fill', (d: any) => d.type === 'file' ? 'blue' : 'red');

//     simulation.on('tick', () => {
//       link
//         .attr('x1', (d: any) => d.source.x)
//         .attr('y1', (d: any) => d.source.y)
//         .attr('x2', (d: any) => d.target.x)
//         .attr('y2', (d: any) => d.target.y);

//       node
//         .attr('cx', (d: any) => d.x)
//         .attr('cy', (d: any) => d.y);
//     });
//   }
// }