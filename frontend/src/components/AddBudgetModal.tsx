import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTimeContext } from '@/context/TimeContext';
import { format } from 'date-fns';

export function AddBudgetModal({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
  });
  
  const { viewMode, currentDate } = useTimeContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a category first.");
      return;
    }
    setLoading(true);

    try {
      await fetch('http://localhost:4000/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId,
          month: viewMode === 'monthly' ? format(currentDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM')
        })
      });

      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      setOpen(false);
      setFormData({ amount: '', categoryId: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="rounded-full shadow-lg gap-2 bg-primary hover:bg-primary/90">
            <Plus size={18} /> Create Budget
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create a Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.categoryId} onValueChange={(val: any) => val && setFormData({ ...formData, categoryId: val })}>
              <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.filter((c: any) => c.type === 'Expense').map((c: any) => (
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
            <Label htmlFor="amount">Monthly Limit</Label>
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

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
