import type { FC, ReactNode } from "react";

type IconProps = { className?: string };

function make(node: ReactNode): FC<IconProps> {
  const Icon: FC<IconProps> = ({ className }) => (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {node}
    </svg>
  );
  return Icon;
}

export const ICONS: Record<string, FC<IconProps>> = {
  // Marque : éclair (outlier / viralité)
  logo: make(<path d="M13 2 4 14h6l-1 8 9-12h-6z" />),

  grid: make(
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>,
  ),
  bell: make(
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5H3.5S6 15 6 9" />
      <path d="M10.2 20.5a2 2 0 0 0 3.6 0" />
    </>,
  ),
  flame: make(
    <path d="M12 3c2.4 3.4 5 5.4 5 9a5 5 0 0 1-10 0c0-2 .9-3.4 2.4-4.8.3 1.2 1 2 2 2.3C13 9.4 12.6 6.4 12 3Z" />,
  ),
  youtube: make(
    <>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="M11 9.4 15 12l-4 2.6z" fill="currentColor" stroke="none" />
    </>,
  ),
  globe: make(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
    </>,
  ),
  trend: make(
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M16 7h5v5" />
    </>,
  ),
  search: make(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-3.8-3.8" />
    </>,
  ),
  gauge: make(
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 14.5 16 9" />
      <circle cx="12" cy="18" r="0.6" fill="currentColor" />
    </>,
  ),
  cursor: make(<path d="M5 4l5.5 15 2.3-6.2L19 10.5z" />),
  quote: make(
    <path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20.5l1.9-5.3A8 8 0 1 1 21 11.5Z" />,
  ),
  image: make(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9" r="1.6" />
      <path d="m4 17 4.5-4.5 4 4 3-3L21 18" />
    </>,
  ),
  sliders: make(
    <>
      <path d="M4 8h9M19 8h1M4 16h1M11 16h9" />
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="8" cy="16" r="2.5" />
    </>,
  ),
  users: make(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M21 20a6 6 0 0 0-4.2-5.7" />
    </>,
  ),
  target: make(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>,
  ),
  short: make(
    <>
      <rect x="7" y="3" width="10" height="18" rx="3.5" />
      <path d="M11 9.2 15 12l-4 2.8z" fill="currentColor" stroke="none" />
    </>,
  ),
  bulb: make(
    <>
      <path d="M9.5 18h5M10.5 21h3" />
      <path d="M12 3a6 6 0 0 1 3.8 10.6c-.7.6-1.1 1.3-1.2 2.4H9.4c-.1-1.1-.5-1.8-1.2-2.4A6 6 0 0 1 12 3Z" />
    </>,
  ),
  list: make(
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>,
  ),
  scan: make(
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </>,
  ),
  type: make(<path d="M5 7V5h14v2M12 5v14M9 19h6" />),
  ab: make(
    <>
      <path d="M3 17l3-8 3 8M4 14.2h4" />
      <path d="M14 7.5h3a2.2 2.2 0 0 1 0 4.5h-3zM14 12h3.3a2.3 2.3 0 0 1 0 4.6H14zM14 7.5V16.6" />
    </>,
  ),
  history: make(
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3L3 8" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4.2l3 1.8" />
    </>,
  ),
  pulse: make(<path d="M3 12h3.5l2-6.5 3.5 13 2.5-6.5H21" />),
  settings: make(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>,
  ),

  // Utilitaires de chrome
  plug: make(
    <>
      <path d="M9 8V4M15 8V4" />
      <path d="M7 8h10v3a5 5 0 0 1-10 0z" />
      <path d="M12 16v4" />
    </>,
  ),
  chevron: make(<path d="m6 9 6 6 6-6" />),
  menu: make(<path d="M4 7h16M4 12h16M4 17h16" />),
  close: make(<path d="M6 6l12 12M18 6 6 18" />),
  sun: make(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
    </>,
  ),
  moon: make(<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z" />),
  trash: make(
    <>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>,
  ),
  plus: make(<path d="M12 5v14M5 12h14" />),
};
