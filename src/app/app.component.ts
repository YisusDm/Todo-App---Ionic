import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TaskService } from './core/services/task.service';
import { CategoryService } from './core/services/category.service';
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
    private taskService: TaskService,
    private categoryService: CategoryService,
    private remoteConfigService: RemoteConfigService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.categoryService.init();
    await this.taskService.init();
    await this.remoteConfigService.init();

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
