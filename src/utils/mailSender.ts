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
  photosCount: number;
}): Promise<SendEmailResult> {
  const targetEmail = 'k.jf.mariage@gmail.com';
  const privacyText = entry.isPrivate ? '🔒 Réservé uniquement aux mariés' : '✨ Public';

  // Public shared URL accessible to everyone without Google Cloud developer login
  const publicSharedUrl = 'https://ais-pre-wlwp7iknqhw2wx6h2d63hg-654419133795.europe-west2.run.app';

  try {
    const payload = {
      _subject: `Nouveau souvenir de mariage de ${entry.author} (${privacyText})`,
      _captcha: 'false',
      _template: 'table',
      _next: publicSharedUrl,
      _url: publicSharedUrl,
      Expéditeur: entry.author,
      Date: entry.date,
      Visibilité: privacyText,
      Message: entry.message,
      Photos_jointes: `${entry.photosCount} photo(s)`,
      Lien_du_livre_d_or: publicSharedUrl
    };

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
