export type AnnualMonthSnapshot = {
  month: number;
  total: number;
  workedDays: number;
  absences: number;
  holidays: number;
};

export function buildAnnualSummary(months: AnnualMonthSnapshot[]) {
  const ordered = [...months].sort((a, b) => a.month - b.month);
  const total = ordered.reduce((sum, month) => sum + month.total, 0);
  const monthsWithData = ordered.filter((month) => month.workedDays > 0 || month.total > 0);
  return {
    months: ordered,
    total,
    average: monthsWithData.length ? total / monthsWithData.length : 0,
    highest: monthsWithData.reduce<AnnualMonthSnapshot | null>((best, month) => !best || month.total > best.total ? month : best, null),
    lowest: monthsWithData.reduce<AnnualMonthSnapshot | null>((best, month) => !best || month.total < best.total ? month : best, null),
    workedDays: ordered.reduce((sum, month) => sum + month.workedDays, 0),
    absences: ordered.reduce((sum, month) => sum + month.absences, 0),
    holidays: ordered.reduce((sum, month) => sum + month.holidays, 0)
  };
}
