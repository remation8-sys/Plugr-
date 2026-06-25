import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function BillingFailedPage() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Payment was not completed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can try again from pricing or choose a different Plugr plan.
        </p>
      </div>
      <Button asChild>
        <Link to="/pricing">Back to pricing</Link>
      </Button>
    </div>
  );
}

export default BillingFailedPage;
