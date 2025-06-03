export interface TransactionReceiptInterface {
    id: string;
    amount: number;
    description: string;
    merchant: string;
    date: string;
    time: string;
    status: 'completed' | 'pending' | 'failed';
    category: string;
}

export const ALL_TRANSACTIONS: TransactionReceiptInterface[] = [
    {
        id: 'TXN001',
        amount: 89.99,
        description: 'Groceries - Fresh produce, dairy products, and household essentials',
        merchant: 'Whole Foods Market',
        date: 'Dec 15, 2024',
        time: '2:34 PM',
        status: 'completed',
        category: 'Groceries'
    },
    {
        id: 'TXN002',
        amount: 1250.00,
        description: 'Monthly rent payment for apartment unit 4B',
        merchant: 'City Apartments LLC',
        date: 'Dec 14, 2024',
        time: '9:15 AM',
        status: 'completed',
        category: 'Housing'
    },
    {
        id: 'TXN003',
        amount: 45.67,
        description: 'Coffee, pastries and lunch at downtown location',
        merchant: 'Starbucks Coffee',
        date: 'Dec 14, 2024',
        time: '11:22 AM',
        status: 'completed',
        category: 'Food & Dining'
    },
    {
        id: 'TXN004',
        amount: 299.99,
        description: 'Wireless Bluetooth headphones with noise cancellation',
        merchant: 'Best Buy Electronics',
        date: 'Dec 13, 2024',
        time: '4:18 PM',
        status: 'completed',
        category: 'Electronics'
    },
    {
        id: 'TXN005',
        amount: 75.50,
        description: 'Premium gasoline fill-up for vehicle',
        merchant: 'Shell Gas Station',
        date: 'Dec 13, 2024',
        time: '8:45 AM',
        status: 'completed',
        category: 'Transportation'
    },
    {
        id: 'TXN006',
        amount: 150.00,
        description: 'Monthly gym membership and personal training session',
        merchant: 'FitLife Gym & Wellness',
        date: 'Dec 12, 2024',
        time: '6:30 PM',
        status: 'completed',
        category: 'Health & Fitness'
    },
    {
        id: 'TXN007',
        amount: 89.99,
        description: 'Online streaming service annual subscription renewal',
        merchant: 'Netflix Entertainment',
        date: 'Dec 12, 2024',
        time: '10:15 AM',
        status: 'completed',
        category: 'Entertainment'
    },
    {
        id: 'TXN008',
        amount: 234.56,
        description: 'Business dinner with clients at upscale restaurant',
        merchant: 'The Capital Grille',
        date: 'Dec 11, 2024',
        time: '7:45 PM',
        status: 'completed',
        category: 'Business'
    },
    {
        id: 'TXN009',
        amount: 67.89,
        description: 'Books, magazines and office supplies for work',
        merchant: 'Barnes & Noble',
        date: 'Dec 11, 2024',
        time: '2:20 PM',
        status: 'completed',
        category: 'Education'
    },
    {
        id: 'TXN010',
        amount: 45.00,
        description: 'Prescription medications and health supplements',
        merchant: 'CVS Pharmacy',
        date: 'Dec 10, 2024',
        time: '11:30 AM',
        status: 'completed',
        category: 'Healthcare'
    },
    {
        id: 'TXN011',
        amount: 125.75,
        description: 'Professional haircut and styling services',
        merchant: 'Elite Hair Salon',
        date: 'Dec 10, 2024',
        time: '3:15 PM',
        status: 'pending',
        category: 'Personal Care'
    },
    {
        id: 'TXN012',
        amount: 89.99,
        description: 'Home cleaning supplies and laundry detergent',
        merchant: 'Target Store',
        date: 'Dec 9, 2024',
        time: '1:45 PM',
        status: 'completed',
        category: 'Household'
    }
];
