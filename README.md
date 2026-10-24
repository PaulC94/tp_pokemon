# API Pokémon

API REST scolaire en Express, TypeScript et PostgreSQL. Les classes `Attack`, `Pokemon` et `Trainer` portent les règles métier ; `BattleService` organise les combats ; `GameRepository` lit et enregistre les données avec `pg`.

## Installation

1. Installer les dépendances avec `npm install`.
2. Créer une base PostgreSQL nommée `pokemon`, puis exécuter `sql/schema.sql` dans cette base.
3. Copier `.env.example` en `.env` et adapter `DATABASE_URL`.
4. Lancer `npm run build`, puis `npm start`.

Le serveur écoute sur le port 3000, sauf si `PORT` est défini. `npm test` vérifie les règles métier et les réponses HTTP de validation.

## Endpoints

| Méthode | Route | Corps JSON pour POST |
| --- | --- | --- |
| POST | `/attacks` | `{ "name": "Spark", "damage": 4, "usageLimit": 5 }` |
| GET | `/attacks`, `/attacks/:id` | — |
| POST | `/pokemons` | `{ "name": "Pikachu", "lifePoint": 30 }` |
| GET | `/pokemons`, `/pokemons/:id` | — |
| POST | `/pokemons/:id/attacks` | `{ "attackId": 1 }` |
| POST | `/trainers` | `{ "name": "Ash" }` |
| GET | `/trainers`, `/trainers/:id` | — |
| POST | `/trainers/:id/pokemons` | `{ "pokemonId": 1 }` |
| POST | `/trainers/:id/tavern` | `{}` |
| POST | `/battles/random`, `/battles/arena-1`, `/battles/deterministic`, `/battles/arena-2` | `{ "firstTrainerId": 1, "secondTrainerId": 2 }` |

Le premier dresseur du corps JSON attaque en premier. Le gagnant de chaque défi reçoit 1 point d'expérience ; un match nul n'en donne pas. Un Pokémon sans attaque disponible passe son tour ; si les deux sont épuisés, le défi est nul. L'arène 2 s'arrête alors également, car rejouer sans soin ne changerait rien. Après 100 défis en arène 2, le plus grand nombre de victoires décide du vainqueur, avec match nul en cas d'égalité.

Les réponses sont en JSON. Les erreurs de saisie retournent 400, les ressources absentes 404 et les conflits de règles métier 409. Les PV, compteurs d'utilisation, niveaux et expériences issus d'un combat sont enregistrés ensemble dans une transaction PostgreSQL.
