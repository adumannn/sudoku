import { fetchProfileData, formatSince } from "./_profile-data";

export async function ProfileStreakBlock({
  userId,
  userCreatedAt,
}: {
  userId: string;
  userCreatedAt: string | null;
}) {
  const data = await fetchProfileData(userId, userCreatedAt);
  const streakSinceLabel = data.streakStart ? formatSince(data.streakStart) : null;
  return (
    <div className="pt-7 border-t border-sumi/18">
      <div className="mono text-[10.5px] tracking-[0.22em] uppercase text-vermillion mb-2">
        streak — kept
      </div>
      <div
        className="mincho font-semibold text-vermillion -tracking-[0.03em] tnum"
        style={{ fontSize: 128, lineHeight: 0.88 }}
      >
        {data.streak}
        <span
          className="text-sumi font-medium"
          style={{ fontSize: "0.28em", marginLeft: "0.06em", verticalAlign: "0.7em" }}
        >
          日
        </span>
      </div>
      <span className="block ital text-[15px] text-moss mt-2 leading-snug">
        {streakSinceLabel && (
          <>
            since{" "}
            <strong className="mincho not-italic font-semibold text-sumi">
              {streakSinceLabel}
            </strong>
            .
            {data.dailiesKept > 0 && " "}
          </>
        )}
        {data.dailiesKept > 0 && (
          <>
            <strong className="mincho not-italic font-semibold text-sumi">{data.dailiesKept}</strong>{" "}
            of{" "}
            <strong className="mincho not-italic font-semibold text-sumi">
              {Math.max(data.daysOnHako, data.dailiesKept)}
            </strong>{" "}
            dailies kept.
          </>
        )}
        {!streakSinceLabel && data.dailiesKept === 0 && "— begin a streak today."}
      </span>
    </div>
  );
}
