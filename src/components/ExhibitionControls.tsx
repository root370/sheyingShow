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
            
            // 3. Navigate back to lobby and refresh
            router.push('/'); 
            // In Pages Router, we don't have router.refresh(). 
            // Navigating to '/' is usually enough, or we can force reload if needed.
            // router.reload(); 
        } catch (err) {
            console.error('Error deleting exhibition:', err);
            alert('删除展览失败，请重试。');
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
                <span>编辑</span>
            </button>
            <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 backdrop-blur-md rounded-full text-red-400 hover:text-white hover:bg-red-600 transition-all text-xs font-sans tracking-widest uppercase"
            >
                <Trash2 size={14} />
                <span>移除</span>
            </button>
            
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="移除展览"
                description="确定要移除这个展览吗？此操作无法撤销。"
                confirmText="移除"
                cancelText="取消"
                isDestructive={true}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
