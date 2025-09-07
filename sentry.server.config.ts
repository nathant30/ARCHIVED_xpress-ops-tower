import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  debug: false,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out events in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },
});