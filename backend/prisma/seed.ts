import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clean up existing data
  await prisma.transaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create User
  const user = await prisma.user.create({
    data: {
      name: 'Deepak',
      email: 'deepak@example.com'
    }
  });

  // Create Account
  const account = await prisma.account.create({
    data: {
      name: 'Main Checking',
      type: 'Checking',
      balance: 14500.50,
      userId: user.id
    }
  });

  // Create Categories
  const categoriesData = [
    { name: 'Food', color: '#f97316', icon: 'Utensils', type: 'Expense' },
    { name: 'Rent', color: '#3b82f6', icon: 'Home', type: 'Expense' },
    { name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag', type: 'Expense' },
    { name: 'Fuel', color: '#eab308', icon: 'Fuel', type: 'Expense' },
    { name: 'Travel', color: '#14b8a6', icon: 'Plane', type: 'Expense' },
    { name: 'Entertainment', color: '#8b5cf6', icon: 'Film', type: 'Expense' },
    { name: 'Healthcare', color: '#ef4444', icon: 'HeartPulse', type: 'Expense' },
    { name: 'Bills', color: '#6366f1', icon: 'Receipt', type: 'Expense' },
    { name: 'Subscriptions', color: '#06b6d4', icon: 'RefreshCw', type: 'Expense' },
    { name: 'Salary', color: '#10b981', icon: 'Briefcase', type: 'Income' },
    { name: 'Freelance', color: '#84cc16', icon: 'Monitor', type: 'Income' }
  ];

  const categories = await Promise.all(
    categoriesData.map(c => 
      prisma.category.create({ data: { ...c, userId: user.id } })
    )
  );

  const getCategory = (name: string) => categories.find(c => c.name === name)!;

  // Create Goals
  await prisma.goal.createMany({
    data: [
      { name: 'MacBook Pro', target: 2500, current: 1800, icon: 'Laptop', color: '#f97316', userId: user.id },
      { name: 'Trip to Japan', target: 5000, current: 1250, icon: 'Plane', color: '#ec4899', userId: user.id },
      { name: 'Emergency Fund', target: 10000, current: 10000, icon: 'Shield', color: '#10b981', userId: user.id }
    ]
  });

  // Create Budgets for the last 3 months
  const budgetsToCreate = [];
  for (let i = 0; i < 3; i++) {

    const d = subMonths(new Date(), i);
    const monthStr = d.toISOString().slice(0, 7);
    budgetsToCreate.push(
      { amount: 800, month: monthStr, categoryId: getCategory('Food').id, userId: user.id },
      { amount: 300, month: monthStr, categoryId: getCategory('Shopping').id, userId: user.id },
      { amount: 200, month: monthStr, categoryId: getCategory('Entertainment').id, userId: user.id },
      { amount: 500, month: monthStr, categoryId: getCategory('Travel').id, userId: user.id }
    );
  }
  await prisma.budget.createMany({
    data: budgetsToCreate
  });


  // Generate 3 months of transactions
  const transactions = [];
  const now = new Date();
  
  for (let i = 0; i < 90; i++) {

    const date = subDays(now, i);
    
    // Salary every 14 days
    if (i % 14 === 0) {
      transactions.push({
        amount: 3200 + (Math.random() * 200 - 100),
        date,
        merchant: 'Tech Corp Inc.',
        type: 'Income',
        accountId: account.id,
        categoryId: getCategory('Salary').id,
        userId: user.id
      });
    }

    // Rent once a month
    if (date.getDate() === 1) {
      transactions.push({
        amount: 2100,
        date,
        merchant: 'Avalon Apartments',
        type: 'Expense',
        accountId: account.id,
        categoryId: getCategory('Rent').id,
        userId: user.id
      });
    }

    // Subscriptions on the 5th
    if (date.getDate() === 5) {
      transactions.push({
        amount: 15.99,
        date,
        merchant: 'Netflix',
        type: 'Expense',
        accountId: account.id,
        categoryId: getCategory('Subscriptions').id,
        userId: user.id
      });
      transactions.push({
        amount: 10.99,
        date,
        merchant: 'Spotify',
        type: 'Expense',
        accountId: account.id,
        categoryId: getCategory('Subscriptions').id,
        userId: user.id
      });
    }

    // Daily food/coffee expenses (randomized)
    if (Math.random() > 0.3) {
      transactions.push({
        amount: Math.round((5 + Math.random() * 25) * 100) / 100,
        date,
        merchant: ['Starbucks', 'Sweetgreen', 'Whole Foods', 'Chipotle', 'UberEats'][Math.floor(Math.random() * 5)],
        type: 'Expense',
        accountId: account.id,
        categoryId: getCategory('Food').id,
        userId: user.id
      });
    }
    
    // Random shopping
    if (Math.random() > 0.8) {
      transactions.push({
        amount: Math.round((20 + Math.random() * 150) * 100) / 100,
        date,
        merchant: ['Amazon', 'Target', 'Apple Store', 'Zara'][Math.floor(Math.random() * 4)],
        type: 'Expense',
        accountId: account.id,
        categoryId: getCategory('Shopping').id,
        userId: user.id
      });
    }
    
    // Random entertainment
    if (Math.random() > 0.9) {
      transactions.push({
        amount: Math.round((15 + Math.random() * 60) * 100) / 100,
        date,
        merchant: ['AMC Theatres', 'Ticketmaster', 'Steam'][Math.floor(Math.random() * 3)],
        type: 'Expense',
        accountId: account.id,
        categoryId: getCategory('Entertainment').id,
        userId: user.id
      });
    }
  }

  await prisma.transaction.createMany({
    data: transactions
  });

  // Create Subscriptions
  await prisma.subscription.createMany({
    data: [
      { name: 'Netflix', amount: 15.99, frequency: 'Monthly', nextDueDate: addDays(now, 5), status: 'Active', icon: 'Film', color: '#e50914', categoryId: getCategory('Subscriptions').id, userId: user.id },
      { name: 'Spotify', amount: 10.99, frequency: 'Monthly', nextDueDate: addDays(now, 12), status: 'Active', icon: 'Music', color: '#1db954', categoryId: getCategory('Subscriptions').id, userId: user.id },
      { name: 'Equinox Gym', amount: 200.00, frequency: 'Monthly', nextDueDate: addDays(now, 1), status: 'Active', icon: 'Activity', color: '#000000', categoryId: getCategory('Subscriptions').id, userId: user.id },
      { name: 'AWS Cloud', amount: 45.00, frequency: 'Monthly', nextDueDate: addDays(now, 20), status: 'Active', icon: 'Cloud', color: '#ff9900', categoryId: getCategory('Subscriptions').id, userId: user.id },
    ]
  });

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
