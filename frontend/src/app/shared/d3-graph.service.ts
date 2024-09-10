// frontend/src/app/shared/d3-graph.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; 
import { isPlatformBrowser } from '@angular/common';
import * as d3 from 'd3';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; 

@Injectable({ 
  providedIn: 'root'  
})  
export class D3GraphService {
  //to make private
  svg: any;  
  simulation: any;  
  link: any;  
  node: any; 
  tooltip: any;

  constructor( 
    @Inject(PLATFORM_ID) private platformId: any,
    private sanitizer: DomSanitizer
  ) { 
    this.link = { attr: () => {} };
    this.node = { attr: () => {} };
   } 

  async createGraph(data: any, svgElementId: string)  {
    if (isPlatformBrowser(this.platformId)) {
      const d3 = await import('d3');

      this.svg = d3.select(`svg#${svgElementId}`);
      const width = +this.svg.attr("width");  
      const height = +this.svg.attr("height");  
      
      this.simulation = d3.forceSimulation(data.nodes)  
        .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150).strength(0.1))  
        .force("charge", d3.forceManyBody().strength(-400)) 
        .force("center", d3.forceCenter(width / 2, height / 2));  

      this.link = this.svg.append("g")
         .attr("class", "links")  
        .selectAll("line")  
        .data(data.links)  
        .enter().append("line") 
        .attr("stroke-width", 2) 
        .attr("stroke",  "#999") 
        .attr("stroke-opacity", 0.6); 

      this.node = this.svg.append("g")
        .attr("class", "nodes")  
        .selectAll("circle")  
        .data(data.nodes)  
        .enter().append("circle") 
        .attr("r",  (d:  any) => 5 +  (d.complexity ||  0))  
        .attr("fill", (d: any) => {
          if (d.complexity > 10) {
            return 'red';
          } else if (d.complexity > 5) {
            return 'orange';
          } else {
            return 'steelblue';
          }
        })
        .on("click", (event: any,  d:  any)  =>  console.log("Node Clicked:", d))
        .on("mouseover", (event: any, d:  any)  =>  {
          // Create tooltip content
          const tooltipContent = `
            <strong>Name:</strong> ${this.getNodeLabel(d)}<br/>
            <strong>Type:</strong> ${d.type}<br/>
            <strong>Path:</strong> ${d.parent || ''}<br/>
            <strong>Complexity:</strong> ${d.complexity || 'N/A'}
          `;
      
          // Create and show tooltip
          d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .html(tooltipContent) // Use the sanitized HTML
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("opacity", 0.9);
        })
        .on("mouseout", () => {
          // Hide tooltip
          d3.select(".tooltip").remove();
        })
        .call(this.drag(this.simulation));  

       // Add labels  to the  nodes (optional)
       this.node.append("text")  
          .text((d:  any)  => d.id)
         .attr("x", 8)
          .attr("y",  ".31em")  
         .attr("text-anchor", "start");  

       // Zoom and Pan Functionality
       this.svg.call(d3.zoom<SVGSVGElement,  any>() 
          .extent([[0, 0], [width, height]]) 
         .scaleExtent([1,  8]) 
         .on("zoom", (event) => { 
             this.link.attr("transform", event.transform); 
             this.node.attr("transform",  event.transform);  
         })); 

        this.simulation.on("tick",  ()  => this.ticked());
     }
  }

  filterNodesByComplexity(complexityThreshold: number) {
    // 1. Filter nodes based on complexity
    const filteredNodes = this.simulation.nodes().filter((d: any) => d.complexity >= complexityThreshold);
  
    // 2. Update the simulation with the filtered nodes
    this.simulation.nodes(filteredNodes);
  
    // 3. Re-create the links based on the filtered nodes
    const filteredLinks = this.simulation.force("link").links().filter((link: any) => {
      return filteredNodes.includes(link.source) && filteredNodes.includes(link.target);
    });
    this.simulation.force("link").links(filteredLinks);
  
    // 4. Update the visualization
    this.link = this.link.data(filteredLinks);
    this.link.exit().remove(); // Remove links connected to removed nodes
    this.link = this.link.enter().append("line").merge(this.link);
  
    this.node = this.node.data(filteredNodes);
    this.node.exit().remove(); // Remove the nodes that don't meet the criteria
    this.node = this.node.enter().append("circle").merge(this.node);
  
    // 5. Restart the simulation
    this.simulation.alpha(1).restart();
  }

  //private
  ticked() {
    if (this.link && this.node) {
      this.link 
        .attr("x1", (d:  any)  => d.source.x) 
        .attr("y1", (d:  any) => d.source.y) 
        .attr("x2",  (d:  any)  =>  d.target.x) 
        .attr("y2",  (d:  any) => d.target.y);  

      this.node
        .attr("cx", (d:  any)  => d.x) 
        .attr("cy",  (d:  any)  =>  d.y);  
    }
  }

  //private
  drag(simulation:  any)  {  
   function dragstarted(event: any,  d: any)  {
      if  (!event.active)  simulation.alphaTarget(0.3).restart();  
      d.fx  = d.x; 
      d.fy  = d.y; 
     } 
 

   function dragged(event: any, d:  any)  {  
      d.fx  = event.x;
      d.fy =  event.y;  
     }
  
 

  function dragended(event: any,  d:  any)  {
      if  (!event.active) simulation.alphaTarget(0);
       d.fx  =  null;  
      d.fy  =  null;  
     } 

  return d3.drag<any, any>()
      .on("start",  dragstarted)
       .on("drag",  dragged)  
       .on("end",  dragended);  
 } 

 //private
 showTooltip(event: any, d:  any) {
  // Create  tooltip  content
  const content = ` 
      <div>
          <strong>Name:</strong>  ${this.getNodeLabel(d)} <br /> 
          <strong>Type:</strong> ${d.type} <br />
          ${d.parent  ?  `<strong>Path:</strong> ${d.parent}` : ''}
      </div>
   `;  

  // Sanitize HTML for security  
  const safeContent: SafeHtml =  this.sanitizer.bypassSecurityTrustHtml(content);

  //  Create and display the tooltip
  if (!this.tooltip) {
    this.tooltip = d3.select("body").append("div") 
        .attr("class",  "tooltip")  
        .style("opacity", 0);  
  }  

  this.tooltip.transition() 
    .duration(200)
    .style("opacity", .9); 

  // Use [innerHTML] to bind the sanitized HTML
  this.tooltip
      .style("left",  (event.pageX  + 10) +  "px")  
      .style("top",  (event.pageY - 28) + "px")
      .datum(safeContent) // Bind the SafeHtml object to the tooltip element
      .html(function(d: SafeHtml) { return d; }); // Specify the type of 'd'
}

  //private
   hideTooltip() {
    if (this.tooltip) {  
      this.tooltip.remove();
    }
   }

   //private
    getNodeLabel(d: any) {  
    // If it's a file, return only  the  filename  
    if  (d.type  ===  'file')  {
        return d.id.split('/').pop(); 
      } else {
      return  d.id; 
      }
  }
}


// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { CodeVisualizerService } from '../code-visualizer/code-visualizer.service';
// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// import * as d3 from 'd3';

// @Injectable({
//   providedIn: 'root'
// })
// export class D3GraphService {
//   private svg: any;
//   private link: any;
//   private node: any;
//   private simulation: any;
//   private tooltip: any; 

//   constructor(
//     private codeVisualizerService: CodeVisualizerService,
//     @Inject(PLATFORM_ID) private platformId: any,
//     private sanitizer: DomSanitizer 
//   ) { }

//   createGraph(data: any, svgElementId: string): void {
//     if (isPlatformBrowser(this.platformId)) { 
//       this.svg = d3.select(`svg#${svgElementId}`);
//       const width = +this.svg.attr("width");
//       const height = +this.svg.attr("height");

//       this.simulation = d3.forceSimulation(data.nodes)
//         .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150).strength(0.1)) 
//         .force("charge", d3.forceManyBody().strength(-400))
//         .force("center", d3.forceCenter(width / 2, height / 2));

//       this.link = this.svg.append("g")
//         .attr("class", "links")
//         .selectAll("line")
//         .data(data.links)
//         .enter().append("line")
//         .attr("stroke-width", 2)
//         .attr("stroke", "#999")
//         .attr("stroke-opacity", 0.6);

//       this.node = this.svg.append("g")
//         .attr("class", "nodes")
//         .selectAll("g")
//         .data(data.nodes)
//         .enter().append("g");

//       this.node.append("circle")
//         .attr("r", (d: any) => this.getNodeSize(d))
//         .attr("fill", (d: any) => this.getNodeColor(d))
//         .on("click", (event: any, d: any) => this.onNodeClick(event, d)) 
//         .on("mouseover", (event: any, d: any) => this.showTooltip(event, d))
//         .on("mouseout", () => this.hideTooltip())
//         .call(this.drag(this.simulation));

//       this.node.append("text")
//         .text((d: any) => this.getNodeLabel(d))
//         .attr("x", 8)
//         .attr("y", ".31em")
//         .attr("text-anchor", "start"); 

//       this.svg.call(d3.zoom<SVGSVGElement, any>()
//         .on("zoom", (event: d3.D3ZoomEvent<any, any>) => {
//           this.link.attr("transform", event.transform);
//           this.node.attr("transform", event.transform);
//         }));

//       this.simulation.on("tick", () => this.ticked());
//     }
//   }

//   private ticked() {
//     this.link
//       .attr("x1", (d: any) => d.source.x)
//       .attr("y1", (d: any) => d.source.y)
//       .attr("x2", (d: any) => d.target.x)
//       .attr("y2", (d: any) => d.target.y);

//     this.node
//       .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
//   }

//   private drag(simulation: d3.Simulation<any, any>) {
//     function dragstarted(event: d3.D3DragEvent<any, any, any>, d: any) {
//       if (!event.active) simulation.alphaTarget(0.3).restart();
//       d.fx = d.x;
//       d.fy = d.y;
//     }

//     function dragged(event: d3.D3DragEvent<any, any, any>, d: any) {
//       d.fx = event.x;
//       d.fy = event.y;
//     }

//     function dragended(event: d3.D3DragEvent<any, any, any>, d: any) {
//       if (!event.active) simulation.alphaTarget(0);
//       d.fx = null;
//       d.fy = null;
//     }

//     return d3.drag<any, any>()
//       .on("start", dragstarted)
//       .on("drag", dragged)
//       .on("end", dragended);
//   }

//   private showTooltip(event: any, d: any) {
//     // Generate HTML content
//     const tooltipHtml = `
//       <strong>Name:</strong> ${this.getNodeLabel(d)}<br/>
//       <strong>Type:</strong> ${d.type}<br/>
//       <strong>Path:</strong> ${d.parent || ''}
//     `;
//     // Sanitize the HTML content
//     const safeTooltipHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(tooltipHtml);

//     // Use safeTooltipHtml in the tooltip
//     if (!this.tooltip) {
//       this.tooltip = d3.select("body").append("div")
//         .attr("class", "tooltip")
//         .style("opacity", 0);
//     }

//     this.tooltip.transition()
//        .duration(200)
//        .style("opacity", 0.9);

//     this.tooltip.html(safeTooltipHtml)
//        .style("left", `${event.pageX + 10}px`)
//        .style("top", `${event.pageY - 28}px`);
//   }

//   private hideTooltip() {
//     if (this.tooltip) {
//       this.tooltip.transition()
//         .duration(200)
//         .style("opacity", 0); 
//     }
//   }

//   getNodeColor(d: any): string {
//     let color = 'grey';
//     switch (d.type) {
//       case 'function':
//         color = 'steelblue';
//         break;
//       case 'class':
//         color = 'crimson'; 
//         break;
//       case 'file':
//         color = 'orange'; 
//         break;
//     }

//     if (d.complexity) {
//       if (d.complexity > 10) {
//         color = 'red'; 
//       } else if (d.complexity > 5) {
//         color = 'orange'; 
//       }
//     }

//     return color; 
//   }

//   getNodeSize(d: any): number {
//     const baseSize = d.type === "function" ? 8 : 10;
//     return baseSize + (d.complexity || 0) * 0.5;
//   }

//   getNodeLabel(d: any) {
//     if (d.type === 'file') { 
//       return d.id.split('/').pop(); 
//     } else if (d.type === 'function') {
//       return `${d.parent ? d.parent.split('/').pop() : ''}:${d.id}`; 
//     } else { 
//       return d.id; 
//     }
//   }

//   private onNodeClick(event: any, d: any) {
//     console.log('Node Clicked: ', d.id);
//     this.highlightNodeAndLinks(d.id.toString());

//     if (d.type === "function") { 
//       this.codeVisualizerService.getFunctionCode(d.id.toString()) 
//         .subscribe({
//           next: (code: string) => { 
//             // Handle code display in your component 
//             console.log("Function code:", code);
//           },
//           error: (error: any) => {
//             console.error("Error retrieving code:", error); 
//           }
//         }); 
//     }
//   }

//   public highlightNodeAndLinks(nodeId: string) {
//     this.node.classed("highlighted", false); 
//     this.link.classed("highlighted", false);

//     this.node.classed("highlighted", (d: any) => d.id === nodeId);
//     this.link.classed("highlighted", (d: any) => d.source.id === nodeId || d.target.id === nodeId); 
//   }
// }


// import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; 
// import { isPlatformBrowser } from  '@angular/common'; 
// import { CodeVisualizerService } from '../code-visualizer/code-visualizer.service'; 
// import * as d3 from 'd3'; 

// @Injectable({ 
// providedIn: 'root'  
// })

// export class D3GraphService {
//     // Declare D3 selections  globally 
//     private svg: any;
//     private link: any; 
//     private  node: any; 
//     private simulation: any;
 

//     constructor(
//         private codeVisualizerService: CodeVisualizerService,  
//         @Inject(PLATFORM_ID) private platformId: any  
//     ) { }  
 

//     createGraph(data: any, svgElementId: string):  void {  
//     // Ensure that this  code runs  only  in the  browser 
//     if  (isPlatformBrowser(this.platformId)) {  
//         this.svg =  d3.select(`svg#${svgElementId}`);  
//         const width =  +this.svg.attr("width");  
//         const  height = +this.svg.attr("height");  


//         // ------------- 1. Simulation Setup ---------------
//         this.simulation =  d3.forceSimulation(data.nodes) 
//             .force("link", d3.forceLink(data.links)  
//                 .id((d:  any)  => d.id).distance(150).strength(0.1))
//             .force("charge",  d3.forceManyBody().strength(-400))
//         .force("center", d3.forceCenter(width / 2, height /  2));
        

//         // ------------- 2. Links ----------------- 
//         this.link  =  this.svg.append("g")  
//             .attr("class", "links")  
//             .selectAll("line") 
//         .data(data.links)  
//         .enter().append("line")  
//         .attr("stroke-width",  2) 
//         .attr("stroke",  "#999")
//         .attr("stroke-opacity",  0.6); 


//         // -------------  3.  Nodes ---------------
//         this.node =  this.svg.append("g") 
//             .attr("class",  "nodes")
//             .selectAll("g")
//             .data(data.nodes)  
//             .enter().append("g");

        
//         // ---  Add Circles  to  Nodes ---  
//         this.node.append("circle") 
//             .attr("r", (d: any)  =>  this.getNodeSize(d))
//             .attr("fill",  (d:  any) =>  this.getNodeColor(d))
//             .on("click",  (event:  any,  d: any) => this.onNodeClick(event, d)) 
//             .on("mouseover", (event:  any, d: any)  =>  this.showTooltip(event,  d)) 
//             .on("mouseout",  () => this.hideTooltip()) 
//             .call(this.drag(this.simulation));  


//         // --- Add  labels (text)  to  Nodes ---- 
//         this.node.append("text") 
//             .text((d:  any)  =>  this.getNodeLabel(d))  
//             .attr("x", 8)  
//             .attr("y",  ".31em")  
//             .attr("text-anchor",  "start");  


//         // -------------- 4.  Zooming  and Panning --------------
//         this.svg.call(d3.zoom<SVGSVGElement,  any>()  
//             .on("zoom",  (event:  d3.D3ZoomEvent<any, any>)  =>  { 
//                 this.link.attr("transform", event.transform);
//                 this.node.attr("transform", event.transform); 
//             }));  
        

//         this.simulation.on("tick", ()  =>  this.ticked()); 
//         }  
//     }  

// // ----------------  5.  Tick Function for  Node Positioning ----------------  
//     private  ticked() {  
//         this.link 
//         .attr("x1",  (d:  any) =>  d.source.x)  
//         .attr("y1",  (d:  any) => d.source.y)  
//         .attr("x2",  (d: any)  =>  d.target.x) 
//         .attr("y2", (d: any) => d.target.y); 


//     this.node  
//         .attr("transform",  (d: any)  =>  `translate(${d.x},  ${d.y})`); 
//     }
  
//  //  ----------------  6.  Drag Event Handlers  -------------
//     private drag(simulation:  d3.Simulation<any, any>) {
//         function dragstarted(event: d3.D3DragEvent<any, any, any>, d: any)  {  
//             if  (!event.active)  simulation.alphaTarget(0.3).restart(); 
//             d.fx = d.x;
//         d.fy  =  d.y; 
//     }  
 

//     function  dragged(event:  d3.D3DragEvent<any,  any, any>, d:  any)  { 
//         d.fx =  event.x; 
//             d.fy  = event.y;
//     }  
    

//     function  dragended(event:  d3.D3DragEvent<any,  any, any>, d:  any) { 
//         if  (!event.active)  simulation.alphaTarget(0);
//         d.fx =  null;
//         d.fy = null;  
//     }  
 

//     return d3.drag<any, any>()  
//         .on("start", dragstarted) 
//         .on("drag",  dragged)
//         .on("end",  dragended);  
// }  
   

//  //  ------------ 7. Tooltip Functions ------------ 
//     private showTooltip(event: any, d: any) {
//         const tooltipDiv = d3.select("body").append("div")
//         .attr("class", "tooltip")
//         .style("opacity", 0);
    
//         tooltipDiv.transition()
//         .duration(200)
//         .style("opacity", 0.9);
    
//         tooltipDiv.html("<strong>Name:</strong>  ".concat(this.getNodeLabel(d), "<br/>") +
//             ("<strong>Type:</strong>  ".concat(d.type)) +
//             ("<strong>Path:</strong> ".concat(d.parent))
//         )
//         .style("left", `${event.pageX + 10}px`)
//         .style("top", `${event.pageY - 28}px`);
//     }
  
  

//     private hideTooltip() {
//         d3.select(".tooltip").remove();
//     } 
 

// // ---------------- Node  Styling Helpers ----------------
//     getNodeColor(d:  any): string {
//         // -------  1. Basic  Color  Based  on Type --------
//     let  color  = 'grey'; // Default  color
//     switch  (d.type)  {
//         case  'function':
//             color =  'steelblue';
//         break;
//         case 'class':
//             color  =  'crimson';
//         break;
//         case  'file':
//             color =  'orange';
//         break;
//         // ... add colors for other types ...
//         }


//     // -------  2. Adjust Color Based  on Complexity  -------
//         if (d.complexity)  {
//             if (d.complexity > 10) {
//             color  =  'red';  // Highly complex
//         }  else if (d.complexity  >  5)  {
//             color =  'orange'; // Moderately  complex
//             }
//         }

//     return  color;
//     }
   

//     getNodeSize(d: any): number {
//         const baseSize  =  d.type  ===  "function"  ?  8 : 10;


//         //  Scale node  size  based  on complexity  
//         //  Adjust the  scaling  factor (0.5  here) as needed!
//             return  baseSize + (d.complexity  ||  0)  *  0.5;
//     }


//     getNodeLabel(d: any) {  
//         if (d.type  ===  'file')  {  
//             return d.id.split('/').pop(); // Only  filename for files
//         } else  if (d.type  === 'function') {
//             return  `${d.parent  ?  d.parent.split('/').pop() : ''}:${d.id}`; // [FileName]:FunctionName
//         } else {  
//         return  d.id; // For classes or other node  types
//         }
//     }
  
//  // ---------------------  8.  Event Handling ------------------- 
//     private onNodeClick(event: any, d: any)  {  
//         console.log('Node  Clicked: ',  d.id); 
//         this.highlightNodeAndLinks(d.id.toString());
        

//         // Example:  Fetch  code and display in an  alert  
//         if  (d.type ===  "function")  {  
//             // **Remember to  replace  with your service  and backend API**
//                 this.codeVisualizerService.getFunctionCode(d.id.toString()) // Convert  to  string
//                     .subscribe({  
//                     next:  (code: string) =>  {  
//                     alert("Code for  function  " +  d.id.toString()  + ":\n\n"  +  code); 
//                         },  
//                         error: (error:  any)  => {
//                         console.error("Error retrieving  code:",  error);
//                     }  
//                 });  
//         }  
//     }


//     public highlightNodeAndLinks(nodeId: string)  {
//     this.node.classed("highlighted",  false); 
//         this.link.classed("highlighted", false); 


//         //  Highlight  the selected node and  its  connected links 
//         this.node.classed("highlighted",  (d:  any) =>  d.id  === nodeId);  
//         this.link.classed("highlighted",  (d: any) =>  d.source.id ===  nodeId  || d.target.id  ===  nodeId);  
//     }
//  }



// // frontend/src/app/shared/d3-graph.service.ts 
// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';  
// import { isPlatformBrowser } from '@angular/common';

// @Injectable({
//     providedIn: 'root'
// })

// export class D3GraphService {

//     constructor(@Inject(PLATFORM_ID) private platformId: any) {}

//     async createGraph(data: any, svgElementId: string): Promise<void> {
//         if (isPlatformBrowser(this.platformId)) {
//             const d3 = await import('d3'); // Dynamically import d3

//              // Now you can use 'd3'
//             const svg = d3.select(`svg#${svgElementId}`); 
//             const width = +svg.attr("width");  
//             const height = +svg.attr("height"); 

//             const simulation = d3.forceSimulation(data.nodes)
//                 .force("link", d3.forceLink(data.links)
//                 .id((d: any) => d.id) 
//                 .distance(100))  
//                 .force("charge", d3.forceManyBody().strength(-300)) 
//                 .force("center", d3.forceCenter(width / 2, height / 2));

//              const link = svg.append("g") 
//                   .attr("class", "links") 
//                   .selectAll("line") 
//                   .data(data.links)
//                   .enter().append("line") 
//                   .attr("stroke-width", 2); 

//              const node = svg.append("g")
//                  .attr("class", "nodes")  
//                  .selectAll("circle")
//                  .data(data.nodes)  
//                  .enter().append("circle") 
//                  .attr("r", 5) 
//                  .attr("fill", (d: any) => this.getNodeColor(d)) 
//                 // Drag behavior
//                 .call(d3.drag<SVGCircleElement, any, any>() 
//                     .on("start", (event: d3.D3DragEvent<SVGCircleElement, any, d3.SubjectPosition>, d: any) => this.dragstarted(event, d, simulation))  
//                     .on("drag", (event: d3.D3DragEvent<SVGCircleElement, any, d3.SubjectPosition>, d: any) => this.dragged(event, d))  
//                     .on("end", (event: d3.D3DragEvent<SVGCircleElement, any, d3.SubjectPosition>, d: any) => this.dragended(event, d, simulation))
//                     //  Mouse events (mouseover and mouseout) 
//                     .on("mouseover", (event: any, d: any) => { 
//                          d3.select(event.target) 
//                         .attr("r", 8)
//                         .style("fill", "red");  
//                         })
//                     .on("mouseout", (event: any, d: any) => {
//                         d3.select(event.target)
//                         .attr("r", 5)
//                         .style("fill", (d: any) => this.getNodeColor(d));
//                     }) 
//                  );
                    
//                  // Optional:  Add  node labels
//                     node.append("text")  
//                     .text((d: any) => d.id)  
//                     .attr("x", 6) 
//                     .attr("y", 3); 


//                  // Run the simulation  
//             simulation.on("tick", () => {  
//                 link
//                     .attr("x1", (d: any) => d.source.x)
//                     .attr("y1", (d: any) => d.source.y)
//                     .attr("x2", (d: any) => d.target.x)
//                     .attr("y2", (d: any) => d.target.y);


//                 node
//                     .attr("cx", (d: any) => d.x)
//                     .attr("cy", (d: any) => d.y);  
//                 });  
//              }
//        }
  
//       // --- Drag Event Handlers --- 
//         dragstarted(event: any, d: any, simulation: any) {
//             if (!event.active) simulation.alphaTarget(0.3).restart();
//             d.fx = d.x;
//             d.fy = d.y;
//         }


//         dragged(event: any, d: any) {
//             d.fx = event.x; 
//             d.fy = event.y;  
//         }  

//         dragended(event: any, d: any, simulation: any) {
//             if (!event.active) simulation.alphaTarget(0);
//             d.fx = null;  
//             d.fy = null;  
//         }
  

//      // ----- Node Color Logic -----
//         getNodeColor(d: any): string {
//             if (d.group === "file") {
//                 return "blue";
//             } else if (d.type === "function") {
//                 return "orange";
//             } else {
//                 return "gray";
//             }
//         }
//   }



// // frontend/src/app/shared/d3-graph.service.ts
// import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; 
// import { isPlatformBrowser } from '@angular/common'; 
// import * as d3 from 'd3'; 

// @Injectable({ 
//    providedIn: 'root'
// })  
// export class D3GraphService {
 
//     constructor(@Inject(PLATFORM_ID) private platformId: any) { }
 

//     createGraph(data: any, svgElementId: string): void {
//         if (isPlatformBrowser(this.platformId)) {  
//         const svg = d3.select(`svg#${svgElementId}`);
//         const width = +svg.attr("width");  
//         const height = +svg.attr("height"); 

//         const simulation = d3.forceSimulation(data.nodes)
//             .force("link", d3.forceLink(data.links)  
//                                 .id((d: any) => d.id)  
//                                 .distance(100))
//             .force("charge", d3.forceManyBody().strength(-300)) 
//             .force("center", d3.forceCenter(width / 2, height / 2));

//             const link = svg.append("g") 
//                         .attr("class", "links")  
//                         .selectAll("line") 
//                         .data(data.links) 
//                         .enter().append("line") 
//                         .attr("stroke-width", 2);  

//             const node = svg.append("g") 
//                         .attr("class", "nodes") 
//                         .selectAll("circle")
//                         .data(data.nodes)
//                         .enter().append("circle")
//                         .attr("r", 5)  
//                         .attr("fill", (d: any) => this.getNodeColor(d));

//             // Drag behavior  
//             node.call(d3.drag<SVGCircleElement, any, any>() 
//                 .on("start", (event: any, d: any) => this.dragstarted(event, d, simulation))
//                 .on("drag", (event: any, d: any) => this.dragged(event, d))  
//                 .on("end", (event: any, d: any) => this.dragended(event, d, simulation))  
//             ) 
//             //  Mouse events (mouseover  and  mouseout)
//             .on("mouseover", (event: any, d: any) => { 
//                 d3.select(event.target)
//                 .attr("r", 8)  
//                 .style("fill",  "red");  
//             })  
//             .on("mouseout", (event: any, d: any) => {
//                 d3.select(event.target)  
//                     .attr("r", 5) 
//                     .style("fill", (d: any) => this.getNodeColor(d)); 
//             });

//         // Optional:  Add  node labels (example):  
//         node.append("text")  
//             .text((d: any) => d.id)
//                 .attr("x", 6)  
//                 .attr("y",  3);
        

//         // Run the simulation  
//             simulation.on("tick",  () => {  
//                 link
//                     .attr("x1",  (d: any) =>  d.source.x)  
//                     .attr("y1", (d: any) => d.source.y) 
//                 .attr("x2",  (d: any) =>  d.target.x)
//                     .attr("y2", (d: any) => d.target.y);


//                 node 
//                     .attr("cx",  (d: any) => d.x)
//                     .attr("cy",  (d: any) => d.y);
//             });
//         }
//     }

//     // ---- Drag Event Handlers ---
//     dragstarted(event: any, d: any, simulation: any) {
//         if (!event.active) simulation.alphaTarget(0.3).restart(); 
//         d.fx = d.x; 
//         d.fy = d.y; 
//     }

//     dragged(event: any, d: any) {
//         d.fx = event.x;
//         d.fy = event.y; 
//     }
    

//     dragended(event: any, d: any, simulation: any) {
//         if (!event.active) simulation.alphaTarget(0);  
//         d.fx = null;
//         d.fy = null;  
//     }
    
//     //  ------ Node Color Logic -----
//     getNodeColor(d: any): string { 
//         //  Your  custom  color logic for different  node types 
//         if (d.group === "file") {  
//             return  "blue";
//         } else  if (d.type === "function") {
//             return "orange"; 
//         } else {   
//             return "gray";
//         }
//     }  

// }