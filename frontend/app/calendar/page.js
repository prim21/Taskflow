'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import { getEvents, createEvent, deleteEvent, getSchedulingSuggestions } from '@/lib/api';

export default function CalendarPage() {
    const { user, loading: authLoading, getToken, logout, storageStats } = useAuth();
    const router = useRouter();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // month, week, day
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New Event State
    const [newEvent, setNewEvent] = useState({
        title: '',
        startDate: '',
        endDate: '',
        type: 'meeting',
        color: '#bae6fd'
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchEvents();
        }
    }, [user, authLoading, currentDate, view]); // simple refetch on nav

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            // Calculate range based on view
            // For simplicity, just fetch broad range
            const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            startDay.setHours(0, 0, 0, 0);
            const start = startDay.toISOString();

            const endDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            endDay.setHours(23, 59, 59, 999);
            const end = endDay.toISOString();

            const data = await getEvents({ startDate: start, endDate: end }, token);
            setEvents(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const token = await getToken();
            await createEvent(newEvent, token);
            setIsCreateModalOpen(false);
            setNewEvent({ title: '', startDate: '', endDate: '', type: 'meeting', color: '#bae6fd' });
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert('Failed to create event');
        }
    };

    const handleDeleteEvent = async (id) => {
        try {
            const token = await getToken();
            await deleteEvent(id, token);
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Failed to delete event', error);
            alert('Failed to delete event');
        }
    };


    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Calendar Grid Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday

        const daysArray = [];
        // Pad empty slots
        for (let i = 0; i < firstDay; i++) daysArray.push(null);
        // Days
        for (let i = 1; i <= days; i++) daysArray.push(new Date(year, month, i));

        return daysArray;
    };

    if (authLoading || !user) return null;

    const days = getDaysInMonth(currentDate);

    return (
        <div className="flex h-screen bg-[#f3f4f6] font-sans text-slate-600 p-4 gap-4 overflow-hidden">
            <DashboardSidebar
                user={user}
                onLogout={() => logout()}
                onNewItem={() => setIsCreateModalOpen(true)}
                storageStats={storageStats}
            />

            <main className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl shadow-sm border border-white/50 overflow-hidden relative">
                <header className="px-8 py-5 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h1>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-medium hover:bg-white rounded-md transition-all">Today</button>
                            <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {['Day', 'Week', 'Month'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v.toLowerCase())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === v.toLowerCase() ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider">{day}</div>
                        ))}
                    </div>

                    {/* Month Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[400px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-sm text-gray-500 font-medium">Loading calendar events...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            {days.map((date, idx) => (
                                <div key={idx} className={`bg-white min-h-[120px] p-2 relative group ${!date ? 'bg-gray-50' : ''}`}>
                                    {date && (
                                        <>
                                            <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                                                {date.getDate()}
                                            </div>
                                            <div className="space-y-1">
                                                {events
                                                    .filter(e => {
                                                        const eventDate = new Date(e.startDate);
                                                        return eventDate.getFullYear() === date.getFullYear() &&
                                                            eventDate.getMonth() === date.getMonth() &&
                                                            eventDate.getDate() === date.getDate();
                                                    })
                                                    .map(event => {
                                                        const isLightColor = (hex) => {
                                                            if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return true;
                                                            const c = hex.substring(1);
                                                            if (c.length !== 3 && c.length !== 6) return true;
                                                            let r, g, b;
                                                            if (c.length === 3) {
                                                                r = parseInt(c[0] + c[0], 16);
                                                                g = parseInt(c[1] + c[1], 16);
                                                                b = parseInt(c[2] + c[2], 16);
                                                            } else {
                                                                r = parseInt(c.substring(0, 2), 16);
                                                                g = parseInt(c.substring(2, 4), 16);
                                                                b = parseInt(c.substring(4, 6), 16);
                                                            }
                                                            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                                                            return luma > 140;
                                                        };
                                                        const isLight = isLightColor(event.color);

                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className={`group/item relative text-xs px-2 py-1 pr-6 rounded-md truncate cursor-pointer hover:opacity-90 transition-all border ${isLight
                                                                        ? 'text-slate-800 border-black/5 font-medium shadow-sm'
                                                                        : 'text-white border-transparent'
                                                                    }`}
                                                                style={{ backgroundColor: event.color || '#bae6fd' }}
                                                            >
                                                                <span className="truncate block">{event.title}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteEvent(event.id);
                                                                    }}
                                                                    className={`absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity ${isLight ? 'text-slate-800' : 'text-white'
                                                                        }`}
                                                                    title="Delete Event"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const year = date.getFullYear();
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    const localDateStr = `${year}-${month}-${day}`;
                                                    setNewEvent(prev => ({
                                                        ...prev,
                                                        startDate: `${localDateStr}T09:00`,
                                                        endDate: `${localDateStr}T10:00`
                                                    }));
                                                    setIsCreateModalOpen(true);
                                                }}
                                                className="absolute bottom-2 right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold"
                                            >
                                                +
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Event</h2>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-xl"
                                placeholder="Meeting Title"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Start</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 border rounded-xl text-sm"
                                        value={newEvent.startDate}
                                        onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">End</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 border rounded-xl text-sm"
                                        value={newEvent.endDate}
                                        onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Color</label>
                                <div className="flex gap-2">
                                    {['#bae6fd', '#fecdd3', '#a7f3d0', '#fde68a', '#e9d5ff'].map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`w-8 h-8 rounded-full border-2 ${newEvent.color === c ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setNewEvent({ ...newEvent, color: c })}
                                        />
                                    ))}
                                </div>

                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
