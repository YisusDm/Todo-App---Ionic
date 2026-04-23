import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideRemoteConfig, getRemoteConfig } from '@angular/fire/remote-config';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent, NotificationComponent, SplashScreenComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    CoreModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideRemoteConfig(() => getRemoteConfig()),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule {}
