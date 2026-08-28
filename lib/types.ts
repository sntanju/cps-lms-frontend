// Shared shapes for the data the Strapi API returns.

// Who owns a course. Deliberately just these two fields: the backend builds this
// object by hand in src/api/course/controllers/course.ts rather than populating
// the user relation, so nothing else about the account is exposed.
export type Instructor = {
  id: number;
  fullName: string;
};

// One unit of a course. `content` and `videoUrl` are two separate optional
// fields rather than one polymorphic field plus a type flag: the spec says
// content is "text or a video URL", and keeping them apart means nothing has to
// branch on a type enum, and an author can attach a video *and* notes.
export type Lesson = {
  id: number;
  documentId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  // Set by the author, defaulted by the backend to (lesson count + 1). Lessons
  // are always read in this order; the numbers may have gaps after a delete and
  // that is fine, nothing depends on them being contiguous.
  order: number;
};

export type Course = {
  // Strapi 5 addresses entries by documentId in URLs (/api/courses/:documentId),
  // but relation fields still take the numeric id. Both are kept because both
  // get used — routing on the wrong one gives a 404 that looks like a
  // permissions problem.
  id: number;
  documentId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  instructor: Instructor | null;
  // Only present when the request asked for ?populate[lessons]=true, which the
  // course detail page does. Absent everywhere else, hence optional.
  lessons?: Lesson[];
};

// An account a course may be assigned to, from GET /api/course-instructors.
// Only Admin and Content Manager can read that list, because only they may
// assign a course to somebody other than themselves.
export type AssignableInstructor = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};
