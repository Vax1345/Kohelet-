export interface Chapter {
  id: string;
  title: string;
  content: string;
  originalThought?: string;
  authorId: string;
  authorName: string;
  createdAt: any; // Firestore Timestamp
  ratingCount?: number;
  ratingSum?: number;
}

export interface Rating {
  id: string;
  chapterId: string;
  userId: string;
  score: number;
  createdAt: any;
}

export interface Comment {
  id: string;
  chapterId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
}
