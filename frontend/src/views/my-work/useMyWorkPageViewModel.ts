import { useInformationViewModel } from '../information/useInformationViewModel';
import { useMyWorkViewModel } from './useMyWorkViewModel';
import { useMyWorkTabsViewModel } from './useMyWorkTabsViewModel';

export function useMyWorkPageViewModel() {
  const favorites = useMyWorkViewModel();
  const information = useInformationViewModel();
  const tabs = useMyWorkTabsViewModel();

  return {
    tabs,
    favorites,
    information,
  };
}
