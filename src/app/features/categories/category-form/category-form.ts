import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Category } from '../../../shared/models/category.model';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.html',
  styleUrls: ['./category-form.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent implements OnInit {
  @Input() category?: Category;

  form!: FormGroup;
  readonly PRESET_COLORS = [
    '#FF5733',
    '#FFC300',
    '#28B463',
    '#2E86C1',
    '#8E44AD',
    '#F39C12',
    '#1ABC9C',
    '#E74C3C',
    '#3498DB',
    '#95A5A6',
  ];

  get isEdit(): boolean {
    return !!this.category?.id;
  }

  get nameControl() {
    return this.form.get('name')!;
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: [
        this.category?.name ?? '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
        ],
      ],
      color: [this.category?.color ?? this.PRESET_COLORS[0], Validators.required],
    });
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, color } = this.form.value;
    await this.modalCtrl.dismiss({
      action: 'save',
      category: {
        ...this.category,
        name: name.trim(),
        color,
      },
    });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  selectColor(color: string) {
    this.form.patchValue({ color });
  }
}
