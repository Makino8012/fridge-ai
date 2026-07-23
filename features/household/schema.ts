import { z } from 'zod';

export const createHouseholdSchema = z.object({
  householdName: z.string().max(50).default(''),
  displayName: z.string().min(1, '表示名を入力してください').max(30),
});
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const joinHouseholdSchema = z.object({
  inviteToken: z.string().min(1),
  displayName: z.string().min(1, '表示名を入力してください').max(30),
});
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;

export const dietaryPreferencesSchema = z.object({
  allergies: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
  diet: z.enum(['high_protein', 'low_fat']).nullable().default(null),
});
export type DietaryPreferencesFormInput = z.infer<typeof dietaryPreferencesSchema>;
