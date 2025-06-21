// Utility functions for handling downloads in chat
import jsPDF from 'jspdf';

export interface DownloadableFile {
    type: 'pdf' | 'document' | 'image';
    url: string;
    filename: string;
    size?: number;
    content?: string;
    base64Data?: string;
}

/**
 * Detects if a message contains downloadable content
 */
export const extractDownloadableContent = (
    messageText: string,
    pdfData?: { pdf_base64: string; pdf_size: number; direct_download_url: string },
    data?: Record<string, unknown>
): DownloadableFile | null => {
    if (data) {
        const possibleUrlFields = ['download_url', 'firebase_url', 'server_url', 'pdf_url', 'url'];
        let downloadUrl = '';

        for (const field of possibleUrlFields) {
            if (data[field] && typeof data[field] === 'string') {
                downloadUrl = data[field] as string;
                break;
            }
        }

        if (downloadUrl) {
            let filename = 'AI_Generated_Report.pdf';

            if (downloadUrl.includes('storage.googleapis.com') || downloadUrl.includes('firebasestorage.app')) {
                const urlPathMatch = downloadUrl.match(/\/([^/?]+\.pdf)/i);
                if (urlPathMatch) {
                    filename = decodeURIComponent(urlPathMatch[1]);
                }
            }

            if (filename === 'AI_Generated_Report.pdf') {
                const urlFilenameMatch = downloadUrl.match(/\/([^/]+\.pdf)$/i);
                if (urlFilenameMatch) {
                    filename = decodeURIComponent(urlFilenameMatch[1]);
                }
            }

            if (filename === 'AI_Generated_Report.pdf') {
                const filenameMatch = messageText.match(/(?:Business_|Report_|File_)([^.]+)\.pdf/i);
                if (filenameMatch) {
                    filename = filenameMatch[0];
                }
            }

            if (filename === 'AI_Generated_Report.pdf') {
                const periodMatch = messageText.match(/(?:Period|period):\s*(\w+)/i);
                if (periodMatch) {
                    filename = `Financial_Report_${periodMatch[1]}.pdf`;
                }
            }

            if (filename === 'AI_Generated_Report.pdf' && data.filename && typeof data.filename === 'string') {
                filename = data.filename.endsWith('.pdf') ? data.filename : `${data.filename}.pdf`;
            }

            return {
                type: 'pdf',
                url: downloadUrl,
                filename: filename,
                size: undefined
            };
        }
    }

    if (pdfData && (pdfData.direct_download_url || pdfData.pdf_base64)) {
        let filename = 'AI_Generated_Report.pdf';

        if (pdfData.direct_download_url) {
            const urlFilenameMatch = pdfData.direct_download_url.match(/\/([^/]+\.pdf)$/i);
            if (urlFilenameMatch) {
                filename = urlFilenameMatch[1];
            } else {
                const firebaseMatch = pdfData.direct_download_url.match(/reports\/[^/]+\/[^/]+\/([^/?]+\.pdf)/i);
                if (firebaseMatch) {
                    filename = firebaseMatch[1];
                }
            }
        }

        const filenameMatch = messageText.match(/(?:Business_|Report_|File_)([^.]+)\.pdf/i);
        if (filenameMatch) {
            filename = filenameMatch[0];
        }

        const periodMatch = messageText.match(/(?:Period|period):\s*(\w+)/i);
        if (periodMatch && filename === 'AI_Generated_Report.pdf') {
            filename = `Financial_Report_${periodMatch[1]}.pdf`;
        }

        return {
            type: 'pdf',
            url: pdfData.direct_download_url || '',
            filename: filename,
            size: pdfData.pdf_size || undefined,
            base64Data: pdfData.pdf_base64 || undefined
        };
    }

    const downloadPatterns = [
        /(?:report|document|file|pdf)\s+(?:is\s+)?(?:ready|available|generated)/i,
        /(?:download|access)\s+(?:your|the)\s+(?:report|document|file|pdf)/i,
        /(?:click|tap)\s+(?:here|below)\s+to\s+download/i,
        /(?:generated|created)\s+(?:a|your)\s+(?:report|document|pdf)/i,
        /(?:here.{0,10}s\s+(?:your|the|a)\s+(?:report|analysis|summary))/i,
        /financial\s+report\s+generated/i,
        /your\s+pdf\s+report/i,
        /ready\s+for\s+download/i
    ];

    const hasDownloadContent = downloadPatterns.some(pattern => pattern.test(messageText));

    if (hasDownloadContent) {
        const filenameMatch = messageText.match(/(?:report|document|file)[\s:]*["']?([^"'\n]+)["']?/i);
        const filename = filenameMatch ? filenameMatch[1].trim() : 'AI_Generated_Report.pdf';
        const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

        return {
            type: 'pdf',
            url: '',
            filename: finalFilename,
            size: undefined,
            content: messageText
        };
    }

    return null;
};

/**
 * Downloads a file from base64 data
 */
export const downloadFileFromBase64 = (base64Data: string, filename: string, mimeType: string = 'application/pdf'): boolean => {
    try {
        // Create blob from base64 using the exact recommended method
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        // Cleanup
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Download from base64 failed:', error);
        return false;
    }
};

/**
 * Downloads PDF from backend response
 */
export const downloadPDF = (response: { pdf_data: { pdf_base64: string; pdf_size: number; direct_download_url: string }; data?: { filename?: string } } | { status: string; message: string; pdf_data: { pdf_base64: string; pdf_size: number; direct_download_url: string }; data?: { filename?: string } }) => {
    const pdfData = response.pdf_data;
    const filename = response.data?.filename || 'AI_Generated_Report.pdf';

    if (response && pdfData && pdfData.pdf_base64) {
        const base64Data = pdfData.pdf_base64;

        try {
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error during PDF download:', error);
        }
    } else {
        console.error('Invalid response structure for PDF download', { response, hasPdfData: !!pdfData });
    }
};

/**
 * Downloads a file from a URL with Firebase Storage support
 */
export const downloadFile = async (url: string, filename: string): Promise<boolean> => {
    try {
        let fetchOptions: RequestInit = {
            method: 'GET'
        };

        if (url.includes('storage.googleapis.com') || url.includes('firebasestorage.app')) {
            fetchOptions = {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'application/pdf,application/*,*/*',
                }
            };

            if (!url.includes('token=') && !url.includes('alt=media')) {
                const separator = url.includes('?') ? '&' : '?';
                url = `${url}${separator}alt=media`;
            }
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText} (${response.status})`);
        }

        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error("Downloaded file is empty");
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        }, 100);

        return true;
    } catch (error) {
        console.error('Download failed:', error);

        if (url.includes('storage.googleapis.com') || url.includes('firebasestorage.app')) {
            try {
                let fallbackUrl = url;
                if (!fallbackUrl.includes('alt=media')) {
                    const separator = fallbackUrl.includes('?') ? '&' : '?';
                    fallbackUrl = `${fallbackUrl}${separator}alt=media`;
                }

                const link = document.createElement('a');
                link.href = fallbackUrl;
                link.target = '_blank';
                link.download = filename;
                link.rel = 'noopener noreferrer';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);

                return true;
            } catch (fallbackError) {
                console.error('Fallback download also failed:', fallbackError);
            }
        }

        return false;
    }
};

/**
 * Formats file size in human readable format
 */
export const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';

    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

/**
 * Generates a PDF from AI response content and returns a download URL
 */
export const generateReportPDF = (
    content: string,
    userId: string,
    sessionId: string,
    reportType: string = 'general'
): string => {
    try {
        // Create new PDF document
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text('AI Generated Report', 20, 30);

        // Add metadata
        doc.setFontSize(12);
        doc.text(`Report Type: ${reportType}`, 20, 50);
        doc.text(`User ID: ${userId}`, 20, 60);
        doc.text(`Session ID: ${sessionId}`, 20, 70);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 80);

        // Add content
        doc.setFontSize(11);
        const splitContent = doc.splitTextToSize(content, 170);
        doc.text(splitContent, 20, 100);

        // Generate blob and return URL
        const pdfBlob = doc.output('blob');
        const url = window.URL.createObjectURL(pdfBlob);

        return url;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF report');
    }
};

/**
 * Generates a download URL for reports with user/session context
 * @deprecated Use generateReportPDF instead for frontend PDF generation
 */
export const generateReportDownloadUrl = (
    userId: string,
    sessionId: string,
    reportType: string = 'general'
): string => {
    // This would be the actual endpoint where reports are generated
    return `http://127.0.0.1:8003/generate-report?user_id=${userId}&session_id=${sessionId}&type=${reportType}`;
};

/**
 * Downloads PDF directly from the complete backend response
 */
export const downloadPDFFromBackendResponse = (backendResponse: { pdf_data?: { pdf_base64: string; pdf_size: number; direct_download_url: string }; pdfData?: { pdf_base64: string; pdf_size: number; direct_download_url: string }; data?: { filename?: string } }) => {
    if (backendResponse && typeof backendResponse === 'object') {
        // Check if it has the pdf_data directly
        if (backendResponse.pdf_data) {
            downloadPDF({
                pdf_data: backendResponse.pdf_data,
                data: backendResponse.data
            });
        }
        // Check if it's wrapped in a data structure
        else if (backendResponse.pdfData) {
            downloadPDF({
                pdf_data: backendResponse.pdfData,
                data: { filename: 'AI_Generated_Report.pdf' }
            });
        }
        else {
            console.error('No PDF data found in backend response', backendResponse);
        }
    } else {
        console.error('Invalid backend response for PDF download');
    }
};

/**
 * Test Firebase Storage URL accessibility
 */
export const testFirebaseStorageUrl = async (url: string): Promise<{ accessible: boolean; details: Record<string, unknown> }> => {
    try {
        let testUrl = url;
        if (!testUrl.includes('alt=media')) {
            const separator = testUrl.includes('?') ? '&' : '?';
            testUrl = `${testUrl}${separator}alt=media`;
        }

        const response = await fetch(testUrl, {
            method: 'HEAD',
            mode: 'cors',
            credentials: 'omit'
        });

        const details = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
            testUrl: testUrl
        };

        return {
            accessible: response.ok,
            details
        };
    } catch (error) {
        return {
            accessible: false,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
};


