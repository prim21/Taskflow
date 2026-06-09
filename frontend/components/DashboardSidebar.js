'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardSidebar({
    user,
    invitations = [],
    onInvite,
    projects = [],
    activeProject,
    setActiveProject,
    onCreateProject,
    onDeleteProject,
    onLogout,
    onNewItem, // Generic "New" action
    onUploadProfilePicture,
    storageStats = { used: 75 }, // Default mock
    isProjectModalOpen,
    setIsProjectModalOpen
}) {
    const pathname = usePathname();
    const { updateProfile, getToken } = useAuth();
    const fileInputRef = useRef(null);

    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [customSeed, setCustomSeed] = useState('');
    const [customStyle, setCustomStyle] = useState('miniavs');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const PRESET_AVATARS = [
        { name: 'Miniav Pink', url: 'https://api.dicebear.com/7.x/miniavs/svg?seed=guineapig' },
        { name: 'Miniav Red', url: 'https://api.dicebear.com/7.x/miniavs/svg?seed=weasel' },
        { name: 'Adventurer Aneka', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka' },
        { name: 'Avataaars Felix', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
        { name: 'Avataaars Sophia', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
        { name: 'Adventurer James', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=James' },
        { name: 'Bottts Gizmo', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo' },
        { name: 'Bottts Robo', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robo' },
        { name: 'Lorelei Daisy', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Daisy' },
        { name: 'Lorelei Coco', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Coco' },
        { name: 'Fun Emoji 1', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Buster' },
        { name: 'Fun Emoji 2', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sassy' }
    ];

    const handleSelectPreset = async (url) => {
        setIsSaving(true);
        try {
            await updateProfile({ photoURL: url });
            setIsAvatarModalOpen(false);
        } catch (err) {
            console.error('Failed to update avatar:', err);
            alert('Failed to update avatar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyCustom = async () => {
        const url = `https://api.dicebear.com/7.x/${customStyle}/svg?seed=${customSeed.trim() || 'guineapig'}`;
        setIsSaving(true);
        try {
            await updateProfile({ photoURL: url });
            setIsAvatarModalOpen(false);
        } catch (err) {
            console.error('Failed to update avatar:', err);
            alert('Failed to update avatar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            if (onUploadProfilePicture) {
                await onUploadProfilePicture(e);
                setIsAvatarModalOpen(false);
            } else {
                const formData = new FormData();
                formData.append('image', file);

                const token = await getToken();
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
                const response = await fetch(`${API_URL}/upload/profile-picture`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();
                if (data.success) {
                    await updateProfile({ photoURL: data.data.url });
                    setIsAvatarModalOpen(false);
                } else {
                    alert(data.message || 'Failed to upload photo');
                }
            }
        } catch (err) {
            console.error('Upload failed', err);
            alert('Failed to upload photo');
        } finally {
            setIsUploading(false);
        }
    };



    return (
        <aside className="w-72 bg-white rounded-3xl flex flex-col flex-shrink-0 shadow-sm border border-white/50 z-30 h-full">
            {/* Workspace / Profile Header */}
            <div className="p-6 pb-6">
                {/* Window Controls */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]/50"></div>
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]/50"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]/50"></div>
                </div>

                {/* Profile Section */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        <div
                            onClick={() => setIsAvatarModalOpen(true)}
                            className="cursor-pointer relative group block flex-shrink-0"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden relative border border-gray-100 group-hover:border-gray-300 transition-colors">
                                <img
                                    src={user?.photoURL || "https://api.dicebear.com/7.x/miniavs/svg?seed=guineapig"}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                                    Edit
                                </div>
                            </div>
                            {/* Visual "+" badge overlay for upload clarity */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-900 text-white rounded-full flex items-center justify-center border border-white shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14m7-7H5" /></svg>
                            </div>
                        </div>

                        <span className="font-bold text-gray-900 text-sm truncate">{user?.displayName?.split(' ')[0] || 'User'}'s Space</span>
                    </div>

                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
                <div className="space-y-1 py-2">
                    <Link href="/documents" className={`w-full flex items-center gap-3 px-3 py-2.5 font-medium rounded-xl transition-colors ${pathname === '/documents' ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        All Documents
                    </Link>
                    <Link href="/tasks" className={`w-full flex items-center gap-3 px-3 py-2.5 font-medium rounded-xl transition-colors ${pathname === '/tasks' ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Tasks
                    </Link>
                    <Link href="/calendar" className={`w-full flex items-center gap-3 px-3 py-2.5 font-medium rounded-xl transition-colors ${pathname === '/calendar' ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Calendar
                    </Link>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        <span>Lists</span>
                        <button
                            onClick={() => setIsProjectModalOpen && setIsProjectModalOpen(true)}
                            className="hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <div
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl cursor-pointer transition-colors ${activeProject === null ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveProject && setActiveProject(null)}
                    >
                        <span className={`w-2 h-2 rounded-full ${activeProject === null ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                        My Tasks
                    </div>
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl cursor-pointer transition-colors ${activeProject === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => setActiveProject && setActiveProject(project.id)}
                        >
                            <div className="flex items-center gap-3 truncate">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeProject === project.id ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                <span className="truncate">{project.name}</span>
                            </div>
                            {onDeleteProject && (
                                <button
                                    onClick={(e) => onDeleteProject(project.id, e)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Storage / Logout */}
            <div className="p-4 mt-auto">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Storage</span>
                        <span className="text-[10px] font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                            {storageStats.used || 0}%
                        </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${storageStats.used > 90 ? 'bg-red-500' :
                                storageStats.used > 70 ? 'bg-orange-500' : 'bg-blue-600'
                                }`}
                            style={{ width: `${storageStats.used || 0}%` }}
                        ></div>
                    </div>

                    <p className="text-[10px] text-gray-500 mb-4">
                        <span className="font-bold text-gray-700">
                            {storageStats.usedBytes ? (storageStats.usedBytes / (1024 * 1024)).toFixed(1) : '0'} MB
                        </span>
                        {' '}of 1 GB used
                    </p>

                    <div className="pt-3 border-t border-gray-100">
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 group w-full text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all border border-gray-100">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-600 group-hover:text-red-600 transition-colors">Logout</span>
                        </button>
                    </div>
                </div>
            </div>


            {/* Avatar Selector Modal */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl p-8 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Choose Avatar</h3>
                                <p className="text-xs text-gray-500 mt-1">Select a preset, generate custom, or upload an image</p>
                            </div>
                            <button
                                onClick={() => setIsAvatarModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">

                            {/* Preset Avatars Grid */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Preset Styles</h4>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                    {PRESET_AVATARS.map((avatar, index) => (
                                        <button
                                            key={index}
                                            disabled={isSaving || isUploading}
                                            onClick={() => handleSelectPreset(avatar.url)}
                                            className={`group relative aspect-square rounded-2xl bg-gray-50 border-2 overflow-hidden hover:scale-105 hover:shadow-md hover:border-blue-500 transition-all duration-200 ${user?.photoURL === avatar.url ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-100'
                                                }`}
                                            title={avatar.name}
                                        >
                                            <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover p-1 group-hover:scale-110 transition-transform duration-200" />
                                            {user?.photoURL === avatar.url && (
                                                <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                                                    <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100"></div>

                            {/* Custom Seed Generator */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Custom Avatar Generator</h4>
                                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                                    {/* Live Preview */}
                                    <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner relative group">
                                        <img
                                            src={`https://api.dicebear.com/7.x/${customStyle}/svg?seed=${customSeed.trim() || 'guineapig'}`}
                                            alt="Preview"
                                            className="w-full h-full object-cover p-1"
                                        />
                                    </div>

                                    {/* Inputs */}
                                    <div className="flex-1 w-full space-y-3">
                                        <div className="flex gap-2">
                                            <select
                                                value={customStyle}
                                                onChange={(e) => setCustomStyle(e.target.value)}
                                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="miniavs">Minimalist (Miniavs)</option>
                                                <option value="avataaars">Humanlike (Avataaars)</option>
                                                <option value="adventurer">Anime-style (Adventurer)</option>
                                                <option value="bottts">Robots (Bottts)</option>
                                                <option value="lorelei">Ink Sketch (Lorelei)</option>
                                                <option value="open-peeps">Hand-drawn (Open Peeps)</option>
                                                <option value="fun-emoji">Emoji (Fun Emoji)</option>
                                                <option value="pixel-art">Pixel Art</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Type custom seed (e.g. name)"
                                                value={customSeed}
                                                onChange={(e) => setCustomSeed(e.target.value)}
                                                className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isSaving || isUploading}
                                            onClick={handleApplyCustom}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/10 hover:shadow-blue-600/25 flex items-center justify-center gap-1.5"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Generate & Apply
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100"></div>

                            {/* Local Image Upload Option */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Upload Custom Photo</h4>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-50/20 transition-all group flex flex-col items-center justify-center gap-2"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Choose local file...</span>
                                    <span className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</span>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleUploadFile}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status overlays inside modal */}
                        {(isSaving || isUploading) && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-[2rem] z-50">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-semibold text-gray-900 mt-4">
                                    {isUploading ? 'Uploading file...' : 'Saving profile photo...'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}
