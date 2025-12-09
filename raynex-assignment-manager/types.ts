export interface AssignmentData {
  id: string;
  number: string;
  name: string;
  courseName: string;
  courseCode: string;
  studentName: string; // Mapped to "Submitted By"
  studentID: string;
  semester: string;
  teacherName: string; // Mapped to "Submitted To"
  submissionDate: string;
  universityName: string; // Editable University Name
  maxFileSizeMB: number;
  pagesNeeded: number;
  contentPages: string[]; // HTML content for pages 2+
  createdAt: number;
  updatedAt: number;
  borderColor?: string;
  coverRows?: { label: string; value: string }[];
}

export interface User {
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}