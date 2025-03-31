import { syncMatchesAndCreateContests } from "./api/lib/matches"

await syncMatchesAndCreateContests().then(() => {
    console.log('Initial sync completed successfully');
}).catch((error) => {
    console.error('Initial sync failed:', error);
});
