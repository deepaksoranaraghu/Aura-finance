import { useGoals } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SavingsCrystal } from '@/components/3d/SavingsCrystal';
import { AddGoalModal } from '@/components/AddGoalModal';
import { AddFundsModal } from '@/components/AddFundsModal';
import { useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash } from 'lucide-react';

export function Savings() {
  const { data: goals, isLoading } = useGoals();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await fetch(`http://localhost:4000/api/goals/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="flex gap-2">
          {[1,2,3].map(i => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-primary rounded-full"
              animate={{ y: [-10, 0, -10] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    );
  }

  const containerVars: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="p-8 lg:p-12 max-w-6xl mx-auto space-y-10 relative"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVars} className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter mb-2 text-foreground drop-shadow-lg">Savings</h1>
          <p className="text-muted-foreground text-lg tracking-wide">Track your progress towards your dreams.</p>
        </div>
        <AddGoalModal />
      </motion.div>

      {!goals?.length ? (
        <motion.div variants={itemVars} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-muted/50 flex items-center justify-center shadow-inner">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No Goals Yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">Set a savings goal to start tracking your progress.</p>
          <AddGoalModal />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {goals.map((goal: any) => {
            const percent = Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100)));
            return (
              <motion.div key={goal.id} variants={itemVars} whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="interactive-glass rounded-[2rem] group">
                <Card className="border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20 bg-card/60 backdrop-blur-xl overflow-hidden h-full relative">
                  
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <AddFundsModal goalId={goal.id} goalName={goal.name} currentAmount={goal.current} targetAmount={goal.target} />
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-black/20 rounded-xl outline-none focus-visible:opacity-100">
                        <MoreHorizontal size={20} className="text-foreground drop-shadow-md" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-2xl shadow-2xl">
                        <DropdownMenuItem onClick={() => handleDelete(goal.id)} className="cursor-pointer rounded-xl py-3 font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash size={18} className="mr-3" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <SavingsCrystal />
                  <CardContent className="p-6 h-full flex flex-col relative z-10 pointer-events-none">
                    <div className="flex justify-between items-start mb-6">
                      <div className="pr-8 pointer-events-auto">
                        <h3 className="font-semibold text-xl tracking-tight">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground tracking-wide mt-1">{formatCurrency(goal.target)} Goal</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner font-bold text-sm pointer-events-auto" style={{ backgroundColor: goal.color }}>
                        {percent}%
                      </div>
                    </div>

                    <div className="relative w-full flex-1 min-h-[160px] flex items-center justify-center mt-auto pointer-events-auto">
                      <svg className="w-full h-full absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/20" />
                        <motion.circle 
                          cx="50" cy="50" r="40" 
                          stroke={goal.color} 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray="251.2" 
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 - (251.2 * percent) / 100 }}
                          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 bg-card/10 rounded-full backdrop-blur-[2px] m-[15%]">
                        <span className="text-2xl font-bold tracking-tighter">{formatCurrency(goal.current)}</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Saved</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
