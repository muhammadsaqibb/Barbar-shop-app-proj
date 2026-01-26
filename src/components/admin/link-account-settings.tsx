
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { ShopSettings } from '@/types';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '@/context/language-provider';

const settingsSchema = z.object({
  paymentAccountNumber: z.string().min(10, "Account number must be at least 10 digits.").max(24, "Account number seems too long."),
});

export default function LinkAccountSettings() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'shopSettings', 'config') : null),
    [firestore]
  );
  const { data: settings, isLoading: settingsLoading } = useDoc<ShopSettings>(settingsRef);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      paymentAccountNumber: "",
    },
  });

  useEffect(() => {
    if (settings?.paymentAccountNumber) {
      form.reset({
        paymentAccountNumber: settings.paymentAccountNumber,
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    if (!settingsRef) return;
    setIsSubmitting(true);
    try {
      await setDoc(settingsRef, { paymentAccountNumber: values.paymentAccountNumber }, { merge: true });
      toast({
        title: t('link_account_success_title'),
        description: t('link_account_success_desc'),
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        variant: 'destructive',
        title: t('link_account_fail_title'),
        description: 'An error occurred while saving the settings.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32 ml-auto" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="paymentAccountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('account_number_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('account_number_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('saving_account_button')}</> : t('save_account_button')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
