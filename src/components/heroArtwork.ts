/** Original vector rig drawn for the supplied chibi reference. Each joint is independently posed. */
const arm = (side: 'l'|'r', x: number) => `<g transform="translate(${x} 57)"><g class="hero-arm-${side}"><path d="M-4 0 Q-6 6 -3 12 L3 12 Q5 4 4 0Z" fill="#087db9"/><g transform="translate(0 11)"><g class="hero-forearm-${side}"><path d="M-3 0 L-4 8 Q-5 14 0 15 Q6 15 5 9 L3 0Z" fill="#eb4543"/><path d="M-3 5H4 M-3 9H4 M0 1V12" class="hero-web-detail"/></g></g></g></g>`;
const leg = (side: 'l'|'r', x: number) => `<g transform="translate(${x} 74)"><g class="hero-thigh-${side}"><path d="M-4 -2 L-4 10 Q0 13 4 10 L5 -2Z" fill="#087db9"/><g transform="translate(0 10)"><g class="hero-shin-${side}"><path d="M-3.5 -1 L-3 12 H4 L4 0Z" fill="#e84743"/><path d="M-3 4H4 M-3 8H4 M0 0V11" class="hero-web-detail"/><g transform="translate(0 11)"><g class="hero-foot-${side}"><path d="M-3 -2 Q-5 1 -3 3 H8 Q11 1 7 -2 L3 -3Z" fill="#ed4945"/><path d="M1 -2V2 M5 -2V2" class="hero-web-detail"/></g></g></g></g></g></g>`;
export const heroArtwork = `<svg class="hero-art" width="72" height="90" viewBox="0 0 80 100" fill="none" aria-hidden="true">
<defs><clipPath id="hero-mask-clip"><ellipse cx="40" cy="31" rx="27" ry="25"/></clipPath></defs>
<ellipse class="hero-contact-shadow" cx="41" cy="96" rx="18" ry="2" fill="#171717" opacity=".15"/>
<g class="hero-rig" stroke="#111112" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
<g class="hero-body">
${arm('l',25)}
${leg('l',33)}${leg('r',47)}
<path d="M27 53 Q40 49 53 54 L53 74 Q42 82 27 74Z" fill="#087db9"/>
<path d="M30 54 Q40 52 49 55 L46 69 L40 73 L34 68Z" fill="#eb4543"/>
<path d="M40 54V70 M31 60Q40 65 48 60 M33 65Q40 69 46 65" class="hero-web-detail"/>
<g stroke-width="1.2" fill="#111112"><ellipse cx="40" cy="61" rx="1.5" ry="3"/><path d="M39 60L35 57 M41 60L45 57 M39 61L34 60 M41 61L46 60 M39 62L35 65 M41 62L45 65 M39 63L36 67 M41 63L44 67"/></g>
${arm('r',55)}
<g class="hero-hanging-arm"><path d="M54 57 Q72 43 66 24 L59 9" stroke="#111112" stroke-width="12"/><path d="M54 57 Q72 43 66 24 L59 9" stroke="#087db9" stroke-width="7"/><path d="M55 12 Q51 3 56 1 Q62 -1 64 6 L65 12Z" fill="#ed4945"/><path d="M55 6L63 5 M59 1L60 11" class="hero-web-detail"/></g>
<g class="hero-head">
<ellipse cx="40" cy="31" rx="27" ry="25" fill="#eb4543"/>
<g clip-path="url(#hero-mask-clip)" class="hero-web-detail">
<path d="M40 31L40 5 M40 31L20 9 M40 31L12 25 M40 31L15 46 M40 31L32 57 M40 31L53 54 M40 31L68 38 M40 31L60 12"/>
<path d="M21 10Q23 24 12 25 M21 10Q39 18 40 5 M40 5Q44 20 60 12 M60 12Q56 30 68 38 M68 38Q53 36 53 54 M53 54Q41 44 32 57 M32 57Q29 43 15 46 M15 46Q26 34 12 25"/>
<path d="M28 18Q30 28 21 27 Q31 34 24 41 Q36 37 36 48 Q41 38 48 44 Q46 34 58 35 Q48 29 53 22 Q43 26 40 17 Q36 27 28 18Z"/>
</g>
<g class="site-pet__eyes hero-eyes"><path d="M18 29 Q27 34 36 35 Q35 46 28 44 Q19 42 18 29Z" fill="#fffdf8" stroke-width="3.5"/><path d="M46 33 Q55 29 62 21 Q65 35 58 40 Q51 45 46 33Z" fill="#fffdf8" stroke-width="3.5"/></g>
<path d="M23 14 Q32 7 42 9" stroke="#ffaaa1" stroke-width="1.4" opacity=".5"/>
</g>
</g></g></svg>`;
