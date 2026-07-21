import { useState } from 'react';
import { useTransactions } from '@/hooks/useApi';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { useTimeContext } from '@/context/TimeContext';
import { motion, AnimatePresence } from 'framer-motion';

export function CalendarView() {
  const { viewMode, currentDate } = useTimeContext();
  const monthStr = viewMode === 'monthly' ? format(currentDate, 'yyyy-MM') : undefined;
  const yearStr = viewMode === 'yearly' ? format(currentDate, 'yyyy') : undefined;

  const { data: transactions, isLoading } = useTransactions(monthStr, yearStr);


  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;



  // --- Monthly Logic ---
  const mStart = startOfMonth(currentDate);
  const mEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: mStart, end: mEnd });

  const txByDay = (transactions || []).filter((t:any) => t.type === 'Expense').reduce((acc: any, t: any) => {
    const dayStr = t.date.split('T')[0];
    if (!acc[dayStr]) acc[dayStr] = 0;
    acc[dayStr] += t.amount;
    return acc;
  }, {});

  const maxSpentDay = Math.max(...Object.values(txByDay) as number[], 1);

  // --- Yearly Logic ---
  const yStart = startOfYear(currentDate);
  const yEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yStart, end: yEnd });

  const txByMonth = (transactions || []).filter((t:any) => t.type === 'Expense').reduce((acc: any, t: any) => {
    const monthStr = t.date.slice(0, 7); // YYYY-MM
    if (!acc[monthStr]) acc[monthStr] = 0;
    acc[monthStr] += t.amount;
    return acc;
  }, {});

  const maxSpentMonth = Math.max(...Object.values(txByMonth) as number[], 1);

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
      className="p-8 lg:p-12 max-w-6xl mx-auto space-y-10"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVars} className="mb-6">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter mb-2 text-foreground drop-shadow-lg">Calendar</h1>
        <p className="text-muted-foreground text-lg tracking-wide">Visualize your spending patterns.</p>
      </motion.div>


      <motion.div variants={itemVars}>
        <AnimatePresence mode="wait">
          {viewMode === 'monthly' ? (
            <motion.div key="monthly-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
              <Card className="border-border/40 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-card/60 backdrop-blur-xl p-8 rounded-[2rem]">
                <div className="grid grid-cols-7 gap-3">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-bold tracking-wider uppercase text-muted-foreground text-sm py-2">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: mStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-4" />
                  ))}

                  {days.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const spent = txByDay[dayStr] || 0;
                    const intensity = spent / maxSpentDay;
                    
                    return (
                      <div 
                        key={dayStr}
                        className="aspect-square rounded-2xl p-3 flex flex-col justify-between border border-border/20 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 cursor-pointer group"
                        style={{ 
                          backgroundColor: spent > 0 ? `hsla(var(--primary), ${Math.max(0.15, intensity)})` : 'transparent'
                        }}
                      >
                        <span className={`text-sm font-semibold transition-colors ${spent > 0 ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                        {spent > 0 && (
                          <span className="text-xs font-bold text-primary-foreground drop-shadow-md">
                            {formatCurrency(spent)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="yearly-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
              <Card className="border-border/40 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-card/60 backdrop-blur-xl p-8 rounded-[2rem]">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {months.map(month => {
                    const monthStr = format(month, 'yyyy-MM');
                    const spent = txByMonth[monthStr] || 0;
                    const intensity = spent / maxSpentMonth;

                    return (
                      <div 
                        key={monthStr}
                        className="aspect-video rounded-3xl p-5 flex flex-col justify-between border border-border/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 cursor-pointer group"
                        style={{ 
                          backgroundColor: spent > 0 ? `hsla(var(--primary), ${Math.max(0.15, intensity)})` : 'transparent'
                        }}
                      >
                        <span className={`text-lg font-bold tracking-tight transition-colors ${spent > 0 ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                          {format(month, 'MMM')}
                        </span>
                        {spent > 0 && (
                          <div className="text-right">
                            <span className="text-sm font-black tracking-tighter text-primary-foreground drop-shadow-md bg-black/20 px-3 py-1 rounded-full">
                              {formatCurrency(spent)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
