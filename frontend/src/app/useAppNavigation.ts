import { useEffect, useRef, useState } from 'react';

import type { Favorite } from '../api';
import type { PatientDetailTab } from '../views/patient-detail/PatientDetailTabs';

export type Page = 'my-work' | 'patients' | 'donations' | 'colloquiums' | 'coordinations' | 'reports' | 'admin' | 'e2e-tests';

interface UseAppNavigationArgs {
  canViewPatients: boolean;
  canViewDonations: boolean;
  canViewColloquiums: boolean;
  canViewCoordinations: boolean;
  canViewReports: boolean;
  canViewAdmin: boolean;
  devToolsEnabled: boolean;
}

interface NavigationState {
  page: Page;
  selectedPatientId: number | null;
  selectedColloqiumId: number | null;
  selectedCoordinationId: number | null;
  patientInitialTab: PatientDetailTab | undefined;
  patientInitialEpisodeId: number | null;
}

function isSameState(a: NavigationState, b: NavigationState): boolean {
  return (
    a.page === b.page
    && a.selectedPatientId === b.selectedPatientId
    && a.selectedColloqiumId === b.selectedColloqiumId
    && a.selectedCoordinationId === b.selectedCoordinationId
    && a.patientInitialTab === b.patientInitialTab
    && a.patientInitialEpisodeId === b.patientInitialEpisodeId
  );
}

export function useAppNavigation({
  canViewPatients,
  canViewDonations,
  canViewColloquiums,
  canViewCoordinations,
  canViewReports,
  canViewAdmin,
  devToolsEnabled,
}: UseAppNavigationArgs) {
  const [page, setPage] = useState<Page>('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedColloqiumId, setSelectedColloqiumId] = useState<number | null>(null);
  const [selectedCoordinationId, setSelectedCoordinationId] = useState<number | null>(null);
  const [patientInitialTab, setPatientInitialTab] = useState<PatientDetailTab | undefined>(undefined);
  const [patientInitialEpisodeId, setPatientInitialEpisodeId] = useState<number | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [hasMarkedLocation, setHasMarkedLocation] = useState(false);

  const backStackRef = useRef<NavigationState[]>([]);
  const forwardStackRef = useRef<NavigationState[]>([]);
  const markedLocationRef = useRef<NavigationState | null>(null);
  const lastRecordedStateRef = useRef<NavigationState | null>(null);
  const isApplyingHistoryRef = useRef(false);

  const buildCurrentState = (): NavigationState => ({
    page,
    selectedPatientId,
    selectedColloqiumId,
    selectedCoordinationId,
    patientInitialTab,
    patientInitialEpisodeId,
  });

  const setFromState = (state: NavigationState) => {
    setPage(state.page);
    setSelectedPatientId(state.selectedPatientId);
    setSelectedColloqiumId(state.selectedColloqiumId);
    setSelectedCoordinationId(state.selectedCoordinationId);
    setPatientInitialTab(state.patientInitialTab);
    setPatientInitialEpisodeId(state.patientInitialEpisodeId);
  };

  const syncHistoryAvailability = () => {
    setCanGoBack(backStackRef.current.length > 0);
    setCanGoForward(forwardStackRef.current.length > 0);
  };

  useEffect(() => {
    if (!devToolsEnabled && page === 'e2e-tests') {
      setPage('patients');
    }
  }, [devToolsEnabled, page]);

  useEffect(() => {
    const pagePermissions: Partial<Record<Page, boolean>> = {
      patients: canViewPatients,
      donations: canViewDonations,
      colloquiums: canViewColloquiums,
      coordinations: canViewCoordinations,
      reports: canViewReports,
      admin: canViewAdmin,
    };
    const pageAllowed = pagePermissions[page];
    if (typeof pageAllowed === 'boolean' && !pageAllowed) {
      if (canViewPatients) {
        setPage('patients');
      } else {
        setPage('my-work');
      }
    }
  }, [
    canViewAdmin,
    canViewColloquiums,
    canViewCoordinations,
    canViewDonations,
    canViewPatients,
    canViewReports,
    page,
  ]);

  useEffect(() => {
    const current = buildCurrentState();
    if (lastRecordedStateRef.current === null) {
      lastRecordedStateRef.current = current;
      syncHistoryAvailability();
      return;
    }
    if (isSameState(current, lastRecordedStateRef.current)) {
      return;
    }
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      lastRecordedStateRef.current = current;
      syncHistoryAvailability();
      return;
    }
    backStackRef.current.push(lastRecordedStateRef.current);
    forwardStackRef.current = [];
    lastRecordedStateRef.current = current;
    syncHistoryAvailability();
  }, [
    page,
    selectedPatientId,
    selectedColloqiumId,
    selectedCoordinationId,
    patientInitialTab,
    patientInitialEpisodeId,
  ]);

  const resetSelection = () => {
    setSelectedPatientId(null);
    setSelectedColloqiumId(null);
    setSelectedCoordinationId(null);
    setPatientInitialTab(undefined);
    setPatientInitialEpisodeId(null);
  };

  const openFavorite = (favorite: Favorite) => {
    if (favorite.favorite_type_key === 'PATIENT' && favorite.patient_id) {
      setPage('patients');
      setSelectedColloqiumId(null);
      setSelectedCoordinationId(null);
      setPatientInitialTab(undefined);
      setPatientInitialEpisodeId(null);
      setSelectedPatientId(favorite.patient_id);
      return;
    }
    if (favorite.favorite_type_key === 'EPISODE' && favorite.episode_id && favorite.patient_id) {
      setPage('patients');
      setSelectedColloqiumId(null);
      setSelectedCoordinationId(null);
      setSelectedPatientId(favorite.patient_id);
      setPatientInitialTab('episodes');
      setPatientInitialEpisodeId(favorite.episode_id);
      return;
    }
    if (favorite.favorite_type_key === 'COLLOQUIUM' && favorite.colloqium_id) {
      setPage('colloquiums');
      setSelectedPatientId(null);
      setSelectedCoordinationId(null);
      setPatientInitialTab(undefined);
      setPatientInitialEpisodeId(null);
      setSelectedColloqiumId(favorite.colloqium_id);
      return;
    }
    if (favorite.favorite_type_key === 'COORDINATION' && favorite.coordination_id) {
      setPage('coordinations');
      setSelectedPatientId(null);
      setSelectedColloqiumId(null);
      setPatientInitialTab(undefined);
      setPatientInitialEpisodeId(null);
      setSelectedCoordinationId(favorite.coordination_id);
    }
  };

  const goBack = () => {
    const target = backStackRef.current.pop();
    if (!target) return;
    forwardStackRef.current.push(buildCurrentState());
    isApplyingHistoryRef.current = true;
    setFromState(target);
    syncHistoryAvailability();
  };

  const goForward = () => {
    const target = forwardStackRef.current.pop();
    if (!target) return;
    backStackRef.current.push(buildCurrentState());
    isApplyingHistoryRef.current = true;
    setFromState(target);
    syncHistoryAvailability();
  };

  const toggleMarkedLocation = () => {
    if (markedLocationRef.current) {
      const target = markedLocationRef.current;
      markedLocationRef.current = null;
      setHasMarkedLocation(false);
      isApplyingHistoryRef.current = true;
      setFromState(target);
      syncHistoryAvailability();
      return;
    }
    markedLocationRef.current = buildCurrentState();
    setHasMarkedLocation(true);
  };

  return {
    page,
    setPage,
    selectedPatientId,
    setSelectedPatientId,
    selectedColloqiumId,
    setSelectedColloqiumId,
    selectedCoordinationId,
    setSelectedCoordinationId,
    patientInitialTab,
    setPatientInitialTab,
    patientInitialEpisodeId,
    setPatientInitialEpisodeId,
    resetSelection,
    openFavorite,
    canGoBack,
    canGoForward,
    hasMarkedLocation,
    goBack,
    goForward,
    toggleMarkedLocation,
  };
}
