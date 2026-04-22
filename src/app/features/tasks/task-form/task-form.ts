import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Task } from '../../../shared/models/task.model';
import { Category } from '../../../shared/models/category.model';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.html',
  styleUrls: ['./task-form.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit {
  @Input() task?: Task;
  @Input() categories: Category[] = [];

  form!: FormGroup;

  get isEdit(): boolean {
    return !!this.task?.id;
  }

  get titleControl() {
    return this.form.get('title')!;
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      title: [
        this.task?.title ?? '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [
        this.task?.description ?? '',
        Validators.maxLength(500),
      ],
      categoryId: [this.task?.categoryId ?? null],
      dueDate: [
        this.task?.dueDate
          ? new Date(this.task.dueDate).toISOString().split('T')[0]
          : null,
      ],
    });
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, categoryId, dueDate } = this.form.value;
    await this.modalCtrl.dismiss({
      action: 'save',
      task: {
        ...this.task,
        title: title.trim(),
        description: description?.trim() || undefined,
        categoryId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}
