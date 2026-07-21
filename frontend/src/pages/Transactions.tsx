import { useState } from 'react';
import { useTransactions } from '@/hooks/useApi';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Search, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useTimeContext } from '@/context/TimeContext';
import { format } from 'date-fns';


import { Input } from '@/components/ui/input';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export function Transactions() {
  const { viewMode, currentDate } = useTimeContext();
  const monthStr = viewMode === 'monthly' ? format(currentDate, 'yyyy-MM') : undefined;
  const yearStr = viewMode === 'yearly' ? format(currentDate, 'yyyy') : undefined;

  const { data: transactions, isLoading } = useTransactions(monthStr, yearStr);

  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const [editingTx, setEditingTx] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await fetch(`http://localhost:4000/api/transactions/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
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

  const filtered = transactions?.filter((tx: any) => {
    const searchLower = search.toLowerCase();
    const merchantMatch = (tx.merchant || '').toLowerCase().includes(searchLower);
    const categoryMatch = (tx.category?.name || '').toLowerCase().includes(searchLower);
    return merchantMatch || categoryMatch;
  });

  const containerVars: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVars: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="p-8 lg:p-12 max-w-6xl mx-auto space-y-10"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      {editingTx && (
        <AddTransactionModal 
          initialData={editingTx} 
          onOpenChange={(open) => { if (!open) setEditingTx(null) }} 
        />
      )}

      <motion.div variants={itemVars} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter mb-2 text-foreground drop-shadow-lg">Transactions</h1>
          <p className="text-muted-foreground text-lg tracking-wide">Manage your income and expenses.</p>
        </div>
        <AddTransactionModal />
      </motion.div>

      <motion.div variants={itemVars} className="interactive-glass flex items-center gap-4 bg-card/60 backdrop-blur-xl p-2 rounded-[2rem] shadow-xl border border-border/40">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={22} />
          <Input 
            placeholder="Search by merchant, category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-14 h-14 text-base border-none shadow-none focus-visible:ring-0 bg-transparent rounded-2xl"
          />
        </div>
      </motion.div>

      {!transactions?.length ? (
        <motion.div variants={itemVars} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-muted/50 flex items-center justify-center shadow-inner">
            <span className="text-4xl">💸</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No Transactions Yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">Start tracking your finances by adding your first transaction.</p>
          <AddTransactionModal />
        </motion.div>
      ) : (
        <motion.div variants={itemVars}>
          <Card className="border-border/40 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-card/60 backdrop-blur-xl overflow-hidden rounded-[2rem]">
            <div className="divide-y divide-border/30">
              <AnimatePresence>
                {filtered?.map((tx: any) => (
                  <motion.div 
                    key={tx.id} 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 flex items-center justify-between hover:bg-muted/40 transition-colors group relative"
                  >
                    <div className="flex items-center gap-6">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-inner"
                        style={{ backgroundColor: tx.category.color }}
                      >
                        {tx.category.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-lg tracking-tight">{tx.merchant || tx.category.name}</p>
                        <p className="text-sm text-muted-foreground tracking-wide">{format(new Date(tx.date), 'MMM d, yyyy')} • {tx.category.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className={`text-right font-bold text-xl tracking-tight ${tx.type === 'Income' ? 'text-success' : 'text-foreground'}`}>
                        {tx.type === 'Expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-3 hover:bg-muted/50 rounded-2xl outline-none focus-visible:opacity-100">
                          <MoreHorizontal size={22} className="text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-2xl shadow-2xl">
                          <DropdownMenuItem onClick={() => setEditingTx(tx)} className="cursor-pointer rounded-xl py-3 font-medium">
                            <Pencil size={18} className="mr-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(tx.id)} className="cursor-pointer rounded-xl py-3 font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash size={18} className="mr-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filtered?.length === 0 && (
                <div className="p-16 text-center text-muted-foreground font-medium text-lg">
                  No transactions found matching "{search}"
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
