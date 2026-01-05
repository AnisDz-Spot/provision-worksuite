export type ActionItem = {
  id: string;
  text: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
};

export type Meeting = {
  id: string;
  title: string;
  date: string;
  projectId: string | null;
  attendees: string[];
  content: string;
  actionItems: ActionItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
