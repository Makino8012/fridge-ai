import { createClient } from '@/lib/supabase/server';
import type { DietaryPreferences } from '@/types/database.types';

export async function getCurrentHouseholdId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single();

  if (error || !data?.household_id) throw new Error('not a member of any household');
  return data.household_id;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;
  return data;
}

export async function getHousehold(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();
  if (error) throw error;
  return data;
}

export async function joinHouseholdByInvite(inviteToken: string, displayName: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('join_household_by_invite', {
    p_invite_token: inviteToken,
    p_display_name: displayName,
  });
  if (error) throw error;
  return data;
}

export async function createNewHousehold(name: string, displayName: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_household', {
    p_name: name,
    p_display_name: displayName,
  });
  if (error) throw error;
  return data;
}

export async function regenerateInviteToken(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('regenerate_invite_token');
  if (error) throw error;
  return data;
}

export async function updateDietaryPreferences(prefs: DietaryPreferences) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ dietary_preferences: prefs })
    .eq('id', user.id);
  if (error) throw error;
}

export async function getHouseholdMembers(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('household_id', householdId);
  if (error) throw error;
  return data;
}
