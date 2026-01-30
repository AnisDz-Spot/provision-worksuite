export type Project = {
  id: string | number;
  uid?: string;
  slug?: string;
  name: string;
  owner: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string;
  priority?: "low" | "medium" | "high";
  starred?: boolean;
  members?: any[]; // Allow flexibility for API response
  cover?: string;
  tags?: string[];
  isTemplate?: boolean;
  progress?: number;
  budget?: number;
  spent?: number;
  departmentId?: string | null;
  department?: { name: string };
  createdAt?: string;
  archived?: boolean;
  category?: string;
  categories?: string[];
  client?: string;
  filesCount?: number;
  ownerId?: string;
  ownerAvatar?: string;
  ownerRole?: string;
  _count?: {
    tasks: number;
    milestones: number;
    files: number;
  };
  tasks?: {
    status: string;
    estimateHours?: number;
    loggedHours?: number;
  }[];
};
