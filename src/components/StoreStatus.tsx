import { isStoreOpen, getStoreStatusText, getStoreHoursText } from '@/utils/storeHours';
import { Clock } from 'lucide-react';

export const StoreStatus = () => {
  const open = isStoreOpen();
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
          open 
            ? 'bg-green-500/20 text-green-600' 
            : 'bg-red-500/20 text-red-600'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        {getStoreStatusText()}
      </div>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        <Clock className="mr-1 inline h-3 w-3" />
        {getStoreHoursText()}
      </span>
    </div>
  );
};
