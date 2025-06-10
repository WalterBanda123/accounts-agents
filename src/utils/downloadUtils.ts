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
export const extractDownloadableContent = (messageText: string, pdfData?: { pdf_base64: string; pdf_size: number; direct_download_url: string }): DownloadableFile | null => {
    // If we have PDF data from the backend, use that
    if (pdfData && pdfData.pdf_base64) {
        // Extract filename from message or use default
        const filenameMatch = messageText.match(/(?:Business_|Report_|File_)([^.]+)\.pdf/i);
        const filename = filenameMatch ? filenameMatch[0] : 'AI_Generated_Report.pdf';
        
        return {
            type: 'pdf',
            url: pdfData.direct_download_url || '', // Use direct download URL if available
            filename: filename,
            size: pdfData.pdf_size,
            base64Data: pdfData.pdf_base64
        };
    }

    // Fallback to text-based detection for legacy support
    const downloadPatterns = [
        /(?:report|document|file|pdf)\s+(?:is\s+)?(?:ready|available|generated)/i,
        /(?:download|access)\s+(?:your|the)\s+(?:report|document|file|pdf)/i,
        /(?:click|tap)\s+(?:here|below)\s+to\s+download/i,
        /(?:generated|created)\s+(?:a|your)\s+(?:report|document|pdf)/i,
        /(?:here.{0,10}s\s+(?:your|the|a)\s+(?:report|analysis|summary))/i
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
 * Downloads a file from a URL
 */
export const downloadFile = async (url: string, filename: string): Promise<boolean> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return true;
    } catch (error) {
        console.error('Download failed:', error);
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


