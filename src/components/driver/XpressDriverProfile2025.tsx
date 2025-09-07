import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Shield, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Car,
  Navigation,
  Battery,
  Zap,
  Award,
  Users,
  MessageSquare,
  Send,
  Plus,
  BarChart3,
  Target,
  Smartphone,
  Globe,
  Eye,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Download,
  Upload,
  Wrench,
  Fuel,
  AlertCircle,
  Calendar as CalendarIcon,
  MapPin as LocationIcon,
  Clock as TimeIcon,
  CreditCard,
  ShoppingCart,
  Package,
  TrendingUp as TrendingUpIcon,
  ArrowUpRight,
  ArrowDownRight,
  Route,
  Timer,
  MapIcon,
  Filter,
  Search
} from 'lucide-react';

const XpressDriverProfile2025 = () => {
  const [selectedTab, setSelectedTab] = useState('insights');
  const [timeRange, setTimeRange] = useState('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('28 Dec 22 – 10 Jan 23');
  const [currentMonth, setCurrentMonth] = useState(new Date(2023, 0)); // January 2023
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(new Date(2022, 11, 28)); // 28 Dec 22
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(new Date(2023, 0, 10)); // 10 Jan 23
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalData, setNotificationModalData] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleModalTab, setVehicleModalTab] = useState('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Enhanced Vehicle data with ownership and OBD status
  const vehiclesData = [
    {
      id: 1,
      make: "Toyota",
      model: "Vios", 
      year: "2020",
      plate: "ABC 1234",
      status: "Active",
      type: "Primary",
      service: "Standard Taxi",
      registration: "Valid",
      insurance: "Expiring Soon",
      mileage: "45,670 km",
      fuelEfficiency: "12.5 km/L",
      engineNo: "3SZ-VE-987654",
      chassisNo: "NCP93-123456",
      bodyType: "Sedan",
      fuelType: "Gasoline",
      transmission: "Manual",
      engine: "1.5L 4-Cylinder",
      power: "106 HP",
      torque: "140 Nm",
      seating: "5 Passengers",
      aircon: true,
      maintenanceStatus: "Up to date",
      lastService: "Nov 15, 2023",
      nextServiceDue: "48,000 km",
      insuranceExpiry: "Jan 15, 2024",
      // New ownership and OBD fields
      ownership: "xpress", // 'xpress' | 'fleet' | 'operator' | 'driver'
      hasOBD: true,
      obdStatus: "connected", // 'connected' | 'disconnected' | 'none'
      ownerInfo: {
        name: "Xpress Transportation Corp.",
        contact: "operations@xpress.com.ph",
        type: "Company Fleet"
      },
      driverAccess: "primary", // 'primary' | 'secondary' | 'backup'
      serviceTypes: ["TNVS", "Premium"],
      telematics: {
        lastPing: Date.now() - 300000, // 5 minutes ago
        odometer: 45670,
        engineStatus: "off",
        currentSpeed: 0,
        location: "Makati CBD",
        signalStrength: "strong"
      }
    },
    {
      id: 2,
      make: "Honda",
      model: "City",
      year: "2019", 
      plate: "XYZ 5678",
      status: "Backup",
      type: "Secondary",
      service: "Premium Taxi",
      registration: "Valid",
      insurance: "Valid",
      mileage: "32,450 km",
      fuelEfficiency: "14.2 km/L",
      engineNo: "L15A7-456789",
      chassisNo: "GM6-789012",
      bodyType: "Sedan",
      fuelType: "Gasoline",
      transmission: "CVT",
      engine: "1.5L 4-Cylinder",
      power: "121 HP",
      torque: "145 Nm",
      seating: "5 Passengers",
      aircon: true,
      maintenanceStatus: "Due soon",
      lastService: "Oct 8, 2023",
      nextServiceDue: "35,000 km",
      insuranceExpiry: "Mar 20, 2024",
      // New ownership and OBD fields
      ownership: "operator", // operator-owned vehicle
      hasOBD: false,
      obdStatus: "none",
      ownerInfo: {
        name: "Maria Santos",
        contact: "+639171234567",
        type: "Individual Operator"
      },
      driverAccess: "secondary",
      serviceTypes: ["TNVS"],
      telematics: null // No OBD, no telematics data
    }
  ];

  // Driver data based on the original structure
  const driverData = {
    name: "Alfred Catap",
    id: "25377",
    phone: "+639057428010",
    email: "ihordrtheiagency@yahoo.com",
    signupDate: "03 Sep 2025",
    lastActive: "17 hours ago",
    operator: "Xpress",
    service: "Ride - Sedan",
    gender: "Male",
    birthDate: "14 March 1990",
    address: "Block 07 lot 18 north grove sta Monica San Simon pampanga",
    wasReferred: false,
    referrer: "N/A",
    xpressGears: "N/A",
    device: "Y2246",
    status: "inactive", // based on 17 hours ago
    type: "operator-driver", // 'driver' | 'operator-driver'
    vehicleAccess: 2, // number of vehicles assigned
    qualifiedServices: ["TNVS", "MC Taxi"], // service types they can operate
    metrics: {
      today: {
        completionRate: 0,
        acceptanceRate: 0,
        cancellationRate: 0,
        trips: 0,
        earnings: 0,
        activeHours: 0,
        avgActiveHours: 0,
        totalActiveHours: 0
      },
      yesterday: {
        completionRate: 100,
        acceptanceRate: 100,
        cancellationRate: 0,
        trips: 2,
        earnings: 750,
        activeHours: 8,
        avgActiveHours: 8,
        totalActiveHours: 8
      },
      week: {
        completionRate: 95,
        acceptanceRate: 97,
        cancellationRate: 3,
        trips: 8,
        earnings: 3200,
        activeHours: 48,
        avgActiveHours: 6.9,
        totalActiveHours: 48
      },
      month: {
        completionRate: 92,
        acceptanceRate: 94,
        cancellationRate: 6,
        trips: 45,
        earnings: 18750,
        activeHours: 280,
        avgActiveHours: 6.2,
        totalActiveHours: 280
      },
      quarter: {
        completionRate: 89,
        acceptanceRate: 91,
        cancellationRate: 8,
        trips: 134,
        earnings: 56200,
        activeHours: 840,
        avgActiveHours: 6.1,
        totalActiveHours: 840
      },
      custom: {
        completionRate: 88,
        acceptanceRate: 92,
        cancellationRate: 7,
        trips: 24,
        earnings: 9800,
        activeHours: 156,
        avgActiveHours: 5.9,
        totalActiveHours: 156
      }
    },
    totalEarnings: 15750,
    rating: 4.8,
    performance: {
      excellentService: 95,
      expertNavigation: 88,
      neatAndTidy: 92,
      greatConversation: 78,
      awesomeMusic: 45,
      coolVehicle: 82,
      lateNightHero: 23,
      entertainingDriver: 67
    },
    vehicle: {
      make: "Toyota",
      model: "Vios",
      year: "2020",
      plate: "XYZ-789",
      color: "Silver"
    }
  };

  // Get metrics based on selected date range
  const getCurrentMetrics = () => {
    // For quick options, use the predefined data
    const validTimeRanges = ['today', 'yesterday', 'week', 'month', 'quarter'] as const;
    if (validTimeRanges.includes(timeRange as any)) {
      return driverData.metrics[timeRange as keyof typeof driverData.metrics];
    }
    
    // For custom date ranges, calculate metrics based on actual dates
    if (selectedStartDate && selectedEndDate) {
      const daysDiff = Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Generate realistic metrics based on date range length
      if (daysDiff === 1) {
        // Single day - similar to yesterday data
        return {
          completionRate: 100,
          acceptanceRate: 100,
          cancellationRate: 0,
          trips: Math.floor(Math.random() * 3) + 1, // 1-3 trips
          earnings: Math.floor((Math.random() * 500) + 300), // 300-800 earnings
          activeHours: Math.floor((Math.random() * 4) + 6), // 6-10 hours
          avgActiveHours: Math.floor((Math.random() * 4) + 6),
          totalActiveHours: Math.floor((Math.random() * 4) + 6)
        };
      } else if (daysDiff <= 7) {
        // Weekly range
        return {
          completionRate: Math.floor(Math.random() * 10) + 90, // 90-100%
          acceptanceRate: Math.floor(Math.random() * 8) + 92, // 92-100%
          cancellationRate: Math.floor(Math.random() * 5), // 0-5%
          trips: Math.floor((daysDiff * 1.5) + (Math.random() * 5)), // ~1.5 trips per day
          earnings: Math.floor((daysDiff * 400) + (Math.random() * 1000)), // ~400 per day
          activeHours: Math.floor(daysDiff * 6.5), // ~6.5 hours per day
          avgActiveHours: 6.5,
          totalActiveHours: Math.floor(daysDiff * 6.5)
        };
      } else if (daysDiff <= 31) {
        // Monthly range
        return {
          completionRate: Math.floor(Math.random() * 8) + 85, // 85-93%
          acceptanceRate: Math.floor(Math.random() * 10) + 88, // 88-98%
          cancellationRate: Math.floor(Math.random() * 8) + 2, // 2-10%
          trips: Math.floor((daysDiff * 1.2) + (Math.random() * 10)), // ~1.2 trips per day
          earnings: Math.floor((daysDiff * 350) + (Math.random() * 2000)), // ~350 per day
          activeHours: Math.floor(daysDiff * 6), // ~6 hours per day
          avgActiveHours: 6.0,
          totalActiveHours: Math.floor(daysDiff * 6)
        };
      } else {
        // Quarterly or longer range
        return {
          completionRate: Math.floor(Math.random() * 10) + 80, // 80-90%
          acceptanceRate: Math.floor(Math.random() * 12) + 85, // 85-97%
          cancellationRate: Math.floor(Math.random() * 10) + 5, // 5-15%
          trips: Math.floor((daysDiff * 1.0) + (Math.random() * 20)), // ~1 trip per day
          earnings: Math.floor((daysDiff * 300) + (Math.random() * 5000)), // ~300 per day
          activeHours: Math.floor(daysDiff * 5.5), // ~5.5 hours per day
          avgActiveHours: 5.5,
          totalActiveHours: Math.floor(daysDiff * 5.5)
        };
      }
    }
    
    // Default fallback
    return driverData.metrics.custom;
  };

  const currentMetrics = getCurrentMetrics();

  const tabs = [
    { id: 'insights', label: 'Insights', active: true },
    { id: 'legal', label: 'Legal Docs' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'commerce', label: 'Commerce' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'disciplinary', label: 'Disciplinary' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'chat', label: 'Chat' },
    { id: 'history', label: 'App History' },
    { id: 'training', label: 'Training' },
    { id: 'risk', label: 'Risk Profile' }
  ];

  const getStatusConfig = (status: string) => {
    const configs = {
      online: { color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
      busy: { color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
      inactive: { color: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-400' },
      offline: { color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' }
    };
    return configs[status as keyof typeof configs] || configs.inactive;
  };

  const MetricCard = ({ title, value, change, trend, color = 'blue' }: {
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down';
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600', 
      yellow: 'from-yellow-500 to-yellow-600',
      red: 'from-red-500 to-red-600',
      purple: 'from-purple-500 to-purple-600'
    };

    return (
      <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : null}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className="text-xs text-gray-500 mt-1">{change}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PerformanceBadge = ({ icon: Icon, label, percentage, color }: {
    icon: React.ElementType;
    label: string;
    percentage: number;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-200' },
      red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-200' }
    };

    const getColor = (percentage: number) => {
      if (percentage >= 80) return 'green';
      if (percentage >= 60) return 'yellow';
      if (percentage >= 40) return 'red';
      return 'gray';
    };

    const badgeColor = color || getColor(percentage);
    const classes = colorClasses[badgeColor];

    return (
      <div className={`${classes.bg} ${classes.ring} ring-1 rounded-2xl p-4 flex flex-col items-center text-center min-h-[120px] justify-center hover:scale-105 transition-transform duration-200`}>
        <div className={`${classes.text} mb-3`}>
          <Icon className="w-8 h-8 mx-auto" />
        </div>
        <h4 className={`text-xs font-medium ${classes.text} mb-2 leading-tight`}>{label}</h4>
        <p className={`text-2xl font-bold ${classes.text}`}>{percentage}%</p>
      </div>
    );
  };

  const InfoRow = ({ label, value, icon: Icon, editable = false }: {
    label: string;
    value: string;
    icon?: React.ElementType;
    editable?: boolean;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
      <div className="flex items-center space-x-3">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm font-medium text-gray-700">{label}:</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-900">{value}</span>
        {editable && <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />}
      </div>
    </div>
  );

  const DatePicker = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    
    const quickOptions = [
      { label: "Today", value: "today" },
      { label: "Yesterday", value: "yesterday" },
      { label: "Last week", value: "week" },
      { label: "Last month", value: "month" },
      { label: "Last quarter", value: "quarter" }
    ];

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDate = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust for Monday start
      
      const days = [];
      
      // Previous month days
      const prevMonth = new Date(year, month - 1, 0);
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthNum = month === 0 ? 11 : month - 1;
      
      for (let i = startDate - 1; i >= 0; i--) {
        const dayDate = new Date(prevYear, prevMonthNum, prevMonth.getDate() - i);
        days.push({
          day: prevMonth.getDate() - i,
          date: dayDate,
          isCurrentMonth: false,
          isSelected: isDateInRange(dayDate)
        });
      }
      
      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        days.push({
          day,
          date: dayDate,
          isCurrentMonth: true,
          isSelected: isDateInRange(dayDate)
        });
      }
      
      // Next month days to fill the grid
      const remainingDays = 42 - days.length;
      const nextYear = month === 11 ? year + 1 : year;
      const nextMonthNum = month === 11 ? 0 : month + 1;
      
      for (let day = 1; day <= remainingDays; day++) {
        const dayDate = new Date(nextYear, nextMonthNum, day);
        days.push({
          day,
          date: dayDate,
          isCurrentMonth: false,
          isSelected: isDateInRange(dayDate)
        });
      }
      
      return days;
    };

    const isDateInRange = (date: Date): boolean => {
      if (!selectedStartDate || !selectedEndDate) return false;
      return date >= selectedStartDate && date <= selectedEndDate;
    };

    const handleDateClick = (date: Date) => {
      // For simplicity, clicking a date selects that single day
      setSelectedStartDate(date);
      setSelectedEndDate(date);
      
      // Update the display text
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'short', 
        year: '2-digit' 
      };
      const formattedDate = date.toLocaleDateString('en-GB', options).replace(/,/g, '');
      setSelectedDateRange(formattedDate);
      setTimeRange('custom');
      setShowDatePicker(false);
    };

    const handleQuickOption = (value: string) => {
      setTimeRange(value);
      // Update the display based on the selection
      switch(value) {
        case 'today':
          setSelectedDateRange('Today');
          break;
        case 'yesterday':
          setSelectedDateRange('Yesterday');
          break;
        case 'week':
          setSelectedDateRange('Last week');
          break;
        case 'month':
          setSelectedDateRange('Last month');
          break;
        case 'quarter':
          setSelectedDateRange('Last quarter');
          break;
        default:
          setSelectedDateRange('28 Dec 22 – 10 Jan 23');
      }
      setShowDatePicker(false);
    };

    const handleReset = () => {
      setTimeRange('custom');
      setSelectedDateRange('28 Dec 22 – 10 Jan 23');
      setCurrentMonth(new Date(2023, 0));
      setSelectedStartDate(new Date(2022, 11, 28)); // 28 Dec 22
      setSelectedEndDate(new Date(2023, 0, 10)); // 10 Jan 23
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const days = getDaysInMonth(currentMonth);

    return (
      <div className="date-picker-container absolute right-0 top-12 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden" style={{width: '538px'}}>
        {/* Header with selected range */}
        <div className="px-5 py-4 bg-gray-50 border-b">
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 font-medium px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center space-x-2"
          >
            <span>{selectedDateRange}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-12 gap-5">
            {/* Quick Options - Reduced Size */}
            <div className="col-span-4 space-y-1.5">
              {quickOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleQuickOption(option.value)}
                  className={`w-full text-left text-xs py-2 px-3 rounded-md transition-colors ${
                    timeRange === option.value 
                      ? 'text-blue-600 bg-blue-50 font-medium border border-blue-200' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              
              <div className="pt-2">
                <button
                  onClick={handleReset}
                  className="w-full text-left text-xs text-blue-600 py-2 px-3 rounded-md hover:bg-blue-50 transition-colors font-medium"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Expanded Calendar - Larger Size */}
            <div className="col-span-8">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="text-lg text-sm font-medium text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-sm text-gray-500 text-center py-2.5 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day.date)}
                    className={`
                      text-sm py-2.5 text-center rounded-lg transition-colors w-10 h-10 flex items-center justify-center font-medium
                      ${day.isCurrentMonth 
                        ? day.isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-900 hover:bg-gray-100 hover:shadow-sm'
                        : 'text-gray-300 hover:text-gray-400'
                      }
                    `}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const statusConfig = getStatusConfig(driverData.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div className="text-sm text-gray-500">Admin Portal • Private & Confidential</div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setNotificationModalData({
                    type: 'info',
                    title: 'Notifications Panel',
                    message: 'Driver notification preferences and history panel would open here.',
                    icon: 'Bell'
                  });
                  setShowNotificationModal(true);
                }}
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">NT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Driver Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Main Header Row - Responsive */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0 mb-6">
            {/* Top Row: Driver Identity + Quick Actions (Mobile/Tablet) */}
            <div className="flex items-center justify-between lg:flex-1">
              {/* Left Section - Driver Identity */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-semibold">
                    AC
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusConfig.dot} rounded-full border-2 border-white`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-xl font-bold text-gray-900">{driverData.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color} capitalize`}>
                      {driverData.status}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                      ID: {driverData.id}
                    </span>
                  </div>
                  
                  {/* Contact Info Row - Responsive */}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium">{driverData.phone}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Joined {driverData.signupDate}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Last Active {driverData.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Action Button (Mobile/Tablet) - Show on small screens */}
              <div className="lg:hidden">
                <div className="relative">
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    onClick={() => setShowQuickActionsMenu(!showQuickActionsMenu)}
                  >
                    <span className="text-sm font-medium">Actions</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Second Row: Classification + Metrics (Desktop: Right side) */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
              {/* Driver Classification */}
              <div className="flex flex-col space-y-3 lg:min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-purple-500" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      driverData.type === 'operator-driver' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {driverData.type === 'operator-driver' ? 'Operator/Driver' : 'Driver'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-gray-600">{driverData.vehicleAccess} vehicles assigned</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {driverData.qualifiedServices.map((service) => (
                    <span
                      key={service}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        service === 'TNVS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        service === 'MC Taxi' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Metrics - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:flex lg:items-center lg:space-x-4 lg:gap-0">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-lg font-bold text-gray-900">{driverData.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">Rating</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-gray-900">₱{(driverData.totalEarnings / 1000).toFixed(0)}k</span>
                  </div>
                  <span className="text-xs text-gray-500">Earnings</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 mb-1">{driverData.metrics.month.trips}</div>
                  <span className="text-xs text-gray-500">Monthly Trips</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600 mb-1">68%</div>
                  <span className="text-xs text-gray-500">Retention</span>
                </div>
              </div>

              {/* Action Buttons - Desktop Only */}
              <div className="hidden lg:flex items-center space-x-2">
                <div className="relative">
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    onClick={() => setShowQuickActionsMenu(!showQuickActionsMenu)}
                  >
                    <span className="text-sm font-medium">Actions</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
              
              {showQuickActionsMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
                    onClick={() => {
                      setSelectedTab('chat');
                      setShowQuickActionsMenu(false);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Send Message</span>
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
                    onClick={() => {
                      setNotificationModalData({
                        type: 'success',
                        title: 'Push Notification Sent',
                        message: 'Push notification sent to driver successfully!',
                        icon: 'CheckCircle'
                      });
                      setShowNotificationModal(true);
                      setShowQuickActionsMenu(false);
                    }}
                  >
                    <Send className="w-4 h-4 text-green-600" />
                    <span>Send Push Notification</span>
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
                    onClick={() => {
                      setNotificationModalData({
                        type: 'success',
                        title: 'Marketing Campaign Created',
                        message: 'Marketing campaign created and assigned to driver successfully!',
                        icon: 'CheckCircle'
                      });
                      setShowNotificationModal(true);
                      setShowQuickActionsMenu(false);
                    }}
                  >
                    <Plus className="w-4 h-4 text-purple-600" />
                    <span>Create Campaign</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
                    onClick={() => {
                      setSelectedTab('financials');
                      setShowQuickActionsMenu(false);
                    }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <span>Process Withdrawal</span>
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
                    onClick={() => {
                      setSelectedTab('financials');
                      setShowQuickActionsMenu(false);
                    }}
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Generate Statement</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 text-sm text-red-600"
                    onClick={() => {
                      setSelectedTab('performance');
                      setShowQuickActionsMenu(false);
                    }}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>File Report</span>
                  </button>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className={`space-y-8 ${selectedTab === 'insights' ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            
            {/* Insights Tab */}
            {selectedTab === 'insights' && (
              <div className="space-y-6">
                {/* Driver Performance Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Driver Performance & KPIs</h2>
                    <div className="relative date-picker-container">
                      <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="text-sm border border-gray-300 bg-gray-50 text-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                      >
                        <span>{selectedDateRange}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showDatePicker && <DatePicker />}
                    </div>
                  </div>

                  {/* Driver Status Notice */}
                  {driverData.status === 'inactive' && timeRange === 'today' && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Driver Status: Inactive</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Last active {driverData.lastActive}. No trips today.
                      </p>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard 
                      title="Completion Rate" 
                      value={currentMetrics.trips === 0 ? 'No Data' : `${currentMetrics.completionRate}%`}
                      change={currentMetrics.trips === 0 ? 
                        `No trips ${timeRange}` : 
                        timeRange === 'today' ? 
                          `${currentMetrics.trips} out of ${currentMetrics.trips} ${timeRange}` : 
                          `${currentMetrics.trips} trips this ${timeRange}`}
                      trend={currentMetrics.trips > 0 && currentMetrics.completionRate >= 95 ? "up" : currentMetrics.trips > 0 && currentMetrics.completionRate <= 85 ? "down" : undefined}
                      color="green"
                    />
                    <MetricCard 
                      title="Acceptance Rate" 
                      value={currentMetrics.trips === 0 ? 'No Data' : `${currentMetrics.acceptanceRate}%`}
                      change={currentMetrics.trips === 0 ? 
                        `No trips ${timeRange}` : 
                        timeRange === 'today' ? 
                          `${currentMetrics.trips} out of ${currentMetrics.trips} ${timeRange}` : 
                          `${currentMetrics.trips} trips this ${timeRange}`}
                      trend={currentMetrics.trips > 0 && currentMetrics.acceptanceRate >= 95 ? "up" : currentMetrics.trips > 0 && currentMetrics.acceptanceRate <= 85 ? "down" : undefined}
                      color="blue"
                    />
                    <MetricCard 
                      title="Cancellation Rate" 
                      value={currentMetrics.trips === 0 ? 'No Data' : `${currentMetrics.cancellationRate}%`}
                      change={currentMetrics.trips === 0 ? 
                        `No trips ${timeRange}` : 
                        timeRange === 'today' ? 
                          `${Math.round(currentMetrics.trips * currentMetrics.cancellationRate / 100)} out of ${currentMetrics.trips} ${timeRange}` : 
                          `${currentMetrics.trips} trips this ${timeRange}`}
                      trend={currentMetrics.trips > 0 && currentMetrics.cancellationRate <= 5 ? "up" : currentMetrics.trips > 0 && currentMetrics.cancellationRate >= 10 ? "down" : undefined}
                      color="red"
                    />
                    <MetricCard 
                      title={timeRange === 'today' ? 'Today Trips' : timeRange === 'week' ? 'Weekly Trips' : 'Monthly Trips'}
                      value={`${currentMetrics.trips}`}
                      change={currentMetrics.trips === 0 ? 
                        `No trips ${timeRange}` : 
                        `This ${timeRange}`}
                      trend={currentMetrics.trips > 0 ? "up" : undefined}
                      color="purple"
                    />
                  </div>

                  {/* Active Hours & Earnings Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {timeRange === 'today' ? 'Today Active Hours' : 'Average Active Hours'}
                      </h3>
                      <div className="flex items-end space-x-2">
                        <div className={`text-3xl font-bold ${currentMetrics.activeHours === 0 && timeRange === 'today' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {timeRange === 'today' ? currentMetrics.activeHours : currentMetrics.avgActiveHours}
                        </div>
                        <div className="text-lg text-gray-500 mb-1">
                          {timeRange === 'today' ? 'hrs' : 'hrs/day'}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {currentMetrics.activeHours === 0 && timeRange === 'today' ? 'Driver inactive today' : 
                         timeRange === 'today' ? 'Today' : `Average for this ${timeRange}`}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {timeRange === 'today' ? 'Daily' : timeRange === 'week' ? 'Weekly' : 'Monthly'} Earnings
                      </h3>
                      <div className="flex items-end space-x-2">
                        <div className={`text-3xl font-bold ${currentMetrics.earnings === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                          ₱{currentMetrics.earnings.toLocaleString()}
                        </div>
                        <div className="text-lg text-gray-500 mb-1">PHP</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {currentMetrics.earnings === 0 ? `No earnings this ${timeRange}` : `This ${timeRange}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Feedback Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg text-sm font-medium text-gray-900">Customer Feedback Summary</h2>
                    <button className="text-xs text-blue-600 hover:text-blue-800">View Details</button>
                  </div>
                  
                  {/* Customer Feedback List */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600">Excellent Service</span>
                      <span className="font-medium text-gray-900">{driverData.performance.excellentService}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600">Expert Navigation</span>
                      <span className="font-medium text-gray-900">{driverData.performance.expertNavigation}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600">Neat and Tidy</span>
                      <span className="font-medium text-gray-900">{driverData.performance.neatAndTidy}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600">Great Conversation</span>
                      <span className="font-medium text-gray-900">{driverData.performance.greatConversation}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600">Cool Vehicle</span>
                      <span className="font-medium text-gray-900">{driverData.performance.coolVehicle}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600">Late Night Hero</span>
                      <span className="font-medium text-gray-900">{driverData.performance.lateNightHero}%</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Legal Docs Tab */}
            {selectedTab === 'legal' && (
              <div className="space-y-8">
                {/* Document Management Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg text-sm font-medium text-gray-900">Legal Documents</h2>
                    <div className="flex items-center space-x-2">
                      <select className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-600">
                        <option>All</option>
                        <option>Required</option>
                        <option>Optional</option>
                      </select>
                      <button 
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1"
                        onClick={() => {
                          setNotificationModalData({
                            type: 'info',
                            title: 'Document Upload',
                            message: 'Document upload modal would open here for adding new driver documents.',
                            icon: 'Upload'
                          });
                          setShowNotificationModal(true);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Document List */}
                  <div className="space-y-3">
                    {/* Driver's License */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Driver's License</h3>
                          <p className="text-xs text-gray-500">D01-88-012345 • Expires Mar 14, 2025</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Valid</span>
                        <button 
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'info',
                              title: 'Document Viewer',
                              message: 'Driver\'s License document would open for viewing in full screen.',
                              icon: 'Eye'
                            });
                            setShowNotificationModal(true);
                          }}
                        >View</button>
                      </div>
                    </div>

                    {/* Vehicle Registration */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Car className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">OR & CR</h3>
                          <p className="text-xs text-gray-500">OR: 12345678901 • CR: 98765432109 • Valid Until Dec 31, 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Valid</span>
                        <button 
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'info',
                              title: 'Document Viewer',
                              message: 'Vehicle Registration document would open for viewing in full screen.',
                              icon: 'Eye'
                            });
                            setShowNotificationModal(true);
                          }}
                        >View</button>
                      </div>
                    </div>

                    {/* Insurance */}
                    <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Insurance Policy</h3>
                          <p className="text-xs text-gray-500">INS-2023-789456 • PhilCare Insurance • Expires Jan 15, 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Expiring Soon</span>
                        <button 
                          className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'success',
                              title: 'Insurance Renewal',
                              message: 'Insurance renewal process has been initiated successfully.',
                              icon: 'CheckCircle'
                            });
                            setShowNotificationModal(true);
                          }}
                        >Renew</button>
                      </div>
                    </div>

                    {/* Medical Certificate */}
                    <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Medical Certificate</h3>
                          <p className="text-xs text-gray-500">DOH Clinic • Expired Oct 15, 2023</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Expired</span>
                        <button 
                          className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'info',
                              title: 'Document Actions',
                              message: 'Upload new certificate or view expired document.',
                              icon: 'Upload'
                            });
                            setShowNotificationModal(true);
                          }}
                        >Upload</button>
                      </div>
                    </div>

                    {/* Drug Test */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Drug Test</h3>
                          <p className="text-xs text-gray-500">PDEA Clearance • Valid until Aug 20, 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Valid</span>
                        <button 
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'info',
                              title: 'Document Viewer',
                              message: 'Drug Test document would open for viewing in full screen.',
                              icon: 'Eye'
                            });
                            setShowNotificationModal(true);
                          }}
                        >View</button>
                      </div>
                    </div>

                    {/* Background Check */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Background Check</h3>
                          <p className="text-xs text-gray-500">NBI-2023-456789 • Issued Sep 1, 2023</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Clear</span>
                        <button 
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'info',
                              title: 'Document Viewer',
                              message: 'Background Check document would open for viewing in full screen.',
                              icon: 'Eye'
                            });
                            setShowNotificationModal(true);
                          }}
                        >View</button>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Summary */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg text-sm font-medium text-gray-900">Compliance Summary</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">1 expired document requires attention</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">5</div>
                        <p className="text-sm text-gray-600">Valid Documents</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">1</div>
                        <p className="text-sm text-gray-600">Expiring Soon</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">1</div>
                        <p className="text-sm text-gray-600">Expired</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Document History</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Drug Test Certificate uploaded</p>
                        <p className="text-xs text-gray-500">Aug 20, 2023 • Uploaded by System Admin</p>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Approved</span>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Medical Certificate expired</p>
                        <p className="text-xs text-gray-500">Oct 15, 2023 • Action Required</p>
                      </div>
                      <span className="text-xs text-red-600 font-medium">Expired</span>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Background Check verified</p>
                        <p className="text-xs text-gray-500">Sep 1, 2023 • Verified by Compliance Officer</p>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicles Tab */}
            {selectedTab === 'vehicles' && (
              <div className="space-y-8">
                {/* Vehicle Management */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Vehicle Management</h2>
                      <p className="text-sm text-gray-600">Fleet management and vehicle information</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
                        onClick={() => {
                          setNotificationModalData({
                            type: 'success',
                            title: 'Vehicle Report Exported',
                            message: 'Vehicle report has been successfully exported to your downloads folder.',
                            icon: 'CheckCircle'
                          });
                          setShowNotificationModal(true);
                        }}
                      >
                        Export Report
                      </button>
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        onClick={() => {
                          setNotificationModalData({
                            type: 'info',
                            title: 'Add Vehicle',
                            message: 'Add vehicle modal would open here for registering new vehicles.',
                            icon: 'Upload'
                          });
                          setShowNotificationModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Vehicle</span>
                      </button>
                    </div>
                  </div>

                  {/* Vehicle List Table */}
                  <div className="space-y-3">
                    {vehiclesData.map((vehicle) => (
                      <div 
                        key={vehicle.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setVehicleModalTab('details');
                          setShowVehicleModal(true);
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                              
                              {/* Ownership Badge */}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                vehicle.ownership === 'xpress' ? 'bg-blue-100 text-blue-700' :
                                vehicle.ownership === 'fleet' ? 'bg-purple-100 text-purple-700' :
                                vehicle.ownership === 'operator' ? 'bg-green-100 text-green-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                🏢 {vehicle.ownership === 'xpress' ? 'Xpress Owned' :
                                     vehicle.ownership === 'fleet' ? 'Fleet Owned' :
                                     vehicle.ownership === 'operator' ? 'Operator Owned' :
                                     'Driver Owned'}
                              </span>
                              
                              {/* OBD Status Badge */}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                vehicle.hasOBD && vehicle.obdStatus === 'connected' ? 'bg-green-100 text-green-700' :
                                vehicle.hasOBD && vehicle.obdStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                📡 {vehicle.hasOBD && vehicle.obdStatus === 'connected' ? 'OBD Connected' :
                                    vehicle.hasOBD && vehicle.obdStatus === 'disconnected' ? 'OBD Disconnected' :
                                    'No OBD'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{vehicle.plate} • {vehicle.service} • {vehicle.mileage}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right text-sm">
                            <p className="text-gray-900">{vehicle.type}</p>
                            <p className="text-gray-500">{vehicle.maintenanceStatus}</p>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 py-1 text-xs rounded ${
                              vehicle.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>{vehicle.status}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              vehicle.insurance === 'Valid' ? 'bg-green-100 text-green-700' : 
                              vehicle.insurance === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>{vehicle.insurance}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Commerce Tab */}
            {selectedTab === 'commerce' && (
              <div className="space-y-8">
                {/* Credit Scoring Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Driver Credit & Commerce Profile</h2>
                      <p className="text-sm text-gray-600">Credit assessment, purchase history, and financial reliability</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                        Update Credit Score
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>New Purchase</span>
                      </button>
                    </div>
                  </div>

                  {/* Credit Score & Commerce Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Good</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Credit Score</p>
                        <p className="text-2xl font-bold text-gray-900">742</p>
                        <p className="text-xs text-green-600 font-medium mt-1">+15 points this month</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Excellent</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment Reliability</p>
                        <p className="text-2xl font-bold text-gray-900">96%</p>
                        <p className="text-xs text-green-600 font-medium mt-1">On-time payments</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Store Purchases</p>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">This month</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Low Risk</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Credit Limit</p>
                        <p className="text-2xl font-bold text-gray-900">₱50K</p>
                        <p className="text-xs text-orange-600 font-medium mt-1">Available: ₱42K</p>
                      </div>
                    </div>
                  </div>

                  {/* Credit Score Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Credit Score Factors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">95%</div>
                        <p className="text-sm text-gray-600">Payment History</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">78%</div>
                        <p className="text-sm text-gray-600">Credit Utilization</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '78%'}}></div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">85%</div>
                        <p className="text-sm text-gray-600">Account Age</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">92%</div>
                        <p className="text-sm text-gray-600">Income Stability</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: '92%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Plans & Inventory Lists */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Active Payment Plans</h3>
                      <div className="space-y-3">
                        {/* Vehicle Loan */}
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Car className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Vehicle Financing</h4>
                              <p className="text-xs text-gray-500">Toyota Vios 2020 • ₱15,500/mo • 24 months left</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Current</span>
                            <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Details</button>
                          </div>
                        </div>

                        {/* Insurance Premium */}
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Shield className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Insurance Premium</h4>
                              <p className="text-xs text-gray-500">Comprehensive • ₱12,500/year • Due Jan 15, 2024</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Due Soon</span>
                            <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Pay</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Xpress Gear Inventory</h3>
                      <div className="space-y-3">
                        {/* Driver Uniform */}
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Driver Uniform Set</h4>
                              <p className="text-xs text-gray-500">Purchased Sep 2023 • ₱2,500 • Excellent condition</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Owned</span>
                            <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">View</button>
                          </div>
                        </div>

                        {/* Phone Mount */}
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Smartphone className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Phone Mount & Charger</h4>
                              <p className="text-xs text-gray-500">Ordered Nov 20, 2023 • ₱1,200 • ETA Dec 5, 2023</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">In Transit</span>
                            <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Track</button>
                          </div>
                        </div>

                        <button className="w-full text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4">
                          Browse Xpress Store
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Store Purchases</h2>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-2">
                        <option>All Categories</option>
                        <option>Vehicle Accessories</option>
                        <option>Uniforms & Gear</option>
                        <option>Electronics</option>
                        <option>Maintenance</option>
                      </select>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                        Export History
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Phone Mount Purchase */}
                    <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Phone Mount & Charger Kit</p>
                        <p className="text-xs text-gray-500">Vehicle Electronics • Order #XS-2023-1120 • Credit Purchase</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">₱1,200</p>
                        <p className="text-xs text-gray-500">Nov 20, 2023</p>
                      </div>
                    </div>

                    {/* Uniform Purchase */}
                    <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Professional Driver Uniform Set</p>
                        <p className="text-xs text-gray-500">Apparel & Gear • Order #XS-2023-0903 • Paid in Full</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">₱2,500</p>
                        <p className="text-xs text-gray-500">Sep 3, 2023</p>
                      </div>
                    </div>

                    {/* Car Freshener */}
                    <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Premium Car Air Freshener</p>
                        <p className="text-xs text-gray-500">Vehicle Accessories • Order #XS-2023-0815 • Credit Purchase</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₱350</p>
                        <p className="text-xs text-gray-500">Aug 15, 2023</p>
                      </div>
                    </div>

                    {/* Seat Covers */}
                    <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Leather Seat Cover Set</p>
                        <p className="text-xs text-gray-500">Vehicle Interior • Order #XS-2023-0720 • Installment Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">₱4,500</p>
                        <p className="text-xs text-gray-500">Jul 20, 2023</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credit Assessment */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Credit Assessment & Risk Profile</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Credit Risk Factors */}
                    <div>
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Risk Assessment Factors</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Employment Status</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Low Risk</span>
                          </div>
                          <p className="text-xs text-gray-600">Active driver for 3+ months with consistent earnings</p>
                        </div>
                        
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Payment Behavior</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Excellent</span>
                          </div>
                          <p className="text-xs text-gray-600">96% on-time payment rate, no defaults</p>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Credit Utilization</span>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Moderate</span>
                          </div>
                          <p className="text-xs text-gray-600">Using 16% of ₱50K credit limit (₱8K used)</p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Income Verification</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified</span>
                          </div>
                          <p className="text-xs text-gray-600">Consistent monthly earnings of ₱15K-25K</p>
                        </div>
                      </div>
                    </div>

                    {/* Credit Recommendations */}
                    <div>
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Credit Recommendations</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TrendingUpIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Credit Limit Increase</h4>
                              <p className="text-xs text-gray-600">Eligible for increase to ₱75K based on payment history</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Premium Benefits</h4>
                              <p className="text-xs text-gray-600">Qualify for 0% installment plans and exclusive deals</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Financial Products</h4>
                              <p className="text-xs text-gray-600">Pre-approved for vehicle loans and insurance plans</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Target className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Score Improvement</h4>
                              <p className="text-xs text-gray-600">Continue current payment habits to reach 800+ score</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Disciplinary Tab */}
            {selectedTab === 'disciplinary' && (
              <div className="space-y-8">
                {/* Disciplinary Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Disciplinary Record & Case Management</h2>
                      <p className="text-sm text-gray-600">Track violations, penalties, and behavioral management</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Generate Report</span>
                      </button>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>New Case</span>
                      </button>
                    </div>
                  </div>

                  {/* Disciplinary Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Good</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Overall Standing</p>
                        <p className="text-2xl font-bold text-gray-900">Clean</p>
                        <p className="text-xs text-green-600 font-medium mt-1">No active cases</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Total</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Cases Filed</p>
                        <p className="text-2xl font-bold text-gray-900">2</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">All time</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Minor</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Warnings</p>
                        <p className="text-2xl font-bold text-gray-900">1</p>
                        <p className="text-xs text-yellow-600 font-medium mt-1">Last 90 days</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Score</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Behavior Score</p>
                        <p className="text-2xl font-bold text-gray-900">8.5</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">Excellent behavior</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Cases */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Active Cases</h2>
                      <p className="text-sm text-gray-600">Currently no active disciplinary cases</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg text-sm font-medium text-gray-900 mb-2">No Active Cases</h3>
                    <p className="text-gray-600">This driver currently has no ongoing disciplinary proceedings.</p>
                  </div>
                </div>

                {/* Case History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Case History</h2>
                      <p className="text-sm text-gray-600">Previous disciplinary actions and resolutions</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <option>All Cases</option>
                        <option>Resolved</option>
                        <option>Dismissed</option>
                        <option>Pending</option>
                      </select>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                        Export History
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Previous Warning Case */}
                    <div className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Customer Complaint - Late Pickup</h3>
                          <p className="text-xs text-gray-500">Case #DC-2023-0815 • Filed Aug 15, 2023 • Maria Santos</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Warning Issued</span>
                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Details</button>
                      </div>
                    </div>

                    {/* Previous Dismissed Case */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Vehicle Cleanliness Complaint</h3>
                          <p className="text-xs text-gray-500">Case #DC-2023-0520 • Filed May 20, 2023 • Anonymous</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Dismissed</span>
                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Details</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavior Trends */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Behavior & Performance Trends</h2>
                      <p className="text-sm text-gray-600">Track behavioral patterns and improvement metrics</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Behavioral Metrics */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Key Behavioral Indicators</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Punctuality Score</p>
                              <p className="text-xs text-gray-600">On-time arrival rate</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">94%</p>
                            <p className="text-xs text-green-600">+2% this month</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Communication Rating</p>
                              <p className="text-xs text-gray-600">Customer feedback</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">4.7/5</p>
                            <p className="text-xs text-blue-600">Excellent</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Car className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Vehicle Standards</p>
                              <p className="text-xs text-gray-600">Cleanliness & maintenance</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">4.9/5</p>
                            <p className="text-xs text-purple-600">Outstanding</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Improvements */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Recent Improvements</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Communication Training Completed</h4>
                              <p className="text-xs text-gray-600 mt-1">Successfully completed mandatory communication protocols training following previous warning. Improvement noted in customer feedback.</p>
                              <p className="text-xs text-green-600 font-medium mt-2">Completed: Aug 25, 2023</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Award className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Clean Record Achievement</h4>
                              <p className="text-xs text-gray-600 mt-1">Maintained clean disciplinary record for 6 consecutive months. No new complaints or violations recorded.</p>
                              <p className="text-xs text-blue-600 font-medium mt-2">Milestone: Feb 2024</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Target className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Performance Goals Met</h4>
                              <p className="text-xs text-gray-600 mt-1">Achieved all behavioral KPIs set after warning: 95%+ punctuality, 4.5+ communication rating, zero new complaints.</p>
                              <p className="text-xs text-purple-600 font-medium mt-2">Achievement: Ongoing</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900">File New Case</span>
                      </div>
                      <p className="text-xs text-red-600">Create new disciplinary case</p>
                    </button>

                    <button className="p-4 text-left border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Bell className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-900">Issue Warning</span>
                      </div>
                      <p className="text-xs text-yellow-600">Send formal warning notice</p>
                    </button>

                    <button className="p-4 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Schedule Review</span>
                      </div>
                      <p className="text-xs text-blue-600">Book performance review</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {selectedTab === 'wallet' && (
              <div className="space-y-8">
                {/* Wallet Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Wallet Overview</h2>
                      <p className="text-sm text-gray-600">Current balance and recent financial activity</p>
                    </div>
                  </div>

                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                          <DollarSign className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Wallets</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Balance</p>
                        <p className="text-lg font-bold text-gray-900">₱10,600</p>
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div className="flex justify-between">
                            <span>Xpress:</span>
                            <span className="text-blue-600">₱8,450</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cash:</span>
                            <span className="text-green-600">₱2,150</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                          <Award className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Incentives</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Today's Incentives</p>
                        <p className="text-lg font-bold text-gray-900">₱420</p>
                        <p className="text-xs text-green-600 font-medium mt-1">Peak hours + quality bonus</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Commission</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Today's Commission</p>
                        <p className="text-lg font-bold text-gray-900">₱650</p>
                        <p className="text-xs text-red-600 font-medium mt-1">Deducted from Xpress Wallet</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                          <TrendingUp className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Earnings</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Today's Gross</p>
                        <p className="text-lg font-bold text-gray-900">₱2,270</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">Before commission</p>
                      </div>
                    </div>


                  </div>
                </div>

                {/* Streamlined Wallet Management */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Wallet Management</h2>
                      <p className="text-sm text-gray-600">Quick controls for driver financial settings</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>-₱80+ blocks bookings</span>
                      </div>
                      <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Booking Eligible</span>
                      </div>
                    </div>
                  </div>

                  {/* Critical Actions Bar */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-1 text-xs"
                        onClick={() => alert('Cash out suspension confirmation dialog would open here')}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Suspend Cash Out</span>
                      </button>
                      
                      <button 
                        className="bg-orange-600 text-white px-3 py-1.5 rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-1 text-xs"
                        onClick={() => alert('Manual transfer from Xpress to Cash wallet would be processed')}
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Force Transfer</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <label className="text-xs font-medium text-gray-700">Min Maintaining Balance:</label>
                          <div className="relative group">
                            <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              Minimum balance required in Xpress Wallet.<br/>
                              Drivers cannot transfer below this amount.<br/>
                              Used for commission deductions and risk management.
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        </div>
                        <input 
                          type="number" 
                          placeholder="500"
                          className="w-16 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-center"
                          defaultValue="500"
                        />
                        <button 
                          className="bg-blue-600 text-white px-2 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-xs"
                          onClick={() => alert('Minimum balance updated for Xpress Wallet')}
                        >
                          Set
                        </button>
                      </div>

                      <button 
                        className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-1 text-xs"
                        onClick={() => alert('Full transfer history would be shown')}
                      >
                        <FileText className="w-3 h-3" />
                        <span>View History</span>
                      </button>
                    </div>
                  </div>

                  {/* Wallet Status Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Xpress Wallet Status */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-900">Xpress Wallet</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">₱8,450</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Available to transfer:</span>
                          <span className="text-green-600 font-medium">₱7,950</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min balance:</span>
                          <span className="text-blue-600">₱500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Commission (today):</span>
                          <span className="text-red-600">-₱650</span>
                        </div>
                      </div>
                    </div>

                    {/* Cash Wallet Status */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-900">Cash Wallet</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">₱2,150</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Next payout:</span>
                          <span className="text-gray-900">Tomorrow 9AM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payout method:</span>
                          <span className="text-gray-900">Bank Transfer</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="text-green-600 font-medium">Enabled</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">Recent Activity</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Last transfer:</span>
                          <span className="text-gray-900">Yesterday</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="text-gray-900">₱1,500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weekly transfers:</span>
                          <span className="text-gray-900">3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                      <p className="text-sm text-gray-600">Latest earnings, deductions, and transfers</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <option>All Transactions</option>
                        <option>Earnings</option>
                        <option>Deductions</option>
                        <option>Transfers</option>
                      </select>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                        Filter
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Digital Trip Payment */}
                    <button 
                      className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors text-left"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090401',
                          type: 'Digital Trip',
                          fullFare: '₱570',
                          commission: '-₱85',
                          driverEarnings: '₱485',
                          tip: '₱135',
                          total: '₱485',
                          pickup: 'Makati CBD',
                          dropoff: 'BGC Taguig',
                          distance: '8.2km',
                          duration: '24 minutes',
                          payment: 'GCash Digital'
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Digital Trip - Makati to BGC</p>
                          <p className="text-xs text-gray-600">Trip #TR-2024-090401 • Today, 2:45 PM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">+₱485</p>
                        <p className="text-xs text-gray-500">Fare: ₱570 - Commission: ₱85</p>
                      </div>
                    </button>

                    <button 
                      className="w-full flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors text-left"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090402',
                          type: 'Cash Trip',
                          fullFare: '₱720',
                          commission: '-₱108',
                          driverEarnings: '₱612',
                          note: 'Commission deducted from Xpress Wallet',
                          pickup: 'Ortigas Center',
                          dropoff: 'NAIA Terminal 3',
                          distance: '12.5km',
                          duration: '35 minutes',
                          payment: 'Cash'
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Cash Trip - Ortigas to Airport</p>
                          <p className="text-xs text-gray-600">Trip #TR-2024-090402 • Today, 11:20 AM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-600">+₱720</p>
                        <p className="text-xs text-gray-500">Commission deducted from Xpress Wallet</p>
                      </div>
                    </button>


                    {/* Fuel Subsidy */}
                    <button 
                      className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-left"
                      onClick={() => alert('Fuel Assistance Details:\n\nWeekly Performance Bonus\nEligibility: 20+ trips completed\nQuality Score: 4.8/5.0\nBonus Rate: ₱25/trip\nTrips This Week: 20\nTotal Bonus: ₱500\n\nAdded to Xpress Wallet')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Fuel className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Fuel Assistance Program</p>
                          <p className="text-xs text-gray-600">Weekly fuel subsidy • Yesterday, 6:00 PM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">+₱500</p>
                        <p className="text-xs text-gray-500">Performance bonus</p>
                      </div>
                    </button>

                    {/* Bank Transfer */}
                    <button 
                      className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-left"
                      onClick={() => alert('Bank Transfer Details:\n\nWithdrawal Transaction\nFrom: Cash Wallet\nTo: BPI Savings ****-5789\nAmount: ₱5,000\nTransfer Fee: ₱15\nNet Amount: ₱4,985\n\nReference: TXN-240903-001\nStatus: Completed\nProcessing Time: 2-4 hours')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Bank Transfer to BPI</p>
                          <p className="text-xs text-gray-600">Manual withdrawal • Yesterday, 3:30 PM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">-₱5,000</p>
                        <p className="text-xs text-gray-500">Transfer fee: ₱15</p>
                      </div>
                    </button>

                    {/* Equipment Purchase */}
                    <button 
                      className="w-full flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors text-left"
                      onClick={() => alert('Equipment Purchase Details:\n\nXpress Store Purchase\nItem: Premium Phone Mount\nSKU: XPS-PM-001\nPrice: ₱1,200\nPayment: Deducted from Xpress Wallet\n\nOrder ID: ORD-240901-123\nDelivery Status: Delivered\nDelivery Address: Block 07 lot 18 north grove sta Monica San Simon pampanga\nDelivery Date: Sept 2, 2024')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phone Mount Purchase</p>
                          <p className="text-xs text-gray-600">Equipment purchase • 2 days ago, 9:15 AM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">-₱1,200</p>
                        <p className="text-xs text-gray-500">Credit purchase</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Financial Analytics */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Financial Analytics & Insights</h2>
                      <p className="text-sm text-gray-600">Earning patterns, expense tracking, and financial health</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Earning Breakdown */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Monthly Earning Breakdown</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Base Earnings</p>
                              <p className="text-xs text-gray-600">Trip fares & base rates</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">₱22,150</p>
                            <p className="text-xs text-green-600">78% of total</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Star className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Tips & Bonuses</p>
                              <p className="text-xs text-gray-600">Customer tips & incentives</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">₱4,190</p>
                            <p className="text-xs text-blue-600">15% of total</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Award className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Subsidies & Support</p>
                              <p className="text-xs text-gray-600">Fuel assistance & programs</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">₱2,000</p>
                            <p className="text-xs text-purple-600">7% of total</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expense Tracking */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Monthly Expenses</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <ArrowDownRight className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Platform Commission</p>
                              <p className="text-xs text-gray-600">15% service fee</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">-₱4,251</p>
                            <p className="text-xs text-red-600">15% of gross</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Fuel className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Fuel & Maintenance</p>
                              <p className="text-xs text-gray-600">Gas, oil, repairs</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">-₱3,200</p>
                            <p className="text-xs text-orange-600">11% of gross</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <ShoppingCart className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Equipment & Gear</p>
                              <p className="text-xs text-gray-600">Phone mounts, uniforms</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-yellow-600">-₱1,200</p>
                            <p className="text-xs text-yellow-600">4% of gross</p>
                          </div>
                        </div>

                        {/* Net Earnings Summary */}
                        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 mt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">Net Monthly Earnings</p>
                              <p className="text-xs text-gray-400">After all deductions</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-400">₱19,689</p>
                              <p className="text-xs text-gray-400">69% of gross earnings</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods & Settings - Only for Salaried Drivers */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Company Payment Methods</h2>
                      <p className="text-sm text-gray-600">Salaried driver payout information</p>
                    </div>
                    <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      Salaried Driver
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Company-Managed Accounts */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Payment Methods</h3>
                      <div className="p-6 border border-dashed border-gray-300 rounded-lg text-gray-400 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">No payment methods configured</span>
                        </div>
                        <p className="text-xs mt-1">Payment methods are managed by the driver directly</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* Chat Tab */}
            {selectedTab === 'chat' && (
              <div className="space-y-8">
                {/* Chat Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Chat & Communication History</h2>
                      <p className="text-sm text-gray-600">Customer conversations, support tickets, and communication logs</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Search Messages</span>
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>New Message</span>
                      </button>
                    </div>
                  </div>

                  {/* Communication Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Total</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Messages</p>
                        <p className="text-2xl font-bold text-gray-900">247</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">+12 this week</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Customer Chats</p>
                        <p className="text-2xl font-bold text-gray-900">185</p>
                        <p className="text-xs text-green-600 font-medium mt-1">89% response rate</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Support</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Support Tickets</p>
                        <p className="text-2xl font-bold text-gray-900">62</p>
                        <p className="text-xs text-orange-600 font-medium mt-1">3 pending</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Rating</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Communication Score</p>
                        <p className="text-2xl font-bold text-gray-900">4.7</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">Excellent rating</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Conversations */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Recent Conversations</h2>
                      <p className="text-sm text-gray-600">Latest customer interactions and chat history</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <option>All Conversations</option>
                        <option>Customer Support</option>
                        <option>Trip Related</option>
                        <option>Complaints</option>
                      </select>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                        Export Chat Logs
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Customer Chat Thread */}
                    <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Maria Santos</h3>
                          <p className="text-xs text-gray-500">Trip #TR-2024-090401 • Today, 2:45 PM • 12 messages • 5★ rating</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Resolved</span>
                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">View Chat</button>
                      </div>
                    </div>

                    {/* Support Ticket Thread */}
                    <div className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Xpress Support Team</h3>
                          <p className="text-xs text-gray-500">Ticket #SUP-2024-001235 • Yesterday, 10:30 AM • 8 messages • 25min duration</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Resolved</span>
                        <button className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100">View Ticket</button>
                      </div>
                    </div>

                    {/* Additional Chat Items */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Robert Kim</h3>
                          <p className="text-xs text-gray-500">Trip #TR-2024-090215 • Nov 27, 11:20 AM • 5 messages • Payment issue</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Resolved</span>
                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">View Chat</button>
                      </div>
                    </div>

                    {/* Customer Service Chat */}
                    <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">John Dela Cruz</h3>
                            <p className="text-sm text-gray-600 mb-2">Trip #TR-2024-090315 • 2 days ago, 6:15 PM</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Duration: 3 minutes</span>
                              <span>•</span>
                              <span>Messages: 4</span>
                              <span>•</span>
                              <span className="text-purple-600 font-medium">Completed</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Customer</span>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <div className="space-y-3">
                          {/* Customer Message */}
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">JD</span>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg p-3">
                                <p className="text-sm text-gray-900">Could you turn up the AC please? It's quite hot back here.</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">6:17 PM</p>
                            </div>
                          </div>

                          {/* Driver Response */}
                          <div className="flex items-start space-x-3 flex-row-reverse">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">AC</span>
                            </div>
                            <div className="flex-1 text-right">
                              <div className="bg-blue-500 text-white rounded-lg p-3 inline-block">
                                <p className="text-sm">Of course! I'll turn it up right now. Let me know if that's better.</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">6:17 PM</p>
                            </div>
                          </div>

                          {/* Customer Appreciation */}
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">JD</span>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg p-3">
                                <p className="text-sm text-gray-900">Perfect! Thank you so much. Great service!</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">6:18 PM</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Positive</span>
                          <span className="text-xs text-gray-500">Customer Rating: 5 stars</span>
                        </div>
                        <button className="text-xs text-purple-600 hover:underline">View Details</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communication Analytics */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Communication Analytics</h2>
                      <p className="text-sm text-gray-600">Response patterns, customer satisfaction, and communication metrics</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Response Metrics */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Response Performance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Average Response Time</p>
                              <p className="text-xs text-gray-600">Customer message reply speed</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">2.3 min</p>
                            <p className="text-xs text-green-600">Excellent</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Response Rate</p>
                              <p className="text-xs text-gray-600">Messages answered</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">96%</p>
                            <p className="text-xs text-blue-600">Very High</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Star className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Communication Quality</p>
                              <p className="text-xs text-gray-600">Customer feedback score</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">4.8/5</p>
                            <p className="text-xs text-purple-600">Outstanding</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Communication Categories */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Message Categories</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Navigation className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Trip Coordination</p>
                              <p className="text-xs text-gray-600">Pickup, directions, delays</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">148</p>
                            <p className="text-xs text-blue-600">60% of total</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Customer Service</p>
                              <p className="text-xs text-gray-600">Requests, feedback, thanks</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">67</p>
                            <p className="text-xs text-green-600">27% of total</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Issues & Support</p>
                              <p className="text-xs text-gray-600">Problems, complaints, help</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">32</p>
                            <p className="text-xs text-orange-600">13% of total</p>
                          </div>
                        </div>

                        {/* Communication Health Score */}
                        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 mt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">Overall Communication Health</p>
                              <p className="text-xs text-gray-400">Comprehensive communication score</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-400">A+</p>
                              <p className="text-xs text-gray-400">Top 5% of drivers</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communication Tools & Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Communication Tools & Preferences</h2>
                      <p className="text-sm text-gray-600">Message templates, notification settings, and communication preferences</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quick Message Templates */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Quick Message Templates</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">Arrival Notification</span>
                            <button className="text-xs text-blue-600 hover:underline">Edit</button>
                          </div>
                          <p className="text-xs text-gray-600">"Hi! I've arrived at your pickup location. I'm in a silver Toyota Vios (XYZ-789)."</p>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-900">Delay Notice</span>
                            <button className="text-xs text-green-600 hover:underline">Edit</button>
                          </div>
                          <p className="text-xs text-gray-600">"Sorry, I'm running about 5 minutes late due to traffic. I'll be there shortly!"</p>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">Trip Complete</span>
                            <button className="text-xs text-purple-600 hover:underline">Edit</button>
                          </div>
                          <p className="text-xs text-gray-600">"Thank you for choosing Xpress! Have a great day and safe travels!"</p>
                        </div>

                        <button className="w-full p-3 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-center space-x-2">
                            <Plus className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">Add New Template</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Notification Preferences</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Message Notifications</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Customer messages</span>
                              <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Support messages</span>
                              <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Sound notifications</span>
                              <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Auto-Response Settings</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Auto-arrival notification</span>
                              <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Trip completion message</span>
                              <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Delay auto-notification</span>
                              <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Privacy & Safety</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Message encryption</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Chat history backup</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Communication Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="p-4 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Send Message</span>
                      </div>
                      <p className="text-xs text-blue-600">Start new conversation</p>
                    </button>

                    <button className="p-4 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Search className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Search Chats</span>
                      </div>
                      <p className="text-xs text-green-600">Find specific messages</p>
                    </button>

                    <button className="p-4 text-left border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Download className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Export Logs</span>
                      </div>
                      <p className="text-xs text-purple-600">Download chat history</p>
                    </button>

                    <button className="p-4 text-left border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Settings className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Chat Settings</span>
                      </div>
                      <p className="text-xs text-orange-600">Manage preferences</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* App History Tab */}
            {selectedTab === 'history' && (
              <div className="space-y-8">
                {/* App History Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">App History & Technical Support</h2>
                      <p className="text-sm text-gray-600">Device management, app performance, and technical troubleshooting</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Download Logs</span>
                      </button>
                      <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Report Issue</span>
                      </button>
                    </div>
                  </div>

                  {/* Technical Health Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Stable</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">App Performance</p>
                        <p className="text-2xl font-bold text-gray-900">98%</p>
                        <p className="text-xs text-green-600 font-medium mt-1">Excellent stability</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Current</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">App Version</p>
                        <p className="text-2xl font-bold text-gray-900">v4.2.1</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">Latest version</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Total</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Support Requests</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">All resolved</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Globe className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Connection Quality</p>
                        <p className="text-2xl font-bold text-gray-900">4.8/5</p>
                        <p className="text-xs text-orange-600 font-medium mt-1">Strong signal</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Device & App Information</h2>
                      <p className="text-sm text-gray-600">Current device specifications and app configuration</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Device Details */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Device Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Smartphone className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Device Model</p>
                              <p className="text-xs text-gray-600">Smartphone identifier</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">Y2246</p>
                            <p className="text-xs text-blue-600">Android</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Settings className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">OS Version</p>
                              <p className="text-xs text-gray-600">Operating system details</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">Android 13</p>
                            <p className="text-xs text-green-600">Up to date</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Battery className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Battery Health</p>
                              <p className="text-xs text-gray-600">Current battery status</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">89%</p>
                            <p className="text-xs text-purple-600">Good condition</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Globe className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Network Provider</p>
                              <p className="text-xs text-gray-600">Mobile carrier information</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">Globe</p>
                            <p className="text-xs text-orange-600">4G LTE</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* App Configuration */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">App Configuration</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Version Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Current Version</span>
                              <span className="text-sm font-medium text-blue-600">v4.2.1</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Last Updated</span>
                              <span className="text-sm font-medium text-gray-900">Aug 28, 2024</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Update Available</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">No</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Location Services</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Granted</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Camera Access</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Granted</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Notification Access</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Granted</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">App Settings</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Auto-update</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Background refresh</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Offline mode</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Available</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Support History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Technical Support History</h2>
                      <p className="text-sm text-gray-600">Previous support requests and resolutions</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <option>All Issues</option>
                        <option>App Crashes</option>
                        <option>Connectivity</option>
                        <option>Performance</option>
                        <option>Account</option>
                      </select>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                        Export History
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Recent Support Request */}
                    <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">GPS Signal Issues</h3>
                            <p className="text-sm text-gray-600 mb-2">Ticket #TECH-2024-0825 • Aug 25, 2024, 9:15 AM</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Priority: Medium</span>
                              <span>•</span>
                              <span>Resolution time: 2 hours</span>
                              <span>•</span>
                              <span className="text-green-600 font-medium">Resolved</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Resolved</span>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Issue Description</h4>
                        <p className="text-sm text-gray-600 mb-3">Driver reported intermittent GPS signal loss causing inaccurate location tracking during trips. Issue occurred primarily in BGC area during peak hours.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Reported by</p>
                            <p className="text-sm font-medium text-gray-900">Driver (Alfred Catap)</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Assigned to</p>
                            <p className="text-sm font-medium text-gray-900">Tech Support - Level 2</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Device Model</p>
                            <p className="text-sm font-medium text-gray-900">Y2246 (Android)</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">App Version</p>
                            <p className="text-sm font-medium text-gray-900">v4.1.8</p>
                          </div>
                        </div>

                        <h4 className="text-sm font-medium text-gray-900 mb-2">Resolution Steps</h4>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <p className="text-sm text-gray-600">Cleared app cache and data</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <p className="text-sm text-gray-600">Reset location permissions</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <p className="text-sm text-gray-600">Updated app to latest version (v4.2.0)</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <p className="text-sm text-gray-600">Applied server-side GPS optimization patch</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Fixed</span>
                          <span className="text-xs text-gray-500">Driver satisfaction: 5/5</span>
                        </div>
                        <button className="text-xs text-green-600 hover:underline">View Full Details</button>
                      </div>
                    </div>

                    {/* App Crash Report */}
                    <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">App Crash During Trip</h3>
                            <p className="text-sm text-gray-600 mb-2">Ticket #TECH-2024-0718 • Jul 18, 2024, 3:22 PM</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Priority: High</span>
                              <span>•</span>
                              <span>Resolution time: 45 minutes</span>
                              <span>•</span>
                              <span className="text-orange-600 font-medium">Resolved</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Resolved</span>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Issue Description</h4>
                        <p className="text-sm text-gray-600 mb-3">App crashed unexpectedly during an active trip, causing driver to lose navigation and customer communication. Automatic crash report was generated and sent to development team.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Crash Time</p>
                            <p className="text-sm font-medium text-gray-900">Jul 18, 2024 - 3:22:15 PM</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Crash Code</p>
                            <p className="text-sm font-medium text-gray-900">SEGFAULT_0x7FA</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Memory Usage</p>
                            <p className="text-sm font-medium text-gray-900">285MB (78% limit)</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Network Status</p>
                            <p className="text-sm font-medium text-gray-900">4G LTE - Strong</p>
                          </div>
                        </div>

                        <h4 className="text-sm font-medium text-gray-900 mb-2">Resolution Details</h4>
                        <p className="text-sm text-gray-600 mb-3">Development team identified memory leak in navigation module. Hotfix deployed within 30 minutes. Driver was contacted and guided through app restart procedure.</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Hotfixed</span>
                          <span className="text-xs text-gray-500">Impact: Minimal trip disruption</span>
                        </div>
                        <button className="text-xs text-orange-600 hover:underline">View Crash Logs</button>
                      </div>
                    </div>

                    {/* Login Issues */}
                    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">Account Login Problems</h3>
                            <p className="text-sm text-gray-600 mb-2">Ticket #TECH-2024-0612 • Jun 12, 2024, 7:45 AM</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Priority: High</span>
                              <span>•</span>
                              <span>Resolution time: 1.5 hours</span>
                              <span>•</span>
                              <span className="text-blue-600 font-medium">Resolved</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Resolved</span>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Issue Description</h4>
                        <p className="text-sm text-gray-600 mb-3">Driver unable to log into app account despite correct credentials. Authentication service was experiencing intermittent issues affecting multiple users in Metro Manila region.</p>
                        
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Root Cause & Resolution</h4>
                        <p className="text-sm text-gray-600 mb-3">Database server failover caused temporary authentication delays. Issue was resolved by infrastructure team. Driver was provided with manual login bypass code as interim solution.</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">System Fixed</span>
                          <span className="text-xs text-gray-500">Affected users: 1,247</span>
                        </div>
                        <button className="text-xs text-blue-600 hover:underline">View Incident Report</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Monitoring */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">App Performance Monitoring</h2>
                      <p className="text-sm text-gray-600">Real-time performance metrics and optimization recommendations</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Performance Metrics */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Current Performance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Zap className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">App Launch Time</p>
                              <p className="text-xs text-gray-600">Cold start performance</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">1.2s</p>
                            <p className="text-xs text-green-600">Excellent</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Activity className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Memory Usage</p>
                              <p className="text-xs text-gray-600">RAM consumption</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">185MB</p>
                            <p className="text-xs text-blue-600">Normal</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Battery className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Battery Impact</p>
                              <p className="text-xs text-gray-600">Power consumption rate</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">12%/hr</p>
                            <p className="text-xs text-purple-600">Optimized</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Globe className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Network Usage</p>
                              <p className="text-xs text-gray-600">Data consumption</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">8.5MB/hr</p>
                            <p className="text-xs text-orange-600">Efficient</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Optimization Recommendations */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Optimization Tips</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Storage Optimization</h4>
                              <p className="text-xs text-gray-600 mt-1">Clear app cache regularly to maintain optimal performance. Current cache size: 45MB (recommended: &lt;50MB).</p>
                              <button className="text-xs text-green-600 hover:underline mt-2">Clear Cache Now</button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Smartphone className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Battery Saving Mode</h4>
                              <p className="text-xs text-gray-600 mt-1">Enable power-saving features during long driving sessions. This can extend battery life by up to 25%.</p>
                              <button className="text-xs text-blue-600 hover:underline mt-2">Enable Power Saver</button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Download className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Offline Maps Update</h4>
                              <p className="text-xs text-gray-600 mt-1">Download updated offline maps for your area to reduce data usage and improve navigation accuracy.</p>
                              <button className="text-xs text-purple-600 hover:underline mt-2">Update Maps</button>
                            </div>
                          </div>
                        </div>

                        {/* System Health Score */}
                        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 mt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">Overall System Health</p>
                              <p className="text-xs text-gray-400">Device and app performance score</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-400">A</p>
                              <p className="text-xs text-gray-400">Excellent condition</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Tech Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="p-4 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900">Report Bug</span>
                      </div>
                      <p className="text-xs text-red-600">Submit technical issue</p>
                    </button>

                    <button className="p-4 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Download className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Download Logs</span>
                      </div>
                      <p className="text-xs text-blue-600">Get diagnostic data</p>
                    </button>

                    <button className="p-4 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Wrench className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Run Diagnostics</span>
                      </div>
                      <p className="text-xs text-green-600">System health check</p>
                    </button>

                    <button className="p-4 text-left border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Settings className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">App Settings</span>
                      </div>
                      <p className="text-xs text-purple-600">Optimize configuration</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Training Tab */}
            {selectedTab === 'training' && (
              <div className="space-y-8">
                {/* Training Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Driver Training Management</h2>
                      <p className="text-sm text-gray-600">Manage driver's training progress, certifications, and skill development</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Export Training Report</span>
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Assign Training</span>
                      </button>
                    </div>
                  </div>

                  {/* Training Progress Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Complete</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Courses Completed</p>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                        <p className="text-xs text-green-600 font-medium mt-1">+2 this month</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-gray-900">2</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">Customer service track</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Score</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Training Score</p>
                        <p className="text-2xl font-bold text-gray-900">92%</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">Excellent performance</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Hours</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Training Hours</p>
                        <p className="text-2xl font-bold text-gray-900">47</p>
                        <p className="text-xs text-orange-600 font-medium mt-1">Professional development</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Courses */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Assigned Training Programs</h2>
                      <p className="text-sm text-gray-600">Currently assigned courses and training progress</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Advanced Customer Service */}
                    <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Advanced Customer Service Excellence</h3>
                          <p className="text-xs text-gray-500">6 hours • 85% complete • 5 of 6 modules • Due tomorrow</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-2 bg-gray-200 rounded-full">
                          <div className="w-10 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">85%</span>
                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">View</button>
                      </div>
                    </div>

                    {/* Safety & Emergency Response */}
                    <div className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Safety & Emergency Response</h3>
                          <p className="text-xs text-gray-500">4 hours • 45% complete • 3 of 7 modules • Mandatory</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-2 bg-gray-200 rounded-full">
                          <div className="w-5 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">45%</span>
                        <button className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">View</button>
                      </div>
                    </div>

                    {/* Additional Training Items */}
                    <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Award className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Vehicle Maintenance Basics</h3>
                          <p className="text-xs text-gray-500">3 hours • Completed Aug 15, 2023 • Score: 95%</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Completed</span>
                        <button className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100">View</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed Certifications */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Driver Certifications</h2>
                      <p className="text-sm text-gray-600">Earned certifications and professional achievements</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <option>All Certificates</option>
                        <option>Safety & Compliance</option>
                        <option>Customer Service</option>
                        <option>Technical Skills</option>
                      </select>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                        Download All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Defensive Driving Certification */}
                    <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">Defensive Driving Mastery</h3>
                            <p className="text-sm text-gray-600 mb-2">Advanced road safety and hazard awareness</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Completed: Aug 15, 2024</span>
                              <span>•</span>
                              <span>Score: 96%</span>
                              <span>•</span>
                              <span className="text-green-600 font-medium">Certified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Certification Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Certificate ID</p>
                            <p className="font-medium text-gray-900">#DDM-2024-0815</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Valid Until</p>
                            <p className="font-medium text-gray-900">Aug 15, 2026</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Issued By</p>
                            <p className="font-medium text-gray-900">Xpress Training Academy</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Credit Hours</p>
                            <p className="font-medium text-gray-900">12 hours</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active Certificate</span>
                        <button className="text-sm text-green-600 hover:underline">Download PDF</button>
                      </div>
                    </div>

                    {/* Customer Service Excellence */}
                    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">Customer Service Pro</h3>
                            <p className="text-sm text-gray-600 mb-2">Professional communication and service delivery</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Completed: Jul 22, 2024</span>
                              <span>•</span>
                              <span>Score: 94%</span>
                              <span>•</span>
                              <span className="text-blue-600 font-medium">Certified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Certification Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Certificate ID</p>
                            <p className="font-medium text-gray-900">#CSP-2024-0722</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Valid Until</p>
                            <p className="font-medium text-gray-900">Jul 22, 2026</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Issued By</p>
                            <p className="font-medium text-gray-900">Service Excellence Institute</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Credit Hours</p>
                            <p className="font-medium text-gray-900">8 hours</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active Certificate</span>
                        <button className="text-sm text-blue-600 hover:underline">Download PDF</button>
                      </div>
                    </div>

                    {/* Vehicle Maintenance */}
                    <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">Basic Vehicle Maintenance</h3>
                            <p className="text-sm text-gray-600 mb-2">Preventive care and troubleshooting basics</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Completed: Jun 10, 2024</span>
                              <span>•</span>
                              <span>Score: 89%</span>
                              <span>•</span>
                              <span className="text-purple-600 font-medium">Certified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Certification Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Certificate ID</p>
                            <p className="font-medium text-gray-900">#BVM-2024-0610</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Valid Until</p>
                            <p className="font-medium text-gray-900">Jun 10, 2027</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Issued By</p>
                            <p className="font-medium text-gray-900">Automotive Training Center</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Credit Hours</p>
                            <p className="font-medium text-gray-900">6 hours</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Active Certificate</span>
                        <button className="text-sm text-purple-600 hover:underline">Download PDF</button>
                      </div>
                    </div>

                    {/* Digital App Proficiency */}
                    <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-sm font-medium text-gray-900">Digital App Proficiency</h3>
                            <p className="text-sm text-gray-600 mb-2">Advanced app features and productivity tools</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Completed: May 5, 2024</span>
                              <span>•</span>
                              <span>Score: 91%</span>
                              <span>•</span>
                              <span className="text-orange-600 font-medium">Certified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Certification Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Certificate ID</p>
                            <p className="font-medium text-gray-900">#DAP-2024-0505</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Valid Until</p>
                            <p className="font-medium text-gray-900">May 5, 2025</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Issued By</p>
                            <p className="font-medium text-gray-900">Tech Skills Academy</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Credit Hours</p>
                            <p className="font-medium text-gray-900">4 hours</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Expiring Soon</span>
                        <button className="text-sm text-orange-600 hover:underline">Download PDF</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Courses */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Training Catalog</h2>
                      <p className="text-sm text-gray-600">Available courses to assign to this driver</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
                        <option>All Categories</option>
                        <option>Safety & Compliance</option>
                        <option>Customer Service</option>
                        <option>Technical Skills</option>
                        <option>Business Development</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Advanced Navigation */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Navigation className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Recommended</span>
                      </div>
                      
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-2">Advanced Navigation & Routes</h3>
                      <p className="text-sm text-gray-600 mb-4">Master efficient routing and traffic management strategies</p>
                      
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>5 hours • Self-paced</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4" />
                          <span>Certificate included</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4" />
                          <span>4.8/5 rating (234 reviews)</span>
                        </div>
                      </div>

                      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Assign to Driver
                      </button>
                    </div>

                    {/* Emergency Response */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Mandatory</span>
                      </div>
                      
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-2">Emergency Response Training</h3>
                      <p className="text-sm text-gray-600 mb-4">Critical safety protocols for emergency situations</p>
                      
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>3 hours • Interactive</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4" />
                          <span>Safety certification</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span>Deadline: Next week</span>
                        </div>
                      </div>

                      <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
                        Assign Mandatory Training
                      </button>
                    </div>

                    {/* Business Skills */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Popular</span>
                      </div>
                      
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-2">Driver Entrepreneurship</h3>
                      <p className="text-sm text-gray-600 mb-4">Build your personal brand and maximize earnings</p>
                      
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>8 hours • Live sessions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4" />
                          <span>Business certificate</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4" />
                          <span>4.9/5 rating (89 reviews)</span>
                        </div>
                      </div>

                      <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Request Access
                      </button>
                    </div>
                  </div>
                </div>

                {/* Training Analytics */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Training Analytics</h2>
                      <p className="text-sm text-gray-600">Driver's learning progress and performance analysis</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Learning Statistics */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Learning Performance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Award className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Average Score</p>
                              <p className="text-xs text-gray-600">Across all completed courses</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">92%</p>
                            <p className="text-xs text-green-600">Excellent</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Study Consistency</p>
                              <p className="text-xs text-gray-600">Regular learning habits</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">89%</p>
                            <p className="text-xs text-blue-600">Very Good</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Target className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Goal Achievement</p>
                              <p className="text-xs text-gray-600">Training objectives met</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">95%</p>
                            <p className="text-xs text-purple-600">Outstanding</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Learning Recommendations */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4">Personalized Recommendations</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Strength Area</h4>
                              <p className="text-xs text-gray-600 mt-1">Customer service excellence is this driver's strongest skill. Consider recommending for mentor role.</p>
                              <button className="text-xs text-blue-600 hover:underline mt-2">Recommend for Mentor Program</button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Target className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Improvement Area</h4>
                              <p className="text-xs text-gray-600 mt-1">Technical troubleshooting skills need development. Recommend assigning Vehicle Diagnostics course.</p>
                              <button className="text-xs text-orange-600 hover:underline mt-2">Assign Training</button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Award className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Next Milestone</h4>
                              <p className="text-xs text-gray-600 mt-1">Driver is 2 courses away from earning the "Professional Driver Expert" badge. Excellent progress!</p>
                              <button className="text-xs text-green-600 hover:underline mt-2">Track Progress</button>
                            </div>
                          </div>
                        </div>

                        {/* Overall Learning Health */}
                        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 mt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">Learning Health Score</p>
                              <p className="text-xs text-gray-400">Overall training engagement</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-400">A+</p>
                              <p className="text-xs text-gray-400">Top 10% learner</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Training Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="p-4 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Assign Training</span>
                      </div>
                      <p className="text-xs text-blue-600">Assign new course to driver</p>
                    </button>

                    <button className="p-4 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Download className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Export Training Data</span>
                      </div>
                      <p className="text-xs text-green-600">Download training reports</p>
                    </button>

                    <button className="p-4 text-left border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Training Analytics</span>
                      </div>
                      <p className="text-xs text-purple-600">View detailed reports</p>
                    </button>

                    <button className="p-4 text-left border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <Settings className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Training Settings</span>
                      </div>
                      <p className="text-xs text-orange-600">Manage training preferences</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Profile Tab */}
            {selectedTab === 'risk' && (
              <div className="space-y-8">
                {/* Risk Overview - Powered by Nexus AI */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <span>Risk Profile Assessment</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Powered by Nexus AI</span>
                      </h2>
                      <p className="text-sm text-gray-600">Comprehensive risk analysis and management system</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Export Risk Report</span>
                      </button>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Escalate</span>
                      </button>
                    </div>
                  </div>

                  {/* Risk Score Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    {/* Overall Risk Score */}
                    <div className="md:col-span-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">HIGH RISK</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Overall Risk Score</p>
                        <p className="text-3xl font-bold text-red-600">7.8/10</p>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Risk Level</span>
                            <span>78%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: '78%'}}></div>
                          </div>
                        </div>
                        <p className="text-xs text-red-600 font-medium mt-2">↑ 12% increase this week</p>
                      </div>
                    </div>

                    {/* Financial Risk */}
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Medium</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Financial Risk</p>
                        <p className="text-lg font-bold text-gray-900">6.2/10</p>
                        <p className="text-xs text-orange-600 font-medium mt-1">Negative balance history</p>
                      </div>
                    </div>

                    {/* Safety Risk */}
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">High</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Safety Risk</p>
                        <p className="text-lg font-bold text-gray-900">8.5/10</p>
                        <p className="text-xs text-red-600 font-medium mt-1">Recent incidents</p>
                      </div>
                    </div>

                    {/* Behavioral Risk */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-yellow-600" />
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Medium</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Behavioral Risk</p>
                        <p className="text-lg font-bold text-gray-900">7.1/10</p>
                        <p className="text-xs text-yellow-600 font-medium mt-1">Pattern anomalies</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Trend Analysis - Compact */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm text-sm font-medium text-gray-900">30-Day Risk Trend</h3>
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-gray-600">Driver: 7.8</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">Fleet Avg: 5.2</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-red-500" />
                          <span className="text-red-600 font-medium">↑12%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end space-x-1 h-12">
                      {/* Simplified bar chart representation */}
                      <div className="flex-1 bg-orange-200 rounded-t" style={{height: '45%'}}></div>
                      <div className="flex-1 bg-orange-300 rounded-t" style={{height: '50%'}}></div>
                      <div className="flex-1 bg-orange-400 rounded-t" style={{height: '60%'}}></div>
                      <div className="flex-1 bg-red-300 rounded-t" style={{height: '65%'}}></div>
                      <div className="flex-1 bg-red-400 rounded-t" style={{height: '70%'}}></div>
                      <div className="flex-1 bg-red-500 rounded-t" style={{height: '75%'}}></div>
                      <div className="flex-1 bg-red-600 rounded-t" style={{height: '80%'}}></div>
                      <div className="flex-1 bg-red-700 rounded-t" style={{height: '85%'}}></div>
                      <div className="flex-1 bg-red-800 rounded-t" style={{height: '90%'}}></div>
                      <div className="flex-1 bg-red-900 rounded-t" style={{height: '100%'}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Aug 5</span>
                      <span>Sep 2</span>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators & Alerts */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Risk Indicators & Active Alerts</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Financial Indicators */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4 flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                        <span>Financial Risk Indicators</span>
                      </h3>
                      <div className="space-y-3">
                        <button className="w-full p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left" onClick={() => {
                          setSelectedTransaction({
                            type: 'Outstanding Commission Debt Analysis',
                            severity: 'Critical',
                            amount: '₱800',
                            daysOverdue: '3+ days',
                            riskLevel: 'CRITICAL',
                            details: {
                              totalDebt: '₱800',
                              accumulatedSince: 'August 29, 2024',
                              tripsCausing: '12 cash trips',
                              lastPayment: '₱200 on August 25, 2024',
                              impactOnOperations: 'Trip assignment suspended until resolved'
                            },
                            paymentHistory: [
                              { date: 'Aug 25', amount: '₱200', status: 'Paid' },
                              { date: 'Aug 27', amount: '₱300', status: 'Overdue' },
                              { date: 'Aug 29', amount: '₱300', status: 'Overdue' }
                            ],
                            recommendedActions: [
                              'Immediate payment required to restore trip access',
                              'Contact driver for payment arrangement',
                              'Consider debt consolidation options',
                              'Monitor future cash trip patterns'
                            ],
                            escalationPath: 'Finance Team → Collections → Legal (if >₱2000)',
                            id: 'DEBT-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-gray-900">Outstanding Commission Debt</span>
                              <div className="relative group">
                                <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Driver owes platform commission from cash trips.<br/>
                                  Accumulated debt prevents new trip assignments.<br/>
                                  Requires immediate payment to restore access.
                                </div>
                              </div>
                            </div>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">CRITICAL</span>
                          </div>
                          <p className="text-xs text-red-600 mt-1 ml-7">Commission owed: ₱800 (3+ days overdue)</p>
                        </button>

                        <button className="w-full p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors text-left" onClick={() => {
                          setSelectedTransaction({
                            type: 'Earnings Anomaly Analysis',
                            severity: 'High',
                            anomalyType: 'Significant earnings drop',
                            riskLevel: 'HIGH',
                            details: {
                              currentWeeklyEarnings: '₱2,400',
                              baselineWeeklyEarnings: '₱6,000',
                              percentageChange: '-60%',
                              detectionDate: 'September 1, 2024',
                              analysisWindow: '7 days',
                              confidenceLevel: '94%'
                            },
                            possibleCauses: [
                              'Reduced working hours or availability',
                              'Vehicle maintenance issues affecting trips',
                              'Market conditions or competition changes',
                              'Potential gaming or fraud attempt',
                              'Personal circumstances affecting performance'
                            ],
                            aiAnalysis: {
                              pattern: 'Sharp decline in trip acceptance rate',
                              correlation: 'Earnings drop correlates with 40% fewer trip completions',
                              recommendation: 'Investigation recommended within 48 hours'
                            },
                            nextSteps: [
                              'Contact driver to understand circumstances',
                              'Review trip patterns and acceptance rates',
                              'Check for technical issues or app problems',
                              'Analyze market conditions in driver area'
                            ],
                            id: 'EARN-ANOM-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-gray-900">Earnings Anomaly Detection</span>
                              <div className="relative group">
                                <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  AI detected unusual patterns in driver earnings.<br/>
                                  May indicate operational issues, fraud, or<br/>
                                  changes in driver behavior requiring investigation.
                                </div>
                              </div>
                            </div>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">HIGH</span>
                          </div>
                          <p className="text-xs text-orange-600 mt-1 ml-7">60% earnings drop vs baseline (7 days)</p>
                        </button>

                        <button className="w-full p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors text-left" onClick={() => {
                          setSelectedTransaction({
                            type: 'Payout Processing Issues Analysis',
                            severity: 'Medium',
                            riskLevel: 'MEDIUM',
                            failedAttempts: 2,
                            timeframe: '48 hours',
                            details: {
                              lastSuccessfulPayout: 'August 28, 2024 - ₱1,500',
                              failureReasons: [
                                'Invalid bank account details',
                                'Insufficient funds in platform account'
                              ],
                              affectedAmount: '₱2,800',
                              bankDetails: 'BPI Savings Account ****-5789',
                              systemErrors: 'API timeout, validation failure'
                            },
                            failureLog: [
                              { date: 'Sep 1, 10:30 AM', amount: '₱1,400', error: 'Bank validation failed' },
                              { date: 'Sep 2, 2:15 PM', amount: '₱1,400', error: 'API timeout after 30s' }
                            ],
                            impact: {
                              driverFrustration: 'High - waiting for promised payments',
                              operationalRisk: 'Driver may reduce activity or switch platforms',
                              reputationRisk: 'Negative reviews about payment reliability'
                            },
                            resolutionSteps: [
                              'Verify and update bank account information',
                              'Manual payout processing with supervisor approval',
                              'Contact bank to resolve validation issues',
                              'Implement retry mechanism for failed transfers'
                            ],
                            retrySchedule: 'Next attempt: September 4, 2024 at 10:00 AM',
                            id: 'PAYOUT-FAIL-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-gray-900">Payout Processing Issues</span>
                              <div className="relative group">
                                <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Multiple failed attempts to process driver payouts.<br/>
                                  Could indicate invalid bank details, insufficient<br/>
                                  funds, or system integration issues.
                                </div>
                              </div>
                            </div>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">MEDIUM</span>
                          </div>
                          <p className="text-xs text-yellow-600 mt-1 ml-7">2 failed transfers in past 48 hours</p>
                        </button>
                      </div>
                    </div>

                    {/* Safety & Behavioral Indicators */}
                    <div>
                      <h3 className="text-md text-sm font-medium text-gray-900 mb-4 flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-red-600" />
                        <span>Safety & Behavioral Indicators</span>
                      </h3>
                      <div className="space-y-3">
                        <button className="w-full p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left" onClick={() => {
                          setSelectedTransaction({
                            type: 'Traffic Incident Analysis',
                            severity: 'Critical',
                            riskLevel: 'CRITICAL',
                            caseNumber: 'SF-2024-0901',
                            incidentType: 'Vehicle collision',
                            details: {
                              date: 'September 1, 2024',
                              time: '2:45 PM',
                              location: 'EDSA-Shaw Boulevard Intersection',
                              incidentType: 'Minor rear-end collision',
                              injuriesReported: 'None',
                              policeReport: 'Filed - Report #2024-09-0134'
                            },
                            parties: {
                              driver: 'Juan Miguel Santos',
                              passenger: 'Maria Rodriguez (minor injuries)',
                              otherParty: 'Private vehicle (Honda Civic)',
                              witnesses: '2 witnesses interviewed'
                            },
                            damageAssessment: {
                              vehicleDamage: 'Rear bumper damage, estimated ₱12,000',
                              thirdPartyDamage: 'Front bumper damage, estimated ₱8,000',
                              totalCost: 'Approximately ₱20,000'
                            },
                            insurance: {
                              status: 'Claim filed with Malayan Insurance',
                              claimNumber: 'MI-2024-090134',
                              coverage: 'Comprehensive with ₱5,000 deductible',
                              estimatedResolution: '7-14 business days'
                            },
                            immediateActions: [
                              'Driver suspended pending investigation',
                              'Vehicle removed from platform temporarily',
                              'Safety training mandatory before reinstatement',
                              'Insurance claim processing initiated'
                            ],
                            followUpRequired: [
                              'Driving record review',
                              'Safety assessment evaluation',
                              'Insurance premium impact analysis',
                              'Passenger compensation if needed'
                            ],
                            id: 'INCIDENT-SF-2024-0901'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-gray-900">Traffic Incident Report</span>
                              <div className="relative group">
                                <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Recent traffic incident involving driver.<br/>
                                  May affect insurance premiums and safety score.<br/>
                                  Requires safety training and monitoring.
                                </div>
                              </div>
                            </div>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">CRITICAL</span>
                          </div>
                          <p className="text-xs text-red-600 mt-1 ml-7">Vehicle collision (Case #SF-2024-0901)</p>
                        </button>

                        <button className="w-full p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors text-left" onClick={() => {
                          setSelectedTransaction({
                            type: 'Customer Service Issues Analysis',
                            severity: 'High',
                            riskLevel: 'HIGH',
                            totalComplaints: 3,
                            timeframe: '7 days',
                            status: 'Unresolved',
                            details: {
                              averageRating: '3.2/5.0 (down from 4.7)',
                              complaintTrend: 'Increasing - 300% above normal',
                              ratingImpact: 'Overall rating dropped 1.5 points',
                              customerRetention: 'At risk - 2 customers switched drivers'
                            },
                            complaints: [
                              {
                                id: 'CS-2024-0829',
                                date: 'Aug 29',
                                type: 'Unprofessional behavior',
                                description: 'Driver was rude and refused to follow GPS directions',
                                customerRating: '1 star',
                                status: 'Open'
                              },
                              {
                                id: 'CS-2024-0831',
                                date: 'Aug 31',
                                type: 'Vehicle condition',
                                description: 'Car was dirty, AC not working, strong odor',
                                customerRating: '2 stars',
                                status: 'Investigating'
                              },
                              {
                                id: 'CS-2024-0902',
                                date: 'Sep 2',
                                type: 'Trip completion',
                                description: 'Driver ended trip early, overcharged for distance',
                                customerRating: '1 star',
                                status: 'Escalated'
                              }
                            ],
                            impact: {
                              revenueRisk: 'Potential ₱5,000 weekly revenue loss',
                              reputationDamage: 'Platform rating impact',
                              customerChurn: '15% increase in driver change requests'
                            },
                            recommendedActions: [
                              'Immediate customer service training required',
                              'Vehicle inspection and deep cleaning',
                              'Behavioral coaching and monitoring',
                              'Customer compensation for poor experiences',
                              'Probationary period with enhanced supervision'
                            ],
                            escalationStatus: 'Flagged for Customer Success Manager review',
                            id: 'CS-ISSUES-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Users className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-gray-900">Customer Service Issues</span>
                              <div className="relative group">
                                <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Multiple customer complaints received.<br/>
                                  Issues may include service quality, behavior,<br/>
                                  or trip-related problems requiring attention.
                                </div>
                              </div>
                            </div>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">HIGH</span>
                          </div>
                          <p className="text-xs text-orange-600 mt-1 ml-7">3 unresolved complaints (7 days)</p>
                        </button>

                        <button className="w-full p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-left" onClick={() => {
                          setSelectedTransaction({
                            type: 'Behavioral Pattern Analysis',
                            severity: 'Medium',
                            riskLevel: 'MEDIUM',
                            detectedPattern: 'Trip acceptance rate anomaly',
                            details: {
                              currentAcceptanceRate: '54%',
                              historicalBaseline: '77%',
                              percentageChange: '-23% below baseline',
                              detectionDate: 'August 30, 2024',
                              analysisWindow: '14 days',
                              aiConfidence: '91%'
                            },
                            behaviorAnalysis: {
                              primaryPattern: 'Selective trip acceptance based on distance/fare',
                              secondaryPattern: 'Increased cancellation rate after acceptance',
                              temporalAnalysis: 'Pattern most pronounced during peak hours',
                              geographicBias: 'Avoiding trips to certain areas consistently'
                            },
                            possibleReasons: [
                              'Cherry-picking higher fare trips',
                              'Avoiding low-profit or difficult routes',
                              'Personal circumstances affecting availability',
                              'Vehicle issues limiting range of operations',
                              'Gaming attempt to manipulate algorithm'
                            ],
                            impactAssessment: {
                              operationalImpact: 'Reduced platform efficiency',
                              passengerExperience: 'Longer wait times in affected areas',
                              revenueImpact: 'Estimated ₱2,000 weekly loss',
                              platformIntegrity: 'Algorithm manipulation concerns'
                            },
                            aiRecommendations: [
                              'Schedule interview to understand driver circumstances',
                              'Implement acceptance rate monitoring with thresholds',
                              'Review incentive structure for affected areas',
                              'Consider behavioral coaching or retraining',
                              'Monitor pattern for 7 more days before escalation'
                            ],
                            correlationData: {
                              earningsImpact: 'No significant earnings change detected',
                              ratingImpact: 'Slight improvement in ratings (4.6 to 4.7)',
                              competitiveActivity: 'No unusual competitor activity in area'
                            },
                            id: 'BEHAVIOR-PATTERN-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <TrendingDown className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-gray-900">Behavioral Pattern Alert</span>
                              <div className="relative group">
                                <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  AI detected unusual behavioral patterns.<br/>
                                  May indicate operational changes, gaming<br/>
                                  attempts, or personal circumstances.
                                </div>
                              </div>
                            </div>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">MEDIUM</span>
                          </div>
                          <p className="text-xs text-purple-600 mt-1 ml-7">Trip acceptance: 23% below baseline</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Mitigation & Escalation Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Risk Mitigation & Escalation</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Immediate Actions */}
                    <div>
                      <h3 className="text-md font-semibold text-red-900 mb-4 flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span>Immediate Actions</span>
                      </h3>
                      <div className="space-y-3">
                        <button className="w-full p-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Driver Suspension',
                            action: 'Immediate platform suspension',
                            severity: 'Critical',
                            reason: 'High risk score and recent safety incidents',
                            impact: 'Driver will be unable to receive new trip requests',
                            duration: 'Indefinite pending review',
                            approver: 'Safety Manager approval required',
                            id: 'SUS-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="text-sm font-medium text-red-900">Suspend Driver</p>
                              <p className="text-xs text-red-600">Immediate platform suspension</p>
                            </div>
                          </div>
                        </button>

                        <button className="w-full p-3 text-left border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Geographic Restrictions',
                            action: 'Limit operating areas',
                            severity: 'High',
                            reason: 'Risk mitigation in high-incident areas',
                            impact: 'Driver restricted to designated safe zones',
                            duration: '30 days (renewable)',
                            approver: 'Operations Manager approval',
                            id: 'GEO-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="text-sm font-medium text-orange-900">Geographic Restrictions</p>
                              <p className="text-xs text-orange-600">Limit operating areas</p>
                            </div>
                          </div>
                        </button>

                        <button className="w-full p-3 text-left border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Time Restrictions',
                            action: 'Limit operating hours',
                            severity: 'Medium',
                            reason: 'Risk reduction during peak incident hours',
                            impact: 'Driver limited to 6AM-10PM operations',
                            duration: '14 days (reviewable)',
                            approver: 'Shift Supervisor approval',
                            id: 'TIME-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <div>
                              <p className="text-sm font-medium text-yellow-900">Time Restrictions</p>
                              <p className="text-xs text-yellow-600">Limit operating hours</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Escalation Channels */}
                    <div>
                      <h3 className="text-md font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        <span>Escalate To</span>
                      </h3>
                      <div className="space-y-3">
                        <button className="w-full p-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Safety Department Escalation',
                            department: 'Safety Operations',
                            severity: 'Critical',
                            reason: 'Recent traffic incident and high safety risk score',
                            action: 'Immediate safety review and intervention',
                            contact: 'Sarah Chen - Safety Manager',
                            timeline: 'Within 2 hours',
                            id: 'ESC-SAF-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <Shield className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="text-sm font-medium text-red-900">Safety Department</p>
                              <p className="text-xs text-red-600">Critical safety incidents</p>
                            </div>
                          </div>
                        </button>

                        <button className="w-full p-3 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Legal Department Escalation',
                            department: 'Legal & Compliance',
                            severity: 'High',
                            reason: 'Pattern violations and regulatory compliance issues',
                            action: 'Legal review and compliance audit',
                            contact: 'Miguel Santos - Legal Counsel',
                            timeline: 'Within 24 hours',
                            id: 'ESC-LEG-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Legal Department</p>
                              <p className="text-xs text-blue-600">Compliance violations</p>
                            </div>
                          </div>
                        </button>

                        <button className="w-full p-3 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Finance Department Escalation',
                            department: 'Financial Operations',
                            severity: 'High',
                            reason: 'Outstanding commission debt and payment irregularities',
                            action: 'Financial audit and debt recovery process',
                            contact: 'Lisa Rodriguez - Finance Manager',
                            timeline: 'Within 8 hours',
                            id: 'ESC-FIN-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-900">Finance Department</p>
                              <p className="text-xs text-green-600">Financial irregularities</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Monitoring & Documentation */}
                    <div>
                      <h3 className="text-md font-semibold text-purple-900 mb-4 flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <span>Monitoring</span>
                      </h3>
                      <div className="space-y-3">
                        <button className="w-full p-3 text-left border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Enhanced Monitoring Setup',
                            action: 'Increase tracking frequency',
                            severity: 'Medium',
                            reason: 'High-risk driver requires closer supervision',
                            monitoring: 'Real-time GPS, trip-by-trip analysis, daily check-ins',
                            frequency: 'Every 2 hours during active periods',
                            duration: '30 days',
                            id: 'MON-ENH-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">Enhanced Monitoring</p>
                              <p className="text-xs text-purple-600">Increase tracking frequency</p>
                            </div>
                          </div>
                        </button>

                        <button className="w-full p-3 text-left border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Risk Case Documentation',
                            action: 'Create comprehensive case file',
                            severity: 'High',
                            reason: 'Multiple risk indicators require formal documentation',
                            documentation: 'Incident reports, risk analysis, action plans',
                            assignee: 'Risk Management Team',
                            timeline: 'Case file created within 4 hours',
                            id: 'DOC-CASE-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <div>
                              <p className="text-sm font-medium text-indigo-900">Document Case</p>
                              <p className="text-xs text-indigo-600">Create risk case file</p>
                            </div>
                          </div>
                        </button>

                        <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => {
                          setSelectedTransaction({
                            type: 'Custom Risk Alerts',
                            action: 'Configure risk threshold alerts',
                            severity: 'Medium',
                            reason: 'Proactive monitoring for risk escalation',
                            alerts: 'Risk score >8.0, safety incidents, earnings anomalies',
                            notifications: 'Email, SMS, dashboard alerts',
                            recipients: 'Operations Manager, Risk Team',
                            id: 'ALT-CUST-2024-090401'
                          });
                          setShowTransactionModal(true);
                        }}>
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Set Alerts</p>
                              <p className="text-xs text-gray-600">Custom risk thresholds</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Comparison & Benchmarking */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Risk Benchmarking</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">vs Fleet Average</h4>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Above Average</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Driver Score</span>
                          <span className="font-medium text-red-600">7.8/10</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Fleet Average</span>
                          <span className="font-medium text-gray-900">4.2/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: '78%'}}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Market Benchmark</h4>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Industry Data</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Driver Score</span>
                          <span className="font-medium text-red-600">7.8/10</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Industry Avg</span>
                          <span className="font-medium text-gray-900">3.9/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '39%'}}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Risk Reduction Target</h4>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Target</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Current Score</span>
                          <span className="font-medium text-red-600">7.8/10</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Target Score</span>
                          <span className="font-medium text-green-600">≤ 5.0/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '50%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {selectedTab === 'bookings' && (
              <div className="space-y-8">
                {/* Trip Statistics */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Trip History & Analytics</h2>
                      <p className="text-sm text-gray-600">Comprehensive booking analysis and trip management</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="relative date-picker-container">
                        <button
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="text-sm border border-blue-300 bg-blue-50 text-blue-600 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-100 transition-colors flex items-center space-x-2"
                        >
                          <span>{selectedDateRange}</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showDatePicker && <DatePicker />}
                      </div>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Trip Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Route className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Trips</p>
                          <p className="text-lg font-bold text-gray-900">45</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Completed</p>
                          <p className="text-lg font-bold text-gray-900">42</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Cancelled</p>
                          <p className="text-lg font-bold text-gray-900">3</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Completion Rate</p>
                          <p className="text-lg font-bold text-gray-900">93.3%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Acceptance Rate</p>
                          <p className="text-lg font-bold text-gray-900">97%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Timer className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Avg Duration</p>
                          <p className="text-lg font-bold text-gray-900">28min</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Performance Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Peak Hours Performance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Morning Rush (7-9 AM)</p>
                            <p className="text-xs text-gray-500">12 trips completed</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">₱6,200</p>
                            <p className="text-xs text-gray-500">Avg: ₱517</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Evening Rush (5-8 PM)</p>
                            <p className="text-xs text-gray-500">15 trips completed</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">₱8,750</p>
                            <p className="text-xs text-gray-500">Avg: ₱583</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Off-Peak Hours</p>
                            <p className="text-xs text-gray-500">15 trips completed</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-600">₱3,800</p>
                            <p className="text-xs text-gray-500">Avg: ₱253</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Popular Routes</h3>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Makati CBD → BGC</p>
                            <p className="text-xs text-gray-500">8 trips • ₱3,200 total</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">2</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">EDSA → Ortigas</p>
                            <p className="text-xs text-gray-500">6 trips • ₱2,400 total</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">3</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Airport → Makati</p>
                            <p className="text-xs text-gray-500">5 trips • ₱2,750 total</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">4</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">QC → Manila</p>
                            <p className="text-xs text-gray-500">4 trips • ₱1,600 total</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Customer Ratings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">5 Stars</span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{width: '78%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">33 trips</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">4 Stars</span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{width: '19%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">8 trips</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-gray-300" />
                            <span className="text-sm font-medium">3 Stars</span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-400 h-2 rounded-full" style={{width: '2%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">1 trip</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">4.8</p>
                            <p className="text-sm text-gray-500">Average Rating</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Trip History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Trip History</h2>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search trips..."
                          className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Trip List */}
                  <div className="space-y-2">
                    {/* Completed Trip Row */}
                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090403',
                          type: 'Completed Trip',
                          route: 'BGC → Makati CBD',
                          fullFare: '₱420',
                          commission: '-₱63',
                          driverEarnings: '₱357',
                          customer: 'Maria Santos',
                          rating: 5.0,
                          date: 'Today, 2:45 PM - 3:20 PM',
                          distance: '8.5 km',
                          duration: '35 min',
                          paymentMethod: 'GCash',
                          status: 'Completed',
                          pickup: 'Bonifacio Global City',
                          dropoff: 'Makati Central Business District',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱85',
                            timeFare: '₱35',
                            surge: 'None',
                            tips: '₱0',
                            tollFees: '₱0',
                            extras: 'None'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">BGC → Makati CBD</h3>
                          <p className="text-xs text-gray-500">Today, 2:45 PM - 3:20 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">8.5 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">35 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Maria Santos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">5.0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱420</p>
                        </div>
                      </div>
                    </div>

                    {/* Cancelled Trip Row */}
                    <div 
                      className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090404',
                          type: 'Cancelled Trip',
                          route: 'Ortigas → QC',
                          fullFare: '₱0',
                          commission: '₱0',
                          driverEarnings: '₱0',
                          compensation: '₱50',
                          customer: 'John Dela Cruz',
                          rating: 'N/A',
                          date: 'Yesterday, 5:15 PM',
                          waitTime: '12 min',
                          reason: 'No show',
                          paymentMethod: 'N/A',
                          status: 'Cancelled',
                          pickup: 'Ortigas Center',
                          dropoff: 'Quezon City',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          cancellationDetails: {
                            cancelledBy: 'Customer (No show)',
                            waitTime: '12 minutes',
                            compensation: '₱50',
                            reason: 'Customer did not appear at pickup location',
                            driverAction: 'Waited at pickup location',
                            timestamp: 'Yesterday, 5:15 PM'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Ortigas → QC</h3>
                          <p className="text-xs text-gray-500">Yesterday, 5:15 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Reason</p>
                          <p className="font-medium">No show</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Wait Time</p>
                          <p className="font-medium">12 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">John Dela Cruz</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Compensation</p>
                          <p className="font-medium text-green-600">₱50</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Cancelled</span>
                          <p className="text-lg font-bold text-red-600 mt-1">₱0</p>
                        </div>
                      </div>
                    </div>

                    {/* Completed Trip Row */}
                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090405',
                          type: 'Completed Trip',
                          route: 'NAIA Terminal 3 → Alabang',
                          fullFare: '₱680',
                          commission: '-₱102',
                          driverEarnings: '₱578',
                          customer: 'Robert Kim',
                          rating: 5.0,
                          date: 'Yesterday, 11:30 AM - 12:45 PM',
                          distance: '18.2 km',
                          duration: '75 min',
                          paymentMethod: 'Cash',
                          status: 'Completed',
                          pickup: 'NAIA Terminal 3',
                          dropoff: 'Alabang Town Center',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱182',
                            timeFare: '₱75',
                            surge: '1.5x (₱150)',
                            tips: '₱0',
                            tollFees: '₱233',
                            extras: 'Airport pickup fee: ₱50'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">NAIA Terminal 3 → Alabang</h3>
                          <p className="text-xs text-gray-500">Yesterday, 11:30 AM - 12:45 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">18.2 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">75 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Robert Kim</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">5.0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱680</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Completed Trips for Last 10 */}
                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090406',
                          type: 'Completed Trip',
                          route: 'Makati → Pasig',
                          fullFare: '₱520',
                          commission: '-₱78',
                          driverEarnings: '₱442',
                          customer: 'Jenny Cruz',
                          rating: 4.5,
                          date: 'Nov 27, 7:20 PM - 8:15 PM',
                          distance: '12.1 km',
                          duration: '55 min',
                          paymentMethod: 'GCash',
                          status: 'Completed',
                          pickup: 'Makati CBD',
                          dropoff: 'Pasig Central',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱121',
                            timeFare: '₱55',
                            surge: '1.2x (₱50)',
                            tips: '₱20',
                            tollFees: '₱234',
                            extras: 'None'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Makati → Pasig</h3>
                          <p className="text-xs text-gray-500">Nov 27, 7:20 PM - 8:15 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">12.1 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">55 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Sarah Cruz</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">4.8</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱585</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090407',
                          type: 'Completed Trip',
                          route: 'QC → Manila',
                          fullFare: '₱380',
                          commission: '-₱57',
                          driverEarnings: '₱323',
                          customer: 'Mark Gonzales',
                          rating: 4.8,
                          date: 'Nov 27, 2:10 PM - 2:45 PM',
                          distance: '9.8 km',
                          duration: '35 min',
                          paymentMethod: 'Cash',
                          status: 'Completed',
                          pickup: 'Quezon City Memorial Circle',
                          dropoff: 'Manila City Hall',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱98',
                            timeFare: '₱35',
                            surge: 'None',
                            tips: '₱15',
                            tollFees: '₱192',
                            extras: 'None'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">QC → Manila</h3>
                          <p className="text-xs text-gray-500">Nov 27, 2:10 PM - 2:45 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">9.8 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">35 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Mark Gonzales</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">5.0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱380</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090408',
                          type: 'Completed Trip',
                          route: 'Greenhills → Ortigas',
                          fullFare: '₱340',
                          commission: '-₱51',
                          driverEarnings: '₱289',
                          customer: 'Sarah Martinez',
                          rating: 4.9,
                          date: 'Nov 26, 6:30 PM - 7:05 PM',
                          distance: '7.2 km',
                          duration: '35 min',
                          paymentMethod: 'GCash',
                          status: 'Completed',
                          pickup: 'Greenhills Shopping Center',
                          dropoff: 'Ortigas Center',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱72',
                            timeFare: '₱35',
                            surge: 'None',
                            tips: '₱25',
                            tollFees: '₱168',
                            extras: 'None'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Greenhills → Ortigas</h3>
                          <p className="text-xs text-gray-500">Nov 26, 6:30 PM - 7:05 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">7.2 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">35 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Anna Lopez</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">4.9</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱295</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090409',
                          type: 'Completed Trip',
                          route: 'Taguig → BGC',
                          fullFare: '₱220',
                          commission: '-₱33',
                          driverEarnings: '₱187',
                          customer: 'Peter Wong',
                          rating: 5.0,
                          date: 'Nov 26, 1:15 PM - 1:40 PM',
                          distance: '5.5 km',
                          duration: '25 min',
                          paymentMethod: 'Cash',
                          status: 'Completed',
                          pickup: 'Taguig City Center',
                          dropoff: 'Bonifacio Global City',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱55',
                            timeFare: '₱25',
                            surge: 'None',
                            tips: '₱10',
                            tollFees: '₱90',
                            extras: 'None'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Taguig → BGC</h3>
                          <p className="text-xs text-gray-500">Nov 26, 1:15 PM - 1:40 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">5.5 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">25 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Peter Wong</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">5.0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱220</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090410',
                          type: 'Completed Trip',
                          route: 'Marikina → Cainta',
                          fullFare: '₱180',
                          commission: '-₱27',
                          driverEarnings: '₱153',
                          customer: 'Lisa Garcia',
                          rating: 4.7,
                          date: 'Nov 25, 4:45 PM - 5:15 PM',
                          distance: '4.8 km',
                          duration: '30 min',
                          paymentMethod: 'GCash',
                          status: 'Completed',
                          pickup: 'Marikina Sports Park',
                          dropoff: 'Cainta Town Center',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱48',
                            timeFare: '₱30',
                            surge: 'None',
                            tips: '₱5',
                            tollFees: '₱57',
                            extras: 'None'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Marikina → Cainta</h3>
                          <p className="text-xs text-gray-500">Nov 25, 4:20 PM - 4:55 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">8.9 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">35 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Lisa Chen</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">4.7</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱350</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction({
                          id: 'TR-2024-090411',
                          type: 'Completed Trip',
                          route: 'Alabang → Muntinlupa',
                          fullFare: '₱280',
                          commission: '-₱42',
                          driverEarnings: '₱238',
                          customer: 'Anna Rodriguez',
                          rating: 4.6,
                          date: 'Nov 25, 10:15 AM - 10:40 AM',
                          distance: '6.8 km',
                          duration: '25 min',
                          paymentMethod: 'Cash',
                          status: 'Completed',
                          pickup: 'Alabang Town Center',
                          dropoff: 'Muntinlupa City Hall',
                          vehicleUsed: '2020 Toyota Vios (ABC 1234)',
                          tripDetails: {
                            basefare: '₱40',
                            distanceFare: '₱68',
                            timeFare: '₱25',
                            surge: 'None',
                            tips: '₱12',
                            tollFees: '₱135',
                            extras: 'None'
                          }
                        });
                        setShowTransactionModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Alabang → Muntinlupa</h3>
                          <p className="text-xs text-gray-500">Nov 25, 10:15 AM - 10:40 AM</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium">6.8 km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">25 min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">Mike Torres</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium">5.0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                          <p className="text-lg font-bold text-green-600 mt-1">₱275</p>
                        </div>
                      </div>
                    </div>

                    {/* Load More Button */}
                    <div className="text-center pt-4">
                      <button className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors">
                        Load More Trips
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trip Analytics & Insights */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Trip Analytics & Insights</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Performance Trends */}
                    <div>
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Performance Trends</h3>
                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Weekly Earnings</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15%</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="text-2xl font-bold text-gray-900">₱8,420</div>
                            <div className="text-sm text-gray-500 mb-1">this week</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Trip Efficiency</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Stable</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="text-2xl font-bold text-gray-900">2.1</div>
                            <div className="text-sm text-gray-500 mb-1">trips/hour</div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Customer Retention</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">+8%</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="text-2xl font-bold text-gray-900">23%</div>
                            <div className="text-sm text-gray-500 mb-1">repeat customers</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Route Optimization */}
                    <div>
                      <h3 className="text-lg text-sm font-medium text-gray-900 mb-4">Route Optimization Insights</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MapIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Most Profitable Route</h4>
                              <p className="text-xs text-gray-600">BGC → Makati CBD during rush hours</p>
                              <p className="text-xs text-blue-600 font-medium mt-1">Avg: ₱587 per trip</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Timer className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Peak Demand Hours</h4>
                              <p className="text-xs text-gray-600">7-9 AM and 5-8 PM weekdays</p>
                              <p className="text-xs text-yellow-600 font-medium mt-1">2.5x higher demand</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Target className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Optimization Tip</h4>
                              <p className="text-xs text-gray-600">Position near Makati CBD at 4:30 PM for evening rush</p>
                              <p className="text-xs text-green-600 font-medium mt-1">+30% trip likelihood</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">Weekend Strategy</h4>
                              <p className="text-xs text-gray-600">Focus on leisure destinations: malls, entertainment</p>
                              <p className="text-xs text-purple-600 font-medium mt-1">Lower volume, higher value</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Only show on Insights tab */}
          {selectedTab === 'insights' && (
            <div className="space-y-6">
              
              {/* Driver Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Driver Information</h3>
                <div className="space-y-2">
                  <InfoRow label="Operator" value={driverData.operator} icon={Globe} />
                  <InfoRow label="Xpress Services" value={driverData.service} icon={Car} />
                  <InfoRow label="Gender" value={driverData.gender} icon={User} editable />
                  <InfoRow label="Date of Birth" value={driverData.birthDate} icon={Calendar} />
                  <InfoRow label="Email" value={driverData.email} icon={Mail} />
                  <InfoRow label="Home Address" value={driverData.address} icon={MapPin} />
                  <InfoRow label="Was referred?" value={driverData.wasReferred ? 'Yes' : 'No'} />
                  <InfoRow label="Referrer" value={driverData.referrer} />
                  <InfoRow label="Xpress Gears" value={driverData.xpressGears} />
                  <InfoRow label="Device" value={driverData.device} icon={Smartphone} />
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Vehicle Information</h3>
                <div className="space-y-2">
                  <InfoRow label="Make & Model" value={`${driverData.vehicle.make} ${driverData.vehicle.model}`} icon={Car} />
                  <InfoRow label="Year" value={driverData.vehicle.year} icon={Calendar} />
                  <InfoRow label="Plate Number" value={driverData.vehicle.plate} />
                  <InfoRow label="Color" value={driverData.vehicle.color} />
                  <InfoRow label="Service Type" value={driverData.service} />
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details Modal */}
          {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-700">{selectedTransaction.type}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    #{selectedTransaction.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{selectedTransaction.fullFare}</h3>
                <p className="text-sm text-blue-600">{selectedTransaction.pickup} → {selectedTransaction.dropoff}</p>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-4">
                <h4 className="text-md text-sm font-medium text-gray-900">Financial Breakdown</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Full Fare</span>
                    <span className="text-sm font-medium text-gray-900">{selectedTransaction.fullFare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Platform Commission (15%)</span>
                    <span className="text-sm font-medium text-red-600">{selectedTransaction.commission}</span>
                  </div>
                  {selectedTransaction.tip && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer Tip</span>
                      <span className="text-sm font-medium text-green-600">{selectedTransaction.tip}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Driver Earnings</span>
                      <span className="text-lg font-bold text-green-600">{selectedTransaction.driverEarnings}</span>
                    </div>
                  </div>
                  {selectedTransaction.note && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-3">
                      <p className="text-xs text-orange-700">{selectedTransaction.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trip Details or Retention Analysis Details */}
              {selectedTransaction.type === 'Driver Retention Analysis' ? (
                <div className="space-y-6">
                  {/* Retention Predictions */}
                  <div>
                    <h4 className="text-md text-sm font-medium text-gray-900 mb-3">Retention Predictions</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-700">30-day retention</span>
                        <span className="text-sm font-bold text-green-600">{selectedTransaction.predictions?.thirtyDay}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm text-gray-700">60-day retention</span>
                        <span className="text-sm font-bold text-yellow-600">{selectedTransaction.predictions?.sixtyDay}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-gray-700">90-day retention</span>
                        <span className="text-sm font-bold text-red-600">{selectedTransaction.predictions?.ninetyDay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div>
                    <h4 className="text-md text-sm font-medium text-gray-900 mb-3">Risk Factors</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-2">Positive Factors</h5>
                        <ul className="space-y-1">
                          {selectedTransaction.factors?.positive?.map((factor, index) => (
                            <li key={index} className="text-xs text-green-600 flex items-center">
                              <CheckCircle className="w-3 h-3 mr-2" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-red-700 mb-2">Risk Factors</h5>
                        <ul className="space-y-1">
                          {selectedTransaction.factors?.negative?.map((factor, index) => (
                            <li key={index} className="text-xs text-red-600 flex items-center">
                              <XCircle className="w-3 h-3 mr-2" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-md text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {selectedTransaction.recommendations?.map((rec, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-md text-sm font-medium text-gray-900">Trip Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Distance</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTransaction.distance}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTransaction.duration}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTransaction.payment}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Trip ID</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTransaction.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                {selectedTransaction.type === 'Driver Retention Analysis' ? (
                  <>
                    <button 
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      onClick={() => {
                        // Create detailed retention report
                        const reportData = {
                          driverId: driverData.id,
                          driverName: `${driverData.name}`,
                          reportDate: new Date().toLocaleDateString(),
                          retentionScore: selectedTransaction.retentionScore,
                          predictions: selectedTransaction.predictions,
                          riskFactors: selectedTransaction.factors,
                          recommendations: selectedTransaction.recommendations,
                          actionItems: selectedTransaction.actionItems,
                          behaviorAnalysis: selectedTransaction.behaviorAnalysis
                        };
                        
                        // Generate comprehensive report content
                        const csvContent = [
                          '=== XPRESS DRIVER RETENTION ANALYSIS REPORT ===',
                          '',
                          `Driver: ${reportData.driverName}`,
                          `Driver ID: ${reportData.driverId}`,
                          `Report Date: ${reportData.reportDate}`,
                          `Analysis ID: ${selectedTransaction.id}`,
                          `Confidence Level: ${selectedTransaction.confidenceLevel}`,
                          '',
                          '=== EXECUTIVE SUMMARY ===',
                          `Overall Retention Score: ${reportData.retentionScore}`,
                          `Risk Level: ${selectedTransaction.risk}`,
                          `Analyst Note: ${selectedTransaction.analystNote}`,
                          '',
                          '=== DRIVER PROFILE ===',
                          `Driver Since: ${selectedTransaction.driverSince}`,
                          `Total Trips: ${selectedTransaction.totalTrips?.toLocaleString()}`,
                          `Average Rating: ${selectedTransaction.averageRating}/5.0`,
                          `Loyalty Score: ${selectedTransaction.behaviorAnalysis?.loyaltyScore}/10`,
                          `Engagement Trend: ${selectedTransaction.behaviorAnalysis?.engagementTrend}`,
                          '',
                          '=== RECENT PERFORMANCE (CURRENT WEEK) ===',
                          `Weekly Trips: ${selectedTransaction.recentPerformance?.weeklyTrips}`,
                          `Weekly Earnings: ${selectedTransaction.recentPerformance?.weeklyEarnings}`,
                          `Completion Rate: ${selectedTransaction.recentPerformance?.completionRate}`,
                          `Cancellation Rate: ${selectedTransaction.recentPerformance?.cancelationRate}`,
                          '',
                          '=== RETENTION PREDICTIONS ===',
                          `30-day retention probability: ${selectedTransaction.predictions?.thirtyDay}`,
                          `60-day retention probability: ${selectedTransaction.predictions?.sixtyDay}`,
                          `90-day retention probability: ${selectedTransaction.predictions?.ninetyDay}`,
                          '',
                          '=== POSITIVE RETENTION FACTORS ===',
                          ...selectedTransaction.factors?.positive?.map(f => `• ${f}`) || [],
                          '',
                          '=== RISK FACTORS ===',
                          ...selectedTransaction.factors?.negative?.map(f => `• ${f}`) || [],
                          '',
                          '=== BEHAVIORAL ANALYSIS ===',
                          ...selectedTransaction.behaviorAnalysis?.riskIndicators?.map(r => `• ${r}`) || [],
                          '',
                          '=== IMMEDIATE ACTIONS (24 HOURS) ===',
                          ...selectedTransaction.actionItems?.immediate?.map(a => `• ${a}`) || [],
                          '',
                          '=== SHORT-TERM ACTIONS (7 DAYS) ===',
                          ...selectedTransaction.actionItems?.shortTerm?.map(a => `• ${a}`) || [],
                          '',
                          '=== LONG-TERM ACTIONS (30 DAYS) ===',
                          ...selectedTransaction.actionItems?.longTerm?.map(a => `• ${a}`) || [],
                          '',
                          '=== DETAILED RECOMMENDATIONS ===',
                          ...selectedTransaction.recommendations?.map(rec => `• ${rec}`) || [],
                          '',
                          '=== REPORT METADATA ===',
                          `${selectedTransaction.lastUpdated}`,
                          `${selectedTransaction.nextUpdate}`,
                          '',
                          'Report generated by Xpress Ops Tower v2.0',
                          'Confidential - For Internal Use Only'
                        ].join('\n');
                        
                        // Download comprehensive report
                        const blob = new Blob([csvContent], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `retention-analysis-${driverData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        
                        // Show success feedback
                        setSuccessModalData({
                          type: 'report',
                          title: '📊 Comprehensive Retention Report Generated!',
                          message: 'The detailed analysis report has been downloaded and saved to your system. This report includes:',
                          details: [
                            '✓ Executive summary and risk assessment',
                            '✓ Performance metrics and trends', 
                            '✓ Behavioral analysis insights',
                            '✓ Actionable recommendations',
                            '✓ Timeline-based action plan'
                          ],
                          reportId: selectedTransaction.id
                        });
                        setShowSuccessModal(true);
                      }}
                    >
                      Export Retention Report
                    </button>
                    <button 
                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      onClick={() => {
                        // Create structured action plan with more detail
                        const actionPlan = {
                          driverId: driverData.id,
                          driverName: `${driverData.name}`,
                          createdDate: new Date().toLocaleDateString(),
                          createdTime: new Date().toLocaleTimeString(),
                          priority: 'High Priority',
                          status: 'Active - In Progress',
                          assignedTo: 'Driver Success Team',
                          assignedManager: 'Sarah Chen - Driver Success Manager',
                          targetCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                          estimatedBudget: '₱5,000 - ₱8,000',
                          objectives: [
                            'Improve driver retention likelihood from 68% to 85% within 30 days',
                            'Address outstanding financial obligations (₱800 debt)',
                            'Enhance driver satisfaction and engagement scores',
                            'Reduce customer complaints by 60%',
                            'Improve safety and compliance ratings'
                          ],
                          immediateActions: selectedTransaction.actionItems?.immediate || [],
                          shortTermActions: selectedTransaction.actionItems?.shortTerm || [],
                          longTermActions: selectedTransaction.actionItems?.longTerm || [],
                          success_metrics: [
                            'Outstanding debt resolved within 7 days',
                            'Safety training completion certificate',
                            'Customer rating improvement to 4.8+ stars',
                            'Complaint reduction by 60% within 14 days',
                            'Retention score improvement to 85%+'
                          ],
                          resources: [
                            'Driver Success Team consultation',
                            'Financial assistance program enrollment',
                            'Safety training materials and certification',
                            'Customer service coaching sessions',
                            'Performance monitoring tools'
                          ],
                          timeline: {
                            immediate: 'Next 24 hours',
                            shortTerm: 'Days 2-7',
                            mediumTerm: 'Days 8-21',
                            longTerm: 'Days 22-30'
                          }
                        };
                        
                        // Generate comprehensive action plan document
                        const planContent = [
                          '╔══════════════════════════════════════════════╗',
                          '║      XPRESS DRIVER RETENTION ACTION PLAN      ║',
                          '╚══════════════════════════════════════════════╝',
                          '',
                          '📋 PLAN OVERVIEW',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          `Driver Name: ${actionPlan.driverName}`,
                          `Driver ID: ${actionPlan.driverId}`,
                          `Plan Created: ${actionPlan.createdDate} at ${actionPlan.createdTime}`,
                          `Priority Level: ${actionPlan.priority}`,
                          `Current Status: ${actionPlan.status}`,
                          `Assigned Team: ${actionPlan.assignedTo}`,
                          `Plan Manager: ${actionPlan.assignedManager}`,
                          `Target Completion: ${actionPlan.targetCompletion}`,
                          `Estimated Budget: ${actionPlan.estimatedBudget}`,
                          '',
                          '🎯 PRIMARY OBJECTIVES',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          ...actionPlan.objectives.map((obj, i) => `${i + 1}. ${obj}`),
                          '',
                          '⚡ IMMEDIATE ACTIONS (Next 24 Hours)',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          ...actionPlan.immediateActions.map((action, i) => `⏰ ${i + 1}. ${action}`),
                          '',
                          '📅 SHORT-TERM ACTIONS (Days 2-7)',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          ...actionPlan.shortTermActions.map((action, i) => `📋 ${i + 1}. ${action}`),
                          '',
                          '📊 LONG-TERM ACTIONS (Days 8-30)',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          ...actionPlan.longTermActions.map((action, i) => `📈 ${i + 1}. ${action}`),
                          '',
                          '🎖️  SUCCESS METRICS & KPIs',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          ...actionPlan.success_metrics.map((metric, i) => `✅ ${i + 1}. ${metric}`),
                          '',
                          '🛠️  RESOURCES & SUPPORT',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          ...actionPlan.resources.map((resource, i) => `🔧 ${i + 1}. ${resource}`),
                          '',
                          '📅 IMPLEMENTATION TIMELINE',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          `⚡ Immediate Phase: ${actionPlan.timeline.immediate}`,
                          `📋 Short-term Phase: ${actionPlan.timeline.shortTerm}`,
                          `📊 Medium-term Phase: ${actionPlan.timeline.mediumTerm}`,
                          `📈 Long-term Phase: ${actionPlan.timeline.longTerm}`,
                          '',
                          '📋 NEXT STEPS',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          '1. Plan review meeting scheduled within 48 hours',
                          '2. Immediate actions to be initiated within 24 hours',
                          '3. Weekly progress check-ins with Driver Success Team',
                          '4. 7-day plan evaluation and adjustments',
                          '5. 30-day final assessment and outcome measurement',
                          '',
                          '📞 EMERGENCY CONTACTS',
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                          'Driver Success Hotline: (02) 8XXX-XXXX',
                          'Manager Direct Line: Sarah Chen - (0917) XXX-XXXX',
                          'After Hours Support: support@xpress.com.ph',
                          '',
                          '═════════════════════════════════════════════════',
                          'Generated by Xpress Ops Tower v2.0',
                          `Plan ID: AP-${new Date().getTime()}`,
                          'Status: ACTIVE | Confidential Internal Document',
                          '═════════════════════════════════════════════════'
                        ].join('\n');
                        
                        // Download comprehensive action plan
                        const blob = new Blob([planContent], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `action-plan-${driverData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        
                        // Show comprehensive success message
                        setSuccessModalData({
                          type: 'actionplan',
                          title: '🎯 Comprehensive Action Plan Created Successfully!',
                          message: 'Your detailed 30-day driver retention action plan has been generated and downloaded. This plan includes:',
                          details: [
                            '✅ Structured timeline with immediate, short-term, and long-term actions',
                            '✅ Specific success metrics and KPIs to track progress',
                            '✅ Resource allocation and team assignments',
                            '✅ Emergency contacts and support channels'
                          ],
                          nextSteps: [
                            '• Plan automatically assigned to Driver Success Team',
                            '• Review meeting scheduled within 48 hours',
                            '• Weekly progress tracking activated'
                          ],
                          planManager: 'Sarah Chen',
                          estimatedBudget: '₱5,000 - ₱8,000',
                          targetCompletion: actionPlan.targetCompletion
                        });
                        setShowSuccessModal(true);
                      }}
                    >
                      Create Action Plan
                    </button>
                  </>
                ) : (
                  <>
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Export Details
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      View Full Trip
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && notificationModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          {notificationModalData.type === 'document' ? (
            // Document Image Viewer Modal (Like the first screenshot)
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-[90vw] max-h-[90vh] mx-4 overflow-hidden relative">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationModalData(null);
                  setCurrentImageIndex(0);
                }}
                className="absolute top-4 right-4 z-10 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              
              {/* Navigation Arrows */}
              {notificationModalData.images && notificationModalData.images.length > 1 && (
                <>
                  <button 
                    onClick={() => {
                      const newIndex = currentImageIndex === 0 
                        ? notificationModalData.images.length - 1 
                        : currentImageIndex - 1;
                      setCurrentImageIndex(newIndex);
                      setNotificationModalData({
                        ...notificationModalData,
                        imageUrl: notificationModalData.images[newIndex].url,
                        title: notificationModalData.images[newIndex].title,
                        currentImageIndex: newIndex
                      });
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => {
                      const newIndex = currentImageIndex === notificationModalData.images.length - 1 
                        ? 0 
                        : currentImageIndex + 1;
                      setCurrentImageIndex(newIndex);
                      setNotificationModalData({
                        ...notificationModalData,
                        imageUrl: notificationModalData.images[newIndex].url,
                        title: notificationModalData.images[newIndex].title,
                        currentImageIndex: newIndex
                      });
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
              {/* Document Display Area */}
              <div className="w-full h-[90vh] flex flex-col items-center justify-center bg-gray-900 p-4">
                {notificationModalData.imageUrl ? (
                  <>
                    {/* Image */}
                    <img 
                      src={notificationModalData.imageUrl} 
                      alt={notificationModalData.title}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl flex-1"
                      style={{ maxWidth: '90%', maxHeight: '80%' }}
                    />
                    
                    {/* Image Information */}
                    <div className="text-center text-white mt-4">
                      <h3 className="text-lg font-semibold mb-2">{notificationModalData.title}</h3>
                      {notificationModalData.images && notificationModalData.images.length > 1 && (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm">
                            {currentImageIndex + 1} of {notificationModalData.images.length}
                          </span>
                          <div className="flex space-x-1">
                            {notificationModalData.images.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                  index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-40'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Fallback to text display
                  <div className="max-w-2xl w-full bg-white text-black rounded-lg p-8 shadow-lg">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{notificationModalData.title}</h3>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 leading-relaxed">
                        {notificationModalData.message}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Regular Notification Modal
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                {/* Icon */}
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  notificationModalData.type === 'success' ? 'bg-green-100' :
                  notificationModalData.type === 'warning' ? 'bg-yellow-100' :
                  notificationModalData.type === 'error' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {notificationModalData.icon === 'CheckCircle' && <CheckCircle className={`w-8 h-8 ${
                    notificationModalData.type === 'success' ? 'text-green-600' : 'text-blue-600'
                  }`} />}
                  {notificationModalData.icon === 'Bell' && <Bell className="w-8 h-8 text-blue-600" />}
                  {notificationModalData.icon === 'Upload' && <Upload className="w-8 h-8 text-blue-600" />}
                  {notificationModalData.icon === 'Eye' && <Eye className="w-8 h-8 text-blue-600" />}
                  {notificationModalData.icon === 'Download' && <Download className="w-8 h-8 text-green-600" />}
                  {notificationModalData.icon === 'AlertTriangle' && <AlertTriangle className="w-8 h-8 text-yellow-600" />}
                  {notificationModalData.icon === 'XCircle' && <XCircle className="w-8 h-8 text-red-600" />}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {notificationModalData.title}
                </h3>

                {/* Message */}
                <div className="text-gray-600 mb-6">
                  <p>{notificationModalData.message}</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationModalData(null);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vehicle Details Modal */}
      {showVehicleModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-full max-h-[90vh] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 truncate">{selectedVehicle.plate} • {selectedVehicle.type}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVehicleModal(false);
                  setSelectedVehicle(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Smart Conditional Modal Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
              {/* Universal Tabs - Always Show */}
              <button
                onClick={() => setVehicleModalTab('details')}
                className={`px-3 md:px-6 py-3 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                  vehicleModalTab === 'details' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              
              <button
                onClick={() => setVehicleModalTab('documents')}
                className={`px-3 md:px-6 py-3 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                  vehicleModalTab === 'documents' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Documents
              </button>
              
              <button
                onClick={() => setVehicleModalTab('driver-access')}
                className={`px-3 md:px-6 py-3 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                  vehicleModalTab === 'driver-access' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Access
              </button>

              {/* Conditional Tabs - Show only when data available */}
              {selectedVehicle.engine && (
                <button
                  onClick={() => setVehicleModalTab('specs')}
                  className={`px-3 md:px-6 py-3 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                    vehicleModalTab === 'specs' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Specs
                </button>
              )}

              {(selectedVehicle.ownership === 'xpress' || selectedVehicle.hasOBD) && (
                <button
                  onClick={() => setVehicleModalTab('maintenance')}
                  className={`px-3 md:px-6 py-3 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                    vehicleModalTab === 'maintenance' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Maintenance
                </button>
              )}

              {selectedVehicle.hasOBD && selectedVehicle.telematics && (
                <button
                  onClick={() => setVehicleModalTab('telematics')}
                  className={`px-3 md:px-6 py-3 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                    vehicleModalTab === 'telematics' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Telematics
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {vehicleModalTab === 'details' && (
                <div className="space-y-6">
                  {/* Status Cards - Conditional based on OBD availability */}
                  <div className={`grid grid-cols-1 gap-4 ${
                    selectedVehicle.hasOBD 
                      ? 'sm:grid-cols-2 lg:grid-cols-4' 
                      : 'sm:grid-cols-2'
                  }`}>
                    {/* Only show mileage and fuel efficiency for vehicles with OBD */}
                    {selectedVehicle.hasOBD && selectedVehicle.obdStatus === 'connected' && (
                      <>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Navigation className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Mileage</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{selectedVehicle.mileage}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Fuel className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Fuel Efficiency</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{selectedVehicle.fuelEfficiency}</p>
                        </div>
                      </>
                    )}
                    
                    {/* Universal status cards - always show */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">Insurance</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        selectedVehicle.insurance === 'Valid' ? 'text-green-600' :
                        selectedVehicle.insurance === 'Expiring Soon' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{selectedVehicle.insurance}</p>
                      <p className="text-xs text-gray-500">{selectedVehicle.insuranceExpiry}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Status</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        selectedVehicle.status === 'Active' ? 'text-green-600' : 'text-gray-600'
                      }`}>{selectedVehicle.status}</p>
                    </div>
                    
                    {/* Show no OBD message when applicable */}
                    {!selectedVehicle.hasOBD && (
                      <div className="sm:col-span-2 bg-gray-50 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">No OBD Device</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">Mileage and fuel efficiency data unavailable</p>
                      </div>
                    )}
                  </div>

                  {/* Registration Details */}
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">Registration Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Engine No:</span>
                          <span className="text-sm text-gray-900">{selectedVehicle.engineNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Chassis No:</span>
                          <span className="text-sm text-gray-900">{selectedVehicle.chassisNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Body Type:</span>
                          <span className="text-sm text-gray-900">{selectedVehicle.bodyType}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fuel Type:</span>
                          <span className="text-sm text-gray-900">{selectedVehicle.fuelType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Transmission:</span>
                          <span className="text-sm text-gray-900">{selectedVehicle.transmission}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Service Type:</span>
                          <span className="text-sm text-gray-900">{selectedVehicle.service}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vehicleModalTab === 'specs' && (
                <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Engine:</span>
                        <span className="text-sm text-gray-900">{selectedVehicle.engine}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Power:</span>
                        <span className="text-sm text-gray-900">{selectedVehicle.power}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Torque:</span>
                        <span className="text-sm text-gray-900">{selectedVehicle.torque}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Seating:</span>
                        <span className="text-sm text-gray-900">{selectedVehicle.seating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">A/C:</span>
                        <span className="text-sm text-green-600">{selectedVehicle.aircon ? '✓ Available' : '✗ Not Available'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transmission:</span>
                        <span className="text-sm text-gray-900">{selectedVehicle.transmission}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vehicleModalTab === 'documents' && (
                <div className="space-y-6">
                  {/* Document Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg text-sm font-medium text-gray-900">Vehicle Documents</h3>
                    <div className="flex items-center space-x-3">
                      <button 
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center space-x-2"
                        onClick={() => {
                          setNotificationModalData({
                            type: 'success',
                            title: 'Documents Downloaded',
                            message: 'All vehicle documents have been downloaded successfully.',
                            icon: 'Download'
                          });
                          setShowNotificationModal(true);
                        }}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download All</span>
                      </button>
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        onClick={() => {
                          setNotificationModalData({
                            type: 'info',
                            title: 'Upload Document',
                            message: 'Document upload modal would open here for adding new vehicle documents.',
                            icon: 'Upload'
                          });
                          setShowNotificationModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload Document</span>
                      </button>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-3">
                    {/* OR/CR */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">OR/CR</h4>
                          <p className="text-xs text-gray-500">Registration Documents</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                            <span>OR: 1234567890</span>
                            <span>CR: 9876543210</span>
                            <span>Valid until: Dec 31, 2024</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Valid</span>
                        <button 
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 font-medium"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'document',
                              title: 'OR/CR Document',
                              imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&h=800&fit=crop&crop=center',
                              message: 'Certificate of Registration - 2020 Toyota Vios\nPlate Number: ABC 1234\nRegistration Valid Until: December 31, 2024',
                              icon: 'FileText'
                            });
                            setShowNotificationModal(true);
                          }}
                        >View</button>
                      </div>
                    </div>

                    {/* Insurance */}
                    <div className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Insurance</h4>
                          <p className="text-xs text-gray-500">Comprehensive Coverage</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                            <span>Policy: INS-2023-789456</span>
                            <span>Provider: PhilCare</span>
                            <span>Expires: Jan 15, 2024</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Expiring</span>
                        <button 
                          className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded hover:bg-orange-100 font-medium"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'document',
                              title: 'Vehicle Insurance Policy',
                              message: 'COMPREHENSIVE MOTOR VEHICLE INSURANCE\n\nPolicy Number: INS-2023-789456\nInsured: Alfred Catap\nVehicle: 2020 Toyota Vios\nPlate Number: ABC 1234\n\nCoverage:\n• Own Damage (Accident/Theft): ₱500,000\n• Third Party Liability: ₱100,000\n• Personal Accident: ₱50,000\n• Acts of Nature: ₱250,000\n\nPremium: ₱12,500 annually\nEffective: January 15, 2023\nExpires: January 15, 2024\n\nProvider: PhilCare Insurance\nContact: 1-800-PHILCARE',
                              icon: 'Shield'
                            });
                            setShowNotificationModal(true);
                          }}
                        >Renew</button>
                      </div>
                    </div>

                    {/* Vehicle Photos */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Vehicle Photos</h4>
                          <p className="text-xs text-gray-500">Exterior & Interior</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                            <span>Front: ✓ Available</span>
                            <span>Interior: ✓ Available</span>
                            <span>Updated: Nov 1, 2023</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Complete</span>
                        <button 
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 font-medium"
                          onClick={() => {
                            setNotificationModalData({
                              type: 'document',
                              title: 'Vehicle Photos - Front View',
                              imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&h=800&fit=crop',
                              images: [
                                {
                                  url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&h=800&fit=crop',
                                  title: 'Front View',
                                  description: '2020 Toyota Vios - Front angle view'
                                },
                                {
                                  url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=800&fit=crop',
                                  title: 'Rear View', 
                                  description: '2020 Toyota Vios - Rear angle view'
                                },
                                {
                                  url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=800&fit=crop',
                                  title: 'Left Side View',
                                  description: '2020 Toyota Vios - Left side profile'
                                },
                                {
                                  url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=800&fit=crop',
                                  title: 'Right Side View',
                                  description: '2020 Toyota Vios - Right side profile'
                                }
                              ],
                              currentImageIndex: 0,
                              message: 'Vehicle Inspection Photos - 2020 Toyota Vios (ABC 1234)',
                              icon: 'Eye'
                            });
                            setShowNotificationModal(true);
                          }}
                        >View</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vehicleModalTab === 'maintenance' && (
                <div className="space-y-6">
                  {selectedVehicle.ownership === 'xpress' ? (
                    // Xpress Owned - Full maintenance tracking
                    <>
                      {/* Maintenance Overview */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Wrench className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Maintenance Overview</h3>
                              <p className="text-sm text-gray-600">Xpress Fleet Maintenance Records</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Active</span>
                        </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">8</div>
                        <div className="text-xs text-gray-600">Total Services</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">2</div>
                        <div className="text-xs text-gray-600">This Month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">45,670</div>
                        <div className="text-xs text-gray-600">Current KM</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">₱28,450</div>
                        <div className="text-xs text-gray-600">Total Cost</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Maintenance Entries */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Maintenance</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {/* Engine Oil Change */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Engine Oil & Filter Change</h4>
                              <p className="text-xs text-gray-600">Preventive Maintenance Service</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Nov 15, 2023</span>
                                <span>•</span>
                                <span>45,200 km</span>
                                <span>•</span>
                                <span>Shell Helix Station</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">₱2,850</div>
                            <div className="text-xs text-green-600">Completed</div>
                          </div>
                        </div>
                      </div>

                      {/* Tire Replacement */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Front Tire Replacement</h4>
                              <p className="text-xs text-gray-600">Worn tire replacement - 2 pcs Bridgestone</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Oct 28, 2023</span>
                                <span>•</span>
                                <span>44,850 km</span>
                                <span>•</span>
                                <span>Bridgestone Select</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">₱8,500</div>
                            <div className="text-xs text-blue-600">Completed</div>
                          </div>
                        </div>
                      </div>

                      {/* Brake Inspection */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Brake System Inspection</h4>
                              <p className="text-xs text-gray-600">Routine safety inspection - brake pads 70% remaining</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Oct 15, 2023</span>
                                <span>•</span>
                                <span>44,200 km</span>
                                <span>•</span>
                                <span>Casa Maintenance</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">₱1,200</div>
                            <div className="text-xs text-yellow-600">Inspection</div>
                          </div>
                        </div>
                      </div>

                      {/* Air Filter Cleaning */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Air Filter & Cabin Filter Service</h4>
                              <p className="text-xs text-gray-600">Filter cleaning and replacement service</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Sep 20, 2023</span>
                                <span>•</span>
                                <span>43,500 km</span>
                                <span>•</span>
                                <span>Quick Service Center</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">₱1,850</div>
                            <div className="text-xs text-purple-600">Completed</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Maintenance */}
                  <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Upcoming Maintenance</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                        <div>
                          <div className="text-sm font-medium text-gray-900">PMS - Preventive Maintenance Service</div>
                          <div className="text-xs text-gray-600">Due: 48,000 km or Dec 15, 2023</div>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Due Soon</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <div className="text-sm font-medium text-gray-900">LTO Emission Test</div>
                          <div className="text-xs text-gray-600">Due: Jan 15, 2024</div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Scheduled</span>
                      </div>
                    </div>
                  </div>
                    </>
                  ) : selectedVehicle.hasOBD ? (
                    // Fleet/Operator with OBD - Real-time mileage, contact owner for maintenance
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Maintenance Status</h3>
                            <p className="text-sm text-gray-600">Externally managed vehicle with OBD tracking</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-gray-900">Real-time Mileage from OBD</div>
                              <div className="text-sm text-gray-600">Live odometer reading</div>
                            </div>
                            <div className="text-3xl font-bold text-green-600">
                              {selectedVehicle.telematics?.odometer.toLocaleString()} km
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">📋 Maintenance Records</h4>
                          <p className="text-blue-800 mb-3">
                            Contact <strong>{selectedVehicle.ownerInfo.name}</strong> for maintenance records and service history.
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700">Owner Contact:</span>
                            <a 
                              href={`tel:${selectedVehicle.ownerInfo.contact}`}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              {selectedVehicle.ownerInfo.contact}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedVehicle.ownership === 'driver' ? (
                    // Driver Owned - No company tracking
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Driver-Owned Vehicle</h3>
                            <p className="text-sm text-gray-600">Maintenance responsibility: Driver</p>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <h4 className="font-semibold text-yellow-900">No Company Tracking Available</h4>
                          </div>
                          <ul className="space-y-2 text-sm text-yellow-800">
                            <li>• Vehicle maintenance is the driver's responsibility</li>
                            <li>• Xpress does not track service records for driver-owned vehicles</li>
                            <li>• Driver must ensure vehicle meets regulatory requirements</li>
                            <li>• Service and safety certifications must be submitted annually</li>
                          </ul>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Required Documentation</h4>
                          <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                              <span>• Vehicle Registration (OR/CR)</span>
                              <span className="text-green-600 text-xs">✓ Current</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>• Insurance Coverage</span>
                              <span className="text-yellow-600 text-xs">⚠ Expiring Soon</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>• LTO Emission Test</span>
                              <span className="text-green-600 text-xs">✓ Valid</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Fleet/Operator without OBD - Contact owner
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">External Maintenance Management</h3>
                            <p className="text-sm text-gray-600">Maintenance managed by {selectedVehicle.ownerInfo.name}</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <h4 className="font-semibold text-gray-900 mb-2">No Tracking Data Available</h4>
                              <p className="text-gray-600 text-sm">This vehicle does not have OBD connectivity</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-3">📞 Contact Vehicle Owner</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <div>
                                <div className="font-semibold text-gray-900">{selectedVehicle.ownerInfo.name}</div>
                                <div className="text-sm text-gray-600">{selectedVehicle.ownerInfo.type}</div>
                              </div>
                              <a 
                                href={`tel:${selectedVehicle.ownerInfo.contact}`}
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                              >
                                {selectedVehicle.ownerInfo.contact}
                              </a>
                            </div>
                            <div className="text-sm text-purple-800">
                              <p>For maintenance records, service history, and scheduling, please contact the vehicle owner directly.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Driver Access Tab */}
              {vehicleModalTab === 'driver-access' && (
                <div className="space-y-6">
                  {/* Driver Access Level */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Driver Access Level</h3>
                          <p className="text-sm text-gray-600">Current access permissions for this vehicle</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedVehicle.driverAccess === 'primary' ? 'bg-green-100 text-green-700' :
                        selectedVehicle.driverAccess === 'secondary' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedVehicle.driverAccess} Driver
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">Full</div>
                        <div className="text-xs text-gray-600">Vehicle Control</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedVehicle.serviceTypes.length}</div>
                        <div className="text-xs text-gray-600">Service Types</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">24/7</div>
                        <div className="text-xs text-gray-600">Access Hours</div>
                      </div>
                    </div>
                  </div>

                  {/* Service Types */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Authorized Service Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedVehicle.serviceTypes.map((serviceType) => (
                        <div key={serviceType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              serviceType === 'TNVS' ? 'bg-blue-100' :
                              serviceType === 'MC Taxi' ? 'bg-yellow-100' :
                              'bg-purple-100'
                            }`}>
                              <Car className={`w-4 h-4 ${
                                serviceType === 'TNVS' ? 'text-blue-600' :
                                serviceType === 'MC Taxi' ? 'text-yellow-600' :
                                'text-purple-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{serviceType}</h4>
                              <p className="text-xs text-gray-600">
                                {serviceType === 'TNVS' ? 'Transport Network Vehicle Service' :
                                 serviceType === 'MC Taxi' ? 'Motor Cab Taxi Service' :
                                 'Premium Transport Service'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Owner Contact Info */}
                  {selectedVehicle.ownership !== 'xpress' && (
                    <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Vehicle Owner Contact</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-900">{selectedVehicle.ownerInfo.name}</div>
                            <div className="text-sm text-gray-600">{selectedVehicle.ownerInfo.type}</div>
                          </div>
                          <a 
                            href={`tel:${selectedVehicle.ownerInfo.contact}`}
                            className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors"
                          >
                            {selectedVehicle.ownerInfo.contact}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Telematics Tab - Overview Only */}
              {vehicleModalTab === 'telematics' && selectedVehicle.hasOBD && selectedVehicle.telematics && (
                <div className="space-y-6">
                  {/* Real-time Status */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Navigation className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Real-time Status</h3>
                          <p className="text-sm text-gray-600">Live vehicle data from OBD connection</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedVehicle.telematics.signalStrength === 'strong' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        📡 {selectedVehicle.telematics.signalStrength} Signal
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{selectedVehicle.telematics.location}</div>
                        <div className="text-xs text-gray-600">Current Location</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.floor((Date.now() - selectedVehicle.telematics.lastPing) / 60000)} min ago
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedVehicle.telematics.odometer.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Odometer (km)</div>
                        <div className="text-xs text-gray-500 mt-1">Live Reading</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{selectedVehicle.telematics.engineStatus}</div>
                        <div className="text-xs text-gray-600">Engine Status</div>
                        <div className="text-xs text-gray-500 mt-1">Current State</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedVehicle.telematics.currentSpeed}</div>
                        <div className="text-xs text-gray-600">Speed (km/h)</div>
                        <div className="text-xs text-gray-500 mt-1">Current Speed</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats (Last 7 days)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">1,247 km</div>
                        <div className="text-sm text-gray-600">Distance Driven</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">58.2 h</div>
                        <div className="text-sm text-gray-600">Engine Hours</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">11.8 km/L</div>
                        <div className="text-sm text-gray-600">Avg Fuel Efficiency</div>
                      </div>
                    </div>
                  </div>

                  {/* Data Connection Status */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Connection</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-700">OBD Device</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">Connected</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-700">Last Sync</span>
                        <span className="text-gray-600">{Math.floor((Date.now() - selectedVehicle.telematics.lastPing) / 60000)} minutes ago</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-700">Signal Strength</span>
                        <span className="text-gray-600 capitalize">{selectedVehicle.telematics.signalStrength}</span>
                      </div>
                    </div>
                  </div>

                  {/* Link to Full Report */}
                  <div className="text-center">
                    <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                      View Full Telematics Report
                    </button>
                    <p className="text-sm text-gray-600 mt-2">Access detailed analytics in the main Vehicle section</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {successModalData.title}
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-4">
                {successModalData.message}
              </p>

              {/* Details */}
              <div className="text-left mb-4">
                <ul className="space-y-2 text-sm">
                  {successModalData.details?.map((detail, index) => (
                    <li key={index} className="text-gray-700">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Plan Specific Content */}
              {successModalData.type === 'actionplan' && (
                <div className="text-left mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Next Steps:</h4>
                  <ul className="space-y-1 text-xs text-blue-800">
                    {successModalData.nextSteps?.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>Plan Manager:</strong> {successModalData.planManager}
                    </p>
                    <p className="text-xs text-blue-700">
                      <strong>Estimated Budget:</strong> {successModalData.estimatedBudget}
                    </p>
                    <p className="text-xs text-blue-700">
                      <strong>Target Completion:</strong> {successModalData.targetCompletion}
                    </p>
                  </div>
                </div>
              )}

              {/* Report Specific Content */}
              {successModalData.type === 'report' && successModalData.reportId && (
                <div className="text-center mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Report ID:</strong> {successModalData.reportId}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessModalData(null);
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default XpressDriverProfile2025;