import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ToastService, ToastMessage } from './toast.service';
import { faArrowsLeftRightToLine } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit {
  show = false;
  message = '';
  type: 'success' | 'error' | 'info' = 'success';

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.toastService.toastState.subscribe((toast: ToastMessage) => {
      this.message = toast.text;
      this.type = toast.type;
      this.show = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.show = false;
        this.cdr.detectChanges();
      }, 3000);
    });
  }
}
