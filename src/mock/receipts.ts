import { ReceiptComponentInterface } from "../components/Receipt";

export const RECENT_RECEIPTS: ReceiptComponentInterface[] = [
    {
      invoice: 'INV001',
      amount: 250.75,
      date: 'Apr 21, 2024',
      status: 'Paid',
    },
    {
      invoice: 'INV002',
      amount: 120.00,
      date: 'Apr 22, 2024',
      status: 'Unpaid',
    },
    {
      invoice: 'INV003',
      amount: 89.99,
      date: 'Apr 23, 2024',
      status: 'Paid',
    },
    {
      invoice: 'INV004',
      amount: 300.50,
      date: 'Apr 24, 2024',
      status: 'Unpaid',
    },
    // {
    //   invoice: 'INV005',
    //   amount: 450.00,
    //   date: 'Apr 25, 2024',
    //   status: 'Paid',
    // },
    // {
    //   invoice: 'INV006',
    //   amount: 75.25,
    //   date: 'Apr 26, 2024',
    //   status: 'Unpaid',
    // },
    // {
    //   invoice: 'INV007',
    //   amount: 199.99,
    //   date: 'Apr 27, 2024',
    //   status: 'Paid',
    // },
];