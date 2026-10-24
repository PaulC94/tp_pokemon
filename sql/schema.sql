CREATE TABLE trainers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    experience INTEGER NOT NULL DEFAULT 0 CHECK (experience BETWEEN 0 AND 9)
);

CREATE TABLE pokemons (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    initial_life_point INTEGER NOT NULL CHECK (initial_life_point > 0),
    life_point INTEGER NOT NULL CHECK (life_point >= 0),
    trainer_id INTEGER REFERENCES trainers(id),
    CHECK (life_point <= initial_life_point)
);

CREATE TABLE attacks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
    damage INTEGER NOT NULL CHECK (damage > 0),
    usage_limit INTEGER NOT NULL CHECK (usage_limit > 0)
);

CREATE TABLE pokemon_attacks (
    pokemon_id INTEGER NOT NULL REFERENCES pokemons(id),
    attack_id INTEGER NOT NULL REFERENCES attacks(id),
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    PRIMARY KEY (pokemon_id, attack_id)
);
