import { 
  Inbox, 
  Star, 
  Calendar, 
  Archive, 
  Clock,
  Search,
  LogOut,
  DollarSign,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewType, Project, Area, Task } from '@/types/task';
import { Transaction, Debt, Budget, TransactionCategory } from '@/types/finance';
import { ProjectAreaManager } from './ProjectAreaManager';
import { ThemeToggle } from './ThemeToggle';
import { ExportDataDialog } from './ExportDataDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  taskCounts: Record<ViewType, number>;
  projects: Project[];
  areas: Area[];
  selectedProjectId?: string;
  selectedAreaId?: string;
  onSelectProject: (projectId: string) => void;
  onSelectArea: (areaId: string) => void;
  onAddProject: (name: string, color?: string, areaId?: string) => void;
  onDeleteProject: (id: string) => void;
  onAddArea: (name: string, color?: string) => void;
  onDeleteArea: (id: string) => void;
  getProjectsForArea: (areaId: string) => Project[];
  getOrphanProjects: () => Project[];
  projectTaskCounts: Record<string, number>;
  projectCompletedCounts: Record<string, number>;
  areaTaskCounts: Record<string, number>;
  onSearchClick: () => void;
  onSignOut?: () => void;
  userEmail?: string;
  showFinance?: boolean;
  onFinanceClick?: () => void;
  // Export data props
  tasks?: Task[];
  transactions?: Transaction[];
  debts?: Debt[];
  budgets?: Budget[];
  categories?: TransactionCategory[];
}

const navItems: { id: ViewType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-things-blue' },
  { id: 'today', label: 'Today', icon: Star, color: 'text-things-yellow' },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar, color: 'text-things-red' },
  { id: 'someday', label: 'Someday', icon: Clock, color: 'text-things-orange' },
  { id: 'logbook', label: 'Logbook', icon: Archive, color: 'text-things-gray' },
];

export function Sidebar({ 
  currentView, 
  onViewChange, 
  taskCounts,
  projects,
  areas,
  selectedProjectId,
  selectedAreaId,
  onSelectProject,
  onSelectArea,
  onAddProject,
  onDeleteProject,
  onAddArea,
  onDeleteArea,
  getProjectsForArea,
  getOrphanProjects,
  projectTaskCounts,
  projectCompletedCounts,
  areaTaskCounts,
  onSearchClick,
  onSignOut,
  userEmail,
  showFinance,
  onFinanceClick,
  tasks = [],
  transactions = [],
  debts = [],
  budgets = [],
  categories = [],
}: SidebarProps) {
  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo / Header */}
      <div className="p-4 pb-6">
        <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Star className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          Things
        </h1>
      </div>

      {/* Search Button */}
      <div className="px-3 pb-4">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground h-9"
          onClick={onSearchClick}
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left text-sm">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const count = taskCounts[item.id];
            const isActive = currentView === item.id && !selectedProjectId && !selectedAreaId;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn('nav-item w-full', isActive && 'active')}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className={cn('nav-item-icon', item.color)}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left text-[15px]">{item.label}</span>
                {count > 0 && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted 
                                 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Finance Button */}
          <button
            onClick={onFinanceClick}
            className={cn('nav-item w-full', showFinance && 'active')}
          >
            <span className="nav-item-icon text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </span>
            <span className="flex-1 text-left text-[15px]">Finance</span>
          </button>

          {/* Separator */}
          <div className="pt-4 pb-2">
            <div className="h-px bg-sidebar-border" />
          </div>

          {/* Projects & Areas */}
          <ProjectAreaManager
            projects={projects}
            areas={areas}
            selectedProjectId={selectedProjectId}
            selectedAreaId={selectedAreaId}
            onSelectProject={onSelectProject}
            onSelectArea={onSelectArea}
            onAddProject={onAddProject}
            onDeleteProject={onDeleteProject}
            onAddArea={onAddArea}
            onDeleteArea={onDeleteArea}
            getProjectsForArea={getProjectsForArea}
            getOrphanProjects={getOrphanProjects}
            projectTaskCounts={projectTaskCounts}
            projectCompletedCounts={projectCompletedCounts}
            areaTaskCounts={areaTaskCounts}
          />
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {userEmail && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate max-w-[140px]" title={userEmail}>
              {userEmail}
            </p>
            {onSignOut && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <ExportDataDialog
          tasks={tasks}
          transactions={transactions}
          debts={debts}
          budgets={budgets}
          categories={categories}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            ⌘K search
          </p>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
