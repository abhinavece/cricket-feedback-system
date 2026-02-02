/**
 * Cricket Glossary Data
 * Comprehensive dictionary of cricket terms for SEO
 */

export interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  category: 'batting' | 'bowling' | 'fielding' | 'match' | 'scoring' | 'equipment' | 'positions';
  relatedTerms?: string[];
  example?: string;
}

export const glossaryTerms: GlossaryTerm[] = [
  // BATTING TERMS
  {
    term: 'Century',
    slug: 'century',
    definition: 'A century is when a batsman scores 100 or more runs in a single innings. It is considered one of the most prestigious achievements for a batsman in cricket.',
    category: 'batting',
    relatedTerms: ['Half Century', 'Double Century', 'Runs'],
    example: 'Virat Kohli scored his 50th century in international cricket.',
  },
  {
    term: 'Half Century',
    slug: 'half-century',
    definition: 'A half century (also called a fifty) is when a batsman scores 50 or more runs but less than 100 in a single innings.',
    category: 'batting',
    relatedTerms: ['Century', 'Runs'],
  },
  {
    term: 'Double Century',
    slug: 'double-century',
    definition: 'A double century is when a batsman scores 200 or more runs in a single innings. This is a rare and exceptional achievement, primarily seen in Test cricket.',
    category: 'batting',
    relatedTerms: ['Century', 'Triple Century'],
  },
  {
    term: 'Duck',
    slug: 'duck',
    definition: 'A duck is when a batsman gets out without scoring any runs. The term comes from the shape of the number 0, which resembles a duck\'s egg.',
    category: 'batting',
    relatedTerms: ['Golden Duck', 'Silver Duck', 'Diamond Duck'],
    example: 'The opener was dismissed for a duck in the first over.',
  },
  {
    term: 'Golden Duck',
    slug: 'golden-duck',
    definition: 'A golden duck is when a batsman gets out on the very first ball they face without scoring any runs.',
    category: 'batting',
    relatedTerms: ['Duck', 'Silver Duck', 'Diamond Duck'],
  },
  {
    term: 'Silver Duck',
    slug: 'silver-duck',
    definition: 'A silver duck is when a batsman gets out on the second ball they face without scoring any runs.',
    category: 'batting',
    relatedTerms: ['Duck', 'Golden Duck'],
  },
  {
    term: 'Diamond Duck',
    slug: 'diamond-duck',
    definition: 'A diamond duck is when a batsman gets out without facing a single ball, typically through a run out at the non-striker\'s end.',
    category: 'batting',
    relatedTerms: ['Duck', 'Run Out'],
  },
  {
    term: 'Boundary',
    slug: 'boundary',
    definition: 'A boundary is when the ball reaches or crosses the boundary rope after being hit by the batsman. A ball that bounces before crossing scores 4 runs, while one that clears the rope without bouncing scores 6 runs.',
    category: 'batting',
    relatedTerms: ['Four', 'Six'],
  },
  {
    term: 'Six',
    slug: 'six',
    definition: 'A six is scored when the batsman hits the ball over the boundary rope without it bouncing. It is worth 6 runs and is one of the most exciting shots in cricket.',
    category: 'batting',
    relatedTerms: ['Four', 'Boundary', 'Maximum'],
  },
  {
    term: 'Four',
    slug: 'four',
    definition: 'A four is scored when the batsman hits the ball to the boundary rope and it bounces at least once before crossing. It is worth 4 runs.',
    category: 'batting',
    relatedTerms: ['Six', 'Boundary'],
  },
  {
    term: 'Strike Rate',
    slug: 'strike-rate',
    definition: 'Strike rate in batting is the number of runs scored per 100 balls faced. It indicates how quickly a batsman scores. Formula: (Runs Scored / Balls Faced) × 100.',
    category: 'batting',
    relatedTerms: ['Run Rate', 'Average'],
    example: 'A strike rate of 150 means the batsman scores 150 runs for every 100 balls faced.',
  },
  {
    term: 'Batting Average',
    slug: 'batting-average',
    definition: 'Batting average is the total number of runs scored divided by the number of times the batsman has been dismissed. It measures a batsman\'s consistency.',
    category: 'batting',
    relatedTerms: ['Strike Rate', 'Runs'],
  },
  {
    term: 'Not Out',
    slug: 'not-out',
    definition: 'Not out means a batsman remains at the crease without being dismissed when the innings ends. This can happen when the team wins, declares, or loses all other wickets.',
    category: 'batting',
    relatedTerms: ['Innings', 'Wicket'],
  },
  {
    term: 'Retired Hurt',
    slug: 'retired-hurt',
    definition: 'A batsman is retired hurt when they leave the field during their innings due to injury or illness. They may return to bat later if fit.',
    category: 'batting',
    relatedTerms: ['Retired Out', 'Not Out'],
  },
  {
    term: 'Nightwatchman',
    slug: 'nightwatchman',
    definition: 'A nightwatchman is a lower-order batsman sent to bat ahead of better batsmen near the end of a day\'s play to protect them from getting out.',
    category: 'batting',
    relatedTerms: ['Tailender', 'Batting Order'],
  },
  {
    term: 'Tailender',
    slug: 'tailender',
    definition: 'A tailender is a batsman who bats in the lower order (usually positions 8-11) and is primarily a bowler with limited batting skills.',
    category: 'batting',
    relatedTerms: ['All-rounder', 'Nightwatchman'],
  },
  {
    term: 'Opener',
    slug: 'opener',
    definition: 'An opener is one of the two batsmen who start the innings. They face the new ball and set the foundation for the team\'s batting.',
    category: 'batting',
    relatedTerms: ['Middle Order', 'Batting Order'],
  },
  {
    term: 'Middle Order',
    slug: 'middle-order',
    definition: 'The middle order refers to batsmen who bat at positions 4-7 in the batting lineup. They often consolidate or accelerate depending on the match situation.',
    category: 'batting',
    relatedTerms: ['Opener', 'Tailender'],
  },
  {
    term: 'Playing On',
    slug: 'playing-on',
    definition: 'Playing on is when a batsman accidentally hits the ball onto their own stumps while attempting a shot, resulting in being bowled out.',
    category: 'batting',
    relatedTerms: ['Bowled', 'Stumps'],
  },
  {
    term: 'Edge',
    slug: 'edge',
    definition: 'An edge is when the ball makes contact with the edge of the bat rather than the middle. This can result in catches to the wicketkeeper or slips.',
    category: 'batting',
    relatedTerms: ['Caught Behind', 'Snick', 'Nick'],
  },

  // BOWLING TERMS
  {
    term: 'Yorker',
    slug: 'yorker',
    definition: 'A yorker is a delivery that pitches directly at or just in front of the batsman\'s feet, making it extremely difficult to hit. It is one of the most effective deliveries in cricket, especially in death overs.',
    category: 'bowling',
    relatedTerms: ['Full Toss', 'Length Ball'],
    example: 'Jasprit Bumrah bowled a perfect yorker to dismiss the batsman.',
  },
  {
    term: 'Bouncer',
    slug: 'bouncer',
    definition: 'A bouncer (also called a bumper) is a short-pitched delivery that rises towards the batsman\'s head or chest after pitching. It is used to intimidate batsmen and force errors.',
    category: 'bowling',
    relatedTerms: ['Short Ball', 'Hook', 'Pull'],
  },
  {
    term: 'Googly',
    slug: 'googly',
    definition: 'A googly is a deceptive delivery bowled by a leg-spinner that turns in the opposite direction (from off to leg for a right-handed batsman) than expected. Also known as a wrong\'un or bosie.',
    category: 'bowling',
    relatedTerms: ['Leg Spin', 'Doosra', 'Carrom Ball'],
    example: 'Shane Warne was famous for his unplayable googlies.',
  },
  {
    term: 'Doosra',
    slug: 'doosra',
    definition: 'A doosra is a delivery bowled by an off-spinner that turns the opposite way (from leg to off for a right-handed batsman). The term means "the other one" in Hindi/Urdu.',
    category: 'bowling',
    relatedTerms: ['Off Spin', 'Googly', 'Carrom Ball'],
  },
  {
    term: 'Leg Spin',
    slug: 'leg-spin',
    definition: 'Leg spin is a type of spin bowling where the ball spins from leg to off (right to left for a right-handed batsman). Leg spinners typically bowl slower and with more variations.',
    category: 'bowling',
    relatedTerms: ['Off Spin', 'Googly', 'Flipper'],
  },
  {
    term: 'Off Spin',
    slug: 'off-spin',
    definition: 'Off spin is a type of spin bowling where the ball spins from off to leg (left to right for a right-handed batsman). Off spinners use their fingers to impart spin.',
    category: 'bowling',
    relatedTerms: ['Leg Spin', 'Doosra', 'Arm Ball'],
  },
  {
    term: 'Swing',
    slug: 'swing',
    definition: 'Swing is the lateral movement of the ball through the air. Outswing moves away from the batsman, while inswing moves towards them. Swing is achieved through seam position and air pressure differences.',
    category: 'bowling',
    relatedTerms: ['Seam', 'Reverse Swing', 'New Ball'],
  },
  {
    term: 'Reverse Swing',
    slug: 'reverse-swing',
    definition: 'Reverse swing is when an old ball moves in the opposite direction to conventional swing. It typically occurs when one side of the ball is rougher than the other.',
    category: 'bowling',
    relatedTerms: ['Swing', 'Old Ball', 'Seam'],
  },
  {
    term: 'Seam',
    slug: 'seam',
    definition: 'Seam bowling involves making the ball deviate off the pitch using the raised seam. Seam movement is different from spin as it relies on the seam hitting the pitch at an angle.',
    category: 'bowling',
    relatedTerms: ['Swing', 'Pace Bowling'],
  },
  {
    term: 'Full Toss',
    slug: 'full-toss',
    definition: 'A full toss is a delivery that reaches the batsman without bouncing. It is generally considered a bad ball as it is easy to hit, unless bowled as a slower ball.',
    category: 'bowling',
    relatedTerms: ['Yorker', 'Beamer'],
  },
  {
    term: 'Beamer',
    slug: 'beamer',
    definition: 'A beamer is a full toss that reaches the batsman above waist height without bouncing. It is dangerous and considered an illegal delivery. A no-ball is called and repeated beamers can result in the bowler being banned from bowling.',
    category: 'bowling',
    relatedTerms: ['Full Toss', 'No Ball'],
  },
  {
    term: 'No Ball',
    slug: 'no-ball',
    definition: 'A no ball is an illegal delivery that can occur for various reasons: front foot overstepping the crease, bouncing more than twice, dangerous bowling, or incorrect fielding positions. The batting team gets one extra run plus a free hit in limited-overs cricket.',
    category: 'bowling',
    relatedTerms: ['Wide', 'Free Hit', 'Extra'],
  },
  {
    term: 'Wide',
    slug: 'wide',
    definition: 'A wide is a delivery that passes too far from the batsman to be reasonably hit. The batting team gets one extra run and the ball must be bowled again. Wide rules are stricter in limited-overs cricket.',
    category: 'bowling',
    relatedTerms: ['No Ball', 'Extra'],
  },
  {
    term: 'Maiden Over',
    slug: 'maiden-over',
    definition: 'A maiden over is an over in which no runs are scored off the bat (excluding extras). It shows excellent bowling control and puts pressure on the batting team.',
    category: 'bowling',
    relatedTerms: ['Over', 'Wicket Maiden'],
    example: 'The bowler completed three consecutive maiden overs.',
  },
  {
    term: 'Hat-trick',
    slug: 'hat-trick',
    definition: 'A hat-trick in cricket is when a bowler takes three wickets with three consecutive deliveries. This is one of the most celebrated bowling achievements in cricket.',
    category: 'bowling',
    relatedTerms: ['Wicket', 'Five-wicket Haul'],
    example: 'Lasith Malinga is famous for his hat-tricks in World Cups.',
  },
  {
    term: 'Economy Rate',
    slug: 'economy-rate',
    definition: 'Economy rate is the average number of runs conceded per over by a bowler. A lower economy rate indicates more economical bowling. Formula: Runs Conceded / Overs Bowled.',
    category: 'bowling',
    relatedTerms: ['Strike Rate', 'Bowling Average'],
    example: 'An economy rate of 4.0 means the bowler concedes 4 runs per over on average.',
  },
  {
    term: 'Bowling Average',
    slug: 'bowling-average',
    definition: 'Bowling average is the number of runs conceded per wicket taken. A lower bowling average indicates a more effective bowler. Formula: Runs Conceded / Wickets Taken.',
    category: 'bowling',
    relatedTerms: ['Economy Rate', 'Strike Rate'],
  },
  {
    term: 'Five-wicket Haul',
    slug: 'five-wicket-haul',
    definition: 'A five-wicket haul (also called a fifer or five-for) is when a bowler takes five or more wickets in a single innings. It is a significant achievement for any bowler.',
    category: 'bowling',
    relatedTerms: ['Hat-trick', 'Ten-wicket Match Haul'],
  },
  {
    term: 'Carrom Ball',
    slug: 'carrom-ball',
    definition: 'A carrom ball is a delivery flicked with the fingers (similar to playing carrom) that spins unexpectedly. It was popularized by Ajantha Mendis and R Ashwin.',
    category: 'bowling',
    relatedTerms: ['Off Spin', 'Googly', 'Doosra'],
  },
  {
    term: 'Slower Ball',
    slug: 'slower-ball',
    definition: 'A slower ball is a delivery bowled at a significantly reduced pace to deceive the batsman who expects a faster delivery. Various grips can be used to bowl slower balls.',
    category: 'bowling',
    relatedTerms: ['Pace Bowling', 'Yorker'],
  },
  {
    term: 'Flipper',
    slug: 'flipper',
    definition: 'A flipper is a leg-spinner\'s delivery that skids low and fast after pitching, rather than bouncing. It is squeezed out of the hand and often catches batsmen off guard.',
    category: 'bowling',
    relatedTerms: ['Leg Spin', 'Googly', 'Top Spinner'],
  },

  // FIELDING TERMS
  {
    term: 'Slip',
    slug: 'slip',
    definition: 'Slip is a fielding position behind the batsman on the off side, close to the wicketkeeper. First slip is closest to the keeper, followed by second slip, third slip, etc.',
    category: 'fielding',
    relatedTerms: ['Gully', 'Wicketkeeper', 'Catch'],
  },
  {
    term: 'Gully',
    slug: 'gully',
    definition: 'Gully is a fielding position on the off side, between point and the slips. It is wider than the slips and often catches balls that are cut or edged.',
    category: 'fielding',
    relatedTerms: ['Slip', 'Point'],
  },
  {
    term: 'Point',
    slug: 'point',
    definition: 'Point is a fielding position on the off side, square of the wicket. It covers cut shots and balls played square on the off side.',
    category: 'fielding',
    relatedTerms: ['Cover', 'Gully'],
  },
  {
    term: 'Cover',
    slug: 'cover',
    definition: 'Cover is a fielding position on the off side, between point and mid-off. Cover fielders often need to be athletic to cut off drives and quick singles.',
    category: 'fielding',
    relatedTerms: ['Point', 'Mid-off', 'Extra Cover'],
  },
  {
    term: 'Mid-off',
    slug: 'mid-off',
    definition: 'Mid-off is a fielding position on the off side, slightly forward of the batsman. It covers straight drives on the off side.',
    category: 'fielding',
    relatedTerms: ['Mid-on', 'Cover'],
  },
  {
    term: 'Mid-on',
    slug: 'mid-on',
    definition: 'Mid-on is a fielding position on the leg side, slightly forward of the batsman. It covers straight drives on the leg side.',
    category: 'fielding',
    relatedTerms: ['Mid-off', 'Mid-wicket'],
  },
  {
    term: 'Fine Leg',
    slug: 'fine-leg',
    definition: 'Fine leg is a fielding position on the leg side, behind square and close to the boundary. It covers leg glances and fine deflections.',
    category: 'fielding',
    relatedTerms: ['Square Leg', 'Deep Fine Leg'],
  },
  {
    term: 'Third Man',
    slug: 'third-man',
    definition: 'Third man is a fielding position on the off side, behind square and close to the boundary. It covers cuts, edges, and late deflections.',
    category: 'fielding',
    relatedTerms: ['Slip', 'Gully'],
  },
  {
    term: 'Silly Point',
    slug: 'silly-point',
    definition: 'Silly point is a close-in fielding position on the off side, very close to the batsman. It is a dangerous position used to catch balls that pop up off the bat.',
    category: 'fielding',
    relatedTerms: ['Short Leg', 'Slip'],
  },
  {
    term: 'Short Leg',
    slug: 'short-leg',
    definition: 'Short leg is a close-in fielding position on the leg side, very close to the batsman. The fielder often wears protective equipment due to the danger from the bat.',
    category: 'fielding',
    relatedTerms: ['Silly Point', 'Leg Slip'],
  },
  {
    term: 'Wicketkeeper',
    slug: 'wicketkeeper',
    definition: 'The wicketkeeper is the player who stands behind the stumps to catch balls that pass the batsman. They also execute stumpings and can take catches off edges.',
    category: 'fielding',
    relatedTerms: ['Stumping', 'Caught Behind'],
  },
  {
    term: 'Catch',
    slug: 'catch',
    definition: 'A catch is a mode of dismissal where a fielder catches the ball hit by the batsman before it touches the ground. The catch must be taken cleanly.',
    category: 'fielding',
    relatedTerms: ['Dropped Catch', 'Slip'],
  },
  {
    term: 'Run Out',
    slug: 'run-out',
    definition: 'A run out is a mode of dismissal where the fielding team breaks the wicket while the batsman is out of their crease during a run. Either batsman can be run out.',
    category: 'fielding',
    relatedTerms: ['Direct Hit', 'Crease'],
  },
  {
    term: 'Stumping',
    slug: 'stumping',
    definition: 'Stumping is a mode of dismissal where the wicketkeeper breaks the wicket while the batsman is out of their crease after missing or leaving a delivery.',
    category: 'fielding',
    relatedTerms: ['Wicketkeeper', 'Crease'],
  },

  // MATCH TERMS
  {
    term: 'Innings',
    slug: 'innings',
    definition: 'An innings is a team\'s turn to bat. In Test cricket, each team has two innings. In limited-overs formats (ODI, T20), each team has one innings.',
    category: 'match',
    relatedTerms: ['Over', 'Declaration'],
  },
  {
    term: 'Over',
    slug: 'over',
    definition: 'An over is a set of six legal deliveries bowled by a single bowler from one end of the pitch. After each over, the bowling changes to the other end.',
    category: 'match',
    relatedTerms: ['Maiden Over', 'No Ball', 'Wide'],
  },
  {
    term: 'Test Match',
    slug: 'test-match',
    definition: 'Test match is the longest format of international cricket, played over five days with each team having two innings. It is considered the pinnacle of cricket.',
    category: 'match',
    relatedTerms: ['ODI', 'T20', 'First-Class'],
  },
  {
    term: 'ODI',
    slug: 'odi',
    definition: 'ODI (One Day International) is a limited-overs format where each team bats for 50 overs. It was the dominant format for international cricket before T20.',
    category: 'match',
    relatedTerms: ['Test Match', 'T20'],
  },
  {
    term: 'T20',
    slug: 't20',
    definition: 'T20 (Twenty20) is the shortest format of professional cricket where each team bats for 20 overs. It is known for its fast-paced, entertainment-focused style.',
    category: 'match',
    relatedTerms: ['ODI', 'IPL', 'Powerplay'],
  },
  {
    term: 'Powerplay',
    slug: 'powerplay',
    definition: 'Powerplay refers to specific overs in limited-overs cricket where fielding restrictions apply. In T20, overs 1-6 are mandatory powerplay with only 2 fielders allowed outside the 30-yard circle.',
    category: 'match',
    relatedTerms: ['T20', 'ODI', 'Fielding Restrictions'],
  },
  {
    term: 'Super Over',
    slug: 'super-over',
    definition: 'A Super Over is a tie-breaker used in limited-overs cricket when a match ends in a tie. Each team bats one over, and the team with more runs wins.',
    category: 'match',
    relatedTerms: ['Tie', 'T20'],
    example: 'The 2019 World Cup final was decided by a Super Over.',
  },
  {
    term: 'DLS Method',
    slug: 'dls-method',
    definition: 'The Duckworth-Lewis-Stern (DLS) method is a mathematical formula used to calculate target scores in rain-affected limited-overs matches. It considers resources (wickets and overs) remaining.',
    category: 'match',
    relatedTerms: ['Rain Delay', 'Target', 'ODI', 'T20'],
  },
  {
    term: 'Follow-on',
    slug: 'follow-on',
    definition: 'In Test cricket, if a team trails by a certain margin (200 runs in 5-day Tests) after the first innings, the opposing captain can ask them to bat again immediately.',
    category: 'match',
    relatedTerms: ['Test Match', 'Innings'],
  },
  {
    term: 'Declaration',
    slug: 'declaration',
    definition: 'A declaration is when a captain voluntarily ends their team\'s innings before all batsmen are out. This is typically done in Test cricket to set up a result.',
    category: 'match',
    relatedTerms: ['Innings', 'Test Match'],
  },
  {
    term: 'Draw',
    slug: 'draw',
    definition: 'A draw is a result in Test cricket when neither team wins after all scheduled play is completed. This is different from a tie where scores are level.',
    category: 'match',
    relatedTerms: ['Tie', 'Test Match'],
  },
  {
    term: 'Tie',
    slug: 'tie',
    definition: 'A tie occurs when both teams finish with exactly the same score at the end of the match. In limited-overs, ties may lead to a Super Over.',
    category: 'match',
    relatedTerms: ['Draw', 'Super Over'],
  },
  {
    term: 'Toss',
    slug: 'toss',
    definition: 'The toss is a coin flip before the match where the winning captain chooses whether to bat or field first. The toss can be crucial depending on pitch and weather conditions.',
    category: 'match',
    relatedTerms: ['Pitch', 'Innings'],
  },
  {
    term: 'New Ball',
    slug: 'new-ball',
    definition: 'The new ball is taken at the start of each innings and can be taken again after 80 overs in Test cricket. It swings more and bounces higher than an old ball.',
    category: 'match',
    relatedTerms: ['Old Ball', 'Swing', 'Reverse Swing'],
  },
  {
    term: 'Death Overs',
    slug: 'death-overs',
    definition: 'Death overs are the final overs of a limited-overs innings (typically the last 5 overs in T20 or last 10 in ODI) when batsmen try to score quickly.',
    category: 'match',
    relatedTerms: ['Powerplay', 'Slog', 'Yorker'],
  },

  // SCORING TERMS
  {
    term: 'Run Rate',
    slug: 'run-rate',
    definition: 'Run rate is the average number of runs scored per over. Current run rate = Total runs / Overs faced. Required run rate = Runs needed / Overs remaining.',
    category: 'scoring',
    relatedTerms: ['Net Run Rate', 'Strike Rate'],
    example: 'A run rate of 6.0 means 6 runs are scored per over on average.',
  },
  {
    term: 'Net Run Rate',
    slug: 'net-run-rate',
    definition: 'Net Run Rate (NRR) is used to rank teams with equal points in tournaments. NRR = (runs scored/overs faced) - (runs conceded/overs bowled).',
    category: 'scoring',
    relatedTerms: ['Run Rate', 'Points Table'],
  },
  {
    term: 'Extras',
    slug: 'extras',
    definition: 'Extras are runs scored without being hit by the batsman. They include wides, no-balls, byes, and leg byes. Extras are added to the team\'s total but not individual scores.',
    category: 'scoring',
    relatedTerms: ['Byes', 'Leg Byes', 'Wide', 'No Ball'],
  },
  {
    term: 'Byes',
    slug: 'byes',
    definition: 'Byes are extras scored when the ball passes the batsman and wicketkeeper without touching the bat, allowing the batsmen to take runs.',
    category: 'scoring',
    relatedTerms: ['Leg Byes', 'Extras'],
  },
  {
    term: 'Leg Byes',
    slug: 'leg-byes',
    definition: 'Leg byes are extras scored when the ball deflects off the batsman\'s body (not the bat) and the batsmen take runs. The batsman must have attempted a shot or tried to avoid the ball.',
    category: 'scoring',
    relatedTerms: ['Byes', 'Extras'],
  },
  {
    term: 'Free Hit',
    slug: 'free-hit',
    definition: 'A free hit is awarded after a front-foot no-ball in limited-overs cricket. The batsman cannot be dismissed except by run out, stumping, or hitting the ball twice.',
    category: 'scoring',
    relatedTerms: ['No Ball', 'T20', 'ODI'],
  },
  {
    term: 'LBW',
    slug: 'lbw',
    definition: 'LBW (Leg Before Wicket) is a mode of dismissal where the ball would have hit the stumps but instead hits the batsman\'s leg or body. The ball must pitch in line or outside off stump.',
    category: 'scoring',
    relatedTerms: ['Dismissal', 'Umpire', 'DRS'],
  },
  {
    term: 'DRS',
    slug: 'drs',
    definition: 'DRS (Decision Review System) allows teams to challenge on-field umpire decisions using technology. Each team gets a limited number of unsuccessful reviews per innings.',
    category: 'scoring',
    relatedTerms: ['LBW', 'Umpire', 'Hawk-Eye'],
  },

  // EQUIPMENT TERMS
  {
    term: 'Bat',
    slug: 'bat',
    definition: 'A cricket bat is made of willow wood with a cane handle. The blade must not exceed 108mm in width and 38mm in depth. The total length cannot exceed 965mm.',
    category: 'equipment',
    relatedTerms: ['Ball', 'Stumps'],
  },
  {
    term: 'Ball',
    slug: 'ball',
    definition: 'A cricket ball is made of cork wrapped in leather with a raised seam. Red balls are used in Test cricket, white balls in limited-overs, and pink balls for day-night Tests.',
    category: 'equipment',
    relatedTerms: ['New Ball', 'Seam', 'Swing'],
  },
  {
    term: 'Stumps',
    slug: 'stumps',
    definition: 'Stumps are the three vertical posts that make up the wicket. They are topped by two bails. The stumps are named leg stump, middle stump, and off stump.',
    category: 'equipment',
    relatedTerms: ['Bails', 'Wicket', 'Crease'],
  },
  {
    term: 'Bails',
    slug: 'bails',
    definition: 'Bails are two small pieces of wood that sit on top of the stumps. The wicket is "broken" when at least one bail is dislodged, which is required for most dismissals.',
    category: 'equipment',
    relatedTerms: ['Stumps', 'Wicket'],
  },
  {
    term: 'Crease',
    slug: 'crease',
    definition: 'The crease is a set of white lines near the stumps. The popping crease (4 feet in front of stumps) determines if a batsman is in or out of their ground.',
    category: 'equipment',
    relatedTerms: ['Stumps', 'Run Out', 'Stumping'],
  },
  {
    term: 'Pitch',
    slug: 'pitch',
    definition: 'The pitch is the 22-yard strip in the center of the field where bowling and batting take place. Pitch conditions greatly affect how the ball behaves.',
    category: 'equipment',
    relatedTerms: ['Outfield', 'Wicket'],
  },

  // POSITIONS
  {
    term: 'All-rounder',
    slug: 'all-rounder',
    definition: 'An all-rounder is a player who excels at both batting and bowling. They provide balance to a team by contributing significantly in both departments.',
    category: 'positions',
    relatedTerms: ['Batting All-rounder', 'Bowling All-rounder'],
    example: 'Ben Stokes is considered one of the best all-rounders in modern cricket.',
  },
  {
    term: 'Captain',
    slug: 'captain',
    definition: 'The captain is the leader of the team who makes strategic decisions including field placements, bowling changes, and batting order. They also handle the toss.',
    category: 'positions',
    relatedTerms: ['Vice-captain', 'Toss'],
  },
  {
    term: 'Vice-captain',
    slug: 'vice-captain',
    definition: 'The vice-captain is second-in-command who leads the team when the captain is unavailable. They often help with on-field decisions.',
    category: 'positions',
    relatedTerms: ['Captain'],
  },
];

// Get terms by category
export function getTermsByCategory(category: GlossaryTerm['category']): GlossaryTerm[] {
  return glossaryTerms.filter((term) => term.category === category);
}

// Get a single term by slug
export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((term) => term.slug === slug);
}

// Get all categories
export function getAllCategories(): GlossaryTerm['category'][] {
  return ['batting', 'bowling', 'fielding', 'match', 'scoring', 'equipment', 'positions'];
}

// Get category display name
export function getCategoryDisplayName(category: GlossaryTerm['category']): string {
  const names: Record<GlossaryTerm['category'], string> = {
    batting: 'Batting Terms',
    bowling: 'Bowling Terms',
    fielding: 'Fielding Positions & Terms',
    match: 'Match & Format Terms',
    scoring: 'Scoring & Rules',
    equipment: 'Equipment',
    positions: 'Player Positions',
  };
  return names[category];
}

// Search terms
export function searchTerms(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return glossaryTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.definition.toLowerCase().includes(lowerQuery)
  );
}

// Get all term slugs for sitemap
export function getAllTermSlugs(): string[] {
  return glossaryTerms.map((term) => term.slug);
}
