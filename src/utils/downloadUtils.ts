// Utility functions for handling downloads in chat
import jsPDF from 'jspdf';

export interface DownloadableFile {
    type: 'pdf' | 'document' | 'image';
    url: string;
    filename: string;
    size?: number;
    content?: string; // Add content field for PDF generation
    base64Data?: string; // Add base64 data field for backend-provided PDFs
}

/**
 * Detects if a message contains downloadable content
 * Looks for patterns like "report is ready", "download your", etc.
 */
export const extractDownloadableContent = (
    messageText: string, 
    pdfData?: { pdf_base64: string; pdf_size: number; direct_download_url: string },
    data?: Record<string, unknown>
): DownloadableFile | null => {
    // PRIORITY 1: Check if data object has download URLs
    if (data) {
        console.log("🔍 EXTRACT DOWNLOAD - Checking data object for download URLs:", data);
        
        // Look for common URL fields in the data object
        const possibleUrlFields = ['download_url', 'firebase_url', 'server_url', 'pdf_url', 'url'];
        let downloadUrl = '';
        
        for (const field of possibleUrlFields) {
            if (data[field] && typeof data[field] === 'string') {
                downloadUrl = data[field] as string;
                console.log(`✅ EXTRACT DOWNLOAD - Found download URL in data.${field}:`, downloadUrl);
                break;
            }
        }
        
        if (downloadUrl) {
            // Extract filename from URL or message
            let filename = 'AI_Generated_Report.pdf';
            
            // PRIORITY 1: Try to extract filename from Firebase Storage URL path
            if (downloadUrl.includes('storage.googleapis.com') || downloadUrl.includes('firebasestorage.app')) {
                // Firebase Storage URLs have the format: .../path/to/filename.pdf?...
                const urlPathMatch = downloadUrl.match(/\/([^/?]+\.pdf)/i);
                if (urlPathMatch) {
                    filename = decodeURIComponent(urlPathMatch[1]); // Decode any URL encoding
                    console.log("📂 Extracted filename from Firebase Storage path:", filename);
                }
            }
            
            // PRIORITY 2: Try to extract filename from general URL path
            if (filename === 'AI_Generated_Report.pdf') {
                const urlFilenameMatch = downloadUrl.match(/\/([^/]+\.pdf)$/i);
                if (urlFilenameMatch) {
                    filename = decodeURIComponent(urlFilenameMatch[1]);
                    console.log("📁 Extracted filename from URL path:", filename);
                }
            }
            
            // PRIORITY 3: Try to extract filename from message text
            if (filename === 'AI_Generated_Report.pdf') {
                const filenameMatch = messageText.match(/(?:Business_|Report_|File_)([^.]+)\.pdf/i);
                if (filenameMatch) {
                    filename = filenameMatch[0];
                    console.log("📝 Extracted filename from message text:", filename);
                }
            }
            
            // PRIORITY 4: Build filename from period mentions in message
            if (filename === 'AI_Generated_Report.pdf') {
                const periodMatch = messageText.match(/(?:Period|period):\s*(\w+)/i);
                if (periodMatch) {
                    filename = `Financial_Report_${periodMatch[1]}.pdf`;
                    console.log("📅 Built filename from period:", filename);
                }
            }
            
            // PRIORITY 5: Use data object filename if available
            if (filename === 'AI_Generated_Report.pdf' && data.filename && typeof data.filename === 'string') {
                filename = data.filename.endsWith('.pdf') ? data.filename : `${data.filename}.pdf`;
                console.log("📊 Using filename from data object:", filename);
            }
            
            console.log("✅ EXTRACT DOWNLOAD - Data object detected, creating download button:", {
                filename,
                downloadUrl: downloadUrl,
                urlPreview: downloadUrl.substring(0, 100) + "...",
                dataKeys: Object.keys(data)
            });
            
            return {
                type: 'pdf',
                url: downloadUrl,
                filename: filename,
                size: undefined
            };
        } else {
            console.log("⚠️ EXTRACT DOWNLOAD - Data object exists but no download URLs found:", Object.keys(data));
        }
    }

    // PRIORITY 2: If we have PDF data from the backend, create a downloadable file
    if (pdfData && (pdfData.direct_download_url || pdfData.pdf_base64)) {
        // Extract filename from message or use default
        let filename = 'AI_Generated_Report.pdf';

        // Try to extract filename from URL first
        if (pdfData.direct_download_url) {
            const urlFilenameMatch = pdfData.direct_download_url.match(/\/([^/]+\.pdf)$/i);
            if (urlFilenameMatch) {
                filename = urlFilenameMatch[1];
            } else {
                // Handle Firebase Storage URLs with path structure
                const firebaseMatch = pdfData.direct_download_url.match(/reports\/[^/]+\/[^/]+\/([^/?]+\.pdf)/i);
                if (firebaseMatch) {
                    filename = firebaseMatch[1];
                }
            }
        }

        // Try to extract filename from message text
        const filenameMatch = messageText.match(/(?:Business_|Report_|File_)([^.]+)\.pdf/i);
        if (filenameMatch) {
            filename = filenameMatch[0];
        }

        // Also try to extract from period mentions
        const periodMatch = messageText.match(/(?:Period|period):\s*(\w+)/i);
        if (periodMatch && filename === 'AI_Generated_Report.pdf') {
            filename = `Financial_Report_${periodMatch[1]}.pdf`;
        }

        console.log("✅ PDF data detected, creating download button:", {
            filename,
            hasUrl: !!pdfData.direct_download_url,
            hasBase64: !!pdfData.pdf_base64,
            size: pdfData.pdf_size,
            actualUrl: pdfData.direct_download_url,
            urlPreview: pdfData.direct_download_url ? pdfData.direct_download_url.substring(0, 100) + "..." : "No URL"
        });

        return {
            type: 'pdf',
            url: pdfData.direct_download_url || '', // Use direct download URL if available
            filename: filename,
            size: pdfData.pdf_size || undefined,
            base64Data: pdfData.pdf_base64 || undefined // Can be empty for URL-only downloads
        };
    }

    // Enhanced fallback to text-based detection for legacy support
    const downloadPatterns = [
        /(?:report|document|file|pdf)\s+(?:is\s+)?(?:ready|available|generated)/i,
        /(?:download|access)\s+(?:your|the)\s+(?:report|document|file|pdf)/i,
        /(?:click|tap)\s+(?:here|below)\s+to\s+download/i,
        /(?:generated|created)\s+(?:a|your)\s+(?:report|document|pdf)/i,
        /(?:here.{0,10}s\s+(?:your|the|a)\s+(?:report|analysis|summary))/i,
        /financial\s+report\s+generated/i, // Add specific pattern for financial reports
        /your\s+pdf\s+report/i, // Add pattern for PDF reports
        /ready\s+for\s+download/i // Add pattern for download ready messages
    ];

    // Check if message contains download indicators
    const hasDownloadContent = downloadPatterns.some(pattern => pattern.test(messageText));

    if (hasDownloadContent) {
        // Try to extract filename from message
        const filenameMatch = messageText.match(/(?:report|document|file)[\s:]*["']?([^"'\n]+)["']?/i);
        const filename = filenameMatch ? filenameMatch[1].trim() : 'AI_Generated_Report.pdf';

        // Ensure filename has .pdf extension
        const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

        return {
            type: 'pdf',
            url: '', // Will be populated when PDF is generated
            filename: finalFilename,
            size: undefined, // Will be set when file is actually generated
            content: messageText // Store the full message content for PDF generation
        };
    }

    return null;
};

/**
 * Downloads a file from base64 data using the exact recommended implementation
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
 * Downloads PDF from backend response - exact implementation as recommended
 */
export const downloadPDF = (response: { pdf_data: { pdf_base64: string; pdf_size: number; direct_download_url: string }; data?: { filename?: string } } | { status: string; message: string; pdf_data: { pdf_base64: string; pdf_size: number; direct_download_url: string }; data?: { filename?: string } }) => {
    // Handle both simplified response structure and full backend response
    const pdfData = response.pdf_data;
    const filename = response.data?.filename || 'AI_Generated_Report.pdf';

    if (response && pdfData && pdfData.pdf_base64) {
        const base64Data = pdfData.pdf_base64;

        console.log('Downloading PDF:', filename);
        console.log('Base64 data length:', base64Data.length);

        try {
            // Convert base64 to binary
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create blob and download
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();

            URL.revokeObjectURL(url);
            console.log('PDF download completed successfully');
        } catch (error) {
            console.error('Error during PDF download:', error);
        }
    } else {
        console.error('Invalid response structure for PDF download', { response, hasPdfData: !!pdfData });
    }
};

/**
 * Downloads a file from a URL with enhanced Firebase Storage support
 */
export const downloadFile = async (url: string, filename: string): Promise<boolean> => {
    try {
        console.log("🔽 Starting download with URL:", {
            url: url,
            filename: filename,
            urlLength: url.length,
            isFirebaseStorage: url.includes('storage.googleapis.com'),
            isFirebaseApp: url.includes('firebasestorage.app')
        });

        // Enhanced Firebase Storage URL handling
        let fetchOptions: RequestInit = {
            method: 'GET'
        };
        
        if (url.includes('storage.googleapis.com') || url.includes('firebasestorage.app')) {
            console.log("🔥 Detected Firebase Storage URL, using enhanced options");
            fetchOptions = {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit', // Don't send credentials for Firebase Storage
                headers: {
                    'Accept': 'application/pdf,application/*,*/*',
                }
            };
            
            // Add download token if not present in URL for Firebase Storage
            if (!url.includes('token=') && !url.includes('alt=media')) {
                console.log("🔧 Adding alt=media parameter for Firebase Storage");
                const separator = url.includes('?') ? '&' : '?';
                url = `${url}${separator}alt=media`;
            }
        }

        console.log("📡 Making fetch request with options:", {
            url: url.substring(0, 100) + "...",
            fetchOptions
        });

        const response = await fetch(url, fetchOptions);
        
        console.log("📨 Response received:", {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
        });

        if (!response.ok) {
            console.error("❌ Download fetch failed:", {
                status: response.status,
                statusText: response.statusText,
                url: url.substring(0, 100) + "...",
                headers: Object.fromEntries(response.headers.entries())
            });
            throw new Error(`Failed to download: ${response.statusText} (${response.status})`);
        }

        console.log("✅ Fetch successful, creating blob...");
        const blob = await response.blob();
        
        console.log("📄 File details:", {
            blobSize: blob.size,
            blobType: blob.type,
            filename: filename,
            sizeFormatted: formatFileSize(blob.size)
        });

        // Verify we have a valid PDF blob
        if (blob.size === 0) {
            throw new Error("Downloaded file is empty");
        }

        const downloadUrl = window.URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        }, 100);

        console.log("✅ Download completed successfully");
        return true;
    } catch (error) {
        console.error('❌ Download failed with fetch method:', error);
        
        // Enhanced fallback for Firebase Storage URLs
        if (url.includes('storage.googleapis.com') || url.includes('firebasestorage.app')) {
            console.log("🔄 Trying enhanced fallback for Firebase Storage URL");
            try {
                // Ensure URL has proper download parameters
                let fallbackUrl = url;
                if (!fallbackUrl.includes('alt=media')) {
                    const separator = fallbackUrl.includes('?') ? '&' : '?';
                    fallbackUrl = `${fallbackUrl}${separator}alt=media`;
                }
                
                console.log("🔗 Opening Firebase URL with alt=media:", fallbackUrl.substring(0, 100) + "...");
                
                // Create a temporary link that opens the direct download URL
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
                
                console.log("✅ Fallback download initiated - file should download automatically");
                return true;
            } catch (fallbackError) {
                console.error('❌ Fallback download also failed:', fallbackError);
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
 * This is a helper function for when you have the full response from askAiAssistant
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
    console.log("🧪 Testing Firebase Storage URL accessibility:", url);
    
    try {
        // Add alt=media if not present
        let testUrl = url;
        if (!testUrl.includes('alt=media')) {
            const separator = testUrl.includes('?') ? '&' : '?';
            testUrl = `${testUrl}${separator}alt=media`;
        }
        
        const response = await fetch(testUrl, {
            method: 'HEAD', // Just check headers, don't download content
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
        
        console.log("🧪 Firebase URL test result:", details);
        
        return {
            accessible: response.ok,
            details
        };
    } catch (error) {
        console.error("🧪 Firebase URL test failed:", error);
        return {
            accessible: false,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
};


