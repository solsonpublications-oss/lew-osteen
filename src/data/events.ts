// ============================================================
// Lew Osteen — Author Events (book signings, readings, talks).
// Edit this array to add / update / remove events.
// ============================================================

export type EventStatus = "upcoming" | "past" | "cancelled";

export type AuthorEvent = {
  id: string;
  title: string;
  venue: string;
  city: string;
  state: string;
  date: string; // ISO date
  time: string; // human-readable, e.g. "7:00 PM"
  description: string;
  ticketUrl?: string;
  isFree: boolean;
  status: EventStatus;
  eventType: "Signing" | "Reading" | "Talk" | "Festival" | "Workshop";
};

export const authorEvents: AuthorEvent[] = [
  {
    id: "nod-launch-austin",
    title: "The Pyramids of Nod — Launch Night",
    venue: "BookPeople",
    city: "Austin",
    state: "TX",
    date: "2026-12-05T19:00:00Z",
    time: "7:00 PM",
    description:
      "Join Lew for the official launch of The Pyramids of Nod. Reading, Q&A, and signing. Free admission; first 50 attendees receive a signed bookplate.",
    ticketUrl: "https://bookpeople.com/events",
    isFree: true,
    status: "upcoming",
    eventType: "Reading",
  },
  {
    id: "western-heritage-festival",
    title: "Western Heritage Festival",
    venue: "Mariposa County Fairgrounds",
    city: "Mariposa",
    state: "CA",
    date: "2026-11-15T10:00:00Z",
    time: "10:00 AM",
    description:
      "A day-long celebration of western literature and the California gold country. Lew will sign copies of the Joshua Trail Trilogy and give a talk on researching the trail.",
    ticketUrl: "https://mariposafair.com",
    isFree: true,
    status: "upcoming",
    eventType: "Festival",
  },
  {
    id: "writing-workshop-sonora",
    title: "Research-Driven Fiction — A Workshop",
    venue: "Sonora Public Library",
    city: "Sonora",
    state: "CA",
    date: "2026-11-08T14:00:00Z",
    time: "2:00 PM",
    description:
      "A three-hour workshop on writing historically-grounded fiction. Limited to 20 participants. Bring a work-in-progress. $40 fee includes materials.",
    ticketUrl: "https://sonoralibrary.org/workshops",
    isFree: false,
    status: "upcoming",
    eventType: "Workshop",
  },
  {
    id: "signed-copies-shipping",
    title: "Signed Copies Shipping Window",
    venue: "Online — lewosteen.com",
    city: "Online",
    state: "—",
    date: "2026-10-20T09:00:00Z",
    time: "All day",
    description:
      "The current signed-first-editions window is open. Orders placed this week ship within 5 business days. Personalised inscriptions available at checkout.",
    isFree: true,
    status: "upcoming",
    eventType: "Signing",
  },
  {
    id: "apocalypse-talk-denver",
    title: "The Apocalypse Question — A Talk",
    venue: "Tattered Cover Book Store",
    city: "Denver",
    state: "CO",
    date: "2026-09-20T18:30:00Z",
    time: "6:30 PM",
    description:
      "Lew discusses the hope at the heart of apocalyptic literature, with a reading from The Apocalypse Cometh. Q&A and signing to follow.",
    ticketUrl: "https://tatteredcover.com/events",
    isFree: true,
    status: "past",
    eventType: "Talk",
  },
  {
    id: "judgement-signing-portland",
    title: "The Judgement — Signing",
    venue: "Powell's City of Books",
    city: "Portland",
    state: "OR",
    date: "2026-08-10T19:00:00Z",
    time: "7:00 PM",
    description:
      "Signing and brief reading from The Judgement. Lew's first Portland appearance in three years.",
    ticketUrl: "https://powells.com/events",
    isFree: true,
    status: "past",
    eventType: "Signing",
  },
];

/** Get upcoming events sorted by date (soonest first). */
export function getUpcomingEvents(): AuthorEvent[] {
  const now = Date.now();
  return authorEvents
    .filter((e) => e.status === "upcoming" && new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** Get past events sorted by date (most recent first). */
export function getPastEvents(): AuthorEvent[] {
  return authorEvents
    .filter((e) => e.status === "past")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Format an event date for display. */
export function formatEventDate(iso: string): {
  day: string;
  month: string;
  year: string;
  weekday: string;
  full: string;
} {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year: d.toLocaleDateString("en-US", { year: "numeric" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}
