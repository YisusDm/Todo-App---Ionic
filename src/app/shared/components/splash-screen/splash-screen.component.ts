import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashScreenComponent {
  @Input() isExiting = false;
}
