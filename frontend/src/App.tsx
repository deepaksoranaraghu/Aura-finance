import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Analytics } from './pages/Analytics';
import { Savings } from './pages/Savings';
import { Budgets } from './pages/Budgets';
import { ApiIntegrations } from './pages/ApiIntegrations';
import { CalendarView } from './pages/CalendarView';
import { Cursor } from './components/Cursor';
import { CursorTrail } from './components/CursorTrail';
import { TimeProvider } from './context/TimeContext';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="finance-tracker-theme">
        <TimeProvider>
          <BrowserRouter>
            <CursorTrail />
            <Cursor />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="savings" element={<Savings />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="api-integrations" element={<ApiIntegrations />} />
                <Route path="calendar" element={<CalendarView />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TimeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
