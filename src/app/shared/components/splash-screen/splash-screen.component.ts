import { Component, Inject, Input, ChangeDetectionStrategy } from '@angular/core';
import { APP_VERSION } from '../../../core/tokens/app-version.token';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashScreenComponent {
  @Input() isExiting = false;

  constructor(@Inject(APP_VERSION) readonly version: string) {}
}
