import { useState } from 'react';

export type MyWorkTabKey = 'favorites' | 'information';

export function useMyWorkTabsViewModel() {
  const [activeTab, setActiveTab] = useState<MyWorkTabKey>('favorites');
  return { activeTab, setActiveTab };
}
