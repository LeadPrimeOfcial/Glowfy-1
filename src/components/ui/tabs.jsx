
    import React from 'react';
    import * as TabsPrimitive from '@radix-ui/react-tabs';
    import { cn } from '@/lib/utils';

    const Tabs = TabsPrimitive.Root;

    const TabsList = React.forwardRef(({ className, ...props }, ref) => (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-glowfy-muted p-1 text-glowfy-muted-foreground',
          className
        )}
        {...props} />
    ));
    TabsList.displayName = TabsPrimitive.List.displayName;

    const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-glowfy-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glowfy-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-glowfy-primary data-[state=active]:text-glowfy-primary-foreground data-[state=active]:shadow-sm',
          className
        )}
        {...props} />
    ));
    TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

    const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
      <TabsPrimitive.Content
        ref={ref}
        className={cn(
          'mt-2 ring-offset-glowfy-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glowfy-ring focus-visible:ring-offset-2',
          className
        )}
        {...props} />
    ));
    TabsContent.displayName = TabsPrimitive.Content.displayName;

    export { Tabs, TabsList, TabsTrigger, TabsContent };
  