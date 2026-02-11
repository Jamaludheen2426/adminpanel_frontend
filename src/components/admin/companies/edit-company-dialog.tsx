'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCompany, useUpdateCompany } from '@/hooks/use-companies';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UpdateCompanyDto } from '@/types';

interface EditCompanyDialogProps {
  companyId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCompanyDialog({
  companyId,
  open,
  onOpenChange,
}: EditCompanyDialogProps) {
  const { data: company, isLoading } = useCompany(companyId || 0);
  const updateCompany = useUpdateCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateCompanyDto>({
    defaultValues: {
      name: '',
      slug: '',
      email: '',
      phone: '',
      address: '',
      domain: '',
      status: 'active',
      max_users: undefined,
    },
  });

  // Load company data into form
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        slug: company.slug,
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        domain: company.domain || '',
        status: company.status,
        max_users: company.max_users || undefined,
      });
    }
  }, [company, form]);

  const onSubmit = async (data: UpdateCompanyDto) => {
    if (!companyId) return;
    
    setIsSubmitting(true);
    try {
      await updateCompany.mutateAsync({ id: companyId, data });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to update company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update company information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Company name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Acme Corporation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  rules={{ required: 'Slug is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="acme-corporation" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        URL-friendly identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="contact@acme.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 234 567 8900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="acme.example.com" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional custom domain for this company
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="123 Main St, City, Country"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_users"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Users</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Leave empty for unlimited"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Maximum number of users allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
