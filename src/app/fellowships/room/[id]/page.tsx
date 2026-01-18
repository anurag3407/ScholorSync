'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Send,
    Upload,
    Loader2,
    CheckCircle,
    Lock,
    Unlock,
    FileText,
    MessageSquare,
    Flag,
    IndianRupee,
    Paperclip,
    X,
    Download,
    Image as ImageIcon,
    FileIcon,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    getProjectRoom,
    getRoomMessages,
    createRoomMessage,
    updateEscrowStatus,
} from '@/lib/firebase/fellowships';
import { uploadChatFile, isImageFile, formatFileSize, type UploadProgress } from '@/lib/firebase/storage';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import type { ProjectRoom, RoomMessage, EscrowStatus, UserRole } from '@/types/fellowships';
import { ESCROW_STATUS_LABELS } from '@/types/fellowships';

export default function ProjectRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [room, setRoom] = useState<ProjectRoom | null>(null);
    const [messages, setMessages] = useState<RoomMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [releasing, setReleasing] = useState(false);

    // File upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Typing indicator state
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

    const roomId = params.id as string;
    const userRole: UserRole = user?.uid === room?.corporateId ? 'corporate' : 'student';
    const isCorporate = userRole === 'corporate';

    // Socket.IO hook for real-time messaging
    const {
        isConnected,
        sendMessage: socketSendMessage,
        sendFileMessage,
        startTyping,
        stopTyping,
        onlineUsers
    } = useSocket({
        roomId,
        userId: user?.uid || '',
        userName: user?.profile?.name || 'User',
        userRole,
        onNewMessage: (message) => {
            setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => m.id === message.id)) return prev;
                return [...prev, {
                    ...message,
                    createdAt: new Date(message.createdAt),
                }];
            });
        },
        onUserTyping: (data) => {
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                if (data.isTyping && data.userId !== user?.uid) {
                    newMap.set(data.userId, data.userName);
                } else {
                    newMap.delete(data.userId);
                }
                return newMap;
            });
        },
    });

    useEffect(() => {
        if (roomId) {
            loadRoom();
        }
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadRoom = async () => {
        try {
            setLoading(true);
            const roomData = await getProjectRoom(roomId);
            if (roomData) {
                setRoom(roomData);
                const msgs = await getRoomMessages(roomId);
                setMessages(msgs);
            } else {
                // Demo data
                setRoom(getMockRoom(roomId));
                setMessages(getMockMessages(roomId));
            }
        } catch (error) {
            console.error('Error loading room:', error);
            setRoom(getMockRoom(roomId));
            setMessages(getMockMessages(roomId));
        } finally {
            setLoading(false);
        }
    };



    const handleSendMessage = async () => {
        if (!newMessage.trim() || !room || !user) return;

        const messageContent = newMessage.trim();
        setSending(true);
        setNewMessage(''); // Clear input immediately for better UX

        try {
            if (isConnected) {
                // Send via Socket.IO - server broadcasts to all including sender
                // The onNewMessage callback will add it to the messages state
                const messageId = socketSendMessage(messageContent, 'text');

                // Save to Firestore for persistence (with same ID to avoid duplicates on reload)
                if (messageId) {
                    await createRoomMessage({
                        roomId: room.id,
                        senderId: user.uid,
                        senderName: user.profile?.name || 'User',
                        senderRole: userRole,
                        content: messageContent,
                        type: 'text',
                    });
                }
            } else {
                // Offline: Save to Firestore and add locally
                await createRoomMessage({
                    roomId: room.id,
                    senderId: user.uid,
                    senderName: user.profile?.name || 'User',
                    senderRole: userRole,
                    content: messageContent,
                    type: 'text',
                });

                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-${Date.now()}`,
                        roomId: room.id,
                        senderId: user.uid,
                        senderName: user.profile?.name || 'User',
                        senderRole: userRole,
                        content: messageContent,
                        type: 'text',
                        createdAt: new Date(),
                    },
                ]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !room || !user) return;

        setUploading(true);
        try {
            const result = await uploadChatFile(
                roomId,
                selectedFile,
                (progress) => setUploadProgress(progress)
            );

            if (isConnected) {
                // Send file message via Socket.IO - server broadcasts to all
                const messageId = sendFileMessage(result.url, result.name);

                // Save to Firestore for persistence
                if (messageId) {
                    await createRoomMessage({
                        roomId: room.id,
                        senderId: user.uid,
                        senderName: user.profile?.name || 'User',
                        senderRole: userRole,
                        content: '',
                        type: 'file',
                        attachmentUrl: result.url,
                        attachmentName: result.name,
                    });
                }
            } else {
                // Offline: Save to Firestore and add locally
                await createRoomMessage({
                    roomId: room.id,
                    senderId: user.uid,
                    senderName: user.profile?.name || 'User',
                    senderRole: userRole,
                    content: '',
                    type: 'file',
                    attachmentUrl: result.url,
                    attachmentName: result.name,
                });

                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-${Date.now()}`,
                        roomId: room.id,
                        senderId: user.uid,
                        senderName: user.profile?.name || 'User',
                        senderRole: userRole,
                        content: '',
                        type: 'file',
                        attachmentUrl: result.url,
                        attachmentName: result.name,
                        createdAt: new Date(),
                    },
                ]);
            }

            setSelectedFile(null);
            setUploadProgress(null);
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleReleaseFunds = async () => {
        if (!room) return;

        try {
            setReleasing(true);

            // Update escrow status to released - this also marks the room as completed
            await updateEscrowStatus(room.id, 'released');

            toast.success('Scholarship released successfully 🎉');
            setRoom({ ...room, escrowStatus: 'released', status: 'completed' });
            setShowReleaseModal(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to release funds');
        } finally {
            setReleasing(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        if (e.target.value.trim()) {
            startTyping();
        } else {
            stopTyping();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-xl font-semibold">Room not found</h2>
                <Button variant="link" onClick={() => router.push('/fellowships')}>
                    Back to challenges
                </Button>
            </div>
        );
    }

    const escrowStatus = ESCROW_STATUS_LABELS[room.escrowStatus];
    const typingUsersArray = Array.from(typingUsers.values());

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Back Button & Connection Status */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                            <Wifi className="mr-1 h-3 w-3" />
                            Live
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            <WifiOff className="mr-1 h-3 w-3" />
                            Offline
                        </Badge>
                    )}
                    {onlineUsers.length > 0 && (
                        <Badge variant="secondary">
                            {onlineUsers.length} online
                        </Badge>
                    )}
                </div>
            </div>ī

            {/* Escrow Banner */}
            <Card className={cn(
                "border-2",
                room.escrowStatus === 'held' && "border-teal-300 dark:border-teal-700",
                room.escrowStatus === 'released' && "border-green-300 dark:border-green-700",
                room.escrowStatus === 'disputed' && "border-red-300 dark:border-red-700"
            )}>
                <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            room.escrowStatus === 'held' && "bg-teal-100 dark:bg-teal-950",
                            room.escrowStatus === 'released' && "bg-green-100 dark:bg-green-950",
                            room.escrowStatus === 'disputed' && "bg-red-100 dark:bg-red-950"
                        )}>
                            {room.escrowStatus === 'held' ? (
                                <Lock className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                            ) : room.escrowStatus === 'released' ? (
                                <Unlock className="h-6 w-6 text-green-600 dark:text-green-400" />
                            ) : (
                                <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{escrowStatus.label}</p>
                            <p className="text-2xl font-bold flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" />
                                {room.escrowAmount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    {isCorporate && room.escrowStatus === 'held' && (
                        <Button
                            onClick={() => setShowReleaseModal(true)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Unlock className="mr-2 h-4 w-4" />
                            Release Funds
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Room Header */}
            <Card>
                <CardHeader>
                    <CardTitle>{room.challengeTitle}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <span className={cn(
                                "h-2 w-2 rounded-full",
                                onlineUsers.some(u => u.id === room.studentId)
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-gray-600"
                            )} />
                            Student: {room.studentName}
                            {onlineUsers.some(u => u.id === room.studentId) && (
                                <span className="text-xs text-green-600 dark:text-green-400">online</span>
                            )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-2">
                            <span className={cn(
                                "h-2 w-2 rounded-full",
                                onlineUsers.some(u => u.id === room.corporateId)
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-gray-600"
                            )} />
                            Company: {room.corporateName}
                            {onlineUsers.some(u => u.id === room.corporateId) && (
                                <span className="text-xs text-green-600 dark:text-green-400">online</span>
                            )}
                        </span>
                        <span>•</span>
                        <Badge variant="outline" className={escrowStatus.color}>
                            {room.status}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Messages Timeline */}
            <Card
                className="flex flex-col"
                style={{ height: '400px' }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <CardHeader className="border-b py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Project Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3",
                                    message.senderId === user?.uid && "flex-row-reverse"
                                )}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className={cn(
                                        message.type === 'milestone' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
                                        message.senderRole === 'corporate' && message.type !== 'milestone' && "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                                    )}>
                                        {message.type === 'milestone' ? '🎯' : message.senderName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "max-w-[70%] rounded-lg p-3",
                                    message.type === 'milestone' && "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
                                    message.type === 'file' && "bg-muted",
                                    message.type === 'text' && message.senderId === user?.uid && "bg-emerald-600 text-white",
                                    message.type === 'text' && message.senderId !== user?.uid && "bg-muted"
                                )}>
                                    {message.type === 'file' ? (
                                        <div className="flex items-center gap-3">
                                            {message.attachmentName && isImageFile(message.attachmentName) ? (
                                                <ImageIcon className="h-5 w-5 text-blue-500" />
                                            ) : (
                                                <FileIcon className="h-5 w-5 text-gray-500" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium truncate block">
                                                    {message.attachmentName}
                                                </span>
                                            </div>
                                            {message.attachmentUrl && (
                                                <a
                                                    href={message.attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-shrink-0"
                                                >
                                                    <Button variant="ghost" size="sm">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    )}
                                    <p className={cn(
                                        "mt-1 text-xs",
                                        message.senderId === user?.uid && message.type === 'text'
                                            ? "text-emerald-100"
                                            : "text-muted-foreground"
                                    )}>
                                        {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {typingUsersArray.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="flex space-x-1">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span>
                                    {typingUsersArray.length === 1
                                        ? `${typingUsersArray[0]} is typing...`
                                        : `${typingUsersArray.join(', ')} are typing...`
                                    }
                                </span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </CardContent>
            </Card>

            {/* File Upload Preview */}
            {selectedFile && (
                <Card>
                    <CardContent className="py-3">
                        <div className="flex items-center gap-3">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                            {uploading ? (
                                <div className="w-32">
                                    <Progress value={uploadProgress?.progress || 0} className="h-2" />
                                </div>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedFile(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleFileUpload}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Message Input */}
            {room.status === 'active' && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                title="Upload file"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Textarea
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={handleInputChange}
                                className="min-h-[80px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || sending}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Drag and drop files here or click the attachment icon. Max file size: 10MB
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Release Funds Modal */}
            <Dialog open={showReleaseModal} onOpenChange={setShowReleaseModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Release Funds</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to release ₹{room.escrowAmount.toLocaleString('en-IN')} to {room.studentName}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <p className="text-sm">
                            ⚠️ This action cannot be undone. Only release funds when you're satisfied with the work.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReleaseModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReleaseFunds}
                            disabled={releasing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {releasing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirm Release
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getMockRoom(id: string): ProjectRoom {
    return {
        id,
        challengeId: 'demo-1',
        challengeTitle: 'Design a Modern Logo for TechStart',
        studentId: 'student-1',
        studentName: 'Priya Sharma',
        corporateId: 'corp-1',
        corporateName: 'TechStart India',
        escrowStatus: 'held',
        escrowAmount: 5000,
        status: 'active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    };
}

function getMockMessages(roomId: string): RoomMessage[] {
    return [
        {
            id: 'msg-1',
            roomId,
            senderId: 'system',
            senderName: 'System',
            senderRole: 'corporate',
            content: "Project started! Priya Sharma's proposal was selected. ₹5,000 is now held in escrow.",
            type: 'milestone',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'msg-2',
            roomId,
            senderId: 'corp-1',
            senderName: 'Raj Kumar',
            senderRole: 'corporate',
            content: "Hi Priya! Welcome aboard. Looking forward to seeing your designs. Feel free to ask any questions about our brand.",
            type: 'text',
            createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'msg-3',
            roomId,
            senderId: 'student-1',
            senderName: 'Priya Sharma',
            senderRole: 'student',
            content: "Thank you Raj! I've started working on initial concepts. Could you share more about your target audience?",
            type: 'text',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'msg-4',
            roomId,
            senderId: 'student-1',
            senderName: 'Priya Sharma',
            senderRole: 'student',
            content: '',
            attachmentUrl: '/demo/design_v1.fig',
            attachmentName: 'TechStart_Logo_v1.fig',
            type: 'file',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'msg-5',
            roomId,
            senderId: 'corp-1',
            senderName: 'Raj Kumar',
            senderRole: 'corporate',
            content: "Great start! I love the direction. Can you try a version with more rounded corners?",
            type: 'text',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
    ];
}
