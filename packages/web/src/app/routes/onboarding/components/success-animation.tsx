import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useEffect } from 'react';

type SuccessAnimationProps = {
  onComplete: () => void;
};

function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Respect reduced-motion: skip animation delay entirely
    const delay = prefersReducedMotion ? 800 : 2200;
    const timer = setTimeout(onComplete, delay);
    return () => clearTimeout(timer);
  }, [onComplete, prefersReducedMotion]);

  return (
    <div
      className={
        prefersReducedMotion
          ? 'flex min-h-screen flex-col items-center justify-center gap-5 bg-background'
          : 'flex min-h-screen flex-col items-center justify-center gap-5 bg-background animate-in fade-in duration-500'
      }
    >
      <div
        className={
          prefersReducedMotion
            ? 'flex size-20 items-center justify-center rounded-full bg-success-50'
            : 'flex size-20 items-center justify-center rounded-full bg-success-50 animate-in zoom-in-50 duration-500'
        }
      >
        <Check className="size-10 text-success-700 stroke-[2.5]" />
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold font-sentient">
          {t("You're all set!")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Let's build your first automation.")}
        </p>
      </div>
    </div>
  );
}

SuccessAnimation.displayName = 'SuccessAnimation';
export { SuccessAnimation };
