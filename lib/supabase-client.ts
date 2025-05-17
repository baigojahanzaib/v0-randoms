import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a single supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Project = {
  id: string
  user_id: string
  title: string
  description: string
  files: Record<string, string>
  sandbox_id: string
  created_at: string
  updated_at: string
}

export async function saveProject(project: Omit<Project, "id" | "user_id" | "created_at" | "updated_at">) {
  const user = supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...project,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getProjects() {
  const { data, error } = await supabase.from("projects").select("*").order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function getProject(id: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

  if (error) {
    throw error
  }

  return data
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, "id" | "user_id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
