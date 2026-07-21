import { useState } from 'react';
import { saveApiKey, syncBank } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, KeyRound, CheckCircle2 } from 'lucide-react';

export function ApiIntegrations() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSaveKey = async () => {
    if (!apiKey) return;
    setIsSaving(true);
    try {
      await saveApiKey(apiKey);
      setSyncStatus('idle'); // Reset status
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await syncBank();
      setSyncStatus('success');
      // Invalidate to refresh everything!
      queryClient.invalidateQueries();
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

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
      <motion.div variants={itemVars}>
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter mb-2 text-foreground drop-shadow-lg">API Integrations</h1>
        <p className="text-muted-foreground text-lg tracking-wide">Connect your bank and third-party services.</p>
      </motion.div>

      <motion.div variants={itemVars}>
        <Card className="interactive-glass border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20 bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound size={20} /> Connect your Bank (Mock)</h3>
              <p className="text-sm text-muted-foreground">
                Enter any test API key to simulate a connection to Plaid or Stripe. Once connected, syncing will procedurally generate realistic transactions to showcase how the dashboard processes live data.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="password" 
                placeholder="sk_test_12345..." 
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono shadow-inner"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button 
                onClick={handleSaveKey}
                disabled={isSaving || !apiKey}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
              >
                {isSaving ? 'Saving...' : 'Save API Key'}
              </button>
            </div>

            <div className="pt-6 border-t border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Trigger Data Sync</p>
                <p className="text-xs text-muted-foreground mt-1">Pulls latest mock transactions and updates charts.</p>
              </div>
              <div className="flex items-center gap-4">
                {syncStatus === 'success' && (
                  <span className="text-sm text-success font-medium flex items-center gap-1">
                    <CheckCircle2 size={16} /> Synced
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span className="text-sm text-destructive font-medium">Error syncing</span>
                )}
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
