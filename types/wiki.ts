export interface WikiPage {
  id: string;
  title: string;
  content: string | null;
  projectId: number;
  parentId: string | null;
  isPublished: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
