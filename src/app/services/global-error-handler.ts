import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ErrorLoggingService } from './error-logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly errorLogging = inject(ErrorLoggingService);

  handleError(error: unknown): void {
    this.errorLogging.captureRuntimeError(error);
    console.error(error);
  }
}
