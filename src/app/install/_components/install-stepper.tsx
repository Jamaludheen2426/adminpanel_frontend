'use client';

import { Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
  isFinished?: boolean;
}

export function InstallStepper({ currentStep, onStepClick, isFinished }: InstallStepperProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = isFinished || step.number < currentStep;
          const isActive = !isFinished && step.number === currentStep;
          const isClickable = !isFinished && step.number < currentStep;

          // Line segment AFTER this circle (not after the last one)
          const showLine = index < STEPS.length - 1;
          const lineCompleted = isFinished || step.number < currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => isClickable && onStepClick(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300',
                    isCompleted && 'bg-green-500 border-green-500 text-white cursor-pointer hover:bg-green-600',
                    isActive && 'bg-background border-primary text-primary shadow-md shadow-primary/25',
                    !isCompleted && !isActive && 'bg-muted border-border text-muted-foreground cursor-default'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    step.number
                  )}
                </button>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block whitespace-nowrap',
                    isActive && 'text-primary',
                    isCompleted && 'text-green-500',
                    !isCompleted && !isActive && 'text-muted-foreground/60'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line segment between circles */}
              {showLine && (
                <div className="flex-1 px-2 -mt-5 sm:-mt-5">
                  <Separator
                    className={cn(
                      'h-0.5 transition-colors duration-500',
                      lineCompleted ? 'bg-green-500' : 'bg-border'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
