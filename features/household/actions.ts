'use server';

import { revalidatePath } from 'next/cache';
import { actionError, actionSuccess, type ActionResult } from '@/lib/action-result';
import * as householdService from '@/services/household/household-service';
import {
  createHouseholdSchema,
  dietaryPreferencesSchema,
  joinHouseholdSchema,
  type CreateHouseholdInput,
  type DietaryPreferencesFormInput,
  type JoinHouseholdInput,
} from './schema';

export async function createHousehold(input: CreateHouseholdInput): Promise<ActionResult<{ householdId: string }>> {
  const parsed = createHouseholdSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? 'invalid input');

  try {
    const householdId = await householdService.createNewHousehold(
      parsed.data.householdName,
      parsed.data.displayName,
    );
    revalidatePath('/');
    return actionSuccess({ householdId });
  } catch {
    return actionError('世帯の作成に失敗しました');
  }
}

export async function joinHousehold(input: JoinHouseholdInput): Promise<ActionResult<{ householdId: string }>> {
  const parsed = joinHouseholdSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? 'invalid input');

  try {
    const householdId = await householdService.joinHouseholdByInvite(
      parsed.data.inviteToken,
      parsed.data.displayName,
    );
    revalidatePath('/');
    return actionSuccess({ householdId });
  } catch {
    return actionError('招待URLが無効です。URLを確認するか、再発行を依頼してください');
  }
}

export async function regenerateInviteToken(): Promise<ActionResult<{ inviteToken: string }>> {
  try {
    const inviteToken = await householdService.regenerateInviteToken();
    revalidatePath('/settings');
    return actionSuccess({ inviteToken });
  } catch {
    return actionError('招待URLの再発行に失敗しました');
  }
}

export async function updateDietaryPreferences(
  input: DietaryPreferencesFormInput,
): Promise<ActionResult<null>> {
  const parsed = dietaryPreferencesSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? 'invalid input');

  try {
    await householdService.updateDietaryPreferences(parsed.data);
    revalidatePath('/settings');
    return actionSuccess(null);
  } catch {
    return actionError('設定の保存に失敗しました');
  }
}
