'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { updateDietaryPreferences } from '@/features/household/actions';
import type { DietaryPreferences } from '@/types/database.types';

type FormValues = { allergiesText: string; dislikesText: string; diet: 'none' | 'high_protein' | 'low_fat' };

function toCsv(items: string[]): string {
  return items.join('、');
}

function fromCsv(text: string): string[] {
  return text
    .split(/[、,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function DietaryPreferencesForm({ initialPreferences }: { initialPreferences: DietaryPreferences }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    defaultValues: {
      allergiesText: toCsv(initialPreferences.allergies),
      dislikesText: toCsv(initialPreferences.dislikes),
      diet: initialPreferences.diet ?? 'none',
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateDietaryPreferences({
        allergies: fromCsv(values.allergiesText),
        dislikes: fromCsv(values.dislikesText),
        diet: values.diet === 'none' ? null : values.diet,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('保存しました');
    });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">食の好み・制限</CardTitle>
        <CardDescription>AIのレシピ提案に反映されます</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="allergiesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アレルギー食材</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 卵、そば" {...field} />
                  </FormControl>
                  <FormDescription>読点(、)またはカンマ区切りで入力</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dislikesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>苦手な食材</FormLabel>
                  <FormControl>
                    <Input placeholder="例: パクチー" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ダイエット方針</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">指定なし</SelectItem>
                      <SelectItem value="high_protein">高タンパク</SelectItem>
                      <SelectItem value="low_fat">低脂質</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? <LoadingSpinner className="text-primary-foreground" /> : '保存する'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
