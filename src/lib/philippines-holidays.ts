// Philippines Holiday Calendar for LTFRB Compliance Date Calculations
// Integrates official Philippines holidays and observances for business day calculations

interface Holiday {
  name: string;
  date: Date;
  type: 'regular' | 'special_non_working' | 'proclamation';
  observance?: 'moved' | 'fixed';
}

export class PhilippinesHolidayCalendar {
  private static fixedHolidays: Omit<Holiday, 'date'>[] = [
    // Regular Holidays (Fixed Dates)
    { name: "New Year's Day", type: 'regular', observance: 'fixed' },
    { name: "Day of Valor (Araw ng Kagitingan)", type: 'regular', observance: 'fixed' }, // April 9
    { name: "Independence Day", type: 'regular', observance: 'fixed' }, // June 12
    { name: "National Heroes Day", type: 'regular' }, // Last Monday of August
    { name: "Bonifacio Day", type: 'regular', observance: 'fixed' }, // November 30
    { name: "Rizal Day", type: 'regular', observance: 'fixed' }, // December 30
    
    // Special Non-Working Holidays (Fixed Dates)
    { name: "Chinese New Year", type: 'special_non_working' }, // Variable date
    { name: "EDSA People Power Revolution Anniversary", type: 'special_non_working', observance: 'fixed' }, // February 25
    { name: "Ninoy Aquino Day", type: 'special_non_working', observance: 'fixed' }, // August 21
    { name: "All Saints' Day", type: 'special_non_working', observance: 'fixed' }, // November 1
    
    // Proclamation Holidays (Variable)
    { name: "Maundy Thursday", type: 'regular' }, // Holy Week
    { name: "Good Friday", type: 'regular' }, // Holy Week
    { name: "Black Saturday", type: 'special_non_working' }, // Holy Week
    { name: "Eid al-Fitr", type: 'regular' }, // Variable Islamic holiday
    { name: "Eid al-Adha", type: 'special_non_working' }, // Variable Islamic holiday
    { name: "Christmas Day", type: 'regular', observance: 'fixed' }, // December 25
  ];

  // Special regional holidays that may affect LTFRB operations
  private static regionalHolidays: Omit<Holiday, 'date'>[] = [
    { name: "Magellan's Cross Day (Cebu)", type: 'special_non_working' },
    { name: "Kadayawan Festival (Davao)", type: 'special_non_working' },
    { name: "MassKara Festival (Bacolod)", type: 'special_non_working' },
    { name: "Ati-Atihan Festival (Aklan)", type: 'special_non_working' },
  ];

  /**
   * Get all holidays for a specific year
   */
  static getHolidaysForYear(year: number, includeRegional: boolean = false): Holiday[] {
    const holidays: Holiday[] = [];

    // Fixed date holidays
    holidays.push(
      { name: "New Year's Day", date: new Date(year, 0, 1), type: 'regular', observance: 'fixed' },
      { name: "EDSA People Power Revolution Anniversary", date: new Date(year, 1, 25), type: 'special_non_working', observance: 'fixed' },
      { name: "Day of Valor (Araw ng Kagitingan)", date: new Date(year, 3, 9), type: 'regular', observance: 'fixed' },
      { name: "Independence Day", date: new Date(year, 5, 12), type: 'regular', observance: 'fixed' },
      { name: "Ninoy Aquino Day", date: new Date(year, 7, 21), type: 'special_non_working', observance: 'fixed' },
      { name: "All Saints' Day", date: new Date(year, 10, 1), type: 'special_non_working', observance: 'fixed' },
      { name: "Bonifacio Day", date: new Date(year, 10, 30), type: 'regular', observance: 'fixed' },
      { name: "Rizal Day", date: new Date(year, 11, 30), type: 'regular', observance: 'fixed' },
      { name: "Christmas Day", date: new Date(year, 11, 25), type: 'regular', observance: 'fixed' }
    );

    // Calculated holidays
    const easter = this.calculateEaster(year);
    holidays.push(
      { name: "Maundy Thursday", date: new Date(easter.getTime() - 3 * 24 * 60 * 60 * 1000), type: 'regular' },
      { name: "Good Friday", date: new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000), type: 'regular' },
      { name: "Black Saturday", date: new Date(easter.getTime() - 1 * 24 * 60 * 60 * 1000), type: 'special_non_working' }
    );

    // National Heroes Day (Last Monday of August)
    const nationalHeroesDay = this.getLastMondayOfMonth(year, 7); // August is month 7 (0-indexed)
    holidays.push({ name: "National Heroes Day", date: nationalHeroesDay, type: 'regular' });

    // Chinese New Year (approximation - in practice this would be looked up from external source)
    const chineseNewYear = this.approximateChineseNewYear(year);
    holidays.push({ name: "Chinese New Year", date: chineseNewYear, type: 'special_non_working' });

    // Islamic holidays (approximation - in practice these would be based on lunar calendar)
    const eidAlFitr = this.approximateEidAlFitr(year);
    const eidAlAdha = this.approximateEidAlAdha(year);
    holidays.push(
      { name: "Eid al-Fitr", date: eidAlFitr, type: 'regular' },
      { name: "Eid al-Adha", date: eidAlAdha, type: 'special_non_working' }
    );

    // Sort holidays by date
    holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

    return holidays;
  }

  /**
   * Check if a given date is a holiday
   */
  static isHoliday(date: Date, includeSpecialNonWorking: boolean = true): boolean {
    const year = date.getFullYear();
    const holidays = this.getHolidaysForYear(year);

    return holidays.some(holiday => {
      if (!includeSpecialNonWorking && holiday.type === 'special_non_working') {
        return false;
      }

      return this.isSameDate(holiday.date, date);
    });
  }

  /**
   * Check if a given date is a business day (not weekend or holiday)
   */
  static isBusinessDay(date: Date, includeSpecialNonWorking: boolean = true): boolean {
    // Check if it's a weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      return false;
    }

    // Check if it's a holiday
    return !this.isHoliday(date, includeSpecialNonWorking);
  }

  /**
   * Get the next business day from a given date
   */
  static getNextBusinessDay(fromDate: Date, includeSpecialNonWorking: boolean = true): Date {
    let nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);

    while (!this.isBusinessDay(nextDate, includeSpecialNonWorking)) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
  }

  /**
   * Get the previous business day from a given date
   */
  static getPreviousBusinessDay(fromDate: Date, includeSpecialNonWorking: boolean = true): Date {
    let prevDate = new Date(fromDate);
    prevDate.setDate(prevDate.getDate() - 1);

    while (!this.isBusinessDay(prevDate, includeSpecialNonWorking)) {
      prevDate.setDate(prevDate.getDate() - 1);
    }

    return prevDate;
  }

  /**
   * Add business days to a date (skipping weekends and holidays)
   */
  static addBusinessDays(fromDate: Date, businessDays: number, includeSpecialNonWorking: boolean = true): Date {
    let resultDate = new Date(fromDate);
    let remainingDays = businessDays;

    if (businessDays > 0) {
      while (remainingDays > 0) {
        resultDate.setDate(resultDate.getDate() + 1);
        if (this.isBusinessDay(resultDate, includeSpecialNonWorking)) {
          remainingDays--;
        }
      }
    } else if (businessDays < 0) {
      while (remainingDays < 0) {
        resultDate.setDate(resultDate.getDate() - 1);
        if (this.isBusinessDay(resultDate, includeSpecialNonWorking)) {
          remainingDays++;
        }
      }
    }

    return resultDate;
  }

  /**
   * Calculate the number of business days between two dates
   */
  static getBusinessDaysBetween(startDate: Date, endDate: Date, includeSpecialNonWorking: boolean = true): number {
    let businessDays = 0;
    let currentDate = new Date(startDate);
    
    // Ensure we're going forward
    if (endDate < startDate) {
      [startDate, endDate] = [endDate, startDate];
      currentDate = new Date(startDate);
    }

    while (currentDate < endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (this.isBusinessDay(currentDate, includeSpecialNonWorking)) {
        businessDays++;
      }
    }

    return businessDays;
  }

  /**
   * Get upcoming holidays within a date range
   */
  static getUpcomingHolidays(fromDate: Date, days: number = 30): Holiday[] {
    const endDate = new Date(fromDate.getTime() + days * 24 * 60 * 60 * 1000);
    const holidays = this.getHolidaysForYear(fromDate.getFullYear());

    // If the date range spans multiple years, include next year's holidays
    if (endDate.getFullYear() > fromDate.getFullYear()) {
      holidays.push(...this.getHolidaysForYear(endDate.getFullYear()));
    }

    return holidays.filter(holiday => 
      holiday.date >= fromDate && holiday.date <= endDate
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Utility methods for holiday calculations

  private static calculateEaster(year: number): Date {
    // Algorithm for calculating Easter Sunday (Western/Gregorian calendar)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month - 1, day);
  }

  private static getLastMondayOfMonth(year: number, month: number): Date {
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const lastDayOfWeek = lastDay.getDay();
    
    // Calculate how many days to subtract to get to Monday (1)
    const daysToSubtract = (lastDayOfWeek === 0) ? 6 : (lastDayOfWeek - 1);
    
    return new Date(year, month, lastDay.getDate() - daysToSubtract);
  }

  private static approximateChineseNewYear(year: number): Date {
    // Simplified approximation of Chinese New Year
    // In practice, this should use an accurate lunar calendar calculation
    const chineseNewYearDates: { [key: number]: [number, number] } = {
      2024: [1, 22], // January 22
      2025: [1, 29], // January 29  
      2026: [1, 17], // January 17
      2027: [2, 6],  // February 6
      2028: [1, 26], // January 26
      2029: [2, 13], // February 13
      2030: [2, 3],  // February 3
    };

    if (chineseNewYearDates[year]) {
      const [month, day] = chineseNewYearDates[year];
      return new Date(year, month - 1, day);
    }

    // Fallback approximation (Chinese New Year is typically late January to mid February)
    return new Date(year, 0, 25); // January 25 as default
  }

  private static approximateEidAlFitr(year: number): Date {
    // Simplified approximation of Eid al-Fitr
    // In practice, this should use accurate Islamic calendar calculations
    const eidAlFitrDates: { [key: number]: [number, number] } = {
      2024: [3, 10], // March 10
      2025: [2, 28], // February 28
      2026: [2, 17], // February 17  
      2027: [2, 6],  // February 6
      2028: [1, 26], // January 26
      2029: [1, 14], // January 14
      2030: [1, 4],  // January 4
    };

    if (eidAlFitrDates[year]) {
      const [month, day] = eidAlFitrDates[year];
      return new Date(year, month - 1, day);
    }

    // Fallback approximation (moves back ~11 days each year)
    const baseDate = new Date(2024, 2, 10); // March 10, 2024
    const yearsDiff = year - 2024;
    const daysDiff = yearsDiff * -11; // Moves back ~11 days per year
    
    const resultDate = new Date(baseDate);
    resultDate.setDate(resultDate.getDate() + daysDiff);
    return resultDate;
  }

  private static approximateEidAlAdha(year: number): Date {
    // Simplified approximation of Eid al-Adha (~70 days after Eid al-Fitr)
    const eidAlFitr = this.approximateEidAlFitr(year);
    const eidAlAdha = new Date(eidAlFitr);
    eidAlAdha.setDate(eidAlAdha.getDate() + 70);
    return eidAlAdha;
  }

  private static isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

/**
 * LTFRB-specific compliance date calculations
 */
export class LTFRBComplianceCalendar {
  /**
   * Calculate LTFRB renewal deadline considering Philippine holidays and business days
   */
  static calculateRenewalDeadline(
    expiryDate: Date, 
    renewalDaysRequired: number = 30,
    includeSpecialNonWorking: boolean = true
  ): Date {
    // LTFRB renewals must be submitted at least 30 days before expiry
    // But the submission must be on a business day
    const baseDeadline = new Date(expiryDate);
    baseDeadline.setDate(baseDeadline.getDate() - renewalDaysRequired);

    // If the calculated deadline falls on a non-business day, move to previous business day
    if (!PhilippinesHolidayCalendar.isBusinessDay(baseDeadline, includeSpecialNonWorking)) {
      return PhilippinesHolidayCalendar.getPreviousBusinessDay(baseDeadline, includeSpecialNonWorking);
    }

    return baseDeadline;
  }

  /**
   * Calculate the next inspection due date considering business days
   */
  static calculateNextInspectionDate(
    lastInspectionDate: Date,
    inspectionIntervalMonths: number = 6,
    includeSpecialNonWorking: boolean = true
  ): Date {
    const nextInspectionDate = new Date(lastInspectionDate);
    nextInspectionDate.setMonth(nextInspectionDate.getMonth() + inspectionIntervalMonths);

    // If the inspection date falls on a non-business day, move to next business day
    if (!PhilippinesHolidayCalendar.isBusinessDay(nextInspectionDate, includeSpecialNonWorking)) {
      return PhilippinesHolidayCalendar.getNextBusinessDay(nextInspectionDate, includeSpecialNonWorking);
    }

    return nextInspectionDate;
  }

  /**
   * Calculate franchise renewal grace period end date
   */
  static calculateGracePeriodEnd(
    expiryDate: Date,
    gracePeriodDays: number = 90,
    includeSpecialNonWorking: boolean = true
  ): Date {
    return PhilippinesHolidayCalendar.addBusinessDays(expiryDate, gracePeriodDays, includeSpecialNonWorking);
  }

  /**
   * Check if current date is within LTFRB business hours and days
   */
  static isLTFRBBusinessHours(date: Date = new Date()): boolean {
    // LTFRB typically operates Monday-Friday, 8 AM - 5 PM
    if (!PhilippinesHolidayCalendar.isBusinessDay(date)) {
      return false;
    }

    const hours = date.getHours();
    return hours >= 8 && hours < 17; // 8 AM to 5 PM
  }

  /**
   * Get working days remaining until a deadline
   */
  static getWorkingDaysUntilDeadline(deadline: Date, includeSpecialNonWorking: boolean = true): number {
    const today = new Date();
    return PhilippinesHolidayCalendar.getBusinessDaysBetween(today, deadline, includeSpecialNonWorking);
  }

  /**
   * Get upcoming holidays that might affect LTFRB operations
   */
  static getUpcomingLTFRBOperationalHolidays(days: number = 90): Holiday[] {
    const today = new Date();
    const upcomingHolidays = PhilippinesHolidayCalendar.getUpcomingHolidays(today, days);
    
    // Filter for holidays that significantly impact government operations
    return upcomingHolidays.filter(holiday => 
      holiday.type === 'regular' || 
      ['Holy Week', 'Christmas', 'New Year'].some(period => holiday.name.includes(period))
    );
  }
}

export default PhilippinesHolidayCalendar;