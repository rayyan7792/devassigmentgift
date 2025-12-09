import { AssignmentData } from '../types';

const STORAGE_KEY = 'raynex_assignments';

export const getAssignments = (): AssignmentData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load assignments", e);
    return [];
  }
};

export const saveAssignment = (assignment: AssignmentData): void => {
  const current = getAssignments();
  const index = current.findIndex(a => a.id === assignment.id);
  if (index >= 0) {
    current[index] = assignment;
  } else {
    current.push(assignment);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

export const deleteAssignment = (id: string): void => {
  const current = getAssignments();
  const filtered = current.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getAssignmentById = (id: string): AssignmentData | undefined => {
  const current = getAssignments();
  return current.find(a => a.id === id);
};