'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';

interface LedgerEntry {
  id: string;
  date: string;
  accountCode: string;
  accountName: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function GeneralLedger() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Mock ledger data
  const ledgerEntries: LedgerEntry[] = Array.from({ length: 100 }, (_, i) => {
    const accounts = [
      { code: '1000', name: 'Cash and Cash Equivalents' },
      { code: '1200', name: 'Accounts Receivable' },
      { code: '2000', name: 'Accounts Payable' },
      { code: '4000', name: 'Revenue' },
      { code: '5000', name: 'Operating Expenses' },
      { code: '6000', name: 'Driver Payouts' },
    ];
    const account = accounts[i % accounts.length];
    const isDebit = i % 3 !== 0;
    const amount = Math.floor(Math.random() * 100000) + 10000;

    return {
      id: `LED-${String(i + 1).padStart(5, '0')}`,
      date: subDays(new Date(), Math.floor(i / 5)).toISOString(),
      accountCode: account.code,
      accountName: account.name,
      description: `Transaction ${i + 1} - ${account.name}`,
      reference: `REF-2024-${String(i + 1).padStart(4, '0')}`,
      debit: isDebit ? amount : 0,
      credit: !isDebit ? amount : 0,
      balance: 0, // Would be calculated based on previous entries
    };
  });

  // Filter entries
  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.accountName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAccount =
      selectedAccount === 'all' || entry.accountCode === selectedAccount;

    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'debit' && entry.debit > 0) ||
      (selectedType === 'credit' && entry.credit > 0);

    return matchesSearch && matchesAccount && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  // Calculate totals
  const totals = filteredEntries.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
    }),
    { debit: 0, credit: 0 }
  );

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const handleExport = () => {
    console.log('Exporting ledger to Excel...');
    // TODO: Implement Excel export
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">General Ledger</h1>
          <p className="text-neutral-600 mt-1">
            Double-entry bookkeeping and transaction history
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/finance')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search description or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Account Filter */}
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="1000">1000 - Cash and Cash Equivalents</option>
              <option value="1200">1200 - Accounts Receivable</option>
              <option value="2000">2000 - Accounts Payable</option>
              <option value="4000">4000 - Revenue</option>
              <option value="5000">5000 - Operating Expenses</option>
              <option value="6000">6000 - Driver Payouts</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Transactions</option>
              <option value="debit">Debit Only</option>
              <option value="credit">Credit Only</option>
            </select>

            {/* Date Range (placeholder) */}
            <input
              type="text"
              placeholder="Date Range"
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Account</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Reference</th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-700">Debit</th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-700">Credit</th>
                  <th className="text-center py-3 px-4 font-semibold text-neutral-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {currentEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 text-neutral-600">{formatDate(entry.date)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-neutral-900">{entry.accountCode}</p>
                        <p className="text-xs text-neutral-500">{entry.accountName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-900">{entry.description}</td>
                    <td className="py-3 px-4 text-neutral-600">{entry.reference}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                      {formatCurrency(entry.debit)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      {formatCurrency(entry.credit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('View details', entry.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50 border-t-2 border-neutral-300">
                <tr>
                  <td colSpan={4} className="py-3 px-4 font-bold text-neutral-900">
                    TOTALS ({filteredEntries.length} transactions)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-red-600">
                    {formatCurrency(totals.debit)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">
                    {formatCurrency(totals.credit)}
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
            <div className="text-sm text-neutral-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredEntries.length)} of{' '}
              {filteredEntries.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-neutral-700 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
