/**
 * Firebase Usage Examples
 * 
 * This file demonstrates how to use the new Firebase functions
 * to replace your localStorage calls.
 */

import {
  createProject,
  getProject,
  getAllProjects,
  updateProject,
  deleteProject,
  subscribeToProjects,
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  addTimeLog,
} from '@/lib/firestore';

import { uploadAvatar, uploadProjectDocument } from '@/lib/storage';
import { useProjects, useTasks, useProject } from '@/lib/hooks/useFirestore';

// ============================================================================
// EXAMPLE 1: Create a new project
// ============================================================================

async function exampleCreateProject() {
  const newProject = await createProject({
    name: 'New Website',
    description: 'Build a modern website with Next.js',
    status: 'active',
    owner: 'John Doe',
    startDate: '2025-01-01',
    budget: 50000,
    progress: 0,
    userId: 'user123', // Firebase Auth UID
  });
  
  console.log('Project created:', newProject);
  return newProject;
}

// ============================================================================
// EXAMPLE 2: Get a single project
// ============================================================================

async function exampleGetProject(projectId: string) {
  const project = await getProject(projectId);
  
  if (project) {
    console.log('Project found:', project);
  } else {
    console.log('Project not found');
  }
  
  return project;
}

// ============================================================================
// EXAMPLE 3: Get all projects
// ============================================================================

async function exampleGetAllProjects() {
  // Get all projects
  const allProjects = await getAllProjects();
  console.log('All projects:', allProjects);
  
  // Get only user's projects
  const myProjects = await getAllProjects('user123');
  console.log('My projects:', myProjects);
  
  return allProjects;
}

// ============================================================================
// EXAMPLE 4: Update a project
// ============================================================================

async function exampleUpdateProject(projectId: string) {
  await updateProject(projectId, {
    progress: 50,
    status: 'active',
  });
  
  console.log('Project updated');
}

// ============================================================================
// EXAMPLE 5: Delete a project
// ============================================================================

async function exampleDeleteProject(projectId: string) {
  await deleteProject(projectId);
  console.log('Project deleted');
}

// ============================================================================
// EXAMPLE 6: Real-time project updates (using subscription)
// ============================================================================

function exampleSubscribeToProjects() {
  // Subscribe to all projects
  const unsubscribe = subscribeToProjects((projects) => {
    console.log('Projects updated:', projects);
    // Update your UI here
  });
  
  // Or subscribe to only user's projects
  const unsubscribeUser = subscribeToProjects((projects) => {
    console.log('My projects updated:', projects);
  }, 'user123');
  
  // Don't forget to unsubscribe when component unmounts!
  return () => {
    unsubscribe();
    unsubscribeUser();
  };
}

// ============================================================================
// EXAMPLE 7: Using React hooks for real-time data
// ============================================================================

function ExampleProjectsList() {
  // This hook provides real-time project updates!
  const { projects, loading, error } = useProjects('user123');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <p>Progress: {project.progress}%</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Create and manage tasks
// ============================================================================

async function exampleTaskOperations(projectId: string) {
  // Create a new task
  const newTask = await createTask({
    projectId,
    title: 'Design homepage',
    status: 'todo',
    assignee: 'Alice',
    priority: 'high',
    due: '2025-01-15',
    estimateHours: 8,
  });
  
  console.log('Task created:', newTask);
  
  // Update task status
  await updateTask(newTask.id, {
    status: 'in-progress',
    loggedHours: 2,
  });
  
  // Get all tasks for project
  const tasks = await getTasksByProject(projectId);
  console.log('Project tasks:', tasks);
  
  // Delete task
  await deleteTask(newTask.id);
}

// ============================================================================
// EXAMPLE 9: Log time to a task
// ============================================================================

async function exampleLogTime(taskId: string, projectId: string) {
  const timeLog = await addTimeLog({
    taskId,
    projectId,
    hours: 3.5,
    note: 'Completed homepage design mockups',
    loggedBy: 'Alice',
  });
  
  console.log('Time logged:', timeLog);
}

// ============================================================================
// EXAMPLE 10: Upload files
// ============================================================================

async function exampleFileUpload(file: File, projectId: string) {
  // Upload with progress tracking
  const documentUrl = await uploadProjectDocument(
    file,
    projectId,
    (progress) => {
      console.log(`Upload progress: ${progress.progress.toFixed(2)}%`);
    }
  );
  
  console.log('File uploaded:', documentUrl);
  
  // Upload avatar
  const avatarUrl = await uploadAvatar(file, 'user123');
  console.log('Avatar uploaded:', avatarUrl);
}

// ============================================================================
// EXAMPLE 11: Complete component example with real-time updates
// ============================================================================

function ProjectDetailsComponent({ projectId }: { projectId: string }) {
  // Get project with real-time updates
  const { project, loading: projectLoading } = useProject(projectId);
  
  // Get tasks with real-time updates
  const { tasks, loading: tasksLoading } = useTasks(projectId);
  
  if (projectLoading || tasksLoading) {
    return <div>Loading...</div>;
  }
  
  if (!project) {
    return <div>Project not found</div>;
  }
  
  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Progress: {project.progress}%</p>
      
      <h2>Tasks ({tasks.length})</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            {task.title} - {task.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// MIGRATION GUIDE: Replace localStorage calls
// ============================================================================

/**
 * OLD WAY (localStorage):
 * 
 * const projects = JSON.parse(localStorage.getItem('pv:projects') || '[]');
 * 
 * 
 * NEW WAY (Firestore):
 * 
 * const projects = await getAllProjects();
 * 
 * 
 * OR (with real-time updates in React):
 * 
 * const { projects } = useProjects();
 */

/**
 * OLD WAY (localStorage - update):
 * 
 * const projects = JSON.parse(localStorage.getItem('pv:projects') || '[]');
 * const updated = projects.map(p => 
 *   p.id === id ? { ...p, progress: 50 } : p
 * );
 * localStorage.setItem('pv:projects', JSON.stringify(updated));
 * 
 * 
 * NEW WAY (Firestore):
 * 
 * await updateProject(id, { progress: 50 });
 */

export {
  exampleCreateProject,
  exampleGetProject,
  exampleGetAllProjects,
  exampleUpdateProject,
  exampleDeleteProject,
  exampleSubscribeToProjects,
  exampleTaskOperations,
  exampleLogTime,
  exampleFileUpload,
  ExampleProjectsList,
  ProjectDetailsComponent,
};
