import React, { useEffect, useMemo, useState } from 'react';
import { createPlayer, getPlayers, sendWhatsAppMessage, getMessageHistory } from '../services/api';
import type { Player } from '../types';

const WhatsAppMessagingTab: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', phone: '', notes: '' });
  const [sendMode, setSendMode] = useState<'text' | 'template'>('text');
  const [message, setMessage] = useState('Hey team, please confirm availability for tomorrow’s match at 7:00 AM.');
  const [templateName, setTemplateName] = useState('mavericks_team_availability');
  const [templateLanguage, setTemplateLanguage] = useState('en');
  const [templateBodyParams, setTemplateBodyParams] = useState<string>('');
  const [matchDateTime, setMatchDateTime] = useState('Sunday, 2:00 PM. 11th Jan, 2026');
  const [matchVenue, setMatchVenue] = useState('Nityansh Cricket Ground');
  const [templateExpectedParams, setTemplateExpectedParams] = useState(3);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; attempted: number; results?: Array<{ playerId: string; name: string; phone: string; status: string; messageId?: string; timestamp?: string }> } | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [historyPlayer, setHistoryPlayer] = useState<Player | null>(null);
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const fetchHistory = async (player: Player) => {
    try {
      setLoadingHistory(true);
      setHistoryPlayer(player);
      const response = await getMessageHistory(player.phone);
      setHistoryMessages(response.data || []);
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
      interval = setInterval(async () => {
        try {
          const response = await getMessageHistory(historyPlayer.phone);
          setHistoryMessages(response.data || []);
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        }
      }, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
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
        // Special handling for mavericks_team_availability template
        if (templateName === 'mavericks_team_availability') {
          payload.template = {
            name: templateName.trim(),
            languageCode: templateLanguage.trim() || 'en',
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
        } else {
          // Fallback for other templates using the manual body parameters logic
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

          const components = bodyParams.length
            ? [
                {
                  type: 'body',
                  parameters: bodyParams,
                },
              ]
            : undefined;

          payload.template = {
            name: templateName.trim(),
            languageCode: templateLanguage.trim() || 'en_US',
            components,
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
          <h2 className="text-3xl font-bold" style={{ color: 'var(--primary-green)' }}>
            WhatsApp Messaging
          </h2>
          <p className="text-secondary">
            Manage recipients and send WhatsApp notifications directly from the dashboard.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
          <div className="card text-center px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-secondary">Total players</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.total}
            </p>
          </div>
          <div className="card text-center px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-secondary">Selected</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
                <p style={{ color: '#6b7280', margin: 0 }}>{historyPlayer.phone}</p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recipients
              </h3>
              <p className="text-secondary text-sm">
                Select which players should receive the next WhatsApp blast.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-tertiary text-sm"
                type="button"
                onClick={handleSelectAll}
                disabled={loading || players.length === 0}
              >
                Select all
              </button>
              <button
                className="btn btn-outline text-sm"
                type="button"
                onClick={handleClearSelection}
                disabled={selectedPlayers.length === 0}
              >
                Clear
              </button>
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={handleSendMessages}
                disabled={sending || loading || selectedPlayers.length === 0}
              >
                {sending ? 'Sending…' : `Send to ${selectedPlayers.length}`}
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
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player._id)}
                        onChange={() => toggleSelection(player._id)}
                        className="form-checkbox h-4 w-4"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-xs text-secondary">{player.phone}</p>
                      {player.notes && <p className="text-xs text-secondary mt-1">{player.notes}</p>}
                    </td>
                    <td className="py-3 pr-4 text-secondary">{player.createdAt ? new Date(player.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => fetchHistory(player)}
                        className="btn btn-tertiary text-xs"
                        style={{ padding: '4px 8px' }}
                      >
                        History
                      </button>
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
              Add Player
            </h3>
            <form className="space-y-4" onSubmit={handleAddPlayer}>
              <div>
                <label className="form-label text-sm">Name</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-control"
                  placeholder="Player name"
                />
              </div>
              <div>
                <label className="form-label text-sm">WhatsApp Number</label>
                <input
                  type="text"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer((prev) => ({ ...prev, phone: e.target.value }))}
                  className="form-control"
                  placeholder="+91 90000 00000"
                />
              </div>
              <div>
                <label className="form-label text-sm">Notes (optional)</label>
                <textarea
                  value={newPlayer.notes}
                  onChange={(e) => setNewPlayer((prev) => ({ ...prev, notes: e.target.value }))}
                  className="form-control"
                  rows={2}
                  placeholder="Opening batter, prefers morning matches, etc."
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Save player
              </button>
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
                <div className="space-y-3">
                  <div>
                    <label className="form-label text-sm">Template name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="hello_world"
                    />
                  </div>
                  <div>
                    <label className="form-label text-sm">Language code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={templateLanguage}
                      onChange={(e) => setTemplateLanguage(e.target.value)}
                      placeholder="en_US"
                    />
                  </div>
                  {templateName === 'mavericks_team_availability' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="form-label text-sm">Parameter 1: Player Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value="Auto-filled for each player"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Parameter 2: Match Time & Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={matchDateTime}
                          onChange={(e) => setMatchDateTime(e.target.value)}
                          placeholder="Sunday, 2:00 PM. 11th Jan, 2026"
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm">Parameter 3: Venue</label>
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
                </div>
              )}
            </div>
            <div className="mt-6 space-y-2 text-xs text-secondary">
              <p>Selected players: {selectedPlayers.length || players.length || 0}</p>
              <p>This action triggers an immediate WhatsApp API call—no cron involved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessagingTab;
