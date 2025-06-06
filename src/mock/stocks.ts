export interface StockItem {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    brand: string;
    size: string;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    lastRestocked: string;
    supplier: string;
    barcode?: string;
    image?: string
}

export const ALL_STOCK_ITEMS: StockItem[] = [
    {
        id: 'STK001',
        name: 'Coca-Cola Classic',
        description: '2 Liter Plastic Bottle',
        category: 'Beverages',
        subcategory: 'Soft Drinks',
        unitPrice: 3.49,
        quantity: 48,
        unit: 'bottles',
        brand: 'Coca-Cola',
        size: '2L',
        status: 'in-stock',
        lastRestocked: 'Dec 14, 2024',
        supplier: 'Coca-Cola Distributors',
        barcode: '049000042566',
        image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop'
    },
    {
        id: 'STK002',
        name: 'Coca-Cola Classic',
        description: '500ml Plastic Bottle',
        category: 'Beverages',
        subcategory: 'Soft Drinks',
        unitPrice: 1.99,
        quantity: 12,
        unit: 'bottles',
        brand: 'Coca-Cola',
        size: '500ml',
        status: 'low-stock',
        lastRestocked: 'Dec 12, 2024',
        supplier: 'Coca-Cola Distributors',
        barcode: '049000042573',
        image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop'
    },
    {
        id: 'STK003',
        name: 'Coca-Cola Classic',
        description: '330ml Aluminum Can - 12 Pack',
        category: 'Beverages',
        subcategory: 'Soft Drinks',
        unitPrice: 8.99,
        quantity: 24,
        unit: 'packs',
        brand: 'Coca-Cola',
        size: '330ml x12',
        status: 'in-stock',
        lastRestocked: 'Dec 15, 2024',
        supplier: 'Coca-Cola Distributors',
        barcode: '049000042580'
    },
    {
        id: 'STK004',
        name: 'iPhone 15 Pro',
        description: 'Smartphone with Pro Camera System',
        category: 'Electronics',
        subcategory: 'Smartphones',
        unitPrice: 999.00,
        quantity: 15,
        unit: 'pieces',
        brand: 'Apple',
        size: '128GB',
        status: 'in-stock',
        lastRestocked: 'Dec 10, 2024',
        supplier: 'Apple Inc.',
        barcode: '194253411567',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop'
    },
    {
        id: 'STK005',
        name: 'iPhone 15 Pro',
        description: 'Smartphone with Pro Camera System',
        category: 'Electronics',
        subcategory: 'Smartphones',
        unitPrice: 1199.00,
        quantity: 8,
        unit: 'pieces',
        brand: 'Apple',
        size: '256GB',
        status: 'in-stock',
        lastRestocked: 'Dec 10, 2024',
        supplier: 'Apple Inc.',
        barcode: '194253411574'
    },
    {
        id: 'STK006',
        name: 'Organic Bananas',
        description: 'Fresh Organic Yellow Bananas',
        category: 'Groceries',
        subcategory: 'Fresh Produce',
        unitPrice: 2.49,
        quantity: 0,
        unit: 'kg',
        brand: 'Fresh Farm',
        size: 'Per kg',
        status: 'out-of-stock',
        lastRestocked: 'Dec 08, 2024',
        supplier: 'Local Organic Farms',
        barcode: '123456789012',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop'
    },
    {
        id: 'STK007',
        name: 'Samsung Galaxy S24',
        description: 'Android Smartphone with AI Features',
        category: 'Electronics',
        subcategory: 'Smartphones',
        unitPrice: 849.00,
        quantity: 22,
        unit: 'pieces',
        brand: 'Samsung',
        size: '128GB',
        status: 'in-stock',
        lastRestocked: 'Dec 13, 2024',
        supplier: 'Samsung Electronics',
        barcode: '887276753478'
    },
    {
        id: 'STK008',
        name: 'Pepsi Cola',
        description: '2 Liter Plastic Bottle',
        category: 'Beverages',
        subcategory: 'Soft Drinks',
        unitPrice: 3.29,
        quantity: 36,
        unit: 'bottles',
        brand: 'Pepsi',
        size: '2L',
        status: 'in-stock',
        lastRestocked: 'Dec 14, 2024',
        supplier: 'PepsiCo Distributors',
        barcode: '012000001413',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop'
    },
    {
        id: 'STK009',
        name: 'Whole Milk',
        description: 'Fresh Dairy Whole Milk',
        category: 'Groceries',
        subcategory: 'Dairy Products',
        unitPrice: 4.99,
        quantity: 18,
        unit: 'cartons',
        brand: 'Farm Fresh',
        size: '1 Gallon',
        status: 'in-stock',
        lastRestocked: 'Dec 15, 2024',
        supplier: 'Dairy Cooperative',
        barcode: '070038320005',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop'
    },
    {
        id: 'STK010',
        name: 'MacBook Air M3',
        description: 'Laptop with Apple M3 Chip',
        category: 'Electronics',
        subcategory: 'Laptops',
        unitPrice: 1299.00,
        quantity: 5,
        unit: 'pieces',
        brand: 'Apple',
        size: '13-inch',
        status: 'low-stock',
        lastRestocked: 'Dec 05, 2024',
        supplier: 'Apple Inc.',
        barcode: '194253395263',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop'
    },
    {
        id: 'STK011',
        name: 'Bread - Whole Wheat',
        description: 'Artisan Whole Wheat Sandwich Bread',
        category: 'Groceries',
        subcategory: 'Bakery',
        unitPrice: 3.99,
        quantity: 25,
        unit: 'loaves',
        brand: 'Baker\'s Choice',
        size: '24oz',
        status: 'in-stock',
        lastRestocked: 'Dec 15, 2024',
        supplier: 'Local Bakery Co.',
        barcode: '078742110899',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop'
    },
    {
        id: 'STK012',
        name: 'Wireless Headphones',
        description: 'Bluetooth Over-Ear Headphones',
        category: 'Electronics',
        subcategory: 'Audio',
        unitPrice: 199.99,
        quantity: 14,
        unit: 'pieces',
        brand: 'Sony',
        size: 'Standard',
        status: 'in-stock',
        lastRestocked: 'Dec 11, 2024',
        supplier: 'Sony Electronics',
        barcode: '027242920264',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop'
    }
];
