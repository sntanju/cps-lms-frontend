# CPS LMS — Frontend (Next.js)

The web client for a Learning Management System with four roles: **Admin**, **Content
Manager**, **Instructor** and **Student**. Built for the Junior Software Engineer project
round.

The Strapi backend lives in a separate repository; this app calls it over HTTP.

- Stack: Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS v4
- Deployed on Vercel

---

## Running it locally

**Requirements:** Node 20+, and the backend running on `http://localhost:1337`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

### Environment variables

| Variable | What it is for |
| --- | --- |
| `NEXT_PUBLIC_STRAPI_URL` | Base URL of the Strapi backend, with no trailing slash. `http://localhost:1337` locally; the Railway URL on Vercel. |

It is `NEXT_PUBLIC_` because the browser calls the API directly, carrying its own access
token — there is no server-side proxy in between.

`NEXT_PUBLIC_` variables are inlined at build time, so changing this on Vercel requires a
redeploy to take effect.

---

## Routes

| Path | Who can open it |
| --- | --- |
| `/` | Anyone |
| `/login`, `/register` | Anyone |
| `/blog`, `/blog/[documentId]` | **Anyone, including logged out** |
| `/dashboard` | Any signed-in user |
| `/courses`, `/courses/[documentId]` | Any signed-in user |
| `/courses/[documentId]/lessons/[lessonDocumentId]` | Enrolled students and the course's owners |
| `/courses/[documentId]/quiz` | Enrolled students |
| `/my-courses`, `/my-results` | Student |
| `/manage/courses/…` | Admin, Content Manager, Instructor |
| `/manage/blog/…` | Admin, Content Manager |
| `/admin`, `/admin/users` | Admin |

Guards are `RequireAuth` in a `layout.tsx`, so a whole section is protected in one place
and a new page under it inherits the guard. `/manage/blog` nests a narrower guard inside
`/manage`, because Instructors have no blog rights.

**These guards are UX, not security.** They decide what to render; Strapi decides what
is allowed. Every protected action is enforced again on the backend, and a request that
slips past the UI comes back 403.

---

## How it talks to the backend

`lib/api.ts` is the whole API client.

**Tokens live in `localStorage`, not a cookie.** Login returns `{ jwt, refreshToken }` in
the response body and the access token is sent as an `Authorization: Bearer` header.
The reason is deployment: Vercel and Railway are different sites, so a refresh cookie
would be a third-party cookie and Safari blocks those by default, which would silently
log users out. The trade-offs that follow from it:

- **Refresh rotates.** `POST /api/auth/refresh` returns a *new* refresh token, so both
  values are overwritten on every refresh. Storing only the new access token would break
  the next one.
- **Parallel 401s share one refresh.** Without that, three concurrent requests would each
  rotate the token and the two that lost the race would be holding a dead one. `lib/api.ts`
  keeps a single in-flight refresh promise.
- **No user-authored HTML is ever rendered.** The refresh token is readable by
  JavaScript, so `dangerouslySetInnerHTML` appears nowhere in this app. Blog post bodies
  are plain text with `whitespace-pre-wrap`; a `<script>` in a body shows as text.

A 401 is normal, not a logout: access tokens are short-lived, so `apiFetch` refreshes and
retries once before giving up.

---

## Completed features

**Core**

- Sign up and log in, with the signed-in user's role available app-wide through
  `lib/auth-context.tsx`.
- Role-based route guards on every protected section.
- Course browsing and course detail pages.
- Course create / edit / delete for Admin, Content Manager and Instructor, with an
  instructor picker for the two platform-wide roles.
- Lesson create / edit / delete, and a lesson reader with previous/next navigation.
- Enrolment, and a separate "My Courses" list.

**Differentiators**

- Progress tracking — mark a lesson complete, per-course progress bars on the course page
  and in My Courses, and a per-student roster for course owners.
- Quizzes — a builder for authors (question, options, and a radio group whose index *is*
  the correct answer), a taking page for students, an immediate score with per-question
  feedback taken from the server's verdict, an attempt history, and a "My Results" page.
- Admin panel — platform statistics and a user table with per-row role assignment.
- Blog — a public list and post page, plus draft/published management with explicit
  "Save as draft" / "Publish" / "Unpublish" buttons.

## Deliberately not built

- **Server-side rendering of authenticated pages.** Tokens live in `localStorage`, which
  the server cannot read, so authenticated pages are client components. The public blog
  could be rendered on the server; it is not, for consistency with the rest of the app.
- **A component library.** Plain Tailwind, so every class in the tree is explainable.
- **Optimistic UI.** After a write the app re-reads from the server rather than guessing,
  so a refused change never leaves a stale value on screen.
- **Rich text editing** for blog posts — see the XSS note above.

---

## Commands

```bash
npm run dev
npm run build
npm run lint
```

There is no test suite; verification was `npm run build`, `npm run lint`, and walking the
app as each of the four roles.

---

