'use client';

import { useState } from 'react';
import { InstallStepper } from './_components/install-stepper';
import { WelcomeStep } from './_components/welcome-step';
import { DatabaseStep } from './_components/database-step';
import { CompanyStep } from './_components/company-step';
import { AdminStep } from './_components/admin-step';
import { ReviewStep } from './_components/review-step';
import { FinishedStep } from './_components/finished-step';
import {
  type WizardState,
  type DatabaseStepData,
  type CompanyStepData,
  type AdminStepData,
  wizardStateDefaults,
} from '@/lib/setup-validation';

export default function InstallPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [state, setState] = useState<WizardState>(wizardStateDefaults);

  // File state — kept here (not in step components) so they survive step navigation
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const goTo = (step: number) => setCurrentStep(step);
  const goNext = () => setCurrentStep((s) => s + 1);
  const goBack = () => setCurrentStep((s) => s - 1);

  // Step handlers
  const handleDatabaseNext = (data: DatabaseStepData) => {
    setState((prev) => ({ ...prev, db: data }));
    goNext();
  };

  const handleCompanyNext = (
    data: CompanyStepData,
    logo?: File | null,
    favicon?: File | null
  ) => {
    setState((prev) => ({ ...prev, company: data }));
    if (logo !== undefined) setLogoFile(logo);
    if (favicon !== undefined) setFaviconFile(favicon);
    goNext();
  };

  const handleAdminNext = (data: AdminStepData, avatar?: File | null) => {
    setState((prev) => ({ ...prev, admin: data }));
    if (avatar !== undefined) setAvatarFile(avatar);
    goNext();
  };

  const handleSetupComplete = () => {
    setIsFinished(true);
  };

  return (
    <div className="space-y-6">
      <InstallStepper currentStep={currentStep} onStepClick={goTo} isFinished={isFinished} />

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        {!isFinished && currentStep === 1 && (
          <WelcomeStep onNext={goNext} />
        )}

        {!isFinished && currentStep === 2 && (
          <DatabaseStep
            data={state.db}
            onNext={handleDatabaseNext}
            onBack={goBack}
          />
        )}

        {!isFinished && currentStep === 3 && (
          <CompanyStep
            data={state.company}
            onNext={handleCompanyNext}
            onBack={goBack}
          />
        )}

        {!isFinished && currentStep === 4 && (
          <AdminStep
            data={state.admin}
            onNext={handleAdminNext}
            onBack={goBack}
          />
        )}

        {!isFinished && currentStep === 5 && (
          <ReviewStep
            state={state}
            logoFile={logoFile}
            faviconFile={faviconFile}
            avatarFile={avatarFile}
            onGoToStep={goTo}
            onSetupComplete={handleSetupComplete}
          />
        )}

        {isFinished && (
          <FinishedStep adminEmail={state.admin.email} />
        )}
      </div>
    </div>
  );
}
