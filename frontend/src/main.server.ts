import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app.config'; 
import { provideHttpClient, withFetch } from '@angular/common/http';

const bootstrap = () => bootstrapApplication(AppComponent, {
  providers: [...appConfig.providers, provideHttpClient(withFetch())] 
});

export default bootstrap; 