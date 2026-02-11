# Auction System — Future Enhancements Planning

This document tracks planned future enhancements for the CricSmart Auction system.

## Phase 2+ Enhancements

### 1. RTM (Right to Match) Feature
- **Description**: Allow previous team owners to match the winning bid for their players
- **Use Case**: IPL-style auction where original teams can retain players by matching highest bid
- **Implementation**: 
  - Add RTM flag to players
  - UI flow for RTM decision during bidding
  - Priority order for RTM claims
- **Dependencies**: Core auction system

### 2. Unsold Player Base Price Reduction
- **Description**: Admin can reduce base price for unsold players in subsequent rounds
- **Use Case**: Increase chances of selling players who went unsold at original price
- **Implementation**:
  - Per-player base price override
  - Admin UI to adjust prices between rounds
  - Clear indication of price reduction in UI
- **Dependencies**: Multi-round auction system

### 3. Built-in Spectator Chat
- **Description**: Real-time chat for spectators during live auction
- **Features**:
  - Public chat room
  - Emoji reactions
  - Admin moderation tools
  - Chat persistence during auction
- **Implementation**: Socket.IO chat events, chat history storage
- **Dependencies**: WebSocket infrastructure

### 4. YouTube Live API Integration
- **Description**: Direct integration with YouTube Live streaming
- **Features**:
  - Auto-create live broadcasts
  - Embed YouTube live chat
  - Stream key management
  - Analytics integration
- **Dependencies**: Google APIs setup, OAuth flow

### 5. PDF Player Import
- **Description**: Parse structured player data from PDF files
- **Challenge**: PDF parsing is less reliable than Excel/CSV
- **Solution**: Use PDF parsing libraries with manual validation step
- **Dependencies**: PDF parsing library, enhanced validation UI

### 6. Organization & Tournament Linkage
- **Description**: Connect auctions to existing organizations and tournaments
- **Features**:
  - Import teams from tournaments
  - Org-level admin inheritance
  - Tournament-branded auctions
  - Cross-auction analytics
- **Implementation**: 
  - Set `organizationId` and `tournamentId` fields
  - Integrate with existing auth middleware
  - Import/export tournament data
- **Dependencies**: Existing Organization and Tournament models

### 7. Retention Cost Configuration
- **Description**: Deduct configurable amount from team purse for each retained player
- **Implementation**:
  - Add `retentionCost` to auction config
  - Per-player retention cost override
  - Purse adjustment during team setup
- **Dependencies**: Retention system

### 8. Multiple Concurrent Auctions
- **Description**: Allow organizations to run multiple auctions simultaneously
- **Considerations**:
  - Separate WebSocket rooms per auction
  - Resource management
  - Admin workload distribution
- **Dependencies**: Single auction limitation removal

## Technical Debt & Improvements

### Performance Optimizations
- Implement Redis for real-time state caching
- Optimize WebSocket message payloads
- Add CDN support for player images
- Database query optimization for analytics

### Testing Enhancements
- Automated end-to-end testing for auction flow
- Load testing for concurrent connections
- Chaos engineering for WebSocket failures
- Performance benchmarking

### Monitoring & Observability
- Real-time auction health metrics
- WebSocket connection monitoring
- Performance dashboards
- Error tracking and alerting

## Implementation Priority

1. **High Priority**: RTM, Base Price Reduction, Organization Linkage
2. **Medium Priority**: Spectator Chat, YouTube API, Retention Cost
3. **Low Priority**: PDF Import, Multiple Auctions

---

*This document will be updated as requirements evolve and after each major release.*
