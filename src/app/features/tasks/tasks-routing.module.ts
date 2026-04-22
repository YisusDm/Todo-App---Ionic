import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskPageComponent } from './task-page/task-page';


const routes: Routes = [
  {
    path: '',
    component: TaskPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksPageRoutingModule {}
