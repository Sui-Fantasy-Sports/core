export default function () {
  return (
    <div className="border border-gray-600 gap-y-2 rounded-md flex flex-col items-center font-sans gap-x-5 p-4">
      <h1 className="text-lg text-white font-semibold">{"LSG vs MI"}</h1>
      <div className="p-2">
        {bkc.data.map((team, tk) => (
          <div key={tk} className="flex w-full">
            <div className="flex flex-col items-center w-20">
              <img src={team.img} className="size-16" alt={team.shortname} />
              <h2 className="text-sm text-gray-400">{team.teamName}</h2>
            </div>
            <div className="flex-1 flex overflow-x-scroll w-56 px-2 gap-x-1 relative">
              <figure className="fixed z-1 h-full top-0 right-0 w-1/2 from-transparent to-black bg-gradient-to-r" />
              {team.players.map((player, pk) => (
                <div key={pk}>
                  <img
                    className="object-cover size-16"
                    src={player.playerImg}
                  />
                  <p className="text-xs text-gray-400 truncate">{player.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const bkc = {
  apikey: "034fcfbb-3006-45da-818f-2ce888d9b3fa",
  data: [
    {
      teamName: "Lucknow Super Giants",
      shortname: "LSG",
      img: "https://g.cricapi.com/iapi/215-637876059669009476.png?w=48",
      players: [
        {
          id: "151d6979-05d3-4c1f-ae30-0e58af0e8613",
          name: "Ayush Badoni",
          role: "Batting Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "6eaac800-13e7-4a07-8ee2-14acd04cc53f",
          name: "Mitchell Marsh",
          role: "Batting Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "Australia",
          playerImg:
            "https://h.cricapi.com/img/players/6eaac800-13e7-4a07-8ee2-14acd04cc53f.jpg",
        },
        {
          id: "9a71201c-c377-45aa-a355-1af6d2c4bae3",
          name: "Ravi Bishnoi",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm legbreak",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/9a71201c-c377-45aa-a355-1af6d2c4bae3.jpg",
        },
        {
          id: "4d066db8-b202-45a4-8408-28b335c5a767",
          name: "RS Hangargekar",
          role: "Bowling Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/4d066db8-b202-45a4-8408-28b335c5a767.jpg",
        },
        {
          id: "58b0c809-0fdf-44bf-ad68-3e6e0c71aee5",
          name: "Aryan Juyal",
          role: "WK-Batsman",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/58b0c809-0fdf-44bf-ad68-3e6e0c71aee5.jpg",
        },
        {
          id: "3fef81b0-c1e9-45eb-954f-519f3b33d640",
          name: "Aiden Markram",
          role: "Batsman",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "South Africa",
          playerImg:
            "https://h.cricapi.com/img/players/3fef81b0-c1e9-45eb-954f-519f3b33d640.jpg",
        },
        {
          id: "865326f2-3524-478d-9816-5d43158edc7d",
          name: "Akash Singh",
          role: "WK-Batsman",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm legbreak",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "63075eff-1f66-4bf7-923f-5f92ee123283",
          name: "Manimaran Siddharth",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Left-arm orthodox",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "96b0aa6a-d886-4c50-a968-63e5ec31ed0d",
          name: "Akash Deep",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "0a4bb087-ec55-4131-89a1-70f14153dbd9",
          name: "Mohsin Khan",
          role: "Bowler",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Left-arm fast-medium",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "dd665f5d-04e8-436b-b376-8fd2a9b8bf8a",
          name: "Abdul Samad",
          role: "Batting Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm legbreak",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/dd665f5d-04e8-436b-b376-8fd2a9b8bf8a.jpg",
        },
        {
          id: "080ef27d-d01c-4420-9c06-9123796e233a",
          name: "Yuvraj Chaudhary",
          role: "Batting Allrounder",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Left-arm orthodox",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "eaea0d44-195d-49c6-b76b-987e8d1af290",
          name: "Arshin Kulkarni",
          role: "Batting Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "332200ad-d1f8-4035-95c5-b33bd1c9a939",
          name: "Avesh Khan",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/332200ad-d1f8-4035-95c5-b33bd1c9a939.jpg",
        },
        {
          id: "28e1fbef-db2b-48f2-a47d-b6db51dda3c6",
          name: "Digvesh",
          role: "--",
          battingStyle: "Left Handed Bat",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "95bbca5a-f097-43dc-9a47-bdb85f02fb1a",
          name: "Mayank Yadav",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "a67a5fef-c1d6-4264-a6a6-c1984489bd36",
          name: "Prince Yadav",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "0528c7f4-51e4-44d9-b723-cc9eac02a955",
          name: "Himmat Singh",
          role: "Batsman",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "2f50df2f-809d-44f9-b5be-ccb846515861",
          name: "David Miller",
          role: "Batsman",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "South Africa",
          playerImg:
            "https://h.cricapi.com/img/players/2f50df2f-809d-44f9-b5be-ccb846515861.jpg",
        },
        {
          id: "4e8ab9cd-c5af-430e-887b-d22bf74ad052",
          name: "Nicholas Pooran",
          role: "WK-Batsman",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "West Indies",
          playerImg:
            "https://h.cricapi.com/img/players/4e8ab9cd-c5af-430e-887b-d22bf74ad052.jpg",
        },
        {
          id: "b7f8b3f5-1759-43fe-914f-d9dc7f4269e2",
          name: "Matthew Breetzke",
          role: "WK-Batsman",
          battingStyle: "Right Handed Bat",
          country: "South Africa",
          playerImg:
            "https://h.cricapi.com/img/players/b7f8b3f5-1759-43fe-914f-d9dc7f4269e2.jpg",
        },
        {
          id: "2a90b6a9-ac87-49d2-947a-db688f5fcb4c",
          name: "Shamar Joseph",
          role: "Bowler",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm fast",
          country: "West Indies",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "8f4c667c-4bb2-4808-a77b-ebece70f4273",
          name: "Shahbaz Ahmed",
          role: "Bowling Allrounder",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Left-arm orthodox",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/8f4c667c-4bb2-4808-a77b-ebece70f4273.jpg",
        },
        {
          id: "a52b2d20-7c98-4238-9ba4-ec78419a5cc2",
          name: "Rishabh Pant",
          role: "WK-Batsman",
          battingStyle: "Left Handed Bat",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/a52b2d20-7c98-4238-9ba4-ec78419a5cc2.jpg",
        },
      ],
    },
    {
      teamName: "Mumbai Indians",
      shortname: "MI",
      img: "https://g.cricapi.com/iapi/226-637852956375593901.png?w=48",
      players: [
        {
          id: "03bda674-3916-4d64-952e-00a6c19c01e1",
          name: "Rohit Sharma",
          role: "Batsman",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/03bda674-3916-4d64-952e-00a6c19c01e1.jpg",
        },
        {
          id: "c510fbe6-8a16-47e4-ab60-0965720241af",
          name: "Will Jacks",
          role: "Batting Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "England",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "6004fd3f-2264-470d-b39f-340d530b19b3",
          name: "Trent Boult",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Left-arm fast-medium",
          country: "New Zealand",
          playerImg:
            "https://h.cricapi.com/img/players/6004fd3f-2264-470d-b39f-340d530b19b3.jpg",
        },
        {
          id: "aefd9074-da5a-408d-94f1-3be0e79d3b82",
          name: "Tilak Varma",
          role: "Batsman",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/aefd9074-da5a-408d-94f1-3be0e79d3b82.jpg",
        },
        {
          id: "e1dbe0b6-1662-4a8b-80aa-5ed066ddc0fe",
          name: "Krishnan Shrijith",
          role: "WK-Batsman",
          battingStyle: "Left Handed Bat",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "a6686871-5bcd-4aae-8bfc-8298f878b6a9",
          name: "Ryan Rickelton",
          role: "WK-Batsman",
          battingStyle: "Left Handed Bat",
          country: "South Africa",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "cb665f43-1f13-4ae8-acd9-8695ea5fbf9f",
          name: "Karn Sharma",
          role: "Bowler",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm legbreak",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/cb665f43-1f13-4ae8-acd9-8695ea5fbf9f.jpg",
        },
        {
          id: "915fed39-1b6a-4bb0-b7ef-88ee2f4152fd",
          name: "Lizaad Williams",
          role: "Bowler",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "South Africa",
          playerImg:
            "https://h.cricapi.com/img/players/915fed39-1b6a-4bb0-b7ef-88ee2f4152fd.jpg",
        },
        {
          id: "9f98de11-7764-4394-93e3-89f8c05ad378",
          name: "Satyanarayana Raju",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "a90b2371-5c53-4c29-a382-9b52d40a7548",
          name: "Hardik Pandya",
          role: "Batting Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/a90b2371-5c53-4c29-a382-9b52d40a7548.jpg",
        },
        {
          id: "c8864ac7-af66-4719-8100-9dd9fd7e60f3",
          name: "Mujeeb Ur Rahman",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "Afghanistan",
          playerImg:
            "https://h.cricapi.com/img/players/c8864ac7-af66-4719-8100-9dd9fd7e60f3.jpg",
        },
        {
          id: "b64ccf20-292a-4834-b3d7-9de55187f44a",
          name: "Raj Bawa",
          role: "Batting Allrounder",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/b64ccf20-292a-4834-b3d7-9de55187f44a.jpg",
        },
        {
          id: "6ceed869-d2b7-4707-b6fd-cb84419cda12",
          name: "Arjun Tendulkar",
          role: "Bowling Allrounder",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Left-arm fast-medium",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/6ceed869-d2b7-4707-b6fd-cb84419cda12.jpg",
        },
        {
          id: "7e9dc8b1-c44c-44f1-8663-cc42bad7709b",
          name: "Reece Topley",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Left-arm fast-medium",
          country: "England",
          playerImg:
            "https://h.cricapi.com/img/players/7e9dc8b1-c44c-44f1-8663-cc42bad7709b.jpg",
        },
        {
          id: "16ec245b-022d-4104-bd8f-ccc780428390",
          name: "Mitchell Santner",
          role: "Bowling Allrounder",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Left-arm orthodox",
          country: "New Zealand",
          playerImg:
            "https://h.cricapi.com/img/players/16ec245b-022d-4104-bd8f-ccc780428390.jpg",
        },
        {
          id: "237a1ef2-1eae-4877-8b94-d20d84faf635",
          name: "Deepak Chahar",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/237a1ef2-1eae-4877-8b94-d20d84faf635.jpg",
        },
        {
          id: "21ffa053-b03d-4270-a49f-d3e2db9dfde7",
          name: "Robin Minz",
          role: "WK-Batsman",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "71add5ac-55f9-4eb7-9e0c-d51208ae20c0",
          name: "Naman Dhir",
          role: "Batsman",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "8c579447-bfbd-4cf6-a283-db4dc1d5ac33",
          name: "Suryakumar Yadav",
          role: "Batsman",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm offbreak",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/8c579447-bfbd-4cf6-a283-db4dc1d5ac33.jpg",
        },
        {
          id: "6602d875-cf56-46a3-866c-de80aaa006bc",
          name: "Jasprit Bumrah",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast",
          country: "India",
          playerImg:
            "https://h.cricapi.com/img/players/6602d875-cf56-46a3-866c-de80aaa006bc.jpg",
        },
        {
          id: "0e2b638b-e356-41bf-b986-f0f0f84bad38",
          name: "Vignesh Puthur",
          role: "Bowler",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Left-arm wrist-spin",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "af485f9b-d446-41ab-a644-f1a69f0eb600",
          name: "Ashwani Kumar",
          role: "Bowler",
          battingStyle: "Left Handed Bat",
          bowlingStyle: "Left-arm fast-medium",
          country: "India",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
        {
          id: "0485d865-4d05-4d4f-a5ba-f64c9380ee7d",
          name: "Bevon Jacobs",
          role: "Batting Allrounder",
          battingStyle: "Right Handed Bat",
          bowlingStyle: "Right-arm fast-medium",
          country: "New Zealand",
          playerImg: "https://h.cricapi.com/img/icon512.png",
        },
      ],
    },
  ],
  status: "success",
  info: {
    hitsToday: 11,
    hitsUsed: 10,
    hitsLimit: 100,
    credits: 0,
    server: 6,
    queryTime: 21.7112,
    s: 0,
    cache: 0,
  },
};
