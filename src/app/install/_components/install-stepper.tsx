'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { number: 1, label: 'Welcome' },
  { number: 2, label: 'Database' },
  { number: 3, label: 'Company' },
  { number: 4, label: 'Admin' },
  { number: 5, label: 'Finish' },
];

interface InstallStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function InstallStepper({ currentStep, onStepClick }: InstallStepperProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-px bg-border" />
        <div
          className="absolute top-5 left-0 h-px bg-primary transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isClickable = step.number < currentStep;

          return (
            <div
              key={step.number}
              className="flex flex-col items-center gap-2 relative z-10"
            >
              <button
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200',
                  isCompleted && 'bg-primary border-primary text-primary-foreground cursor-pointer hover:opacity-90',
                  isActive && 'bg-background border-primary text-primary shadow-sm shadow-primary/20',
                  !isCompleted && !isActive && 'bg-background border-border text-muted-foreground cursor-default'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </button>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive && 'text-primary',
                  isCompleted && 'text-muted-foreground',
                  !isCompleted && !isActive && 'text-muted-foreground/50'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}