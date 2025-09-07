import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  debug: false,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.replayIntegration({
      // Only capture replays for errors in production
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    // Filter out events in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },
});