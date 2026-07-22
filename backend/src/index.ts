import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Helper for date filtering
function getDateFilter(req: express.Request) {
  const { month, year } = req.query as { month?: string, year?: string };
  if (month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { gte: start, lt: end };
  } else if (year) {
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return { gte: start, lt: end };
  }
  return undefined;
}

// Users & Accounts
app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany({ include: { accounts: true } });
  res.json(users);
});

// Categories
app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  const dateFilter = getDateFilter(req);
  const where = dateFilter ? { date: dateFilter } : undefined;

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { category: true, account: true }
  });

  res.json(transactions);
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, date, notes, merchant, type, accountId, categoryId, userId } = req.body;
    const transaction = await prisma.transaction.create({
      data: {
        amount, date: new Date(date), notes, merchant, type, accountId, categoryId, userId
      },
      include: { category: true, account: true }
    });
    
    // Update account balance
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (account) {
      const newBalance = type === 'Income' ? account.balance + amount : account.balance - amount;
      await prisma.account.update({ where: { id: accountId }, data: { balance: newBalance } });
    }

    res.json(transaction);
  } catch (err: any) {
    console.error('Create tx error:', err);
    res.status(400).json({ error: 'Failed to create transaction: ' + err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, notes, merchant, type, categoryId } = req.body;
    
    // Fetch old to revert balance
    const oldTx = await prisma.transaction.findUnique({ where: { id } });
    if (!oldTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount, 
        date: date ? new Date(date) : undefined, 
        notes, 
        merchant, 
        type, 
        categoryId
      },
      include: { category: true, account: true }
    });
    
    // Update balance
    if (oldTx.amount !== amount || oldTx.type !== type) {
      const account = await prisma.account.findUnique({ where: { id: oldTx.accountId } });
      if (account) {
        // Revert old
        let balance = oldTx.type === 'Income' ? account.balance - oldTx.amount : account.balance + oldTx.amount;
        // Apply new
        balance = type === 'Income' ? balance + amount : balance - amount;
        await prisma.account.update({ where: { id: oldTx.accountId }, data: { balance } });
      }
    }

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const oldTx = await prisma.transaction.findUnique({ where: { id } });
    if (!oldTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({ where: { id } });

    // Update balance
    const account = await prisma.account.findUnique({ where: { id: oldTx.accountId } });
    if (account) {
      const balance = oldTx.type === 'Income' ? account.balance - oldTx.amount : account.balance + oldTx.amount;
      await prisma.account.update({ where: { id: oldTx.accountId }, data: { balance } });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete transaction' });
  }
});

// Summary
app.get('/api/summary', async (req, res) => {
  // Aggregate stats for the dashboard
  const accounts = await prisma.account.findMany();
  const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const dateFilter = getDateFilter(req);
  const where = dateFilter ? { date: dateFilter } : { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } };
  
  const monthlyTransactions = await prisma.transaction.findMany({
    where
  });

  let income = 0;
  let expenses = 0;

  monthlyTransactions.forEach(t => {
    if (t.type === 'Income') income += t.amount;
    if (t.type === 'Expense') expenses += t.amount;
  });

  // Calculate historical balance by subtracting future net flow from current balance
  let displayBalance = currentBalance;
  if (dateFilter) {
    const futureTransactions = await prisma.transaction.findMany({
      where: { date: { gte: dateFilter.lt } }
    });
    
    futureTransactions.forEach(t => {
      if (t.type === 'Income') displayBalance -= t.amount;
      if (t.type === 'Expense') displayBalance += t.amount;
    });
  }

  res.json({ balance: displayBalance, income, expenses, cashFlow: income - expenses });
});

// Goals
app.get('/api/goals', async (req, res) => {
  const goals = await prisma.goal.findMany();
  res.json(goals);
});

app.post('/api/goals', async (req, res) => {
  try {
    const { name, target, color, icon, userId } = req.body;
    let uId = userId;
    if (!uId) {
      const user = await prisma.user.findFirst();
      uId = user?.id;
    }
    const goal = await prisma.goal.create({
      data: { name, target: parseFloat(target), current: 0, color, icon, userId: uId }
    });
    res.json(goal);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create goal' });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Refund the goal's current saved amount back to the main account balance
    if (goal.current > 0) {
      const user = await prisma.user.findUnique({ where: { id: goal.userId }, include: { accounts: true } });
      if (user && user.accounts.length > 0) {
        const account = user.accounts[0];
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: account.balance + goal.current }
        });
      }
    }

    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete goal' });
  }
});

app.post('/api/goals/:id/add-funds', async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Enforce strict target limit
    const remaining = Math.max(0, goal.target - goal.current);
    if (amount > remaining) {
      return res.status(400).json({ error: `Cannot add more than the remaining target ($${remaining.toFixed(2)})` });
    }
    const amountToAdd = amount;

    if (amountToAdd <= 0) return res.status(400).json({ error: 'Goal is already fully funded' });

    const user = await prisma.user.findUnique({ where: { id: goal.userId }, include: { accounts: true } });
    if (!user || user.accounts.length === 0) return res.status(400).json({ error: 'Account not found' });
    
    const account = user.accounts[0];

    // Check if enough balance exists
    if (account.balance < amountToAdd) {
      return res.status(400).json({ error: 'Insufficient funds in main account' });
    }

    // Deduct from account
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: account.balance - amountToAdd }
    });
    
    // Add to goal
    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { current: goal.current + amountToAdd }
    });
    
    res.json(updatedGoal);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add funds' });
  }
});

// Budgets
app.get('/api/budgets', async (req, res) => {
  const { month, year } = req.query as { month?: string, year?: string };
  let where = {};
  if (month) where = { month };
  else if (year) where = { month: { startsWith: year } };

  const budgets = await prisma.budget.findMany({ 
    where,
    include: { category: true } 
  });
  res.json(budgets);
});

app.post('/api/budgets', async (req, res) => {
  try {
    const { amount, categoryId, userId, month } = req.body;
    let uId = userId;
    if (!uId) {
      const user = await prisma.user.findFirst();
      uId = user?.id;
    }
    
    // Check if budget already exists for this category this month
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const existing = await prisma.budget.findFirst({
      where: { categoryId, month: targetMonth }
    });

    if (existing) {
      const budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: parseFloat(amount) },
        include: { category: true }
      });
      return res.json(budget);
    }

    const budget = await prisma.budget.create({
      data: { 
        amount: parseFloat(amount), 
        categoryId, 
        userId: uId,
        month: targetMonth
      },
      include: { category: true }
    });
    res.json(budget);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create budget' });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    await prisma.budget.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete budget' });
  }
});

// Analytics (Simple spending over the last 12 months for charts)
app.get('/api/analytics', async (req, res) => {
  const { month, year } = req.query as { month?: string, year?: string };
  const dateFilter = getDateFilter(req);
  
  const transactions = await prisma.transaction.findMany({
    where: { 
      type: 'Expense',
      ...(dateFilter ? { date: dateFilter } : {})
    },
    orderBy: { date: 'asc' }
  });
  
  // Group by day if month is provided, else group by month
  const grouped = transactions.reduce((acc: any, t) => {
    const key = month ? t.date.toISOString().slice(0, 10) : t.date.toISOString().slice(0, 7);
    if (!acc[key]) acc[key] = 0;
    acc[key] += t.amount;
    return acc;
  }, {});


  const data = Object.keys(grouped).map(month => ({
    month,
    expenses: grouped[month]
  }));

  res.json(data);
});

// Subscriptions
app.get('/api/subscriptions', async (req, res) => {
  const subscriptions = await prisma.subscription.findMany({ include: { category: true } });
  res.json(subscriptions);
});

// Insights & Financial Score
app.get('/api/insights', async (req, res) => {
  // Simple AI-style health score calculation
  const accounts = await prisma.account.findMany();
  let balance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const now = new Date();
  const dateFilter = getDateFilter(req);
  const where = dateFilter ? { date: dateFilter } : { date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
  
  const monthlyTransactions = await prisma.transaction.findMany({
    where
  });

  // If viewing a past date, subtract future transactions from the current real-time balance
  if (dateFilter && dateFilter.lt) {
    const futureTransactions = await prisma.transaction.findMany({
      where: { date: { gte: dateFilter.lt } }
    });
    
    futureTransactions.forEach(t => {
      if (t.type === 'Income') balance -= t.amount;
      if (t.type === 'Expense') balance += t.amount;
    });
  }

  let income = 0;
  let expenses = 0;

  monthlyTransactions.forEach(t => {
    if (t.type === 'Income') income += t.amount;
    if (t.type === 'Expense') expenses += t.amount;
  });

  // Score Logic
  // Max score 100
  let score = 50; // Base score
  
  const savingsRate = income > 0 ? ((income - expenses) / income) : 0;
  if (savingsRate > 0.2) score += 20;
  else if (savingsRate > 0.1) score += 10;
  else if (savingsRate < 0) score -= 20;

  if (balance > expenses * 3) score += 30; // 3 months emergency fund
  else if (balance > expenses) score += 15;
  
  score = Math.max(0, Math.min(100, score));
  
  let status = 'Good';
  if (score >= 80) status = 'Excellent';
  else if (score < 50) status = 'Needs Attention';

  // Smart Insights
  const expensesOnly = monthlyTransactions.filter(t => t.type === 'Expense');
  
  const categorySpending = expensesOnly.reduce((acc: any, t) => {
    acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
    return acc;
  }, {});
  
  const topCategoryId = Object.keys(categorySpending).sort((a, b) => categorySpending[b] - categorySpending[a])[0];
  const topCategory = topCategoryId ? await prisma.category.findUnique({ where: { id: topCategoryId } }) : null;

  const averageDaily = expenses / (now.getDate() || 1);

  res.json({
    score,
    status,
    metrics: {
      savingsRate: savingsRate * 100,
      emergencyFundRatio: expenses > 0 ? (balance / expenses) : 0
    },
    insights: {
      topCategory: topCategory?.name || 'None',
      averageDaily,
      cashFlowPrediction: income - expenses
    }
  });
});

// API Settings & Sync
app.post('/api/settings/apikey', async (req, res) => {
  try {
    const { apiKey, userId } = req.body;
    // For simplicity, we just use the first user if userId isn't provided (since we have a seeded user)
    let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : await prisma.user.findFirst();
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.update({
      where: { id: user.id },
      data: { apiKey }
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to save API key' });
  }
});

import { GoogleGenerativeAI } from '@google/generative-ai';

app.post('/api/sync', async (req, res) => {

  try {
    const user = await prisma.user.findFirst();
    if (!user || !user.apiKey) {
      return res.status(400).json({ error: 'No API Key configured. Please add an API Key first.' });
    }

    const account = await prisma.account.findFirst();
    if (!account) return res.status(400).json({ error: 'No account found' });

    const categories = await prisma.category.findMany();
    
    // Simulate raw, messy bank statement data
    const rawBankData = [
      "07/15/2026 POS DEBIT - WFM #10423 SAN FRANCISCO CA - 142.50",
      "07/16/2026 RECURRING PAYMENT - NETFLIX.COM - 15.99",
      "07/18/2026 UBER *TRIP - 24.30",
      "07/19/2026 ACH CREDIT - ACME CORP PAYROLL - 3200.00"
    ].join('\n');

    // Use Gemini to categorize
    const genAI = new GoogleGenerativeAI(user.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze the following raw bank statement data and convert it into a structured JSON array.
    Here are the available categories and their IDs:
    ${categories.map(c => `- ${c.name} (ID: ${c.id}, Type: ${c.type})`).join('\n')}

    Raw Data:
    ${rawBankData}

    Return ONLY a JSON array of objects with the following keys:
    - merchant: cleaned up merchant name (e.g. "Whole Foods", "Netflix", "Uber", "Acme Corp")
    - amount: positive number
    - type: "Income" or "Expense"
    - cat: the exact ID of the category that best matches
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean markdown formatting if present
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const mockData = JSON.parse(cleanJson);

    let balanceChange = 0;

    for (const data of mockData) {
      await prisma.transaction.create({
        data: {
          amount: data.amount,
          date: new Date(),
          merchant: data.merchant,
          type: data.type,
          accountId: account.id,
          categoryId: data.cat,
          userId: user.id
        }
      });
      balanceChange += data.type === 'Income' ? data.amount : -data.amount;
    }

    // Update account balance
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: account.balance + balanceChange }
    });

    // Update lastSyncedAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSyncedAt: new Date() }
    });

    res.json({ success: true, message: `Successfully synced ${mockData.length} transactions via Gemini AI.` });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to sync with Bank via AI' });
  }
});

async function ensureDbInitialized() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('Database empty: Auto-provisioning default user and categories...');
      const user = await prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'demo@example.com',
          accounts: {
            create: {
              name: 'Main Checking',
              type: 'Checking',
              balance: 10000
            }
          }
        }
      });

      await prisma.category.createMany({
        data: [
          { name: 'Food', color: '#f97316', icon: 'Utensils', type: 'Expense', userId: user.id },
          { name: 'Rent', color: '#3b82f6', icon: 'Home', type: 'Expense', userId: user.id },
          { name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag', type: 'Expense', userId: user.id },
          { name: 'Salary', color: '#10b981', icon: 'Briefcase', type: 'Income', userId: user.id },
        ]
      });
      console.log('Auto-provisioning complete.');
    }
  } catch (err) {
    console.error('Failed to auto-provision DB:', err);
  }
}

async function startServer() {
  await ensureDbInitialized();
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Backend listening at http://127.0.0.1:${port}`);
  });
}

startServer();

// Prevent Node from exiting immediately if there's an event loop issue
setInterval(() => {}, 1000 * 60 * 60);
