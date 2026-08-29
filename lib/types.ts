
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
};
