/** Local, deterministic text reading adapted from the supplied sentiment reference. */
export interface Passage { text: string; score: number; paragraph: number }
const lexicon = new Map<string, number>();
function words(weight: number, list: string) { for (const word of list.split(' ')) lexicon.set(word, weight); }
words(3, 'amazing awesome beautiful brilliant delightful ecstatic excellent fantastic flawless grateful happiness happy incredible joyful love loved lovely magnificent outstanding perfect phenomenal superb thrilled wonderful');
words(2, 'admire appreciate appreciated best better bright calm celebrate charming cheerful comfortable comfort confident eager enjoy enjoyed exciting excited fond friendly friends fun glad good great heal hopeful hope impressed inspiring kind laugh like liked lucky peaceful pleasant pleased positive proud recommend refreshing relief relieved safe satisfying smile strong success successful sweet thoughtful trust warm welcome win winning worth accessible affordable convenient compassionate reassuring stable hoping helpful helped reassured relieved');
words(1, 'agree benefit clear familiar fine fresh gentle improve improved improvement interesting light nice okay opportunity pretty progress promising ready simple slowly solid support useful well helpful prepared');
words(-1, 'awkward bored boring confusing difficult doubt dull hard hesitate lonely miss missed missing nervous odd rough slow strange tired uncertain unfamiliar unsure wait worried uncertainty unclear waiting concerns concern barriers barrier limited');
words(-2, 'afraid angry annoy annoyed awful bad broken cold complain cruel damage depressing disappointed disappointing discomfort dislike disliked dreadful fail failed failure fear frustrated frustrating grief guilt harm hate hated hurt lack lie lies loss miserable negative pain painful poor regret reject rude sad scared shame stressful struggle terrible uncomfortable unhappy unpleasant upset useless weak worse wrong burnout backlogs backlog shortages shortage delays delayed delay expensive unaffordable isolation disruption disrupted overwhelmed frightened concerned worrying frustrated stressful');
words(-3, 'abysmal appalling atrocious catastrophic devastated disastrous disgusting horrible horrendous horrific hopeless loathe nightmare pathetic terrifying tragic unbearable worthless worst terrified');
const negations = new Set(['not', 'no', 'never', 'neither', 'nor', 'without', 'hardly', 'barely', 'isnt', 'wasnt', 'dont', 'doesnt', 'didnt', 'cant', 'couldnt', 'wouldnt', 'shouldnt']);
const boosters = new Set(['very', 'really', 'extremely', 'incredibly', 'absolutely', 'deeply', 'so', 'truly', 'especially']);
const dampeners = new Set(['slightly', 'somewhat', 'rather', 'little', 'quite']);
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

function rawSentiment(text: string) {
  const tokens = text.toLowerCase().replace(/[’']/g, '').match(/[a-z]+/g) ?? [];
  let sum = 0, hits = 0;
  tokens.forEach((word, index) => {
    if (!lexicon.has(word)) return;
    if (word === 'like' && ['would', 'could'].includes(tokens[index - 1])) return;
    let weight = lexicon.get(word)!;
    let prior = tokens.slice(Math.max(0, index - 3), index);
    const contrast = Math.max(prior.lastIndexOf('but'), prior.lastIndexOf('however'));
    if (contrast >= 0) prior = prior.slice(contrast + 1);
    if (prior.filter(token => negations.has(token)).length % 2) weight *= -.8;
    if (boosters.has(tokens[index - 1])) weight *= 1.3;
    if (dampeners.has(tokens[index - 1])) weight *= .65;
    sum += weight; hits++;
  });
  return { sum, hits };
}
export function textSentiment(text: string) {
  const { sum, hits } = rawSentiment(text);
  return hits ? Math.max(-1, Math.min(1, Math.tanh(sum / (Math.sqrt(hits) * 3.2)))) : 0;
}
export function analyzePassages(text: string): { passages: Passage[]; overall: number } {
  let passages: Passage[] = text.split(/\n+/).flatMap((paragraph, paragraphIndex) => {
    return Array.from(segmenter.segment(paragraph)).flatMap(({ segment }) => {
      // Like the reference, split long sentences at clause/word boundaries.
      const sentence = segment.trim();
      if (!sentence) return [];
      const clauses = sentence.split(/\s+/).length <= 26 ? [sentence] : sentence.split(/(?<=[,;])\s+/);
      return clauses.flatMap(clause => {
        const tokens = clause.trim().split(/\s+/);
        const chunks: string[] = [];
        if (tokens.length <= 26) chunks.push(tokens.join(' '));
        else for (let index = 0; index < tokens.length; index += 22) chunks.push(tokens.slice(index, index + 22).join(' '));
        return chunks.filter(Boolean).map(chunk => ({ text: chunk, score: textSentiment(chunk), paragraph: paragraphIndex }));
      });
    });
  });
  // Bound the interactive DOM without discarding any text.
  if (passages.length > 100) {
    const size = Math.ceil(passages.length / 100), grouped: Passage[] = [];
    for (let index = 0; index < passages.length; index += size) {
      const text = passages.slice(index, index + size).map(p => p.text).join(' ');
      grouped.push({ text, score: textSentiment(text), paragraph: passages[index].paragraph });
    }
    passages = grouped;
  }
  return { passages, overall: textSentiment(text) };
}
export const textFeeling = (score: number) => score > .55 ? 'Strongly positive' : score > .15 ? 'Mostly positive' : score < -.55 ? 'Strongly negative' : score < -.15 ? 'Mostly negative' : 'Close to neutral';
