import JSZip from 'jszip';
import { GuestbookEntry } from '../types';

/**
 * Downloads all photos from guestbook entries in a single ZIP archive
 */
export async function downloadAllPhotosZip(entries: GuestbookEntry[]): Promise<{ count: number }> {
  const zip = new JSZip();
  let photoCount = 0;

  // Folder for photos
  const photosFolder = zip.folder('photos_mariage_katia_jean_francois');

  // Text summary of entries
  let recapitulatif = `LIVRE D'OR DE MARIAGE - KATIA & JEAN-FRANÇOIS\n`;
  recapitulatif += `Archive photos générée le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n`;
  recapitulatif += `Email de réception : k.jf.mariage@gmail.com\n\n`;
  recapitulatif += `====================================================\n\n`;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    recapitulatif += `[Souvenir #${i + 1}] Par : ${entry.author} (${entry.date})\n`;
    recapitulatif += `Statut : ${entry.isPrivate ? 'Réservé uniquement aux mariés (Privé)' : 'Public'}\n`;
    recapitulatif += `Message :\n${entry.message}\n`;

    if (entry.photos && entry.photos.length > 0) {
      recapitulatif += `Photos jointes (${entry.photos.length}) :\n`;

      for (let p = 0; p < entry.photos.length; p++) {
        const photo = entry.photos[p];
        photoCount++;

        // Clean author name for filename
        const safeAuthor = entry.author
          .toLowerCase()
          .replace(/[^a-z0-9]/gi, '_')
          .slice(0, 20);
        
        // Clean original filename
        const safeName = (photo.name || `photo_${p + 1}.jpg`)
          .replace(/[^a-z0-9._-]/gi, '_');

        const fileName = `${String(photoCount).padStart(2, '0')}_${safeAuthor}_${safeName}`;
        recapitulatif += `  - ${fileName}\n`;

        // Extract base64 data
        let base64Data = photo.url;
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }

        if (photosFolder && base64Data) {
          photosFolder.file(fileName, base64Data, { base64: true });
        }
      }
    }

    recapitulatif += `\n----------------------------------------------------\n\n`;
  }

  zip.file('recapitulatif_souvenirs_mariage.txt', recapitulatif);

  if (photoCount === 0) {
    // If no photos yet, add a small placeholder text file
    zip.file('aucune_photo.txt', 'Aucune photo n\'a encore été ajoutée dans le livre d\'or.');
  }

  // Generate ZIP file
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // Trigger download
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `photos-mariage-katia-jean-francois-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { count: photoCount };
}
