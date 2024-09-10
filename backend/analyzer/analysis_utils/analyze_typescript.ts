//backend/analyzer/analysis_utils/analyze_typescript.ts
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';


interface Node {
  id: string;
  type: string;
  parent?: string;
}


interface Link { 
   source: string;
   target: string;
} 


function analyzeTypeScriptFile(filePath: string): { nodes: Node[], links: Link[] } {
    const program = ts.createProgram([filePath], {});
    const sourceFile = program.getSourceFile(filePath);


    if (!sourceFile) {
       console.error(`Error: Could not parse source file: ${filePath}`); 
        return { nodes: [], links: [] }; 
     }
 

    const nodes: Node[] = [{ id: filePath, type: 'file' }];
    const links: Link[] = []; 


     function visit(node: ts.Node) {
        if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) { 
             const functionName = node.name ? node.name.getText(sourceFile) : 'anonymous'; 
            nodes.push({ id: functionName, type: 'function', parent: filePath });


             ts.forEachChild(node, (child) => {  
                if (ts.isCallExpression(child)) {  
                    const calledFunction = child.expression.getText(sourceFile); 
                    links.push({ source: functionName, target: calledFunction });
                 }
              }); 
          }
         ts.forEachChild(node, visit); 
      }  


      visit(sourceFile);
      return { nodes, links };
   }
 

  export function analyzeTypeScriptRepository(repoPath: string): { nodes: Node[], links: Link[] } { 
    const nodes: Node[] = []; 
    const links: Link[] = [];
 

    function walkDirectory(directory: string) {  
      const items = fs.readdirSync(directory);  
       for (const item of items) { 
         const fullPath = path.join(directory, item); 
         const stat = fs.statSync(fullPath);


          if (stat.isDirectory()) {  
             walkDirectory(fullPath); 
          } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
              const { nodes: fileNodes, links: fileLinks } = analyzeTypeScriptFile(fullPath); 
               nodes.push(...fileNodes); 
               links.push(...fileLinks);
           } 
        } 
     } 


     walkDirectory(repoPath); 
      return { nodes, links };  
   }