import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Letters, digits, dash and underscore only — safe on both platforms. */
const safeFileName = (name: string) => name.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 80);

/**
 * Renders HTML to a PDF and opens the share sheet (WhatsApp, Files, print…).
 * Returns the saved file URI.
 */
export const shareHtmlAsPdf = async (html: string, fileName: string): Promise<string> => {
  const { uri: tempUri } = await Print.printToFileAsync({ html });
  const destUri = `${FileSystem.documentDirectory}${safeFileName(fileName)}.pdf`;
  await FileSystem.deleteAsync(destUri, { idempotent: true });
  await FileSystem.copyAsync({ from: tempUri, to: destUri });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(`Sharing isn't available on this device. The PDF was saved to ${destUri}`);
  }
  await Sharing.shareAsync(destUri, {
    mimeType: 'application/pdf',
    ...(Platform.OS === 'ios' ? { UTI: 'com.adobe.pdf' } : {}),
    dialogTitle: fileName,
  });
  return destUri;
};

export { escapeHtml } from './escapeHtml';
