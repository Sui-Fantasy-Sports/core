import api from "../../shared/hooks/api";
import { cn } from "../../shared/utils/utils";

export default function () {
  const contests = api.useDummyContests();
  const mkc = api.useMkc();

  const newContest = api.useNewContest();

  if (contests.isLoading) return <div>Loading...</div>;

  if (contests.isError) return <div>Error</div>;

  return (
    <div>
      {contests.data?.map((contest, key) => (
        <div key={key}>
          <h1>{contest.name}</h1>
          <p>{contest.description}</p>
          <p>Start: {contest.startDate}</p>
          <p>End: {contest.endDate}</p>
        </div>
      ))}

      <p className="text-primary">{mkc.data}</p>

      <button
        onClick={() => newContest.mutate({ name: "popcorn" })}
        className={cn("bg-secondary p-2 rounded-md", newContest.isPending && "animate-pulse opacity-50")}
      >
        {newContest.isPending ? "wait" : "lol ok bitch"}
      </button>
    </div>
  );
}
