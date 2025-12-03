"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  QueryConstraint,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Project, Task } from "@/lib/firestore";

/**
 * Custom hooks for real-time Firebase data
 */

// ============================================================================
// PROJECTS HOOK
// ============================================================================

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [orderBy("updatedAt", "desc")];

    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }

    const q = query(collection(db, "projects"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Project[];

        setProjects(projectsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching projects:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { projects, loading, error };
}

// ============================================================================
// TASKS HOOK
// ============================================================================

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

    if (projectId) {
      constraints.unshift(where("projectId", "==", projectId));
    }

    const q = query(collection(db, "tasks"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Task[];

        setTasks(tasksData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching tasks:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { tasks, loading, error };
}

// ============================================================================
// SINGLE DOCUMENT HOOKS
// ============================================================================

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "projects", projectId),
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject({
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Project);
        } else {
          setProject(null);
        }
        setLoading(false);
      },
      (err: Error) => {
        console.error("Error fetching project:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { project, loading, error };
}

export function useTask(taskId: string | undefined) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "tasks", taskId),
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTask({
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Task);
        } else {
          setTask(null);
        }
        setLoading(false);
      },
      (err: Error) => {
        console.error("Error fetching task:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { task, loading, error };
}
