import type { Tea } from "../data/teas";

export function TeaArt({ tea }: { tea: Tea }) {
  return (
    <svg
      className={`tea-art tea-art--${tea.leaf}`}
      viewBox="0 0 300 170"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="153" cy="145" rx="77" ry="7" fill="black" opacity=".2" />
      <g transform="translate(150 85)" stroke={tea.color} strokeWidth="1.1">
        {Array.from({ length: tea.leaf === "rolled" ? 17 : 23 }, (_, i) => {
          const angle = i * 137.508;
          const radius = Math.sqrt(i) * 11;
          const x = Math.cos((angle * Math.PI) / 180) * radius * 1.45;
          const y = Math.sin((angle * Math.PI) / 180) * radius * 0.72;
          return (
            <g
              key={i}
              transform={`translate(${x} ${y}) rotate(${(angle % 160) - 80})`}
              opacity={0.55 + (i % 4) * 0.13}
            >
              {tea.leaf === "rolled" ? (
                <>
                  <path
                    d="M-11 1C-15-9-3-15 7-11C19-8 16 6 9 11C-1 18-13 11-11 1Z"
                    fill={tea.color}
                    fillOpacity=".26"
                  />
                  <path d="M-8 3C-3-7 7-9 10-2C13 5 3 10-2 6C-5 3 0-1 4 1" />
                </>
              ) : (
                <>
                  <path
                    d={
                      tea.leaf === "twisted"
                        ? "M-6 28C-14 10 5 7-3-9C-10-25 5-34 7-38C10-20 0-14 7-2C16 12-4 18-6 28Z"
                        : "M0 33C-11 12-7-14 0-35C9-14 10 12 0 33Z"
                    }
                    fill={tea.color}
                    fillOpacity={tea.leaf === "needle" ? ".32" : ".21"}
                  />
                  <path d="M0 25Q4 0 0-26" opacity=".55" />
                  {tea.leaf === "flat" && (
                    <path d="M0 7L-5 0M1-5L6-12M0-15L-4-21" opacity=".5" />
                  )}
                </>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function RitualArt() {
  return (
    <svg
      className="ritual-art"
      viewBox="0 0 500 330"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="aura">
          <stop stopColor="#a5784c" stopOpacity=".15" />
          <stop offset="1" stopColor="#a5784c" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="bowl"
          x1="155"
          y1="177"
          x2="351"
          y2="264"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5e6056" />
          <stop offset=".48" stopColor="#34372f" />
          <stop offset="1" stopColor="#1c201b" />
        </linearGradient>
        <linearGradient
          id="tea"
          x1="190"
          y1="160"
          x2="314"
          y2="197"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9c6538" />
          <stop offset="1" stopColor="#49331f" />
        </linearGradient>
        <linearGradient id="steam" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ddc7a5" stopOpacity="0" />
          <stop offset=".6" stopColor="#ddc7a5" stopOpacity=".24" />
          <stop offset="1" stopColor="#ddc7a5" stopOpacity=".02" />
        </linearGradient>
      </defs>
      <ellipse cx="265" cy="190" rx="218" ry="153" fill="url(#aura)" />
      <g className="art-orbits" stroke="#b39b77" strokeOpacity=".1">
        <ellipse cx="260" cy="257" rx="201" ry="47" />
        <ellipse cx="260" cy="257" rx="173" ry="35" />
        <path d="M63 257H455M260 303V312" />
      </g>
      <ellipse
        cx="259"
        cy="255"
        rx="109"
        ry="15"
        fill="#0f110e"
        opacity=".55"
      />
      <path
        d="M236 224H285L280 250C273 257 246 257 240 250Z"
        fill="#30352d"
        stroke="#616454"
        strokeOpacity=".4"
      />
      <ellipse
        cx="260"
        cy="234"
        rx="111"
        ry="18"
        fill="#30362c"
        stroke="#787b67"
        strokeOpacity=".35"
      />
      <path
        d="M153 177C165 221 195 239 254 240C312 240 341 219 353 177Z"
        fill="url(#bowl)"
        stroke="#828575"
        strokeOpacity=".25"
      />
      <ellipse
        cx="253"
        cy="177"
        rx="100"
        ry="29"
        fill="#242920"
        stroke="#a0a18b"
        strokeOpacity=".55"
      />
      <ellipse cx="253" cy="180" rx="88" ry="21" fill="url(#tea)" />
      <path
        d="M176 176C198 156 271 154 315 169"
        stroke="#d2b186"
        strokeOpacity=".25"
      />
      <path
        d="M183 199C199 219 225 226 252 227"
        stroke="#929383"
        strokeOpacity=".2"
        strokeLinecap="round"
      />
      <g
        className="steam"
        stroke="url(#steam)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M231 149C205 119 256 109 232 76C216 53 243 39 238 17" />
        <path d="M264 145C291 115 248 96 269 70C288 47 271 29 280 9" />
        <path d="M292 152C316 125 284 111 306 87" />
      </g>
      <g
        transform="translate(370 234) rotate(-28)"
        stroke="#a7a282"
        strokeWidth="1"
      >
        <path
          d="M-10 20C-21-1-8-34 8-51C18-15 6 6-10 20Z"
          fill="#5f6850"
          fillOpacity=".35"
        />
        <path d="M-11 27L5-40M-5 3L-12-10M0-13L10-26" opacity=".6" />
      </g>
      <text
        x="414"
        y="104"
        fill="#a99a7e"
        fillOpacity=".4"
        fontSize="20"
        style={{ writingMode: "vertical-rl" }}
      >
        一 期 一 会
      </text>
    </svg>
  );
}
