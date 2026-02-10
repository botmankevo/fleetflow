"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MaintenanceItem {
  id: number;
  unit: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  status: string;
  cost: number;
}

interface MaintenanceCalendarProps {
  maintenanceItems: MaintenanceItem[];
  onItemClick?: (item: MaintenanceItem) => void;
}

export function MaintenanceCalendar({ maintenanceItems, onItemClick }: MaintenanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{
    date: Date;
    isCurrentMonth: boolean;
    items: MaintenanceItem[];
  }>>([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, maintenanceItems]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; items: MaintenanceItem[] }> = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        items: []
      });
    }
    
    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayItems = maintenanceItems.filter(item => {
        if (!item.scheduled_date) return false;
        const itemDate = new Date(item.scheduled_date);
        return itemDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        items: dayItems
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        items: []
      });
    }
    
    setCalendarDays(days);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date().toDateString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{monthYear}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const isToday = day.date.toDateString() === today;
            const hasItems = day.items.length > 0;
            
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] p-2 border rounded-lg transition-colors",
                  day.isCurrentMonth ? "bg-card" : "bg-muted/30",
                  isToday && "border-primary border-2 bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  !day.isCurrentMonth && "text-muted-foreground",
                  isToday && "text-primary font-bold"
                )}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {day.items.slice(0, 2).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onItemClick?.(item)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-xs border",
                        getStatusColor(item.status),
                        "hover:scale-105 transition-transform cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <Wrench className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate font-medium">{item.unit}</span>
                      </div>
                      <div className="truncate text-[10px] opacity-80">
                        {item.description}
                      </div>
                    </button>
                  ))}
                  
                  {day.items.length > 2 && (
                    <div className="text-xs text-center text-muted-foreground py-1">
                      +{day.items.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Status:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/20"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/20"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500/20 border border-gray-500/20"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
