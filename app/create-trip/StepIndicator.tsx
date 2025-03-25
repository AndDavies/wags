// app/create-trip/StepIndicator.tsx
import { PawPrint } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            index + 1 <= currentStep
              ? "bg-brand-teal text-white"
              : "bg-gray-200 text-offblack/70"
          }`}
        >
          {index + 1 <= currentStep ? (
            <PawPrint className="h-5 w-5" />
          ) : (
            <span className="text-sm">{index + 1}</span>
          )}
        </div>
      ))}
    </div>
  );
}