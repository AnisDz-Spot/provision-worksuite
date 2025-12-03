/**
 * Firestore Database Utilities
 * 
 * This file provides all database operations for ProVision WorkSuite.
 * It replaces localStorage with Firebase Firestore for real-time sync.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  owner: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress?: number;
  starred?: boolean;
  createdAt?: any;
  updatedAt?: any;
  userId?: string; // Owner's user ID for security rules
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  due?: string;
  priority?: 'low' | 'medium' | 'high';
  estimateHours?: number;
  loggedHours?: number;
  milestoneId?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type TimeLog = {
  id: string;
  taskId: string;
  projectId: string;
  hours: number;
  note?: string;
  loggedBy: string;
  loggedAt: any;
};

export type User = {
  uid: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  avatar?: string;
  createdAt?: any;
  updatedAt?: any;
};

// ============================================================================
// PROJECTS
// ============================================================================

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const projectRef = doc(collection(db, 'projects'));
  const newProject: Project = {
    ...project,
    id: projectRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(projectRef, newProject);
  return { ...newProject, createdAt: new Date(), updatedAt: new Date() };
}

export async function getProject(id: string): Promise<Project | null> {
  const docSnap = await getDoc(doc(db, 'projects', id));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as Project;
}

export async function getAllProjects(userId?: string): Promise<Project[]> {
  const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')];
  
  if (userId) {
    constraints.unshift(where('userId', '==', userId));
  }
  
  const q = query(collection(db, 'projects'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Project[];
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  await updateDoc(doc(db, 'projects', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', id));
}

export function subscribeToProjects(
  callback: (projects: Project[]) => void,
  userId?: string
): () => void {
  const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')];
  
  if (userId) {
    constraints.unshift(where('userId', '==', userId));
  }
  
  const q = query(collection(db, 'projects'), ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Project[];
    
    callback(projects);
  });
}

// ============================================================================
// TASKS
// ============================================================================

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const taskRef = doc(collection(db, 'tasks'));
  const newTask: Task = {
    ...task,
    id: taskRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(taskRef, newTask);
  return { ...newTask, createdAt: new Date(), updatedAt: new Date() };
}

export async function getTask(id: string): Promise<Task | null> {
  const docSnap = await getDoc(doc(db, 'tasks', id));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as Task;
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const q = query(
    collection(db, 'tasks'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Task[];
}

export async function getAllTasks(): Promise<Task[]> {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Task[];
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, 'tasks', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tasks', id));
}

export function subscribeToTasks(
  projectId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(
    collection(db, 'tasks'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Task[];
    
    callback(tasks);
  });
}

// ============================================================================
// TIME LOGS
// ============================================================================

export async function addTimeLog(timeLog: Omit<TimeLog, 'id' | 'loggedAt'>): Promise<TimeLog> {
  const logRef = doc(collection(db, 'timeLogs'));
  const newLog: TimeLog = {
    ...timeLog,
    id: logRef.id,
    loggedAt: serverTimestamp(),
  };
  
  await setDoc(logRef, newLog);
  return { ...newLog, loggedAt: new Date() };
}

export async function getTimeLogsByTask(taskId: string): Promise<TimeLog[]> {
  const q = query(
    collection(db, 'timeLogs'),
    where('taskId', '==', taskId),
    orderBy('loggedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    loggedAt: doc.data().loggedAt?.toDate(),
  })) as TimeLog[];
}

export async function getTimeLogsByProject(projectId: string): Promise<TimeLog[]> {
  const q = query(
    collection(db, 'timeLogs'),
    where('projectId', '==', projectId),
    orderBy('loggedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    loggedAt: doc.data().loggedAt?.toDate(),
  })) as TimeLog[];
}

// ============================================================================
// USERS
// ============================================================================

export async function createUser(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.uid), {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUser(uid: string): Promise<User | null> {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    uid: docSnap.id,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as User;
}

export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    uid: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as User[];
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Migrate data from localStorage to Firestore
 * Call this once after setting up Firebase
 */
export async function migrateFromLocalStorage(userId: string): Promise<{
  projects: number;
  tasks: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let projectCount = 0;
  let taskCount = 0;
  
  try {
    // Migrate projects
    const projectsData = localStorage.getItem('pv:projects');
    if (projectsData) {
      const projects = JSON.parse(projectsData);
      const batch = writeBatch(db);
      
      for (const project of projects) {
        try {
          const projectRef = doc(collection(db, 'projects'));
          batch.set(projectRef, {
            ...project,
            id: projectRef.id,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          projectCount++;
        } catch (err) {
          errors.push(`Project ${project.name}: ${err}`);
        }
      }
      
      await batch.commit();
    }
    
    // Migrate tasks
    const tasksData = localStorage.getItem('pv:tasks');
    if (tasksData) {
      const tasks = JSON.parse(tasksData);
      const batch = writeBatch(db);
      
      for (const task of tasks) {
        try {
          const taskRef = doc(collection(db, 'tasks'));
          batch.set(taskRef, {
            ...task,
            id: taskRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          taskCount++;
        } catch (err) {
          errors.push(`Task ${task.title}: ${err}`);
        }
      }
      
      await batch.commit();
    }
    
  } catch (error) {
    errors.push(`Migration error: ${error}`);
  }
  
  return { projects: projectCount, tasks: taskCount, errors };
}

/**
 * Clear all Firestore data (for testing/reset)
 * Use with caution!
 */
export async function clearFirestoreData(): Promise<void> {
  const collections = ['projects', 'tasks', 'timeLogs'];
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
}
