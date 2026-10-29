'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SheetOpenContext = React.createContext(false);

function Sheet({
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const current = open ?? internalOpen;

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <SheetOpenContext.Provider value={current}>
      <SheetPrimitive.Root open={current} onOpenChange={handleOpenChange} {...props} />
    </SheetOpenContext.Provider>
  );
}

const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const EASE = [0.2, 0.7, 0.2, 1] as const;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const open = React.useContext(SheetOpenContext);
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : 0.25;

  return (
    <SheetPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <SheetPrimitive.Overlay key="overlay" forceMount asChild>
            <motion.div
              className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration, ease: EASE }}
            />
          </SheetPrimitive.Overlay>
        )}
        {open && (
          <SheetPrimitive.Content key="content" ref={ref} forceMount asChild {...props}>
            <motion.div
              className={cn(
                'fixed inset-y-0 left-0 z-50 flex h-full w-[86%] max-w-sm flex-col rounded-r-lg border-r bg-background p-6 shadow-lg',
                className,
              )}
              initial={{ x: reduce ? 0 : '-100%', opacity: reduce ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduce ? 0 : '-100%', opacity: reduce ? 0 : 1 }}
              transition={{ duration, ease: EASE }}
            >
              {children}
              <SheetPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-70 transition-opacity hover:bg-secondary hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar</span>
              </SheetPrimitive.Close>
            </motion.div>
          </SheetPrimitive.Content>
        )}
      </AnimatePresence>
    </SheetPrimitive.Portal>
  );
});
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5', className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('font-display text-xl font-medium tracking-tight', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger };
