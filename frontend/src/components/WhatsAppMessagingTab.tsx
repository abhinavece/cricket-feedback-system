import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPlayer, getPlayers, sendWhatsAppMessage, getMessageHistory, updatePlayer, deletePlayer } from '../services/api';
import type { Player } from '../types';
import ConfirmDialog from './ConfirmDialog';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', phone: '', notes: '' });
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sendMode, setSendMode] = useState<'text' | 'template'>('text');
  const [message, setMessage] = useState('Hey team, please confirm availability for tomorrow’s match at 7:00 AM.');
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      await fetchPlayers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err?.response?.data?.error || 'Failed to delete player');
    }
  };

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

  useEffect(() => {
    fetchPlayers();
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
    if (sendMode === 'text' && !message.trim()) {
      setError('Message cannot be empty');
      return;
    }
    if (sendMode === 'template') {
      if (!templateName.trim()) {
        setError('Template name is required');
        return;
      }
      if (templateExpectedParams < 0) {
        setError('Template placeholder count cannot be negative');
        return;
      }
    }
    if (!selectedPlayers.length) {
      setError('Select at least one player before sending messages.');
      return;
    }
    const targets = selectedPlayers;

    try {
      setSending(true);
      setError(null);
      setSendResult(null);
      const payload: Parameters<typeof sendWhatsAppMessage>[0] = {
        playerIds: targets,
      };

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
                  { type: 'text', text: (matchDateTime.trim() || 'Sunday, 2:00 PM. 11th Jan, 2026') },
                  { type: 'text', text: (matchVenue.trim() || 'Nityansh Cricket Ground') }
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb'
          }}>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h3 className="h4 mb-1" style={{ color: '#111827', fontWeight: '700' }}>
                  Conversation with {historyPlayer.name}
                </h3>
                <div className="flex items-center gap-2">
                  <p style={{ color: '#6b7280', margin: 0 }}>{historyPlayer.phone}</p>
                  {lastSynced && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live • {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchHistory(historyPlayer)}
                  className="btn btn-tertiary text-xs"
                  style={{ padding: '6px 12px' }}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  onClick={() => setHistoryPlayer(null)}
                  style={{
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '20px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {loadingHistory ? (
                <div className="text-center py-8 text-secondary">Loading messages...</div>
              ) : historyMessages.length === 0 ? (
                <div className="text-center py-8 text-secondary">No messages found.</div>
              ) : (
                historyMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    alignSelf: msg.direction === 'incoming' ? 'flex-start' : 'flex-end',
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: msg.direction === 'incoming' ? '#ffffff' : 'var(--primary-green)',
                    color: msg.direction === 'incoming' ? '#111827' : '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: msg.direction === 'incoming' ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ fontSize: '15px' }}>{msg.text}</div>
                    <div style={{ 
                      fontSize: '11px', 
                      marginTop: '4px',
                      opacity: 0.8,
                      textAlign: 'right'
                    }}>
                      {new Date(msg.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 d-flex justify-content-end">
              <button 
                onClick={() => setHistoryPlayer(null)}
                className="btn btn-secondary"
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
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
              <button
                className="btn btn-tertiary text-xs md:text-sm h-11 md:h-auto"
                type="button"
                onClick={handleSelectAll}
                disabled={loading || players.length === 0}
              >
                Select all
              </button>
              <button
                className="btn btn-outline text-xs md:text-sm h-11 md:h-auto"
                type="button"
                onClick={handleClearSelection}
                disabled={selectedPlayers.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary uppercase text-xs tracking-wide">
                  <th className="py-3 pr-4">Select</th>
                  <th className="py-3 pr-4">Contact</th>
                  <th className="py-3 pr-4">Added</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-secondary">
                      Loading players…
                    </td>
                  </tr>
                ) : players.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-secondary">
                      No players added yet. Use the form on the right to add your first contact.
                    </td>
                  </tr>
                ) : (
                  players.map((player) => (
                    <tr
                    key={player._id}
                    className="border-t border-gray-700 hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center justify-center h-full min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player._id)}
                          onChange={() => toggleSelection(player._id)}
                          className="form-checkbox h-6 w-6 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-white text-base">{player.name}</p>
                      <p className="text-sm text-secondary">{player.phone}</p>
                      {player.notes && <p className="text-xs text-secondary mt-1 italic">{player.notes}</p>}
                    </td>
                    <td className="py-4 pr-4 text-secondary hidden md:table-cell">{player.createdAt ? new Date(player.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fetchHistory(player)}
                          className="btn btn-tertiary text-xs md:text-sm min-h-[40px] px-3"
                        >
                          History
                        </button>
                        <button
                          onClick={() => setEditingPlayer(player)}
                          className="btn btn-outline text-xs md:text-sm min-h-[40px] px-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPlayerToDelete(player)}
                          className="btn btn-outline text-xs md:text-sm min-h-[40px] px-3 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingPlayer ? 'Edit Player' : 'Add Player'}
            </h3>
            <form className="space-y-4" onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer}>
              <div>
                <label className="form-label text-sm">Name</label>
                <input
                  type="text"
                  value={editingPlayer ? editingPlayer.name : newPlayer.name}
                  onChange={(e) => editingPlayer 
                    ? setEditingPlayer(prev => prev ? ({ ...prev, name: e.target.value }) : null)
                    : setNewPlayer((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="form-control"
                  placeholder="Player name"
                />
              </div>
              <div>
                <label className="form-label text-sm">WhatsApp Number</label>
                <input
                  type="tel"
                  value={editingPlayer ? editingPlayer.phone : newPlayer.phone}
                  onChange={(e) => editingPlayer
                    ? setEditingPlayer(prev => prev ? ({ ...prev, phone: e.target.value }) : null)
                    : setNewPlayer((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="form-control"
                  placeholder="+91 90000 00000"
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="form-label text-sm">Notes (optional)</label>
                <textarea
                  value={editingPlayer ? (editingPlayer.notes || '') : newPlayer.notes}
                  onChange={(e) => editingPlayer
                    ? setEditingPlayer(prev => prev ? ({ ...prev, notes: e.target.value }) : null)
                    : setNewPlayer((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="form-control"
                  rows={2}
                  placeholder="Opening batter, prefers morning matches, etc."
                />
              </div>
              <div className="flex gap-2">
                {editingPlayer && (
                  <button 
                    type="button" 
                    className="btn btn-secondary flex-1"
                    onClick={() => setEditingPlayer(null)}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary flex-[2]" disabled={isUpdating}>
                  {editingPlayer ? (isUpdating ? 'Updating...' : 'Update Player') : 'Save player'}
                </button>
              </div>
            </form>
          </div>

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
                    value="text"
                    checked={sendMode === 'text'}
                    onChange={() => setSendMode('text')}
                  />
                  Text message
                </label>
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
              </div>

              {sendMode === 'text' ? (
                <div>
                  <p className="text-secondary text-sm">Message to send</p>
                  <textarea
                    className="form-control mt-2"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your WhatsApp message"
                  />
                </div>
              ) : (
                <div className="space-y-4">
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
                          onChange={(e) => setTemplateBodyParams(e.target.value)}
                          placeholder={'Abhinav\n7:00 AM'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Template Preview */}
                  {selectedTemplate.id !== 'custom' && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Live Preview</p>
                      <div className="bg-[#1f2c34] border border-gray-700/50 rounded-2xl p-4 overflow-hidden shadow-2xl relative">
                        {/* WhatsApp bubble tail effect (simplified) */}
                        <div className="absolute top-0 -left-1 w-0 h-0 border-t-[10px] border-t-[#1f2c34] border-l-[10px] border-l-transparent"></div>
                        
                        {selectedTemplate.header && (
                          <p className="text-[15px] font-bold text-white mb-2 leading-tight">
                            {selectedTemplate.header}
                          </p>
                        )}
                        <div className="text-[14.5px] text-[#e9edef] whitespace-pre-wrap leading-relaxed mb-1">
                          {selectedTemplate.format
                            .replace('{{1}}', players[0]?.name || 'Abhinav Singh')
                            .replace('{{2}}', matchDateTime || 'Sunday, 2:00 PM. 11th Jan, 2026')
                            .replace('{{3}}', matchVenue || 'Nityansh Cricket Ground')}
                        </div>
                        
                        {selectedTemplate.footer && (
                          <p className="text-[13px] text-[#8696a0] mt-2 mb-1">
                            {selectedTemplate.footer}
                          </p>
                        )}

                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-[11px] text-[#8696a0]">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                          <div className="mt-3 border-t border-[#2a3942] -mx-4">
                            {selectedTemplate.buttons.map((btn, i) => (
                              <div 
                                key={i} 
                                className={`w-full py-3 flex items-center justify-center gap-2 hover:bg-[#202c33] transition-colors cursor-default ${i !== 0 ? 'border-t border-[#2a3942]' : ''}`}
                              >
                                {btn === 'Yes' ? (
                                  <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                ) : btn === 'No' ? (
                                  <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                ) : null}
                                <span className="text-[#00a884] text-[15px] font-medium">{btn}</span>
                              </div>
                            ))}
                            <div className="w-full py-3 flex items-center justify-center gap-2 border-t border-[#2a3942]">
                              <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                              <span className="text-[#00a884] text-[15px] font-medium">See all options</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 space-y-4">
              <div className="relative group">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-help transition-colors hover:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">Recipients Selected</p>
                  </div>
                  <p className="text-sm font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/20">
                    {selectedPlayers.length}
                  </p>
                </div>
                
                {/* Hover Tooltip for Selected Players */}
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-60 overflow-y-auto">
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-3 pb-2 border-b border-gray-700 font-bold">
                    {selectedPlayers.length === 0 ? 'No players selected' : `Sending to ${selectedPlayers.length} players`}
                  </p>
                  <div className="space-y-2">
                    {selectedPlayers.length === 0 ? (
                      <p className="text-xs text-secondary italic">Select players from the table to send messages.</p>
                    ) : (
                      selectedPlayers.map(id => {
                        const player = players.find(p => p._id === id);
                        return player ? (
                          <div key={id} className="flex items-center justify-between text-xs">
                            <span className="text-white font-medium">{player.name}</span>
                            <span className="text-secondary tabular-nums">{player.phone}</span>
                          </div>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary w-full flex items-center justify-center gap-2 h-12 shadow-lg shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20 active:scale-[0.98]"
                onClick={handleSendMessages}
                disabled={sending || loading || selectedPlayers.length === 0}
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
