// frontend/src/app/shared/d3-graph.service.spec.ts
// frontend/src/app/shared/d3-graph.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { D3GraphService } from './d3-graph.service';
import * as d3 from 'd3';
import { DomSanitizer } from '@angular/platform-browser';

// Mock DomSanitizer
class MockDomSanitizer {
  bypassSecurityTrustHtml(value: string): any {
    return value;
  }
}

describe('D3GraphService', () => {
  let service: D3GraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        D3GraphService,
        { provide: DomSanitizer, useClass: MockDomSanitizer }
      ]
    });
    service = TestBed.inject(D3GraphService);

    // Mock D3 selections
    service.svg = {
      attr: jasmine.createSpy('attr').and.callFake((attr: string) => {
        if (attr === 'width' || attr === 'height') {
          return 100; // Mock width and height
        }
        return null;
      }),
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
        })
      }),
      call: jasmine.createSpy('call')
    } as any; // Cast to 'any' to avoid type errors

    // Mock D3 simulation and forces
    const mockForceLink = {
      links: jasmine.createSpy('links').and.returnValue([]),
      id: jasmine.createSpy('id'),
      distance: jasmine.createSpy('distance'),
      strength: jasmine.createSpy('strength')
    };

    const mockForceManyBody = {
      strength: jasmine.createSpy('strength')
    };

    const mockForceCenter = {
      x: jasmine.createSpy('x'),
      y: jasmine.createSpy('y')
    };

    spyOn(d3, 'forceSimulation').and.returnValue({
      force: jasmine.createSpy('force').and.callFake((forceName: string) => {
        switch (forceName) {
          case 'link': return mockForceLink;
          case 'charge': return mockForceManyBody;
          case 'center': return mockForceCenter;
          default: return null;
        }
      }),
      nodes: jasmine.createSpy('nodes').and.returnValue([]),
      alphaTarget: jasmine.createSpy('alphaTarget'),
      restart: jasmine.createSpy('restart'),
      on: jasmine.createSpy('on'),
      alpha: jasmine.createSpy('alpha')
    } as any); // Cast to 'any'

    // Spy on the drag method
    spyOn(service, 'drag').and.returnValue((() => {}) as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a graph', async () => {
    const mockData = {
      nodes: [
        { id: 'node1', type: 'function', complexity: 5, parent: 'parent1', x: 0, y: 0 },
        { id: 'node2', type: 'class', complexity: 10, parent: 'parent2', x: 0, y: 0 }
      ],
      links: [
        { source: 'node1', target: 'node2' }
      ]
    };
    const svgElementId = 'testGraph';

    await service.createGraph(mockData, svgElementId);

    expect(service.svg.attr).toHaveBeenCalledWith('width');
    expect(service.svg.attr).toHaveBeenCalledWith('height');
    expect(d3.forceSimulation).toHaveBeenCalledWith(mockData.nodes);
    // ... add more expectations as needed
  });

  it('should update node and link positions on tick', () => {
    // Set up mock data for nodes and links
    const mockNode1 = { x: 10, y: 20 };
    const mockNode2 = { x: 30, y: 40 };
    const mockLink = { source: mockNode1, target: mockNode2 };

    // Mock the necessary D3 objects and methods
    service.link = { attr: jasmine.createSpy('attr').and.returnValue(service.link) };
    service.node = { attr: jasmine.createSpy('attr').and.returnValue(service.node) };

    // Set up simulation nodes and links
    (service.simulation.nodes as jasmine.Spy).and.returnValue([mockNode1, mockNode2]);
    (service.simulation.force('link') as any).links.and.returnValue([mockLink]);

    // Call the ticked function
    service['ticked']();

    // Expectations for link attributes
    expect(service.link.attr).toHaveBeenCalledWith('x1', mockNode1.x);
    expect(service.link.attr).toHaveBeenCalledWith('y1', mockNode1.y);
    expect(service.link.attr).toHaveBeenCalledWith('x2', mockNode2.x);
    expect(service.link.attr).toHaveBeenCalledWith('y2', mockNode2.y);

    // Expectations for node attributes
    expect(service.node.attr).toHaveBeenCalledWith('cx', mockNode1.x);
    expect(service.node.attr).toHaveBeenCalledWith('cy', mockNode1.y);
  });

  it('should filter nodes by complexity', () => {
    const mockData = {
      nodes: [
        { id: 'node1', type: 'function', complexity: 5, parent: 'parent1', x: 0, y: 0 },
        { id: 'node2', type: 'class', complexity: 10, parent: 'parent2', x: 0, y: 0 },
        { id: 'node3', type: 'function', complexity: 2, parent: 'parent1', x: 0, y: 0 }
      ],
      links: [
        { source: 'node1', target: 'node2' },
        { source: 'node1', target: 'node3' }
      ]
    };

    (service.simulation.nodes as jasmine.Spy).and.returnValue(mockData.nodes);
    (service.simulation.force('link') as any).links.and.returnValue(mockData.links);

    service.filterNodesByComplexity(5);

    expect(service.simulation.nodes).toHaveBeenCalled();
    expect((service.simulation.force('link') as any).links).toHaveBeenCalled();
    // ... other expectations for link and node updates
    expect(service.simulation.alpha).toHaveBeenCalledWith(1);
    expect(service.simulation.restart).toHaveBeenCalled();
  });

  it('should show and hide the tooltip', () => {
    const mockNodeData = {
      id: 'testNode',
      type: 'function',
      parent: 'testParent',
      complexity: 8
    };
    const mockEvent = { pageX: 100, pageY: 200 } as MouseEvent;

    service.showTooltip(mockEvent, mockNodeData);
    expect(document.querySelector('.tooltip')).toBeTruthy();

    service.hideTooltip();
    expect(document.querySelector('.tooltip')).toBeFalsy();
  });

  it('should get the correct node label', () => {
    const fileNode = { id: 'path/to/file.js', type: 'file' };
    const functionNode = { id: 'myFunction', type: 'function' };
    const classNode = { id: 'MyClass', type: 'class' };

    expect(service['getNodeLabel'](fileNode)).toBe('file.js');
    expect(service['getNodeLabel'](functionNode)).toBe('myFunction');
    expect(service['getNodeLabel'](classNode)).toBe('MyClass');
  });
});



// // frontend/src/app/shared/d3-graph.service.spec.ts
// import { TestBed, inject } from '@angular/core/testing';
// import { PLATFORM_ID } from '@angular/core';
// import { D3GraphService } from './d3-graph.service';
// import { DomSanitizer } from '@angular/platform-browser';
// import * as d3 from 'd3';

// // Mock DomSanitizer
// class MockDomSanitizer {
//   bypassSecurityTrustHtml(value: string): any {
//     return value;
//   }
// }

// describe('D3GraphService', ()=> {
//   let service: D3GraphService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       providers: [
//         D3GraphService,
//         { provide: DomSanitizer, useClass: MockDomSanitizer },
//         { provide: PLATFORM_ID, useValue: 'browser' } // Simulate browser environment
//       ]
//     });
//     service = TestBed.inject(D3GraphService);
//   });

  // it('should be created', () => {
  //   expect(service).toBeTruthy();
  // });

//   it('should create a graph when running in the browser', async () => {
//     const mockData = {
//       nodes: [
//         { id: 'node1', type: 'function', complexity: 5, parent: 'parent1', x: 0, y: 0 }, // Add x and y
//         { id: 'node2', type: 'class', complexity: 10, parent: 'parent2', x: 0, y: 0 } // Add x and y
//       ],
//       links: [
//         { source: 'node1', target: 'node2' }
//       ]
//     };
//     const svgElementId = 'testGraph';

//     // Mock D3 selections and methods
//     service.svg = {
//       attr: jasmine.createSpy('attr').and.callFake((attr: string) => {
//         if (attr === 'width' || attr === 'height') {
//           return 100; // Mock width and height
//         }
//         return null;
//       }),
//       append: jasmine.createSpy('append').and.returnValue({
//         attr: jasmine.createSpy('attr'),
//         selectAll: jasmine.createSpy('selectAll').and.returnValue({
//           data: jasmine.createSpy('data').and.returnValue({
//             enter: jasmine.createSpy('enter').and.returnValue({
//               append: jasmine.createSpy('append').and.returnValue({
//                 attr: jasmine.createSpy('attr'),
//                 on: jasmine.createSpy('on').and.returnValue({
//                   call: jasmine.createSpy('call')
//                 }),
//                 text: jasmine.createSpy('text')
//               })
//             })
//           })
//         })
//       }),
//       call: jasmine.createSpy('call')
//     };

//     service.simulation = {
//       nodes: jasmine.createSpy('nodes').and.returnValue(mockData.nodes),
//       force: jasmine.createSpy('force').and.returnValue({
//         links: jasmine.createSpy('links').and.returnValue(mockData.links),
//         id: jasmine.createSpy('id'),
//         distance: jasmine.createSpy('distance'),
//         strength: jasmine.createSpy('strength')
//       }),
//       alphaTarget: jasmine.createSpy('alphaTarget'),
//       restart: jasmine.createSpy('restart'),
//       on: jasmine.createSpy('on')
//     };

//     // spyOn(d3, 'forceSimulation').and.returnValue(service.simulation as any);
//     // spyOn(d3, 'forceLink').and.returnValue(service.simulation.force() as any);
//     // spyOn(d3, 'forceManyBody').and.returnValue(service.simulation.force() as any);
//     // spyOn(d3, 'forceCenter').and.returnValue(service.simulation.force() as any);
//     // spyOn(d3, 'zoom').and.returnValue({
//     //   extent: jasmine.createSpy('extent'),
//     //   scaleExtent: jasmine.createSpy('scaleExtent'),
//     //   on: jasmine.createSpy('on')
//     // } as any);
//     // spyOn(service, 'drag').and.returnValue((() => {}) as any);

//     await service.createGraph(mockData, svgElementId);

//     // ... add expectations for calls to D3 methods
//     expect(service.svg.attr).toHaveBeenCalledWith('width');
//     expect(service.svg.attr).toHaveBeenCalledWith('height');
//     expect(d3.forceSimulation).toHaveBeenCalledWith(mockData.nodes);
//     // ... add more expectations as needed
//   });

//   // ... other tests for showTooltip, hideTooltip, getNodeLabel, etc. 

//   it('should update node and link positions on tick', () => {
//     // Set up mock data for nodes and links
//     const mockNode1 = { x: 10, y: 20 };
//     const mockNode2 = { x: 30, y: 40 };
//     const mockLink = { source: mockNode1, target: mockNode2 };

//     // Mock the necessary D3 objects and methods
//     service.link = { attr: jasmine.createSpy('attr').and.returnValue(service.link) }; // Chain for multiple calls
//     service.node = { attr: jasmine.createSpy('attr').and.returnValue(service.node) }; // Chain for multiple calls

//     // Call the ticked function
//     service['ticked']();

//     // Expectations for link attributes
//     expect(service.link.attr).toHaveBeenCalledWith('x1', mockNode1.x);
//     expect(service.link.attr).toHaveBeenCalledWith('y1', mockNode1.y);
//     expect(service.link.attr).toHaveBeenCalledWith('x2', mockNode2.x);
//     expect(service.link.attr).toHaveBeenCalledWith('y2', mockNode2.y);

//     // Expectations for node attributes
//     expect(service.node.attr).toHaveBeenCalledWith('cx', mockNode1.x);
//     expect(service.node.attr).toHaveBeenCalledWith('cy', mockNode1.y);
//   });
// });


// import { TestBed, inject } from '@angular/core/testing';
// import { PLATFORM_ID } from '@angular/core';
// import { D3GraphService } from './d3-graph.service';
// import { DomSanitizer } from '@angular/platform-browser';
// import * as d3 from 'd3';

// // Mock DomSanitizer
// class MockDomSanitizer {
//   bypassSecurityTrustHtml(value: string): any {
//     return value;
//   }
// }

// describe('D3GraphService', () => {
//   let service: D3GraphService;

  // beforeEach(() => {
  //   TestBed.configureTestingModule({
  //     providers: [
  //       D3GraphService,
  //       { provide: DomSanitizer, useClass: MockDomSanitizer },
  //       { provide: PLATFORM_ID, useValue: 'browser' }
  //     ]
  //   });
  //   service = TestBed.inject(D3GraphService);
  // });

  // it('should be created', () => {
  //   expect(service).toBeTruthy();
  // });

//   it('should create a graph when running in the browser', async () => {
//     const mockData = {
//       nodes: [
//         { id: 'node1', type: 'function' },
//         { id: 'node2', type: 'class' }
//       ],
//       links: [
//         { source: 'node1', target: 'node2' }
//       ]
//     };
//     const svgElementId = 'testGraph';

//     // Create a mock selection
//     const mockSelection = {
//       attr: jasmine.createSpy('attr').and.returnValue(100), // Mock width/height
//       append: jasmine.createSpy('append').and.callFake(() => mockSelection), // Return mockSelection for chaining
//       selectAll: jasmine.createSpy('selectAll').and.callFake(() => mockSelection), // Return mockSelection for chaining
//       // ... mock other methods as needed
//     };
//     spyOn(d3, 'select').and.returnValue(mockSelection as any);

//     await service.createGraph(mockData, svgElementId);

//     expect(d3.select).toHaveBeenCalledWith(`svg#${svgElementId}` as any);
//     expect(d3.forceSimulation).toHaveBeenCalled();
//     // ... add more expectations
//   });

//   it('should show and hide the tooltip', async () => {
//     const mockNodeData = {
//       id: 'testNode',
//       type: 'function',
//       parent: 'testParent'
//     };
//     const mockEvent = { pageX: 100, pageY: 200 };

//     service.showTooltip(mockEvent, mockNodeData);
//     expect(document.querySelector('.tooltip')).toBeTruthy();

//     service.hideTooltip();
//     expect(document.querySelector('.tooltip')).toBeFalsy();
//   });

//   it('should get the correct node label', () => {
//     const fileNode = { id: 'path/to/file.js', type: 'file' };
//     const functionNode = { id: 'myFunction', type: 'function' };
//     const classNode = { id: 'MyClass', type: 'class' };

//     expect(service['getNodeLabel'](fileNode)).toBe('file.js');
//     expect(service['getNodeLabel'](functionNode)).toBe('myFunction');
//     expect(service['getNodeLabel'](classNode)).toBe('MyClass');
//   });

//   it('should update node and link positions on tick', () => {
//     // Set up mock data for nodes and links
//     const mockNode1 = { x: 10, y: 20 };
//     const mockNode2 = { x: 30, y: 40 };
//     const mockLink = { source: mockNode1, target: mockNode2 };

//     // Mock the necessary D3 objects and methods
//     service.link = { attr: jasmine.createSpy('attr') };
//     service.node = { attr: jasmine.createSpy('attr') };

//     // Call the ticked function
//     service['ticked']();

//     // Expectations for link attributes
//     expect(service.link.attr).toHaveBeenCalledWith('x1', mockNode1.x);
//     expect(service.link.attr).toHaveBeenCalledWith('y1', mockNode1.y);
//     expect(service.link.attr).toHaveBeenCalledWith('x2', mockNode2.x);
//     expect(service.link.attr).toHaveBeenCalledWith('y2', mockNode2.y);

//     // Expectations for node attributes
//     expect(service.node.attr).toHaveBeenCalledWith('cx', mockNode1.x);
//     expect(service.node.attr).toHaveBeenCalledWith('cy', mockNode1.y);
//   });
// });