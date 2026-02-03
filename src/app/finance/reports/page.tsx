'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Printer,
  ChevronLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, subMonths } from 'date-fns';

type ReportType = 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'trial-balance';

interface ReportLineItem {
  label: string;
  amount: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: number;
}

export default function FinancialReports() {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<ReportType>('profit-loss');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: new Date(),
  });

  const reportTypes = [
    { id: 'profit-loss' as ReportType, label: 'Profit & Loss (P&L)', icon: TrendingUp },
    { id: 'balance-sheet' as ReportType, label: 'Balance Sheet', icon: FileText },
    { id: 'cash-flow' as ReportType, label: 'Cash Flow Statement', icon: TrendingDown },
    { id: 'trial-balance' as ReportType, label: 'Trial Balance', icon: FileText },
  ];

  const formatCurrency = (amount: number) => {
    return `₱${Math.abs(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Mock P&L data
  const profitLossData: ReportLineItem[] = [
    { label: 'REVENUE', amount: 0, isSubtotal: true },
    { label: 'Ride Revenue - 2W', amount: 542000, indent: 1 },
    { label: 'Ride Revenue - 4W Car', amount: 698000, indent: 1 },
    { label: 'Ride Revenue - 4W SUV', amount: 421000, indent: 1 },
    { label: 'Ride Revenue - Taxi', amount: 186000, indent: 1 },
    { label: 'Total Revenue', amount: 1847000, isSubtotal: true },
    { label: '', amount: 0 },
    { label: 'COST OF SERVICES', amount: 0, isSubtotal: true },
    { label: 'Driver Payouts', amount: -924500, indent: 1 },
    { label: 'Fuel Subsidies', amount: -112000, indent: 1 },
    { label: 'Vehicle Maintenance', amount: -89400, indent: 1 },
    { label: 'Insurance', amount: -45000, indent: 1 },
    { label: 'Total Cost of Services', amount: -1170900, isSubtotal: true },
    { label: '', amount: 0 },
    { label: 'GROSS PROFIT', amount: 676100, isSubtotal: true },
    { label: '', amount: 0 },
    { label: 'OPERATING EXPENSES', amount: 0, isSubtotal: true },
    { label: 'Salaries & Wages', amount: -245000, indent: 1 },
    { label: 'Office Rent', amount: -45000, indent: 1 },
    { label: 'Utilities', amount: -12000, indent: 1 },
    { label: 'Marketing', amount: -58000, indent: 1 },
    { label: 'Technology & Software', amount: -32000, indent: 1 },
    { label: 'Professional Fees', amount: -18000, indent: 1 },
    { label: 'Total Operating Expenses', amount: -410000, isSubtotal: true },
    { label: '', amount: 0 },
    { label: 'NET INCOME', amount: 266100, isTotal: true },
  ];

  // Mock Balance Sheet data
  const balanceSheetData: ReportLineItem[] = [
    { label: 'ASSETS', amount: 0, isSubtotal: true },
    { label: 'Current Assets', amount: 0, isSubtotal: true, indent: 1 },
    { label: 'Cash and Cash Equivalents', amount: 2847500, indent: 2 },
    { label: 'Accounts Receivable', amount: 485300, indent: 2 },
    { label: 'Prepaid Expenses', amount: 124000, indent: 2 },
    { label: 'Total Current Assets', amount: 3456800, isSubtotal: true, indent: 1 },
    { label: '', amount: 0 },
    { label: 'Fixed Assets', amount: 0, isSubtotal: true, indent: 1 },
    { label: 'Vehicles', amount: 4500000, indent: 2 },
    { label: 'Equipment', amount: 680000, indent: 2 },
    { label: 'Less: Accumulated Depreciation', amount: -1240000, indent: 2 },
    { label: 'Total Fixed Assets', amount: 3940000, isSubtotal: true, indent: 1 },
    { label: '', amount: 0 },
    { label: 'TOTAL ASSETS', amount: 7396800, isTotal: true },
    { label: '', amount: 0 },
    { label: 'LIABILITIES', amount: 0, isSubtotal: true },
    { label: 'Current Liabilities', amount: 0, isSubtotal: true, indent: 1 },
    { label: 'Accounts Payable', amount: 298400, indent: 2 },
    { label: 'Accrued Expenses', amount: 156000, indent: 2 },
    { label: 'Short-term Debt', amount: 500000, indent: 2 },
    { label: 'Total Current Liabilities', amount: 954400, isSubtotal: true, indent: 1 },
    { label: '', amount: 0 },
    { label: 'Long-term Liabilities', amount: 0, isSubtotal: true, indent: 1 },
    { label: 'Long-term Debt', amount: 2000000, indent: 2 },
    { label: 'Total Long-term Liabilities', amount: 2000000, isSubtotal: true, indent: 1 },
    { label: '', amount: 0 },
    { label: 'TOTAL LIABILITIES', amount: 2954400, isTotal: true },
    { label: '', amount: 0 },
    { label: 'EQUITY', amount: 0, isSubtotal: true },
    { label: 'Share Capital', amount: 3000000, indent: 1 },
    { label: 'Retained Earnings', amount: 1442400, indent: 1 },
    { label: 'TOTAL EQUITY', amount: 4442400, isTotal: true },
    { label: '', amount: 0 },
    { label: 'TOTAL LIABILITIES & EQUITY', amount: 7396800, isTotal: true },
  ];

  // Mock Cash Flow data
  const cashFlowData: ReportLineItem[] = [
    { label: 'OPERATING ACTIVITIES', amount: 0, isSubtotal: true },
    { label: 'Net Income', amount: 266100, indent: 1 },
    { label: 'Adjustments:', amount: 0, indent: 1 },
    { label: 'Depreciation', amount: 124000, indent: 2 },
    { label: 'Changes in Accounts Receivable', amount: -58000, indent: 2 },
    { label: 'Changes in Accounts Payable', amount: 42000, indent: 2 },
    { label: 'Net Cash from Operating Activities', amount: 374100, isSubtotal: true },
    { label: '', amount: 0 },
    { label: 'INVESTING ACTIVITIES', amount: 0, isSubtotal: true },
    { label: 'Purchase of Vehicles', amount: -450000, indent: 1 },
    { label: 'Purchase of Equipment', amount: -120000, indent: 1 },
    { label: 'Net Cash from Investing Activities', amount: -570000, isSubtotal: true },
    { label: '', amount: 0 },
    { label: 'FINANCING ACTIVITIES', amount: 0, isSubtotal: true },
    { label: 'Proceeds from Debt', amount: 500000, indent: 1 },
    { label: 'Debt Repayment', amount: -150000, indent: 1 },
    { label: 'Dividends Paid', amount: -50000, indent: 1 },
    { label: 'Net Cash from Financing Activities', amount: 300000, isSubtotal: true },
    { label: '', amount: 0 },
    { label: 'NET INCREASE IN CASH', amount: 104100, isTotal: true },
    { label: 'Cash - Beginning of Period', amount: 2743400, indent: 1 },
    { label: 'Cash - End of Period', amount: 2847500, isTotal: true },
  ];

  // Mock Trial Balance data
  const trialBalanceData: ReportLineItem[] = [
    { label: 'Cash and Cash Equivalents', amount: 2847500 },
    { label: 'Accounts Receivable', amount: 485300 },
    { label: 'Prepaid Expenses', amount: 124000 },
    { label: 'Vehicles', amount: 4500000 },
    { label: 'Equipment', amount: 680000 },
    { label: 'Accumulated Depreciation', amount: -1240000 },
    { label: 'Accounts Payable', amount: -298400 },
    { label: 'Accrued Expenses', amount: -156000 },
    { label: 'Short-term Debt', amount: -500000 },
    { label: 'Long-term Debt', amount: -2000000 },
    { label: 'Share Capital', amount: -3000000 },
    { label: 'Retained Earnings', amount: -1442400 },
    { label: '', amount: 0 },
    { label: 'TOTALS', amount: 0, isTotal: true },
  ];

  const getCurrentReportData = () => {
    switch (selectedReport) {
      case 'profit-loss':
        return profitLossData;
      case 'balance-sheet':
        return balanceSheetData;
      case 'cash-flow':
        return cashFlowData;
      case 'trial-balance':
        return trialBalanceData;
      default:
        return profitLossData;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    console.log('Exporting report to PDF...');
    // TODO: Implement PDF export
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Financial Reports</h1>
          <p className="text-neutral-600 mt-1">
            {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
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
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedReport === report.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <report.icon className="h-4 w-4" />
                {report.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Mode Toggle */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={comparisonMode}
            onChange={(e) => setComparisonMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">Enable comparison with previous period</span>
        </label>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader className="border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <CardTitle>
              {reportTypes.find((r) => r.id === selectedReport)?.label}
            </CardTitle>
            <div className="text-sm text-neutral-600">
              {format(dateRange.start, 'MMMM dd, yyyy')} - {format(dateRange.end, 'MMMM dd, yyyy')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-1">
            {getCurrentReportData().map((item, index) => {
              if (item.label === '') {
                return <div key={index} className="h-4" />;
              }

              const indentClass = item.indent
                ? `pl-${item.indent * 6}`
                : '';

              if (item.isTotal) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-t-2 border-b-2 border-neutral-900 font-bold text-neutral-900"
                  >
                    <span className={`text-base ${indentClass}`}>{item.label}</span>
                    <span
                      className={`text-base ${
                        item.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {item.amount === 0 ? '-' : formatCurrency(item.amount)}
                    </span>
                  </div>
                );
              }

              if (item.isSubtotal) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-t border-neutral-300 font-semibold text-neutral-900"
                  >
                    <span className={`${indentClass}`}>{item.label}</span>
                    {item.amount !== 0 && (
                      <span
                        className={item.amount < 0 ? 'text-red-600' : 'text-green-600'}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 text-neutral-700"
                >
                  <span className={`${indentClass}`}>{item.label}</span>
                  <span className={item.amount < 0 ? 'text-red-600' : ''}>
                    {item.amount === 0 ? '-' : formatCurrency(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
