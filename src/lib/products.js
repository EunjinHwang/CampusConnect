
import { supabase } from "./supabase";

// CampusConnect - Sprint 3
// Subtask: Create merchandise product detail views
// Author: Omar
//
// Reusable functions for reading merchandise from Supabase.

// Get all active merchandise products.
export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, stock, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Get one active product by its unique ID.
export async function getProductById(id) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, stock, is_active")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;

  return data;
}
