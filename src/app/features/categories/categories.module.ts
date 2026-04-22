import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CategoryPageRoutingModule } from './category-page/category-page-routing.module';
import { CategoryPageComponent } from './category-page/category-page';
import { CategoryFormComponent } from './category-form/category-form';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CategoryPageRoutingModule,
  ],
  declarations: [CategoryPageComponent, CategoryFormComponent],
})
export class CategoriesModule {}

