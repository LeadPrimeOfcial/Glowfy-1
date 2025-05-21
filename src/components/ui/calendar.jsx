
    import React from 'react';
    import { ChevronLeft, ChevronRight } from 'lucide-react';
    import { cn } from '@/lib/utils';
    import { Button, buttonVariants } from '@/components/ui/button';

    function Calendar({
      className,
      classNames,
      showOutsideDays = true,
      ...props
    }) {
      const [currentMonth, setCurrentMonth] = React.useState(new Date());
      const today = new Date();

      const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const numDays = daysInMonth(year, month);
      const firstDay = firstDayOfMonth(year, month);

      const handlePrevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
      };

      const handleNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
      };
      
      const days = [];
      for (let i = 0; i < firstDay; i++) {
        if (showOutsideDays) {
          const prevMonthDays = daysInMonth(year, month -1);
          days.push(<div key={`prev-${i}`} className={cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal text-glowfy-muted-foreground opacity-50", "aria-selected:opacity-30")}>{prevMonthDays - firstDay + 1 + i}</div>);
        } else {
          days.push(<div key={`empty-prev-${i}`} className="h-9 w-9"></div>);
        }
      }

      for (let day = 1; day <= numDays; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = props.selected && date.toDateString() === props.selected.toDateString();

        days.push(
          <button
            key={day}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'h-9 w-9 p-0 font-normal',
              isToday && 'bg-glowfy-accent text-glowfy-accent-foreground',
              isSelected && 'bg-glowfy-primary text-glowfy-primary-foreground hover:bg-glowfy-primary/90 focus:bg-glowfy-primary/90',
              !isSelected && !isToday && 'hover:bg-glowfy-muted',
              props.disabled && props.disabled(date) && "text-glowfy-muted-foreground opacity-50 cursor-not-allowed"
            )}
            onClick={() => props.onSelect && ! (props.disabled && props.disabled(date)) && props.onSelect(date)}
            disabled={props.disabled && props.disabled(date)}
          >
            {day}
          </button>
        );
      }
      
      const remainingCells = 7 - ((firstDay + numDays) % 7);
      if (remainingCells < 7) {
        for (let i = 1; i <= remainingCells; i++) {
           if (showOutsideDays) {
             days.push(<div key={`next-${i}`} className={cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal text-glowfy-muted-foreground opacity-50", "aria-selected:opacity-30")}>{i}</div>);
           } else {
             days.push(<div key={`empty-next-${i}`} className="h-9 w-9"></div>);
           }
        }
      }


      return (
        <div className={cn('p-3 bg-glowfy-card rounded-md border border-glowfy-border', className)} {...props}>
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-lg font-medium text-glowfy-foreground">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="space-x-1">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-7 w-7 bg-transparent border-glowfy-border hover:bg-glowfy-muted">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-7 w-7 bg-transparent border-glowfy-border hover:bg-glowfy-muted">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-xs text-center text-glowfy-muted-foreground">
            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2 text-sm">
            {days}
          </div>
        </div>
      );
    }
    Calendar.displayName = 'Calendar';
    
    export { Calendar };
  