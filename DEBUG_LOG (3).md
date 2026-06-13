# Debug Log

---

## Bug 1

**File:** `backend/src/index.js`  
**What was wrong:** `app.use(errorHandler)` was registered **before** the route mounts (`/api/auth`, `/api/cars`, `/api/bookings`). Express only passes errors to an error-handling middleware (4-argument `(err, req, res, next)`) if that middleware appears **after** the routes that throw. With it before, every `next(err)` call inside a controller fell through to Express's built-in default error handler, which returned plain HTML instead of the project's JSON error envelope.  
**How you found it:** Reading `index.js` top-to-bottom and comparing middleware registration order against Express conventions. Confirmed by checking `authController.js` which ends every catch block with `next(err)` — that call would go nowhere useful if the error handler isn't registered after the routes.  
**What you changed:** Moved `app.use(errorHandler)` to the very end of the file, after all route mounts and the 404 catch-all handler.

---

## Bug 2

**File:** `backend/src/middleware/auth.js`  
**What was wrong:** `jwt.verify` was called with `process.env.JWT_SECRET`. The project's `.env.example` defines the variable as `ROTTO_JWT_SECRET`, and `authController.js` (the reference implementation) also uses `process.env.ROTTO_JWT_SECRET`. Because the name was wrong, `jwt.verify` received `undefined` as its secret, causing it to throw on every request, and every authenticated endpoint returned `401 INVALID_TOKEN`.  
**How you found it:** Cross-referencing `auth.js` with `.env.example` and `authController.js`. The mismatch between `JWT_SECRET` and `ROTTO_JWT_SECRET` was immediately apparent.  
**What you changed:** `process.env.JWT_SECRET` → `process.env.ROTTO_JWT_SECRET`

---

## Bug 3

**File:** `backend/src/models/Booking.js`  
**What was wrong:** The `userId` field was typed as `String` instead of `mongoose.Schema.Types.ObjectId`. MongoDB stores user `_id` values as ObjectIds. With the wrong type: (1) `.populate('userId')` silently failed because Mongoose only follows `ref` on ObjectId fields, and (2) queries like `Booking.find({ userId: req.user.id })` did a string-vs-ObjectId comparison which never matched, so users saw an empty bookings list.  
**How you found it:** Comparing the `Booking` schema to the `Car` schema (which correctly declares `userId` as `ObjectId`) and to how `req.user.id` is used in queries throughout the controllers.  
**What you changed:** `type: String` → `type: mongoose.Schema.Types.ObjectId` for the `userId` field.

---

## Bug 4

**File:** `backend/src/controllers/bookingController.js` — `getMyBookings`  
**What was wrong:** Pagination skip was computed as `page * limit` instead of `(page - 1) * limit`. With `page=1, limit=10`, this skips 10 documents, so page 1 returns what should be page 2. The real first page of results (documents 0–9) was never accessible.  
**How you found it:** Standard off-by-one verification of the pagination formula. With page=1 the skip must be 0; `page * limit` gives 10.  
**What you changed:** `const skip = page * limit` → `const skip = (page - 1) * limit`

---

## Bug 5

**File:** `frontend/src/lib/api.ts` — `buildHeaders`  
**What was wrong:** The `Authorization` header was set to the raw JWT string: `headers['Authorization'] = token`. The backend's `auth.js` middleware checks `authHeader.startsWith('Bearer ')` and splits on `' '` to extract the token. Without the `Bearer ` prefix the check fails immediately and every API call from a logged-in user returned `401 UNAUTHORIZED — No token provided`.  
**How you found it:** Opening DevTools → **Network** tab → clicking any page that requires auth → inspecting the failing request's **Request Headers**. The `Authorization` header showed a raw JWT string (starting with `eyJ...`) with no `Bearer ` prefix. Confirming in `backend/src/middleware/auth.js` that it requires the prefix made the fix clear.  
**What you changed:** `headers['Authorization'] = token` → `` headers['Authorization'] = `Bearer ${token}` ``  
**Screenshot:** *(DevTools → Network → any authenticated request → Headers tab: `Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with no "Bearer " prefix, response body `{"success":false,"error":{"code":"UNAUTHORIZED",...}}`)*

---

## Bug 6

**File:** `frontend/src/hooks/useAuth.ts`  
**What was wrong:** The `useEffect` that bootstraps auth state on page load called `localStorage.getItem('auth_token')`. But `lib/api.ts` exports `TOKEN_KEY = 'rotto_token'`, and both `login` and `logout` in the same file read/write under `TOKEN_KEY`. So a stored token was never found on refresh — `isAuthenticated` stayed `false` and every protected page immediately redirected to `/login`.  
**How you found it:** Logging in successfully (token visible in Network response), then refreshing the page and being kicked to `/login`. Opening DevTools → **Application** → **Local Storage** → confirmed the key was `rotto_token`. Grepping the source for `getItem` in `useAuth.ts` showed `'auth_token'` — the wrong key.  
**What you changed:** `localStorage.getItem('auth_token')` → `localStorage.getItem(TOKEN_KEY)` (using the imported constant).  
**Screenshot:** *(DevTools → Application → Local Storage → key `rotto_token` present with JWT value, while the broken code was looking up `auth_token` which showed as missing/undefined)*

---

## Bug 7

**File:** `frontend/src/app/login/page.tsx` — `handleSubmit`  
**What was wrong:** `handleSubmit` did not call `e.preventDefault()`. Without it the `<form>` triggered its default browser submit behaviour — a full page navigation/reload — which cancelled the in-flight `fetch` to `/api/auth/login` before it could resolve.  
**How you found it:** Clicking "Sign in" caused an immediate page reload with no error shown. DevTools → **Network** tab showed the POST to `/api/auth/login` with status **(cancelled)**. Comparing `login/page.tsx` against `register/page.tsx` (which had `e.preventDefault()` with a comment marking it correct) confirmed the omission.  
**What you changed:** Added `e.preventDefault()` as the first statement inside `handleSubmit`.  
**Screenshot:** *(DevTools → Network tab: POST `/api/auth/login` row with red ❌ status "(cancelled)" and 0 ms duration, caused by page reload)*

---

## Bug 8

**File:** `frontend/src/components/Modal.tsx`  
**What was wrong:** The modal backdrop `<div>` had inline style `position: 'static'`. A `position: static` element stays in normal document flow — it doesn't overlay the page. So clicking "+ Add Car" or "+ Book Service" caused the modal content to appear as an inline block *below* the existing page content, with no dimming overlay, no viewport centering, and no scroll lock effect.  
**How you found it:** Clicking "+ Add Car" on the Cars page — the form appeared squashed at the bottom of the page with no backdrop. DevTools → **Elements** panel → selecting the `.rt-modal-backdrop` div → **Computed** styles tab showed `position: static`. The fix was to change it to `fixed` with `inset: 0` so it covers the entire viewport.  
**What you changed:** `position: 'static'` → `position: 'fixed'`, added `inset: 0` so the backdrop covers the full viewport correctly.  
**Screenshot:** *(DevTools → Elements → Computed tab: `position: static` on `.rt-modal-backdrop`; the modal visually appeared as inline content below page elements rather than as an overlay)*

---

## Hard Feature

**Option chosen:** C — Sliding Window Rate Limiter  
**File:** `backend/src/middleware/rateLimiter.js`

### Approach

Implemented as a plain Express middleware factory. No external packages.

**Data structure:** `Map<string, number[]>` — maps each client IP to an array of request timestamps (milliseconds since epoch).

**Algorithm (per request):**
1. Get current time `now = Date.now()` and compute `windowStart = now - windowMs`
2. Retrieve the IP's timestamp array; filter out any timestamps `<= windowStart` (this is the sliding part — stale entries are discarded on every request, so the window truly slides rather than resetting at a fixed boundary)
3. If `timestamps.length >= maxRequests`: the window is full
   - Find the oldest timestamp still in the window (`timestamps[0]` after the filter)
   - Compute `retryAfterSec = ceil((oldest + windowMs - now) / 1000)` — exact seconds until that oldest slot ages out
   - Respond `429` with `Retry-After: <seconds>` header and the project's standard JSON error envelope
4. Otherwise: push `now` onto the array, store it back, call `next()`

**Why this is a true sliding window:** A fixed-window limiter resets a counter at clock boundaries (e.g. every full minute). A client can make N requests just before the boundary and N more just after, getting 2N in a short burst. The sliding window always measures the most recent `windowMs` milliseconds, so the burst is impossible — the window moves forward with every request.

**Memory management:** A `setInterval` runs every `windowMs` and prunes IPs whose arrays have become empty after filtering, preventing unbounded `Map` growth on a server that sees many distinct IPs.

**Applied in `index.js`:** `slidingWindowRateLimiter(100, 60_000)` — 100 requests per 60 seconds per IP, applied globally before all routes.

**Example 429 response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 14 second(s)."
  }
}
```
With header: `Retry-After: 14`
