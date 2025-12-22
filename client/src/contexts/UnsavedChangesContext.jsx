import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UnsavedChangesContext = createContext(null);

export function UnsavedChangesProvider({ children }) {
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const clearDirty = useCallback(() => setIsDirty(false), []);

  const value = useMemo(
    () => ({
      isDirty,
      setIsDirty,
      markDirty,
      clearDirty,
    }),
    [isDirty, markDirty, clearDirty]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  }
  return ctx;
}
