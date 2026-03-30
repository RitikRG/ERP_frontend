import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './services/toast.component';
import { provideIcons } from '@ng-icons/core';
import { heroCameraSolid, heroTrashSolid} from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  viewProviders: [provideIcons({ heroCameraSolid, heroTrashSolid })],
})
export class App {}
