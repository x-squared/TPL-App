import type { Favorite } from '../api';
import AdminView from '../views/AdminView';
import ColloquiumDetailView from '../views/ColloquiumDetailView';
import ColloquiumsView from '../views/ColloquiumsView';
import CoordinationDetailView from '../views/CoordinationDetailView';
import CoordinationsView from '../views/CoordinationsView';
import DonationsView from '../views/DonationsView';
import E2ETestsView from '../views/E2ETestsView';
import MyWorkView from '../views/MyWorkView';
import PatientDetailView from '../views/PatientDetailView';
import PatientsView from '../views/PatientsView';
import ReportsView from '../views/ReportsView';
import type { PatientDetailTab } from '../views/patient-detail/PatientDetailTabs';

type Page = 'my-work' | 'patients' | 'donations' | 'colloquiums' | 'coordinations' | 'reports' | 'admin' | 'e2e-tests';

interface AppMainRouterProps {
  page: Page;
  canViewPatients: boolean;
  canViewDonations: boolean;
  canViewColloquiums: boolean;
  canViewCoordinations: boolean;
  canViewReports: boolean;
  canViewAdmin: boolean;
  devToolsEnabled: boolean;
  selectedPatientId: number | null;
  setSelectedPatientId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedColloqiumId: number | null;
  setSelectedColloqiumId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedCoordinationId: number | null;
  setSelectedCoordinationId: React.Dispatch<React.SetStateAction<number | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  patientInitialTab: PatientDetailTab | undefined;
  setPatientInitialTab: React.Dispatch<React.SetStateAction<PatientDetailTab | undefined>>;
  patientInitialEpisodeId: number | null;
  setPatientInitialEpisodeId: React.Dispatch<React.SetStateAction<number | null>>;
  onOpenFavorite: (favorite: Favorite) => void;
  coordinationQuickCreateToken: number;
}

export default function AppMainRouter({
  page,
  canViewPatients,
  canViewDonations,
  canViewColloquiums,
  canViewCoordinations,
  canViewReports,
  canViewAdmin,
  devToolsEnabled,
  selectedPatientId,
  setSelectedPatientId,
  selectedColloqiumId,
  setSelectedColloqiumId,
  selectedCoordinationId,
  setSelectedCoordinationId,
  setPage,
  patientInitialTab,
  setPatientInitialTab,
  patientInitialEpisodeId,
  setPatientInitialEpisodeId,
  onOpenFavorite,
  coordinationQuickCreateToken,
}: AppMainRouterProps) {
  return (
    <main className="main-content">
      {page === 'my-work' && (
        <MyWorkView onOpenFavorite={onOpenFavorite} />
      )}
      {page === 'patients' && canViewPatients && !selectedPatientId && (
        <PatientsView
          onSelectPatient={(id) => {
            setPatientInitialTab(undefined);
            setPatientInitialEpisodeId(null);
            setSelectedPatientId(id);
          }}
        />
      )}
      {page === 'patients' && canViewPatients && selectedPatientId && (
        <PatientDetailView
          patientId={selectedPatientId}
          initialTab={patientInitialTab}
          initialEpisodeId={patientInitialEpisodeId}
          onOpenColloqium={(colloqiumId) => {
            setPage('colloquiums');
            setSelectedCoordinationId(null);
            setSelectedPatientId(null);
            setPatientInitialTab(undefined);
            setPatientInitialEpisodeId(null);
            setSelectedColloqiumId(colloqiumId);
          }}
          onBack={() => {
            setSelectedPatientId(null);
            setPatientInitialTab(undefined);
            setPatientInitialEpisodeId(null);
          }}
        />
      )}
      {page === 'donations' && canViewDonations && <DonationsView />}
      {page === 'colloquiums' && canViewColloquiums && selectedColloqiumId === null && (
        <ColloquiumsView onOpenColloqium={(id) => setSelectedColloqiumId(id)} />
      )}
      {page === 'colloquiums' && canViewColloquiums && selectedColloqiumId !== null && (
        <ColloquiumDetailView
          colloqiumId={selectedColloqiumId}
          onOpenEpisode={(patientId, episodeId) => {
            setPage('patients');
            setSelectedColloqiumId(null);
            setSelectedCoordinationId(null);
            setSelectedPatientId(patientId);
            setPatientInitialTab('episodes');
            setPatientInitialEpisodeId(episodeId);
          }}
          onBack={() => setSelectedColloqiumId(null)}
        />
      )}
      {page === 'coordinations' && canViewCoordinations && selectedCoordinationId === null && (
        <CoordinationsView
          onOpenCoordination={(id) => setSelectedCoordinationId(id)}
          quickCreateToken={coordinationQuickCreateToken}
        />
      )}
      {page === 'coordinations' && canViewCoordinations && selectedCoordinationId !== null && (
        <CoordinationDetailView
          coordinationId={selectedCoordinationId}
          onBack={() => setSelectedCoordinationId(null)}
          onOpenPatientEpisode={(patientId, episodeId) => {
            setPage('patients');
            setSelectedColloqiumId(null);
            setSelectedPatientId(patientId);
            setPatientInitialTab('episodes');
            setPatientInitialEpisodeId(episodeId);
          }}
        />
      )}
      {page === 'reports' && canViewReports && <ReportsView />}
      {page === 'admin' && canViewAdmin && <AdminView />}
      {page === 'e2e-tests' && devToolsEnabled && <E2ETestsView />}
    </main>
  );
}
