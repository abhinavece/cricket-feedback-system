/**
 * @fileoverview Auction Socket.IO Event Handlers
 * 
 * Manages WebSocket connections for the auction system.
 * Handles authentication (admin JWT, team JWT, public), room management,
 * and routes client events to the auction engine.
 * 
 * Namespace: /auction
 * Rooms: auction:{id}, team:{teamId}, admin:{auctionId}
 * 
 * @module services/auctionSocket
 */

const jwt = require('jsonwebtoken');
const Auction = require('../models/Auction');
const AuctionTeam = require('../models/AuctionTeam');
const User = require('../models/User');
const engine = require('./auctionEngine');

/**
 * Initialize the /auction Socket.IO namespace
 * @param {import('socket.io').Server} io
 */
function initAuctionSocket(io) {
  const ns = io.of('/auction');

  // Connection authentication middleware
  ns.use(async (socket, next) => {
    try {
      const { auctionId, token, teamToken } = socket.handshake.auth;

      if (!auctionId) {
        return next(new Error('auctionId is required'));
      }

      // Verify auction exists and is publicly viewable
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.isDeleted || !auction.isActive) {
        return next(new Error('Auction not found'));
      }

      socket.auctionId = auctionId;
      socket.auctionSlug = auction.slug;
      socket.role = 'spectator'; // default

      // Try admin auth (user JWT)
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.userId || decoded._id) {
            const userId = decoded.userId || decoded._id;
            const user = await User.findById(userId);
            if (user) {
              const adminEntry = auction.admins.find(a => a.userId.equals(user._id));
              if (adminEntry) {
                socket.role = 'admin';
                socket.userId = user._id.toString();
                socket.auctionRole = adminEntry.role;
              }
            }
          }
        } catch (err) {
          // Invalid user token — continue as spectator
        }
      }

      // Try team auth (team JWT)
      if (teamToken && socket.role === 'spectator') {
        try {
          const decoded = jwt.verify(teamToken, process.env.JWT_SECRET);
          if (decoded.teamId && decoded.auctionId === auctionId) {
            const team = await AuctionTeam.findById(decoded.teamId);
            if (team && team.isActive && team.auctionId.toString() === auctionId) {
              socket.role = 'team';
              socket.teamId = team._id.toString();
              socket.teamName = team.name;
              socket.teamShortName = team.shortName;
            }
          }
        } catch (err) {
          // Invalid team token — continue as spectator
        }
      }

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  ns.on('connection', (socket) => {
    const { auctionId, role, teamId } = socket;
    console.log(`[Auction Socket] ${role} connected to auction:${auctionId} (${socket.id})`);

    // Join auction room (everyone)
    socket.join(`auction:${auctionId}`);

    // Join role-specific rooms
    if (role === 'admin') {
      socket.join(`admin:${auctionId}`);
    }
    if (role === 'team' && teamId) {
      socket.join(`team:${teamId}`);
    }

    // Send current auction state on connect
    (async () => {
      try {
        const auction = await Auction.findById(auctionId);
        if (auction) {
          const state = await engine.buildAuctionState(auction);

          // Add team-private data if team role
          if (role === 'team' && teamId) {
            const team = await AuctionTeam.findById(teamId);
            if (team) {
              state.myTeam = {
                _id: team._id.toString(),
                name: team.name,
                shortName: team.shortName,
                purseRemaining: team.purseRemaining,
                maxBid: engine.calculateMaxBid(team, auction.config),
                squadSize: (team.players?.length || 0) + (team.retainedPlayers?.length || 0),
                canBid: team.purseRemaining >= auction.config.basePrice,
              };
            }
          }

          // Add admin-private data
          if (role === 'admin') {
            state.isAdmin = true;
            state.remainingPlayerCount = auction.remainingPlayerIds?.length || 0;
          }

          socket.emit('auction:state', state);
        }
      } catch (err) {
        console.error('Error sending initial state:', err);
      }
    })();

    // ---- TEAM EVENTS ----

    socket.on('team:bid', async (callback) => {
      if (role !== 'team' || !teamId) {
        const msg = 'Only team members can bid';
        if (typeof callback === 'function') return callback({ success: false, error: msg });
        return socket.emit('bid:rejected', { error: msg });
      }

      const result = await engine.processBid(auctionId, teamId, io);

      if (!result.success) {
        if (typeof callback === 'function') return callback(result);
        return socket.emit('bid:rejected', { error: result.error });
      }

      // Send updated team-private data
      const team = await AuctionTeam.findById(teamId);
      const auction = await Auction.findById(auctionId);
      if (team && auction) {
        ns.to(`team:${teamId}`).emit('team:update', {
          purseRemaining: team.purseRemaining,
          maxBid: engine.calculateMaxBid(team, auction.config),
          squadSize: (team.players?.length || 0) + (team.retainedPlayers?.length || 0),
          canBid: team.purseRemaining >= auction.config.basePrice,
        });
      }

      if (typeof callback === 'function') callback(result);
    });

    // ---- ADMIN EVENTS ----

    socket.on('admin:start', async (callback) => {
      if (role !== 'admin') {
        return typeof callback === 'function' && callback({ success: false, error: 'Admin only' });
      }
      try {
        await engine.startAuction(auctionId, io);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('admin:pause', async (data, callback) => {
      if (role !== 'admin') {
        return typeof callback === 'function' && callback({ success: false, error: 'Admin only' });
      }
      try {
        await engine.pauseAuction(auctionId, socket.userId, data?.reason, io);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('admin:resume', async (callback) => {
      if (role !== 'admin') {
        return typeof callback === 'function' && callback({ success: false, error: 'Admin only' });
      }
      try {
        await engine.resumeAuction(auctionId, socket.userId, io);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('admin:skip', async (callback) => {
      if (role !== 'admin') {
        return typeof callback === 'function' && callback({ success: false, error: 'Admin only' });
      }
      try {
        await engine.skipPlayer(auctionId, socket.userId, io);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('admin:next_player', async (callback) => {
      if (role !== 'admin') {
        return typeof callback === 'function' && callback({ success: false, error: 'Admin only' });
      }
      try {
        await engine.pickNextPlayer(auctionId, io);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('admin:complete', async (data, callback) => {
      if (role !== 'admin') {
        return typeof callback === 'function' && callback({ success: false, error: 'Admin only' });
      }
      try {
        await engine.completeAuction(auctionId, io, data?.reason || 'Ended by admin');
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('admin:announce', async (data, callback) => {
      if (role !== 'admin') {
        return typeof callback === 'function' && callback({ success: false, error: 'Admin only' });
      }
      if (!data?.message) {
        return typeof callback === 'function' && callback({ success: false, error: 'Message required' });
      }
      await engine.sendAnnouncement(auctionId, data.message, io);
      if (typeof callback === 'function') callback({ success: true });
    });

    // ---- CONNECTION MANAGEMENT ----

    socket.on('disconnect', () => {
      console.log(`[Auction Socket] ${role} disconnected from auction:${auctionId} (${socket.id})`);
    });
  });

  return ns;
}

module.exports = { initAuctionSocket };
