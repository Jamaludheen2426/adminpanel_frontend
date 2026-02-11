'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Company } from '@/types';

interface CompanyContextType {
  currentCompanyId: number | null;
  currentCompany: Company | null;
  setCurrentCompanyId: (companyId: number | null) => void;
  isDeveloper: boolean;
  userRoleLevel: number;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentCompanyId, setCurrentCompanyIdState] = useState<number | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);

  // Determine if user is developer
  const isDeveloper = user?.role?.slug === 'developer';
  const userRoleLevel = user?.role?.level || 0;

  // Initialize company context
  useEffect(() => {
    if (!user) {
      setCurrentCompanyIdState(null);
      setCurrentCompany(null);
      return;
    }

    if (isDeveloper) {
      // Developer: read from localStorage (switchable)
      const savedCompanyId = localStorage.getItem('currentCompanyId');
      if (savedCompanyId) {
        setCurrentCompanyIdState(parseInt(savedCompanyId, 10));
      } else {
        setCurrentCompanyIdState(null); // System-level view
      }
    } else {
      // Non-developer: locked to user's company
      setCurrentCompanyIdState(user.company_id);
      setCurrentCompany(user.company || null);
    }
  }, [user, isDeveloper]);

  // Update localStorage when company changes (developer only)
  const setCurrentCompanyId = (companyId: number | null) => {
    if (!isDeveloper) {
      console.warn('Non-developer users cannot switch companies');
      return;
    }

    setCurrentCompanyIdState(companyId);
    
    if (companyId === null) {
      localStorage.removeItem('currentCompanyId');
    } else {
      localStorage.setItem('currentCompanyId', companyId.toString());
    }

    // Clear current company data when switching
    // The CompanySwitcher component will fetch fresh data
    setCurrentCompany(null);
  };

  // Update current company when company data is available
  useEffect(() => {
    if (!isDeveloper && user?.company) {
      setCurrentCompany(user.company);
    }
  }, [user?.company, isDeveloper]);

  const value: CompanyContextType = {
    currentCompanyId,
    currentCompany,
    setCurrentCompanyId,
    isDeveloper,
    userRoleLevel,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};