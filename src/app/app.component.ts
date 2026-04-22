import { Component, OnInit } from '@angular/core';
import { TaskService } from './core/services/task.service';
import { CategoryService } from './core/services/category.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService
  ) {}

  async ngOnInit(): Promise<void> {
    // Initialize storage once at app startup so all pages have data ready
    await this.categoryService.init();
    await this.taskService.init();
  }
}
