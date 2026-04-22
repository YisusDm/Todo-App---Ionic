import { NgModule, Optional, SkipSelf } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';

// Imported once in AppModule — guards against double import
@NgModule({
  imports: [IonicStorageModule.forRoot()],
  exports: [IonicStorageModule],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parent: CoreModule) {
    if (parent) {
      throw new Error('CoreModule already loaded. Import only in AppModule.');
    }
  }
}
