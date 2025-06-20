# Class Library Web

This is a Firebase-based class library management system. It uses Vite to bundle the client code.

## Building

Set the Firebase credentials as environment variables and run:

```sh
FIREBASE_API_KEY=... FIREBASE_AUTH_DOMAIN=... FIREBASE_PROJECT_ID=... FIREBASE_STORAGE_BUCKET=... FIREBASE_MESSAGING_SENDER_ID=... FIREBASE_APP_ID=... FIREBASE_MEASUREMENT_ID=... npm run build
```

The build outputs the static site to the `dist` directory.

## Deploying to Vercel

Vercel will execute `npm run build` and serve the generated `dist` directory. A `vercel.json` configuration file is included so the deployment works out of the box. Remember to define the Firebase environment variables in your Vercel project settings.

