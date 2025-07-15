import { createContext, useState, ReactNode } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TabsContext = createContext<TabsContextType | null>(null);

interface TabsProviderProps {
  children: ReactNode;
}

export const TabsProvider = ({ children }: TabsProviderProps) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};
