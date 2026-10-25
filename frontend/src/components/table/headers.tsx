import type { ReactNode } from "react";

/**
 * Props for {@link Headers}.
 */
export interface HeadersProps {
  /** Left side of the header, usually a title or heading. Optional. */
  title?: ReactNode;
  /** Right side of the header, usually actions such as a button or search box. Optional. */
  content?: ReactNode;
}

/**
 * Headers
 *
 * Layout component for the top of a card or table. It places `title` and
 * `content` in one row on medium screens and wider (title on the left,
 * content on the right), and stacks them vertically on smaller screens.
 * It holds no state and makes no API calls.
 *
 * Both props are optional. A prop that is not passed renders nothing, and the
 * other one is still shown.
 *
 * @example
 * <Headers
 *   title={<h2 className="font-bold">Graduates</h2>}
 *   content={<Button>Download Excel</Button>}
 * />
 *
 * @param props - See {@link HeadersProps}.
 * @param props.title - Optional. Content shown first (left / top).
 * @param props.content - Optional. Content shown second (right / bottom).
 * @returns A full-width `<div>` that contains `title` followed by `content`.
 */
const Headers = ({ title, content }: HeadersProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center w-full">
      {title}
      {content}
    </div>
  );
};

export default Headers;