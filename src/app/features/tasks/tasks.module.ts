import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TaskPageRoutingModule } from './task-page/task-page-routing.module';
import { TaskPageComponent } from './task-page/task-page';
import { TaskFormComponent } from './task-form/task-form';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TaskPageRoutingModule,
  ],
  declarations: [TaskPageComponent, TaskFormComponent],
})
export class TasksModule {}

