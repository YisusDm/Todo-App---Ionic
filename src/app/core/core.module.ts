import { NgModule, Optional, SkipSelf } from '@angular/core';
import { TASKS_REPOSITORY } from './repositories/tasks.repository';
import { CATEGORIES_REPOSITORY } from './repositories/categories.repository';
import { SqliteTasksRepository } from './repositories/sqlite-tasks.repository';
import { SqliteCategoriesRepository } from './repositories/sqlite-categories.repository';

// Imported once in AppModule — guards against double import
@NgModule({
  providers: [
    { provide: TASKS_REPOSITORY, useClass: SqliteTasksRepository },
    { provide: CATEGORIES_REPOSITORY, useClass: SqliteCategoriesRepository },
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parent: CoreModule) {
    if (parent) {
      throw new Error('CoreModule already loaded. Import only in AppModule.');
    }
  }
}
