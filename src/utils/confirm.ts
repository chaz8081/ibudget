import { Alert, Platform } from "react-native";

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type ConfirmState = {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
};

type Listener = (state: ConfirmState) => void;

let listener: Listener | null = null;

export function setConfirmListener(fn: Listener | null) {
  listener = fn;
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
) {
  // On native, use the real Alert.alert
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  // On web, if no buttons or just OK button, use simple alert dialog
  if (!buttons || buttons.length <= 1) {
    Alert.alert(title, message, buttons);
    return;
  }

  // On web with multiple buttons, show custom dialog
  if (listener) {
    listener({
      visible: true,
      title,
      message: message || "",
      buttons,
    });
  } else {
    // Fallback if no listener registered
    Alert.alert(title, message, buttons);
  }
}
