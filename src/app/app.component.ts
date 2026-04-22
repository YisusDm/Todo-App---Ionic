import { Component, OnInit } from '@angular/core';
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
  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private remoteConfigService: RemoteConfigService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.categoryService.init();
    await this.taskService.init();
    await this.remoteConfigService.init();
  }
}
