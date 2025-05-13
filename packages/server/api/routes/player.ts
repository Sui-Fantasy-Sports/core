// api/routes/players.ts
import { Hono } from 'hono';
import { Player, IPlayer } from "../data/player"

const players = new Hono();

players.get('/players/tiers', async (c) => {
  try {
    const { playerIds } = await c.req.json();
    if (!Array.isArray(playerIds)) {
      return c.json({ error: 'playerIds must be an array' }, 400);
    }

    const players = await Player.find(
      { playerId: { $in: playerIds } },
      { playerId: 1, name: 1, tier: 1, lastUpdated: 1 }
    ).lean<IPlayer[]>().exec();

    const playerTiers = players.reduce((acc, player) => {
      acc[player.playerId] = { tier: player.tier, name: player.name };
      return acc;
    }, {} as Record<string, { tier: number; name: string }>);

    return c.json({ status: 'success', data: playerTiers });
  } catch (error) {
    console.error('Error fetching player tiers:', error);
    return c.json({ error: 'Failed to fetch player tiers' }, 500);
  }
});

export default players;