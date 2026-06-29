import * as Sentry from '@sentry/nextjs';

/**
 * Capture exceptions for observability.
 * Will log to console and report to Sentry (if DSN is configured).
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error('[OBSERVABILITY ERROR]', error, context);
  Sentry.captureException(error, { extra: context });
}

export function captureWarn(message: string, context?: Record<string, unknown>) {
  console.warn('[OBSERVABILITY WARN]', message, context);
  Sentry.captureMessage(message, { extra: context });
}

export function captureEvent(name: string, context?: Record<string, unknown>) {
  console.log(`[OBSERVABILITY EVENT] ${name}`, context || {});
  // Depending on analytics provider (PostHog/Amplitude/etc.), emit here.
  // We'll log it out as required by the PRD.
}
