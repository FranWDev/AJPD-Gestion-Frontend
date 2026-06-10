import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PopupComponent } from './shared/components/popup/popup';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('ajpd-front');
}
