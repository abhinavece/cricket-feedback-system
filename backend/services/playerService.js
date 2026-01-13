/**
 * Centralized Player Service
 * 
 * This service is the single source of truth for player management.
 * All player-related operations should go through this service to ensure:
 * 1. Phone numbers are unique in the players collection
 * 2. No duplicate players are created
 * 3. Consistent player data across all features (WhatsApp, Match, Payment)
 */

const Player = require('../models/Player');

/**
 * Format phone number to standard format (with 91 prefix)
 * @param {string} phone - Raw phone number
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.length === 10) {
    // Indian 10-digit number without country code
    digits = '91' + digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    // Already has 91 prefix
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Remove leading 0 and add 91
    digits = '91' + digits.substring(1);
  }
  
  return digits;
};

/**
 * Get or create a player by phone number
 * This is the primary method to use when adding players anywhere in the system.
 * 
 * @param {Object} params - Player parameters
 * @param {string} params.phone - Phone number (required)
 * @param {string} params.name - Player name (required for new players)
 * @param {string} params.role - Player role (optional, default: 'player')
 * @param {string} params.team - Team name (optional, default: 'Mavericks XI')
 * @param {string} params.notes - Notes (optional)
 * @param {boolean} params.updateIfExists - Update name/notes if player exists (optional, default: false)
 * @returns {Promise<Object>} - { player: Player, isNew: boolean }
 */
const getOrCreatePlayer = async ({ phone, name, role, team, notes, updateIfExists = false }) => {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  
  const formattedPhone = formatPhoneNumber(phone);
  
  if (!formattedPhone || formattedPhone.length < 10) {
    throw new Error('Invalid phone number format');
  }
  
  // Try to find existing player by phone
  let player = await Player.findOne({ phone: formattedPhone });
  
  if (player) {
    // Player exists - optionally update their info
    if (updateIfExists && name) {
      player.name = name;
      if (notes !== undefined) player.notes = notes;
      if (role) player.role = role;
      await player.save();
    }
    return { player, isNew: false };
  }
  
  // Player doesn't exist - create new one
  if (!name) {
    throw new Error('Player name is required for new players');
  }
  
  player = await Player.create({
    name: name.trim(),
    phone: formattedPhone,
    role: role || 'player',
    team: team || 'Mavericks XI',
    notes: notes || '',
    isActive: true
  });
  
  return { player, isNew: true };
};

/**
 * Get player by ID
 * @param {string} playerId - Player MongoDB ID
 * @returns {Promise<Player|null>}
 */
const getPlayerById = async (playerId) => {
  if (!playerId) return null;
  return await Player.findById(playerId);
};

/**
 * Get player by phone number
 * @param {string} phone - Phone number
 * @returns {Promise<Player|null>}
 */
const getPlayerByPhone = async (phone) => {
  if (!phone) return null;
  const formattedPhone = formatPhoneNumber(phone);
  return await Player.findOne({ phone: formattedPhone });
};

/**
 * Search players by name or phone
 * @param {string} searchTerm - Search term
 * @param {number} limit - Max results (default: 20)
 * @returns {Promise<Player[]>}
 */
const searchPlayers = async (searchTerm, limit = 20) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return await Player.find({ isActive: true })
      .sort({ name: 1 })
      .limit(limit);
  }
  
  const term = searchTerm.trim();
  return await Player.find({
    isActive: true,
    $or: [
      { name: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } }
    ]
  })
    .sort({ name: 1 })
    .limit(limit);
};

/**
 * Update player details
 * @param {string} playerId - Player ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Player>}
 */
const updatePlayer = async (playerId, updates) => {
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  // If phone is being updated, check for duplicates
  if (updates.phone) {
    const formattedPhone = formatPhoneNumber(updates.phone);
    const existingPlayer = await Player.findOne({ 
      phone: formattedPhone,
      _id: { $ne: playerId }
    });
    
    if (existingPlayer) {
      throw new Error('A player with this phone number already exists');
    }
    
    updates.phone = formattedPhone;
  }
  
  Object.assign(player, updates);
  await player.save();
  return player;
};

/**
 * Delete player (soft delete by setting isActive to false)
 * @param {string} playerId - Player ID
 * @returns {Promise<Player>}
 */
const deletePlayer = async (playerId) => {
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  player.isActive = false;
  await player.save();
  return player;
};

/**
 * Get all active players
 * @returns {Promise<Player[]>}
 */
const getAllPlayers = async () => {
  return await Player.find({ isActive: true }).sort({ name: 1 });
};

module.exports = {
  formatPhoneNumber,
  getOrCreatePlayer,
  getPlayerById,
  getPlayerByPhone,
  searchPlayers,
  updatePlayer,
  deletePlayer,
  getAllPlayers
};
