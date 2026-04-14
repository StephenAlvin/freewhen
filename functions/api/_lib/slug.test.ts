import { describe, it, expect } from 'vitest';
import { generateSlug, SLUG_RE } from './slug';

describe('generateSlug', () => {
  it('produces adjective-noun-number format', () => {
    const s = generateSlug('eating');
    expect(SLUG_RE.test(s)).toBe(true);
    const [adj, noun, num] = s.split('-');
    expect(adj.length).toBeGreaterThan(0);
    expect(noun.length).toBeGreaterThan(0);
    expect(Number(num)).toBeGreaterThanOrEqual(10);
    expect(Number(num)).toBeLessThanOrEqual(99);
  });
  it('uses theme-specific vocabulary', () => {
    const eating = generateSlug('eating');
    const games = generateSlug('games');
    const eatingNouns = ['dumpling','croissant','ramen','sushi','bagel','muffin','waffle','pancake','taco','burrito','noodle','pizza','donut','pretzel','scone','macaron','tart','eclair','pudding','biscuit','cupcake','cookie','brownie','mochi','curry','sundae','latte','matcha','boba','risotto','gnocchi','baguette','gelato','trifle','crepe'];
    expect(eatingNouns).toContain(eating.split('-')[1]);
    const gameNouns = ['dragon','controller','quest','dice','joystick','pawn','meeple','knight','wizard','rogue','slime','portal','potion','arcade','avatar','phoenix','kraken','goblin','pixel','cartridge','respawn','combo','checkpoint','spaceship','mech','chest','mushroom','gauntlet','labyrinth','golem'];
    expect(gameNouns).toContain(games.split('-')[1]);
  });
  it('produces different slugs across many calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) set.add(generateSlug('eating'));
    expect(set.size).toBeGreaterThan(10);
  });
});

describe('SLUG_RE', () => {
  it('matches valid slugs', () => {
    expect(SLUG_RE.test('plump-dumpling-42')).toBe(true);
  });
  it('rejects malformed slugs', () => {
    expect(SLUG_RE.test('plump-dumpling')).toBe(false);
    expect(SLUG_RE.test('plump-dumpling-9')).toBe(false);
    expect(SLUG_RE.test('plump--42')).toBe(false);
    expect(SLUG_RE.test('')).toBe(false);
  });
});
