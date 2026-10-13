// ============================================================
// Sample book excerpts — short preview passages shown in the
// "Read Excerpt" viewer inside the BookDetailModal. Each excerpt
// is keyed by book slug and contains 2-4 short paragraphs.
// Add or edit excerpts here; missing books just won't show the
// "Read Excerpt" button.
// ============================================================

export type Excerpt = {
  slug: string;
  chapterTitle: string;
  paragraphs: string[];
};

export const EXCERPTS: Record<string, Excerpt> = {
  "the-judgement": {
    slug: "the-judgement",
    chapterTitle: "Chapter One — The Last Day",
    paragraphs: [
      "The morning the sky turned the color of old brass, Satan knew his time had come. He stood at the edge of the obsidian cliff, the wind pulling at his coat, and watched the host of Heaven assemble across the valley — row upon row of light, brighter than any dawn he had witnessed in the long centuries since his fall.",
      "He had prepared, of course. The arguments were honed, the precedents gathered, the small cruelties catalogued as evidence of a world that had moved on without its Maker's permission. But standing here, watching the seraphim descend in their terrible order, he felt something he had not felt since the very first morning: doubt.",
      "\"They are ready,\" said a voice behind him. It was Adramelech, his chancellor, holding out the ledger. \"Every soul you have contested is recorded. Every breach is documented. The courtroom of God will not be unprepared.\"\n\nSatan took the ledger but did not open it. \"It was never the courtroom I feared,\" he said. \"It was the silence after.\"",
    ],
  },
  "the-cure": {
    slug: "the-cure",
    chapterTitle: "Prologue — Patient Zero",
    paragraphs: [
      "The boy was the first. His mother brought him into the clinic at 3:47 a.m., when the waiting room was still empty and the only sound was the hum of the vending machine. He was seven years old and his skin had begun to turn the color of dead leaves.",
      "Dr. Mara Vance did not yet know that she was looking at the beginning of the end. She saw only a frightened child, a frightened mother, and a symptom she could not name. She would later learn that this was the moment everything changed — that the world she had trained her whole life to save was already slipping through her fingers.",
      "\"He was fine this morning,\" the mother whispered. \"He was fine.\"\n\nMara knelt beside the boy and took his hand. It was cold. \"What is your name?\" she asked.\n\nHe looked up at her with eyes that had begun to film over, and he smiled. \"I don't remember,\" he said.",
    ],
  },
  "the-apocalypse-cometh": {
    slug: "the-apocalypse-cometh",
    chapterTitle: "Chapter One — The Sign",
    paragraphs: [
      "The sign appeared at midnight over the desert outside Tucson, and by dawn it had been photographed by every news agency on earth. It hung in the sky like a wound — a great dark circle ringed with fire, perfectly still, perfectly silent, casting no shadow and answering no question.",
      "Father Declan Brody watched it from the steps of his small adobe chapel and felt the weight of every prophecy he had ever preached settle onto his shoulders. He had spent thirty years telling his tiny congregation that the end would come. He had not expected to be believed.",
      "Now, in the cold blue light of the new day, his phone would not stop ringing. Reporters. Believers. Skeptics. The governor's office. A cardinal in Rome. He let it ring. He lit a cigarette — his first in eleven years — and watched the sign slowly fade as the sun rose, and he knew, with a certainty that settled into his bones, that this was only the beginning.",
    ],
  },
  "six-notch-road": {
    slug: "six-notch-road",
    chapterTitle: "Chapter One — The Long Trail",
    paragraphs: [
      "The trail began where the railroad ended, in a town so small it had no name on the surveyor's map — only a notch cut into the sixth post west of the river. Joshua Cable dismounted in the amber dust and stood a long moment looking east, toward everything he was leaving behind.",
      "He had killed a man in Sonora. The man had deserved it, by the reckoning of every honest soul who knew the story, but the law in Sonora was not honest, and Joshua had learned long ago that the law's patience was shorter than a man's memory. He had ridden west for forty days. He had not spoken to another human being in twelve.",
      "The saloon at the end of the trail was called the Notch, and the man behind the bar looked up when Joshua pushed through the batwing doors. \"You look like you've come a long way,\" the barman said.\n\nJoshua laid a silver dollar on the counter. \"Whiskey,\" he said. \"And a room.\"\n\n\"The room costs extra.\"\n\n\"I know.\"\n\nThe barman poured. \"Where you headed?\"\n\nJoshua drank. He did not answer. He did not yet know.",
    ],
  },
  "a-yellow-cotton-dress": {
    slug: "a-yellow-cotton-dress",
    chapterTitle: "Chapter One — The Dress",
    paragraphs: [
      "The dress had belonged to her mother, and to her mother's mother before that, and it had survived three wars, two floods, and one fire that had taken the rest of the house. Eleanor found it folded in the cedar chest on the morning of her twentieth birthday, wrapped in tissue paper that crumbled at her touch.",
      "It was the color of ripe lemons, cut simply, with a small lace collar and pearl buttons down the back. When she held it up against herself in the long mirror, she saw, for the first time, the woman her mother might have been before the world had its way with her.",
      "\"You can wear it,\" her grandmother said from the doorway. Eleanor had not heard her come in. \"It's yours now. But you must promise me one thing.\"\n\n\"What?\" Eleanor asked.\n\n\"Wear it on the day you decide to be brave. Not before. Not after.\"\n\nEleanor looked at the dress. She did not yet know what kind of brave her grandmother meant. She would, before the year was out.",
    ],
  },
  "venus-noire": {
    slug: "venus-noire",
    chapterTitle: "Chapter One — The Most Beautiful Woman",
    paragraphs: [
      "They called her Venus Noire, though her name was Aïcha, and she had been born not in any myth but in a small courtyard in Timbuktu, the daughter of a blacksmith and a blind singer. By the time she was fifteen, every man in the city had composed a poem about her, and by the time she was twenty, half of them had died for the writing.",
      "The French came in the spring of 1893. They brought rifles and measuring tapes and a particular hunger that Aïcha recognized at once, because she had seen it in the eyes of every man since she was thirteen. She did not run. She did not hide. She stood at the gate of her father's compound and waited for them to come to her, because she had learned, very young, that the most beautiful woman in any room is the one who is not afraid of it.",
      "\"Mademoiselle,\" the lieutenant said, removing his hat. His French was Parisian. His hands were shaking.\n\n\"Monsieur,\" Aïcha said. She spoke his language better than he did. She had learned it from a captive. \"You are very far from home.\"\n\n\"As are you,\" he said, though he did not yet know what he meant.",
    ],
  },
  "wigglewagglewattamus": {
    slug: "wigglewagglewattamus",
    chapterTitle: "Chapter One — The Hesitating Hippopotamus",
    paragraphs: [
      "Wigglewagglewattamus was a hippopotamus who lived by a wide slow river, and his trouble — the trouble that gave him his name — was that he could never, ever make up his mind.",
      "\"Should I eat the green grass?\" he would ask himself. \"Or the sweeter yellow grass by the bank?\" And while he was thinking, the green grass would be eaten by the gazelles, and the yellow grass would be eaten by the ducks, and Wigglewagglewattamus would have nothing at all for breakfast but a small disappointed sigh.",
      "His mother, who was very patient, said to him one morning: \"My dear Wiggle, you must learn to choose. Even a wrong choice is better than no choice at all.\"\n\nWigglewagglewattamus thought about this for a very long time. \"But what if I choose the wrong choice?\" he asked.\n\nHis mother smiled. \"Then you will have learned something,\" she said. \"And learning is never wrong.\"",
    ],
  },
  "the-little-rabbit": {
    slug: "the-little-rabbit",
    chapterTitle: "Chapter One — The Rabbit Who Never Looked Up",
    paragraphs: [
      "There was once a little rabbit named Pip who lived in a burrow beneath an old oak tree, and Pip's trouble was that he never, ever looked up. He looked down at the roots. He looked sideways at the mushrooms. He looked at his own small paws. But he never looked up at the sky.",
      "His mother would say, \"Pip, look at the moon tonight — it is the color of cream.\" And Pip would say, \"Yes, Mama,\" and continue looking at a beetle. His father would say, \"Pip, the swallows are dancing — come and see.\" And Pip would say, \"Yes, Papa,\" and continue eating a clover.",
      "Then one morning, a shadow passed over the burrow. All the other rabbits looked up and saw the hawk, and they ran for the deep tunnels. But Pip, who had never looked up, did not know what a hawk looked like. He stood very still in the meadow, wondering what everyone was running from, until the shadow fell on him and it was, for a small rabbit who never looked up, far too late.",
    ],
  },
};

/** Get an excerpt for a book slug. Returns undefined if none. */
export function getExcerpt(slug: string): Excerpt | undefined {
  return EXCERPTS[slug];
}
