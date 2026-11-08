export function HoneyDrips() {
  return (
    <svg
      className="honey-drips"
      width="300"
      height="240"
      viewBox="0 0 300 240"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="honey-drip-gradient" x2="0.2" y2="1">
          <stop stopColor="#E9A83A" />
          <stop offset="1" stopColor="#F5CE7A" />
        </linearGradient>
      </defs>
      <path
        d="M0 0h300v75c-10 17-24 6-24-6V51c0-13-21-13-21 0v70c0 24-29 24-29 0V82c0-17-25-17-25 0v73c0 26-31 26-31 0V71c0-14-20-14-20 0v17c0 22-29 22-29 0V49c0-19-26-19-26 0v77c0 24-29 24-29 0V60c0-17-23-17-23 0v8c0 19-28 19-28 0V38C15 27 0 30 0 16Z"
        fill="url(#honey-drip-gradient)"
      />
      <path
        d="M182 100v40M77 64v46M237 64v30"
        fill="none"
        stroke="#FFF8EA"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".6"
      />
      <ellipse
        className="honey-drop honey-drop-one"
        cx="185"
        cy="184"
        rx="7"
        ry="10"
        fill="#E9A83A"
      />
      <ellipse
        className="honey-drop honey-drop-two"
        cx="80"
        cy="155"
        rx="5"
        ry="8"
        fill="#E9A83A"
      />
    </svg>
  )
}
