// import { connectDB } from './api/lib/mongoose';
// import { FantasyPoints } from './api/data/fantasyPoints';
// import { Contest } from './api/data/contests';
// import { rebalanceContestTransaction } from './api/sui';
// import { suiClient } from './api/sui/client';

// // Function to generate random fantasy points
// function generateRandomFantasyPoints(playerCount) {
//   const randomPoints: { playerName: string; totalPoints: number }[] = [];
//   for (let i = 0; i < playerCount; i++) {
//     // Generate random points between 0 and 100
//     const points = Math.floor(Math.random() * 101);
//     randomPoints.push({
//       playerName: `Player_${i + 1}`,
//       totalPoints: points,
//     });
//   }
//   return randomPoints;
// }

// async function rebalanceContest() {
//   await connectDB();
//   console.log('Rebalancing contest...');

//   const contestId = "0x46817fdf4a7872baa09637f05a623da77a0dd279a380705d34a948b82e3f6018";
//   const matchId = "7ab847ee-a1ee-47a9-82bd-ce923b23984f";

//   // Fetch the contest to ensure it exists and get player names
//   const contest = await Contest.findOne({ contestId });
//   if (!contest) {
//     console.error('Contest not found:', contestId);
//     process.exit(1);
//   }

//   // Fetch fantasy points for the match
//   let fantasyPoints = await FantasyPoints.find({ matchId }).lean();

//   // If no fantasy points, generate random ones
//   if (fantasyPoints.length === 0) {
//     console.log('No fantasy points found, generating random points...');
//     fantasyPoints = generateRandomFantasyPoints(contest.playerNames.length);
//   }

//   // Check if the number of fantasy points matches the number of players
//   if (fantasyPoints.length !== contest.playerNames.length) {
//     console.error('Mismatch in number of players and fantasy points:', fantasyPoints.length, contest.playerNames.length);
//     process.exit(1);
//   }

//   // Map fantasy points to player scores in the same order as playerNames
//   const playerScores = contest.playerNames.map((playerName) => {
//     const points = fantasyPoints.find((fp) => fp.playerName === playerName);
//     return points ? points.totalPoints : 1;
//   });

//   console.log('Player scores for rebalancing:', playerScores);

//   // Rebalance the contest on the blockchain
//   try {
//     const output = await rebalanceContestTransaction(contestId, playerScores);
//     await suiClient.waitForTransaction({ digest: output.digest });
//     console.log(`Contest rebalanced successfully. Digest: ${output.digest}`);
//   } catch (error) {
//     console.error('Failed to rebalance contest:', error);
//     process.exit(1);
//   }

//   process.exit(0);
// }

// rebalanceContest().catch((err) => {
//   console.error('Error:', err);
//   process.exit(1);
// });
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://fantasysports:fantasy123@fantasy-sports.47cp4vx.mongodb.net';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('cricket_db');
    const matchesCollection = db.collection('matches');

    // Delete Matches 63 and 64
    await matchesCollection.deleteMany({
      matchId: { $in: ["940a01f0-f893-4bd9-9e1b-352d561f7ee1", "305c7d58-c26f-487d-8404-d30c6ad29f99"] }
    });
    console.log("Deleted Matches 63 and 64");

    // Re-insert Matches 63 and 64
    await matchesCollection.insertMany([
      {
        matchId: "940a01f0-f893-4bd9-9e1b-352d561f7ee1",
        name: "Chennai Super Kings vs Rajasthan Royals, 63rd Match",
        team1Players: ["Shaik Rasheed", "Ravindra Jadeja", "Kamlesh Nagarkoti", "Vijay Shankar", "Jamie Overton", "Vansh Bedi", "Shreyas Gopal", "Andre Siddarth C", "Gurjapneet Singh", "MS Dhoni", "Ravichandran Ashwin", "Anshul Kamboj", "Rahul Tripathi", "Mukesh Choudhary", "Matheesha Pathirana", "Rachin Ravindra", "Ruturaj Gaikwad", "Shivam Dube", "Noor Ahmad", "Ramakrishna Ghosh", "Sam Curran", "Khaleel Ahmed", "Deepak Hooda", "Devon Conway", "Nathan Ellis"],
        team2Players: ["Vaibhav Suryavanshi", "Shimron Hetmyer", "Kunal Singh Rathore", "Ashok Sharma", "Tushar Deshpande", "Shubham Dubey", "Jofra Archer", "Maheesh Theekshana", "Nitish Rana", "Riyan Parag", "Yashasvi Jaiswal", "Kumar Kartikeya", "Dhruv Jurel", "Wanindu Hasaranga", "Sandeep Sharma", "Akash Madhwal", "Fazalhaq Farooqi", "Sanju Samson", "Kwena Maphaka", "Yudhvir Singh Charak"],
        tiers: [1, 2, 3, 2, 3, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2, 1, 2, 3, 1, 2, 1, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2, 1, 2],
        startTime: 1747038600,
        status: "upcoming",
        dateTimeGMT: "2025-05-12T14:00:00Z",
        seriesId: "d5a498c8-7596-4b93-8ab0-e0efc3345312"
      },
      {
        matchId: "305c7d58-c26f-487d-8404-d30c6ad29f99",
        name: "Royal Challengers Bengaluru vs Sunrisers Hyderabad, 64th Match",
        team1Players: ["Manoj Bhandage", "Bhuvneshwar Kumar", "Virat Kohli", "Yash Dayal", "Romario Shepherd", "Jacob Bethell", "Mohit Rathee", "Rajat Patidar", "Tim David", "Lungi Ngidi", "Josh Hazlewood", "Abhinandan Singh", "Swapnil Singh", "Rasikh Dar Salam", "Devdutt Padikkal", "Jitesh Sharma", "Swastik Chikara", "Krunal Pandya", "Philip Salt", "Nuwan Thushara", "Liam Livingstone", "Suyash Sharma"],
        team2Players: ["Heinrich Klaasen", "Eshan Malinga", "Nitish Kumar Reddy", "Harshal Patel", "Abhinav Manohar", "Mohammed Shami", "Aniket Verma", "Rahul Chahar", "Kamindu Mendis", "Abhishek Sharma", "Atharva Taide", "Adam Zampa", "Sachin Baby", "Simarjeet Singh", "Pat Cummins", "Travis Head", "Brydon Carse", "Jaydev Unadkat", "Ishan Kishan", "Zeeshan Ansari"],
        tiers: [2, 3, 1, 2, 3, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2, 1, 2, 1, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2, 1, 2],
        startTime: 1747125000,
        status: "upcoming",
        dateTimeGMT: "2025-05-13T14:00:00Z",
        seriesId: "d5a498c8-7596-4b93-8ab0-e0efc3345312"
      }
    ]);
    console.log("Inserted Matches 63 and 64");

    // Verify the data
    const allSeriesMatches = await matchesCollection.find(
      { seriesId: 'd5a498c8-7596-4b93-8ab0-e0efc3345312' },
      { projection: { matchId: 1, name: 1, status: 1, seriesId: 1 } }
    ).toArray();

    console.log("All matches for series after re-insertion:", allSeriesMatches);
  } catch (err) {
    console.error('Error running query:', err);
  } finally {
    await client.close();
  }
}

run();