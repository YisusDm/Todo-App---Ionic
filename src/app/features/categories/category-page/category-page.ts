/**
 * CategoryPage Component
 * Location: src/app/features/categories/category-page/category-page.ts
 */
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CategoriesFacade } from '../state/categories.facade';
import { NotificationService } from '../../../shared/services/notification.service';
import { Category } from '../../../shared/models/category.model';
import { CategoryFormComponent } from '../category-form/category-form';
import { CategoryTaskStats } from '../state/categories.facade';

@Component({
  selector: 'app-category-page',
  templateUrl: './category-page.html',
  styleUrls: ['./category-page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = true;

  constructor(
    readonly categoriesFacade: CategoriesFacade,
    private readonly notificationService: NotificationService,
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController
  ) {}

  get categories$(): Observable<Category[]> {
    return this.categoriesFacade.categories$;
  }

  get taskStatsMap$(): Observable<Record<string, CategoryTaskStats>> {
    return this.categoriesFacade.taskStatsMap$;
  }

  ngOnInit(): void {
    this.categories$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openCategoryModal(category?: Category): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategoryFormComponent,
      componentProps: { category },
    });

    await modal.present();
    const result = await modal.onDidDismiss();

    if (result.data?.action === 'save') {
      try {
        if (category) {
          await this.categoriesFacade.updateCategory(result.data.category);
          this.notificationService.show('Categoría actualizada', 'success');
        } else {
          await this.categoriesFacade.addCategory(result.data.category);
          this.notificationService.show('Categoría creada', 'success');
        }
      } catch {
        this.notificationService.show('Error al guardar', 'danger');
      }
    }
  }

  async confirmDelete(id: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar categoría',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.categoriesFacade.deleteCategory(id);
              this.notificationService.show('Categoría eliminada', 'danger');
            } catch {
              this.notificationService.show('Error al eliminar', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  trackByCategoryId(_index: number, category: Category): string {
    return category.id;
  }
}
