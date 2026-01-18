# Step-by-Step Guide to Access Control

This document explains how role-based access control is implemented in your application. The system is designed to differentiate between two main roles: `client` and `admin`.

---

### Part 1: Defining User Roles (The Data Layer)

The foundation of our access control is the `role` property on a user's record.

**1. Data Structure:**
In `docs/backend.json`, the `User` entity is defined with a `role` property. This establishes that every user will have a role associated with them.

```json
"User": {
  "type": "object",
  "properties": {
    "email": { ... },
    "name": { ... },
    "role": {
      "type": "string",
      "description": "The user's role within the application (e.g., 'client', 'admin')."
    }
  },
  ...
}
```

**2. Assigning a Default Role:**
When a new user signs up, they are automatically assigned the `client` role. This logic is in `src/components/auth/register-form.tsx`.

```tsx
// src/components/auth/register-form.tsx

const newUser: Omit<AppUser, 'id'> = {
  uid: firebaseUser.uid,
  name: values.name,
  email: values.email,
  role: 'client', // New users are always clients
};
await setDoc(userDocRef, newUser);
```

**3. How to Make a User an Admin:**
To grant a user admin privileges, you must manually change their `role` from `client` to `admin` in your Firebase Firestore database.
- Go to the Firebase Console.
- Navigate to Firestore Database.
- In the `users` collection, find the document for the user you want to make an admin.
- Edit the `role` field from `'client'` to `'admin'`.

---

### Part 2: Loading User Roles on the Frontend (The Auth Provider)

When a user logs in, we need to fetch their role and make it available throughout the app.

**File:** `src/components/auth-provider.tsx`

This component listens for authentication changes. When a user logs in, it fetches their corresponding document from the `users` collection in Firestore and stores their complete profile (including the `role`) in the auth context.

This user object is then accessible in any component by calling the `useAuth()` hook.

```tsx
// src/components/auth-provider.tsx

const { user, loading } = useAuth();
// user object now contains: { uid, name, email, role }
```

---

### Part 3: Controlling UI Visibility (Conditional Rendering)

With the user's role available, we can now easily show or hide parts of the user interface.

**Files:** `src/components/layout/header.tsx`, `src/app/page.tsx`

You will see this pattern used frequently:

```tsx
{user?.role === 'admin' && (
  <ActionCard
    href="/overview"
    icon={<LayoutDashboard />}
    title="Overview"
    description="View key stats and charts."
  />
)}
```
This is a standard React pattern for conditional rendering. The `ActionCard` component will only be rendered if `user.role` is equal to `'admin'`. This is how we hide admin-only links and buttons from regular clients.

---

### Part 4: Protecting Pages (Route Guards)

Hiding a link is not enough. A user could still try to access an admin page by typing the URL directly. We prevent this using a "route guard".

**File:** `src/components/admin/admin-route.tsx`

This component wraps any page that should be admin-only. For example, in `src/app/admin/dashboard/page.tsx`:

```tsx
<AdminRoute>
  {/* Admin page content here */}
</AdminRoute>
```

The `AdminRoute` component checks if the user is an admin. If they are not, it automatically redirects them to the homepage, effectively blocking access.

---

### Part 5: Enforcing Security on the Backend (Firestore Rules)

This is the most critical part of access control. Frontend controls can be bypassed, but backend rules cannot.

**File:** `firestore.rules`

These rules are the ultimate source of truth for your data security. They run on Google's servers and cannot be tampered with by users.

We have a helper function `isAdmin()` that checks the user's role directly from the database.

```rules
function isAdmin() {
  return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

This function is then used to grant special permissions. For example, only an admin can list all appointments:

```rules
match /appointments/{appointmentId} {
  // An admin can read any appointment.
  allow get: if isAdmin() || resource.data.clientId == request.auth.uid;
  
  // An admin can list ALL appointments. 
  // Clients can only list their own appointments using a query.
  allow list: if isSignedIn(); 
}
```

This ensures that even if a client could somehow try to fetch all appointments, your Firestore Security Rules would block the request.

---

### Summary

By combining these five steps, you have a complete, multi-layered security model:
- **Data Layer:** The `role` is defined and stored.
- **Auth Provider:** The `role` is loaded into the app.
- **Conditional UI:** The UI adapts based on the `role`.
- **Route Guards:** Pages are protected from unauthorized access.
- **Firestore Rules:** The backend enforces data access policies, providing the ultimate security.
