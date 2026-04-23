import { NgModule, Optional, SkipSelf } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { TASKS_REPOSITORY } from './repositories/tasks.repository';
import { CATEGORIES_REPOSITORY } from './repositories/categories.repository';
import { StorageTasksRepository } from './repositories/storage-tasks.repository';
import { StorageCategoriesRepository } from './repositories/storage-categories.repository';

// Imported once in AppModule — guards against double import
@NgModule({
  imports: [IonicStorageModule.forRoot()],
  exports: [IonicStorageModule],
  providers: [
    { provide: TASKS_REPOSITORY, useClass: StorageTasksRepository },
    { provide: CATEGORIES_REPOSITORY, useClass: StorageCategoriesRepository },
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parent: CoreModule) {
    if (parent) {
      throw new Error('CoreModule already loaded. Import only in AppModule.');
    }
  }
}
