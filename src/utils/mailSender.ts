import { PhotoAttachment } from '../types';

/**
 * Sends a guestbook entry notification to the wedding mailbox: k.jf.mariage@gmail.com
 */
export interface SendEmailResult {
  success: boolean;
  message?: string;
}

export async function sendEntryByEmail(entry: {
  author: string;
  message: string;
  date: string;
  isPrivate?: boolean;
  photos?: PhotoAttachment[];
}): Promise<SendEmailResult> {
  const targetEmail = 'k.jf.mariage@gmail.com';
  const privacyText = entry.isPrivate ? '🔒 Réservé uniquement aux mariés' : '✨ Public';

  // Detect current site URL dynamically so it works on Vercel, Cloud Run, or custom domains
  let currentSiteUrl = 'https://wedding-beta-one-11.vercel.app';
  if (typeof window !== 'undefined' && window.location?.origin) {
    // Avoid preview internal iframe if possible, prefer known live domain or current origin
    currentSiteUrl = window.location.origin;
  }

  const photos = entry.photos || [];

  try {
    const payload: Record<string, any> = {
      _subject: `Nouveau souvenir de mariage de ${entry.author} (${privacyText})`,
      _captcha: 'false',
      _template: 'table',
      _next: currentSiteUrl,
      _url: currentSiteUrl,
      Expéditeur: entry.author,
      Date: entry.date,
      Visibilité: privacyText,
      Message: entry.message,
      Photos_jointes: photos.length > 0 ? `${photos.length} photo(s) jointe(s)` : 'Aucune photo',
      Lien_du_livre_d_or: currentSiteUrl,
    };

    // FormSubmit allows sending photo attachments or base64 files
    // Include the first photo data/name if attached
    if (photos.length > 0) {
      photos.slice(0, 3).forEach((p, idx) => {
        // If image is base64, include a readable preview snippet or filename
        payload[`Photo_${idx + 1}`] = p.name || `Photo ${idx + 1}`;
        // FormSubmit supports direct file URL or image data
        if (p.url && p.url.startsWith('data:image')) {
          // Provide image preview html or reference
          payload[`Apercu_Photo_${idx + 1}`] = p.url.length > 500000 
            ? `${p.name} (fichier image disponible directement sur le livre d'or)`
            : p.url;
        }
      });
    }

    const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return { success: true, message: 'Message transmis à k.jf.mariage@gmail.com' };
    } else {
      console.warn('Mail dispatch warning:', await response.text());
      return { success: false, message: 'Notification automatique en attente de confirmation' };
    }
  } catch (error) {
    console.warn('Could not dispatch mail automatically:', error);
    return { success: false, message: 'Envoi direct indisponible hors-ligne' };
  }
}

/**
 * Creates a mailto link prefilled with the memory details for k.jf.mariage@gmail.com
 */
export function createMailtoLink(entry: {
  author: string;
  message: string;
  isPrivate?: boolean;
}): string {
  const targetEmail = 'k.jf.mariage@gmail.com';
  const subject = encodeURIComponent(`Souvenir de mariage de ${entry.author} ${entry.isPrivate ? '(Réservé aux mariés)' : ''}`);
  const body = encodeURIComponent(
    `Bonjour Katia & Jean-François,\n\nVoici le message laissé par ${entry.author} pour votre mariage :\n\n"${entry.message}"\n\nStatut : ${
      entry.isPrivate ? 'Réservé uniquement aux mariés' : 'Public dans le livre d\'or'
    }`
  );

  return `mailto:${targetEmail}?subject=${subject}&body=${body}`;
}
