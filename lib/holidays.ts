export type HolidayInfo = {
  isHoliday: true;
  name: string;
};

const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "Confraternização Universal",
  "04-21": "Tiradentes",
  "05-01": "Dia do Trabalho",
  "09-07": "Independência do Brasil",
  "10-12": "Nossa Senhora Aparecida",
  "11-02": "Finados",
  "11-15": "Proclamação da República",
  "11-20": "Dia da Consciência Negra",
  "12-25": "Natal"
};

export function getBrazilianHoliday(year: number, month: number, day: number): HolidayInfo | null {
  const fixed = FIXED_HOLIDAYS[`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`];
  if (fixed) return { isHoliday: true, name: fixed };

  const date = new Date(year, month - 1, day);
  const easter = getEasterSunday(year);
  const movable: Array<[number, string]> = [
    [-48, "Carnaval"],
    [-47, "Carnaval"],
    [-2, "Sexta-feira Santa"],
    [0, "Páscoa"],
    [60, "Corpus Christi"]
  ];
  for (const [offset, name] of movable) {
    const holiday = new Date(easter);
    holiday.setDate(easter.getDate() + offset);
    if (sameDate(date, holiday)) return { isHoliday: true, name };
  }
  return null;
}

export function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getEasterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
