import { Component, Inject, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ITasksRepository, TASKS_REPOSITORY } from './core/repositories/tasks.repository';
import { ICategoriesRepository, CATEGORIES_REPOSITORY } from './core/repositories/categories.repository';
import { RemoteConfigService } from './core/services/remote-config.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  activeTab = 'tasks';

  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasksRepo: ITasksRepository,
    @Inject(CATEGORIES_REPOSITORY) private readonly categoriesRepo: ICategoriesRepository,
    private readonly remoteConfigService: RemoteConfigService,
    private readonly router: Router
  ) {}

  get enableCategories$(): Observable<boolean> {
    return this.remoteConfigService.enableCategories$;
  }

  async ngOnInit(): Promise<void> {
    await this.categoriesRepo.init();
    await this.tasksRepo.init();
    await this.remoteConfigService.ensureInitialized();

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.activeTab = e.url.startsWith('/categories') ? 'categories' : 'tasks';
      });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
