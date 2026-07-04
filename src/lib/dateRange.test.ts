import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ageDays,
  withinWindow,
  filterByWindow,
  ageLabel,
  DAY_MS,
} from './dateRange.ts';

const NOW = Date.parse('2026-06-29T12:00:00Z');

test('DAY_MS est exact', () => {
  assert.equal(DAY_MS, 24 * 60 * 60 * 1000);
});

test('ageDays — jours entiers et fractionnaires', () => {
  assert.equal(ageDays('2026-06-29T12:00:00Z', NOW), 0);
  assert.equal(ageDays('2026-06-28T12:00:00Z', NOW), 1);
  assert.equal(Math.round(ageDays('2026-06-22T12:00:00Z', NOW)), 7);
  assert.equal(ageDays('2026-06-29T00:00:00Z', NOW), 0.5);
});

test('ageDays — date invalide = +Infinity', () => {
  assert.equal(ageDays('pas-une-date', NOW), Number.POSITIVE_INFINITY);
});

test('ageDays — date future bornée à 0', () => {
  assert.equal(ageDays('2026-07-10T12:00:00Z', NOW), 0);
});

test('withinWindow — bornes et fenêtre « tout »', () => {
  assert.equal(withinWindow('2026-06-25T12:00:00Z', 7, NOW), true);
  assert.equal(withinWindow('2026-06-01T12:00:00Z', 7, NOW), false);
  assert.equal(withinWindow('2026-06-22T12:00:00Z', 7, NOW), true); // exactement 7 j
  assert.equal(withinWindow('2010-01-01T00:00:00Z', 0, NOW), true);
});

test('filterByWindow — ne garde que les éléments dans la fenêtre', () => {
  const items = [
    { publishedAt: '2026-06-28T12:00:00Z' },
    { publishedAt: '2026-05-01T12:00:00Z' },
    { publishedAt: '2026-06-25T12:00:00Z' },
  ];
  assert.equal(filterByWindow(items, 7, NOW).length, 2);
  assert.equal(filterByWindow(items, 0, NOW).length, 3);
  // ne mute pas l'entrée
  assert.equal(items.length, 3);
});

test('ageLabel — libellés FR', () => {
  assert.equal(ageLabel(0.2), "aujourd'hui");
  assert.equal(ageLabel(3), '3 j');
  assert.equal(ageLabel(21), '3 sem');
  assert.equal(ageLabel(90), '3 mois');
  assert.equal(ageLabel(Number.POSITIVE_INFINITY), '—');
});
