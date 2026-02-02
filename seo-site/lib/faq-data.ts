/**
 * Cricket FAQ Data
 * Comprehensive FAQ for SEO
 */

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'rules' | 'scoring' | 'formats' | 'equipment' | 'general';
}

export interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export const faqCategories: FAQCategory[] = [
  {
    id: 'rules',
    name: 'Cricket Rules',
    slug: 'rules',
    description: 'Common questions about cricket rules, regulations, and gameplay.',
  },
  {
    id: 'scoring',
    name: 'Scoring & Stats',
    slug: 'scoring',
    description: 'Questions about how runs, wickets, and statistics are calculated.',
  },
  {
    id: 'formats',
    name: 'Match Formats',
    slug: 'formats',
    description: 'Questions about Test, ODI, T20, and other cricket formats.',
  },
  {
    id: 'equipment',
    name: 'Equipment',
    slug: 'equipment',
    description: 'Questions about cricket bats, balls, and gear.',
  },
  {
    id: 'general',
    name: 'General Cricket',
    slug: 'general',
    description: 'General questions about cricket for beginners.',
  },
];

export const faqs: FAQ[] = [
  // RULES
  {
    id: 'players-in-team',
    question: 'How many players are in a cricket team?',
    answer: 'A cricket team has 11 players on the field at any time. However, squads for tournaments typically consist of 15-18 players to account for injuries and rest. In a match, only 11 players bat and 11 players field, though the batting side has only 2 batsmen at the crease at once.',
    category: 'rules',
  },
  {
    id: 'lbw-rule',
    question: 'What is the LBW rule in cricket?',
    answer: 'LBW (Leg Before Wicket) is a way of dismissing a batsman. A batsman is out LBW when: (1) The ball would have hit the stumps, (2) The ball hits the batsman\'s body (not the bat) first, (3) The ball pitched in line with the stumps or outside off stump (for right-handers), and (4) The impact was in line with the stumps, unless the batsman was not offering a shot.',
    category: 'rules',
  },
  {
    id: 'overs-odi-t20-test',
    question: 'How many overs are there in ODI, T20, and Test matches?',
    answer: 'In ODI (One Day International) matches, each team bats for 50 overs. In T20 (Twenty20) matches, each team bats for 20 overs. In Test matches, there is no limit on overs - teams can bat until they are all out or declare their innings. Test matches are played over 5 days with a minimum of 90 overs bowled per day.',
    category: 'rules',
  },
  {
    id: 'super-over',
    question: 'What happens in a Super Over?',
    answer: 'A Super Over is used to break ties in limited-overs cricket. Each team nominates 3 batsmen and 1 bowler. Each team bats for 1 over (6 balls), and the team scoring more runs wins. If scores are still tied, another Super Over is played (though some tournaments use boundary count or other tiebreakers).',
    category: 'rules',
  },
  {
    id: 'powerplay',
    question: 'What is Powerplay in cricket?',
    answer: 'Powerplay refers to overs with fielding restrictions. In T20: Overs 1-6 are mandatory powerplay with only 2 fielders allowed outside the 30-yard circle. In ODI: Overs 1-10 are powerplay 1 (only 2 fielders outside), and teams can take 2 more powerplays of 5 overs each in the remaining innings (max 4 fielders outside during these).',
    category: 'rules',
  },
  {
    id: 'no-ball-free-hit',
    question: 'What is a no ball and free hit?',
    answer: 'A no ball is an illegal delivery, most commonly when the bowler\'s front foot crosses the crease. Other reasons include dangerous bowling (bouncers above shoulder height), throwing, or incorrect fielding positions. In limited-overs cricket, a no ball results in an extra run AND a free hit - the next ball from which the batsman cannot be bowled, caught, or LBW.',
    category: 'rules',
  },
  {
    id: 'follow-on',
    question: 'What is follow-on in cricket?',
    answer: 'Follow-on is a rule in Test cricket where if a team trails by 200+ runs after the first innings (150 runs in 3-4 day matches), the opposing captain can enforce the follow-on - making the trailing team bat again immediately instead of taking their own second innings. This can help win the match faster.',
    category: 'rules',
  },
  {
    id: 'declaration',
    question: 'What is declaration in cricket?',
    answer: 'Declaration is when a batting captain voluntarily ends their team\'s innings before all batsmen are out. This is only done in Test cricket, typically to give their bowlers enough time to bowl out the opposition. Captains declare when they believe they have enough runs to win.',
    category: 'rules',
  },

  // SCORING
  {
    id: 'run-rate-calculation',
    question: 'How is run rate calculated in cricket?',
    answer: 'Run rate is calculated by dividing total runs by overs faced. Formula: Run Rate = Runs Scored ÷ Overs Bowled. For example, if a team scores 120 runs in 20 overs, the run rate is 120 ÷ 20 = 6.0 runs per over. Required run rate = Runs Needed ÷ Overs Remaining.',
    category: 'scoring',
  },
  {
    id: 'net-run-rate',
    question: 'What is Net Run Rate (NRR)?',
    answer: 'Net Run Rate is used to rank teams with equal points in tournaments. NRR = (Total runs scored ÷ Total overs faced) - (Total runs conceded ÷ Total overs bowled). A positive NRR means a team scores faster than they concede. Teams with higher NRR rank above teams with the same points.',
    category: 'scoring',
  },
  {
    id: 'dls-method',
    question: 'How does the DLS method work?',
    answer: 'The Duckworth-Lewis-Stern (DLS) method calculates revised targets for rain-affected matches. It considers "resources" - a combination of overs and wickets remaining. If the chasing team loses overs, their target is adjusted based on the resources available to both teams. The formula considers that losing wickets early is less damaging than losing them late.',
    category: 'scoring',
  },
  {
    id: 'strike-rate',
    question: 'What is strike rate in cricket?',
    answer: 'Batting strike rate is runs scored per 100 balls. Formula: (Runs ÷ Balls Faced) × 100. A strike rate of 150 means 150 runs per 100 balls. Bowling strike rate is balls bowled per wicket taken. Formula: Balls Bowled ÷ Wickets Taken. Lower bowling strike rate is better (fewer balls to take a wicket).',
    category: 'scoring',
  },
  {
    id: 'bowling-average',
    question: 'How is bowling average calculated?',
    answer: 'Bowling average is runs conceded per wicket taken. Formula: Runs Conceded ÷ Wickets Taken. A lower bowling average indicates a more effective bowler. For example, a bowler with 200 runs conceded and 10 wickets has an average of 20.0.',
    category: 'scoring',
  },
  {
    id: 'extras',
    question: 'What are extras in cricket?',
    answer: 'Extras are runs scored without the batsman hitting the ball. They include: (1) Wides - ball too far from batsman, (2) No balls - illegal deliveries, (3) Byes - ball passes batsman and keeper, runs taken, (4) Leg byes - ball hits batsman\'s body, runs taken. Extras count towards team total but not individual scores.',
    category: 'scoring',
  },

  // FORMATS
  {
    id: 'test-odi-t20-difference',
    question: 'What is the difference between Test, ODI, and T20?',
    answer: 'Test cricket: 5 days, unlimited overs, 2 innings per team, red ball, white clothing. ODI (One Day): 1 day, 50 overs per team, 1 innings each, white ball, colored clothing. T20: ~3 hours, 20 overs per team, 1 innings each, white ball, colored clothing. Tests are considered the purest form, while T20 is the most fast-paced and entertaining.',
    category: 'formats',
  },
  {
    id: 'the-hundred',
    question: 'What is The Hundred cricket format?',
    answer: 'The Hundred is a format created by the ECB where each team faces 100 balls instead of overs. Bowlers bowl 5 consecutive balls (not 6). The team batting first sets a target, and the chasing team tries to surpass it in their 100 balls. It was designed to attract new audiences with simplified rules and shorter duration.',
    category: 'formats',
  },
  {
    id: 'test-match-duration',
    question: 'How long is a Test match?',
    answer: 'A Test match is scheduled for 5 days, with approximately 90 overs (6 hours of play) per day. However, matches can end earlier if one team wins. If the match is not completed in 5 days and neither team has won, it ends in a draw. Day-night Tests use pink balls and have adjusted timings.',
    category: 'formats',
  },
  {
    id: 'ipl-format',
    question: 'What is the IPL format?',
    answer: 'The Indian Premier League (IPL) uses T20 format with 20 overs per side. The league phase has 10 teams playing each other, followed by playoffs. Teams are franchises that buy players through auctions. It is the most valuable cricket league and has transformed cricket globally.',
    category: 'formats',
  },
  {
    id: 'world-cup-format',
    question: 'How does the Cricket World Cup work?',
    answer: 'The ICC Cricket World Cup (ODI) features qualifying nations in a tournament. Recent formats have included: (1) Group stage where all teams play each other, (2) Top teams advance to knockouts (semi-finals, final). The T20 World Cup has a similar format with more teams and shorter matches.',
    category: 'formats',
  },

  // EQUIPMENT
  {
    id: 'bat-specifications',
    question: 'What are the specifications of a cricket bat?',
    answer: 'A cricket bat must be made of wood (typically English willow). Maximum dimensions: Width - 108mm (4.25 inches), Depth - 67mm (2.64 inches), Length - 965mm (38 inches). The blade must not be covered with non-wood materials. Weight is not regulated but typically ranges from 1.1kg to 1.4kg.',
    category: 'equipment',
  },
  {
    id: 'ball-types',
    question: 'What is the difference between red, white, and pink cricket balls?',
    answer: 'Red ball: Used in Test cricket and first-class matches. Lasts longer, swings more early on. White ball: Used in limited-overs (ODI, T20). Easier to see under lights, doesn\'t swing as much. Pink ball: Used in day-night Tests. Visibility compromise between red and white, has a lacquer coating.',
    category: 'equipment',
  },
  {
    id: 'stumps-dimensions',
    question: 'What are the dimensions of cricket stumps?',
    answer: 'The wicket consists of 3 stumps and 2 bails. Stumps are 28 inches (71.1cm) tall and 9 inches (22.9cm) wide overall. Each stump is 1.38 inches (3.5cm) in diameter. The two bails are 4.31 inches (10.95cm) long. The wickets are placed 22 yards (20.12m) apart.',
    category: 'equipment',
  },
  {
    id: 'pitch-dimensions',
    question: 'What are the dimensions of a cricket pitch?',
    answer: 'The pitch is 22 yards (20.12m) long and 10 feet (3.05m) wide. The popping crease is 4 feet in front of the stumps. The return creases extend at least 8 feet behind the popping crease. The pitch is located in the center of the playing field, which has no fixed size but is typically 150-160 yards in diameter.',
    category: 'equipment',
  },

  // GENERAL
  {
    id: 'cricket-origin',
    question: 'Where was cricket invented?',
    answer: 'Cricket originated in England, with the earliest definite reference dating to 1598. It developed in the southeastern counties and became established as a major sport in the 18th century. The first international match was between the USA and Canada in 1844, and England played Australia in the first Test match in 1877.',
    category: 'general',
  },
  {
    id: 'icc-role',
    question: 'What is the ICC?',
    answer: 'The ICC (International Cricket Council) is the global governing body for cricket. It organizes major tournaments like the World Cup, sets playing conditions and rules, maintains rankings, and oversees the cricket calendar. ICC has 108 member nations, with 12 having Test status.',
    category: 'general',
  },
  {
    id: 'best-batsman',
    question: 'Who are the greatest batsmen in cricket history?',
    answer: 'Widely regarded greats include: Don Bradman (Australia) - highest Test average of 99.94, Sachin Tendulkar (India) - most international runs and centuries, Viv Richards (West Indies) - dominant era batsman, Brian Lara (West Indies) - highest individual Test score (400*), Virat Kohli (India) - modern era great with most ODI centuries.',
    category: 'general',
  },
  {
    id: 'highest-score',
    question: 'What is the highest score in cricket?',
    answer: 'Individual: Brian Lara scored 400* (not out) for West Indies vs England in 2004 (Test). In ODIs, Rohit Sharma holds the record with 264 vs Sri Lanka in 2014. Team: England scored 498/4 vs Netherlands in ODI (2022). In T20Is, Nepal scored 314/3 vs Mongolia (2023).',
    category: 'general',
  },
];

// Get FAQs by category
export function getFAQsByCategory(category: string): FAQ[] {
  return faqs.filter((faq) => faq.category === category);
}

// Get category by slug
export function getCategoryBySlug(slug: string): FAQCategory | undefined {
  return faqCategories.find((cat) => cat.slug === slug);
}

// Search FAQs
export function searchFAQs(query: string): FAQ[] {
  const lowerQuery = query.toLowerCase();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery)
  );
}
