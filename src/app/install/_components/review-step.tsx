'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Loader2, XCircle,
  Building2, User, Database, Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateSetupCompany, useCreateSetupAdmin, useFinalize } from '@/hooks/use-setup';
import type { WizardState } from '@/lib/setup-validation';

interface ReviewStepProps {
  state: WizardState;
  logoFile?: File | null;
  faviconFile?: File | null;
  avatarFile?: File | null;
  onGoToStep: (step: number) => void;
}

// Separate the progress phases from the overall state phases
type ProgressPhase = 'company' | 'admin' | 'finalize' | 'restarting';
type SetupPhase = 'idle' | ProgressPhase | 'done' | 'error';

const PROGRESS_PHASES: { label: string; key: ProgressPhase }[] = [
  { label: 'Creating company',    key: 'company'    },
  { label: 'Creating super admin', key: 'admin'     },
  { label: 'Finalizing setup',    key: 'finalize'   },
  { label: 'Restarting server',   key: 'restarting' },
];

const PHASE_ORDER: SetupPhase[] = ['idle', 'company', 'admin', 'finalize', 'restarting', 'done', 'error'];

const phaseIndex = (p: SetupPhase) => PHASE_ORDER.indexOf(p);

export function ReviewStep({
  state,
  logoFile,
  faviconFile,
  avatarFile,
  onGoToStep,
}: ReviewStepProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<SetupPhase>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { mutateAsync: createCompany } = useCreateSetupCompany();
  const { mutateAsync: createAdmin }   = useCreateSetupAdmin();
  const { mutateAsync: finalize }      = useFinalize();

  const handleCompleteSetup = async () => {
    try {
      setPhase('company');
      const companyRes = await createCompany({
        companyData: state.company,
        dbConfig: state.db,
        logoFile,
        faviconFile,
      });
      const companyId = companyRes.data.company_id;

      setPhase('admin');
      const adminRes = await createAdmin({
        adminData: state.admin,
        companyId,
        dbConfig: state.db,
        avatarFile,
      });
      const userId = adminRes.data.user.id;
      const roleId = adminRes.data.user.role_id;

      setPhase('finalize');
      await finalize({
        userId,
        companyId,
        email: state.admin.email,
        fullName: state.admin.full_name,
        roleId,
        dbConfig: state.db,
      });

      // Server is restarting — poll until it's back up with all routes loaded
      setPhase('restarting');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      let serverReady = false;
      for (let i = 0; i < 30; i++) { // try for up to 30 seconds
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const res = await fetch(`${apiUrl}/auth/me`, {
            credentials: 'include',
            signal: AbortSignal.timeout(2000),
          });
          if (res.ok || res.status === 401) {
            // 200 = logged in, 401 = route exists but not authed — either way server is ready
            serverReady = true;
            break;
          }
        } catch {
          // Server still restarting, keep polling
        }
      }

      setPhase('done');
    } catch (err: unknown) {
      setPhase('error');
      setErrorMessage(err instanceof Error ? err.message : 'Setup failed. Please try again.');
    }
  };

  // Helper: has this progress phase already completed?
  const isDone  = (key: ProgressPhase) => phaseIndex(phase) > phaseIndex(key);
  const isActive = (key: ProgressPhase) => phase === key;

  // Derived booleans — avoids inline string comparisons that confuse TypeScript
  const isIdle       = phase === 'idle';
  const isError      = phase === 'error';
  const isDonePhase  = phase === 'done';
  const isInProgress = !isIdle && !isError && !isDonePhase;
  const canInteract  = isIdle || isError;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (isDonePhase) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Setup Complete!</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Your application is ready. You've been automatically logged in as super admin.
          </p>
        </div>
        <Button size="lg" onClick={() => router.push('/admin')} className="gap-2">
          Go to Dashboard
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Finish</h2>
        <p className="text-muted-foreground mt-1">
          Review your configuration before completing setup.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DB */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Database</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onGoToStep(2)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Host"     value={`${state.db.db_host}:${state.db.db_port}`} />
            <Row label="Database" value={state.db.db_name} />
            <Row label="User"     value={state.db.db_user} />
            <Row label="Domain"   value={state.db.domain} />
          </CardContent>
        </Card>

        {/* Company */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Company</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onGoToStep(3)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Name"     value={state.company.name} />
            <Row label="Slug"     value={state.company.slug} />
            <Row label="Timezone" value={state.company.timezone} />
            <Row label="Language" value={state.company.language.toUpperCase()} />
            <Row label="Currency" value={state.company.currency} />
            {state.company.email ? <Row label="Email" value={state.company.email} /> : null}
          </CardContent>
        </Card>

        {/* Admin */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Super Admin</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onGoToStep(4)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Name"     value={state.admin.full_name} />
            <Row label="Email"    value={state.admin.email} />
            <Row label="Password" value="••••••••" />
            {avatarFile ? <Row label="Avatar" value={avatarFile.name} /> : null}
          </CardContent>
        </Card>
      </div>

      {/* Progress during setup */}
      {isInProgress && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            {PROGRESS_PHASES.map((s) => (
              <div key={s.key} className="flex items-center gap-3 text-sm">
                {isDone(s.key) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : isActive(s.key) ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                )}
                <span className={isDone(s.key) ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {s.label}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-3">
          <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Setup failed</p>
            <p className="mt-0.5 text-destructive/80">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => onGoToStep(4)} disabled={!canInteract} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleCompleteSetup} disabled={!canInteract} size="lg" className="gap-2">
          {isInProgress && <Loader2 className="h-4 w-4 animate-spin" />}
          {isError ? 'Retry Setup' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground text-xs flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-right break-all">{value}</span>
    </div>
  );
}