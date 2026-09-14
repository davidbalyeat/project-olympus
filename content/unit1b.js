/* Unit 1, part 2: sessions 7-12, Labor 1, Quest 2 */
(function(){
  const U = OLY.units.find(u=>u.id==='u1');
  U.sessions.push(
  // ---------------------------------------------------------------- S7
  {
    id:'u1s7', week:2, day:3, title:'Equations in the Wild', subtitle:'Turning sentences into equations, from Minecraft to Gringotts', tags:['matmath'],
    warmup:{ q:`Knuts per Galleon: <b>17 × 29</b> = ?`, type:'num', ans:493, tol:0, reveal:`<b>493.</b> 17 × 30 = 510, minus 17 = 493. Estimating with a round number and correcting is faster than long multiplication.` },
    story:[
      {t:'h', html:'The translation table'},
      {t:'p', html:`<p>Word problems are just sentences that haven't been translated yet. Certain words always mean the same math:</p>
      <table><tr><th>When the sentence says...</th><th>It means...</th></tr><tr><td>"per," "each," "every"</td><td>a rate: the slope m</td></tr><tr><td>"starts at," "flat fee," "already has," "head start"</td><td>the intercept b</td></tr><tr><td>"how many until," "when will," "how long before"</td><td>solve for the variable</td></tr><tr><td>"total," "altogether"</td><td>add the pieces</td></tr><tr><td>"left," "remaining"</td><td>start minus what's used</td></tr><tr><td>"is," "equals," "the same as"</td><td>=</td></tr></table>`},
      {t:'decoder', term:'Model', def:`A math description of a real thing, simplified on purpose. A model leaves stuff out (wind, fatigue, the ref) to keep the math doable, and it's good if it's useful, not if it's perfect. Every equation in this course is a model.`, ex:`d = 8.5t models Messi at top speed. It ignores that he had to accelerate first. Fine for 3 seconds, wrong for 30.`},
      {t:'thread', kind:'example', title:'Minecraft', html:`<p>"You need 640 cobblestone for the wall. You mine 1.5 blocks per second. How long?" Translate: 1.5t = 640. Solve: t = 640 ÷ 1.5 ≈ 427 seconds, about <b>7 minutes</b>. (Mining speed is made up; the walking speeds in the problems below are the real ones from the game's code.)</p>`},
      {t:'thread', kind:'example', title:'Spider-Man', html:`<p>"200 shots per cartridge, 3 per swing. How many swings until only 20 shots are left?" Translate: 200 − 3n = 20. Solve: 3n = 180, <b>n = 60 swings</b>. (Peter Parker actually did this math; he's a chemistry nerd who built the web fluid. Mr. Stark just made the suit prettier.)</p>`},
      {t:'thread', kind:'example', title:'Gringotts', html:`<p>Wizard money: 29 Knuts = 1 Sickle, 17 Sickles = 1 Galleon. A Skiving Snackbox at Weasleys' Wizard Wheezes for 3 Galleons 10 Sickles, in Knuts: 3 × 493 + 10 × 29 = 1,479 + 290 = <b>1,769 Knuts</b>. The goblins invented this system to make sure nobody could do the math in their head. It worked.</p>`},
      {t:'thread', kind:'matmath', title:'The mat', html:`<p>A jiujitsu class runs 6 five-minute rounds with a minute of rest between. Total time on the mat: 6 × 5 + 5 × 1 = 35 minutes. Twice a week, that's 70 minutes of rolling. Over a year (say 48 weeks): 70 × 48 = 3,360 minutes = <b>56 hours</b> of live sparring. Belts are earned by the hour, not the year. Write your own version with your real class schedule.</p>`},
      {t:'thread', kind:'paper', html:`Codex: <i>model</i>. Then, for every practice problem below, write the equation on paper <i>before</i> solving. The translation is the skill; the solving you already have.`},
    ],
    practice:[
      { id:'u1s7p1', type:'num', xp:10, paper:true, q:`Minecraft walking speed is <b>4.317 m/s</b>. How long to walk <b>1,000 blocks</b> to your friend's base? Nearest second.`, ans:232, tol:1, unit:'s', hints:[`4.317t = 1000.`,`Divide.`], sol:`1000 ÷ 4.317 ≈ <b>232 s</b>, just under 4 minutes.` },
      { id:'u1s7p2', type:'num', xp:10, paper:true, q:`Sprinting is <b>5.612 m/s</b>. How many seconds does sprinting <i>save</i> on those 1,000 blocks? Nearest second.`, ans:53, tol:1, unit:'s', hints:[`Sprint time: 1000 ÷ 5.612.`,`About 178 s. Subtract from the walking time.`], sol:`232 − 178 = <b>53 seconds saved</b>. Sprint-jumping (7.127 m/s) saves another 38.` },
      { id:'u1s7p3', type:'num', xp:10, paper:true, q:`Web cartridge: S(n) = 200 − 3n. After how many swings are <b>50 shots</b> left?`, ans:50, tol:0, unit:'swings', hints:[`200 − 3n = 50.`,`3n = 150.`], sol:`<b>n = 50</b>. Convenient. Peter should refill at 50 and never think about it again.` },
      { id:'u1s7p4', type:'num', xp:10, paper:true, q:`Convert <b>2 Galleons, 5 Sickles, 20 Knuts</b> entirely into Knuts.`, ans:1151, tol:0, unit:'Knuts', hints:[`Galleons × 493, Sickles × 29, then add the Knuts.`,`986 + 145 + 20.`], sol:`<b>1,151 Knuts</b>.` },
      { id:'u1s7p5', type:'num', xp:10, paper:true, tags:['greek'], q:`In <i>Percy Jackson</i>, the Gray Sisters' taxi charges (let's say) a <b>1-drachma</b> flat fee plus <b>2 drachmas per mile</b>. A ride costs <b>15 drachmas</b>. How many miles?`, ans:7, tol:0, unit:'miles', hints:[`Flat fee is b, per-mile is m: cost = 2x + 1.`,`2x + 1 = 15.`], sol:`2x = 14 → <b>7 miles</b>. They share one eye, so the driving is priced accordingly.` },
      { id:'u1s7p6', type:'num', xp:10, paper:true, q:`Hudson wants <b>$1,000</b> for a resin printer. Each restaurant shift nets about <b>$150</b>. How many shifts? (Whole shifts; you can't work 0.67 of one.)`, ans:7, tol:0, unit:'shifts', hints:[`150n = 1000.`,`n = 6.67. Round which way?`], sol:`6.67 shifts, so <b>7 shifts</b>: after 6 you'd have $900. Real problems round up when you need "at least." (Also: $1,050 after 7. Buy filament with the change.)` },
      { id:'u1s7p7', type:'num', xp:10, paper:true, q:`Your Rubik's average is <b>45 s</b>, improving <b>1.5 s per week</b>. Weeks until you average <b>30 s</b>?`, ans:10, tol:0, unit:'weeks', hints:[`T = 45 − 1.5w. Set T = 30.`,`1.5w = 15.`], sol:`<b>10 weeks</b>. (Then it gets harder. Improvement is never linear for long. Unit 2 has the curve.)` },
      { id:'u1s7p8', type:'num', xp:10, paper:true, q:`In <i>Zelda</i>, say Link runs about <b>6 m/s</b> on flat ground. A shrine is <b>300 m</b> away. Time to get there?`, ans:50, tol:0, unit:'s', hints:[`6t = 300.`], sol:`<b>50 seconds</b>, if he doesn't stop to cook. He always stops to cook.` },
    ],
    apply:{ title:'Write two of your own', intro:`<p>The best way to learn translation is to write the sentences yourself.</p>`,
      steps:[`Write two word problems from a game or sport you know well. Each needs a start (b), a rate (m), and a "how long until" question.`,`Solve them in the notebook. Check by plugging back in.`,`Give them to Dad. He solves them; you grade him. (Be fair. Be a little bit harsh.)`,`Paste them into Claude and ask for the answers. Then check Claude's work against yours. If it's wrong, screenshot it: Bug Hunter.`],
      checklist:[`Two original word problems written and solved`,`Dad solved them (and was graded)`,`Claude's answers checked against yours`],
      dad:`Solve them for real; don't sandbag. If one is ambiguous ("you didn't say whether the rate was per minute or per second"), tell him: precision in the problem is half the skill. Bug Hunter: it must be a real error with a demonstrable correct answer, not a matter of interpretation.`
    },
  },
  // ---------------------------------------------------------------- S8
  {
    id:'u1s8', week:2, day:4, lab:true, title:'Lab Day: The Tip Calculator', subtitle:'Two real Sheets models, one chart, and Beat Dad week 2', tags:['sheets','matmath'],
    warmup:{ q:`<b>18% of $250</b>?`, type:'num', ans:45, tol:0, reveal:`<b>$45.</b> 10% is 25, 5% is 12.50, 3% is 7.50; 25 + 12.5 + 7.5 = 45. Or just 0.18 × 250.` },
    story:[
      {t:'h', html:'Build 1: the tip and pay calculator'},
      {t:'p', html:`<p>This is a tool you'll actually use if you ever wait tables (and a version of it if you ever run a business). Inputs at the top, outputs below, and a log of shifts.</p>
      <table><tr><th></th><th>A</th><th>B</th></tr><tr><td>1</td><td>Hours worked</td><td>5</td></tr><tr><td>2</td><td>Base rate ($/hr)</td><td>16.50</td></tr><tr><td>3</td><td>Sales ($)</td><td>600</td></tr><tr><td>4</td><td>Tip rate</td><td>18%</td></tr><tr><td>5</td><td></td><td></td></tr><tr><td>6</td><td>Base pay</td><td><code>=B1*B2</code></td></tr><tr><td>7</td><td>Tips</td><td><code>=B3*B4</code></td></tr><tr><td>8</td><td>Total</td><td><code>=B6+B7</code></td></tr><tr><td>9</td><td>Effective $/hour</td><td><code>=B8/B1</code></td></tr></table>
      <p>Type 18% with the percent sign and Sheets stores 0.18. Then a second block, a <b>shift log</b>: one row per shift (date, hours, sales), with formulas for pay in each row using <code>$B$2</code> and <code>$B$4</code> so the rate cells stay locked. <code>=SUM()</code> at the bottom. That's a paycheck predictor.</p>`},
      {t:'h', html:'Build 2: the sprint sheet'},
      {t:'p', html:`<p>Two columns of time (0 to 5 seconds in steps of 0.5), then a column for Messi (<code>=8.58*A2</code>) and one for Yamal (<code>=9.86*A2</code>). Insert a line chart with both. Two lines from the same origin, one steeper. Now add a column for Ronaldo with a 5 m head start: <code>=9.43*A2+5</code>. Where does Yamal's line cross Ronaldo's? Hover the chart. Next week you'll compute it exactly.</p>`},
      {t:'thread', kind:'matmath', title:'Data night', html:`<p>If you filmed your shots this week, today's the day they go in the sheet: distance, time, and <code>=B2/C2</code> for speed. Five rows, <code>=AVERAGE()</code>. Compare to the 3 m/s guess from Session 3. Faster? Slower? That's science: a guess, a measurement, and a comparison.</p>`},
    ],
    practice:[
      { id:'u1s8p1', type:'num', xp:10, tags:['sheets'], q:`With hours = 5 and base rate = 16.50, what does the Base pay cell (<code>=B1*B2</code>) show?`, ans:82.5, tol:0.01, hints:[`5 × 16.5.`], sol:`<b>82.50</b>.` },
      { id:'u1s8p2', type:'num', xp:10, tags:['sheets'], q:`Sales = 700, tip rate = 18%. The Tips cell shows:`, ans:126, tol:0.01, hints:[`700 × 0.18.`], sol:`<b>126</b>.` },
      { id:'u1s8p3', type:'num', xp:10, tags:['sheets'], q:`In the sprint sheet, seconds for Yamal (9.86 m/s) to cover <b>30 m</b>: <code>=30/9.86</code> shows (2 decimals):`, ans:3.04, tol:0.01, unit:'s', hints:[`Distance ÷ speed.`], sol:`<b>3.04 s</b>. That's from a flying start; a real 30 m sprint from standing is closer to 4 s.` },
      { id:'u1s8p4', type:'num', xp:10, tags:['sheets'], q:`Same for Messi (8.58 m/s), 30 m, 2 decimals:`, ans:3.5, tol:0.01, unit:'s', hints:[`30 ÷ 8.58.`], sol:`<b>3.50 s</b>. Half a second behind Yamal over 30 m. Which, in soccer, is a lot.` },
      { id:'u1s8p5', type:'mc', xp:10, q:`On the sprint chart at t = 2 s, whose line is on top?`, choices:[`Messi`,`Yamal`,`They're equal`,`Depends on the axes`], ans:1, hints:[`Higher line = more distance at that time.`], sol:`<b>Yamal.</b> 19.7 m vs 17.2 m. On top = ahead.` },
    ],
    apply:{ title:'Build, chart, compete', intro:`<p>Everything today is in the sheet. Then Friday's contest.</p>`,
      steps:[`Build the tip calculator exactly as shown, then add the shift log with 5 made-up shifts and a SUM.`,`Change the tip rate to 20%. Watch every row update. That's why the rate has its own cell.`,`Build the sprint sheet with Messi, Yamal, and Ronaldo-with-head-start. Chart all three.`,`Enter your jiujitsu data if you have it.`,`<b>Beat Dad Friday</b>: Week 2 is live. Both of you.`,`Check the cloud chip says <b>saved</b> (or save a progress file if you're offline).`],
      checklist:[`Tip calculator with inputs, outputs, and a shift log`,`Sprint sheet with a 3-line chart`,`Beat Dad Week 2 done`,`Progress file saved`],
      dad:`Sheet Wizard badge: award it when he builds a working model from a blank sheet with no template, ideally the tip calculator without looking at the table above. If the sprint chart's lines don't start at the origin, check for a header row accidentally included in the data range.`
    },
  },
  // ---------------------------------------------------------------- S9
  {
    id:'u1s9', week:3, day:1, title:'Two Lines Meet', subtitle:'Systems of equations, Achilles, the tortoise, and whether Yamal catches Ronaldo', tags:['greek'],
    warmup:{ q:`Is the point <b>(2, 5)</b> on <i>both</i> lines y = 2x + 1 and y = x + 3?`, type:'mc', choices:[`Yes, on both`,`Only on the first`,`Only on the second`,`Neither`], ans:0, reveal:`<b>Both.</b> 2(2) + 1 = 5 and 2 + 3 = 5. A point that works for two equations at once is called a solution of the system, and it's where the lines cross.` },
    story:[
      {t:'h', html:'Two rules, one answer'},
      {t:'decoder', term:'System of equations', def:`Two (or more) equations that have to be true at the same time. The solution is the (x, y) pair that works for all of them. On a graph, it's where the lines cross.`, ex:`y = 2x + 1 and y = x + 3 are both true at (2, 5). Nowhere else. Two lines cross once (unless they're parallel, or the same line).`},
      {t:'decoder', term:'Intersection', def:`The point where two graphs cross. Same x, same y, both equations satisfied.`, ex:`The moment two runners are at the same place at the same time.`},
      {t:'thread', kind:'example', title:'The chase', html:`<p>Ronaldo has a 5-meter head start and runs at his famous 9.43 m/s. Yamal starts behind him at 9.86 m/s. Both at top speed (it's a model). When does Yamal catch him?</p>
      <div class="formula">Ronaldo: d = 9.43t + 5 &nbsp;&nbsp;&nbsp; Yamal: d = 9.86t</div>
      <p>"Catch" means same distance at the same time: set them equal.</p>
      <div class="formula">9.86t = 9.43t + 5 &nbsp;→&nbsp; 0.43t = 5 &nbsp;→&nbsp; t ≈ 11.6 s</div>
      <p>Where? d = 9.86 × 11.6 ≈ <b>115 m</b>. A pitch is 105 m long. <b>Yamal doesn't catch him before the end line.</b> A 5-meter head start and a 0.43 m/s speed difference buys Ronaldo the whole field. That's why defenders play so close to the attacker: head starts are expensive.</p>`},
      {t:'plot', spec:{ x:[0,14], y:[0,140], xl:'t (seconds)', yl:'d (meters)', lines:[{f:t=>9.86*t, label:'Yamal', lx:12.6},{f:t=>9.43*t+5, label:'Ronaldo (+5 m)', lx:7}], points:[[11.63,114.7,'catch: (11.6, 115)']] }},
      {t:'h', html:'Solving by graphing'},
      {t:'p', html:`<p>Plot both lines, find the crossing, read off (x, y). Fast, visual, and only as accurate as your pencil. For "about 11 or 12 seconds" it's perfect. For "exactly when," you want algebra, which is tomorrow.</p>`},
      {t:'thread', kind:'greek', title:'Achilles and the tortoise', html:`<p>Zeno of Elea (around 450 BC) argued that Achilles, the fastest man alive, could never catch a tortoise with a head start. By the time Achilles reaches where the tortoise <i>was</i>, the tortoise has moved a bit. Achilles reaches <i>that</i> spot; the tortoise has moved again. Infinitely many steps, so (Zeno said) infinite time, so no catching.</p><p>A system of equations disagrees. Achilles at 10 m/s, tortoise at 0.1 m/s with a 100 m head start: 10t = 0.1t + 100, so t = 100 ÷ 9.9 ≈ 10.1 seconds. Done. The infinitely many steps add up to a finite time. Zeno's puzzle stayed unsolved for 2,000 years, until calculus explained why an infinite number of shrinking pieces can add up to something finite. That's Unit 5, and the Infinity badge. For now, Achilles wins, and so does algebra.</p>`},
      {t:'thread', kind:'paper', html:`Codex: <i>system of equations</i>, <i>intersection</i>. Graph the chase by hand on graph paper: t from 0 to 14, d from 0 to 140. Mark the crossing.`},
    ],
    practice:[
      { id:'u1s9p1', type:'num', xp:10, paper:true, tags:['greek'], q:`Achilles (10 m/s) vs. tortoise (0.1 m/s, 100 m head start). Solve 10t = 0.1t + 100. Two decimals.`, ans:10.1, tol:0.05, unit:'s', hints:[`Subtract 0.1t from both sides.`,`9.9t = 100.`], sol:`t = 100 ÷ 9.9 ≈ <b>10.10 s</b>. Zeno, refuted.` },
      { id:'u1s9p2', type:'num', xp:10, paper:true, q:`The chase: 9.86t = 9.43t + 5. Solve for t (two decimals).`, ans:11.63, tol:0.1, unit:'s', hints:[`Subtract 9.43t: 0.43t = 5.`], sol:`5 ÷ 0.43 ≈ <b>11.63 s</b>.` },
      { id:'u1s9p3', type:'num', xp:10, paper:true, q:`How far has Yamal run when he catches Ronaldo? (Use t = 11.63.) Nearest meter.`, ans:115, tol:1, unit:'m', hints:[`d = 9.86t.`], sol:`9.86 × 11.63 ≈ <b>115 m</b>.` },
      { id:'u1s9p4', type:'mc', xp:10, q:`The pitch is 105 m long. With a 5 m head start, does Yamal catch Ronaldo before the end line?`, choices:[`Yes, at about 60 m`,`No; the catch point is past the end line`,`Yes, exactly at the line`,`Can't tell from the model`], ans:1, hints:[`Compare 115 m to 105 m.`], sol:`<b>No.</b> 115 > 105. Ronaldo reaches the end line first. (In reality Ronaldo is 41 and would be doing 33.95 km/h only in his memories, but the math is the math.)` },
      { id:'u1s9p5', type:'num', xp:10, paper:true, q:`y = 2x + 1 and y = −x + 7. The x-coordinate of the intersection?`, ans:2, tol:0, hints:[`Set them equal: 2x + 1 = −x + 7.`,`3x = 6.`], sol:`<b>x = 2</b>.` },
      { id:'u1s9p6', type:'num', xp:10, q:`...and the y-coordinate?`, ans:5, tol:0, hints:[`Plug x = 2 into either equation.`], sol:`2(2) + 1 = <b>5</b>. Check the other: −2 + 7 = 5. ✓ Intersection at (2, 5).` },
      { id:'u1s9p7', type:'mc', xp:10, q:`Two lines with the <b>same slope</b> and <b>different intercepts</b> (parallel). How many solutions does that system have?`, choices:[`One`,`Two`,`None`,`Infinitely many`], ans:2, hints:[`Do parallel lines ever cross?`], sol:`<b>None.</b> Two runners at exactly the same speed with a head start: the gap never changes. (Same slope <i>and</i> same intercept is the same line: infinitely many solutions.)` },
    ],
    apply:{ title:'The head-start slider', intro:`<p>Desmos turns the chase into a toy. Play with it until the answer to Friday's Labor is obvious.</p>`,
      steps:[`Desmos: <code>y = 9.86x</code> (Yamal) and <code>y = 9.43x + h</code> (Ronaldo). Add a slider for h, range 0 to 20.`,`Drag h. Watch the crossing point slide along Yamal's line.`,`Add the end line: <code>y = 105</code>. It's horizontal.`,`Find the h where all three lines meet at one point: the head start that makes the catch happen exactly at the end line. Write it in your notebook. (Hint: it's between 4 and 5.)`,`Bonus: replace Ronaldo with Mbappé (10.44 m/s). What happens to the crossing? Why?`],
      checklist:[`Slider built and dragged`,`Found the head start where the catch lands on the end line`,`Tried the Mbappé version and explained what changed`],
      dad:`The answer to step 4 is about 4.6 m. Mbappé is faster than Yamal, so with any head start there's no crossing: the lines diverge. That's the parallel/diverging case in one drag of a slider.`
    },
  },
  // ---------------------------------------------------------------- S10
  {
    id:'u1s10', week:3, day:2, title:'Substitution and Elimination', subtitle:'Two ways to solve a system exactly, and the Lego mix problem', tags:['matmath'],
    warmup:{ q:`If y = 3x and x + y = 12, what is x?`, type:'num', ans:3, tol:0, reveal:`<b>3.</b> Replace y with 3x: x + 3x = 12, so 4x = 12. You just did substitution.` },
    story:[
      {t:'h', html:'Method 1: substitution'},
      {t:'p', html:`<p>If one equation tells you what y <i>is</i> (y = something), replace y in the other equation with that something. Now there's only one variable, and you already know how to solve that.</p>`},
      {t:'thread', kind:'example', html:`<div class="formula">y = 2x + 1 &nbsp;&nbsp;and&nbsp;&nbsp; x + y = 10</div><p>Substitute: x + (2x + 1) = 10 → 3x + 1 = 10 → 3x = 9 → <b>x = 3</b>. Then y = 2(3) + 1 = <b>7</b>. Check the second equation: 3 + 7 = 10. ✓</p>`},
      {t:'h', html:'Method 2: elimination'},
      {t:'p', html:`<p>Add (or subtract) the two equations so one variable disappears. Works when the variables are lined up and one of them has matching (or opposite) amounts.</p>`},
      {t:'thread', kind:'example', html:`<div class="formula">2x + y = 11<br>x − y = 1</div><p>Add them straight down. The +y and −y cancel: 3x = 12 → <b>x = 4</b>. Then 4 − y = 1 → <b>y = 3</b>. Check: 2(4) + 3 = 11. ✓</p><p>If nothing cancels, multiply one equation first so something does. Both methods give the same answer; pick whichever is less typing.</p>`},
      {t:'thread', kind:'example', title:'The Lego mix', html:`<p>A bag holds 100 pieces: 2×4 bricks at 10 cents and 1×1 plates at 3 cents. The bag cost $7.20. How many of each?</p><div class="formula">b + p = 100 &nbsp;&nbsp;&nbsp; 0.10b + 0.03p = 7.20</div><p>Substitution: p = 100 − b. Then 0.10b + 0.03(100 − b) = 7.20 → 0.10b + 3 − 0.03b = 7.20 → 0.07b = 4.20 → <b>b = 60 bricks</b>, <b>p = 40 plates</b>. Check: 6.00 + 1.20 = 7.20. ✓</p><p>This is the shape of half the problems in business: two unknowns, a count and a cost.</p>`},
      {t:'thread', kind:'matmath', title:'Scoring', html:`<p>IBJJF scoring: takedown 2 points, mount 4 points (among others). Hudson scores 5 times for 14 points, all takedowns and mounts. How many of each? t + m = 5 and 2t + 4m = 14. Elimination: double the first (2t + 2m = 10) and subtract from the second: 2m = 4 → <b>m = 2</b>, so <b>t = 3</b>. Three takedowns, two mounts. A good day.</p>`},
      {t:'thread', kind:'paper', html:`Codex: <i>substitution</i>, <i>elimination</i>. Solve every practice problem below on paper with the method named, and write the check.`},
    ],
    practice:[
      { id:'u1s10p1', type:'num', xp:10, paper:true, q:`y = 2x + 1 and x + y = 10. Find x.`, ans:3, tol:0, hints:[`Substitute 2x + 1 for y in the second equation.`,`3x + 1 = 10.`], sol:`<b>x = 3</b>.` },
      { id:'u1s10p2', type:'num', xp:10, q:`...and y.`, ans:7, tol:0, hints:[`y = 2(3) + 1.`], sol:`<b>y = 7</b>. Check: 3 + 7 = 10. ✓` },
      { id:'u1s10p3', type:'num', xp:10, paper:true, q:`2x + y = 11 and x − y = 1. Find x by elimination.`, ans:4, tol:0, hints:[`Add the equations; the y's cancel.`,`3x = 12.`], sol:`<b>x = 4</b> (and y = 3).` },
      { id:'u1s10p4', type:'num', xp:10, paper:true, q:`Lego mix: 100 pieces, bricks at 10¢ and plates at 3¢, total $7.20. How many <b>bricks</b>?`, ans:60, tol:0, unit:'bricks', hints:[`b + p = 100, so p = 100 − b.`,`0.10b + 0.03(100 − b) = 7.20.`,`0.07b = 4.20.`], sol:`<b>60 bricks</b>, 40 plates.` },
      { id:'u1s10p5', type:'num', xp:10, paper:true, q:`Fortnite: you have <b>500 building materials</b> total, wood and brick. You have <b>100 more wood than brick</b>. How much <b>brick</b>?`, ans:200, tol:0, unit:'brick', hints:[`w + b = 500 and w = b + 100.`,`Substitute: (b + 100) + b = 500.`], sol:`2b + 100 = 500 → <b>b = 200</b>, w = 300.` },
      { id:'u1s10p6', type:'num', xp:10, paper:true, tags:['matmath'], q:`Scoring: takedowns 2 points, mounts 4 points. <b>5 scores, 14 points.</b> How many <b>mounts</b>?`, ans:2, tol:0, unit:'mounts', hints:[`t + m = 5 and 2t + 4m = 14.`,`Double the first equation and subtract.`], sol:`<b>2 mounts</b>, 3 takedowns.` },
      { id:'u1s10p7', type:'num', xp:10, paper:true, tags:['greek'], q:`Camp Half-Blood store: 3 ambrosia + 2 nectar = 13 drachmas. 1 ambrosia + 2 nectar = 7 drachmas. Price of <b>one ambrosia</b>?`, ans:3, tol:0, unit:'drachmas', hints:[`The nectar amounts match. Subtract the second equation from the first.`,`2a = 6.`], sol:`<b>3 drachmas</b> per ambrosia; nectar is 2. Don't eat too much; it's fatal to mortals, which is a strong pricing strategy.` },
    ],
    apply:{ title:'The checker', intro:`<p>A Sheet that checks systems for you is a good way to make sure you actually understand what "solution" means.</p>`,
      steps:[`New tab "System checker." B1 = your x, B2 = your y.`,`B4: the left side of equation 1 as a formula using $B$1 and $B$2 (e.g. <code>=2*B1+B2</code>). C4: what it should equal (11). D4: <code>=B4=C4</code>. It shows TRUE or FALSE.`,`Row 5: the same for equation 2.`,`Type in your answers from the practice problems. Both rows should say TRUE. If one says FALSE, you've found a mistake before I did.`,`Claude: ask it for a hint (not the answer) on the Camp Half-Blood problem, as if you hadn't solved it. Did the hint match the method you used?`],
      checklist:[`System checker built with TRUE/FALSE cells`,`All practice answers checked`,`Compared Claude's hint to your own method`],
      dad:`The TRUE/FALSE trick generalizes: it's how programmers write tests. If he's into it, mention that.`
    },
  },
  // ---------------------------------------------------------------- S11
  {
    id:'u1s11', week:3, day:3, title:'The Whole Language', subtitle:'Review, the Feynman technique, and the mistakes everyone makes', tags:[],
    warmup:{ q:`Slope of <b>y = −3x + 8</b>?`, type:'num', ans:-3, tol:0, reveal:`<b>−3.</b> Falling 3 for every 1 across.` },
    story:[
      {t:'h', html:'The map of Unit 1, on one page'},
      {t:'p', html:`<ol class="steps"><li><b>A function is a machine.</b> Input → rule → output. f(x) is "f of x," not f times x.</li><li><b>A graph is its picture.</b> Every (input, output) is a point. Straight line = steady rate.</li><li><b>Slope is the rate.</b> Rise over run. On a position graph, slope is velocity.</li><li><b>y = mx + b.</b> b is where it starts. m is how fast it changes.</li><li><b>Solving is undoing.</b> Same move on both sides. Undo the last thing first. Check by plugging in.</li><li><b>Two machines meet</b> where their outputs match. Set them equal, or substitute, or eliminate.</li></ol>`},
      {t:'h', html:'The mistakes gallery'},
      {t:'p', html:`<ul class="tight"><li>Treating f(x) as multiplication.</li><li>Slope upside down (run over rise). Remember: rise is y, and y is the vertical one.</li><li>Losing the minus sign on a negative slope.</li><li>Forgetting to divide km/h by 3.6.</li><li>Writing 18 instead of 0.18 for 18%.</li><li>Not checking. The check takes five seconds and would have caught all of the above.</li></ul>`},
      {t:'thread', kind:'story', title:'The Feynman technique', html:`<p>Feynman had a habit that made him the best explainer in physics: whenever he learned something, he'd try to explain it in plain words, as if to a first-year student. Wherever he got stuck or had to use a fancy term he couldn't unpack, that was the spot he didn't actually understand yet. Then he'd go back and fix that spot. Four steps:</p><ol class="steps"><li>Pick the idea. (Today: <b>slope</b>.)</li><li>Explain it out loud to someone who doesn't know it, in plain words, with a drawing. No notes.</li><li>Notice where you stumble or reach for jargon. That's the gap.</li><li>Go back, fill the gap, explain again.</li></ol><p>The Feynman badge is exactly this: explain one idea from the unit to Dad, no notes, clearly enough that he could explain it to someone else. It's the hardest badge in the program and the one that means the most.</p>`},
      {t:'thread', kind:'magic', title:'Show prep', html:`<p>Two tricks for Friday's family show: your own number trick (proved), and the <b>Oracle of the Crossing</b>: give Dad two lines (two runners, two prices, whatever) and announce where they'll meet <i>before</i> he can graph it. You already solved it on paper. He'll think it's magic. It's substitution.</p>`},
      {t:'thread', kind:'paper', html:`Codex check: you should have at least 12 Unit 1 terms with your own definitions. Fill in any you skipped. Then do the review set below without hints if you can.`},
    ],
    practice:[
      { id:'u1s11p1', type:'num', xp:10, q:`f(x) = −2x + 9. Find f(3).`, ans:3, tol:0, hints:[`−2(3) + 9.`], sol:`−6 + 9 = <b>3</b>.` },
      { id:'u1s11p2', type:'num', xp:10, q:`Slope through <b>(2, 3)</b> and <b>(6, 15)</b>.`, ans:3, tol:0, hints:[`Rise 12, run 4.`], sol:`12 ÷ 4 = <b>3</b>.` },
      { id:'u1s11p3', type:'mc', xp:10, q:`Slope 3, passes through (0, −4). Equation?`, choices:[`y = −4x + 3`,`y = 3x − 4`,`y = 3x + 4`,`y = −3x − 4`], ans:1, hints:[`Intercept is −4.`], sol:`<b>y = 3x − 4.</b>` },
      { id:'u1s11p4', type:'num', xp:10, paper:true, q:`6x − 9 = 3x + 12`, ans:7, tol:0, hints:[`3x − 9 = 12.`,`3x = 21.`], sol:`<b>x = 7</b>. Check: 33 = 33. ✓` },
      { id:'u1s11p5', type:'num', xp:10, q:`Mbappé, <b>37.6 km/h</b>, fastest at the 2026 World Cup. In m/s, two decimals:`, ans:10.44, tol:0.02, unit:'m/s', hints:[`÷ 3.6.`], sol:`<b>10.44 m/s</b>. About one meter per second faster than Yamal, which over a 30 m sprint is roughly 3 meters.` },
      { id:'u1s11p6', type:'num', xp:10, q:`Storm phase 4: 7 HP/s. From 100 HP, how many seconds until zero? One decimal.`, ans:14.3, tol:0.1, unit:'s', hints:[`100 − 7t = 0.`], sol:`100 ÷ 7 ≈ <b>14.3 s</b>.` },
      { id:'u1s11p7', type:'num', xp:10, paper:true, q:`y = x + 4 and y = 3x. The x at the intersection?`, ans:2, tol:0, hints:[`x + 4 = 3x.`], sol:`4 = 2x → <b>x = 2</b> (y = 6).` },
      { id:'u1s11p8', type:'num', xp:10, q:`1,000 Knuts is how many <b>whole Galleons</b>? (493 Knuts per Galleon.)`, ans:2, tol:0, unit:'Galleons', hints:[`1000 ÷ 493.`], sol:`2.03, so <b>2 Galleons</b> with 14 Knuts left over. The goblins keep the 14.` },
      { id:'u1s11p9', type:'num', xp:10, q:`Minecraft sprinting (<b>5.612 m/s</b>): time for 500 blocks, one decimal.`, ans:89.1, tol:0.2, unit:'s', hints:[`500 ÷ 5.612.`], sol:`<b>89.1 s</b>.` },
      { id:'u1s11p10', type:'num', xp:10, tags:['matmath'], q:`A shot covers <b>1.8 m in 0.6 s</b>. Speed?`, ans:3, tol:0.01, unit:'m/s', hints:[`Distance ÷ time.`], sol:`<b>3 m/s</b>. If your real data from class beat this, you're faster than the textbook double-leg.` },
    ],
    apply:{ title:'Teach it back', intro:`<p>The Feynman badge attempt. Two minutes, one idea, one drawing, no notes.</p>`,
      steps:[`Choose: slope, or intercept, or "why two lines crossing means the runners meet."`,`Explain it to Dad. He plays someone who has never heard of it. He's allowed to ask "why?" three times.`,`Notice where you stumbled. Write that spot in the notebook.`,`Fix it (re-read the story, ask Claude to explain that one spot) and explain again tomorrow.`,`Finish the Codex: 12 Unit 1 terms in your own words. Each earns 10 XP on the Codex page.`],
      checklist:[`Taught one idea to Dad, no notes`,`Wrote down the stumble`,`Codex has 12+ Unit 1 terms`],
      dad:`Feynman badge standard: could <i>you</i> now explain it to someone else using only what he said? If yes, award it. If he says "it's just the number in front of x," ask "but what does it <i>mean</i>?" and wait. The pause is the lesson.`
    },
    feynman:`Explain <b>slope</b> to Dad as if he's never seen a graph. Use a drawing. Use the words "for every." No notes. If he can repeat it to someone else afterward, the badge is yours.`
  },
  // ---------------------------------------------------------------- S12
  {
    id:'u1s12', week:3, day:4, lab:true, title:'Lab Day: The Catch', subtitle:'Labor 1, Quest 2, the family show, and the Cartographer badge', tags:['labor','magic'],
    warmup:{ q:`<b>15% of 60</b>?`, type:'num', ans:9, tol:0, reveal:`<b>9.</b> 10% is 6, half of that is 3, together 9.` },
    story:[
      {t:'h', html:"Today's order of business"},
      {t:'p', html:`<ol class="steps"><li><b>Labor 1: The Catch.</b> Five parts, no hints. Algebra on paper first, then the Sheets proof. Beat it: Cartographer badge.</li><li><b>Quest 2.</b> Four clues. Dad has hidden them. The lock wants three digits.</li><li><b>The family show.</b> Your number trick, then the Oracle of the Crossing. Willman badge if it's new and explained.</li><li><b>Beat Dad, Week 3.</b></li><li><b>Check the cloud chip says saved.</b></li></ol>`},
      {t:'thread', kind:'story', title:'What you can do now that you couldn’t three weeks ago', html:`<p>Read a graph. Compute a rate. Turn a sentence into an equation and an equation into an answer. Predict where two moving things meet. Build a spreadsheet model that updates itself. Design a magic trick from a formula. Explain slope to a human being.</p><p>That's most of Algebra I. It took three weeks because you already spoke the language; you just hadn't been told what the words meant. Unit 2 is money, and it's where the lines start to bend.</p>`},
    ],
    practice:[
      { id:'u1s12p1', type:'num', xp:10, q:`Warm the engine for the Labor: convert <b>35.5 km/h</b> (Yamal) to m/s, two decimals.`, ans:9.86, tol:0.02, unit:'m/s', hints:[`÷ 3.6.`], sol:`<b>9.86 m/s</b>.` },
      { id:'u1s12p2', type:'num', xp:10, q:`Yamal's speed minus Ronaldo's (9.86 − 9.43): the <b>closing speed</b>, in m/s.`, ans:0.43, tol:0.01, unit:'m/s', hints:[`Subtract.`], sol:`<b>0.43 m/s</b>. That's how fast the gap shrinks. Every catch-up problem is "gap ÷ closing speed."` },
      { id:'u1s12p3', type:'num', xp:10, q:`Using gap ÷ closing speed: with a <b>10 m</b> gap, how long to close it? One decimal.`, ans:23.3, tol:0.1, unit:'s', hints:[`10 ÷ 0.43.`], sol:`<b>23.3 s</b>. Longer than any sprint on a pitch. Big head starts are basically permanent at these speeds.` },
    ],
    apply:{ title:'Labor, Quest, Show', intro:`<p>Go to the Labor page (Unit 1 → Labor 1). Then the Quest page. Then the living room.</p>`,
      steps:[`Labor 1: The Catch. Paper first for every part.`,`Sheets proof: a table with t from 0 to 15, Yamal and Ronaldo columns, a chart, and the row where Yamal pulls ahead highlighted.`,`Quest 2: clue 1 is on the Quest page.`,`Family show: two tricks, both explained after.`,`Beat Dad Week 3, then check the cloud chip says <b>saved</b>.`],
      checklist:[`Labor 1 complete (Cartographer badge)`,`Sheets proof with chart`,`Quest 2: box opened`,`Show performed and explained`,`Beat Dad Week 3 done and progress saved`],
      dad:`Quest 2 setup is on the Quest page in Dad mode. Award Willman for the show if the Oracle trick is explained (it's substitution: he solved the crossing before you graphed it). This is a good night to print his Unit 1 Codex page and put it on the fridge.`
    },
  }
  );

  // ---------------------------------------------------------------- Labor 1
  U.labor = { title:'The Catch', intro:`Cristiano Ronaldo (9.43 m/s, his 2018 World Cup number) has a <b>6-meter head start</b> on Lamine Yamal (35.5 km/h at the 2026 World Cup). Both at top speed, straight line, full pitch. Does Yamal catch him? Prove it three ways: algebra here, a graph on paper, a table in Sheets. No hints.`,
    problems:[
      { id:'u1L1', type:'num', xp:25, q:`<b>Part 1.</b> Convert Yamal's 35.5 km/h to m/s (two decimals).`, ans:9.86, tol:0.02, unit:'m/s', sol:`35.5 ÷ 3.6 = 9.86 m/s.` },
      { id:'u1L2', type:'num', xp:25, q:`<b>Part 2.</b> Write both distance equations (Ronaldo: d = 9.43t + 6; Yamal: d = 9.86t), set them equal, and solve for the catch time t. Two decimals.`, ans:13.95, tol:0.15, unit:'s', sol:`9.86t = 9.43t + 6 → 0.43t = 6 → t = 13.95 s.` },
      { id:'u1L3', type:'num', xp:25, q:`<b>Part 3.</b> How far from Yamal's starting point is the catch? Nearest meter.`, ans:138, tol:2, unit:'m', sol:`9.86 × 13.95 ≈ 137.6 m.` },
      { id:'u1L4', type:'mc', xp:25, q:`<b>Part 4.</b> The pitch is 105 m long. Verdict?`, choices:[`Yamal catches him around midfield`,`Yamal catches him just before the end line`,`Yamal does not catch him; Ronaldo reaches the end line first`,`They arrive together`], ans:2, sol:`138 m > 105 m. Ronaldo starts 6 m in, so he has 99 m to the end line: 99 ÷ 9.43 = 10.5 s. At that moment Yamal has run 9.86 × 10.5 = 103.5 m, still behind. No catch.` },
      { id:'u1L5', type:'num', xp:25, q:`<b>Part 5.</b> What head start (in meters, one decimal) would make Yamal catch Ronaldo <i>exactly</i> at the 105 m end line? (Hint you're allowed: how long does Yamal take to run 105 m? How far does Ronaldo get in that time?)`, ans:4.6, tol:0.15, unit:'m', sol:`Yamal runs 105 m in 105 ÷ 9.86 = 10.65 s. In 10.65 s Ronaldo covers 9.43 × 10.65 = 100.4 m. So the head start must be 105 − 100.4 ≈ 4.6 m. Any bigger and Ronaldo wins.` },
    ],
    after:`<h3>Labor 1 debrief</h3><p>Three weeks ago "does he catch him" was a vibe. Now it's a number, and you can say <i>exactly</i> how big a head start is too big. Write in the log which of the three proofs (algebra, graph, Sheets) convinced you most, and why the other two still matter.</p>`
  };

  // ---------------------------------------------------------------- Quest 2
  U.quest = { title:"The Cartographer's Quest", intro:`Four clues. Every answer is a number that points somewhere in the house. The lock wants the last digit of the first three answers.`,
    dad:`<p>Hide in order. A 3-digit luggage lock reads <b>2-6-5</b> (last digits of 52, 26, 365). A dial padlock reads <b>26-5-4</b> (clue 2's answer, the last digit of clue 3, clue 4's answer); if you use a dial, tell him that rule. The box goes where clue 4 points.</p>`,
    lock:`Luggage lock: <b>2-6-5</b>. Dial padlock: <b>26-5-4</b> (tell him the rule: clue 2, last digit of clue 3, clue 4).`,
    clues:[
      { q:`Solve 5x − 8 = 252. A full deck has exactly this many. The next clue is in the deck.`, ans:'52', spot:`Inside his deck of playing cards (the magic one).`, hintSpot:`Shuffle.` },
      { q:`y = 3x + 2. Find y when x = 8. The alphabet has this many letters, and they're all in one heavy book on the shelf.`, ans:'26', spot:`In the dictionary (or the biggest book on the shelf).`, hintSpot:`A to Z.` },
      { q:`x + y = 730 and y = x. Find x. Every one of those is a square on the wall. Look at this month.`, ans:'365', spot:`Behind or on the calendar.`, hintSpot:`Days.` },
      { q:`2x + y = 12 and x − y = 0. Find x. The car has this many. So does the box's hiding place. The lock wants the last digit of your first three answers.`, ans:'4', spot:`The box goes in the garage, by the car (or by a wheel).`, hintSpot:`Round and round.` },
    ]
  };
})();
