/**
 * Logo ANKA — symbole vectoriel respectant la charte graphique v1.0
 * Hérite de currentColor pour s'adapter au thème (Light/Dark)
 */
function AnkaLogo({ size = 32, withWordmark = false, className = '', ...props }) {
  if (withWordmark) {
    return (
      <svg
        viewBox="0 0 520 160"
        width={size * 3.25}
        height={size}
        className={className}
        aria-label="ANKA"
        {...props}
      >
        <g transform="translate(80, 80) scale(0.46)">
          <path
            d="M -70 112 C -70 12, -45 -58, 0 -90 C 45 -58, 70 12, 70 112"
            fill="none"
            stroke="currentColor"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M -34 112 C -34 40, -20 -20, 0 -46 C 20 -20, 34 40, 34 112"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <line
            x1="-60"
            y1="26"
            x2="60"
            y2="26"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="0" cy="-114" r="9" fill="currentColor" />
        </g>
        <line x1="150" y1="28" x2="150" y2="132" stroke="currentColor" strokeWidth="1" opacity="0.18" />
        <text
          x="172"
          y="100"
          fontFamily="'DM Sans', sans-serif"
          fontSize="62"
          fontWeight="700"
          fill="currentColor"
          letterSpacing="10"
        >
          ANKA
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      className={className}
      aria-label="ANKA"
      {...props}
    >
      <g transform="translate(100, 120) scale(0.86)">
        <path
          d="M -70 112 C -70 12, -45 -58, 0 -90 C 45 -58, 70 12, 70 112"
          fill="none"
          stroke="currentColor"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M -34 112 C -34 40, -20 -20, 0 -46 C 20 -20, 34 40, 34 112"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <line
          x1="-60"
          y1="26"
          x2="60"
          y2="26"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="0" cy="-114" r="9" fill="currentColor" />
      </g>
    </svg>
  );
}

export default AnkaLogo;
