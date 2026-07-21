import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';

interface DrawerState {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerCtx = createContext<DrawerState | undefined>(undefined);

export function DrawerProvider({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({open, openDrawer, closeDrawer}), [open, openDrawer, closeDrawer]);
  return <DrawerCtx.Provider value={value}>{children}</DrawerCtx.Provider>;
}

export function useDrawer(): DrawerState {
  const ctx = useContext(DrawerCtx);
  if (!ctx) throw new Error('useDrawer doit être utilisé dans <DrawerProvider>');
  return ctx;
}
