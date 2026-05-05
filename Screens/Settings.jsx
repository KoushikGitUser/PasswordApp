import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  TextInput,
  InteractionManager,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import { ScrollView } from "react-native-gesture-handler";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { saveAutoLockSetting } from "../autolockService";
import * as LocalAuthentication from "expo-local-authentication";

// Note: Some icon libraries don't support setNativeProps, so we use cross-fade technique instead
import {
  pickAndReadBackupFile,
  decryptBackupEnvelope,
  commitBackupPayload,
  finishImportFlow,
} from "../importBackup";
import {
  isAutofillSupported,
  isAutofillEnabled,
  openAutofillPicker,
} from "../Services/autofill";
import { setSkipLock, clearPasswords, getPasswords } from "../utils";
import { generateBackup } from "../backUpGenerator";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Info, RefreshCw, ShieldCheck, ShieldX, Trash, Sun, Moon, Smartphone } from "lucide-react-native";
import { BlurView } from "@react-native-community/blur";
import * as SecureStore from "expo-secure-store";
import { triggerToast } from "../Services/toast";
import { useTheme } from "../theme/ThemeContext";
import { getButtonStyles } from "../styles/buttonStyles";
import { getElevation, ELEVATION_LEVELS } from "../styles/elevationStyles";

const Settings = ({
  onDataAdded,
  setEnableAutoLock,
  autoLockDisabled,
  setautoLockDisabled,
  enableAutoLock,
  navigation,
  route,
}) => {
  const { theme, themeMode, setThemeMode, colors, isDark } = useTheme();
  const dynamicButtons = getButtonStyles(colors);

  const [backUpModalVisible, setbackUpModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [backupLoader, setBackupLoader] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);
  const [securityPinModalVisible, setSecurityPinModalVisible] = useState(false);
  const [pinInputModalVisible, setPinInputModalVisible] = useState(false);
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [isSecurityPinSet, setIsSecurityPinSet] = useState(false);
  const [pinMode, setPinMode] = useState("set"); // "set", "update", "delete"
  const [deletePinModalVisible, setDeletePinModalVisible] = useState(false);
  const [deleteAllDataModalVisible, setDeleteAllDataModalVisible] = useState(false);
  const [deleteAllPinInputModalVisible, setDeleteAllPinInputModalVisible] = useState(false);
  const [deleteAllPinDigits, setDeleteAllPinDigits] = useState(["", "", "", "", "", ""]);
  const deleteAllPinInputRefs = useRef([]);
  const pinInputRefs = useRef([]);

  const [exportPassphraseModalVisible, setExportPassphraseModalVisible] = useState(false);
  const [importPassphraseModalVisible, setImportPassphraseModalVisible] = useState(false);
  const [importModeModalVisible, setImportModeModalVisible] = useState(false);
  const [importMode, setImportMode] = useState("replace"); // "replace" or "merge"
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportPassphraseConfirm, setExportPassphraseConfirm] = useState("");
  const [exportShowPass, setExportShowPass] = useState(false);
  const [exportCustomFileName, setExportCustomFileName] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [importShowPass, setImportShowPass] = useState(false);
  const [pendingEnvelope, setPendingEnvelope] = useState(null);
  const [importError, setImportError] = useState("");
  const [exportResultVisible, setExportResultVisible] = useState(false);
  const [exportedFile, setExportedFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadedTo, setDownloadedTo] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [autofillSupported, setAutofillSupported] = useState(false);
  const [autofillOn, setAutofillOn] = useState(false);
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [hasPasswords, setHasPasswords] = useState(false);

  const blinkAutoLock = route.params?.blinkAutoLock || false;
  const blinkAutofill = route.params?.blinkAutofill || false;

  const opacity = useRef(new Animated.Value(1)).current;
  const autofillOpacity = useRef(new Animated.Value(1)).current;
  const autofillBgAnim = useRef(new Animated.Value(0)).current;
  const autolockBgAnim = useRef(new Animated.Value(0)).current;
  const blinkRef = useRef(null);
  const isDarkRef = useRef(isDark);

  // Update ref when theme changes
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    checkIfPinSet();
    checkPasswordsExist();
  }, []);

  const refreshAutofillStatus = async () => {
    const supported = await isAutofillSupported();
    setAutofillSupported(supported);
    if (supported) {
      setAutofillOn(await isAutofillEnabled());
    } else {
      setAutofillOn(false);
    }
  };

  useEffect(() => {
    refreshAutofillStatus();
    const unsub = navigation.addListener("focus", () => {
      refreshAutofillStatus();
      checkPasswordsExist();
    });
    return unsub;
  }, [navigation]);

  const handleAutofillTap = async () => {
    if (!autofillSupported) {
      triggerToast(
        "Not supported",
        "Autofill requires Android 8 or newer.",
        "alert",
        3500
      );
      return;
    }
    try {
      await openAutofillPicker();
    } catch (e) {
      triggerToast(
        "Could not open settings",
        e?.message || "Open your phone's Settings > Passwords manually.",
        "error",
        4000
      );
    }
  };

  const checkIfPinSet = async () => {
    const storedPin = await SecureStore.getItemAsync("userSecurityPIN");
    setIsSecurityPinSet(!!storedPin);
  };

  const checkPasswordsExist = async () => {
    try {
      const passwords = await getPasswords();
      setHasPasswords(passwords && passwords.length > 0);
    } catch (error) {
      setHasPasswords(false);
    }
  };

  useEffect(() => {
    if (blinkAutoLock) {
      // Use ref to get theme mode at time of navigation
      const useOpacityAnimation = isDarkRef.current;

      if (useOpacityAnimation) {
        // Dark mode: opacity animation - 3 blinks
        opacity.setValue(1);
        Animated.sequence([
          // Blink 1
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          // Blink 2
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          // Blink 3
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      } else {
        // Light mode: background color animation - 3 blinks (faster)
        autolockBgAnim.setValue(0);
        Animated.sequence([
          // Blink 1
          Animated.timing(autolockBgAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(autolockBgAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
          // Blink 2
          Animated.timing(autolockBgAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(autolockBgAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
          // Blink 3
          Animated.timing(autolockBgAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(autolockBgAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]).start();
      }
    }
  }, [blinkAutoLock]);

  useEffect(() => {
    if (!blinkAutofill) return;

    // Use ref to get theme mode at time of navigation
    const useOpacityAnimation = isDarkRef.current;

    if (useOpacityAnimation) {
      // Dark mode: opacity animation - 3 blinks
      autofillOpacity.setValue(1);
      Animated.sequence([
        // Blink 1
        Animated.timing(autofillOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(autofillOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        // Blink 2
        Animated.timing(autofillOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(autofillOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        // Blink 3
        Animated.timing(autofillOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(autofillOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      // Light mode: background color animation - 3 blinks (faster)
      autofillBgAnim.setValue(0);
      Animated.sequence([
        // Blink 1
        Animated.timing(autofillBgAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(autofillBgAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        // Blink 2
        Animated.timing(autofillBgAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(autofillBgAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        // Blink 3
        Animated.timing(autofillBgAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(autofillBgAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  }, [blinkAutofill]);

  const handlePinDigitChange = (text, index) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }
    const newPinDigits = [...pinDigits];
    newPinDigits[index] = text;
    setPinDigits(newPinDigits);

    if (text && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSetPin = async () => {
    const pin = pinDigits.join("");
    if (pin.length !== 6) {
      return;
    }
    await SecureStore.setItemAsync("userSecurityPIN", pin);
    setIsSecurityPinSet(true);
    setPinInputModalVisible(false);
    setPinDigits(["", "", "", "", "", ""]);
    if (pinMode === "update") {
      triggerToast("PIN Updated", "Your security PIN has been updated successfully", "success", 3000);
    } else {
      triggerToast("PIN Set", "Your security PIN has been set successfully", "success", 3000);
    }
  };

  const handleDeletePin = async () => {
    setDeletePinModalVisible(false);

    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      setAuthNotAvailableModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify it's you",
      fallbackLabel: "Use PIN or Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      await SecureStore.deleteItemAsync("userSecurityPIN");
      setIsSecurityPinSet(false);
      triggerToast("PIN Deleted", "Your security PIN has been removed", "success", 3000);
    }
  };

  const openPinModal = async (mode) => {
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      setAuthNotAvailableModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify it's you",
      fallbackLabel: "Use PIN or Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setPinMode(mode);
      setPinDigits(["", "", "", "", "", ""]);
      setSecurityPinModalVisible(false);
      setPinInputModalVisible(true);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          pinInputRefs.current[0]?.focus();
        }, 100);
      });
    }
  };

  const handleDeleteAllPinDigitChange = (text, index) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }
    const newPinDigits = [...deleteAllPinDigits];
    newPinDigits[index] = text;
    setDeleteAllPinDigits(newPinDigits);

    if (text && index < 5) {
      deleteAllPinInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDeleteAllPinKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !deleteAllPinDigits[index] && index > 0) {
      deleteAllPinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleDeleteAllDataConfirm = async () => {
    setDeleteAllDataModalVisible(false);

    // Check if security PIN is set
    const storedPin = await SecureStore.getItemAsync("userSecurityPIN");
    if (!storedPin) {
      triggerToast("Security PIN Required", "You must set a security PIN before deleting all data", "error", 3000);
      return;
    }

    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      setAuthNotAvailableModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify it's you",
      fallbackLabel: "Use PIN or Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setDeleteAllPinDigits(["", "", "", "", "", ""]);
      setDeleteAllPinInputModalVisible(true);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          deleteAllPinInputRefs.current[0]?.focus();
        }, 100);
      });
    }
  };

  const handleVerifyDeleteAllPin = async () => {
    const enteredPin = deleteAllPinDigits.join("");
    if (enteredPin.length !== 6) {
      return;
    }

    const storedPin = await SecureStore.getItemAsync("userSecurityPIN");
    if (enteredPin === storedPin) {
      // Delete all data
      await clearPasswords();
      await SecureStore.deleteItemAsync("userSecurityPIN");
      setIsSecurityPinSet(false);
      setHasPasswords(false);

      setDeleteAllPinInputModalVisible(false);
      setDeleteAllPinDigits(["", "", "", "", "", ""]);
      triggerToast("All Data Deleted", "All your data has been permanently deleted", "success", 3000);
    } else {
      triggerToast("Incorrect PIN", "The PIN you entered is incorrect", "error", 3000);
      setDeleteAllPinDigits(["", "", "", "", "", ""]);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          deleteAllPinInputRefs.current[0]?.focus();
        }, 100);
      });
    }
  };

  const checkFingerprintForDisableAutoLock = async () => {
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      setAuthNotAvailableModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify it's you",
      fallbackLabel: "Use PIN or Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setEnableAutoLock(false);
      setautoLockDisabled(true);
      saveAutoLockSetting(false);
    }
  };

  const checkFingerprintForImport = async () => {
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      setAuthNotAvailableModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify it's you",
      fallbackLabel: "Use PIN or Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      await startImportFlow();
    }
  };

  const checkFingerprintForExport = async () => {
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      setAuthNotAvailableModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify it's you",
      fallbackLabel: "Use PIN or Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setExportPassphrase("");
      setExportPassphraseConfirm("");
      setExportCustomFileName("");
      setExportShowPass(false);
      setExportPassphraseModalVisible(true);
    }
  };

  const startImportFlow = async () => {
    const file = await pickAndReadBackupFile();
    if (file.status === "cancelled") {
      return;
    }
    if (file.status === "invalid") {
      triggerToast("Invalid file", file.reason, "error", 4000);
      return;
    }
    if (file.status === "legacy") {
      // Show import mode selection modal first
      setPendingEnvelope({ isLegacy: true, payload: file.payload });
      setImportModeModalVisible(true);
      return;
    }
    if (file.status === "encrypted") {
      // Show import mode selection modal first
      setPendingEnvelope({ isLegacy: false, envelope: file.envelope });
      setImportModeModalVisible(true);
    }
  };

  const handleImportModeConfirm = () => {
    setImportModeModalVisible(false);

    if (pendingEnvelope.isLegacy) {
      // For legacy backup, import directly with selected mode
      const ok = commitBackupPayload(pendingEnvelope.payload, importMode);
      ok.then((success) => {
        if (success) {
          triggerToast(
            "Imported",
            importMode === "merge"
              ? "Backup merged with existing passwords."
              : "Backup imported successfully.",
            "success",
            3500
          );
          onDataAdded && onDataAdded();
          setPendingEnvelope(null);
        } else {
          triggerToast("Import failed", "Could not save imported data.", "error", 3500);
        }
      });
    } else {
      // For encrypted backup, show passphrase modal
      setPendingEnvelope(pendingEnvelope.envelope);
      setImportPassphrase("");
      setImportShowPass(false);
      setImportError("");
      setImportPassphraseModalVisible(true);
    }
  };

  const handleConfirmExport = async () => {
    if (exportPassphrase.length < 12) {
      triggerToast(
        "Passphrase too short",
        "Use at least 12 characters.",
        "error",
        3000
      );
      return;
    }
    if (exportPassphrase !== exportPassphraseConfirm) {
      triggerToast(
        "Passphrases don't match",
        "Both fields must be identical.",
        "error",
        3000
      );
      return;
    }
    try {
      setSkipLock(true);
      setBackupLoader(true);
      const envelope = await generateBackup(exportPassphrase);
      const backupJson = JSON.stringify(envelope);
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const defaultName = `passwords-backup-${ts.getFullYear()}-${pad(
        ts.getMonth() + 1
      )}-${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`;

      const cleanedCustom = exportCustomFileName
        .trim()
        .replace(/[/\\:*?"<>|]/g, "")
        .replace(/\.json$/i, "")
        .replace(/\s+/g, " ");
      const baseName = cleanedCustom.length > 0 ? cleanedCustom : defaultName;
      const fileName = `${baseName}.json`;

      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, backupJson);
      setExportPassphrase("");
      setExportPassphraseConfirm("");
      setExportCustomFileName("");
      setExportedFile({ name: fileName, uri: fileUri, size: backupJson.length });
      setDownloadedTo("");
      setExportPassphraseModalVisible(false);
      setExportResultVisible(true);
    } catch (error) {
      console.error("Error exporting backup:", error);
      triggerToast("Export failed", "Could not generate backup.", "error", 3500);
    } finally {
      setBackupLoader(false);
      setSkipLock(false);
    }
  };

  const handleDownloadToPhone = async () => {
    if (!exportedFile || downloading) return;
    try {
      setDownloading(true);
      if (Platform.OS !== "android") {
        await Sharing.shareAsync(exportedFile.uri);
        setDownloading(false);
        return;
      }
      const saf = FileSystem.StorageAccessFramework;
      let folderUri = await AsyncStorage.getItem("backup_folder_uri");
      if (folderUri) {
        try {
          await saf.readDirectoryAsync(folderUri);
        } catch {
          folderUri = null;
          await AsyncStorage.removeItem("backup_folder_uri");
        }
      }
      if (!folderUri) {
        const perm = await saf.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          triggerToast(
            "Folder not selected",
            "Pick a folder to save your backup.",
            "alert",
            3000
          );
          return;
        }
        folderUri = perm.directoryUri;
        await AsyncStorage.setItem("backup_folder_uri", folderUri);
      }
      const contents = await FileSystem.readAsStringAsync(exportedFile.uri);
      const destUri = await saf.createFileAsync(
        folderUri,
        exportedFile.name.replace(/\.json$/, ""),
        "application/json"
      );
      await FileSystem.writeAsStringAsync(destUri, contents);
      const folderLabel = decodeURIComponent(
        folderUri.split("tree/").pop() || "selected folder"
      );
      setDownloadedTo(folderLabel);
      triggerToast(
        "Saved",
        "Backup saved to your selected folder.",
        "success",
        3500
      );
    } catch (err) {
      console.error("Download error:", err);
      triggerToast(
        "Could not save",
        "Saving failed. Try picking a different folder.",
        "error",
        3500
      );
    } finally {
      setDownloading(false);
    }
  };

  const dismissExportResult = () => {
    setExportResultVisible(false);
    setExportedFile(null);
    setDownloadedTo("");
  };

  const formatBytes = (n) => {
    if (!n) return "0 B";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleConfirmImport = async () => {
    if (decrypting) return;
    if (!pendingEnvelope) return;
    if (!importPassphrase) {
      setImportError("Enter the passphrase used at export.");
      return;
    }
    setImportError("");
    setDecrypting(true);

    const runDecrypt = () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const payload = decryptBackupEnvelope(
              pendingEnvelope,
              importPassphrase
            );
            resolve(payload);
          } catch (err) {
            reject(err);
          }
        }, 60);
      });

    try {
      const payload = await runDecrypt();
      const ok = await commitBackupPayload(payload, importMode);
      if (ok) {
        setImportPassphraseModalVisible(false);
        setPendingEnvelope(null);
        setImportPassphrase("");
        setImportError("");
        triggerToast(
          "Imported",
          importMode === "merge"
            ? "Backup merged with existing passwords."
            : "Encrypted backup decrypted and restored.",
          "success",
          3500
        );
        onDataAdded && onDataAdded();
      } else {
        setImportError("Could not save the decrypted data.");
      }
    } catch (err) {
      finishImportFlow();
      if (err.message === "WRONG_PASSPHRASE") {
        setImportError("Wrong Password. Try again.");
      } else if (err.message === "UNSUPPORTED_FORMAT") {
        setImportError("This backup file format is not supported.");
      } else {
        setImportError("Could not decrypt this file.");
      }
    } finally {
      setDecrypting(false);
    }
  };

  const cancelImportFlow = () => {
    if (decrypting) return;
    finishImportFlow();
    setImportPassphraseModalVisible(false);
    setPendingEnvelope(null);
    setImportPassphrase("");
    setImportError("");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        width: "100%",
      }}
    >
      <Modal
        animationType="fade"
        transparent
        visible={authNotAvailableModal}
        onRequestClose={() => setAuthNotAvailableModal(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 800 }}>
              Authentication Not Available
            </Text>
            <Text style={{ color: colors.text, fontSize: 16, marginTop: 10 }}>
              Your device does not have any authentication method set up. Please set up a PIN, password, or biometric authentication in your device settings.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={() => setAuthNotAvailableModal(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}
                  >
                    Got it
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
  <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}> 
          <TouchableOpacity
            style={styles.blurDismissArea}
            activeOpacity={1}
            onPress={() => setInfoModalVisible(false)}
          />
          <View style={[styles.modalContent, {
            backgroundColor: colors.modalBackground,
            borderColor: colors.border,
          }]}>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text
                style={[styles.paragraph, { color: colors.text, fontWeight: 800 }]}
              >
                👋 Welcome to your Personal Password Vault!
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Security First</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Your passwords are stored securely using Android's native vault
                storage system with hardware-backed encryption. This means your passwords
                are encrypted at the device level and protected by your device's secure
                enclave. Nothing is stored online or synced — only you can access your
                saved passwords on this device. If you uninstall this app then you will
                lose all your saved passwords.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ➕ How to Add Passwords
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Choose a category that matches your password type, then add your
                password by clicking the Add new button.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>📂 Categories & Colors</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Use categories to organize your saved passwords. Each has a
                color and a dedicated icon for the same to recognise:
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🟠 Banking – Credit cards, banking logins
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🔴 Mail or ID – Gmail, personal accounts
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🟢 Social – Facebook, Instagram,
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🟣 Developer – GitHub, Firebase, etc.
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🔵 Wi-Fi – Home or office Wi-Fi credentials
              </Text>

              <Text style={[styles.tip, { color: colors.textSecondary }]}>
                💡 Tip: Tap any password card to view, edit, or delete it.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>🪄 Autofill</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                This app can fill your saved logins on any other app or
                website — just like Google Passwords or Bitwarden. To enable
                it, tap the "Enable Autofill" card above and pick this app as
                your default autofill service in the system dialog.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔗 Linking passwords to apps</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Autofill knows which saved password belongs to which login
                screen using two keys on each record: a list of Android
                package names (e.g. com.instagram.android) and a list of
                website domains (e.g. instagram.com). Open any password, tap
                edit, and use LINKED APPS / LINKED WEBSITES to add these.
                "Add from installed apps" opens a picker of every app you
                have installed, so you don't have to type the package id by
                hand.
              </Text>

              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                If a login screen has no linked match yet, the autofill
                suggestion shows a "Search in Passwords" row — tapping it
                opens your vault, and picking a record auto-links that app
                for next time.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Biometric before fill</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Every autofill action is gated behind your phone's biometric
                or device credential — fingerprint, face, or PIN. Nobody
                holding your unlocked phone can dump your passwords into a
                foreign login form without passing that check. If your
                device has no biometric enrolled, autofill still works but
                without the extra prompt.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>💾 Save prompts</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                When you sign up or log in somewhere Android doesn't have
                a match for, it will offer to save the credentials to this
                app. You'll see a dialog with the detected username, a
                masked password, the source app or website, an editable
                label, and a category chip that we pre-pick based on the
                app (Instagram → Social, your bank → Banking, etc). Tap
                "Save password" and biometric-confirm.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                💾 Backup and Import Your Data
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                To protect your data, this app supports encrypted JSON
                backups. From Settings → Generate Backup, after biometric
                you'll pick a passphrase — we use AES-256-GCM with
                PBKDF2-SHA256 to encrypt the file. Only someone with that
                exact passphrase can restore it. The passphrase is not
                stored anywhere — if you forget it, the backup file cannot
                be decrypted. To restore on a new device, import the backup via
                Settings → Import Backup and enter the passphrase.
              </Text>

              <Text style={[styles.footer, { color: colors.text }]}>
                We hope this app makes your digital life safer and easier!
              </Text>

              <Text style={[styles.footer, { color: "#00c787" }]}>
                Designed and Developed by KOUSHIK CHAKRABORTY
              </Text>
            </ScrollView>

            <View style={[styles.buttonRow, { justifyContent: "center", marginTop: 10 }]}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton, { borderRadius: 50 }]}
                  onPress={() => setInfoModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: "800", color: colors.whiteButtonText }}
                  >
                    Got it!
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={importModalVisible}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border, }]}>
            <Text
              style={{
                color: "green",
                fontSize: 18,
                fontWeight: 800,
                paddingBottom: 20,
              }}
            >
              Import Backup
            </Text>
            <Text style={{ color: colors.text, fontSize: 16, paddingBottom: 20 }}>
              Please choose the exported backup file from your device and
              import.
            </Text>
            <Text style={{ color: colors.error, fontSize: 16 }}>
              Note: Importing backup file will replace all your current datas
              and your current datas will be lost. Don't add any passwords or
              image before importing any backup file.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => setImportModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800,color:isDark?"white":"black" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={() => {
                    checkFingerprintForImport();
                    setImportModalVisible(false);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}
                  >
                    Import
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={importModeModalVisible}
        onRequestClose={() => setImportModeModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "800",
                paddingBottom: 20,
                textAlign: "center",
              }}
            >
              Import Mode
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, paddingBottom: 15, textAlign: "center" }}>
              Choose how you want to import this backup:
            </Text>

            <TouchableOpacity
              onPress={() => setImportMode("replace")}
              style={[
                styles.importModeOption,
                {
                  backgroundColor: colors.surface,
                  borderColor: importMode === "replace" ? "#ff8c00" : colors.border,
                  borderRadius: 50,
                  shadowColor:isDark?"black":"#969696",

                },
                importMode === "replace" && {
                  backgroundColor: isDark ? "#2d2410" : "#fff5e6",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: importMode === "replace" ? "#ff8c00" : colors.textTertiary,
                    },
                  ]}
                >
                  {importMode === "replace" && (
                    <View style={[styles.radioButtonInner, { backgroundColor: "#ff8c00" }]} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
                    Replace All
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 14, marginTop: 4 }}>
                    Delete current passwords and import backup
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setImportMode("merge")}
              style={[
                styles.importModeOption,
                {
                  backgroundColor: colors.surface,
                  borderColor: importMode === "merge" ? "#ff8c00" : colors.border,
                  borderRadius: 50,
                  shadowColor:isDark?"black":"#969696",

                },
                importMode === "merge" && {
                  backgroundColor: isDark ? "#2d2410" : "#fff5e6",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: importMode === "merge" ? "#ff8c00" : colors.textTertiary,
                    },
                  ]}
                >
                  {importMode === "merge" && (
                    <View style={[styles.radioButtonInner, { backgroundColor: "#ff8c00" }]} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
                    Merge
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 14, marginTop: 4 }}>
                    Keep current passwords + add from backup
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <View style={{ width: "48%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton, { borderRadius: 50 }]}
                  onPress={() => {
                    setImportModeModalVisible(false);
                    setPendingEnvelope(null);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "800", color: colors.cancelButtonText }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "48%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton, { borderRadius: 50 }]}
                  onPress={handleImportModeConfirm}
                >
                  <Text style={{ fontSize: 15, fontWeight: "800", color: colors.whiteButtonText }}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={securityPinModalVisible}
        onRequestClose={() => setSecurityPinModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              Add another level of security to protect your passwords, add a security PIN and you have to provide this PIN in lockscreen to open the app for extended security.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={() => openPinModal("set")}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: isDark?"black":"white" }}
                  >
                    Set PIN
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={pinInputModalVisible}
        onRequestClose={() => setPinInputModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>
              {pinMode === "update" ? "Update Security PIN" : "Set Security PIN"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 20 }}>
              Enter a 6-digit PIN
            </Text>

            <View style={styles.pinInputContainer}>
              {pinDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (pinInputRefs.current[index] = ref)}
                  style={[styles.pinInput, {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }]}
                  value={digit}
                  onChangeText={(text) => handlePinDigitChange(text, index)}
                  onKeyPress={(e) => handlePinKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                />
              ))}
            </View>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => {
                    setPinInputModalVisible(false);
                    setPinDigits(["", "", "", "", "", ""]);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={handleSetPin}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}>
                    Set
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={deletePinModalVisible}
        onRequestClose={() => setDeletePinModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              Are you sure you want to delete your security PIN?
            </Text>
            <Text style={{ color: "red", fontSize: 16, fontWeight: 800, marginTop: 10 }}>
              This action cannot be undone!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => setDeletePinModalVisible(false)}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.redButton]}
                  onPress={handleDeletePin}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={deleteAllDataModalVisible}
        onRequestClose={() => setDeleteAllDataModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: "red", fontSize: 18, fontWeight: 800, marginBottom: 15 }}>
              Delete All Data
            </Text>
            <Text style={{ color: isDark?"white":"black", fontSize: 16, marginBottom: 10 }}>
              This action will permanently delete all your saved passwords and security PIN.
            </Text>
            <Text style={{ color: "red", fontSize: 16, fontWeight: 800 }}>
              This action is irreversible and cannot be undone!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => setDeleteAllDataModalVisible(false)}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.redButton]}
                  onPress={handleDeleteAllDataConfirm}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={deleteAllPinInputModalVisible}
        onRequestClose={() => {
          setDeleteAllPinInputModalVisible(false);
          setDeleteAllPinDigits(["", "", "", "", "", ""]);
        }}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: "red", fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>
              Confirm Deletion
            </Text>
            <Text style={{ color: colors.text, fontSize: 14, textAlign: "center", marginBottom: 20 }}>
              Enter your 6-digit security PIN to confirm
            </Text>

            <View style={styles.pinInputContainer}>
              {deleteAllPinDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (deleteAllPinInputRefs.current[index] = ref)}
                  style={[styles.pinInput, {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }]}
                  value={digit}
                  onChangeText={(text) => handleDeleteAllPinDigitChange(text, index)}
                  onKeyPress={(e) => handleDeleteAllPinKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                />
              ))}
            </View>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => {
                    setDeleteAllPinInputModalVisible(false);
                    setDeleteAllPinDigits(["", "", "", "", "", ""]);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.redButton]}
                  onPress={handleVerifyDeleteAllPin}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Delete All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={exportResultVisible}
        onRequestClose={dismissExportResult}
      >
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={styles.blurContainer}
        >
          <TouchableOpacity
            style={styles.blurDismissArea}
            activeOpacity={1}
            onPress={dismissExportResult}
          />
          <View style={[styles.modalContent, {
            backgroundColor: colors.modalBackground,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.sheetTitle, { color: colors.text, textAlign: "center" }]}>Backup Ready</Text>

            <View style={[styles.fileCard, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}>
              <View style={styles.fileIconWrap}>
                <MaterialCommunityIcons
                  name="file-lock"
                  size={36}
                  color="#00c787"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.fileName, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {exportedFile?.name}
                </Text>
                <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>
                  Encrypted JSON · {formatBytes(exportedFile?.size)}
                </Text>
              </View>
            </View>

            {downloadedTo ? (
              <View style={[styles.downloadedBanner, {
                backgroundColor: isDark ? "#001e10" : "#e6fff4",
                borderColor: isDark ? "#005c31" : "#00c787",
              }]}>
                <Ionicons name="checkmark-circle" size={18} color="#00c787" />
                <Text style={[styles.downloadedText, {
                  color: isDark ? "#c8ffe0" : "#006644",
                }]} numberOfLines={2}>
                  Saved to: {downloadedTo}
                </Text>
              </View>
            ) : (
              <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
                Save this file to your phone. First time, you'll pick a folder
                (choose "Download") — we'll remember it for next time.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.downloadBtn,
                dynamicButtons.whiteButton,
                downloading && { opacity: 0.6 },
              ]}
              onPress={handleDownloadToPhone}
              disabled={downloading}
              activeOpacity={0.85}
            >
              {downloading ? (
                <ActivityIndicator color={colors.whiteButtonText} />
              ) : (
                <>
                  <Ionicons name="download" size={22} color={colors.whiteButtonText} />
                  <Text style={[styles.downloadBtnText, { color: colors.whiteButtonText }]}>
                    {downloadedTo ? "Download again" : "Download"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetCloseBtn, dynamicButtons.cancelButton, { borderRadius: 50 }]}
              onPress={dismissExportResult}
            >
              <Text style={[styles.sheetCloseText, { color: colors.cancelButtonText }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={exportPassphraseModalVisible}
        onRequestClose={() => setExportPassphraseModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDark? colors.modalBackground:"#f3f3f3", borderColor: colors.border }]}>
            <Text
              style={{
                color: "#00c787",
                fontSize: 18,
                fontWeight: 800,
                paddingBottom: 10,
              }}
            >
              Protect Your Backup
            </Text>
            <Text style={{ color: colors.text, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
              Choose a Password to encrypt this backup. You'll need the exact
              same Password to restore it later.
            </Text>
            <Text
              style={{
                color: colors.error,
                fontSize: 13,
                marginBottom: 18,
                lineHeight: 18,
              }}
            >
              This Password is NOT stored anywhere. If you forget it, the
              backup file cannot be recovered.
            </Text>

            <View style={[styles.passInputRow, {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              opacity: backupLoader ? 0.5 : 1,
              shadowColor:isDark?"black":"#969696"
            }]}>
              <TextInput
                style={[styles.passInput, { color: colors.inputText, }]}
                placeholder="Password (Min 12 characters)"
                placeholderTextColor={colors.inputPlaceholder}
                value={exportPassphrase}
                onChangeText={setExportPassphrase}
                secureTextEntry={!exportShowPass}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!backupLoader}
              />
              <TouchableOpacity
                onPress={() => setExportShowPass((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                activeOpacity={0.6}
                disabled={backupLoader}
              >
                <Ionicons
                  name={exportShowPass ? "eye-off" : "eye"}
                  size={22}
                  color="lightgrey"
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.passInputRow, {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              opacity: backupLoader ? 0.5 : 1,
              shadowColor:isDark?"black":"#969696"
            }]}>
              <TextInput
                style={[styles.passInput, { color: colors.inputText }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.inputPlaceholder}
                value={exportPassphraseConfirm}
                onChangeText={setExportPassphraseConfirm}
                secureTextEntry={!exportShowPass}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!backupLoader}
              />
            </View>

            <Text style={[styles.fileNameHint, { color: colors.textSecondary }]}>
              File name (optional) — leave blank for default name.
            </Text>
            <View style={[styles.passInputRow, {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              opacity: backupLoader ? 0.5 : 1,
              shadowColor:isDark?"black":"#969696"
            }]}>
              <TextInput
                style={[styles.passInput, { color: colors.inputText }]}
                placeholder="e.g. work-backup"
                placeholderTextColor={colors.inputPlaceholder}
                value={exportCustomFileName}
                onChangeText={setExportCustomFileName}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={60}
                editable={!backupLoader}
              />
            </View>

            {exportPassphrase.length > 0 && exportPassphrase.length < 12 && (
              <Text style={{ color: "#ff9b9b", fontSize: 12, marginTop: 4 }}>
                At least 12 characters required ({exportPassphrase.length}/12)
              </Text>
            )}
            {exportPassphrase.length >= 12 &&
              exportPassphraseConfirm.length > 0 &&
              exportPassphrase !== exportPassphraseConfirm && (
                <Text style={{ color: "#ff9b9b", fontSize: 12, marginTop: 4 }}>
                  Passphrases do not match.
                </Text>
              )}

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[
                    styles.modalbtn,
                    dynamicButtons.cancelButton,
                    {
                      borderRadius: 50,
                      opacity: backupLoader ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => {
                    setExportPassphraseModalVisible(false);
                    setExportPassphrase("");
                    setExportPassphraseConfirm("");
                    setExportCustomFileName("");
                  }}
                  disabled={backupLoader}
                >
                  <Text style={{ fontSize: 15, fontWeight: "800", color: colors.cancelButtonText }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[
                    styles.modalbtn,
                    dynamicButtons.whiteButton,
                    {
                      opacity:
                        (exportPassphrase.length >= 12 &&
                        exportPassphrase === exportPassphraseConfirm && !backupLoader)
                          ? 1
                          : 0.5,
                      borderRadius: 50,
                    },
                  ]}
                  onPress={handleConfirmExport}
                  disabled={
                    exportPassphrase.length < 12 ||
                    exportPassphrase !== exportPassphraseConfirm ||
                    backupLoader
                  }
                >
                  {backupLoader ? (
                    <ActivityIndicator size="small" color={colors.whiteButtonText} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: colors.whiteButtonText,
                      }}
                    >
                      Encrypt
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={importPassphraseModalVisible}
        onRequestClose={cancelImportFlow}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDark? colors.modalBackground:"#f3f3f3", borderColor: colors.border }]}>
            <Text
              style={{
                color: "#00c787",
                fontSize: 18,
                fontWeight: 800,
                paddingBottom: 10,
              }}
            >
              Decrypt Backup
            </Text>
            <Text style={{ color: colors.text, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
              This backup file is encrypted. Enter the Password you used when
              exporting it.
            </Text>

            <View style={[styles.passInputRow, {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
            }]}>
              <TextInput
                style={[styles.passInput, { color: colors.inputText }]}
                placeholder="Password"
                placeholderTextColor={colors.inputPlaceholder}
                value={importPassphrase}
                onChangeText={(t) => {
                  setImportPassphrase(t);
                  if (importError) setImportError("");
                }}
                secureTextEntry={!importShowPass}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!decrypting}
                onSubmitEditing={handleConfirmImport}
              />
              <TouchableOpacity
                onPress={() => setImportShowPass((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={importShowPass ? "eye-off" : "eye"}
                  size={22}
                  color="lightgrey"
                />
              </TouchableOpacity>
            </View>

            {importError ? (
              <Text style={{ color: "#ff9b9b", fontSize: 13, marginTop: 6 }}>
                {importError}
              </Text>
            ) : null}

            {decrypting ? (
              <View style={styles.decryptingRow}>
                <ActivityIndicator color="#00c787" />
                <Text style={styles.decryptingText}>
                  Decrypting… this can take a while.
                </Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[
                    styles.modalbtn,
                    dynamicButtons.cancelButton,
                    { opacity: decrypting ? 0.5 : 1 },
                  ]}
                  onPress={cancelImportFlow}
                  disabled={decrypting}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[
                    styles.modalbtn,
                    dynamicButtons.whiteButton,
                    { opacity: decrypting ? 0.5 : 1 },
                  ]}
                  onPress={handleConfirmImport}
                  disabled={decrypting}
                >
                  {decrypting ? (
                    <ActivityIndicator color={colors.whiteButtonText} />
                  ) : (
                    <Text
                      style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}
                    >
                      Decrypt
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={backUpModalVisible}
        onRequestClose={() => setbackUpModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text
              style={{
                color: "green",
                fontSize: 18,
                fontWeight: 800,
                paddingBottom: 20,
              }}
            >
              Generate Backup
            </Text>
            <Text style={{ color: colors.text, fontSize: 16, paddingBottom: 20 }}>
              It's crucial to back up your passwords. All your
              data is securely stored locally on this device and is not synced
              to any cloud service for your privacy and security. If you
              uninstall this app, clear its data, or wipe your device, all your
              saved passwords will be permanently lost. Please
              backup your passwords before you uninstall this app or wipe
              your device.
            </Text>

            <Text style={{ color: colors.error, fontSize: 16 }}>
              Note: A .json file will be created which will contain all your passwords with encryption which nobody can see.You have to provide a password to protect that .json file. And while importing that backup file, you have to give the same password you used to protect it.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => setbackUpModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color:isDark? "white":"black" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={() => {
                    checkFingerprintForExport();
                    setbackUpModalVisible(false);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}
                  >
                    Backup
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
      <View
        style={{
          width: "100%",
          height: "auto",
          paddingHorizontal: 20,
          backgroundColor: colors.background,
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          marginTop: 40,
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("category")}>
          <AntDesign
            name="arrowleft"
            size={24}
            color={colors.text}
            style={{
              backgroundColor: colors.surface,
              padding: 8,
              borderRadius: 50,
              elevation:10,
              shadowColor:isDark?"black":"#969696"
            }}
          />

        </TouchableOpacity>
        <Text
          style={{
            paddingHorizontal: 20,
            paddingTop: 25,
            paddingBottom: 30,
            fontSize: 30,
            color: colors.text,
            fontWeight: 800,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ width: "100%", paddingHorizontal: 20,paddingTop:10 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Backup Category */}
        <TouchableOpacity
          onPress={() => {
            setImportModalVisible(true);
          }}
          style={[
            styles.settingsMain,
            {
              paddingVertical: 18,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderBottomWidth: 0,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor:isDark?"black":"#969696"
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              marginLeft: 15,
              alignItems: "center",
            }}
          >
            <Ionicons name="cloud-download" size={28} color= {isDark?"lightgrey":"grey"}  />

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              Import Backup
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            // Check if there's any data to backup
            const passwords = await getPasswords();

            if (passwords.length === 0) {
              triggerToast("Nothing to backup", "You don't have anything to backup","info",3000);
              return;
            }

            setbackUpModalVisible(true);
          }}
          style={[
            styles.settingsMain,
            {
              paddingVertical: 18,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor:isDark?"black":"#969696"
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              marginLeft: 15,
              alignItems: "center",
            }}
          >
            <Ionicons name="cloud-upload" size={28} color= {isDark?"lightgrey":"grey"}  />

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              Generate Backup
            </Text>
          </View>
        </TouchableOpacity>

        {/* Appearance Category */}
        <View style={{ marginTop: 20 }} />

        <TouchableOpacity
          onPress={() => setAppearanceModalVisible(true)}
          style={[
            styles.settingsMain,
            {
              paddingVertical: 18,
              borderRadius: 30,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor:isDark?"black":"#969696"

            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              marginLeft: 15,
              alignItems: "center",
              flex: 1,
            }}
          >
            {themeMode === "light" ? (
              <Sun strokeWidth={2} size={26} color={colors.textSecondary} />
            ) : themeMode === "dark" ? (
              <Moon strokeWidth={2} size={26} color={colors.textSecondary} />
            ) : (
              <MaterialCommunityIcons name="circle-half-full" size={24} color={ colors.textSecondary} />

            )}

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Appearance
              </Text>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {themeMode === "light" ? "Light mode" : themeMode === "dark" ? "Dark mode" : "Auto (system default)"}
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="arrow-forward-ios"
            size={18}
            color={colors.textSecondary}
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>

        {/* Security Category */}
        <View style={{ marginTop: 20 }} />

        {isDark ? (
          <Animated.View style={{ opacity }}>
            <TouchableOpacity
              onPress={() => {
                if (enableAutoLock) {
                  checkFingerprintForDisableAutoLock();
                } else {
                  setEnableAutoLock(true);
                  saveAutoLockSetting(true);
                }
              }}
              style={[
                styles.settingsMain,
                {
                  backgroundColor: enableAutoLock ? "#001e10" : "#200000",
                  borderWidth: 0.5,
                  borderColor: enableAutoLock ? "#005c31" : "#780000",
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  shadowColor:isDark?"black":"#969696"
                },
              ]}
            >
              <View style={{ flexDirection: "row", gap: 20, marginLeft: 10 }}>
                {enableAutoLock ? (
                  <ShieldCheck strokeWidth={1.5} size={30} color="#00c76b" />
                ) : (
                  <ShieldX strokeWidth={1.5} size={30} color="red" />
                )}
                <Text style={{ color: enableAutoLock ? "#00c76b" : "red", fontSize: 17, fontWeight: "700" }}>
                  Auto-Lock
                </Text>
              </View>
              {enableAutoLock ? (
                <FontAwesome style={{ marginRight: 10 }} name="toggle-on" size={30} color="green" />
              ) : (
                <FontAwesome name="toggle-off" size={30} color="red" style={{ marginRight: 10 }} />
              )}
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              if (enableAutoLock) {
                checkFingerprintForDisableAutoLock();
              } else {
                setEnableAutoLock(true);
                saveAutoLockSetting(true);
              }
            }}
            style={{ width: "100%" }}
          >
            <Animated.View
              style={[
                styles.settingsMain,
                {
                  backgroundColor: autolockBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [enableAutoLock ? "#e6f7ed" : "#ffe6e6", "#2a2a2a"]
                  }),
                  borderWidth: 1,
                  borderColor: autolockBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [enableAutoLock ? "#80dea0" : "#ff9999", "#3d3d3d"]
                  }),
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  elevation:10,
                  shadowColor:isDark?"black":"#969696",
                },
              ]}
            >
              <View style={{ flexDirection: "row", gap: 20, marginLeft: 10 }}>
                <Animated.View style={{
                  opacity: autolockBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0]
                  })
                }}>
                  {enableAutoLock ? (
                    <ShieldCheck strokeWidth={1.5} size={30} color="#00c76b" />
                  ) : (
                    <ShieldX strokeWidth={1.5} size={30} color="red" />
                  )}
                </Animated.View>
                <Animated.View style={{
                  position: 'absolute',
                  opacity: autolockBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                  })
                }}>
                  {enableAutoLock ? (
                    <ShieldCheck strokeWidth={1.5} size={30} color="#ffffff" />
                  ) : (
                    <ShieldX strokeWidth={1.5} size={30} color="#ffffff" />
                  )}
                </Animated.View>
                <Animated.Text
                  style={{
                    color: autolockBgAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [enableAutoLock ? "#00c76b" : "red", "#ffffff"]
                    }),
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  Auto-Lock
                </Animated.Text>
              </View>
              <View style={{ marginRight: 10, position: 'relative' }}>
                <Animated.View style={{
                  opacity: autolockBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0]
                  })
                }}>
                  {enableAutoLock ? (
                    <FontAwesome name="toggle-on" size={30} color="green" />
                  ) : (
                    <FontAwesome name="toggle-off" size={30} color="red" />
                  )}
                </Animated.View>
                <Animated.View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: autolockBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                  })
                }}>
                  {enableAutoLock ? (
                    <FontAwesome name="toggle-on" size={30} color="#ffffff" />
                  ) : (
                    <FontAwesome name="toggle-off" size={30} color="#ffffff" />
                  )}
                </Animated.View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}

        {!isSecurityPinSet ? (
          <TouchableOpacity
            onPress={() => {
              setSecurityPinModalVisible(true);
            }}
            style={[
              styles.settingsMain,
              {
                paddingVertical: 18,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor:isDark?"black":"#969696"
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                marginLeft: 15,
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons name="keyboard-settings" size={24} color={colors.textSecondary} />

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Set Security PIN
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => openPinModal("update")}
              style={[
                styles.settingsMain,
                {
                  paddingVertical: 18,
                  borderRadius: 0,
                  borderBottomWidth: 0,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor:isDark?"black":"#969696"
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 15,
                  marginLeft: 15,
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="keyboard-settings" size={24} color={colors.textSecondary} />
                  <RefreshCw size={14} color={colors.textSecondary} style={{ marginLeft: 5 }} />
                </View>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  Update Security PIN
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeletePinModalVisible(true)}
              style={[
                styles.settingsMain,
                {
                  paddingVertical: 18,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottomLeftRadius: 30,
                  borderBottomRightRadius: 30,
                  backgroundColor: isDark ? "#200000" : "#ffe6e6",
                  borderWidth: 1,
                  borderColor: isDark ? "#780000" : "#ff9999",
                  shadowColor:isDark?"black":"#969696"
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  marginLeft: 15,
                  alignItems: "center",
                }}
              >
                <Trash size={24} color="red" />

                <Text
                  style={{
                    color: "red",
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  Delete Security PIN
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Autofill */}
        <View style={{ marginTop: 20 }} />

        {isDark ? (
          <Animated.View style={{ opacity: autofillOpacity }}>
            <TouchableOpacity
              onPress={handleAutofillTap}
              activeOpacity={0.8}
              style={[
                styles.settingsMain,
                {
                  paddingVertical: 18,
                  borderRadius: 35,
                  backgroundColor: autofillOn ? "#001e10" : colors.surface,
                  borderWidth: 1,
                  borderColor: autofillOn ? "#005c31" : colors.border,
                  shadowColor:isDark?"black":"#969696"
                },
              ]}
            >
              <View style={{ flexDirection: "row", gap: 20, marginLeft: 10, alignItems: "center", flex: 1 }}>
                <MaterialCommunityIcons
                  name={autofillOn ? "form-textbox-password" : "form-textbox"}
                  size={26}
                  color={autofillOn ? "#00c76b" : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: autofillOn ? "#00c76b" : colors.textSecondary, fontSize: 17, fontWeight: "700" }}>
                    {autofillOn ? "Autofill Enabled" : "Enable Autofill"}
                  </Text>
                  <Text style={{ color: autofillOn ? "#7ad9a6" : colors.textTertiary, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                    {autofillSupported
                      ? autofillOn
                        ? "Passwords is set as your default autofill service."
                        : "Fill saved passwords in other apps and browsers."
                      : "Requires Android 8 or newer."}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color={autofillOn ? "#00c76b" : colors.textSecondary} style={{ marginRight: 10 }} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.settingsMain,
              {
                paddingVertical: 18,
                borderRadius: 35,
                borderWidth: 1,
                backgroundColor: autofillBgAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [autofillOn ? "#e6f7ed" : colors.surface, "#2a2a2a"]
                }),
                borderColor: autofillBgAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [autofillOn ? "#80dea0" : colors.border, "#3d3d3d"]
                }),
                ...getElevation('medium', isDark),
              },
            ]}
          >
            <TouchableOpacity onPress={handleAutofillTap} activeOpacity={0.8} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <View style={{ flexDirection: "row", gap: 20, marginLeft: 10, alignItems: "center", flex: 1 }}>
                <View style={{ position: 'relative', width: 26, height: 26 }}>
                  <Animated.View style={{
                    opacity: autofillBgAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0]
                    })
                  }}>
                    <MaterialCommunityIcons
                      name={autofillOn ? "form-textbox-password" : "form-textbox"}
                      size={26}
                      color={autofillOn ? "#00c76b" : colors.textSecondary}
                    />
                  </Animated.View>
                  <Animated.View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: autofillBgAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1]
                    })
                  }}>
                    <MaterialCommunityIcons
                      name={autofillOn ? "form-textbox-password" : "form-textbox"}
                      size={26}
                      color="#ffffff"
                    />
                  </Animated.View>
                </View>
                <View style={{ flex: 1 }}>
                  <Animated.Text style={{
                    color: autofillBgAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [autofillOn ? "#00c76b" : colors.textSecondary, "#ffffff"]
                    }),
                    fontSize: 17,
                    fontWeight: "700"
                  }}>
                    {autofillOn ? "Autofill Enabled" : "Enable Autofill"}
                  </Animated.Text>
                  <Animated.Text style={{
                    color: autofillBgAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [autofillOn ? "#34c759" : colors.textTertiary, "#cccccc"]
                    }),
                    fontSize: 12,
                    marginTop: 2
                  }} numberOfLines={2}>
                    {autofillSupported
                      ? autofillOn
                        ? "Passwords is set as your default autofill service."
                        : "Fill saved passwords in other apps and browsers."
                      : "Requires Android 8 or newer."}
                  </Animated.Text>
                </View>
              </View>
              <View style={{ marginRight: 10, position: 'relative', width: 18, height: 18 }}>
                <Animated.View style={{
                  opacity: autofillBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0]
                  })
                }}>
                  <MaterialIcons
                    name="arrow-forward-ios"
                    size={18}
                    color={autofillOn ? "#00c76b" : colors.textSecondary}
                  />
                </Animated.View>
                <Animated.View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: autofillBgAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                  })
                }}>
                  <MaterialIcons
                    name="arrow-forward-ios"
                    size={18}
                    color="#ffffff"
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Danger Zone */}
        {hasPasswords && (
          <>
            <View style={{ marginTop: 20 }} />

            <TouchableOpacity
              onPress={() => {
                setDeleteAllDataModalVisible(true);
              }}
              style={[
                styles.settingsMain,
                {
                  paddingVertical: 18,
                  borderRadius: 30,
                  backgroundColor: colors.redButtonBg,
                  borderColor: colors.redButtonBorder,
                  borderWidth:1.5,
                  shadowColor:isDark?"black":"#969696"
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  marginLeft: 15,
                  alignItems: "center",
                }}
              >
                <Trash size={24} color="white" />

                <Text
                  style={{
                    color: "white",
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  Delete all data
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* About Category */}
        <View style={{ marginTop: 20 }} />

        <TouchableOpacity
          onPress={() => {
            setInfoModalVisible(true);
          }}
          style={[
            styles.settingsMain,
            {
              paddingVertical: 15,
              borderRadius: 50,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor:isDark?"black":"#969696"
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              marginLeft: 15,
              alignItems: "center",
            }}
          >
            <Info strokeWidth={2} size={26} color={colors.textSecondary} />

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              About this App
            </Text>
          </View>
        </TouchableOpacity>
        <View style={{height:100}} />
      </ScrollView>

      {/* Appearance Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={appearanceModalVisible}
        onRequestClose={() => setAppearanceModalVisible(false)}
      >
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={styles.appearanceModalBackdrop}
        >
          <TouchableOpacity
            style={styles.appearanceModalDismiss}
            activeOpacity={1}
            onPress={() => setAppearanceModalVisible(false)}
          />
          <View style={[styles.appearanceModalContent, {
            backgroundColor: colors.modalBackground,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.appearanceModalTitle, { color: colors.text }]}>Appearance</Text>

            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
              Choose how the app looks on your device
            </Text>

            <TouchableOpacity
              onPress={() => {
                setThemeMode("light");
                setAppearanceModalVisible(false);
                triggerToast("Light mode", "Appearance changed to light mode", "success", 2500);
              }}
              style={[
                styles.appearanceOption,
                {
                  backgroundColor: colors.surface,
                  borderColor: themeMode === "light" ? "#ff8c00" : colors.border,

                  shadowColor:isDark?"black":"#969696"

                },
                themeMode === "light" && {
                  backgroundColor: "#fff5e6",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={[
                    styles.appearanceIconWrap,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      elevation:10,
                      shadowColor:isDark?"black":"#4e4e4e"
                    },
                    themeMode === "light" && {
                      backgroundColor: "#ffe4b3",
                      borderColor: "#ff8c00",
                      elevation:10,
                      shadowColor:isDark?"black":"#4e4e4e"
                    },
                  ]}
                >
                  <Sun
                    strokeWidth={2}
                    size={24}
                    color= "#ff8c00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
                    Light
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 2 }}>
                    Always in light mode
                  </Text>
                </View>
                {themeMode === "light" && (
                  <View style={[styles.checkmarkCircle, {
                    backgroundColor: "#ffe4b3",
                    borderColor: "#ff8c00",
                  }]}>
                    <MaterialIcons name="check" size={16} color="#ff8c00" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setThemeMode("dark");
                setAppearanceModalVisible(false);
                triggerToast("Dark mode", "Appearance changed to dark mode", "success", 2500);
              }}
              style={[
                styles.appearanceOption,
                {
                  backgroundColor: colors.surface,
                  borderColor: themeMode === "dark" ? "#4da6ff" : colors.border,
                  shadowColor:isDark?"black":"#969696"
                },
                themeMode === "dark" && {
                  backgroundColor: "#0d1f2d",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={[
                    styles.appearanceIconWrap,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      elevation:10,
                      shadowColor:isDark?"black":"#4e4e4e"
                    },
                    themeMode === "dark" && {
                      backgroundColor: "#1a2f3d",
                      borderColor: "#4da6ff",
                      elevation:10,
                      shadowColor:isDark?"black":"#4e4e4e"
                    },
                  ]}
                >
                  <Moon
                    strokeWidth={2}
                    size={24}
                    color={"#4da6ff"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
                    Dark
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 2 }}>
                    Always in dark mode
                  </Text>
                </View>
                {themeMode === "dark" && (
                  <View style={[styles.checkmarkCircle, {
                    backgroundColor: "#1a2f3d",
                    borderColor: "#4da6ff",
                  }]}>
                    <MaterialIcons name="check" size={16} color="#4da6ff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setThemeMode("auto");
                setAppearanceModalVisible(false);
                triggerToast("Auto mode", "App will follow your system settings", "success", 2500);
              }}
              style={[
                styles.appearanceOption,
                {
                  backgroundColor: colors.surface,
                  borderColor: themeMode === "auto" ? (isDark ? "#4da6ff" : "#ff8c00") : colors.border,
                  shadowColor:isDark?"black":"#969696"
                },
                themeMode === "auto" && {
                  backgroundColor: isDark ? "#0d1f2d" : "#fff5e6",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={[
                    styles.appearanceIconWrap,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                        elevation:10,
                      shadowColor:isDark?"black":"#4e4e4e"
                    },
                    themeMode === "auto" && {
                      backgroundColor: isDark ? "#1a2f3d" : "#ffe4b3",
                      borderColor: isDark ? "#4da6ff" : "#ff8c00",
                        elevation:10,
                      shadowColor:isDark?"black":"#4e4e4e"
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="circle-half-full" size={24} color={themeMode === "auto" ? (isDark ? "#4da6ff" : "#ff8c00") : colors.textSecondary} />

                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
                    Auto
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 2 }}>
                    Follow system settings
                  </Text>
                </View>
                {themeMode === "auto" && (
                  <View style={[styles.checkmarkCircle, {
                    backgroundColor: isDark ? "#1a2f3d" : "#ffe4b3",
                    borderColor: isDark ? "#4da6ff" : "#ff8c00",
                  }]}>
                    <MaterialIcons name="check" size={16} color={isDark ? "#4da6ff" : "#ff8c00"} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.appearanceModalCloseBtn, dynamicButtons.cancelButton, { borderRadius: 50 }]}
              onPress={() => setAppearanceModalVisible(false)}
            >
              <Text style={[styles.appearanceModalCloseText, { color: colors.cancelButtonText }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    width: "95%",
    margin: "auto",
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerWrapper: {
    borderRadius: 6,
    marginBottom: 20,
    overflow: "hidden",
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
  },
  scrollView: {
    height: "100%",
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  searchpass: {
    width: "80%",
    color: "white",
  },
  bullet: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 5,
  },
  settingsMain: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0.5,
    elevation: ELEVATION_LEVELS.medium,
  },
  tip: {
    fontSize: 16,
    marginTop: 15,
    fontStyle: "italic",
  },
  searchmain: {
    width: "95%",
    margin: "auto",
    marginBottom: 20,
    height: 50,
    backgroundColor: "#2a2a2a",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  footer: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  picker: {
    color: "lightgrey", // for dark mode
    backgroundColor: "#282828",
    height: 65,
  },
  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    backgroundColor: "#383838",
    width: "auto",
    height: "auto",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
  },
  fabFirst: {
    position: "absolute",
    bottom: 50,
    left: 20,
    backgroundColor: "red",
    borderWidth: 1.2,
    borderColor: "#ff8383",
    width: "auto",
    height: "auto",
    paddingHorizontal: 20,
    elevation: ELEVATION_LEVELS.medium,
    shadowColor: "red",
    paddingVertical: 12,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
  },
  pickerMain: {},
  fabIcon: {
    fontSize: 17,
    color: "white",
    fontWeight: 800,
    lineHeight: 32,
  },
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 20,
  },
  blurDismissArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    backgroundColor: "#202020ff", // Will be overridden dynamically
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop:30,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#3d3d3d", // Will be overridden dynamically
  },
  input: {
    backgroundColor: "#2a2a2a", // Will be overridden dynamically
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#3d3d3d", // Will be overridden dynamically
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    color: "white", // Will be overridden dynamically
  },
  modalbtn: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 54,
    backgroundColor: "#383838",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loaderText: { color: "white", marginTop: 10, fontSize: 16 },
  pinInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  pinInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#383838", // Will be overridden dynamically
    borderWidth: 1,
    borderColor: "#505050", // Will be overridden dynamically
    color: "white", // Will be overridden dynamically
    fontSize: 24,
    textAlign: "center",
    fontWeight: "800",
  },
  passInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c2c2c", // Will be overridden dynamically
    borderWidth: 0.6,
    borderColor: "#505050", // Will be overridden dynamically
    borderRadius: 54,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation:10,
  },
  passInput: {
    flex: 1,
    color: "white", // Will be overridden dynamically
    fontSize: 15,
    paddingVertical: 14,

  },
  eyeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginLeft: 4,
  },
  decryptingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    paddingVertical: 8,
  },
  decryptingText: {
    color: "lightgrey",
    fontSize: 13,
    flex: 1,
  },
  fileNameHint: {
    color: "lightgrey",
    fontSize: 12,
    marginTop: 25,
    marginBottom: 6,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetDismissArea: {
    flex: 1,
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#202020", // Will be overridden dynamically
    borderRadius: 58,
    borderWidth: 1,
    borderColor: "#2e2e2e", // Will be overridden dynamically
    padding: 14,
    marginBottom: 16,
  },
  fileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 54,
    backgroundColor: "#001e10",
    borderWidth: 1,
    borderColor: "#005c31",
    justifyContent: "center",
    alignItems: "center",
  },
  fileName: {
    color: "white", // Will be overridden dynamically
    fontSize: 15,
    fontWeight: "700",
  },
  fileMeta: {
    color: "lightgrey", // Will be overridden dynamically
    fontSize: 12,
    marginTop: 4,
  },
  sheetHint: {
    color: "lightgrey", // Will be overridden dynamically
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  downloadedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 52,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  downloadedText: {
    fontSize: 12,
    flex: 1,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 50,
  },
  importModeOption: {
    borderWidth: 1,
    padding: 17,
    paddingVertical: 10,
    marginBottom: 12,
    elevation: ELEVATION_LEVELS.medium,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  downloadBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
  sheetCloseBtn: {
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 14,
    backgroundColor:"#303030",
    borderRadius:50
  },
  sheetCloseText: {
    fontSize: 14,
    fontWeight: "700",
  },
  appearanceOption: {
    borderRadius: 50,
    borderWidth: 1,
    padding: 12,
    paddingVertical:10,
    marginBottom: 12,
    elevation:10
  },
  appearanceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  appearanceModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  appearanceModalDismiss: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  appearanceModalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 45,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  appearanceModalTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  appearanceModalCloseBtn: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  appearanceModalCloseText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default Settings;
