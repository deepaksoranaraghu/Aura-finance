import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories, API_BASE } from '@/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useTimeContext } from '@/context/TimeContext';

export function AddTransactionModal({ children, initialData, onOpenChange }: { children?: React.ReactNode, initialData?: any, onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();

  const { viewMode, currentDate } = useTimeContext();
  const [loading, setLoading] = useState(false);

  const getDefaultDate = () => {
    if (initialData) return format(new Date(initialData.date), 'yyyy-MM-dd');
    const now = new Date();
    if (viewMode === 'monthly' && (currentDate.getMonth() !== now.getMonth() || currentDate.getFullYear() !== now.getFullYear())) {
      return format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
    }
    return format(now, 'yyyy-MM-dd');
  };

  const [formData, setFormData] = useState({
    amount: initialData?.amount?.toString() || '',
    merchant: initialData?.merchant || '',
    date: getDefaultDate(),
    categoryId: initialData?.categoryId || '',
    type: initialData?.type || 'Expense',
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (onOpenChange) onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a category first.");
      return;
    }
    setLoading(true);

    try {
      const resUsers = await fetch(`${API_BASE}/api/users`);
      if (!resUsers.ok) throw new Error("Failed to fetch users");
      const users = await resUsers.json();
      
      if (!users || users.length === 0) {
        throw new Error("No users found. Please refresh the page to auto-provision.");
      }
      
      const userId = users[0].id;
      const accountId = users[0].accounts[0]?.id;
      
      if (!accountId) {
        throw new Error("No main account found.");
      }

      const url = initialData ? `${API_BASE}/api/transactions/${initialData.id}` : `${API_BASE}/api/transactions`;
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId,
          userId,
          accountId,
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save transaction');
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      
      handleOpenChange(false);
      if (!initialData) {
        setFormData({ amount: '', merchant: '', date: getDefaultDate(), categoryId: '', type: 'Expense' });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger>{children}</DialogTrigger>
      ) : (
        <DialogTrigger render={
          <Button className="rounded-full shadow-lg gap-2 bg-primary hover:bg-primary/90">
            <Plus size={18} /> Add Transaction
          </Button>
        } />
      )}
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(val: any) => val && setFormData({ ...formData, type: val, categoryId: '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Expense">Expense</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01" 
              required 
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="merchant">Merchant / Description</Label>
          <Input 
            id="merchant" 
            required 
            value={formData.merchant}
            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            placeholder="e.g. Apple Store" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.categoryId ? formData.categoryId.toString() : ''} onValueChange={(val: any) => val && setFormData({ ...formData, categoryId: val })}>
              <SelectTrigger>
                {formData.categoryId ? (
                  (() => {
                    const cat = categories?.find((c: any) => c.id.toString() === formData.categoryId.toString());
                    return cat ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    ) : <SelectValue placeholder="Select a category" />;
                  })()
                ) : (
                  <SelectValue placeholder="Select a category" />
                )}
              </SelectTrigger>
              <SelectContent>
                {categories?.filter((c: any) => c.type === formData.type).map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date" 
              required 
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading || !categories || categories.length === 0} className="w-full">
              {loading ? 'Saving...' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
