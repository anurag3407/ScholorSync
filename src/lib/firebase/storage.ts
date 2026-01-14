import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export interface UploadProgress {
    progress: number;
    state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface UploadResult {
    url: string;
    path: string;
    name: string;
    size: number;
    type: string;
}

export async function uploadChatFile(
    roomId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    if (!isFirebaseConfigured) {
        throw new Error('Firebase Storage is not configured');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `chat-files/${roomId}/${timestamp}-${safeName}`;
    const storageRef = ref(storage, filePath);

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
        });

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                let state: UploadProgress['state'] = 'running';

                switch (snapshot.state) {
                    case 'paused':
                        state = 'paused';
                        break;
                    case 'running':
                        state = 'running';
                        break;
                }

                onProgress?.({ progress, state });
            },
            (error) => {
                console.error('Upload error:', error);
                onProgress?.({ progress: 0, state: 'error' });
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    onProgress?.({ progress: 100, state: 'success' });
                    resolve({
                        url: downloadURL,
                        path: filePath,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}


export async function getChatFileUrl(path: string): Promise<string> {
    if (!isFirebaseConfigured) {
        throw new Error('Firebase Storage is not configured');
    }

    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
}

export async function deleteChatFile(path: string): Promise<void> {
    if (!isFirebaseConfigured) {
        throw new Error('Firebase Storage is not configured');
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
}


export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}


export function isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    return imageExtensions.includes(getFileExtension(filename));
}


export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
