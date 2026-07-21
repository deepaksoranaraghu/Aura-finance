import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';

export function AddFundsModal({ children, goalId, goalName, currentAmount, targetAmount }: { children?: React.ReactNode, goalId: string, goalName: string, currentAmount: number, targetAmount: number }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/goals/${goalId}/add-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to add funds');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      
      setOpen(false);
      setAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, targetAmount - currentAmount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button variant="outline" size="sm" className="rounded-full shadow-sm gap-2">
            <Plus size={16} /> Add Funds
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Funds to {goalName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Contribution Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                max={remaining}
                placeholder={`Remaining: ${formatCurrency(remaining)}`}
                className="pl-7 rounded-xl"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              {loading ? 'Adding...' : 'Add Funds'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
