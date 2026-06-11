# Special Notes & Considerations

## Tech Stack
- **Frontend Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS 3.4
- **Icons:** `@tabler/icons-react`
- **Charts:** `recharts`
- **Backend/BaaS:** Firebase (Auth, Firestore, Hosting)

## Development Setup
- The application uses `npm run dev` to start the Vite development server.
- The entry point is `src/main.jsx`, which renders the `App` component wrapped in several context providers (`AuthProvider`, `SubscriptionProvider`, `InventoryProvider`).

## Authentication & Routing
- The `PrivateRoute` component in `src/App.jsx` handles authentication checks. If a user is not authenticated, they are automatically redirected to the `/login` route.
- A loading spinner is displayed while the Firebase authentication state is being initialized.

## Data Connect
- There is a reference to `@dataconnect/generated` in `package.json`, suggesting the project utilizes Firebase Data Connect for typed SDK generation. Ensure `src/dataconnect-generated` is kept up to date if the schema changes.

## Database & Security
- The system relies on Firebase Firestore. The database rules can be found in `firestore.rules`.
- Ensure that Firebase configuration keys are properly set up (typically in an `.env` file).
