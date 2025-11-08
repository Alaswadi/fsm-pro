# API Response Structure Reference

## Understanding the Response Flow

### Backend API Returns (Express)
```typescript
// api/src/controllers/setupController.ts
res.status(200).json({
  success: true,
  data: {
    setupNeeded: true,
    userCount: 0,
    companyCount: 0
  }
});
```

### Axios Receives (Raw HTTP Response)
```typescript
{
  status: 200,
  statusText: 'OK',
  headers: { ... },
  data: {
    success: true,
    data: {
      setupNeeded: true,
      userCount: 0,
      companyCount: 0
    }
  }
}
```

### API Service Returns (After `response.data`)
```typescript
// admin-frontend/src/services/api.ts
async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
  const response = await this.api.get(endpoint, { params });
  return response.data;  // Returns the JSON body
}
```

**Returns:**
```typescript
{
  success: true,
  data: {
    setupNeeded: true,
    userCount: 0,
    companyCount: 0
  }
}
```

### Component Receives (ApiResponse<T>)
```typescript
// admin-frontend/src/App.tsx
const response = await api.get<{
  setupNeeded: boolean;
  userCount: number;
  companyCount: number;
}>('/setup/check');

// response has type: ApiResponse<{ setupNeeded: boolean; ... }>
// which is: { success: boolean; data?: { setupNeeded: boolean; ... }; error?: string; }

// Access the data:
const setupNeeded = response.data?.setupNeeded;  // ✅ Correct
```

---

## ApiResponse Type Definition

```typescript
// admin-frontend/src/types/index.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Common Patterns

### Pattern 1: GET Request (Success)

**Backend:**
```typescript
res.status(200).json({
  success: true,
  data: { setupNeeded: true, userCount: 0, companyCount: 0 }
});
```

**Frontend:**
```typescript
const response = await api.get<{
  setupNeeded: boolean;
  userCount: number;
  companyCount: number;
}>('/setup/check');

// Access data
if (response.success && response.data) {
  console.log(response.data.setupNeeded);  // true
  console.log(response.data.userCount);    // 0
}
```

### Pattern 2: POST Request (Success)

**Backend:**
```typescript
res.status(200).json({
  success: true,
  data: {
    user: { id: '123', email: 'admin@test.com', ... },
    company: { id: '456', name: 'Test Co', ... }
  }
});
```

**Frontend:**
```typescript
const response = await api.post<{
  user: { id: string; email: string; ... };
  company: { id: string; name: string; ... };
}>('/setup/initialize', setupData);

// Access data
if (response.success && response.data) {
  console.log(response.data.user.email);      // 'admin@test.com'
  console.log(response.data.company.name);    // 'Test Co'
}
```

### Pattern 3: Error Response (400/403/500)

**Backend:**
```typescript
res.status(400).json({
  success: false,
  error: 'Missing required fields'
});
```

**Frontend:**
```typescript
try {
  const response = await api.post('/setup/initialize', setupData);
  // Won't reach here if status >= 400
} catch (error: any) {
  // Axios throws on 4xx/5xx status codes
  console.error(error.response?.data?.error);  // 'Missing required fields'
}
```

---

## Best Practices

### ✅ DO: Use Optional Chaining

```typescript
const response = await api.get<{ setupNeeded: boolean }>('/setup/check');
const setupNeeded = response.data?.setupNeeded ?? false;
```

### ✅ DO: Check Success Flag

```typescript
const response = await api.post<{ user: User }>('/setup/initialize', data);
if (response.success && response.data) {
  // Safe to access response.data.user
}
```

### ✅ DO: Handle Errors in Catch Block

```typescript
try {
  const response = await api.post('/setup/initialize', data);
  if (response.success) {
    toast.success('Success!');
  }
} catch (error: any) {
  toast.error(error.response?.data?.error || 'Failed');
}
```

### ❌ DON'T: Access Data Without Checking

```typescript
// ❌ Bad - might be undefined
const setupNeeded = response.data.setupNeeded;

// ✅ Good - safe access
const setupNeeded = response.data?.setupNeeded ?? false;
```

### ❌ DON'T: Assume Success Without Checking

```typescript
// ❌ Bad - might have failed
const user = response.data.user;

// ✅ Good - check success first
if (response.success && response.data) {
  const user = response.data.user;
}
```

---

## Examples from FSM Pro

### Example 1: Setup Check (App.tsx)

```typescript
const response = await api.get<{
  setupNeeded: boolean;
  userCount: number;
  companyCount: number;
}>('/setup/check');

setSetupNeeded(response.data?.setupNeeded ?? false);
```

**Why this works:**
- `api.get()` returns `ApiResponse<{ setupNeeded: boolean; ... }>`
- `response.data` has type `{ setupNeeded: boolean; ... } | undefined`
- `response.data?.setupNeeded` safely accesses the property
- `?? false` provides a fallback if undefined

### Example 2: Setup Initialize (SetupWizard.tsx)

```typescript
const response = await api.post<{
  user: { id: string; email: string; fullName: string; role: string; };
  company: { id: string; name: string; email: string; };
}>('/setup/initialize', setupData);

if (response.success && response.data) {
  toast.success('Setup completed successfully!');
  setCurrentStep(5);
} else {
  toast.error(response.error || 'Setup failed');
}
```

**Why this works:**
- `api.post()` returns `ApiResponse<{ user: ...; company: ...; }>`
- Check `response.success` to ensure operation succeeded
- Check `response.data` exists before accessing nested properties
- Use `response.error` for error messages

### Example 3: Login (Login.tsx)

```typescript
const response = await api.login(credentials);

if (response.success && response.data) {
  const { user, token } = response.data;
  localStorage.setItem('fsm_token', token);
  localStorage.setItem('fsm_user', JSON.stringify(user));
  navigate('/dashboard');
}
```

**Why this works:**
- `api.login()` returns `ApiResponse<{ user: User; token: string }>`
- Destructure `response.data` after checking it exists
- Safe to access `user` and `token` properties

---

## Debugging Tips

### 1. Log the Full Response

```typescript
const response = await api.get('/setup/check');
console.log('Full response:', response);
console.log('Response data:', response.data);
console.log('Response success:', response.success);
```

### 2. Check Network Tab (F12)

Look at the actual HTTP response:
```json
{
  "success": true,
  "data": {
    "setupNeeded": true,
    "userCount": 0,
    "companyCount": 0
  }
}
```

### 3. Verify Type Annotations

```typescript
// Hover over 'response' in VS Code to see its type
const response = await api.get<{ setupNeeded: boolean }>('/setup/check');
// Type: ApiResponse<{ setupNeeded: boolean }>
```

### 4. Use TypeScript Strict Mode

Enable strict null checks in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

This will catch potential `undefined` access at compile time.

---

## Summary

**Key Takeaway:** The `api.get()` and `api.post()` methods return an `ApiResponse<T>` object with this structure:

```typescript
{
  success: boolean;
  data?: T;           // Your typed data here
  error?: string;
  message?: string;
}
```

Always access your data via `response.data` and use optional chaining (`?.`) or null coalescing (`??`) for safety.

