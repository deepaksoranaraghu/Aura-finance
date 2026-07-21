import { useState } from 'react';
import { useBudgets, useTransactions } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { AddBudgetModal } from '@/components/AddBudgetModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useTimeContext } from '@/context/TimeContext';



export function Budgets() {
  const { viewMode, currentDate } = useTimeContext();
  const monthStr = viewMode === 'monthly' ? format(currentDate, 'yyyy-MM') : undefined;
  const yearStr = viewMode === 'yearly' ? format(currentDate, 'yyyy') : undefined;

  const { data: budgets, isLoading: bLoad } = useBudgets(monthStr, yearStr);
  const { data: transactions, isLoading: tLoad } = useTransactions(monthStr, yearStr);
  const queryClient = useQueryClient();


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    try {
      await fetch(`http://localhost:4000/api/budgets/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    } catch (err) {
      console.error(err);
    }
  };

  if (bLoad || tLoad) {
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

  // Filter transactions based on view mode
  const dateStr = viewMode === 'monthly' 
    ? format(currentDate, 'yyyy-MM')
    : format(currentDate, 'yyyy');
    
  const filteredTx = transactions?.filter((t: any) => t.date.startsWith(dateStr) && t.type === 'Expense') || [];

  // Group budgets by category (since backend might return multiple months, we take the latest for the category)
  const categoryBudgets = new Map();
  budgets?.forEach((b: any) => {
    if (!categoryBudgets.has(b.categoryId) || b.month > categoryBudgets.get(b.categoryId).month) {
      categoryBudgets.set(b.categoryId, b);
    }
  });
  const activeBudgets = Array.from(categoryBudgets.values());

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
      className="p-8 lg:p-12 max-w-4xl mx-auto space-y-10"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVars} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter mb-2 text-foreground drop-shadow-lg">Budgets</h1>
          <p className="text-muted-foreground text-lg tracking-wide">Keep your spending in check.</p>
        </div>
        <AddBudgetModal />
      </motion.div>


      {!activeBudgets.length ? (
        <motion.div variants={itemVars} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-muted/50 flex items-center justify-center shadow-inner">
            <span className="text-4xl">💰</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No Budgets Setup</h2>
          <p className="text-muted-foreground max-w-sm mb-6">Create a budget to help control your expenses and reach your goals.</p>
          <AddBudgetModal />
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {activeBudgets.map((budget: any) => {
              const spent = filteredTx
                .filter((t: any) => t.categoryId === budget.categoryId)
                .reduce((sum: number, t: any) => sum + t.amount, 0);
              
              const targetAmount = viewMode === 'yearly' ? budget.amount * 12 : budget.amount;
              const percent = Math.min(100, (spent / targetAmount) * 100);
              const isWarning = percent > 80;
              const isDanger = percent >= 100;
              const remaining = targetAmount - spent;

              return (
                <motion.div 
                  key={`${budget.id}-${viewMode}`} 
                  variants={itemVars} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4, scale: 1.01 }} 
                  transition={{ type: "spring", stiffness: 400, damping: 25 }} 
                  className="interactive-glass rounded-[2rem] relative group"
                >
                  
                  <div className="absolute top-6 right-6 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted/50 rounded-xl outline-none focus-visible:opacity-100 bg-background/50 backdrop-blur-md border border-border/50">
                        <MoreHorizontal size={20} className="text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-2xl shadow-2xl">
                        <DropdownMenuItem onClick={() => handleDelete(budget.id)} className="cursor-pointer rounded-xl py-3 font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash size={18} className="mr-3" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Card className="border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20 bg-card/60 backdrop-blur-xl">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-6">
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner font-bold text-sm"
                            style={{ backgroundColor: budget.category.color }}
                          >
                            {budget.category.name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-xl tracking-tight pr-12">{budget.category.name}</h3>
                            <p className="text-sm font-medium text-muted-foreground tracking-wide mt-1">
                              {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold tracking-tighter ${isDanger ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-foreground'}`}>
                            {formatCurrency(spent)}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">of {formatCurrency(targetAmount)}</div>
                        </div>
                      </div>
                      
                      <div className="w-full h-4 bg-muted/30 rounded-full overflow-hidden relative shadow-inner">
                        <motion.div 
                          className={`absolute top-0 left-0 h-full rounded-full shadow-lg ${isDanger ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1.5, type: "spring", stiffness: 50, damping: 15 }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

    </motion.div>
  );
}
