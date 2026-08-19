import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

class HapticsService {
  private isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /** Subtle light click (button press, segmented tab change) */
  async tapLight() {
    if (!this.isSupported()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Ignore on unsupported devices
    }
  }

  /** Medium click (slider presets, toggles) */
  async tapMedium() {
    if (!this.isSupported()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Ignore
    }
  }

  /** Heavy impact (actuator start/stop) */
  async tapHeavy() {
    if (!this.isSupported()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      // Ignore
    }
  }

  /** Success notification (alarm acknowledged, server connected) */
  async success() {
    if (!this.isSupported()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Ignore
    }
  }

  /** Warning notification (pressure high, leak risk) */
  async warning() {
    if (!this.isSupported()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // Ignore
    }
  }

  /** Error / Critical notification (E-Stop engaged, burst pipe) */
  async critical() {
    if (!this.isSupported()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      // Ignore
    }
  }

  /** Selection tick (continuous slider change) */
  async selection() {
    if (!this.isSupported()) return;
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // Ignore
    }
  }
}

export const hapticsService = new HapticsService();
