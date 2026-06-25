import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function BillingSuccessPage() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-7" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Payment received
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your Plugr billing will update as soon as Flutterwave confirms the
          transaction.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/pricing">View billing</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/chat">Open Plugr</Link>
        </Button>
      </div>
    </div>
  );
}

export default BillingSuccessPage;
