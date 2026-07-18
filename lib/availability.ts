// Доступность набора в рознице. Точных данных у нас нет: Rebrickable их не отдаёт,
// а официальные даты снятия с продажи есть только в платных/ключевых API.
// Поэтому оцениваем по году выпуска — LEGO обычно держит набор в рознице 2–3 года.
export type RetailStatus = "retail" | "retired";

export const RETIRE_AFTER_YEARS = 3;

export function retailStatus(year: number, now: Date = new Date()): RetailStatus {
  return now.getFullYear() - year >= RETIRE_AFTER_YEARS ? "retired" : "retail";
}

export function isRetired(year: number, now?: Date): boolean {
  return retailStatus(year, now) === "retired";
}

// Самый ранний год, который ещё считаем «в продаже» — для фильтра каталога.
export function retailMinYear(now: Date = new Date()): number {
  return now.getFullYear() - RETIRE_AFTER_YEARS + 1;
}
