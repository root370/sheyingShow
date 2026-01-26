'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from './ConfirmDialog';

interface ExhibitionControlsProps {
    exhibitionId: string;
    authorId?: string;
}

export default function ExhibitionControls({ exhibitionId, authorId }: ExhibitionControlsProps) {
    const router = useRouter();
    const [isOwner, setIsOwner] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    React.useEffect(() => {
        async function checkOwner() {
            if (!authorId) return;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.id === authorId) {
                    setIsOwner(true);
                }
            } catch (error) {
                console.warn("Owner check failed", error);
            }
        }
        checkOwner();
    }, [authorId]);

    if (!isOwner) return null;

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            // Database Cascade Delete handles children
            const { error } = await supabase
                .from('exhibitions')
                .delete()
                .eq('id', exhibitionId);

            if (error) throw error;
            
            router.push('/'); // Return to lobby
            router.refresh();
        } catch (err) {
            console.error('Error deleting exhibition:', err);
            alert('Failed to delete exhibition. Please try again.');
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handleEdit = () => {
        router.push(`/editor?id=${exhibitionId}`);
    };

    return (
        <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
             <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all text-xs font-sans tracking-widest uppercase"
            >
                <Edit size={14} />
                <span>Edit</span>
            </button>
            <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 backdrop-blur-md rounded-full text-red-400 hover:text-white hover:bg-red-600 transition-all text-xs font-sans tracking-widest uppercase"
            >
                <Trash2 size={14} />
                <span>Delete</span>
            </button>
            
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Exhibition"
                description="Are you sure you want to delete this exhibition? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
