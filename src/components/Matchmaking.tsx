/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { PlayEvent, UserProfile } from '../types';
import { 
  Users, Calendar, Clock, MapPin, Trophy, ShieldAlert,
  Sparkles, Check, UserPlus, LogOut, Trash2, Plus
} from 'lucide-react';

interface MatchmakingProps {
  currentUser: UserProfile | null;
  onShowConsentModal: () => void;
}

export default function Matchmaking({ currentUser, onShowConsentModal }: MatchmakingProps) {
  const [events, setEvents] = useState<PlayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courtName, setCourtName] = useState("Dumaguete Pickleball & Sports Arena");
  const [dateTime, setDateTime] = useState("");
  const [skillLevelTarget, setSkillLevelTarget] = useState("3.0 - Intermediate");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Simulated player matches list (to simulate the matchmaking database)
  const simulatedPlayers = [
    { name: "John Mark 'Dink' Teves", city: "Dumaguete", skill: "4.5 - Pro Level", home: "A-Courts Premium Pickleball & Community" },
    { name: "Silliman Star Sasser", city: "Dumaguete", skill: "3.5 - Advanced", home: "Dumaguete Pickleball Club (Pantawan)" },
    { name: "Patricia Lim", city: "Negros Oriental", skill: "3.0 - Intermediate", home: "PlayPro Active Courts (PAC) Sibulan" },
    { name: "Coach Mike G.", city: "Metro Manila & Luzon", skill: "5.0 - Elite Pro", home: "Helios Pickleball Center Pasig" },
    { name: "Brizuela 'Soft-Hands'", city: "Visayas & Mindanao", skill: "3.0 - Intermediate", home: "PicklePoint Iloilo" },
  ];

  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("All");

  // Load events from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "play_events"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedEvents: PlayEvent[] = [];
      snapshot.forEach((doc) => {
        loadedEvents.push({ id: doc.id, ...doc.data() } as PlayEvent);
      });
      // Sort upcoming events
      loadedEvents.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setEvents(loadedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Play events load error: ", error);
      // Fallback local mock storage
      const saved = localStorage.getItem("mock_play_events");
      if (saved) {
        setEvents(JSON.parse(saved));
      } else {
        // Initial mock events seed
        const seedEvents: PlayEvent[] = [
          {
            id: "seed-1",
            courtId: "duma-sports-center",
            courtName: "Dumaguete Pickleball & Sports Arena",
            organizerId: "mock-id-1",
            organizerName: "Coach Mark",
            dateTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            skillLevelTarget: "3.0 - 3.5 (Intermediate)",
            maxPlayers: 4,
            joinedPlayerIds: ["mock-id-1", "mock-id-2"],
            joinedPlayerNames: ["Coach Mark", "Silliman Star Sasser"],
            description: "Friendly match doubles play. Focus on third shot drops. Under the LED floodlights!"
          }
        ];
        setEvents(seedEvents);
        localStorage.setItem("mock_play_events", JSON.stringify(seedEvents));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setSubmitError("You must register/login and consent to DPA to organize games.");
      onShowConsentModal();
      return;
    }

    if (!currentUser.dpaConsent) {
      setSubmitError("You must consent to the Data Privacy Act (DPA) policy.");
      onShowConsentModal();
      return;
    }

    if (!dateTime || !courtName || !description.trim()) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    setSubmitError("");
    
    const newEvent: Omit<PlayEvent, 'id'> = {
      courtId: "custom",
      courtName: courtName,
      organizerId: currentUser.uid, // Multi-tenant user separation key
      organizerName: currentUser.displayName || "Anonymous Player",
      dateTime: new Date(dateTime).toISOString(),
      skillLevelTarget: skillLevelTarget,
      maxPlayers: Number(maxPlayers),
      joinedPlayerIds: [currentUser.uid], // Organizer automatically joins
      joinedPlayerNames: [currentUser.displayName || "Anonymous Player"],
      description: description
    };

    try {
      await addDoc(collection(db, "play_events"), newEvent);
      setShowCreateForm(false);
      setCourtName("Dumaguete Pickleball & Sports Arena");
      setDateTime("");
      setDescription("");
    } catch (err) {
      console.warn("Failed to write event to Firestore, falling back locally: ", err);
      const existing = localStorage.getItem("mock_play_events");
      const currentList: PlayEvent[] = existing ? JSON.parse(existing) : [];
      const mockRecord: PlayEvent = {
        id: `local_event_${Date.now()}`,
        ...newEvent
      };
      const updatedList = [...currentList, mockRecord];
      localStorage.setItem("mock_play_events", JSON.stringify(updatedList));
      setEvents(updatedList);
      setShowCreateForm(false);
    }
  };

  // Join Event (Multi-tenant check)
  const handleJoinEvent = async (event: PlayEvent) => {
    if (!currentUser) {
      onShowConsentModal();
      return;
    }

    if (!currentUser.dpaConsent) {
      onShowConsentModal();
      return;
    }

    if (event.joinedPlayerIds.includes(currentUser.uid)) {
      alert("You are already signed up for this game.");
      return;
    }

    if (event.joinedPlayerIds.length >= event.maxPlayers) {
      alert("This game roster is currently full.");
      return;
    }

    const updatedIds = [...event.joinedPlayerIds, currentUser.uid];
    const updatedNames = [...event.joinedPlayerNames, currentUser.displayName || "Anonymous Player"];

    try {
      if (event.id.startsWith("local_event_")) {
        // Fallback local updates
        const existing = localStorage.getItem("mock_play_events");
        const list: PlayEvent[] = existing ? JSON.parse(existing) : [];
        const updatedList = list.map(ev => {
          if (ev.id === event.id) {
            return { ...ev, joinedPlayerIds: updatedIds, joinedPlayerNames: updatedNames };
          }
          return ev;
        });
        localStorage.setItem("mock_play_events", JSON.stringify(updatedList));
        setEvents(updatedList);
      } else {
        // Secure Firestore update
        const docRef = doc(db, "play_events", event.id);
        await updateDoc(docRef, {
          joinedPlayerIds: updatedIds,
          joinedPlayerNames: updatedNames
        });
      }
    } catch (err) {
      console.error("Failed to update Firestore event join: ", err);
    }
  };

  // Leave Event (Multi-tenant secure separation)
  const handleLeaveEvent = async (event: PlayEvent) => {
    if (!currentUser) return;

    if (!event.joinedPlayerIds.includes(currentUser.uid)) {
      return;
    }

    const idx = event.joinedPlayerIds.indexOf(currentUser.uid);
    const updatedIds = event.joinedPlayerIds.filter(id => id !== currentUser.uid);
    const updatedNames = event.joinedPlayerNames.filter((_, i) => i !== idx);

    try {
      if (event.id.startsWith("local_event_")) {
        const existing = localStorage.getItem("mock_play_events");
        const list: PlayEvent[] = existing ? JSON.parse(existing) : [];
        const updatedList = list.map(ev => {
          if (ev.id === event.id) {
            return { ...ev, joinedPlayerIds: updatedIds, joinedPlayerNames: updatedNames };
          }
          return ev;
        });
        localStorage.setItem("mock_play_events", JSON.stringify(updatedList));
        setEvents(updatedList);
      } else {
        const docRef = doc(db, "play_events", event.id);
        await updateDoc(docRef, {
          joinedPlayerIds: updatedIds,
          joinedPlayerNames: updatedNames
        });
      }
    } catch (err) {
      console.error("Failed to update Firestore event leave: ", err);
    }
  };

  // Cancel Event (Only Organizer can delete - Multi-tenant enforcement)
  const handleCancelEvent = async (event: PlayEvent) => {
    if (!currentUser) return;
    if (event.organizerId !== currentUser.uid) {
      alert("Multi-tenant security violation: You did not organize this game and cannot cancel it!");
      return;
    }

    if (confirm("Are you sure you want to cancel and delete this scheduled play?")) {
      try {
        if (event.id.startsWith("local_event_")) {
          const existing = localStorage.getItem("mock_play_events");
          const list: PlayEvent[] = existing ? JSON.parse(existing) : [];
          const updatedList = list.filter(ev => ev.id !== event.id);
          localStorage.setItem("mock_play_events", JSON.stringify(updatedList));
          setEvents(updatedList);
        } else {
          await deleteDoc(doc(db, "play_events", event.id));
        }
      } catch (err) {
        console.error("Failed to delete event: ", err);
      }
    }
  };

  const filteredSimulatedPlayers = selectedCityFilter === "All"
    ? simulatedPlayers
    : simulatedPlayers.filter(p => p.city === selectedCityFilter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="matchmaking-section">
      
      {/* LEFT: Game Coordinator Events (7 Columns) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold text-slate-900">Game Coordinator Matches</h3>
            <p className="text-xs text-slate-500">Join real upcoming public games or schedule your own matches</p>
          </div>

          <button
            id="toggle-create-event-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule Game
          </button>
        </div>

        {/* Schedule Game Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateEvent} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-4 shadow-sm animate-fade-in" id="schedule-game-form">
            <h4 className="font-display font-bold text-slate-900 text-sm">Schedule Local Game (Multi-Tenant Logged)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Court Facility Location</label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="e.g. Rizal Boulevard Seaside Court"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Date & Start Time</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Target Skill Tier</label>
                <select
                  value={skillLevelTarget}
                  onChange={(e) => setSkillLevelTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Open - All Skills">Open - All Skills</option>
                  <option value="1.5 - 2.0 (Beginner)">1.5 - 2.0 (Beginner)</option>
                  <option value="2.5 - 3.0 (Intermediate)">2.5 - 3.0 (Intermediate)</option>
                  <option value="3.5 - 4.0 (Advanced)">3.5 - 4.0 (Advanced)</option>
                  <option value="4.5+ (Pro Level)">4.5+ (Pro Level)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Max Roster Cap</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value={4}>4 Players (Doubles Match)</option>
                  <option value={2}>2 Players (Singles Match)</option>
                  <option value={6}>6 Players (Rotation Rec)</option>
                  <option value={8}>8 Players (Team Rec)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Group Description & Rules</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details like 'We supply paddles', 'BYO-Balls', or 'Winner stays format'..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-800 focus:outline-none h-16 resize-none"
                required
              />
            </div>

            {submitError && (
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> {submitError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Create Game Post
              </button>
            </div>
          </form>
        )}

        {/* Scheduled events feed list */}
        <div className="space-y-4" id="scheduled-events-list">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-10">Syncing local district schedules...</p>
          ) : events.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold mt-1">No upcoming community matches scheduled. Be the first to schedule!</p>
            </div>
          ) : (
            events.map(event => {
              const isJoined = currentUser && event.joinedPlayerIds.includes(currentUser.uid);
              const isOrganizer = currentUser && event.organizerId === currentUser.uid;
              const seatsLeft = event.maxPlayers - event.joinedPlayerIds.length;

              return (
                <div key={event.id} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 hover:shadow-sm transition-all" id={`event-card-${event.id}`}>
                  
                  {/* Top line summary */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 inline-block">
                        Target: {event.skillLevelTarget}
                      </span>
                      <h4 className="font-display font-bold text-slate-900 text-base flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {event.courtName}
                      </h4>
                    </div>

                    {/* Slots Counter Badge */}
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg inline-block ${
                        seatsLeft > 0 ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                      }`}>
                        {seatsLeft > 0 ? `${seatsLeft} Slots Remaining` : "Roster Complete"}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">Organizer: {event.organizerName}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl italic">
                    &ldquo;{event.description}&rdquo;
                  </p>

                  {/* Scheduled Date/Time Block */}
                  <div className="flex items-center gap-6 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(event.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {new Date(event.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Players list row */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Roster ({event.joinedPlayerIds.length}/{event.maxPlayers})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {event.joinedPlayerNames.map((name, i) => {
                        const isPlayerOrganizer = event.joinedPlayerIds[i] === event.organizerId;
                        return (
                          <span 
                            key={i} 
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${
                              isPlayerOrganizer 
                                ? 'bg-slate-900 text-white' 
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {name} {isPlayerOrganizer && <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Join/Leave/Cancel triggers (Multi-Tenant safe) */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 flex-wrap gap-2">
                    <span className="text-[9px] text-slate-400 font-mono">ID: {event.id.substring(0, 10)}</span>

                    <div className="flex gap-2">
                      {isOrganizer && (
                        <button
                          onClick={() => handleCancelEvent(event)}
                          className="py-1.5 px-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Cancel Play
                        </button>
                      )}

                      {isJoined ? (
                        <button
                          onClick={() => handleLeaveEvent(event)}
                          className="py-1.5 px-3.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Leave Roster
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinEvent(event)}
                          disabled={seatsLeft <= 0}
                          className="py-1.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 disabled:bg-slate-200 disabled:text-slate-500 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Join Game
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Matchmaking Match Finder (5 Columns) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-4">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-amber-500" /> Community Matchmaker Panel
            </h4>
            <p className="text-xs text-slate-500">Find and connect with local players matching your tier & location</p>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 border-t border-slate-50">
            <span>Filter players by district:</span>
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-lg p-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="All">All Regions</option>
              <option value="Dumaguete">Dumaguete City</option>
              <option value="Negros Oriental">Other Negros Oriental</option>
              <option value="Metro Manila & Luzon">Metro Manila & Luzon</option>
              <option value="Visayas & Mindanao">Visayas & Mindanao</option>
              <option value="International">International</option>
            </select>
          </div>

          {/* Player Cards */}
          <div className="space-y-3.5" id="simulated-players-feed">
            {filteredSimulatedPlayers.map((player, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:border-slate-200 hover:bg-white transition-all">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-800">{player.name}</h5>
                  <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold font-mono">
                    {player.city}
                  </span>
                </div>

                <div className="space-y-1 text-[10px] text-slate-500 font-medium">
                  <p className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-500" /> Skill: <strong className="text-slate-700">{player.skill}</strong></p>
                  <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Home Court: <span className="text-slate-600 truncate">{player.home}</span></p>
                </div>

                {/* Connection button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => alert(`Connection invitation securely sent to ${player.name} under localized matching metrics!`)}
                    className="py-1 px-2.5 rounded-lg border border-slate-200 hover:border-slate-900 text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-white transition-colors"
                  >
                    Send Match invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
