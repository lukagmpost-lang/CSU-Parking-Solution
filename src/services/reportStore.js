const STORAGE_KEY = 'csu-parking-reports';
const AUTO_FULL_WINDOW_MS = 30 * 60 * 1000;

export function getStoredReports() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const reports = JSON.parse(data);
    return Array.isArray(reports)
      ? reports.filter(report => report && typeof report === 'object')
      : [];
  } catch {
    return [];
  }
}

export function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getFacilityReportSummary(facilityId, now = Date.now()) {
  const activeReports = getStoredReports().filter(report =>
    report.facilityId === facilityId && report.expiresAt > now
  );
  const reportCount = activeReports.filter(report =>
    report.issueType === 'lot_full' &&
    report.timestamp <= now &&
    now - report.timestamp < AUTO_FULL_WINDOW_MS
  ).length;

  return {
    activeReports,
    reportCount,
    hasEventClosure: activeReports.some(report => report.issueType === 'event_closure'),
  };
}
