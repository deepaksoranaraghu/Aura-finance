import { createContext, useContext, useState, ReactNode } from 'react';
import { subMonths, addMonths, subYears, addYears } from 'date-fns';

type ViewMode = 'monthly' | 'yearly';

interface TimeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  handlePrev: () => void;
  handleNext: () => void;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrev = () => {
    setCurrentDate(prev => viewMode === 'monthly' ? subMonths(prev, 1) : subYears(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => viewMode === 'monthly' ? addMonths(prev, 1) : addYears(prev, 1));
  };

  return (
    <TimeContext.Provider value={{ viewMode, setViewMode, currentDate, setCurrentDate, handlePrev, handleNext }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTimeContext() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTimeContext must be used within a TimeProvider');
  }
  return context;
}
