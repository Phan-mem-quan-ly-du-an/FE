import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

// Define types for the active company context
interface Role {
  id: number;
  name: string;
  code: string;
}

interface CompanyMember {
  id: number;
  userId: string;
  roleId: number;
  isOwner: boolean;
  role?: Role;
  companyName?: string;
  owner?: boolean;
}

export interface ActiveCompany {
  id: string;
  name: string;
  userRole: string;
  userMembership: CompanyMember | null;
}

type ActiveCompanyContextType = {
  activeCompany: ActiveCompany | null;
  setActiveCompany: (company: ActiveCompany | null) => void;
};

const ActiveCompanyContext = createContext<ActiveCompanyContextType | undefined>(undefined);

interface ActiveCompanyProviderProps {
  children: ReactNode;
}

// Component "Provider" để bọc ứng dụng của bạn
export function ActiveCompanyProvider({ children }: ActiveCompanyProviderProps) {
  const [activeCompany, setActiveCompany] = useState<ActiveCompany | null>(null);

  const value = useMemo(() => ({
    activeCompany,
    setActiveCompany,
  }), [activeCompany]);

  return (
    <ActiveCompanyContext.Provider value={value}>
      {children}
    </ActiveCompanyContext.Provider>
  );
}

// Hook tùy chỉnh để dễ dàng truy cập context
export function useActiveCompany(): ActiveCompanyContextType {
  const context = useContext(ActiveCompanyContext);
  if (context === undefined) {
    throw new Error('useActiveCompany must be used within an ActiveCompanyProvider');
  }
  return context;
}