'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Refrigerator } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useEnsureAnonymousSession } from '@/features/household/hooks/use-ensure-anonymous-session';
import { createHousehold } from '@/features/household/actions';
import { createHouseholdSchema, type CreateHouseholdInput } from '@/features/household/schema';

export function OnboardingForm() {
  const router = useRouter();
  const { ready, error } = useEnsureAnonymousSession();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateHouseholdInput>({
    resolver: zodResolver(createHouseholdSchema),
    defaultValues: { householdName: '', displayName: '' },
  });

  function onSubmit(values: CreateHouseholdInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await createHousehold(values);
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      toast.success('わが家を作成しました');
      router.push('/');
      router.refresh();
    });
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {error ? <p className="text-sm text-destructive">{error}</p> : <LoadingSpinner />}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Refrigerator className="size-7" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-semibold">冷蔵庫AIへようこそ</h1>
        <p className="text-sm text-muted-foreground">
          まずはあなたの「わが家」を作りましょう。あとで同居している方を招待できます。
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>あなたの表示名</FormLabel>
                <FormControl>
                  <Input placeholder="例: たろう" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="householdName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>わが家の名前(任意)</FormLabel>
                <FormControl>
                  <Input placeholder="例: たろう&はなこ家" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <LoadingSpinner className="text-primary-foreground" /> : 'はじめる'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
