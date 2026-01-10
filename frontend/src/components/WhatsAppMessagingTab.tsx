import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPlayer, getPlayers, sendWhatsAppMessage, getMessageHistory, updatePlayer, deletePlayer, getUpcomingMatches, createMatch } from '../services/api';
import type { Player } from '../types';
import ConfirmDialog from './ConfirmDialog';
import MatchForm from './MatchForm';

interface TemplateConfig {
  id: string;
  name: string;
  label: string;
  format: string;
  expectedParams: number;
  language: string;
  header?: string;
  footer?: string;
  buttons?: string[];
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'mavericks_team_availability',
    name: 'mavericks_team_availability',
    label: 'Team Availability',
    header: 'Mavericks XI Team Availability',
    format: 'Hi {{1}},\n\nWe have an upcoming match scheduled at {{2}} on {{3}}.\n\nAre you available for the match?',
    footer: 'Select an option to confirm your availability',
    expectedParams: 3,
    language: 'en',
    buttons: ['Yes', 'No']
  },
  {
    id: 'custom',
    name: '',
    label: 'Custom Template',
    format: '',
    expectedParams: 0,
    language: 'en_US'
  }
];

const WhatsAppMessagingTab: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', phone: '', notes: '' });
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sendMode, setSendMode] = useState<'text' | 'template'>('template');
  const [message, setMessage] = useState('Hey team, please confirm availability for tomorrow\'s match at 7:00 AM.');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(TEMPLATES[0]);
  const [templateName, setTemplateName] = useState(TEMPLATES[0].name);
  const [templateLanguage, setTemplateLanguage] = useState(TEMPLATES[0].language);
  const [templateBodyParams, setTemplateBodyParams] = useState<string>('');
  const [matchDateTime, setMatchDateTime] = useState('');
  const [matchVenue, setMatchVenue] = useState('');
  const [templateExpectedParams, setTemplateExpectedParams] = useState(TEMPLATES[0].expectedParams);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; attempted: number; results?: Array<{ playerId: string; name: string; phone: string; status: string; messageId?: string; timestamp?: string }> } | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [historyPlayer, setHistoryPlayer] = useState<Player | null>(null);
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [historyNewMessage, setHistoryNewMessage] = useState('');
  const [sendingHistoryMessage, setSendingHistoryMessage] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to auto-capitalize text like WhatsApp
  const autoCapitalize = (text: string): string => {
    if (!text) return text;
    
    // Capitalize first character
    let result = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Find all instances of period followed by space and a letter, and capitalize that letter
    result = result.replace(/\. ([a-z])/g, (match) => `. ${match.charAt(2).toUpperCase()}`);
    
    return result;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [historyMessages]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPlayers();
      setPlayers(response);
    } catch (err) {
      console.error(err);
      setError('Failed to load players. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await getUpcomingMatches();
      setMatches(response);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleCreateMatch = async (matchData: any) => {
    try {
      setCreatingMatch(true);
      const newMatch = await createMatch(matchData);
      await fetchMatches(); // Refresh matches list
      setSelectedMatch(newMatch); // Auto-select the newly created match
      
      // Auto-fill match details in the form
      const matchDate = new Date(newMatch.date);
      const timeStr = newMatch.time || matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setMatchDateTime(`${matchDate.toLocaleDateString()} ${timeStr}`);
      setMatchVenue(newMatch.ground || '');
      
      setShowMatchForm(false);
      setSuccess('Match created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create match:', err);
      setError('Failed to create match. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleUpdatePlayer = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('handleUpdatePlayer called', { editingPlayer });
    if (!editingPlayer) return;
    if (!editingPlayer.name.trim() || !editingPlayer.phone.trim()) {
      setError('Name and WhatsApp number are required.');
      return;
    }
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);
      console.log('Sending update request for player:', editingPlayer._id);
      await updatePlayer(editingPlayer._id, {
        name: editingPlayer.name.trim(),
        phone: editingPlayer.phone.trim(),
        notes: editingPlayer.notes?.trim() || undefined,
      });
      console.log('Update successful');
      setSuccess('Player updated successfully');
      setEditingPlayer(null);
      await fetchPlayers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Update failed:', err);
      setError(err?.response?.data?.error || 'Failed to update player');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePlayer = async () => {
    console.log('handleDeletePlayer called', { playerToDelete });
    if (!playerToDelete) return;
    try {
      setError(null);
      setSuccess(null);
      console.log('Sending delete request for player:', playerToDelete._id);
      await deletePlayer(playerToDelete._id);
      console.log('Delete successful');
      setSuccess('Player deleted successfully');
      setPlayerToDelete(null);
      // Remove from selection if it was selected
      setSelectedPlayers(prev => prev.filter(id => id !== playerToDelete._id));
      await fetchPlayers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err?.response?.data?.error || 'Failed to delete player');
    }
  };

  // Single player deletion only

  const fetchHistory = async (player: Player) => {
    try {
      setLoadingHistory(true);
      setHistoryPlayer(player);
      const response = await getMessageHistory(player.phone);
      setHistoryMessages(response.data || []);
      setLastSynced(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to load message history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Auto-refresh history when modal is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (historyPlayer) {
      console.log(`Setting up polling for ${historyPlayer.phone}`);
      interval = setInterval(async () => {
        try {
          const response = await getMessageHistory(historyPlayer.phone);
          if (response.success && response.data) {
            setHistoryMessages(response.data);
            setLastSynced(new Date());
          }
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        }
      }, 3000); // Refresh every 3 seconds
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [historyPlayer]);

  const handleSendHistoryMessage = async () => {
    if (!historyNewMessage.trim() || !historyPlayer) return;
    
    try {
      setSendingHistoryMessage(true);
      await sendWhatsAppMessage({
        playerIds: [historyPlayer._id],
        message: historyNewMessage.trim(),
        previewUrl: false
      });
      setHistoryNewMessage('');
      // Polling will update the UI
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to send message');
    } finally {
      setSendingHistoryMessage(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  const stats = useMemo(() => {
    const total = players.length;
    const selected = selectedPlayers.length;
    return { total, selected };
  }, [players, selectedPlayers]);

  const toggleSelection = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((playerId) => playerId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (players.length === 0) return;
    const allIds = players.map((player) => player._id);
    setSelectedPlayers(allIds);
  };

  const handleClearSelection = () => {
    setSelectedPlayers([]);
  };

  const handleAddPlayer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPlayer.name.trim() || !newPlayer.phone.trim()) {
      setError('Name and WhatsApp number are required.');
      return;
    }
    try {
      setError(null);
      await createPlayer({
        name: newPlayer.name.trim(),
        phone: newPlayer.phone.trim(),
        notes: newPlayer.notes.trim() || undefined,
      });
      setNewPlayer({ name: '', phone: '', notes: '' });
      await fetchPlayers();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to save player');
    }
  };

  const handleSendMessages = async () => {
    // Basic validation
    if (!selectedPlayers.length) {
      setError('Please select at least one player to receive the message.');
      return;
    }

    if (sendMode === 'text') {
      if (!message.trim()) {
        setError('Message content cannot be empty.');
        return;
      }
    } else {
      // Validate match selection for template messages
      if (!selectedMatch) {
        setError('Please select a match for availability tracking.');
        return;
      }
      
      if (selectedTemplate.id === 'mavericks_team_availability') {
        if (!matchDateTime.trim() || !matchVenue.trim()) {
          setError('Please provide both Match Time and Venue details for the template.');
          return;
        }
      } else if (selectedTemplate.id === 'custom') {
        if (!templateName.trim()) {
          setError('Template name is required for custom templates.');
          return;
        }
      }
    }

    const targets = selectedPlayers;
    try {
      setSending(true);
      setError(null);
      setSendResult(null);
      const payload: Parameters<typeof sendWhatsAppMessage>[0] = {
        playerIds: targets,
      };

      // Add match context if match is selected
      if (selectedMatch) {
        payload.matchId = selectedMatch._id;
        payload.matchTitle = selectedMatch.opponent || 'Practice Match';
      }

      if (sendMode === 'text') {
        payload.message = message.trim();
        payload.previewUrl = false;
      } else {
        // Use selected template config
        if (selectedTemplate.id === 'mavericks_team_availability') {
          payload.template = {
            name: selectedTemplate.name,
            languageCode: templateLanguage.trim() || selectedTemplate.language,
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: '{{PLAYER_NAME}}' }, // Backend will replace this
                  { type: 'text', text: matchDateTime.trim() },
                  { type: 'text', text: matchVenue.trim() }
                ]
              }
            ]
          };
        } else if (selectedTemplate.id === 'custom') {
          const bodyParams = templateBodyParams
            .split('\n')
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((text: string) => ({
              type: 'text',
              text,
            }));

          if (bodyParams.length !== templateExpectedParams) {
            setError(
              `Template expects ${templateExpectedParams} placeholder${
                templateExpectedParams === 1 ? '' : 's'
              } but you provided ${bodyParams.length}.`
            );
            return;
          }

          payload.template = {
            name: templateName.trim(),
            languageCode: templateLanguage.trim() || 'en_US',
            components: bodyParams.length ? [{ type: 'body', parameters: bodyParams }] : undefined,
          };
        }
      }

      const response = await sendWhatsAppMessage(payload);
      setSendResult(response?.data || null);
      setShowAlert(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to trigger WhatsApp messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="hidden md:flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--primary-green)' }}>
            WhatsApp Messaging
          </h2>
          <p className="text-secondary text-sm md:text-base">
            Manage recipients and send WhatsApp notifications directly from the dashboard.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
          <div className="card text-center px-4 py-3 min-h-[80px] flex flex-col justify-center">
            <p className="text-[10px] md:text-xs uppercase tracking-wide text-secondary">Total players</p>
            <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.total}
            </p>
          </div>
          <div className="card text-center px-4 py-3 min-h-[80px] flex flex-col justify-center">
            <p className="text-[10px] md:text-xs uppercase tracking-wide text-secondary">Selected</p>
            <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.selected}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: Merged stats bar */}
      <div className="md:hidden card px-4 py-3 flex items-center justify-center gap-8">
        <div className="flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-wide text-secondary">Total</p>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.total}
          </p>
        </div>
        <div className="w-px h-12 bg-white/10"></div>
        <div className="flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-wide text-secondary">Selected</p>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.selected}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {success}
        </div>
      )}

      {sendResult && showAlert && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '650px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <style>
              {`
                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
              `}
            </style>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h3 className="h4 mb-2" style={{ 
                  color: sendResult.failed === 0 ? '#059669' : '#d97706',
                  fontSize: '24px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {sendResult.failed === 0 ? (
                    <>
                      <span style={{ fontSize: '28px' }}>✅</span>
                      Messages Sent Successfully!
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '28px' }}>⚠️</span>
                      Partial Success
                    </>
                  )}
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  margin: 0,
                  fontSize: '16px'
                }}>
                  {sendResult.sent} of {sendResult.attempted} messages delivered successfully
                </p>
              </div>
              <button 
                onClick={() => setShowAlert(false)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e: any) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.color = '#374151';
                }}
                onMouseOut={(e: any) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>
            
            {sendResult.results && sendResult.results.length > 0 && (
              <div>
                <h5 style={{ 
                  color: '#111827', 
                  marginBottom: '20px',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Message Delivery Details
                </h5>
                <div style={{ 
                  maxHeight: '350px', 
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {sendResult.results.map((result, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      marginBottom: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: `2px solid ${result.status === 'sent' ? '#10b981' : '#ef4444'}`,
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#111827',
                          fontSize: '16px',
                          marginBottom: '4px'
                        }}>
                          {result.name}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          📱 {result.phone}
                        </div>
                      </div>
                      <div className="text-end">
                        <span style={{
                          padding: '6px 16px',
                          borderRadius: '24px',
                          fontSize: '13px',
                          fontWeight: '700',
                          backgroundColor: result.status === 'sent' ? '#10b981' : '#ef4444',
                          color: 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}>
                          {result.status === 'sent' ? '✓' : '✗'} {result.status === 'sent' ? 'Sent' : 'Failed'}
                        </span>
                        {result.messageId && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#9ca3af', 
                            marginTop: '6px',
                            fontFamily: 'monospace'
                          }}>
                            ID: {result.messageId.slice(0, 10)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-5 d-flex justify-content-end gap-3">
              <button 
                onClick={() => setShowAlert(false)}
                style={{
                  backgroundColor: '#6b7280',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e: any) => {
                  e.target.style.backgroundColor = '#4b5563';
                }}
                onMouseOut={(e: any) => {
                  e.target.style.backgroundColor = '#6b7280';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message History Modal */}
      {historyPlayer && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 md:items-center md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95 md:duration-300" style={{ maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}>
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#128C7E]/10 flex items-center justify-center text-[#128C7E] shrink-0">
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.47 0-2.84-.39-4.03-1.06l-.29-.17-3.99 1.17 1.19-3.89-.18-.3C4.05 14.56 3.65 13.32 3.65 12c0-4.61 3.74-8.35 8.35-8.35s8.35 3.74 8.35 8.35-3.74 8.35-8.35 8.35z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                    {historyPlayer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-medium tabular-nums">{historyPlayer.phone}</span>
                    {lastSynced && (
                      <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchHistory(historyPlayer)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                  title="Refresh conversation"
                  disabled={loadingHistory}
                >
                  <svg className={`w-5 h-5 ${loadingHistory ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button 
                  onClick={() => setHistoryPlayer(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#efe7de] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" style={{ maxHeight: 'calc(100vh - 200px - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}>
              {loadingHistory && historyMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-8 h-8 border-3 border-[#128C7E]/20 border-t-[#128C7E] rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-gray-500">Loading conversation...</p>
                </div>
              ) : historyMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No messages yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {historyMessages.map((msg, idx) => {
                    const isIncoming = msg.direction === 'incoming';
                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'} max-w-[85%] ${isIncoming ? 'self-start' : 'self-end'}`}
                      >
                        <div className={`relative px-3 py-2 md:px-4 md:py-2.5 rounded-2xl shadow-sm text-[14px] md:text-[15px] leading-relaxed ${
                          isIncoming 
                            ? 'bg-white text-gray-800 rounded-tl-none' 
                            : 'bg-[#dcf8c6] text-gray-800 rounded-tr-none'
                        }`}>
                          {/* Chat bubble tail effect */}
                          <div className={`absolute top-0 w-0 h-0 border-t-[10px] ${
                            isIncoming 
                              ? '-left-2 border-t-white border-l-[10px] border-l-transparent' 
                              : '-right-2 border-t-[#dcf8c6] border-r-[10px] border-r-transparent'
                          }`}></div>
                          
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                          
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] opacity-50 font-medium tabular-nums">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isIncoming && (
                              <span className="text-sky-500">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              )}
            </div>

            {/* Modal Footer - WhatsApp Input Style */}
            <div className="p-2 bg-[#f0f2f5] border-t border-gray-200 flex items-center gap-2 shrink-0">              
              {/* Text Input */}
              <div className="flex-1 relative min-w-0">
                <textarea
                  value={historyNewMessage}
                  onChange={(e) => setHistoryNewMessage(autoCapitalize(e.target.value))}
                  placeholder="Type a message"
                  className="w-full bg-white rounded-full py-2 px-4 text-sm text-gray-800 focus:outline-none border-none shadow-sm resize-none max-h-24 min-h-[40px] overflow-hidden"
                  rows={1}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflowY: 'auto'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendHistoryMessage();
                    }
                  }}
                />
              </div>
              
              {/* Send Button */}
              <button
                onClick={handleSendHistoryMessage}
                disabled={!historyNewMessage.trim() || sendingHistoryMessage}
                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center shrink-0 ${
                  sendingHistoryMessage
                    ? 'bg-gray-300 text-white cursor-not-allowed'
                    : 'bg-[#00a884] text-white hover:bg-[#008f72] active:scale-95 shadow-md'
                }`}
              >
                {sendingHistoryMessage ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setHistoryPlayer(null)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recipients
              </h3>
              <p className="text-secondary text-xs md:text-sm">
                Select players for the next WhatsApp blast.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  type="button"
                  onClick={handleSelectAll}
                  disabled={loading || players.length === 0}
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Select all
                </button>
                {selectedPlayers.length > 0 && (
                  <button
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                    type="button"
                    onClick={handleClearSelection}
                  >
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                {selectedPlayers.length === 1 && (
                  <>
                    <button
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                      type="button"
                      onClick={() => {
                        const player = players.find(p => p._id === selectedPlayers[0]);
                        if (player) {
                          setEditingPlayer(player);
                          setShowPlayerModal(true);
                        }
                      }}
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition-colors"
                      type="button"
                      onClick={() => {
                        const player = players.find(p => p._id === selectedPlayers[0]);
                        if (player) setPlayerToDelete(player);
                      }}
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
                <button
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-[#128C7E] text-white hover:bg-[#075E54] transition-colors shadow-sm"
                  type="button"
                  onClick={() => {
                    setEditingPlayer(null);
                    setNewPlayer({ name: '', phone: '', notes: '' });
                    setShowPlayerModal(true);
                  }}
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Player
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-full overflow-hidden">
              {/* Desktop view - Table */}
              <table className="min-w-full text-sm hidden md:table">
                <thead>
                  <tr className="text-left text-secondary uppercase text-xs tracking-wide">
                    <th className="py-3 pr-4">Contact</th>
                    <th className="py-3 pr-4">Details</th>
                    <th className="py-3 pr-4">Added</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-secondary">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                          <p>Loading players...</p>
                        </div>
                      </td>
                    </tr>
                  ) : players.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-secondary">
                        <p>No players found. Add your first player to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    players.map(player => (
                    <tr
                      key={player._id}
                      className="border-t border-gray-700 hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium text-base">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-base">{player.name}</p>
                            <p className="text-sm text-secondary">{player.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-secondary">
                        {player.notes ? (
                          <p className="text-xs text-secondary italic">{player.notes}</p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No notes</p>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-secondary">{player.createdAt ? new Date(player.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="py-4 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchHistory(player)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#128C7E] text-white rounded-lg hover:bg-[#075E54] transition-all active:scale-95 text-sm font-medium shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.47 0-2.84-.39-4.03-1.06l-.29-.17-3.99 1.17 1.19-3.89-.18-.3C4.05 14.56 3.65 13.32 3.65 12c0-4.61 3.74-8.35 8.35-8.35s8.35 3.74 8.35 8.35-3.74 8.35-8.35 8.35z"/>
                            </svg>
                            Chat
                          </button>
                          <button
                            onClick={() => {
                              setEditingPlayer(player);
                              setShowPlayerModal(true);
                            }}
                            className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all active:scale-95 text-sm shadow-sm"
                            title="Edit player"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Mobile view - Card list */}
              <div className="md:hidden space-y-3">
                {loading ? (
                  <div className="py-8 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                      <p>Loading players...</p>
                    </div>
                  </div>
                ) : players.length === 0 ? (
                  <div className="py-8 text-center text-secondary">
                    <p>No players found. Add your first player to get started.</p>
                  </div>
                ) : (
                  players.map(player => (
                    <div 
                      key={player._id}
                      className="border border-gray-700 rounded-xl p-3 bg-gray-800/20 hover:bg-gray-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium text-base shrink-0">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-base truncate">{player.name}</p>
                          <p className="text-sm text-secondary truncate">{player.phone}</p>
                        </div>
                      </div>
                      
                      {player.notes && (
                        <div className="px-3 py-1.5 bg-gray-800/40 rounded-lg mb-3">
                          <p className="text-xs text-secondary italic">{player.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {player.createdAt ? new Date(player.createdAt).toLocaleDateString() : '—'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingPlayer(player);
                              setShowPlayerModal(true);
                            }}
                            className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all active:scale-95 text-sm shadow-sm"
                            title="Edit player"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => fetchHistory(player)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#128C7E] text-white rounded-lg hover:bg-[#075E54] transition-all active:scale-95 text-sm font-medium shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.47 0-2.84-.39-4.03-1.06l-.29-.17-3.99 1.17 1.19-3.89-.18-.3C4.05 14.56 3.65 13.32 3.65 12c0-4.61 3.74-8.35 8.35-8.35s8.35 3.74 8.35 8.35-3.74 8.35-8.35 8.35z"/>
                            </svg>
                            Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          <div className="card">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Message settings
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMode"
                    value="template"
                    checked={sendMode === 'template'}
                    onChange={() => setSendMode('template')}
                  />
                  Template message
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMode"
                    value="text"
                    checked={sendMode === 'text'}
                    onChange={() => setSendMode('text')}
                  />
                  Text message
                </label>
              </div>

              {sendMode === 'text' ? (
                <div>
                  <p className="text-secondary text-sm">Message to send</p>
                  <textarea
                    className="form-control mt-2"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(autoCapitalize(e.target.value))}
                    placeholder="Type your WhatsApp message"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Match Selection */}
                  <div>
                    <label className="form-label text-sm flex items-center gap-2">
                      <span>Select Match</span>
                      <span className="text-xs text-gray-500">(Required for availability tracking)</span>
                    </label>
                    <select
                      className="form-control"
                      value={selectedMatch?._id || ''}
                      onChange={(e) => {
                        if (e.target.value === 'create-new') {
                          setShowMatchForm(true);
                          return;
                        }
                        const match = matches.find(m => m._id === e.target.value);
                        setSelectedMatch(match || null);
                        if (match) {
                          // Auto-fill match details
                          const matchDate = new Date(match.date);
                          const timeStr = match.time || matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          setMatchDateTime(`${matchDate.toLocaleDateString()} ${timeStr}`);
                          setMatchVenue(match.ground || '');
                        }
                      }}
                    >
                      <option value="">-- Select a match --</option>
                      <option value="create-new" className="font-semibold text-green-600 bg-green-50">+ Create a new match</option>
                      {loadingMatches ? (
                        <option disabled>Loading matches...</option>
                      ) : matches.length === 0 ? (
                        <option disabled>No upcoming matches</option>
                      ) : (
                        matches.map(match => {
                          const matchDate = new Date(match.date);
                          const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const opponent = match.opponent || 'Practice Match';
                          return (
                            <option key={match._id} value={match._id}>
                              {dateStr} - {opponent} @ {match.ground}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {selectedMatch && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm">
                          <p className="font-semibold text-blue-900">
                            {selectedMatch.opponent || 'Practice Match'}
                          </p>
                          <p className="text-blue-700">
                            📅 {new Date(selectedMatch.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-blue-700">
                            📍 {selectedMatch.ground}
                          </p>
                          {selectedMatch.time && (
                            <p className="text-blue-700">
                              ⏰ {selectedMatch.time}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label text-sm">Select Template</label>
                    <select
                      className="form-control"
                      value={selectedTemplate.id}
                      onChange={(e) => {
                        const template = TEMPLATES.find(t => t.id === e.target.value) || TEMPLATES[0];
                        setSelectedTemplate(template);
                        setTemplateName(template.name);
                        setTemplateLanguage(template.language);
                        setTemplateExpectedParams(template.expectedParams);
                      }}
                    >
                      {TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTemplate.id === 'custom' && (
                    <div className="space-y-3">
                      <div>
                        <label className="form-label text-sm">Template Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g., hello_world"
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Language Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={templateLanguage}
                          onChange={(e) => setTemplateLanguage(e.target.value)}
                          placeholder="e.g., en_US"
                        />
                      </div>
                    </div>
                  )}

                  {selectedTemplate.id === 'mavericks_team_availability' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="form-label text-sm">Match Time & Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={matchDateTime}
                          onChange={(e) => setMatchDateTime(e.target.value)}
                          placeholder="Sunday, 2:00 PM. 11th Jan, 2026"
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Venue</label>
                        <input
                          type="text"
                          className="form-control"
                          value={matchVenue}
                          onChange={(e) => setMatchVenue(e.target.value)}
                          placeholder="Nityansh Cricket Ground"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="form-label text-sm">Body placeholder count</label>
                        <input
                          type="number"
                          min={0}
                          className="form-control"
                          value={templateExpectedParams}
                          onChange={(e) => setTemplateExpectedParams(Math.max(0, Number(e.target.value) || 0))}
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">
                          Body parameters <span className="text-xs text-secondary">(one per line)</span>
                        </label>
                        <textarea
                          className="form-control mt-2"
                          rows={4}
                          value={templateBodyParams}
                          onChange={(e) => setTemplateBodyParams(autoCapitalize(e.target.value))}
                          placeholder={'Abhinav\n7:00 AM'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Template Preview */}
                  {selectedTemplate.id !== 'custom' && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-3">Live Preview</p>
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-700/50">
                        {/* WhatsApp-like Background */}
                        <div className="p-4 md:p-6 bg-[#efe7de] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat min-h-[200px] flex flex-col justify-center">
                          
                          <div className="flex flex-col items-end max-w-[90%] self-end">
                            <div className="relative px-3 py-2 md:px-4 md:py-2.5 rounded-2xl shadow-sm text-[14px] md:text-[15px] leading-relaxed bg-[#dcf8c6] text-gray-800 rounded-tr-none">
                              {/* Chat bubble tail */}
                              <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#dcf8c6] border-r-[10px] border-r-transparent"></div>
                              
                              {selectedTemplate.header && (
                                <p className="text-[14px] font-bold text-gray-900 mb-1 leading-tight border-b border-black/5 pb-1">
                                  {selectedTemplate.header}
                                </p>
                              )}
                              
                              <div className="whitespace-pre-wrap">
                                {selectedTemplate.format
                                  .replace('{{1}}', players[0]?.name || 'Abhinav Singh')
                                  .replace('{{2}}', matchDateTime || 'Sunday, 2:00 PM. 11th Jan, 2026')
                                  .replace('{{3}}', matchVenue || 'Nityansh Cricket Ground')}
                              </div>
                              
                              {selectedTemplate.footer && (
                                <p className="text-[12px] text-gray-500 mt-2 italic border-t border-black/5 pt-1">
                                  {selectedTemplate.footer}
                                </p>
                              )}

                              <div className="flex justify-end items-center gap-1 mt-1">
                                <span className="text-[10px] opacity-50 font-medium tabular-nums text-gray-600">
                                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-sky-500">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                                  </svg>
                                </span>
                              </div>
                            </div>

                            {/* Buttons Preview */}
                            {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                              <div className="mt-2 w-full space-y-1">
                                {selectedTemplate.buttons.map((btn, i) => (
                                  <div 
                                    key={i} 
                                    className="bg-white rounded-xl py-2 flex items-center justify-center gap-2 shadow-sm border border-gray-200/50"
                                  >
                                    <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    <span className="text-sky-500 text-sm font-semibold">{btn}</span>
                                  </div>
                                ))}
                                <div className="bg-white rounded-xl py-2 flex items-center justify-center gap-2 shadow-sm border border-gray-200/50">
                                  <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                  </svg>
                                  <span className="text-sky-500 text-sm font-semibold">See all options</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 space-y-4">
              {/* Player Selection Section */}
              <div className="border border-gray-700/50 rounded-xl overflow-hidden">
                <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#128C7E]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.47 0-2.84-.39-4.03-1.06l-.29-.17-3.99 1.17 1.19-3.89-.18-.3C4.05 14.56 3.65 13.32 3.65 12c0-4.61 3.74-8.35 8.35-8.35s8.35 3.74 8.35 8.35-3.74 8.35-8.35 8.35z"/>
                    </svg>
                    <h4 className="font-medium text-white">Select Recipients</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                      onClick={handleSelectAll}
                      disabled={loading || players.length === 0}
                    >
                      Select all
                    </button>
                    {selectedPlayers.length > 0 && (
                      <button 
                        className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                        onClick={handleClearSelection}
                      >
                        Clear
                      </button>
                    )}
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#128C7E] text-white text-xs font-bold">
                      {selectedPlayers.length}
                    </span>
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto p-2 bg-gray-900/30">
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="w-5 h-5 border-2 border-gray-600 border-t-[#128C7E] rounded-full animate-spin"></div>
                    </div>
                  ) : players.length === 0 ? (
                    <div className="text-center p-4 text-sm text-gray-400">
                      No players available. Add players to send messages.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Selected players section */}
                      {selectedPlayers.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#128C7E]"></div>
                            <p className="text-xs uppercase tracking-wider text-[#128C7E] font-medium">Selected Players</p>
                          </div>
                          <div className="space-y-1.5">
                            {selectedPlayers.map(id => {
                              const player = players.find(p => p._id === id);
                              return player ? (
                                <div 
                                  key={`selected-${player._id}`}
                                  className="flex items-center p-2 rounded-lg cursor-pointer transition-colors bg-[#128C7E]/20 border border-[#128C7E]/30"
                                  onClick={() => toggleSelection(player._id)}
                                >
                                  <div className="flex-shrink-0 mr-2">
                                    <div className="w-8 h-8 rounded-full bg-[#128C7E]/30 flex items-center justify-center text-white font-medium text-sm">
                                      {player.name.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{player.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{player.phone}</p>
                                  </div>
                                  <div className="ml-2">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#128C7E]">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                          <div className="h-px bg-gray-700/50 my-3"></div>
                        </div>
                      )}
                      
                      {/* Available players section */}
                      <div>
                        {selectedPlayers.length > 0 && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Other Players</p>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          {players
                            .filter(player => !selectedPlayers.includes(player._id))
                            .map(player => (
                              <div 
                                key={player._id}
                                className="flex items-center p-2 rounded-lg cursor-pointer transition-colors bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50"
                                onClick={() => toggleSelection(player._id)}
                              >
                                <div className="flex-shrink-0 mr-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium text-sm">
                                    {player.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{player.name}</p>
                                  <p className="text-xs text-gray-400 truncate">{player.phone}</p>
                                </div>
                                <div className="ml-2">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center border border-gray-600">
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Validation Prompt */}
              {(!selectedPlayers.length || (sendMode === 'template' && (!selectedMatch || (selectedTemplate.id === 'mavericks_team_availability' && (!matchDateTime.trim() || !matchVenue.trim()))))) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-tight mb-1">Ready to send?</p>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      {!selectedPlayers.length 
                        ? "Select at least one recipient from the list above to continue." 
                        : !selectedMatch && sendMode === 'template'
                        ? "Please select a match for availability tracking."
                        : "Please fill in the Match Time and Venue details to complete the template."}
                    </p>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary w-full flex items-center justify-center gap-2 h-12 shadow-lg shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                onClick={handleSendMessages}
                disabled={sending || loading || selectedPlayers.length === 0 || (sendMode === 'template' && (!selectedMatch || (selectedTemplate.id === 'mavericks_team_availability' && (!matchDateTime.trim() || !matchVenue.trim()))))}
              >
                {sending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send to {selectedPlayers.length} Players
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-secondary/60 italic">
                Immediate WhatsApp API trigger • No cron job scheduled
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Player Add/Edit Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPlayer ? 'Edit Player' : 'Add New Player'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {editingPlayer ? 'Update player details' : 'Add a new player to your contacts'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowPlayerModal(false);
                  setEditingPlayer(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              <form className="space-y-5" onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Player Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={editingPlayer ? editingPlayer.name : newPlayer.name}
                      onChange={(e) => {
                        const capitalizedValue = autoCapitalize(e.target.value);
                        editingPlayer 
                          ? setEditingPlayer(prev => prev ? ({ ...prev, name: capitalizedValue }) : null)
                          : setNewPlayer((prev) => ({ ...prev, name: capitalizedValue }));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#128C7E] dark:focus:ring-[#075E54] focus:border-transparent transition-colors"
                      placeholder="Enter player name"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">WhatsApp Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={editingPlayer ? editingPlayer.phone : newPlayer.phone}
                      onChange={(e) => editingPlayer
                        ? setEditingPlayer(prev => prev ? ({ ...prev, phone: e.target.value }) : null)
                        : setNewPlayer((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#128C7E] dark:focus:ring-[#075E54] focus:border-transparent transition-colors"
                      placeholder="+91 90000 00000"
                      inputMode="tel"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <textarea
                      value={editingPlayer ? (editingPlayer.notes || '') : newPlayer.notes}
                      onChange={(e) => {
                        const capitalizedValue = autoCapitalize(e.target.value);
                        editingPlayer
                          ? setEditingPlayer(prev => prev ? ({ ...prev, notes: capitalizedValue }) : null)
                          : setNewPlayer(prev => ({ ...prev, notes: capitalizedValue }));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#128C7E] dark:focus:ring-[#075E54] focus:border-transparent transition-colors resize-none"
                      rows={3}
                      placeholder="Opening batter, prefers morning matches, etc."
                    />
                  </div>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                onClick={() => {
                  setShowPlayerModal(false);
                  setEditingPlayer(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-white bg-[#128C7E] hover:bg-[#075E54] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] transition-colors flex items-center gap-1.5 shadow-sm"
                onClick={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {editingPlayer ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {editingPlayer ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      )}
                    </svg>
                    {editingPlayer ? 'Update Player' : 'Add Player'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Creation Modal */}
      {showMatchForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Match</h2>
                <button
                  onClick={() => setShowMatchForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <MatchForm
                mode="create"
                onSubmit={handleCreateMatch}
                onCancel={() => setShowMatchForm(false)}
                loading={creatingMatch}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!playerToDelete}
        title="Delete Player"
        message={`Are you sure you want to delete ${playerToDelete?.name}? this will remove them from the messaging list.`}
        onConfirm={handleDeletePlayer}
        onCancel={() => setPlayerToDelete(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default WhatsAppMessagingTab;
