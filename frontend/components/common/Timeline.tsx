import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Package, Calendar, Clock } from 'lucide-react';

export interface TimelineStop {
  id?: string | number;
  type: 'pickup' | 'delivery';
  location: string;
  city?: string;
  state?: string;
  zipCode?: string;
  date?: string;
  time?: string;
  appointmentType?: 'FCFS' | 'Appointment' | 'Live Load' | 'Live Unload';
  notes?: string;
  completed?: boolean;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
  distance?: number; // miles to next stop
  duration?: number; // minutes to next stop
}

interface TimelineProps {
  stops: TimelineStop[];
  orientation?: 'vertical' | 'horizontal';
  showDistance?: boolean;
  showDuration?: boolean;
  compact?: boolean;
  className?: string;
}

export function Timeline({
  stops,
  orientation = 'horizontal',
  showDistance = true,
  showDuration = true,
  compact = false,
  className
}: TimelineProps) {
  const isVertical = orientation === 'vertical';

  const getStatusColor = (stop: TimelineStop) => {
    if (stop.completed) return 'bg-green-500 border-green-500';
    if (stop.status === 'in_progress') return 'bg-yellow-500 border-yellow-500';
    if (stop.status === 'delayed') return 'bg-red-500 border-red-500';
    return 'bg-gray-300 border-gray-300';
  };

  const getTypeColor = (type: 'pickup' | 'delivery') => {
    return type === 'pickup' 
      ? 'bg-blue-100 text-blue-700 border-blue-300' 
      : 'bg-green-100 text-green-700 border-green-300';
  };

  const formatDistance = (miles?: number) => {
    if (!miles) return '';
    return `${miles}mi`;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isVertical) {
    return (
      <div className={cn('relative', className)}>
        {stops.map((stop, index) => (
          <div key={stop.id || index} className="relative pb-8 last:pb-0">
            {/* Vertical Line */}
            {index < stops.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
            )}

            <div className="relative flex gap-4">
              {/* Icon */}
              <div className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                getStatusColor(stop),
                stop.status === 'in_progress' && 'animate-pulse'
              )}>
                <MapPin className="h-4 w-4 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getTypeColor(stop.type)
                      )}>
                        #{index + 1} {stop.type === 'pickup' ? 'Pickup' : 'Delivery'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {stop.location}
                    </h4>
                    {(stop.city || stop.state) && (
                      <p className="text-sm text-gray-600">
                        {stop.city}, {stop.state} {stop.zipCode}
                      </p>
                    )}
                  </div>
                  {(stop.date || stop.time) && (
                    <div className="text-right text-sm text-gray-600">
                      {stop.date && (
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          <span>{stop.date}</span>
                        </div>
                      )}
                      {stop.time && (
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          <span>{stop.time}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {stop.appointmentType && (
                  <div className="text-xs text-gray-500 mb-1">
                    {stop.appointmentType}
                  </div>
                )}

                {stop.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    {stop.notes}
                  </p>
                )}

                {/* Distance to next stop */}
                {index < stops.length - 1 && (showDistance || showDuration) && (
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    {showDistance && stop.distance && (
                      <span className="flex items-center gap-1">
                        📍 {formatDistance(stop.distance)}
                      </span>
                    )}
                    {showDuration && stop.duration && (
                      <span className="flex items-center gap-1">
                        ⏱️ {formatDuration(stop.duration)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal Timeline
  return (
    <div className={cn('relative', className)}>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {stops.map((stop, index) => (
          <React.Fragment key={stop.id || index}>
            {/* Stop Card */}
            <div className={cn(
              'flex-shrink-0 relative',
              compact ? 'w-48' : 'w-64'
            )}>
              <div className={cn(
                'rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
                stop.completed && 'border-green-200 bg-green-50/30',
                stop.status === 'in_progress' && 'border-yellow-200 bg-yellow-50/30'
              )}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                    getTypeColor(stop.type)
                  )}>
                    #{index + 1} {stop.type === 'pickup' ? '📦 Pickup' : '🚛 Delivery'}
                  </span>
                  <div className={cn(
                    'w-3 h-3 rounded-full border-2 transition-all',
                    getStatusColor(stop),
                    stop.status === 'in_progress' && 'animate-pulse'
                  )} />
                </div>

                {/* Location */}
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                  {stop.location}
                </h4>
                {(stop.city || stop.state) && (
                  <p className="text-xs text-gray-600 mb-2">
                    {stop.city}, {stop.state}
                  </p>
                )}

                {/* Date/Time */}
                {(stop.date || stop.time) && (
                  <div className="space-y-1 mb-2">
                    {stop.date && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{stop.date}</span>
                      </div>
                    )}
                    {stop.time && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{stop.time}</span>
                      </div>
                    )}
                  </div>
                )}

                {stop.appointmentType && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {stop.appointmentType}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow with distance/duration */}
            {index < stops.length - 1 && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center pt-8">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-px w-12 bg-gray-300" />
                  <span className="text-lg">→</span>
                  <div className="h-px w-12 bg-gray-300" />
                </div>
                {(showDistance || showDuration) && (
                  <div className="text-xs text-gray-500 text-center whitespace-nowrap">
                    {showDistance && stop.distance && (
                      <div>{formatDistance(stop.distance)}</div>
                    )}
                    {showDuration && stop.duration && (
                      <div>{formatDuration(stop.duration)}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
