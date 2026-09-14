/* Project Olympus badge art. Each badge is a 200x200 SVG: gold ring, navy field, simple emblem.
   Kept to 3 flat colors on purpose so they print as stickers and slice cleanly as multi-color 3D tokens. */
window.OLY = window.OLY || {};
(function(){
  const G='#c9a227', N='#1b2433', W='#f6f3ec', T='#0e7c86', R='#b3402b';
  function frame(inner, label){
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
  <circle cx="100" cy="100" r="96" fill="${G}"/>
  <circle cx="100" cy="100" r="86" fill="${N}"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="${G}" stroke-width="2"/>
  ${inner}
  <path id="arc" d="M30,100 a70,70 0 0,1 140,0" fill="none"/>
  <text font-family="Cinzel,Georgia,serif" font-weight="700" font-size="15" fill="${G}" letter-spacing="3" text-anchor="middle">
    <textPath href="#arc" startOffset="50%">${label.toUpperCase()}</textPath>
  </text>
</svg>`;
  }
  OLY.badgeArt = {
    // Unit 0: a torch. Fire stolen, knowledge begins.
    initiate: frame(`
      <rect x="92" y="98" width="16" height="52" rx="4" fill="${W}"/>
      <rect x="84" y="94" width="32" height="10" rx="3" fill="${G}"/>
      <path d="M100,42 C86,58 78,70 82,86 C86,98 96,100 100,98 C104,100 114,98 118,86 C122,70 114,58 100,42 Z" fill="${G}"/>
      <path d="M100,60 C94,70 90,78 92,86 C94,94 100,96 100,96 C100,96 106,94 108,86 C110,78 106,70 100,60 Z" fill="${R}"/>
      <path d="M100,74 C97,79 96,84 98,88 C99,91 100,92 100,92 C100,92 101,91 102,88 C104,84 103,79 100,74 Z" fill="${W}"/>`, 'Initiate'),
    // Unit 1: a compass rose over graph axes. Maps of change.
    cartographer: frame(`
      <line x1="46" y1="150" x2="160" y2="150" stroke="${W}" stroke-width="3"/>
      <line x1="52" y1="156" x2="52" y2="46" stroke="${W}" stroke-width="3"/>
      <polyline points="52,150 80,134 110,116 150,72" fill="none" stroke="${T}" stroke-width="4" stroke-linecap="round"/>
      <g transform="translate(118,100)">
        <polygon points="0,-40 9,-9 0,0 -9,-9" fill="${G}"/>
        <polygon points="0,40 9,9 0,0 -9,9" fill="${G}"/>
        <polygon points="-40,0 -9,-9 0,0 -9,9" fill="${W}"/>
        <polygon points="40,0 9,-9 0,0 9,9" fill="${W}"/>
        <circle r="6" fill="${N}" stroke="${G}" stroke-width="2"/>
      </g>`, 'Cartographer'),
    // Cross-cutting
    feynman: frame(`
      <line x1="52" y1="132" x2="96" y2="100" stroke="${W}" stroke-width="4" stroke-linecap="round"/>
      <line x1="52" y1="68" x2="96" y2="100" stroke="${W}" stroke-width="4" stroke-linecap="round"/>
      <line x1="148" y1="132" x2="104" y2="100" stroke="${W}" stroke-width="4" stroke-linecap="round"/>
      <line x1="148" y1="68" x2="104" y2="100" stroke="${W}" stroke-width="4" stroke-linecap="round"/>
      <path d="M96,100 q4,-9 8,0 q4,9 8,0" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round" transform="translate(-4,0)"/>
      <circle cx="96" cy="100" r="6" fill="${G}"/><circle cx="104" cy="100" r="6" fill="${G}"/>
      <polygon points="64,120 72,120 68,128" fill="${G}"/><polygon points="136,80 128,80 132,72" fill="${G}"/>`, 'Feynman'),
    willman: frame(`
      <rect x="62" y="118" width="76" height="12" rx="6" fill="${W}"/>
      <rect x="70" y="80" width="52" height="42" rx="4" fill="${W}"/>
      <rect x="70" y="106" width="52" height="8" fill="${R}"/>
      <g transform="translate(120,78) rotate(20)">
        <rect x="-16" y="-24" width="32" height="46" rx="4" fill="${W}" stroke="${N}" stroke-width="2"/>
        <path d="M0,-12 l6,10 h-12 z M-4,3 h8 l-4,8 z" fill="${R}"/>
        <text x="-12" y="-14" font-size="10" font-weight="700" fill="${R}" font-family="Georgia">A</text>
      </g>
      <g fill="${G}"><circle cx="60" cy="70" r="3"/><circle cx="52" cy="92" r="2"/><circle cx="146" cy="100" r="2.5"/><circle cx="70" cy="56" r="2"/></g>`, 'Willman'),
    bughunter: frame(`
      <circle cx="90" cy="92" r="34" fill="none" stroke="${W}" stroke-width="7"/>
      <line x1="114" y1="116" x2="146" y2="148" stroke="${W}" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="90" cy="94" rx="14" ry="18" fill="${R}"/>
      <circle cx="90" cy="78" r="7" fill="${N}"/>
      <line x1="90" y1="80" x2="90" y2="112" stroke="${N}" stroke-width="2"/>
      <g stroke="${N}" stroke-width="2.5" stroke-linecap="round"><line x1="76" y1="86" x2="66" y2="80"/><line x1="76" y1="96" x2="64" y2="96"/><line x1="76" y1="106" x2="66" y2="112"/><line x1="104" y1="86" x2="114" y2="80"/><line x1="104" y1="96" x2="116" y2="96"/><line x1="104" y1="106" x2="114" y2="112"/></g>`, 'Bug Hunter'),
    sheetwizard: frame(`
      <g stroke="${W}" stroke-width="3" fill="none">
        <rect x="56" y="60" width="88" height="80" rx="4"/>
        <line x1="56" y1="86" x2="144" y2="86"/><line x1="56" y1="112" x2="144" y2="112"/>
        <line x1="86" y1="60" x2="86" y2="140"/><line x1="116" y1="60" x2="116" y2="140"/>
      </g>
      <rect x="56" y="60" width="88" height="26" rx="4" fill="${T}"/>
      <polygon points="130,36 134,48 146,48 136,55 140,67 130,60 120,67 124,55 114,48 126,48" fill="${G}"/>`, 'Sheet Wizard'),
    ironpencil: frame(`
      <g transform="translate(100,100) rotate(-45)">
        <rect x="-50" y="-11" width="76" height="22" fill="${G}"/>
        <rect x="-62" y="-11" width="12" height="22" fill="${R}"/>
        <polygon points="26,-11 48,0 26,11" fill="${W}"/>
        <polygon points="40,-4 48,0 40,4" fill="${N}"/>
        <line x1="-40" y1="-11" x2="-40" y2="11" stroke="${N}" stroke-width="2"/>
      </g>
      <text x="100" y="158" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="20" fill="${W}">10</text>`, 'Iron Pencil'),
    matscientist: frame(`
      <rect x="44" y="120" width="112" height="14" rx="3" fill="${W}"/>
      <rect x="44" y="120" width="112" height="14" rx="3" fill="none" stroke="${G}" stroke-width="2"/>
      <rect x="92" y="116" width="16" height="22" fill="${N}"/>
      <path d="M92,52 h16 v22 l18,34 h-52 l18,-34 z" fill="${W}"/>
      <path d="M86,92 h28 l10,16 h-48 z" fill="${T}"/>
      <circle cx="98" cy="98" r="3" fill="${W}"/><circle cx="106" cy="104" r="2" fill="${W}"/>`, 'Mat Scientist'),
    // Future units (Year 1), shown locked in the badge case so the road ahead is visible.
    tycoon: frame(`<circle cx="100" cy="100" r="40" fill="${G}"/><circle cx="100" cy="100" r="32" fill="none" stroke="${N}" stroke-width="3"/><text x="100" y="114" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="40" fill="${N}">$</text>`, 'Tycoon'),
    architect: frame(`<polygon points="100,44 156,140 44,140" fill="none" stroke="${W}" stroke-width="6" stroke-linejoin="round"/><polygon points="100,84 128,132 72,132" fill="${G}"/>`, 'Architect'),
    rocketeer: frame(`<path d="M100,40 C120,60 122,100 112,128 H88 C78,100 80,60 100,40 Z" fill="${W}"/><circle cx="100" cy="86" r="10" fill="${T}"/><polygon points="88,110 70,132 88,128" fill="${G}"/><polygon points="112,110 130,132 112,128" fill="${G}"/><path d="M92,130 h16 l-8,26 z" fill="${R}"/>`, 'Rocketeer'),
    infinity: frame(`<path d="M60,100 c0,-22 30,-22 40,0 c10,22 40,22 40,0 c0,-22 -30,-22 -40,0 c-10,22 -40,22 -40,0 z" fill="none" stroke="${G}" stroke-width="10" stroke-linecap="round"/>`, 'Infinity'),
    oracle: frame(`<ellipse cx="100" cy="100" rx="52" ry="30" fill="${W}"/><circle cx="100" cy="100" r="20" fill="${T}"/><circle cx="100" cy="100" r="9" fill="${N}"/><circle cx="106" cy="94" r="3" fill="${W}"/>`, 'Oracle'),
    engineer: frame(`<path d="M100,52 l14,8 v20 l-14,8 l-14,-8 v-20 z" fill="${G}"/><path d="M60,130 h80 M70,110 l30,20 l30,-20" fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="130" r="8" fill="${R}"/>`, 'Engineer'),
    biohacker: frame(`<path d="M100,140 C60,110 52,80 72,64 C84,54 96,60 100,70 C104,60 116,54 128,64 C148,80 140,110 100,140 Z" fill="${R}"/><polyline points="62,100 84,100 92,84 100,116 108,92 116,100 138,100" fill="none" stroke="${W}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`, 'Biohacker'),
    navigator: frame(`<circle cx="100" cy="100" r="44" fill="none" stroke="${W}" stroke-width="4"/><path d="M100,56 v88 M56,100 h88" stroke="${W}" stroke-width="2"/><path d="M100,100 L128,72 L112,100 Z" fill="${G}"/><path d="M100,100 L72,128 L88,100 Z" fill="${W}"/>`, 'Navigator'),
    olympian: frame(`<path d="M52,132 L76,70 L100,110 L124,70 L148,132 Z" fill="${G}"/><rect x="52" y="132" width="96" height="12" fill="${W}"/><circle cx="76" cy="68" r="6" fill="${W}"/><circle cx="124" cy="68" r="6" fill="${W}"/><circle cx="100" cy="52" r="7" fill="${W}"/>`, 'Olympian'),
  };
  OLY.badgeMeta = [
    {id:'initiate', name:'Initiate', unit:0, how:'Complete Labor 0 (The Fermi Falcon).'},
    {id:'cartographer', name:'Cartographer', unit:1, how:'Complete Labor 1 (The Catch).'},
    {id:'feynman', name:'Feynman', cross:true, how:'Explain a concept to Dad in plain English, no notes. Dad awards it.'},
    {id:'willman', name:'Willman', cross:true, how:'Perform a Mathemagic trick for the family AND explain why it works. Dad awards it.'},
    {id:'bughunter', name:'Bug Hunter', cross:true, how:'Catch the AI in a real mistake and prove it. Dad awards it.'},
    {id:'sheetwizard', name:'Sheet Wizard', cross:true, how:'Build a working model from a blank Google Sheet. Dad awards it.'},
    {id:'ironpencil', name:'Iron Pencil', cross:true, how:'Complete ten sessions. Awarded automatically.'},
    {id:'matscientist', name:'Mat Scientist', cross:true, how:'Bring real jiujitsu data (timed, filmed, or counted) into a problem. Dad awards it.'},
    {id:'tycoon', name:'Tycoon', unit:2, how:'Unit 2 Labor: The Car Deal.'},
    {id:'architect', name:'Architect', unit:3, how:'Unit 3 Labor: design and print to a budget.'},
    {id:'rocketeer', name:'Rocketeer', unit:4, how:'Unit 4 Labor: the free kick over the wall.'},
    {id:'infinity', name:'Infinity', unit:5, how:'Unit 5 Labor: the glider drop.'},
    {id:'oracle', name:'Oracle', unit:6, how:'Unit 6 Labor: design a fair loot system.'},
    {id:'engineer', name:'Engineer', unit:7, how:'Unit 7 Labor: three LEDs, one battery.'},
    {id:'biohacker', name:'Biohacker', unit:8, how:'Unit 8 Labor: the competition-day fuel plan.'},
    {id:'navigator', name:'Navigator', unit:9, how:'Unit 9 Labor: three waypoints, bearings only.'},
    {id:'olympian', name:'Olympian', unit:10, how:'The Final Labor.'},
  ];
})();
