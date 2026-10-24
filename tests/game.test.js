const test = require('node:test');
const assert = require('node:assert/strict');
const { Attack } = require('../dist/models/Attack');
const { Pokemon } = require('../dist/models/Pokemon');
const { Trainer } = require('../dist/models/Trainer');
const { BattleService } = require('../dist/services/BattleService');
const { GameRepository } = require('../dist/services/GameRepository');
const { app } = require('../dist/app');

function trainer(id, pokemonId, life, damage, limit = 200) {
  return new Trainer(id, `Trainer ${id}`, 1, 0, [
    new Pokemon(pokemonId, `Pokemon ${pokemonId}`, life, life,
      [new Attack(pokemonId, `Attack ${pokemonId}`, damage, limit)])
  ]);
}

test('attack limits, healing, learning constraints and experience', () => {
  const pokemon = new Pokemon(1, 'Pikachu', 10, 10);
  const attack = new Attack(1, 'Spark', 4, 1);
  pokemon.learnAttack(attack);
  assert.throws(() => pokemon.learnAttack(attack), /already knows/);
  const opponent = new Pokemon(2, 'Rattata', 3, 3);
  pokemon.attack(opponent);
  assert.equal(opponent.lifePoint, 0);
  assert.equal(attack.usageCount, 1);
  assert.equal(pokemon.attack(opponent), null);
  assert.throws(() => attack.use(), /usage limit/);
  pokemon.heal();
  assert.equal(attack.usageCount, 0);
  assert.match(attack.info(), /Spark/);
  for (let id = 2; id <= 4; id++) pokemon.learnAttack(new Attack(id, `Attack ${id}`, 1, 1));
  assert.throws(() => pokemon.learnAttack(new Attack(5, 'Fifth', 1, 1)), /at most four/);
  const owner = new Trainer(1, 'Ash');
  owner.addPokemon(pokemon);
  owner.gainExperience(27);
  assert.equal(owner.level, 3);
  assert.equal(owner.experience, 7);
});

test('random challenge heals both trainers and awards one experience point', () => {
  const first = trainer(1, 1, 10, 10);
  const second = trainer(2, 2, 5, 1);
  first.pokemons[0].lifePoint = 1;
  first.pokemons[0].attacks[0].usageCount = 1;
  const result = new BattleService().randomChallenge(first, second);
  assert.equal(result.winnerId, 1);
  assert.equal(first.pokemons[0].lifePoint, 10);
  assert.equal(first.experience, 1);
  assert.equal(second.pokemons[0].lifePoint, 0);
});

test('first arena runs 100 challenges and keeps level progression', () => {
  const first = trainer(1, 1, 10, 10);
  const second = trainer(2, 2, 5, 1);
  const result = new BattleService().firstArena(first, second);
  assert.equal(result.challenges, 100);
  assert.equal(result.firstWins, 100);
  assert.equal(result.winnerId, 1);
  assert.equal(first.level, 11);
  assert.equal(first.experience, 0);
});

test('deterministic challenge chooses most living HP without healing', () => {
  const first = trainer(1, 1, 10, 10);
  first.pokemons[0].lifePoint = 1;
  first.addPokemon(new Pokemon(3, 'Healthy', 8, 8, [new Attack(3, 'Hit', 10, 1)]));
  const second = trainer(2, 2, 5, 1);
  const result = new BattleService().deterministicChallenge(first, second);
  assert.equal(result.firstPokemonId, 3);
  assert.equal(first.pokemons[0].lifePoint, 1);
  assert.equal(result.winnerId, 1);
});

test('second arena stops when a trainer has no living Pokemon', () => {
  const first = trainer(1, 1, 10, 10);
  const second = trainer(2, 2, 5, 1);
  const result = new BattleService().secondArena(first, second);
  assert.equal(result.challenges, 1);
  assert.equal(result.winnerId, 1);
  assert.equal(first.experience, 1);
});

test('exhausted attacks cause a draw and stop the second arena', () => {
  const first = trainer(1, 1, 10, 1, 1);
  const second = trainer(2, 2, 10, 1, 1);
  first.pokemons[0].attacks[0].usageCount = 1;
  second.pokemons[0].attacks[0].usageCount = 1;
  const result = new BattleService().secondArena(first, second);
  assert.equal(result.challenges, 1);
  assert.equal(result.winnerId, null);
  assert.equal(first.pokemons[0].lifePoint, 10);
});

test('HTTP routes reject invalid input with JSON errors', async () => {
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.on('error', reject);
  });
  try {
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;
    const invalidAttack = await fetch(`${base}/attacks`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Hit', damage: -1, usageLimit: 3 })
    });
    assert.equal(invalidAttack.status, 400);
    assert.match((await invalidAttack.json()).error, /damage/);
    const sameTrainer = await fetch(`${base}/battles/random`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ firstTrainerId: 1, secondTrainerId: 1 })
    });
    assert.equal(sameTrainer.status, 400);
    const missing = await fetch(`${base}/unknown`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('all requested REST endpoints are connected to controllers', async () => {
  const originals = {};
  const replacements = {
    createAttack: async () => new Attack(1, 'Hit', 10, 200),
    getAttack: async () => new Attack(1, 'Hit', 10, 200),
    listAttacks: async () => [new Attack(1, 'Hit', 10, 200)],
    createPokemon: async () => new Pokemon(1, 'Pikachu', 10, 10),
    getPokemon: async () => new Pokemon(1, 'Pikachu', 10, 10),
    listPokemons: async () => [new Pokemon(1, 'Pikachu', 10, 10)],
    learnAttack: async () => new Pokemon(1, 'Pikachu', 10, 10,
      [new Attack(1, 'Hit', 10, 200)]),
    createTrainer: async () => new Trainer(1, 'Ash'),
    getTrainer: async () => new Trainer(1, 'Ash'),
    listTrainers: async () => [new Trainer(1, 'Ash')],
    addPokemon: async () => new Trainer(1, 'Ash'),
    changeTrainers: async (ids, change) => change(ids.map((id, index) =>
      trainer(id, id, index === 0 ? 10 : 5, index === 0 ? 10 : 1)))
  };
  for (const [name, replacement] of Object.entries(replacements)) {
    originals[name] = GameRepository.prototype[name];
    GameRepository.prototype[name] = replacement;
  }
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.on('error', reject);
  });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    async function check(method, path, body, expectedStatus = 200) {
      const response = await fetch(`${base}${path}`, {
        method, headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      assert.equal(response.status, expectedStatus, `${method} ${path}`);
      return response.json();
    }
    assert.equal((await check('POST', '/attacks',
      { name: 'Hit', damage: 10, usageLimit: 200 }, 201)).name, 'Hit');
    assert.equal((await check('GET', '/attacks')).length, 1);
    assert.equal((await check('GET', '/attacks/1')).id, 1);
    assert.equal((await check('POST', '/pokemons',
      { name: 'Pikachu', lifePoint: 10 }, 201)).name, 'Pikachu');
    assert.equal((await check('GET', '/pokemons')).length, 1);
    assert.equal((await check('GET', '/pokemons/1')).id, 1);
    assert.equal((await check('POST', '/pokemons/1/attacks', { attackId: 1 })).attacks.length, 1);
    assert.equal((await check('POST', '/trainers', { name: 'Ash' }, 201)).name, 'Ash');
    assert.equal((await check('GET', '/trainers')).length, 1);
    assert.equal((await check('GET', '/trainers/1')).id, 1);
    await check('POST', '/trainers/1/pokemons', { pokemonId: 1 });
    await check('POST', '/trainers/1/tavern', {});
    const ids = { firstTrainerId: 1, secondTrainerId: 2 };
    assert.equal((await check('POST', '/battles/random', ids)).winnerId, 1);
    assert.equal((await check('POST', '/battles/arena-1', ids)).challenges, 100);
    assert.equal((await check('POST', '/battles/deterministic', ids)).winnerId, 1);
    assert.equal((await check('POST', '/battles/arena-2', ids)).winnerId, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
    for (const [name, original] of Object.entries(originals)) {
      GameRepository.prototype[name] = original;
    }
  }
});
