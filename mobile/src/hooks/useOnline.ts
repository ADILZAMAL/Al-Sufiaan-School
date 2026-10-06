import { useNetInfo } from '@react-native-community/netinfo';

/** False only when the device is known to be offline (unknown counts as online). */
export const useOnline = () => useNetInfo().isConnected !== false;
