'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTestDatabase, useConfigure } from '@/hooks/use-setup';
import {
  databaseStepSchema,
  type DatabaseStepData,
} from '@/lib/setup-validation';

interface DatabaseStepProps {
  data: DatabaseStepData;
  onNext: (data: DatabaseStepData) => void;
  onBack: () => void;
}

export function DatabaseStep({ data, onNext, onBack }: DatabaseStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [configureStatus, setConfigureStatus] = useState<'idle' | 'progress' | 'done' | 'error'>('idle');

  const { mutate: testDb, isPending: isTesting } = useTestDatabase();
  const { mutate: configure, isPending: isConfiguring } = useConfigure();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<DatabaseStepData>({
    resolver: zodResolver(databaseStepSchema),
    defaultValues: data,
  });

  const handleTestConnection = () => {
    const values = getValues();
    setTestStatus('idle');
    testDb(
      {
        db_host: values.db_host,
        db_port: values.db_port,
        db_name: values.db_name,
        db_user: values.db_user,
        db_password: values.db_password,
      },
      {
        onSuccess: (res) => {
          setTestStatus('success');
          setTestMessage(res.message ?? 'Connection successful');
        },
        onError: (err) => {
          setTestStatus('error');
          setTestMessage(err.message ?? 'Connection failed');
        },
      }
    );
  };

  const handleCreateSetup = (values: DatabaseStepData) => {
    setConfigureStatus('progress');
    configure(values, {
      onSuccess: () => {
        setConfigureStatus('done');
        onNext(values);
      },
      onError: (err) => {
        setConfigureStatus('error');
        setTestMessage(err.message ?? 'Setup failed');
      },
    });
  };

  const progressSteps = [
    { label: 'Writing .env file', done: configureStatus !== 'idle' },
    { label: 'Creating database', done: configureStatus === 'done' },
    { label: 'Running schema', done: configureStatus === 'done' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Database & Environment</h2>
        <p className="text-muted-foreground mt-1">
          Configure your database connection and application settings.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleCreateSetup)} className="space-y-4">
        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database Connection</CardTitle>
            <CardDescription>MySQL connection credentials</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="db_host">Host</Label>
              <Input id="db_host" placeholder="localhost" {...register('db_host')} />
              {errors.db_host && <p className="text-xs text-destructive">{errors.db_host.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="db_port">Port</Label>
              <Input id="db_port" placeholder="3306" {...register('db_port')} />
              {errors.db_port && <p className="text-xs text-destructive">{errors.db_port.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="db_name">Database Name</Label>
              <Input id="db_name" placeholder="admin_dashboard" {...register('db_name')} />
              {errors.db_name && <p className="text-xs text-destructive">{errors.db_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="db_user">Username</Label>
              <Input id="db_user" placeholder="root" {...register('db_user')} />
              {errors.db_user && <p className="text-xs text-destructive">{errors.db_user.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="db_password">Password</Label>
              <div className="relative">
                <Input
                  id="db_password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave empty if no password"
                  className="pr-10"
                  {...register('db_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Test connection result */}
            {testStatus !== 'idle' && (
              <div className={`md:col-span-2 flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
                testStatus === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {testStatus === 'success'
                  ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  : <XCircle className="h-4 w-4 flex-shrink-0" />}
                {testMessage}
              </div>
            )}

            <div className="md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="gap-2"
              >
                {isTesting && <Loader2 className="h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Settings</CardTitle>
            <CardDescription>Domain and upload configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="domain">Frontend URL / Domain</Label>
              <Input id="domain" placeholder="http://localhost:3000" {...register('domain')} />
              {errors.domain && <p className="text-xs text-destructive">{errors.domain.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload_path">Media (Img Uploaded Path)</Label>
              <Input id="upload_path" placeholder="uploads" {...register('upload_path')} />
              {errors.upload_path && <p className="text-xs text-destructive">{errors.upload_path.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max_file_size">Max File Size (MB)</Label>
              <Input id="max_file_size" placeholder="10485760" {...register('max_file_size')} />
              {errors.max_file_size && <p className="text-xs text-destructive">{errors.max_file_size.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Progress overlay */}
        {configureStatus === 'progress' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 space-y-2">
              {progressSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {s.done
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <span className={s.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                    {s.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {configureStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {testMessage}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isConfiguring || configureStatus === 'progress'}
            className="gap-2"
          >
            {isConfiguring && <Loader2 className="h-4 w-4 animate-spin" />}
            Create & Setup
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}