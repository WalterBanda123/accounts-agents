export interface CartItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    barcode?: string;
}

export interface Customer {
    name: string;
    email?: string;
    phone?: string;
}

export interface TransactionReceiptInterface {
    id: string;
    amount: number;
    description: string;
    merchant: string;
    date: string;
    time: string;
    status: 'completed' | 'pending' | 'failed';
    category: string;
    cartItems: CartItem[];
    customer?: Customer; // null for anonymous transactions
    paymentMethod: string;
    cashierName: string;
    receiptNumber: string;
    subtotal: number;
    tax: number;
    discount?: number;
    cartImage?: string; // Image of the cart/items scanned
}

export const ALL_TRANSACTIONS: TransactionReceiptInterface[] = [
    {
        id: 'TXN001',
        amount: 89.99,
        description: 'Groceries - Fresh produce, dairy products, and household essentials',
        merchant: 'QuickMart Store',
        date: 'Dec 15, 2024',
        time: '2:34 PM',
        status: 'completed',
        category: 'Groceries',
        receiptNumber: 'RCP-001-2024',
        cashierName: 'Sarah Johnson',
        paymentMethod: 'Credit Card',
        subtotal: 82.60,
        tax: 7.39,
        cartImage: 'https://images.unsplash.com/photo-1556909907-f603133201b2?w=800&h=600&fit=crop',
        customer: {
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+1 (555) 123-4567'
        },
        cartItems: [
            { id: 'ITM001', name: 'Organic Bananas', quantity: 3, unitPrice: 4.99, totalPrice: 14.97, barcode: '4011' },
            { id: 'ITM002', name: 'Whole Milk (1 Gallon)', quantity: 2, unitPrice: 3.49, totalPrice: 6.98, barcode: '011110384089' },
            { id: 'ITM003', name: 'Bread (Whole Wheat)', quantity: 1, unitPrice: 2.89, totalPrice: 2.89, barcode: '072250014504' },
            { id: 'ITM004', name: 'Greek Yogurt', quantity: 4, unitPrice: 1.25, totalPrice: 5.00, barcode: '036632022448' },
            { id: 'ITM005', name: 'Pasta Sauce', quantity: 2, unitPrice: 2.99, totalPrice: 5.98, barcode: '041303012390' }
        ]
    },
    {
        id: 'TXN002',
        amount: 45.67,
        description: 'Coffee, pastries and lunch at downtown location',
        merchant: 'QuickMart Store',
        date: 'Dec 14, 2024',
        time: '11:22 AM',
        status: 'completed',
        category: 'Food & Dining',
        receiptNumber: 'RCP-002-2024',
        cashierName: 'Mike Chen',
        paymentMethod: 'Cash',
        subtotal: 42.00,
        tax: 3.67,
        cartImage: 'https://images.unsplash.com/photo-1609501676725-7186f4dcceb8?w=800&h=600&fit=crop',
        cartItems: [
            { id: 'ITM006', name: 'Coffee (Large)', quantity: 2, unitPrice: 3.50, totalPrice: 7.00, barcode: 'COFFEE001' },
            { id: 'ITM007', name: 'Croissant', quantity: 3, unitPrice: 2.75, totalPrice: 8.25, barcode: 'PASTRY001' },
            { id: 'ITM008', name: 'Sandwich (Turkey)', quantity: 1, unitPrice: 8.99, totalPrice: 8.99, barcode: 'SAND001' },
            { id: 'ITM009', name: 'Energy Drink', quantity: 2, unitPrice: 2.49, totalPrice: 4.98, barcode: '012000161155' },
            { id: 'ITM010', name: 'Chips (BBQ)', quantity: 1, unitPrice: 3.29, totalPrice: 3.29, barcode: '028400064316' }
        ]
    },
    {
        id: 'TXN003',
        amount: 125.43,
        description: 'Weekly grocery shopping with household items',
        merchant: 'QuickMart Store',
        date: 'Dec 13, 2024',
        time: '4:18 PM',
        status: 'completed',
        category: 'Groceries',
        receiptNumber: 'RCP-003-2024',
        cashierName: 'Emma Rodriguez',
        paymentMethod: 'Debit Card',
        subtotal: 115.25,
        tax: 10.18,
        cartImage: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&h=600&fit=crop',
        customer: {
            name: 'Maria Garcia',
            phone: '+1 (555) 987-6543'
        },
        cartItems: [
            { id: 'ITM011', name: 'Chicken Breast (2 lbs)', quantity: 1, unitPrice: 12.99, totalPrice: 12.99, barcode: '024600012751' },
            { id: 'ITM012', name: 'Rice (5 lbs)', quantity: 1, unitPrice: 8.49, totalPrice: 8.49, barcode: '041797005006' },
            { id: 'ITM013', name: 'Cereal (Honey Nut)', quantity: 2, unitPrice: 4.99, totalPrice: 9.98, barcode: '016000275447' },
            { id: 'ITM014', name: 'Orange Juice (64 oz)', quantity: 1, unitPrice: 4.79, totalPrice: 4.79, barcode: '014800318081' },
            { id: 'ITM015', name: 'Laundry Detergent', quantity: 1, unitPrice: 11.99, totalPrice: 11.99, barcode: '037000019923' }
        ]
    },
    {
        id: 'TXN004',
        amount: 32.45,
        description: 'Quick convenience store purchase - snacks and beverages',
        merchant: 'QuickMart Store',
        date: 'Dec 13, 2024',
        time: '9:15 AM',
        status: 'completed',
        category: 'Convenience',
        receiptNumber: 'RCP-004-2024',
        cashierName: 'Alex Thompson',
        paymentMethod: 'Credit Card',
        subtotal: 29.95,
        tax: 2.50,
        cartImage: 'https://images.unsplash.com/photo-1566400024098-b8d4b4b6ce22?w=800&h=600&fit=crop',
        cartItems: [
            { id: 'ITM016', name: 'Coca-Cola (2L)', quantity: 1, unitPrice: 3.49, totalPrice: 3.49, barcode: '049000042566' },
            { id: 'ITM017', name: 'Potato Chips', quantity: 2, unitPrice: 4.99, totalPrice: 9.98, barcode: '028400010399' },
            { id: 'ITM018', name: 'Chocolate Bar', quantity: 3, unitPrice: 2.25, totalPrice: 6.75, barcode: '034000002139' },
            { id: 'ITM019', name: 'Gum Pack', quantity: 1, unitPrice: 1.99, totalPrice: 1.99, barcode: '022000120427' },
            { id: 'ITM020', name: 'Water Bottle', quantity: 4, unitPrice: 1.75, totalPrice: 7.00, barcode: '073141331234' }
        ]
    }
];
