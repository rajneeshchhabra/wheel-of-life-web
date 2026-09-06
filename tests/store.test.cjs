const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: filename,
    });
    module._compile(output.outputText, filename);
  };
}
const { initialState, normalizeState, reducer, todayKey } = require('../lib/store.tsx');
const { defaultSections } = require('../lib/catalog.ts');
const fixture = () => ({ ...initialState(), setupDone: true, sections: defaultSections() });

test('legacy saves retain IDs, custom areas and achievements while restoring newer fields', () => {
  const old = fixture();
  old.sections = old.sections.slice(0, 6);
  old.sections[0].name = 'Fitness';
  delete old.sections[0].brickCount;
  delete old.sections[0].bricksLit;
  delete old.sections[0].northStar;
  delete old.sections[0].icon;
  delete old.buddies;
  delete old.workoutSessions;
  old.goals = [{ id:'goal', sectionId:old.sections[0].id, title:'Waist Flat', isAchieved:true, points:25, createdAt:new Date().toISOString() }];
  const state = normalizeState(JSON.parse(JSON.stringify(old)));
  assert.equal(state.sections.length, 6);
  assert.equal(state.sections[0].id, old.sections[0].id);
  assert.equal(state.sections[0].name, 'Fitness');
  assert.equal(state.sections[0].brickCount, 12);
  assert.equal(state.sections[0].bricksLit, 1);
  assert.equal(state.sections[0].northStar, '');
  assert.deepEqual(state.buddies, []);
  assert.deepEqual(normalizeState(state), state);
});

test('task completion awards once, lights a brick, and survives a save/reload', () => {
  let state = fixture();
  state = reducer(state, { type:'addTask', sectionId:state.sections[0].id, title:'Walk outside' });
  state = reducer(state, { type:'completeTask', id:state.tasks[0].id });
  assert.equal(state.sections[0].currentScore, 5);
  assert.equal(state.sections[0].bricksLit, 1);
  assert.equal(state.ledger.length, 1);
  assert.deepEqual(reducer(state, { type:'completeTask', id:state.tasks[0].id }), state);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(state))), state);
});

test('habit daily check-in is idempotent and formed habits can continue', () => {
  let state = fixture();
  state = reducer(state, { type:'addHabit', sectionId:state.sections[0].id, title:'Read' });
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  state.habits[0] = { ...state.habits[0], streak:20, lastCheckIn:todayKey(yesterday) };
  state = reducer(state, { type:'checkInHabit', id:state.habits[0].id });
  assert.equal(state.habits[0].streak, 21);
  assert.equal(state.habits[0].isFormed, true);
  assert.equal(state.sections[0].bricksLit, 1);
  assert.deepEqual(reducer(state, { type:'checkInHabit', id:state.habits[0].id }), state);
});

test('purpose and area north star edits persist together', () => {
  let state = fixture();
  state = reducer(state, { type:'setPurpose', purpose:'A consequential life' });
  assert.equal(state.profile.northStar, 'A consequential life');
  state = reducer(state, { type:'setAspiration', id:state.sections[0].id, aspiration:'ENERGY', aspiration2:'LIFE', northStar:'Stay active' });
  assert.equal(normalizeState(state).sections[0].northStar, 'Stay active');
});

test('delete and explicit reset recalculate bricks without orphaned achievement indicators', () => {
  let state = fixture();
  state = reducer(state, { type:'addGoal', sectionId:state.sections[0].id, title:'A goal' });
  state = reducer(state, { type:'achieveGoal', id:state.goals[0].id });
  const deleted = reducer(state, { type:'delete', kind:'goal', id:state.goals[0].id });
  assert.equal(deleted.sections[0].bricksLit, 0);
  const reset = reducer(state, { type:'eraseAll' });
  assert.equal(reset.sections[0].bricksLit, 0);
  assert.equal(reset.sections[0].currentScore, 0);
  assert.equal(reset.ledger.length, 0);
});

test('leave behind items can be added and removed', () => {
  let state = reducer(fixture(), { type:'addLeaveBehind', items:[{ name:'Doomscrolling', note:'Read instead' }] });
  assert.equal(state.leaveBehind[0].name, 'Doomscrolling');
  state = reducer(state, { type:'removeLeaveBehind', id:state.leaveBehind[0].id });
  assert.equal(state.leaveBehind.length, 0);
});

test('malformed saved collections are rejected instead of silently erasing them', () => {
  assert.throws(() => normalizeState({ ...fixture(), tasks: {} }));
  assert.throws(() => normalizeState(null));
});

test('an undo snapshot restores tasks, ledger, score and bricks together', () => {
  let before = fixture();
  before = reducer(before, { type:'addTask', sectionId:before.sections[0].id, title:'Take a step' });
  const completed = reducer(before, { type:'completeTask', id:before.tasks[0].id });
  const undone = reducer(completed, { type:'hydrate', state:before });
  assert.equal(undone.tasks[0].isDone, false);
  assert.equal(undone.sections[0].currentScore, 0);
  assert.equal(undone.sections[0].bricksLit, 0);
  assert.equal(undone.ledger.length, 0);
});

test('balance bonus compares every area after pending decay', () => {
  const { award } = require('../lib/scoring.ts');
  const sections = defaultSections().slice(0,2);
  const now = new Date('2026-09-06T12:00:00');
  const old = new Date('2026-09-04T12:00:00').toISOString();
  const a = { ...sections[0], currentScore:20, decayPerDay:0.5, lastDecayAppliedAt:old };
  const b = { ...sections[1], currentScore:21, decayPerDay:5, lastDecayAppliedAt:old };
  assert.equal(award(5, a, [a,b], now).balanceBonusApplied, false);
  assert.equal(award(5, b, [a,b], now).balanceBonusApplied, true);
});
