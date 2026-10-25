/**
 * Props for {@link GraduatesPerRow}.
 */
interface GraduatesPerRowProps {
  /** REQUIRED. Graduation year shown in the heading, e.g. "2024". */
  year: string;
  /** REQUIRED. Program name shown below the heading, e.g. "BS Information Technology". */
  program: string;
}

/**
 * GraduatesPerRow
 *
 * Presentational component that shows one "graduates of <year>" entry:
 * a highlighted heading with the year, and the program name beneath it.
 * It holds no state and makes no API calls.
 *
 * @example
 * <GraduatesPerRow year="2024" program="BS Information Technology" />
 *
 * @param props - See {@link GraduatesPerRowProps}.
 * @param props.year - REQUIRED. Graduation year displayed in the heading.
 * @param props.program - REQUIRED. Program name displayed under the heading.
 * @returns A `<div>` containing an `<h1>` with the text "Graduates of {year}"
 * and an `<h2>` with the program name.
 */
const GraduatesPerRow = ({ year, program }: GraduatesPerRowProps) => {
  return (
    <div>
      <div>
        <h1 className="text-primary font-bold">Graduates of {year}</h1>
        <h2 className="text-black">{program}</h2>
      </div>
    </div>
  );
};

export default GraduatesPerRow;