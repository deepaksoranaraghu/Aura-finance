import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { API_BASE } from '@/hooks/useApi';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

export function AddGoalModal({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    color: COLORS[6],
    icon: '🎯'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      setOpen(false);
      setFormData({ name: '', target: '', color: COLORS[6], icon: '🎯' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger render={<div className="inline-block" />}>{children}</DialogTrigger>
      ) : (
        <DialogTrigger render={<Button className="rounded-full shadow-lg gap-2 bg-primary hover:bg-primary/90" />}>
          <Plus size={18} /> Add Goal
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Savings Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input 
              id="name" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. New Car, Vacation" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target">Target Amount</Label>
            <Input 
              id="target" 
              type="number" 
              step="0.01" 
              required 
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${formData.color === c ? 'scale-125 ring-2 ring-offset-2 ring-background shadow-md' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c, outlineColor: c }}
                  onClick={() => setFormData({ ...formData, color: c })}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
