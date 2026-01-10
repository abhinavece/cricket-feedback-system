// API Configuration
const API_BASE_URL = 'https://mavericks11.duckdns.org/api';

// Sample data
const players = [
  { name: 'Abhinav Kumar', phone: '9876543210', role: 'all-rounder' },
  { name: 'Rahul Sharma', phone: '9876543211', role: 'batsman' },
  { name: 'Vikas Patel', phone: '9876543212', role: 'bowler' },
  { name: 'Amit Singh', phone: '9876543213', role: 'wicket-keeper' },
  { name: 'Rohan Verma', phone: '9876543214', role: 'batsman' },
  { name: 'Karan Mehta', phone: '9876543215', role: 'bowler' },
  { name: 'Sanjay Gupta', phone: '9876543216', role: 'all-rounder' },
  { name: 'Deepak Yadav', phone: '9876543217', role: 'batsman' },
  { name: 'Prateek Joshi', phone: '9876543218', role: 'bowler' },
  { name: 'Ankit Reddy', phone: '9876543219', role: 'all-rounder' },
  { name: 'Gaurav Mehta', phone: '9876543220', role: 'batsman' }
];

const opponents = [
  'Royal Challengers',
  'Mumbai Warriors',
  'Delhi Capitals',
  'Chennai Super Stars',
  'Kolkata Knights',
  'Punjab Kings'
];

const grounds = [
  'Sector 16 Cricket Ground',
  'DLF Phase 2 Ground',
  'Leisure Valley Ground',
  'Golf Course Road Stadium',
  'Cyber Hub Cricket Arena'
];

const slots = ['Morning', 'Evening', 'Night'];

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    throw error;
  }
}

// Generate random date within last 3 months
function getRandomDate() {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Generate random rating
function getRandomRating() {
  return Math.floor(Math.random() * 3) + 3; // 3-5 stars
}

// Generate sample matches
async function generateMatches() {
  console.log('Creating sample matches...');
  const matches = [];
  
  for (let i = 0; i < 6; i++) {
    const matchData = {
      date: getRandomDate().toISOString(),
      opponent: opponents[i],
      ground: grounds[Math.floor(Math.random() * grounds.length)],
      slot: slots[Math.floor(Math.random() * slots.length)],
      matchId: `MAV${Date.now()}${i}`
    };
    
    try {
      const result = await apiCall('POST', '/matches', matchData);
      matches.push(result.match);
      console.log(`✓ Created match: ${matchData.opponent}`);
    } catch (error) {
      console.error(`✗ Failed to create match: ${matchData.opponent}`);
    }
  }
  
  return matches;
}

// Generate sample players
async function generatePlayers() {
  console.log('\nCreating sample players...');
  const createdPlayers = [];
  
  for (const player of players) {
    try {
      const result = await apiCall('POST', '/players', player);
      createdPlayers.push(result);
      console.log(`✓ Created player: ${player.name}`);
    } catch (error) {
      console.error(`✗ Failed to create player: ${player.name}`);
    }
  }
  
  return createdPlayers;
}

// Generate sample feedback
async function generateFeedback(matches) {
  console.log('\nCreating sample feedback...');
  
  for (const match of matches) {
    // Generate 3-5 feedback entries per match
    const feedbackCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < feedbackCount; i++) {
      const player = players[Math.floor(Math.random() * players.length)];
      const feedbackData = {
        matchId: match._id,
        playerName: player.name,
        playerPhone: player.phone,
        batting: getRandomRating(),
        bowling: getRandomRating(),
        fielding: getRandomRating(),
        teamSpirit: getRandomRating(),
        issues: {
          venue: Math.random() > 0.7,
          equipment: Math.random() > 0.8,
          timing: Math.random() > 0.85,
          umpiring: Math.random() > 0.9,
          other: false
        },
        comments: Math.random() > 0.5 ? 'Great match! Looking forward to the next one.' : ''
      };
      
      try {
        await apiCall('POST', '/feedback', feedbackData);
        console.log(`✓ Created feedback for ${player.name} - ${match.opponent}`);
      } catch (error) {
        console.error(`✗ Failed to create feedback for ${player.name}`);
      }
    }
  }
}

// Generate sample payments
async function generatePayments(matches) {
  console.log('\nCreating sample payment records...');
  
  for (const match of matches) {
    // Create payment record for match
    const totalAmount = 500; // ₹500 per match
    const squadSize = Math.floor(Math.random() * 3) + 8; // 8-10 players
    const perPlayerAmount = Math.floor(totalAmount / squadSize);
    
    const squadMembers = [];
    const selectedPlayers = [...players].sort(() => 0.5 - Math.random()).slice(0, squadSize);
    
    for (const player of selectedPlayers) {
      const statuses = ['pending', 'paid', 'due'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      squadMembers.push({
        playerName: player.name,
        playerPhone: player.phone,
        adjustedAmount: perPlayerAmount,
        paymentStatus: status
      });
    }
    
    const paymentData = {
      matchId: match._id,
      totalAmount,
      perPlayerAmount,
      squadMembers,
      status: 'draft'
    };
    
    try {
      await apiCall('POST', '/payments', paymentData);
      console.log(`✓ Created payment record for ${match.opponent}`);
    } catch (error) {
      console.error(`✗ Failed to create payment for ${match.opponent}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🏏 Generating sample data for Mavericks XI Cricket Feedback System\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);
  
  try {
    // Step 1: Create players
    await generatePlayers();
    
    // Step 2: Create matches
    const matches = await generateMatches();
    
    // Step 3: Create feedback
    await generateFeedback(matches);
    
    // Step 4: Create payment records
    await generatePayments(matches);
    
    console.log('\n✅ Sample data generation completed successfully!');
    console.log('\nGenerated:');
    console.log(`- ${players.length} players`);
    console.log(`- ${matches.length} matches`);
    console.log(`- Multiple feedback entries per match`);
    console.log(`- Payment records for all matches`);
    
  } catch (error) {
    console.error('\n❌ Error generating sample data:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
