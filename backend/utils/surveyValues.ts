/**
 * The only answer values the survey form sends (see `frontend/src/site/Survey.tsx`:
 * `YES_NO`, `SECTORS`, `LOCATIONS`, `NOT_APPLICABLE`). The admin statistics count
 * answers by exact value, so anything else would be stored but silently never
 * counted.
 */
export const YES_NO = ["yes", "no"] as const;

/** Sent for the three job questions when the graduate is not employed. */
export const NOT_APPLICABLE = "not applicable";

export const ORGANIZATIONS = [
  "government",
  "private institution",
  "entrepreneurial / freelance",
] as const;

export const LOCATIONS = ["locally", "abroad"] as const;

/** `true` when `value` is one of `allowed` (both already lower-cased). */
export const isOneOf = (
  value: string,
  allowed: readonly string[],
): boolean => allowed.includes(value);

/**
 * Checks the six survey answers against each other.
 *
 * @returns `true` when the answers are consistent: the three yes/no answers are
 * `yes` or `no`; an employed graduate gives a yes/no, an organization type and a
 * location; a graduate who is not employed gives `not applicable` for all three.
 */
export const answersAreConsistent = (a: {
  isEmployed: string;
  isJobAligned: string;
  isSelfEmployed: string;
  isFurtherStudies: string;
  typeOfOrganization: string;
  currentJobLocated: string;
}): boolean => {
  if (
    !isOneOf(a.isEmployed, YES_NO) ||
    !isOneOf(a.isSelfEmployed, YES_NO) ||
    !isOneOf(a.isFurtherStudies, YES_NO)
  ) {
    return false;
  }

  if (a.isEmployed === "yes") {
    return (
      isOneOf(a.isJobAligned, YES_NO) &&
      isOneOf(a.typeOfOrganization, ORGANIZATIONS) &&
      isOneOf(a.currentJobLocated, LOCATIONS)
    );
  }

  return (
    a.isJobAligned === NOT_APPLICABLE &&
    a.typeOfOrganization === NOT_APPLICABLE &&
    a.currentJobLocated === NOT_APPLICABLE
  );
};
