import { useEffect } from 'react';
import { useSummary, useTransactions, useAnalytics, useInsights } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, BrainCircuit } from 'lucide-react';
import { format } from 'date-fns';
import { useTimeContext } from '@/context/TimeContext';

import { AddTransactionModal } from '@/components/AddTransactionModal';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { AnimatedOrb } from '@/components/3d/AnimatedOrb';

function AnimatedNumber({ value, isCurrency = true }: { value: number, isCurrency?: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => isCurrency ? formatCurrency(latest) : Math.round(latest).toString());


  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

export function Dashboard() {
  const { viewMode, currentDate } = useTimeContext();
  const monthStr = viewMode === 'monthly' ? format(currentDate, 'yyyy-MM') : undefined;
  const yearStr = viewMode === 'yearly' ? format(currentDate, 'yyyy') : undefined;

  const { data: summary, isLoading: loadingSummary } = useSummary(monthStr, yearStr);
  const { data: transactions, isLoading: loadingTx } = useTransactions(monthStr, yearStr);
  const { data: analytics, isLoading: loadingAnalytics } = useAnalytics(monthStr, yearStr);
  const { data: insights, isLoading: loadingInsights } = useInsights(monthStr, yearStr);


  if (loadingSummary || loadingTx || loadingAnalytics || loadingInsights) {
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

  const recentTx = transactions?.slice(0, 5) || [];

  const containerVars: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 relative"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      {/* 3D Orb in background */}
      <AnimatedOrb />

      {/* Hero Section */}
      <motion.div variants={itemVars} className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-10">
        <div className="space-y-2">
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Total Balance</p>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground drop-shadow-lg">
            <AnimatedNumber value={summary?.balance || 0} />
          </h1>
        </div>
        <AddTransactionModal />
      </motion.div>

      {/* Stats Grid - Asymmetrical */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* Main Chart Card */}
        <motion.div variants={itemVars} className="md:col-span-8 interactive-glass rounded-[1.5rem]">
          <Card className="h-full border-border/40 shadow-2xl shadow-black/10 dark:shadow-black/40 bg-card/60 backdrop-blur-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Cash Flow Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] p-0 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)', backgroundColor: 'hsl(var(--card))' }}
                    formatter={(val: any) => formatCurrency(val)}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorExp)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Health & Mini Stats */}
        <motion.div variants={itemVars} className="md:col-span-4 flex flex-col gap-6">
          <Card className="interactive-glass border-border/40 shadow-xl shadow-black/10 dark:shadow-black/30 bg-card/60 backdrop-blur-xl relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="text-info w-5 h-5" />
                <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">Financial Health</h3>
              </div>
              <div className="flex items-end gap-4">
                <div className="text-5xl font-bold tracking-tighter">
                  <AnimatedNumber value={insights?.score || 0} isCurrency={false} />
                </div>

                <div className={`mb-2 font-medium ${insights?.status === 'Excellent' ? 'text-success' : insights?.status === 'Needs Attention' ? 'text-destructive' : 'text-primary'}`}>
                  {insights?.status}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Top Spending: <span className="font-semibold text-foreground">{insights?.insights?.topCategory}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Avg per Day: <span className="font-semibold text-foreground">{formatCurrency(insights?.insights?.averageDaily || 0)}</span></p>
              </div>

            </CardContent>
          </Card>

          <StatCard title="Income" value={summary?.income} icon={ArrowUpRight} color="text-success" bg="bg-success/10" />
          <StatCard title="Expenses" value={summary?.expenses} icon={ArrowDownRight} color="text-destructive" bg="bg-destructive/10" />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVars} className="space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Activity</h2>
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">View All</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {recentTx.map((tx: any) => (
            <motion.div 
              key={tx.id}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="interactive-glass rounded-[1.5rem]"
            >
              <Card className="border-border/40 shadow-lg shadow-black/5 dark:shadow-black/20 bg-card/60 backdrop-blur-xl h-full">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-inner"
                      style={{ backgroundColor: tx.category.color }}
                    >
                      <span className="text-xs font-bold">{tx.category.name.substring(0,2).toUpperCase()}</span>
                    </div>
                    <div className={`text-sm font-bold ${tx.type === 'Income' ? 'text-success' : 'text-foreground'}`}>
                      {tx.type === 'Expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold truncate tracking-tight">{tx.merchant || tx.category.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="flex-1 interactive-glass border-border/40 shadow-lg shadow-black/5 dark:shadow-black/20 bg-card/60 backdrop-blur-xl">
      <CardContent className="p-6 h-full flex flex-col justify-center">
        <div className="flex justify-between items-center mb-4">
          <div className={`p-3 rounded-2xl ${bg} ${color}`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold tracking-tight">
          <AnimatedNumber value={value || 0} />
        </p>
      </CardContent>
    </Card>
  );
}
