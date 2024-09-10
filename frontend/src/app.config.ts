//frontend/src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';  
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http'; 
import { routes } from './app.routes'; 

export const appConfig: ApplicationConfig = {
 providers: [
   importProvidersFrom(
     MatProgressSpinnerModule,
     BrowserAnimationsModule,
     HttpClientModule  
   ),
   provideRouter(routes)
 ] 
};