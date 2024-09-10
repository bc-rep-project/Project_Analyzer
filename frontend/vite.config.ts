//  vite.config.ts
import { defineConfig }  from  'vite';  

export  default  defineConfig({
  //  ... Your other  Vite  configurations
  

  optimizeDeps:  { 
    exclude: ['d3']  //  Exclude D3  from being pre-bundled for SSR 
   },  
});  