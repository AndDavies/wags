'use client';

import React, { useState } from 'react';
import { 
  Hotel, 
  Car, 
  MapPin, 
  Utensils, 
  PlusCircle, 
  Clock, 
  Edit2, 
  Trash2, 
  PawPrint,
  Sun,
  Coffee,
  Moon
} from 'lucide-react';
import { 
  Timeline, 
  TimelineContent, 
  TimelineDate, 
  TimelineHeader, 
  TimelineIndicator, 
  TimelineItem, 
  TimelineSeparator, 
  TimelineTitle 
} from '@/components/ui/timeline';
import { Button } from '@/components/ui/button';
import { Trip, TripActivity, TripDay } from '@/lib/trip-service';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { MiniMap } from './MiniMap';

interface ItineraryViewProps {
  trip: Trip;
  onAddActivity: (dayIndex: number, activity: Omit<TripActivity, 'id'>) => void;
  onEditActivity: (dayIndex: number, activityId: string, updatedActivity: Omit<TripActivity, 'id'>) => void;
  onDeleteActivity: (dayIndex: number, activityId: string) => void;
}

export default function ItineraryView({ trip, onAddActivity, onEditActivity, onDeleteActivity }: ItineraryViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<{
    type: 'add' | 'edit';
    dayIndex: number;
    activity?: TripActivity;
  } | null>(null);
  
  // Form state for the new/edited activity
  const [activityForm, setActivityForm] = useState<Omit<TripActivity, 'id'>>({
    type: 'activity',
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    isPetFriendly: true
  });

  // Handle opening the activity dialog for adding a new activity
  const handleAddActivity = (dayIndex: number, type: TripActivity['type'] = 'activity') => {
    setCurrentActivity({
      type: 'add',
      dayIndex
    });
    setActivityForm({
      type,
      title: '',
      description: '',
      location: '',
      startTime: '09:00',
      endTime: '10:00',
      isPetFriendly: true
    });
    setActivityDialogOpen(true);
  };

  // Handle opening the activity dialog for editing an existing activity
  const handleEditActivity = (dayIndex: number, activity: TripActivity) => {
    setCurrentActivity({
      type: 'edit',
      dayIndex,
      activity
    });
    setActivityForm({
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      location: activity.location || '',
      startTime: activity.startTime || '',
      endTime: activity.endTime || '',
      isPetFriendly: activity.isPetFriendly,
      bookingUrl: activity.bookingUrl,
      price: activity.price,
      coordinates: activity.coordinates
    });
    setActivityDialogOpen(true);
  };

  // Handle saving the activity form
  const handleSaveActivity = () => {
    if (!currentActivity) return;
    
    if (currentActivity.type === 'add') {
      onAddActivity(currentActivity.dayIndex, activityForm);
    } else if (currentActivity.type === 'edit' && currentActivity.activity) {
      onEditActivity(currentActivity.dayIndex, currentActivity.activity.id, activityForm);
    }
    
    setActivityDialogOpen(false);
    setCurrentActivity(null);
  };

  // Get icon for activity type
  const getActivityIcon = (type: TripActivity['type']) => {
    switch (type) {
      case 'flight':
        return Car;
      case 'hotel':
        return Hotel;
      case 'restaurant':
        return Utensils;
      case 'transportation':
        return Car;
      case 'vet':
        return PawPrint;
      default:
        return MapPin;
    }
  };

  // Group activities by time of day
  const groupActivitiesByTimeOfDay = (activities: TripActivity[]) => {
    const sortedActivities = [...activities].sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });

    const timeGroups = {
      morning: [] as TripActivity[],
      afternoon: [] as TripActivity[],
      evening: [] as TripActivity[]
    };

    sortedActivities.forEach(activity => {
      if (!activity.startTime) {
        timeGroups.morning.push(activity);
        return;
      }

      const hour = parseInt(activity.startTime.split(':')[0], 10);
      
      if (hour < 12) {
        timeGroups.morning.push(activity);
      } else if (hour < 18) {
        timeGroups.afternoon.push(activity);
      } else {
        timeGroups.evening.push(activity);
      }
    });

    return timeGroups;
  };

  // Helper to format time
  const formatTime = (time?: string) => {
    if (!time) return '';
    
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    
    return `${hourNum % 12 || 12}:${minute} ${hourNum < 12 ? 'AM' : 'PM'}`;
  };

  return (
    <div className="relative">
      {/* Heading and actions */}
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background pb-2">
        <h2 className="text-lg font-semibold">Your Itinerary</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => selectedDay !== null && handleAddActivity(selectedDay, 'hotel')}>
            <Hotel className="h-3.5 w-3.5 mr-1" /> Add Hotel
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => selectedDay !== null && handleAddActivity(selectedDay, 'transportation')}>
            <Car className="h-3.5 w-3.5 mr-1" /> Add Transport
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => selectedDay !== null && handleAddActivity(selectedDay, 'activity')}>
            <MapPin className="h-3.5 w-3.5 mr-1" /> Add Activity
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => selectedDay !== null && handleAddActivity(selectedDay, 'restaurant')}>
            <Utensils className="h-3.5 w-3.5 mr-1" /> Add Restaurant
          </Button>
        </div>
      </div>
      
      {/* Trip timeline */}
      <Timeline>
        {trip.days.map((day, index) => {
          const isToday = selectedDay === index;
          const timeGroups = groupActivitiesByTimeOfDay(day.activities);
          const dayDate = day.date instanceof Date ? day.date : new Date(day.date);
          
          return (
            <TimelineItem key={index} step={index + 1}>
              <TimelineSeparator />
              <TimelineIndicator>
                <span className="sr-only">Day {index + 1}</span>
              </TimelineIndicator>
              <TimelineHeader>
                <TimelineDate>
                  {dayDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </TimelineDate>
                <TimelineTitle 
                  className={`cursor-pointer hover:text-primary transition-colors ${isToday ? 'text-primary font-semibold' : ''}`}
                  onClick={() => setSelectedDay(isToday ? null : index)}
                >
                  Day {index + 1}: {index === 0 ? `Arrive in ${trip.destination}` : `Explore ${trip.destination}`}
                </TimelineTitle>
              </TimelineHeader>
              <TimelineContent className={`transition-all ${isToday ? 'mt-3' : ''}`}>
                {day.activities.length === 0 ? (
                  <div className="py-4 text-gray-500 italic">
                    No activities planned yet. Use the buttons above or ask the Travel Assistant to add activities.
                  </div>
                ) : (
                  <div className="space-y-6 py-2">
                    {/* Morning activities */}
                    {timeGroups.morning.length > 0 && (
                      <div>
                        <h4 className="flex items-center text-sm font-medium text-yellow-500 mb-2">
                          <Sun className="h-4 w-4 mr-1" />
                          Morning
                        </h4>
                        <div className="space-y-3 pl-5">
                          {timeGroups.morning.map((activity) => {
                            const ActivityIcon = getActivityIcon(activity.type);
                            return (
                              <div key={activity.id} className="border border-gray-200 rounded-md p-3 relative">
                                {isToday && (
                                  <div className="absolute top-2 right-2 flex space-x-1">
                                    <button 
                                      className="p-1 text-gray-400 hover:text-primary transition-colors"
                                      onClick={() => handleEditActivity(index, activity)}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button 
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                      onClick={() => onDeleteActivity(index, activity.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-start">
                                  <ActivityIcon className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                      {activity.startTime && (
                                        <span className="text-xs text-gray-500 flex items-center ml-2">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {formatTime(activity.startTime)}
                                          {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                                        </span>
                                      )}
                                    </div>
                                    {activity.description && (
                                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      {activity.location && (
                                        <div className="flex items-center text-xs text-gray-500">
                                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                          <span className="truncate">{activity.location}</span>
                                        </div>
                                      )}
                                      {activity.isPetFriendly && (
                                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center ml-auto">
                                          <PawPrint className="h-3 w-3 mr-1" />
                                          Pet-Friendly
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Afternoon activities */}
                    {timeGroups.afternoon.length > 0 && (
                      <div>
                        <h4 className="flex items-center text-sm font-medium text-orange-500 mb-2">
                          <Coffee className="h-4 w-4 mr-1" />
                          Afternoon
                        </h4>
                        <div className="space-y-3 pl-5">
                          {timeGroups.afternoon.map((activity) => {
                            const ActivityIcon = getActivityIcon(activity.type);
                            return (
                              <div key={activity.id} className="border border-gray-200 rounded-md p-3 relative">
                                {/* Activity content - same as morning */}
                                {isToday && (
                                  <div className="absolute top-2 right-2 flex space-x-1">
                                    <button 
                                      className="p-1 text-gray-400 hover:text-primary transition-colors"
                                      onClick={() => handleEditActivity(index, activity)}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button 
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                      onClick={() => onDeleteActivity(index, activity.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-start">
                                  <ActivityIcon className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                      {activity.startTime && (
                                        <span className="text-xs text-gray-500 flex items-center ml-2">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {formatTime(activity.startTime)}
                                          {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                                        </span>
                                      )}
                                    </div>
                                    {activity.description && (
                                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      {activity.location && (
                                        <div className="flex items-center text-xs text-gray-500">
                                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                          <span className="truncate">{activity.location}</span>
                                        </div>
                                      )}
                                      {activity.isPetFriendly && (
                                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center ml-auto">
                                          <PawPrint className="h-3 w-3 mr-1" />
                                          Pet-Friendly
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Evening activities */}
                    {timeGroups.evening.length > 0 && (
                      <div>
                        <h4 className="flex items-center text-sm font-medium text-blue-900 mb-2">
                          <Moon className="h-4 w-4 mr-1" />
                          Evening
                        </h4>
                        <div className="space-y-3 pl-5">
                          {timeGroups.evening.map((activity) => {
                            const ActivityIcon = getActivityIcon(activity.type);
                            return (
                              <div key={activity.id} className="border border-gray-200 rounded-md p-3 relative">
                                {/* Activity content - same as morning */}
                                {isToday && (
                                  <div className="absolute top-2 right-2 flex space-x-1">
                                    <button 
                                      className="p-1 text-gray-400 hover:text-primary transition-colors"
                                      onClick={() => handleEditActivity(index, activity)}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button 
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                      onClick={() => onDeleteActivity(index, activity.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-start">
                                  <ActivityIcon className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                      {activity.startTime && (
                                        <span className="text-xs text-gray-500 flex items-center ml-2">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {formatTime(activity.startTime)}
                                          {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                                        </span>
                                      )}
                                    </div>
                                    {activity.description && (
                                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      {activity.location && (
                                        <div className="flex items-center text-xs text-gray-500">
                                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                          <span className="truncate">{activity.location}</span>
                                        </div>
                                      )}
                                      {activity.isPetFriendly && (
                                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center ml-auto">
                                          <PawPrint className="h-3 w-3 mr-1" />
                                          Pet-Friendly
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {isToday && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleAddActivity(index)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Activity
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleAddActivity(index, 'restaurant')}
                    >
                      <Utensils className="h-4 w-4 mr-1" />
                      Add Restaurant
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleAddActivity(index, 'transportation')}
                    >
                      <Car className="h-4 w-4 mr-1" />
                      Add Transport
                    </Button>
                  </div>
                )}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
      
      {/* Activity dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentActivity?.type === 'add' ? 'Add Activity' : 'Edit Activity'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="activity-title" className="mb-1.5 block">
                  Title *
                </Label>
                <Input 
                  id="activity-title"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({...activityForm, title: e.target.value})}
                  placeholder="e.g., Visit Dog Park, Hotel Check-in"
                />
              </div>
              
              <div>
                <Label htmlFor="activity-type" className="mb-1.5 block">
                  Type
                </Label>
                <Select 
                  value={activityForm.type}
                  onValueChange={(value) => setActivityForm({...activityForm, type: value as TripActivity['type']})}
                >
                  <SelectTrigger id="activity-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="hotel">Accommodation</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="vet">Vet/Pet Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pet-friendly" className="mb-1.5 flex items-center justify-between">
                  <span>Pet Friendly</span>
                  <Switch 
                    id="pet-friendly"
                    checked={activityForm.isPetFriendly}
                    onCheckedChange={(checked) => setActivityForm({...activityForm, isPetFriendly: checked})}
                  />
                </Label>
              </div>
              
              <div>
                <Label htmlFor="start-time" className="mb-1.5 block">
                  Start Time
                </Label>
                <Input 
                  id="start-time"
                  type="time"
                  value={activityForm.startTime}
                  onChange={(e) => setActivityForm({...activityForm, startTime: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="end-time" className="mb-1.5 block">
                  End Time
                </Label>
                <Input 
                  id="end-time"
                  type="time"
                  value={activityForm.endTime}
                  onChange={(e) => setActivityForm({...activityForm, endTime: e.target.value})}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="activity-location" className="mb-1.5 block">
                  Location
                </Label>
                <Input 
                  id="activity-location"
                  value={activityForm.location || ''}
                  onChange={(e) => setActivityForm({...activityForm, location: e.target.value})}
                  placeholder="e.g., Central Park, Hotel Name"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="activity-description" className="mb-1.5 block">
                  Description
                </Label>
                <Textarea 
                  id="activity-description"
                  value={activityForm.description || ''}
                  onChange={(e) => setActivityForm({...activityForm, description: e.target.value})}
                  placeholder="Add details about this activity..."
                  rows={3}
                />
              </div>
              
              {activityForm.type === 'hotel' && (
                <div className="col-span-2">
                  <Label htmlFor="booking-url" className="mb-1.5 block">
                    Booking URL
                  </Label>
                  <Input 
                    id="booking-url"
                    type="url"
                    value={activityForm.bookingUrl || ''}
                    onChange={(e) => setActivityForm({...activityForm, bookingUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              )}
              
              {['hotel', 'restaurant', 'activity'].includes(activityForm.type) && (
                <div>
                  <Label htmlFor="activity-price" className="mb-1.5 block">
                    Price (Optional)
                  </Label>
                  <Input 
                    id="activity-price"
                    type="number"
                    value={activityForm.price || ''}
                    onChange={(e) => setActivityForm({...activityForm, price: parseFloat(e.target.value) || undefined})}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="default" 
              onClick={handleSaveActivity}
              disabled={!activityForm.title.trim()}
            >
              {currentActivity?.type === 'add' ? 'Add Activity' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 