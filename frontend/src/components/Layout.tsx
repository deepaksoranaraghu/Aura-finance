import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, List, PieChart, Target, Wallet, Settings, Bell, Search, User, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTimeContext } from '@/context/TimeContext';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Transactions', path: '/transactions', icon: List },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'Savings', path: '/savings', icon: Target },
  { name: 'Budgets', path: '/budgets', icon: Wallet },
  { name: 'Integrations', path: '/api-integrations', icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const { viewMode, setViewMode, currentDate, handlePrev, handleNext } = useTimeContext();

  const sidebarVars = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1, 
      x: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative selection:bg-primary/30">
      
      {/* Desktop Sidebar */}
      <motion.aside 
        className="w-[280px] border-r border-border/30 bg-background/50 backdrop-blur-3xl hidden lg:flex flex-col relative z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="h-28 flex items-center px-8 pt-6">
          <motion.div 
            className="flex items-center gap-3 text-primary font-bold text-2xl tracking-tighter"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Wallet size={20} fill="currentColor" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Aura Finance</span>
          </motion.div>
        </div>
        
        <motion.nav className="flex-1 px-4 py-8 space-y-1.5" variants={sidebarVars} initial="hidden" animate="show">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <motion.div key={item.path} variants={itemVars}>
                <Link
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group outline-none",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <Icon size={20} className={cn("relative z-10 transition-transform group-hover:scale-110", isActive && "drop-shadow-sm")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="relative z-10 tracking-wide">{item.name}</span>
                </Link>
              </motion.div>
            )
          })}
        </motion.nav>

        <div className="p-6">
          <div className="interactive-glass flex items-center justify-between px-4 py-3 rounded-2xl border border-border/30 bg-card/40 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-info to-info/50 p-[1px] shadow-sm">
                <div className="w-full h-full bg-card rounded-full flex items-center justify-center text-info">
                  <User size={18} />
                </div>
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight">Deepak</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pro Plan</div>
              </div>
            </div>
            <Settings size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative pb-20 lg:pb-0">
        {/* Desktop Topbar */}
        <header className="h-28 px-8 lg:px-12 items-end pb-6 hidden lg:flex justify-between border-b border-border/10 z-10 relative">
          <div className="flex-1"></div>

          <div className="flex items-center justify-center gap-4 interactive-glass bg-card/60 backdrop-blur-xl p-1.5 rounded-[1.25rem] border border-border/40 shadow-sm mx-4">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-auto">
              <TabsList className="bg-transparent p-0 h-10 w-auto grid grid-cols-2">
                <TabsTrigger value="monthly" className="rounded-xl font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="rounded-xl font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="w-px h-6 bg-border/50 mx-1"></div>
            <div className="flex items-center gap-1 bg-transparent px-2 h-10">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-xl h-8 w-8 hover:bg-muted">
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-2 min-w-[120px] justify-center font-semibold text-sm">
                <CalendarIcon size={14} className="text-primary" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={viewMode === 'monthly' ? format(currentDate, 'MMM yyyy') : format(currentDate, 'yyyy')}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {viewMode === 'monthly' ? format(currentDate, 'MMM yyyy') : format(currentDate, 'yyyy')}
                  </motion.span>
                </AnimatePresence>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-xl h-8 w-8 hover:bg-muted">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border border-border/40 hover:bg-muted/50 transition-colors relative interactive-glass"
                >
                  <Bell size={20} className="text-muted-foreground" />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background animate-pulse" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl border-border/40" align="end">
                <div className="p-4 bg-muted/30 border-b border-border/40">
                  <h4 className="font-semibold text-foreground">Notifications</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  <div className="p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer space-y-1">
                    <p className="text-sm font-medium text-foreground">Gemini API Sync Successful</p>
                    <p className="text-xs text-muted-foreground">Successfully categorized and synced transactions.</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1">Just now</p>
                  </div>
                  <div className="p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer space-y-1">
                    <p className="text-sm font-medium text-foreground">Budget Alert</p>
                    <p className="text-xs text-muted-foreground">You are nearing your budget limit for Food.</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1">2 hours ago</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Mobile Header (Apple Wallet style minimal top) */}
        <header className="lg:hidden px-4 pt-4 pb-4 flex flex-col gap-4 bg-background/80 backdrop-blur-xl border-b border-border/20 sticky top-0 z-50">
          <div className="flex items-end justify-between">
            <motion.div className="flex items-center gap-2 text-foreground font-bold text-xl tracking-tighter">
              <Wallet size={24} className="text-primary" />
              <span>Aura Finance</span>
            </motion.div>
            <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <User size={18} />
            </motion.button>
          </div>
          
          {/* Mobile Time Selector */}
          <div className="flex items-center justify-between gap-2 interactive-glass bg-card/60 backdrop-blur-xl p-1 rounded-xl border border-border/40 shadow-sm w-full">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-auto shrink-0">
              <TabsList className="bg-transparent p-0 h-9 w-auto grid grid-cols-2">
                <TabsTrigger value="monthly" className="rounded-lg text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Month</TabsTrigger>
                <TabsTrigger value="yearly" className="rounded-lg text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Year</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center justify-end w-full">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-lg h-8 w-8">
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center justify-center font-semibold text-sm min-w-[80px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={viewMode === 'monthly' ? format(currentDate, 'MMM yy') : format(currentDate, 'yyyy')}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 5, opacity: 0 }}
                  >
                    {viewMode === 'monthly' ? format(currentDate, 'MMM yy') : format(currentDate, 'yyyy')}
                  </motion.span>
                </AnimatePresence>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-lg h-8 w-8">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 scroll-smooth pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Custom spring-like bezier
              className="h-full min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation (Apple Wallet / Dynamic Island Style) */}
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
          <motion.div 
            className="bg-card/70 backdrop-blur-2xl border border-border/50 shadow-2xl shadow-black/20 rounded-[2rem] p-2 flex items-center gap-2 pointer-events-auto"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.2 }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex items-center justify-center w-14 h-14 rounded-full transition-all outline-none"
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/30"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon 
                    size={22} 
                    className={cn(
                      "relative z-10 transition-all", 
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                </Link>
              )
            })}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
