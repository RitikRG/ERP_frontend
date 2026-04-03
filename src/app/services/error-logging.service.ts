import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { environment } from '../../enviornment/enviornment';
import { AuthService } from '../auth/auth.service';
import { AdminAuthService } from '../admin/admin-auth.service';

type ErrorSeverity = 'warn' | 'error' | 'fatal';

interface ClientErrorPayload {
  severity: ErrorSeverity;
  source: string;
  message: string;
  stack?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, unknown> | null;
  client?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ErrorLoggingService {
  private readonly endpoint = `${environment.apiUrl}/system/error-logs/client`;
  private readonly auth = inject(AuthService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly recentFingerprints = new Map<string, number>();

  captureRuntimeError(error: unknown) {
    const normalized = this.normalizeError(error);
    this.send({
      severity: 'fatal',
      source: 'frontend.runtime',
      message: normalized.message,
      stack: normalized.stack,
      route: this.getCurrentRoute(),
      action: 'global-error-handler',
      metadata: {
        kind: normalized.kind,
        rawError: this.toSerializable(error),
      },
      client: this.buildClientContext(),
    });
  }

  captureHttpError(error: HttpErrorResponse, request: HttpRequest<unknown>) {
    if (request.url.includes('/system/error-logs/client')) {
      return;
    }

    if (error.status !== 0 && error.status < 500) {
      return;
    }

    const backendMessage =
      typeof error.error === 'object' && error.error && 'message' in error.error
        ? String(error.error.message || '')
        : '';

    this.send({
      severity: error.status === 0 ? 'fatal' : 'error',
      source: 'frontend.http',
      message:
        backendMessage ||
        error.message ||
        `HTTP ${error.status || 0} for ${request.method} ${request.urlWithParams}`,
      route: this.getCurrentRoute(),
      action: `${request.method} ${request.urlWithParams}`,
      metadata: {
        kind: 'http',
        status: error.status,
        statusText: error.statusText,
        request: {
          method: request.method,
          url: request.urlWithParams,
        },
        response: this.toSerializable(error.error),
      },
      client: this.buildClientContext(),
    });
  }

  private send(payload: ClientErrorPayload) {
    if (!this.shouldSend(payload)) {
      return;
    }

    const token = this.adminAuth.getAccessToken() || this.auth.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(this.endpoint, {
      method: 'POST',
      headers,
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  private shouldSend(payload: ClientErrorPayload) {
    if (typeof window === 'undefined') {
      return false;
    }

    const fingerprint = `${payload.source}|${payload.action || ''}|${payload.message}|${payload.route || ''}`;
    const now = Date.now();
    const lastSeenAt = this.recentFingerprints.get(fingerprint) || 0;

    if (now - lastSeenAt < 5000) {
      return false;
    }

    this.recentFingerprints.set(fingerprint, now);

    if (this.recentFingerprints.size > 200) {
      const oldestKey = this.recentFingerprints.keys().next().value;
      if (oldestKey) {
        this.recentFingerprints.delete(oldestKey);
      }
    }

    return true;
  }

  private getCurrentRoute() {
    return globalThis.location?.pathname || '';
  }

  private buildClientContext() {
    const browserNavigator = globalThis.navigator;
    const browserDocument = globalThis.document;
    const browserWindow = globalThis.window;
    const user = this.auth.currentUserValue;
    const admin = this.adminAuth.currentAdminValue;

    return {
      href: globalThis.location?.href || '',
      userAgent: browserNavigator?.userAgent || '',
      referrer: browserDocument?.referrer || '',
      viewport: browserWindow ? `${browserWindow.innerWidth}x${browserWindow.innerHeight}` : '',
      user: user
        ? {
            id: user._id || user.id,
            orgId: user.org_id,
            role: user.type || '',
          }
        : null,
      admin: admin
        ? {
            id: admin._id || admin.id,
            email: admin.email,
          }
        : null,
    };
  }

  private normalizeError(error: unknown) {
    if (error instanceof Error) {
      return {
        kind: error.name || 'Error',
        message: error.message || 'Unknown frontend error',
        stack: error.stack || '',
      };
    }

    const rejection = this.extractRejection(error);
    if (rejection instanceof Error) {
      return {
        kind: rejection.name || 'UnhandledRejection',
        message: rejection.message || 'Unhandled promise rejection',
        stack: rejection.stack || '',
      };
    }

    return {
      kind: typeof error,
      message: String(error || 'Unknown frontend error'),
      stack: '',
    };
  }

  private extractRejection(error: unknown) {
    if (typeof error === 'object' && error && 'rejection' in error) {
      return (error as { rejection?: unknown }).rejection;
    }

    return null;
  }

  private toSerializable(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (depth > 4) {
      return '[MaxDepth]';
    }

    if (typeof value === 'string') {
      return value.slice(0, 4000);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack || '',
      };
    }

    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => this.toSerializable(item, depth + 1, seen));
    }

    if (typeof value === 'object') {
      if (seen.has(value as object)) {
        return '[Circular]';
      }

      seen.add(value as object);

      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>)
        .slice(0, 30)
        .forEach(([key, entryValue]) => {
          result[key] = this.toSerializable(entryValue, depth + 1, seen);
        });

      return result;
    }

    return String(value);
  }
}
