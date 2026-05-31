import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useProject } from '../contexts/ProjectContext';
import { User, Plus, Mail, Trash2, Shield, UserCheck, X } from 'lucide-react';

interface Member {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string | null;
}

export const TeamPage: React.FC = () => {
  const { currentProject } = useProject();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [processing, setProcessing] = useState(false);

  const fetchMembers = async () => {
    if (!currentProject) return;
    try {
      const [membersRes] = await Promise.all([
        client.get(`/projects/${currentProject.id}/members`)
      ]);
      setMembers(membersRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentProject]);

  const handleInvite = async () => {
    if (!currentProject || !inviteEmail) return;
    setProcessing(true);
    try {
      await client.post(`/projects/${currentProject.id}/members/invite`, {
        email: inviteEmail,
        role: inviteRole
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('editor');
      fetchMembers();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded text-[10px] font-bold uppercase">Propriétaire</span>;
      case 'admin':
        return <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase">Admin</span>;
      default:
        return <span className="px-2 py-0.5 bg-neutral-700 text-neutral-400 border border-neutral-600 rounded text-[10px] font-bold uppercase">Editeur</span>;
    }
  };

  if (!currentProject) {
    return <p className="text-neutral-500">Sélectionnez un projet pour gérer l\'équipe.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black uppercase">Équipe</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full font-bold text-xs uppercase"
        >
          <Plus size={14} /> Inviter
        </button>
      </header>

      {/* Members List */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-sm font-bold uppercase text-neutral-400">Membres ({members.length})</h2>
        </div>
        {loading ? (
          <p className="p-8 text-neutral-500 text-center">Chargement…</p>
        ) : members.length === 0 ? (
          <p className="p-8 text-neutral-500 text-center">Aucun membre.</p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {members.map((m) => (
              <li key={m.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Utilisateur</p>
                    <p className="text-xs text-neutral-500">Membre depuis {new Date(m.joined_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                {getRoleBadge(m.role)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black uppercase">Inviter un membre</h3>
              <button onClick={() => { setShowInviteModal(false); setInviteEmail(''); }} className="text-neutral-500 hover:text-white"><X size={18} /></button>
            </div>
            
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Email</label>
            <div className="flex items-center gap-2 bg-black border border-neutral-800 rounded-lg px-3 py-2 mb-4">
              <Mail size={16} className="text-neutral-500" />
              <input
                type="email"
                placeholder="email@exemple.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm"
              />
            </div>

            <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Rôle</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm mb-6"
            >
              <option value="editor">Editeur</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                className="px-4 py-2 text-xs font-black uppercase text-neutral-500 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleInvite}
                disabled={processing || !inviteEmail}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-4 py-2 rounded-full text-xs font-black uppercase flex items-center gap-2"
              >
                <Mail size={14} /> Envoyer l'invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
