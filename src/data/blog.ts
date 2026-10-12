// ============================================================
// Lew Osteen — Author Blog / News posts.
// Edit this array to add / update / remove posts.
// Each post: { slug, title, excerpt, body (markdown-ish plain text), date, category, readMins, cover? }
// ============================================================

export type BlogCategory =
  | "Writing"
  | "Research"
  | "News"
  | "Behind the Scenes"
  | "Reader Mail";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[]; // array of paragraphs
  date: string; // ISO date
  category: BlogCategory;
  readMins: number;
  cover?: string;
  tags?: string[];
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  "Writing",
  "Research",
  "News",
  "Behind the Scenes",
  "Reader Mail",
];

export const blogPosts: BlogPost[] = [
  {
    slug: "the-long-road-to-nod",
    title: "The Long Road to Nod",
    excerpt:
      "How a single shadow on a distant world became a decade-spanning novel — and why I could not let it go.",
    body: [
      "It started, as so many of my stories do, with a single image. A shadow on a distant world that should not have been there. A shadow that, when I looked closer, resembled a pyramid.",
      "I was reading about Teegarden b — a planet orbiting a nearby red dwarf — and the question that would not leave me alone was simple: what would a person do if they travelled twelve light-years and found a monument older than the people living beneath it?",
      "The first draft of The Pyramids of Nod was finished in 2018. It was, by every honest measure, a mess. I had the question but not the answer; I had David, my archaeologist, but not his grief; I had the pyramid but not its purpose. I put the manuscript in a drawer and went back to the westerns that pay the bills.",
      "Five years and seven rewrites later, the book you will read this winter is the one I always wanted to write. It is about faith and doubt, about the long cost of curiosity, and about the moment a man realises the universe has been waiting for him to ask the right question.",
      "I cannot wait for you to read it.",
    ],
    date: "2026-09-15T10:00:00Z",
    category: "Writing",
    readMins: 4,
    tags: ["The Pyramids of Nod", "sci-fi", "new release"],
  },
  {
    slug: "researching-the-joshua-trail",
    title: "Researching the Joshua Trail",
    excerpt:
      "Three summers in the California gold country, two worn-out boots, and the old prospector who showed me where the trail began.",
    body: [
      "The Joshua Trail Trilogy began with a map I found in the back of a Sonora antique shop in the summer of 2013. It was hand-drawn, faded, and it showed a road the surveyors had missed — a sixth notch cut into a post west of the river, marking a town that no longer existed.",
      "I spent the next three summers walking that country. I slept in the bed of a pickup truck outside Coulterville. I drank terrible coffee in a Mariposa diner with a man named Emmett who claimed to be ninety-three and who could still shoe a horse. I learned to read the land the way the old-timers read it — by the angle of a creek bed, the colour of the dirt, the way the deer moved at dusk.",
      "Westerns are not really about the West. They are about what a person carries with them when they have left everything else behind. Joshua Cable, my protagonist, carries a killing he cannot undo and a trail he cannot finish. He is, in some ways, every man I met in those summers — patient, weathered, and unwilling to explain himself.",
      "Six Notch Road, The Joshua Trail, and A Season of Reckoning are the three books of that trail. I hope they feel as honest to you as the country felt to me.",
    ],
    date: "2026-08-22T14:30:00Z",
    category: "Research",
    readMins: 5,
    tags: ["Joshua Trail", "westerns", "research"],
  },
  {
    slug: "the-apocalypse-question",
    title: "The Apocalypse Question",
    excerpt:
      "Why I write apocalyptic fiction — and why I think the genre is, at its best, the most hopeful literature we have.",
    body: [
      "People often ask me why a writer of westerns and historical fiction would turn to apocalypse. The honest answer is that I have always been writing about the same thing: what a person does when the world they knew is gone.",
      "The Apocalypse Cometh and Wake Up World! were born out of a long meditation on the Book of Revelation and the older prophecies that shaped it. I am not, by nature, a fearful man. But I am a careful reader of signs, and the signs I see around me now — in the weather, in the politics, in the quiet desperation of the people I meet at book signings — are signs I recognise.",
      "But here is the thing: apocalyptic literature, at its truest, is not about the end. It is about what survives the end. It is about the small acts of mercy that outlast the great collapses. It is about a father who still packs a lunch for his child on the morning the sky falls.",
      "That is the hope I write toward. Not the fire. The lunch.",
    ],
    date: "2026-07-30T09:15:00Z",
    category: "Writing",
    readMins: 3,
    tags: ["apocalyptic", "prophecy", "hope"],
  },
  {
    slug: "signed-first-editions-are-back",
    title: "Signed First Editions Are Back",
    excerpt:
      "After many requests, I've secured a small run of signed first editions for direct purchase. Here's how to claim one.",
    body: [
      "A quick note for the readers who have been asking: yes, signed first editions are back in the store. I have a small run — fifty copies each of The Judgement, The Cure, and the Apocalypse Cometh pair — and they are available now on this site.",
      "Each copy is signed by me on the title page and includes a personalised bookplate. If you are buying one as a gift, leave the recipient's name in the order notes and I will address the inscription to them.",
      "These tend to go fast. I do not know when I will have another run. If you have been waiting, this is the moment.",
      "Thank you, as ever, for reading.",
    ],
    date: "2026-09-28T16:00:00Z",
    category: "News",
    readMins: 1,
    tags: ["signed copies", "news", "limited run"],
  },
  {
    slug: "a-letter-from-a-reader-in-utah",
    title: "A Letter from a Reader in Utah",
    excerpt:
      "A reader writes about her father, a worn copy of A Yellow Cotton Dress, and the day she finally understood the ending.",
    body: [
      "I want to share a letter I received last month. The writer has given me permission to quote her, but asked that I not use her last name.",
      "\"Dear Mr. Osteen,\" she wrote. \"My father died in March. He was a quiet man — a foreman at a copper mine, a deacon at our church, a man who read three books a year and reread them all. Among his things I found a copy of A Yellow Cotton Dress, so worn the spine had split. I read it in one night. I am writing to tell you that I finally understand the ending. I think my father understood it for a long time before he could say it. Thank you for writing it for him.\"",
      "I have been writing for forty years. I have received awards and bad reviews and long silences. Nothing has ever meant more to me than that letter.",
      "I am sharing it with her permission because I want to say, to every reader who has ever considered writing to an author and decided not to: please write. We are alone in our rooms. Your letters are the only proof we have that the work reached anyone at all.",
    ],
    date: "2026-06-12T11:45:00Z",
    category: "Reader Mail",
    readMins: 2,
    tags: ["readers", "A Yellow Cotton Dress"],
  },
  {
    slug: "behind-the-cure",
    title: "Behind the Cure",
    excerpt:
      "The real medical case that inspired The Cure — and the ethical question I could not stop asking.",
    body: [
      "The Cure began with a journal article I read in 2019, about a small cluster of patients in a rural hospital who presented with symptoms no one could name. The article was clinical, detached, and it ended with a sentence that has stayed with me: 'The etiology remains unknown.'",
      "I am not a doctor. I am a storyteller. But I could not stop asking the question the article refused to ask: what would a doctor do if she was the only one who saw the pattern — and what if the pattern was not a disease at all, but a cure?",
      "Mara Vance, my protagonist, is a virologist at the end of her career and the end of her patience. She has spent her life studying the things that kill us. When the boy is brought to her clinic at 3:47 a.m., she does not yet know that she is looking at the beginning of the end — or that the end might, in some terrible way, be a mercy.",
      "The book is a thriller, but it is also a question. I do not pretend to answer it. I only ask it as honestly as I can.",
    ],
    date: "2026-05-18T13:00:00Z",
    category: "Behind the Scenes",
    readMins: 4,
    tags: ["The Cure", "thriller", "inspiration"],
  },
];

/** Get a post by slug. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/** Format a post date for display. */
export function formatPostDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
