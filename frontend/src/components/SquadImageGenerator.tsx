import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Send, X, CheckCircle, AlertCircle, XCircle, Calendar, Clock, MapPin, Trophy, Users, Loader2 } from 'lucide-react';

interface Player {
  _id: string;
  playerName: string;
  playerPhone: string;
  response: 'yes' | 'no' | 'tentative' | 'pending';
}

interface Match {
  _id: string;
  matchId: string;
  date: string;
  time: string;
  slot: string;
  opponent: string;
  ground: string;
}

interface SquadImageGeneratorProps {
  match: Match;
  availableSquad: Player[];
  tentativeSquad: Player[];
  unavailableSquad: Player[];
  onShareWhatsApp?: (imageBlob: Blob) => void;
  teamName?: string;
}

const SquadImageGenerator: React.FC<SquadImageGeneratorProps> = ({
  match,
  availableSquad,
  tentativeSquad,
  unavailableSquad,
  onShareWhatsApp,
  teamName = 'Mavericks XI'
}) => {
  const imageRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const generateImage = async () => {
    if (!imageRef.current) return;
    
    setGenerating(true);
    try {
      // Wait a bit for the DOM to fully render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(imageRef.current, {
        backgroundColor: '#0f172a',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedImage(dataUrl);
      
      // Convert to blob for sharing
      canvas.toBlob((blob) => {
        if (blob) {
          setImageBlob(blob);
        }
      }, 'image/png');
      
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.download = `${teamName.replace(/\s+/g, '-')}_vs_${match.opponent.replace(/\s+/g, '-')}_${match.date}.png`;
    link.href = generatedImage;
    link.click();
  };

  const handleShareWhatsApp = () => {
    if (imageBlob && onShareWhatsApp) {
      onShareWhatsApp(imageBlob);
    }
  };

  return (
    <>
      {/* Generate Button */}
      <button
        onClick={generateImage}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Generate Squad Image
          </>
        )}
      </button>

      {/* Hidden template for image generation */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={imageRef}
          style={{
            width: '900px',
            padding: '0',
            background: '#0d1117',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {/* Top Banner with Gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
            padding: '32px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '20%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%',
            }}></div>
            
            {/* Header Content */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              position: 'relative',
              zIndex: 1,
            }}>
              {/* Logo */}
              <div style={{
                width: '70px',
                height: '70px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.2)',
              }}>
                <span style={{ 
                  color: '#047857', 
                  fontSize: '40px', 
                  fontWeight: '900',
                  lineHeight: '1',
                }}>M</span>
              </div>
              
              {/* Team Name */}
              <div style={{ textAlign: 'left' }}>
                <h1 style={{
                  fontSize: '42px',
                  fontWeight: '900',
                  color: 'white',
                  margin: '0',
                  letterSpacing: '-1px',
                  textShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}>
                  {teamName}
                </h1>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.8)',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  marginTop: '4px',
                }}>
                  SQUAD AVAILABILITY
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ padding: '24px 32px 32px' }}>
            {/* Match Info Card */}
            <div style={{
              background: 'linear-gradient(145deg, #1a2234 0%, #151c2c 100%)',
              borderRadius: '16px',
              padding: '24px 32px',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              {/* VS Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                marginBottom: '20px',
              }}>
                <span style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  color: '#10b981',
                  letterSpacing: '-0.5px',
                }}>
                  {teamName}
                </span>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #4b5563',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#9ca3af',
                    letterSpacing: '1px',
                  }}>VS</span>
                </div>
                <span style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  color: '#ef4444',
                  letterSpacing: '-0.5px',
                }}>
                  {match.opponent || 'TBD'}
                </span>
              </div>
              
              {/* Match Details */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '16px' }}>📅</span>
                  </div>
                  <span style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: '600' }}>{formatDate(match.date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '16px' }}>⏰</span>
                  </div>
                  <span style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: '600' }}>{match.slot || formatTime(match.time)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(236, 72, 153, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '16px' }}>📍</span>
                  </div>
                  <span style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: '600' }}>{match.ground}</span>
                </div>
              </div>
            </div>

            {/* Squad Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {/* Available */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '2px solid #10b981',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{ 
                    fontSize: '20px',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                  }}>✅</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'white',
                    letterSpacing: '0.3px',
                  }}>
                    AVAILABLE ({availableSquad.length})
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  {availableSquad.map((player, idx) => (
                    <div key={player._id} style={{
                      background: 'rgba(4, 120, 87, 0.15)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: idx < availableSquad.length - 1 ? '10px' : '0',
                      borderLeft: '4px solid #10b981',
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#f0fdf4',
                        letterSpacing: '0.3px',
                      }}>
                        {idx + 1}. {player.playerName}
                      </span>
                    </div>
                  ))}
                  {availableSquad.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '28px', color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
                      No confirmed players
                    </div>
                  )}
                </div>
              </div>

              {/* Tentative */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{ 
                    fontSize: '20px',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                  }}>⚠️</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'white',
                    letterSpacing: '0.3px',
                  }}>
                    TENTATIVE ({tentativeSquad.length})
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  {tentativeSquad.map((player, idx) => (
                    <div key={player._id} style={{
                      background: 'rgba(180, 83, 9, 0.15)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: idx < tentativeSquad.length - 1 ? '10px' : '0',
                      borderLeft: '4px solid #f59e0b',
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#fef3c7',
                        letterSpacing: '0.3px',
                      }}>
                        {idx + 1}. {player.playerName}
                      </span>
                    </div>
                  ))}
                  {tentativeSquad.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '28px', color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
                      No tentative players
                    </div>
                  )}
                </div>
              </div>

              {/* Not Available */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                border: '2px solid #ef4444',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{ 
                    fontSize: '20px',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                  }}>❌</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'white',
                    letterSpacing: '0.3px',
                  }}>
                    NOT AVAILABLE ({unavailableSquad.length})
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  {unavailableSquad.map((player, idx) => (
                    <div key={player._id} style={{
                      background: 'rgba(127, 29, 29, 0.15)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      marginBottom: idx < unavailableSquad.length - 1 ? '10px' : '0',
                      borderLeft: '4px solid #ef4444',
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#fee2e2',
                        letterSpacing: '0.3px',
                      }}>
                        {idx + 1}. {player.playerName}
                      </span>
                    </div>
                  ))}
                  {unavailableSquad.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '28px', color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
                      No declined players
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Bar */}
            <div style={{
              background: 'linear-gradient(145deg, #111827 0%, #0f1419 100%)',
              borderRadius: '12px',
              padding: '24px 32px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>
                  {availableSquad.length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1px' }}>
                  Confirmed
                </div>
              </div>
              <div style={{ width: '2px', height: '50px', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b' }}>
                  {tentativeSquad.length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1px' }}>
                  Tentative
                </div>
              </div>
              <div style={{ width: '2px', height: '50px', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444' }}>
                  {unavailableSquad.length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1px' }}>
                  Declined
                </div>
              </div>
              <div style={{ width: '2px', height: '50px', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6' }}>
                  {availableSquad.length + tentativeSquad.length + unavailableSquad.length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1px' }}>
                  Total
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            background: 'linear-gradient(90deg, #047857, #059669)',
            padding: '14px 32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0.5px',
            }}>
              🏏 {teamName} • Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && generatedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Squad Image Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Image Preview */}
            <div className="p-4 overflow-auto max-h-[60vh]">
              <img
                src={generatedImage}
                alt="Squad Preview"
                className="w-full rounded-lg border border-white/10"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-4 border-t border-white/10">
              <button
                onClick={downloadImage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download PNG
              </button>
              {onShareWhatsApp && (
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Share via WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SquadImageGenerator;
