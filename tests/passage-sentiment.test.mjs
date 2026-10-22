import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePassages, textSentiment } from '../lib/passageSentiment.ts';

test('passage reading preserves the full paragraph and separates emotional changes', () => {
  const text = 'I was terrified and overwhelmed. The nurse was kind, reassuring, and helpful. I felt grateful and safe.';
  const analysis = analyzePassages(text);
  assert.equal(analysis.passages.length, 3);
  assert.equal(analysis.passages.map(p => p.text).join(' '), text);
  assert.ok(analysis.passages[0].score < -.15);
  assert.ok(analysis.passages[1].score > .15);
  assert.ok(analysis.passages[2].score > .15);
  assert.equal(analysis.overall, textSentiment(text));
});
test('local sentiment handles negation and intensity without inventing readings for unknown words', () => {
  assert.ok(textSentiment('not good') < 0);
  assert.ok(textSentiment('not bad') > 0);
  assert.ok(textSentiment('very happy') > textSentiment('happy'));
  assert.ok(textSentiment('slightly worried') > textSentiment('worried'));
  assert.equal(textSentiment('The appointment is on Tuesday.'), 0);
  assert.equal(textSentiment(''), 0);
  assert.equal(textSentiment('The care team organized staffing.'), 0);
  assert.ok(textSentiment('I am concerned and worried.') < 0);
  assert.ok(textSentiment('I am hoping for improvement.') > 0);
  assert.equal(textSentiment('I would like an appointment.'), 0);
});
test('long text remains bounded and retains every word across paragraph boundaries', () => {
  const text = Array.from({ length: 250 }, (_, i) => `Sentence ${i} is helpful.`).join('\n\n');
  const result = analyzePassages(text);
  assert.ok(result.passages.length <= 100);
  assert.equal(result.passages.map(p => p.text).join(' ').replace(/\s+/g, ' ').trim(), text.replace(/\s+/g, ' ').trim());
  assert.ok(result.passages.every(p => Number.isFinite(p.score) && p.score >= -1 && p.score <= 1));
  const paragraphs = analyzePassages('First paragraph is difficult.\n\nSecond paragraph is hopeful.');
  assert.notEqual(paragraphs.passages[0].paragraph, paragraphs.passages[1].paragraph);
});
