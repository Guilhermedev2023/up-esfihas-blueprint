import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ClosedStoreMessage = () => {
  return (
    <Alert variant="destructive" className="border-2">
      <AlertCircle className="h-5 w-5" />
      <AlertDescription className="text-base">
        Restaurante fechado no momento.
      </AlertDescription>
    </Alert>
  );
};
