
    import React from 'react';
    import { cn } from '@/lib/utils';

    const Card = React.forwardRef(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-glowfy-border bg-glowfy-card text-glowfy-card-foreground shadow-lg transition-all hover:shadow-xl', // Added subtle shadow effects
          className
        )}
        {...props}
      />
    ));
    Card.displayName = 'Card';

    const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    ));
    CardHeader.displayName = 'CardHeader';

    const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
      <h3
        ref={ref}
        className={cn(
          'text-2xl font-semibold leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent', // Gradient title
          className
        )}
        {...props}
      />
    ));
    CardTitle.displayName = 'CardTitle';

    const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
      <p
        ref={ref}
        className={cn('text-sm text-glowfy-muted-foreground', className)}
        {...props}
      />
    ));
    CardDescription.displayName = 'CardDescription';

    const CardContent = React.forwardRef(({ className, ...props }, ref) => (
      <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
    ));
    CardContent.displayName = 'CardContent';

    const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      />
    ));
    CardFooter.displayName = 'CardFooter';

    export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
  