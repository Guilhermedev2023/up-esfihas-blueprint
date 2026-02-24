import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ClosedStoreMessage = () => {
  return (
    <Alert variant="destructive" className="border-2">
      <AlertCircle className="h-5 w-5" />
      <AlertDescription className="text-base">
        😔 Hoje o delivery não está funcionando.<br />
        Nosso atendimento não abre neste momento.<br />
        Volte em breve ❤️
      </AlertDescription>
    </Alert>
  );
};
