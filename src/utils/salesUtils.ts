import { StockItem } from '../mock/stocks';
import { CartItem, TransactionReceiptInterface } from '../mock/transactions';

// Interface for parsed sale items
export interface ParsedSaleItem {
    quantity: number;
    productName: string;
    unitPrice: number;
    originalText: string;
}

// Interface for validated sale items
export interface ValidatedSaleItem extends ParsedSaleItem {
    stockItem: StockItem | null;
    isValid: boolean;
    errorMessage?: string;
    totalPrice: number;
}

// Interface for sales receipt
export interface SalesReceipt {
    items: ValidatedSaleItem[];
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
    isValid: boolean;
    errors: string[];
}

// Tax rate (configurable)
const TAX_RATE = 0.15; // 15% tax

/**
 * Parse a free-form sales text into individual sale items
 * Supports formats like:
 * - "3 maputi @0.50, 1 coke @0.75, 2 soap @1.20"
 * - "2x bread @ $2.50, 1 milk @3.00"
 * - "5 apples at 0.30 each"
 */
export function parseSalesText(salesText: string): ParsedSaleItem[] {
    const items: ParsedSaleItem[] = [];

    // Split by commas or newlines
    const itemTexts = salesText.split(/[,\n]/).map(item => item.trim()).filter(item => item.length > 0);

    for (const itemText of itemTexts) {
        const parsed = parseIndividualItem(itemText);
        if (parsed) {
            items.push(parsed);
        }
    }

    return items;
}

/**
 * Parse an individual item text
 * Supports various formats:
 * - "3 maputi @0.50"
 * - "2x bread @ $2.50"
 * - "1 coke at 0.75"
 * - "5 apples 0.30 each"
 */
function parseIndividualItem(itemText: string): ParsedSaleItem | null {
    // Remove extra spaces and normalize
    const normalized = itemText.replace(/\s+/g, ' ').trim();

    // Pattern 1: "quantity productName @price" or "quantity productName @ $price"
    let match = normalized.match(/^(\d+(?:\.\d+)?)\s*x?\s+(.+?)\s*@\s*\$?(\d+(?:\.\d+)?)$/i);
    if (match) {
        return {
            quantity: parseFloat(match[1]),
            productName: match[2].trim(),
            unitPrice: parseFloat(match[3]),
            originalText: itemText
        };
    }

    // Pattern 2: "quantity productName at price" or "quantity productName at $price"
    match = normalized.match(/^(\d+(?:\.\d+)?)\s*x?\s+(.+?)\s+at\s+\$?(\d+(?:\.\d+)?)(?:\s+each)?$/i);
    if (match) {
        return {
            quantity: parseFloat(match[1]),
            productName: match[2].trim(),
            unitPrice: parseFloat(match[3]),
            originalText: itemText
        };
    }

    // Pattern 3: "quantity productName price" (assuming the last number is price)
    match = normalized.match(/^(\d+(?:\.\d+)?)\s*x?\s+(.+?)\s+\$?(\d+(?:\.\d+)?)$/);
    if (match) {
        return {
            quantity: parseFloat(match[1]),
            productName: match[2].trim(),
            unitPrice: parseFloat(match[3]),
            originalText: itemText
        };
    }

    return null;
}

/**
 * Validate parsed sale items against inventory
 */
export function validateSaleItems(
    parsedItems: ParsedSaleItem[],
    inventory: StockItem[]
): ValidatedSaleItem[] {
    return parsedItems.map(item => {
        // Find matching stock item (case-insensitive, fuzzy matching)
        const stockItem = findMatchingStockItem(item.productName, inventory);

        const validatedItem: ValidatedSaleItem = {
            ...item,
            stockItem,
            totalPrice: item.quantity * item.unitPrice,
            isValid: false,
            errorMessage: undefined
        };

        if (!stockItem) {
            validatedItem.errorMessage = `Product "${item.productName}" not found in inventory`;
            return validatedItem;
        }

        // Check if we have enough stock
        if (stockItem.quantity < item.quantity) {
            validatedItem.errorMessage = `Insufficient stock for "${item.productName}" (available: ${stockItem.quantity}, requested: ${item.quantity})`;
            return validatedItem;
        }

        // Optionally validate price (warn if different from stock price)
        const priceDifference = Math.abs(item.unitPrice - stockItem.unitPrice);
        const priceThreshold = stockItem.unitPrice * 0.1; // 10% tolerance

        if (priceDifference > priceThreshold) {
            validatedItem.errorMessage = `Price mismatch for "${item.productName}" (inventory: $${stockItem.unitPrice.toFixed(2)}, entered: $${item.unitPrice.toFixed(2)})`;
            return validatedItem;
        }

        validatedItem.isValid = true;
        return validatedItem;
    });
}

/**
 * Find matching stock item using fuzzy matching
 */
function findMatchingStockItem(productName: string, inventory: StockItem[]): StockItem | null {
    const searchName = productName.toLowerCase().trim();

    // First try exact match
    let match = inventory.find(item =>
        item.name.toLowerCase() === searchName
    );
    if (match) return match;

    // Try partial match (product name contains search term or vice versa)
    match = inventory.find(item =>
        item.name.toLowerCase().includes(searchName) ||
        searchName.includes(item.name.toLowerCase())
    );
    if (match) return match;

    // Try brand + name combination
    match = inventory.find(item => {
        const fullName = `${item.brand} ${item.name}`.toLowerCase();
        return fullName.includes(searchName) || searchName.includes(fullName);
    });
    if (match) return match;

    // Try common aliases/abbreviations
    const aliases: Record<string, string[]> = {
        'coke': ['coca-cola', 'coca cola'],
        'maputi': ['maputi', 'popcorn'],
        'soap': ['soap', 'bar soap', 'washing soap']
    };

    for (const [alias, variations] of Object.entries(aliases)) {
        if (searchName.includes(alias)) {
            match = inventory.find(item =>
                variations.some(variation =>
                    item.name.toLowerCase().includes(variation)
                )
            );
            if (match) return match;
        }
    }

    return null;
}

/**
 * Generate sales receipt from validated items
 */
export function generateSalesReceipt(validatedItems: ValidatedSaleItem[]): SalesReceipt {
    const validItems = validatedItems.filter(item => item.isValid);
    const invalidItems = validatedItems.filter(item => !item.isValid);

    const subtotal = validItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const errors = invalidItems.map(item => item.errorMessage || 'Unknown error').filter(Boolean);

    return {
        items: validatedItems,
        subtotal,
        tax,
        taxRate: TAX_RATE,
        total,
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Format receipt as text for display in chat
 */
export function formatReceiptText(receipt: SalesReceipt): string {
    if (!receipt.isValid) {
        let errorText = "❌ **Transaction Failed**\n\n";
        errorText += "**Errors:**\n";
        receipt.errors.forEach(error => {
            errorText += `• ${error}\n`;
        });

        // Show valid items if any
        const validItems = receipt.items.filter(item => item.isValid);
        if (validItems.length > 0) {
            errorText += "\n**Valid items found:**\n";
            validItems.forEach(item => {
                errorText += `• ${item.quantity}x ${item.productName} @ $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}\n`;
            });
        }

        return errorText;
    }

    let receiptText = "🧾 **Sales Receipt**\n\n";
    receiptText += "**Items:**\n";

    const validItems = receipt.items.filter(item => item.isValid);
    validItems.forEach(item => {
        receiptText += `• ${item.quantity}x ${item.productName} @ $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}\n`;
    });

    receiptText += "\n";
    receiptText += `**Subtotal:** $${receipt.subtotal.toFixed(2)}\n`;
    receiptText += `**Tax (${(receipt.taxRate * 100).toFixed(0)}%):** $${receipt.tax.toFixed(2)}\n`;
    receiptText += `**Total:** $${receipt.total.toFixed(2)}\n`;

    return receiptText;
}

/**
 * Check if text looks like a sales entry
 */
export function isSalesText(text: string): boolean {
    const salesPatterns = [
        /\d+\s*x?\s+\w+\s*@\s*\$?\d+/i,  // "3 items @0.50"
        /\d+\s+\w+\s+at\s+\$?\d+/i,      // "2 bread at 2.50"
        /\d+\s+\w+\s+\$?\d+(?:\.\d+)?$/i // "1 milk 3.00"
    ];

    return salesPatterns.some(pattern => pattern.test(text.trim()));
}

/**
 * Create transaction record from sales receipt
 */
export function createTransactionFromReceipt(
    receipt: SalesReceipt,
    cashierName: string = "System User"
): TransactionReceiptInterface {
    const validItems = receipt.items.filter(item => item.isValid);

    const cartItems: CartItem[] = validItems.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        barcode: item.stockItem?.barcode
    }));

    const transactionId = `TXN_${Date.now()}`;
    const currentDate = new Date();

    return {
        id: transactionId,
        amount: receipt.total,
        description: `Sale of ${validItems.length} item types`,
        merchant: "Store POS",
        date: currentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }),
        time: currentDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }),
        status: 'completed',
        category: 'Sales',
        cartItems,
        paymentMethod: 'Cash',
        cashierName,
        receiptNumber: `RCP-${transactionId}`,
        subtotal: receipt.subtotal,
        tax: receipt.tax
    };
}
