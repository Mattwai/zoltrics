"use client";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface DatePickerProps {
  onDateChange?: (date: Date | undefined) => void;
  initialDate?: Date;
  disablePastDates?: boolean;
}

export const DatePicker = ({ 
  onDateChange,
  initialDate,
  disablePastDates = true
}: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateChange?.(newDate);
  };

  const handleClear = () => {
    setDate(undefined);
    onDateChange?.(undefined);
  };

  // Function to disable days in the past and optionally specific dates
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    
    // Disable past dates if the flag is set
    if (disablePastDates && isBefore(date, today)) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={isDateDisabled}
          />
        </PopoverContent>
      </Popover>
      {date && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}; 