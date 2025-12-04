// Example: Using Supabase with TypeScript types
import { supabase } from '$lib/helpers/supabase';
import type { Database } from '$lib/helpers/database.types';

// Type-safe database operations
type Todo = Database['public']['Tables']['todos']['Row'];

// Example 1: Fetch all todos
export async function getAllTodos() {
  const { data, error } = await supabase
    .from('todos')
    .select('*');
  
  if (error) {
    console.error('Error fetching todos:', error);
    return [];
  }
  
  return data as Todo[];
}

// Example 2: Create a new todo
export async function createTodo(title: string) {
  const { data, error } = await supabase
    .from('todos')
    .insert({ title })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating todo:', error);
    return null;
  }
  
  return data as Todo;
}

// Example 3: Update a todo
export async function toggleTodo(id: string, completed: boolean) {
  const { data, error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating todo:', error);
    return null;
  }
  
  return data as Todo;
}
