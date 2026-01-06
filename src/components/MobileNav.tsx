import { 
  Inbox, 
  Star, 
  Calendar,
  Archive,
  Menu,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewType } from '@/types/task';

interface MobileNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onMenuClick: () => void;
  showFinance?: boolean;
  onFinanceClick?: () => void;
}

const mobileNavItems: { id: ViewType; icon: React.ElementType; label: string; color: string }[] = [
  { id: 'inbox', icon: Inbox, label: 'Inbox', color: 'text-things-blue' },
  { id: 'today', icon: Star, label: 'Today', color: 'text-things-yellow' },
  { id: 'upcoming', icon: Calendar, label: 'Upcoming', color: 'text-things-red' },
  { id: 'logbook', icon: Archive, label: 'Done', color: 'text-things-gray' },
];

export function MobileNav({ currentView, onViewChange, onMenuClick, showFinance, onFinanceClick }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border 
                    flex items-center justify-around px-1 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden z-50">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id && !showFinance;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]',
              isActive ? 'bg-primary/10' : 'active:bg-muted'
            )}
          >
            <Icon className={cn(
              'w-5 h-5 transition-colors',
              isActive ? item.color : 'text-muted-foreground'
            )} />
            <span className={cn(
              'text-[10px] font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
      
      {/* Finance button */}
      {onFinanceClick && (
        <button
          onClick={onFinanceClick}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]',
            showFinance ? 'bg-primary/10' : 'active:bg-muted'
          )}
        >
          <Wallet className={cn(
            'w-5 h-5 transition-colors',
            showFinance ? 'text-things-green' : 'text-muted-foreground'
          )} />
          <span className={cn(
            'text-[10px] font-medium transition-colors',
            showFinance ? 'text-foreground' : 'text-muted-foreground'
          )}>
            Finance
          </span>
        </button>
      )}
      
      {/* Menu button */}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl 
                   active:bg-muted transition-all min-w-[56px]"
      >
        <Menu className="w-5 h-5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">More</span>
      </button>
    </nav>
  );
}
