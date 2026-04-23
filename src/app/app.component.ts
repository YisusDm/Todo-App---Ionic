import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ITasksRepository, TASKS_REPOSITORY } from './core/repositories/tasks.repository';
import { ICategoriesRepository, CATEGORIES_REPOSITORY } from './core/repositories/categories.repository';
import { RemoteConfigService } from './core/services/remote-config.service';
import { ThemeService } from './core/services/theme.service';
import { MockDataService } from './core/services/mock-data.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  activeTab = 'tasks';

  private resumeSub: Subscription | null = null;

  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasksRepo: ITasksRepository,
    @Inject(CATEGORIES_REPOSITORY) private readonly categoriesRepo: ICategoriesRepository,
    private readonly remoteConfigService: RemoteConfigService,
    private readonly mockDataService: MockDataService,
    private readonly router: Router,
    private readonly platform: Platform,
    readonly themeService: ThemeService
  ) {}

  get enableCategories$(): Observable<boolean> {
    return this.remoteConfigService.enableCategories$;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  async ngOnInit(): Promise<void> {
    await this.categoriesRepo.init();
    await this.tasksRepo.init();
    await this.remoteConfigService.ensureInitialized();
    await this.mockDataService.seedIfEmpty();

    this.resumeSub = this.platform.resume.subscribe(() => {
      void this.remoteConfigService.refresh();
    });

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.activeTab = e.url.startsWith('/categories') ? 'categories' : 'tasks';
      });
  }

  ngOnDestroy(): void {
    this.resumeSub?.unsubscribe();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
