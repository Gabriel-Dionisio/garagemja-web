import { DEFAULT_CRITERIA, Vacancy, VacancyCriteria } from './search-vacancies.model';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function searchableText(vacancy: Vacancy): string {
  return normalize(
    [vacancy.condominiumName, vacancy.address, vacancy.number, vacancy.block]
      .filter((part): part is string => !!part)
      .join(' '),
  );
}

/** Todas as palavras da pesquisa precisam aparecer (sem diferenciar maiúsculas nem acentos). */
function matchesQuery(vacancy: Vacancy, words: string[]): boolean {
  if (words.length === 0) return true;
  const text = searchableText(vacancy);
  return words.every((word) => text.includes(word));
}

function comparePrice(a: Vacancy, b: Vacancy, direction: 1 | -1): number {
  // Vagas sem preço ficam sempre no fim, em qualquer sentido.
  if (a.price === null && b.price === null) return 0;
  if (a.price === null) return 1;
  if (b.price === null) return -1;
  return (a.price - b.price) * direction;
}

/** Aplica pesquisa, filtros e ordenação juntos, sem alterar a lista original. */
export function filterAndSortVacancies(
  vacancies: readonly Vacancy[],
  query: string,
  criteria: VacancyCriteria,
): Vacancy[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const direction = criteria.sort === 'PRICE_ASC' ? 1 : -1;

  return vacancies
    .filter(
      (vacancy) =>
        (criteria.availability === 'ALL' ||
          vacancy.available === (criteria.availability === 'AVAILABLE')) &&
        (criteria.size === 'ALL' || vacancy.size === criteria.size) &&
        matchesQuery(vacancy, words),
    )
    .sort(
      (a, b) =>
        comparePrice(a, b, direction) ||
        a.condominiumName.localeCompare(b.condominiumName) ||
        a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
}

/** Há filtro diferente do padrão? (a ordenação não conta como filtro) */
export function hasActiveFilters(criteria: VacancyCriteria): boolean {
  return (
    criteria.availability !== DEFAULT_CRITERIA.availability ||
    criteria.size !== DEFAULT_CRITERIA.size
  );
}
