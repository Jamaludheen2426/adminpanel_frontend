import { useTranslation } from '@/hooks/use-translation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isDeleting?: boolean;
}

export function DeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    isDeleting = false,
}: DeleteDialogProps) {
    const { t } = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title || t('common.are_you_sure', 'Are you sure?')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || t('common.delete_confirm', 'This action cannot be undone.')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        {t('common.cancel', 'Cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
