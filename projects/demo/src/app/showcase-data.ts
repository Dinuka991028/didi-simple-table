export type ShowcaseStatus = 'Active' | 'Leave' | 'Contract';

export interface ShowcaseRow {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string;
  city: string;
  status: ShowcaseStatus;
  salary: number;
}

const FIRST_NAMES = [
  'Ada',
  'Alan',
  'Grace',
  'Katherine',
  'Margaret',
  'Dorothy',
  'Mary',
  'Tim',
  'Linus',
  'Guido',
  'Bjarne',
  'Barbara',
  'Donald',
  'Edsger',
  'Frances',
  'Jean'
];

const LAST_NAMES = [
  'Lovelace',
  'Turing',
  'Hopper',
  'Johnson',
  'Hamilton',
  'Vaughan',
  'Jackson',
  'Berners-Lee',
  'Torvalds',
  'van Rossum',
  'Stroustrup',
  'Liskov',
  'Knuth',
  'Dijkstra',
  'Allen',
  'Bartik'
];

const ROLES = [
  'Engineer',
  'Researcher',
  'Designer',
  'Mathematician',
  'Product',
  'Support',
  'Ops',
  'Inventor'
];

const TEAMS = ['Core', 'Labs', 'Apollo', 'NACA', 'Web', 'Flight', 'Platform', 'Design'];

const CITIES = [
  'London',
  'Manchester',
  'New York',
  'Cambridge',
  'Hampton',
  'Helsinki',
  'Amsterdam',
  'Paris',
  'Berlin',
  'Tokyo'
];

const STATUSES: ShowcaseStatus[] = ['Active', 'Leave', 'Contract'];

export const SHOWCASE_COUNT = 1200;
export const SHOWCASE_EMPTY: ShowcaseRow[] = [];

export const SHOWCASE_ROWS: ShowcaseRow[] = Array.from({ length: SHOWCASE_COUNT }, (_, index) => {
  const id = index + 1;
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const slug = `${first}.${last}${id}`.toLowerCase().replace(/\s+/g, '');

  return {
    id,
    name: `${first} ${last}`,
    email: `${slug}@example.com`,
    role: ROLES[index % ROLES.length],
    team: TEAMS[index % TEAMS.length],
    city: CITIES[index % CITIES.length],
    status: STATUSES[index % STATUSES.length],
    salary: 72000 + (index % 48) * 2500
  };
});
