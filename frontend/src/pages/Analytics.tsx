import { useAnalytics, useTransactions } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTimeContext } from '@/context/TimeContext';
import { format } from 'date-fns';


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border/50 p-4 rounded-2xl shadow-xl shadow-black/10"
      >
        <p className="font-semibold text-muted-foreground mb-1">{label || payload[0].name}</p>
        <p className="text-xl font-bold text-foreground">
          {formatCurrency(payload[0].value)}
        </p>
      </motion.div>
    );
  }
  return null;
};

export function Analytics() {
  const { viewMode, currentDate } = useTimeContext();
  const monthStr = viewMode === 'monthly' ? format(currentDate, 'yyyy-MM') : undefined;
  const yearStr = viewMode === 'yearly' ? format(currentDate, 'yyyy') : undefined;

  const { data: analytics, isLoading: loadingAnalytics } = useAnalytics(monthStr, yearStr);
  const { data: transactions, isLoading: loadingTx } = useTransactions(monthStr, yearStr);


  if (loadingAnalytics || loadingTx) {
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

  // Calculate category spending
  const categorySpending = transactions?.filter((t: any) => t.type === 'Expense').reduce((acc: any, t: any) => {
    const cat = t.category.name;
    if (!acc[cat]) acc[cat] = { name: cat, value: 0, color: t.category.color };
    acc[cat].value += t.amount;
    return acc;
  }, {});
  
  const pieData = Object.values(categorySpending || {}).sort((a: any, b: any) => b.value - a.value);

  const containerVars: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="p-8 lg:p-12 max-w-7xl mx-auto space-y-10"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVars}>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter mb-2 text-foreground drop-shadow-sm">Analytics</h1>
        <p className="text-muted-foreground text-lg">Detailed breakdown of your spending habits.</p>
      </motion.div>

      {(!analytics?.length && !pieData?.length) ? (
        <motion.div variants={itemVars} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <span className="text-4xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No Data Yet</h2>
          <p className="text-muted-foreground max-w-sm">Add some transactions to see your spending analytics and trends.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={itemVars}>
            <Card className="border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-muted-foreground">Spending Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] mt-4 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))'}}
                      tickFormatter={(val) => {
                        // Format YYYY-MM-DD to DD, YYYY-MM to MMM
                        if (val.length === 10) return format(new Date(val), 'd');
                        if (val.length === 7) return format(new Date(val + '-01'), 'MMM');
                        return val;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />

                    <Bar 
                      dataKey="expenses" 
                      fill="hsl(var(--primary))" 
                      radius={[8, 8, 8, 8]} 
                      animationDuration={1500} 
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVars}>
            <Card className="border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-muted-foreground">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={120} 
                      paddingAngle={4}
                      animationDuration={1500}
                      animationEasing="ease-out"
                      stroke="none"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
