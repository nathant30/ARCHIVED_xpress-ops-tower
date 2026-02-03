'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface MaintenanceAppointment {
  id: string;
  vehicleId: string;
  plateNumber: string;
  type: 'Preventive' | 'Inspection' | 'Repair' | 'Emergency';
  date: string;
  duration: number;
  description: string;
  provider: string;
}

export default function MaintenanceCalendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Preventive', 'Inspection', 'Repair', 'Emergency']);

  // Mock appointments
  const appointments: MaintenanceAppointment[] = [
    {
      id: '1',
      vehicleId: 'VEH-001',
      plateNumber: 'ABC-1234',
      type: 'Preventive',
      date: new Date().toISOString(),
      duration: 120,
      description: 'Regular maintenance check',
      provider: 'In-house',
    },
    {
      id: '2',
      vehicleId: 'VEH-002',
      plateNumber: 'XYZ-5678',
      type: 'Repair',
      date: addDays(new Date(), 2).toISOString(),
      duration: 180,
      description: 'Brake system repair',
      provider: 'Honda Service',
    },
    {
      id: '3',
      vehicleId: 'VEH-003',
      plateNumber: 'DEF-9012',
      type: 'Inspection',
      date: addDays(new Date(), 5).toISOString(),
      duration: 60,
      description: 'Annual inspection',
      provider: 'External',
    },
  ];

  const getTypeColor = (type: MaintenanceAppointment['type']) => {
    switch (type) {
      case 'Preventive':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'Inspection':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'Repair':
        return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'Emergency':
        return 'bg-red-100 border-red-500 text-red-700';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.date), day) && selectedTypes.includes(apt.type));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Maintenance Calendar</h1>
          <p className="text-neutral-600 mt-1">
            Schedule and track vehicle maintenance appointments
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => router.push('/maintenance/schedule')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-neutral-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Type Filters */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Filter:</span>
                {['Preventive', 'Inspection', 'Repair', 'Emergency'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (selectedTypes.includes(type)) {
                        setSelectedTypes(selectedTypes.filter((t) => t !== type));
                      } else {
                        setSelectedTypes([...selectedTypes, type]);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedTypes.includes(type)
                        ? getTypeColor(type as MaintenanceAppointment['type'])
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {type === 'Preventive' && '🟢'}
                    {type === 'Inspection' && '🟡'}
                    {type === 'Repair' && '🟠'}
                    {type === 'Emergency' && '🔴'}
                    {' '}{type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-neutral-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-semibold text-neutral-700 border-r border-neutral-200 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {daysInMonth.map((day, index) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-neutral-200 last:border-r-0 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm ${
                        isToday
                          ? 'font-bold text-blue-600'
                          : 'text-neutral-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => router.push(`/maintenance/work-orders/${apt.id}`)}
                        className={`px-2 py-1 rounded text-xs border-l-2 cursor-pointer hover:shadow-sm ${getTypeColor(
                          apt.type
                        )}`}
                      >
                        <p className="font-semibold truncate">{apt.plateNumber}</p>
                        <p className="truncate">{apt.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Preventive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Inspection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Repair</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Emergency</span>
        </div>
      </div>
    </div>
  );
}
