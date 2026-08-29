
export type Instructor = {
  id: number;
  fullName: string;
};


export type Lesson = {
  id: number;
  documentId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  
  order: number;
};

export type Course = {
  
  id: number;
  documentId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  instructor: Instructor | null;
  
  lessons?: Lesson[];
  quiz?: CourseQuiz | null;
};


export type AssignableInstructor = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};


export type Enrollment = {
  id: number;
  documentId: string;
  enrolledAt: string;
  course: Course;
  progress: Progress;
};

export type Progress = {
  completed: number;
  total: number;
  percentage: number;
};

export type CourseProgress = Progress & {
  completedLessonIds: string[];
};

export type StudentProgress = Progress & {
  student: { id: number; fullName: string; email: string };
  enrolledAt: string;
};

export type CourseLessons = {
  course: { documentId: string; title: string };
  lessons: Lesson[];
};

export type CourseQuiz = {
  documentId: string;
  title: string;
  questionCount: number;
};

export type QuizQuestion = {
  id: number;
  documentId: string;
  text: string;
  options: string[];
  correctIndex: number;
};

export type AuthoredQuiz = {
  id: number;
  documentId: string;
  title: string;
  courseDocumentId: string | null;
  questions: QuizQuestion[];
};

export type StudentQuizQuestion = {
  id: string;
  text: string;
  options: string[];
};

export type StudentQuiz = {
  id: string;
  title: string;
  questions: StudentQuizQuestion[];
};

export type GradedAnswer = {
  questionId: string;
  selectedIndex: number | null;
  correct: boolean;
};

export type QuizAttempt = {
  id: number;
  documentId: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  answers: GradedAnswer[];
};

export type MyQuizResult = {
  id: number;
  documentId: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  quiz: { documentId: string; title: string } | null;
  course: { documentId: string; title: string } | null;
};

export type CourseQuizResult = {
  id: number;
  documentId: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  student: { id: number; fullName: string; email: string };
  quiz: { documentId: string; title: string } | null;
};

export type BlogPostAuthor = {
  id: number;
  fullName: string;
};

export type BlogPost = {
  id: number;
  documentId: string;
  title: string;
  body: string;
  coverImageUrl: string | null;
  postStatus: 'draft' | 'published';
  author: BlogPostAuthor | null;
  createdAt: string;
};
