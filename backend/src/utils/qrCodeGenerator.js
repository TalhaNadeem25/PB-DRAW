import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from '../config/cloudinary.js';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import https from 'https';

/**
 * Generate unique ticket code
 * @returns {string} - UUID ticket code
 */
export const generateTicketCode = () => {
  return uuidv4();
};

/**
 * Generate QR code image and upload to Cloudinary
 * @param {string} ticketCode - Unique ticket code
 * @param {string} paymentId - Payment ID
 * @returns {string} - Cloudinary URL
 */
export const generateQRCode = async (ticketCode, paymentId) => {
  try {
    // QR code data: JSON with ticket code and payment ID
    const qrData = JSON.stringify({
      ticketCode,
      paymentId,
      type: 'tournament-ticket'
    });

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'tickets/qr-codes',
          resource_type: 'image',
          public_id: `ticket-qr-${paymentId}`,
          overwrite: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      Readable.from(qrBuffer).pipe(uploadStream);
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate PDF ticket with QR code
 * @param {object} params - Ticket parameters
 * @returns {string} - Cloudinary URL for PDF
 */
export const generateTicketPDF = async ({
  ticketCode,
  qrCodeUrl,
  playerName,
  tournamentName,
  eventNames,
  tournamentLocation,
  eventDate,
  paymentId
}) => {
  try {
    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);

          // Cloudinary blocks delivery of raw PDF/ZIP files under the regular
          // "upload" delivery type by default (its "Restricted media types"
          // security setting) — confirmed this applies even to signed CDN
          // delivery URLs (cloudinary.url with sign_url: true), not just
          // unsigned ones. The only combination that actually works is
          // uploading under the "authenticated" delivery type AND serving it
          // via Cloudinary's raw/download API endpoint (private_download_url)
          // rather than the normal res.cloudinary.com CDN URL — the CDN path
          // stays blocked even for authenticated+signed resources, but the
          // API download endpoint is exempt.
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'tickets/pdfs',
                resource_type: 'raw',
                type: 'authenticated',
                public_id: `ticket-${paymentId}`,
                format: 'pdf',
                overwrite: true
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );

            Readable.from(pdfBuffer).pipe(uploadStream);
          });

          // Cloudinary's private_download_url embeds a timestamp that expires
          // after about an hour — it can't be generated once here and stored
          // permanently on the Payment record. Store our own backend's proxy
          // URL instead; that route (GET /api/payments/:id/ticket-pdf) mints a
          // fresh Cloudinary download URL on every request, so the link we
          // actually persist/email never itself expires.
          const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}/api`;
          const downloadUrl = `${apiBaseUrl}/payments/${paymentId}/ticket-pdf`;

          resolve(downloadUrl);
        } catch (error) {
          reject(error);
        }
      });

      doc.on('error', reject);

      // PDF Design - PB Draw Branded Ticket
      // Header with court green accent
      doc
        .rect(0, 0, doc.page.width, 10)
        .fillAndStroke('#16a34a', '#16a34a');

      doc.moveDown(2);

      // Logo/Title
      doc
        .fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text('PB Draw', { align: 'center' });

      doc
        .moveDown(0.3)
        .fontSize(18)
        .font('Helvetica')
        .fillColor('#16a34a')
        .text('Tournament Ticket', { align: 'center' });

      doc.moveDown(2);

      // Ticket Details Section
      const leftMargin = 100;
      doc.fontSize(12).fillColor('#000000');

      // Player Name
      doc
        .font('Helvetica-Bold')
        .text('Player:', leftMargin, doc.y, { continued: true, width: 100 });
      doc
        .font('Helvetica')
        .fillColor('#374151')
        .text(` ${playerName}`, { width: 400 });

      doc.moveDown(0.8);

      // Tournament Name
      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Tournament:', leftMargin, doc.y, { continued: true, width: 100 });
      doc
        .font('Helvetica')
        .fillColor('#374151')
        .text(` ${tournamentName}`, { width: 400 });

      doc.moveDown(0.8);

      // Event Names
      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Event(s):', leftMargin, doc.y, { continued: true, width: 100 });
      doc
        .font('Helvetica')
        .fillColor('#374151')
        .text(` ${Array.isArray(eventNames) ? eventNames.join(', ') : eventNames}`, { width: 400 });

      doc.moveDown(0.8);

      // Location
      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Location:', leftMargin, doc.y, { continued: true, width: 100 });
      doc
        .font('Helvetica')
        .fillColor('#374151')
        .text(` ${tournamentLocation}`, { width: 400 });

      doc.moveDown(0.8);

      // Date
      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Date:', leftMargin, doc.y, { continued: true, width: 100 });
      doc
        .font('Helvetica')
        .fillColor('#374151')
        .text(` ${new Date(eventDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`, { width: 400 });

      doc.moveDown(3);

      // QR Code Section
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#16a34a')
        .text('Scan to Check In', { align: 'center' });

      doc.moveDown(1);

      // Fetch and embed QR code image
      try {
        // Fetch QR code image from Cloudinary using https
        const qrImageBuffer = await new Promise((resolve, reject) => {
          https.get(qrCodeUrl, (response) => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
          }).on('error', reject);
        });

        // Center the QR code
        const qrSize = 200;
        const centerX = (doc.page.width - qrSize) / 2;

        doc.image(qrImageBuffer, centerX, doc.y, {
          width: qrSize,
          height: qrSize
        });

        doc.moveDown(13);
      } catch (error) {
        console.error('Error embedding QR code in PDF:', error);
        // Continue without QR image
        doc.moveDown(10);
      }

      // Ticket Code
      doc
        .fontSize(10)
        .font('Courier')
        .fillColor('#6b7280')
        .text(`Ticket Code: ${ticketCode}`, { align: 'center' });

      doc.moveDown(2);

      // Instructions
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#9ca3af')
        .text('Please present this ticket at check-in', { align: 'center' });

      doc.moveDown(0.5);

      // Footer
      doc
        .fontSize(8)
        .fillColor('#d1d5db')
        .text('© 2025 PB Draw. All rights reserved.', { align: 'center' });

      // Bottom accent bar
      doc
        .rect(0, doc.page.height - 10, doc.page.width, 10)
        .fillAndStroke('#16a34a', '#16a34a');

      doc.end();
    });
  } catch (error) {
    console.error('Error generating PDF ticket:', error);
    throw new Error('Failed to generate PDF ticket');
  }
};
