'use client'

import React, { useState } from 'react';
import { SettingsSection, DangerZone } from '../../components/UI/SettingsUI';
import { FocusOSApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export const DeleteAccountSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all data will be permanently erased.");
    if (!confirmed) return;
    
    const doubleCheck = window.prompt('Type "DELETE" to confirm.');
    if (doubleCheck !== "DELETE") return;

    setLoading(true);
    try {
      await FocusOSApi.deleteAccount();
      await signOut();
      router.push('/');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsSection 
        title="Danger Zone" 
        description="Irreversible actions regarding your account."
      >
        <DangerZone 
          title="Delete Account" 
          description="Permanently delete your account and all associated data. This cannot be undone."
          buttonText="Delete Account"
          onAction={handleDelete}
          loading={loading}
        />
      </SettingsSection>
    </div>
  );
};
