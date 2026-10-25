import logo from "../assets/ispsc.png";
import bagongPilipinas from "../assets/bagong-pilipinas.png";

/**
 * Header
 *
 * Page banner that identifies the institution. It shows the ISPSC logo and
 * the Bagong Pilipinas logo side by side, with the college name and campus
 * centered below them, on the theme's primary background.
 * It holds no state, makes no API calls, and takes no props: the text and
 * images are fixed.
 *
 * Requires:
 *   - ../assets/ispsc.png and ../assets/bagong-pilipinas.png
 *   - the Tailwind `bg-primary` color from the theme
 *   - the `main-font` class defined in the global CSS
 *
 * Text sizes apply from the `sm` breakpoint up (larger at `md`); below `sm`
 * the browser's default size is used.
 *
 * @example
 * <Header />
 *
 * @returns A `<div>` containing the two logos (`<img>`), an `<h1>` with the
 * college name ("Ilocos Sur Polytechnic State College") and a `<p>` with the
 * campus ("Sta. Maria Campus").
 */
const Header = () => {
  return (
    <div className="bg-primary py-5 rounded-md flex flex-col items-center text-center gap-3">
      <div className="flex gap-2 items-center">
        <img src={logo} alt="ispsc logo" className="w-20 h-20" />
        <img
          src={bagongPilipinas}
          alt="bagong-pilipinas"
          className="w-20 h-20"
        />
      </div>
      <div>
        <h1 className="main-font sm:text-lg md:text-2xl">
          Ilocos Sur Polytechnic State College
        </h1>
        <p className="main-font sm:text-sm md:text-xl">Sta. Maria Campus</p>
      </div>
    </div>
  );
};

export default Header;