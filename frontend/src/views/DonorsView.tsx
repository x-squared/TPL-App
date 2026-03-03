import { useI18n } from '../i18n/i18n';

export default function DonorsView() {
  const { t } = useI18n();
  return (
    <section className="detail-section ui-panel-section">
      <header>
        <h1>{t('donors.title', 'Donors')}</h1>
        <p className="subtitle">{t('donors.notImplemented', 'This view is not implemented yet.')}</p>
      </header>
    </section>
  );
}
