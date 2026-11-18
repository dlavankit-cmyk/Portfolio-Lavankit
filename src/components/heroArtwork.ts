/** Original vector rig drawn for the supplied chibi reference. Each joint is independently posed. */
const arm = (side: 'l'|'r', x: number) => `<g transform="translate(${x} 57)"><g class="hero-arm-${side}"><path d="M-3.5 -1 C-5 2 -4.8 8 -3.1 12 Q0 14 3.2 11 C4.3 7 4.8 2 3.2 -1 Q0 -2.5 -3.5 -1Z" fill="#087db9"/><g transform="translate(0 11)"><g class="hero-forearm-${side}"><path d="M-3 -1 Q-3.8 3 -2.8 9 Q0 11 2.9 9 Q4 3 3 -1Z" fill="#eb4543"/><path d="M-3 3Q0 4 3 3 M0 0V8" class="hero-web-detail"/><g transform="translate(0 8)"><g class="hero-hand-${side}"><g transform="scale(${side === 'l' ? 1 : -1} 1)"><path d="M-2.8 -1 C-4.4 1 -4.8 4 -2.8 6 Q-.5 8 2.3 6.2 C4.5 5 4.9 3.2 3.6 1 Q6 0 4.8 -1.8 Q3.3 -3 2 -1Z" fill="#eb4543"/><path d="M.8 2Q2.3 3 2 4.5 M-2.4 3.5Q-1.4 4.4 -.5 4.1" class="hero-web-detail"/></g></g></g></g></g></g></g>`;
const leg = (side: 'l'|'r', x: number) => `<g transform="translate(${x} 74)"><g class="hero-thigh-${side}"><path d="M-4 -2 C-4.8 2 -4.4 6 -3.2 10 Q0 12.3 3.3 10 C4.6 5 4.8 1 4 -2Z" fill="#087db9"/><g transform="translate(0 10)"><g class="hero-shin-${side}"><path d="M-3.2 -1 C-4.2 3 -2.7 7 -2.5 12 Q.2 13.6 3 12 C2.9 7 4.6 3 3.3 -1Z" fill="#e84743"/><path d="M-3 4Q0 5 3.6 4 M-2.8 8Q0 9 3 8 M.2 0V11" class="hero-web-detail"/><g transform="translate(0 12)"><g class="hero-foot-${side}"><path d="M-2.8 -2.3 Q-4.5 .2 -2.8 2.5 C0 3.5 5.7 3.7 8 2.4 Q10.5 1.3 8 -.2 L3 -2.5Z" fill="#ed4945"/><path d="M2 -1.8Q1.8 0 2.5 2 M5 -.7L5.7 2.5" class="hero-web-detail"/></g></g></g></g></g></g>`;
export const heroArtwork = `<svg class="hero-art" width="72" height="90" viewBox="0 0 80 100" fill="none" aria-hidden="true">
<defs><clipPath id="hero-mask-clip"><ellipse cx="40" cy="31" rx="27" ry="25"/></clipPath></defs>
<ellipse class="hero-contact-shadow" cx="41" cy="96" rx="18" ry="2" fill="#171717" opacity=".15"/>
<g class="hero-rig" stroke="#303038" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
<g class="hero-body">
${arm('l',25)}
${leg('l',33)}${leg('r',47)}
<path d="M27 53 Q40 49 53 54 L53 74 Q42 82 27 74Z" fill="#087db9"/>
<path d="M30 54 Q40 52 49 55 L46 69 L40 73 L34 68Z" fill="#eb4543"/>
<path d="M40 54V70 M31 60Q40 65 48 60 M33 65Q40 69 46 65" class="hero-web-detail"/>
<g stroke-width="1.2" fill="#303038"><ellipse cx="40" cy="61" rx="1.5" ry="3"/><path d="M39 60L35 57 M41 60L45 57 M39 61L34 60 M41 61L46 60 M39 62L35 65 M41 62L45 65 M39 63L36 67 M41 63L44 67"/></g>
${arm('r',55)}
<g class="hero-hanging-arm"><path d="M54 57 Q72 43 66 24 L59 9" stroke="#303038" stroke-width="10"/><path d="M54 57 Q72 43 66 24 L59 9" stroke="#087db9" stroke-width="7"/><path d="M55 12 Q51 3 56 1 Q62 -1 64 6 L65 12Z" fill="#ed4945"/><path d="M55 6L63 5 M59 1L60 11" class="hero-web-detail"/></g>
<g class="hero-head">
<ellipse cx="40" cy="31" rx="27" ry="25" fill="#eb4543"/>
<g clip-path="url(#hero-mask-clip)" class="hero-web-detail">
<path d="M40 31L40 5 M40 31L20 9 M40 31L12 25 M40 31L15 46 M40 31L32 57 M40 31L53 54 M40 31L68 38 M40 31L60 12"/>
<path d="M21 10Q23 24 12 25 M21 10Q39 18 40 5 M40 5Q44 20 60 12 M60 12Q56 30 68 38 M68 38Q53 36 53 54 M53 54Q41 44 32 57 M32 57Q29 43 15 46 M15 46Q26 34 12 25"/>
<path d="M28 18Q30 28 21 27 Q31 34 24 41 Q36 37 36 48 Q41 38 48 44 Q46 34 58 35 Q48 29 53 22 Q43 26 40 17 Q36 27 28 18Z"/>
</g>
<g class="site-pet__eyes hero-eyes"><path d="M18 29 Q27 34 36 35 Q35 46 28 44 Q19 42 18 29Z" fill="#fffdf8" stroke-width="2.3"/><path d="M46 33 Q55 29 62 21 Q65 35 58 40 Q51 45 46 33Z" fill="#fffdf8" stroke-width="2.3"/></g>
<path d="M23 14 Q32 7 42 9" stroke="#ffaaa1" stroke-width="1.4" opacity=".5"/>
</g>
</g></g></svg>`;
