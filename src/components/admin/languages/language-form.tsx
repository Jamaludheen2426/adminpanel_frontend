'use client';

import { z } from 'zod';
import { useCreateLanguage, useUpdateLanguage } from '@/hooks/use-languages';
import { CommonFormDialog } from '@/components/common/common-form-dialog';
import type { CommonFormField } from '@/components/common/common-form';
import type { Language } from '@/types';

const languageSchema = z.object({
    name:        z.string().min(2, 'Name must be at least 2 characters'),
    code:        z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be at most 10 characters'),
    native_name: z.string().optional(),
    direction:   z.enum(['ltr', 'rtl']).default('ltr'),
    is_active:   z.boolean().default(true),
});

interface LanguageFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    language?: Language | null;
    onSuccess?: () => void;
}

export function LanguageForm({ open, onOpenChange, language, onSuccess }: LanguageFormProps) {
    const createMutation = useCreateLanguage();
    const updateMutation = useUpdateLanguage();
    const isPending = createMutation.isPending || updateMutation.isPending;

    const fields: CommonFormField[] = [
        { name: 'name',        label: 'Name',          type: 'text',   placeholder: 'English', required: true },
        { name: 'code',        label: 'Code',          type: 'text',   placeholder: 'en',      required: true, disabled: !!language },
        { name: 'native_name', label: 'Native Name',   type: 'text',   placeholder: 'English' },
        {
            name: 'direction', label: 'Text Direction', type: 'select',
            options: [
                { value: 'ltr', label: 'Left to Right (LTR)' },
                { value: 'rtl', label: 'Right to Left (RTL)' },
            ],
        },
        { name: 'is_active', label: 'Is Active?', type: 'switch' },
    ];

    const handleSubmit = (data: any) => {
        if (language) {
            updateMutation.mutate({ id: language.id, data }, { onSuccess });
        } else {
            createMutation.mutate(data, { onSuccess });
        }
    };

    return (
        <CommonFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={language ? 'Edit Language' : 'Add Language'}
            description={language ? 'Update language details.' : 'Add a new language to the system.'}
            schema={languageSchema}
            fields={fields}
            defaultValues={language ? {
                name:        language.name,
                code:        language.code,
                native_name: language.native_name || '',
                direction:   language.direction,
                is_active:   language.is_active,
            } : { direction: 'ltr', is_active: true }}
            onSubmit={handleSubmit}
            isPending={isPending}
            isEdit={!!language}
        />
    );
}
