"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTestDatabase, useConfigure } from "@/hooks/use-setup";
import {
  databaseStepSchema,
  type DatabaseStepData,
} from "@/lib/setup-validation";

interface DatabaseStepProps {
  data: DatabaseStepData;
  onNext: (data: DatabaseStepData) => void;
  onBack: () => void;
}

export function DatabaseStep({ data, onNext, onBack }: DatabaseStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [testMessage, setTestMessage] = useState("");
  const [configureStatus, setConfigureStatus] = useState<
    "idle" | "progress" | "done" | "error"
  >("idle");

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
    setTestStatus("idle");
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
          setTestStatus("success");
          setTestMessage(res.message ?? "Connection successful");
        },
        onError: (err) => {
          setTestStatus("error");
          setTestMessage(err.message ?? "Connection failed");
        },
      },
    );
  };

  const handleCreateSetup = (values: DatabaseStepData) => {
    setConfigureStatus("progress");

    const payload = {
      ...values,
      max_file_size: String(
        Math.round(parseFloat(values.max_file_size) * 1024 * 1024),
      ),
    };

    configure(payload, {
      onSuccess: () => {
        setConfigureStatus("done");
        onNext(payload);
      },
      onError: (err) => {
        setConfigureStatus("error");
        setTestMessage(err.message ?? "Setup failed");
      },
    });
  };

  const progressSteps = [
    { label: "Writing .env file", done: configureStatus !== "idle" },
    { label: "Creating database", done: configureStatus === "done" },
    { label: "Running schema", done: configureStatus === "done" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database & Environment</h2>
          <p className="text-muted-foreground mt-1">
            Configure your database connection and application settings.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Help Config
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Database Configuration Guide</DialogTitle>
              <DialogDescription>
                How to find and fill in your database connection details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-base">
                  MySQL Connection Settings
                </h4>
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div>
                    <p className="font-medium">Host</p>
                    <p className="text-muted-foreground">
                      The server where your MySQL database is running. Use{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        localhost
                      </code>{" "}
                      if the database is on the same machine as the backend, or
                      enter the IP address / hostname of a remote server.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Port</p>
                    <p className="text-muted-foreground">
                      MySQL default port is{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        3306
                      </code>
                      . Only change this if your MySQL server uses a custom
                      port.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Database Name</p>
                    <p className="text-muted-foreground">
                      The name of the database to create. Default is{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        admin_dashboard
                      </code>
                      . The installer will create this database automatically if
                      it doesn&apos;t exist.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Username</p>
                    <p className="text-muted-foreground">
                      Your MySQL username. Default is{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        root
                      </code>
                      . For production, use a dedicated user with proper
                      privileges.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-muted-foreground">
                      Your MySQL user password. Leave empty if your MySQL user
                      has no password (common for local development with root).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-base">
                  Application Settings
                </h4>
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div>
                    <p className="font-medium">Frontend URL / Domain</p>
                    <p className="text-muted-foreground">
                      The URL where your frontend application is accessible. For
                      local development, use{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        http://localhost:3000
                      </code>
                      . For production, enter your actual domain (e.g.,{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        https://admin.yourdomain.com
                      </code>
                      ).
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Media Upload Path</p>
                    <p className="text-muted-foreground">
                      Directory where uploaded files (images, documents) are
                      stored on the server. Default is{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        uploads
                      </code>
                      . This is relative to the backend root directory.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Max File Size</p>
                    <p className="text-muted-foreground">
                      Maximum allowed upload file size in MB. Default is{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        10
                      </code>{" "}
                      (10 MB). Common values: 5 (5 MB), 10 (10 MB), 20 (20 MB).
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Make sure your MySQL server is running before testing the
                  connection. The database user needs <strong>CREATE</strong>,{" "}
                  <strong>ALTER</strong>, <strong>INSERT</strong>,{" "}
                  <strong>SELECT</strong>, <strong>UPDATE</strong>, and{" "}
                  <strong>DELETE</strong> privileges.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
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
              <Input
                id="db_host"
                placeholder="localhost"
                {...register("db_host")}
              />
              {errors.db_host && (
                <p className="text-xs text-destructive">
                  {errors.db_host.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="db_port">Port</Label>
              <Input id="db_port" placeholder="3306" {...register("db_port")} />
              {errors.db_port && (
                <p className="text-xs text-destructive">
                  {errors.db_port.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="db_name">Database Name</Label>
              <Input
                id="db_name"
                placeholder="admin_dashboard"
                {...register("db_name")}
              />
              {errors.db_name && (
                <p className="text-xs text-destructive">
                  {errors.db_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="db_user">Username</Label>
              <Input id="db_user" placeholder="root" {...register("db_user")} />
              {errors.db_user && (
                <p className="text-xs text-destructive">
                  {errors.db_user.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="db_password">Password</Label>
              <div className="relative">
                <Input
                  id="db_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave empty if no password"
                  className="pr-10"
                  {...register("db_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Test connection result */}
            {testStatus === "success" && (
              <div className="md:col-span-2">
                <Alert className="border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 [&>svg]:text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{testMessage}</AlertDescription>
                </Alert>
              </div>
            )}

            {testStatus === "error" && (
              <div className="md:col-span-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection failed</AlertTitle>
                  <AlertDescription>{testMessage}</AlertDescription>
                </Alert>
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
              <Input
                id="domain"
                placeholder="http://localhost:3000"
                {...register("domain")}
              />
              {errors.domain && (
                <p className="text-xs text-destructive">
                  {errors.domain.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload_path">Media (Img Uploaded Path)</Label>
              <Input
                id="upload_path"
                placeholder="uploads"
                {...register("upload_path")}
              />
              {errors.upload_path && (
                <p className="text-xs text-destructive">
                  {errors.upload_path.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max_file_size">Max File Size (MB)</Label>
              <Input
                id="max_file_size"
                placeholder="10"
                {...register("max_file_size")}
              />
              {errors.max_file_size && (
                <p className="text-xs text-destructive">
                  {errors.max_file_size.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress overlay */}
        {configureStatus === "progress" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 space-y-2">
              {progressSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  <span
                    className={
                      s.done
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {configureStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration failed</AlertTitle>
            <AlertDescription>{testMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isConfiguring || configureStatus === "progress"}
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
