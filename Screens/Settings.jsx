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
import { deleteAllCertificates, fetchCertificates } from "../utilsForCertificate";
import { generateBackup } from "../backUpGenerator";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Info, RefreshCw, ShieldCheck, ShieldX, Trash } from "lucide-react-native";
import { BlurView } from "@react-native-community/blur";
import * as SecureStore from "expo-secure-store";
import { triggerToast } from "../Services/toast";

const Settings = ({
  onDataAdded,
  setEnableAutoLock,
  autoLockDisabled,
  setautoLockDisabled,
  enableAutoLock,
  navigation,
  route,
}) => {
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

  const blinkAutoLock = route.params?.blinkAutoLock || false;
  const blinkAutofill = route.params?.blinkAutofill || false;

  const opacity = useRef(new Animated.Value(1)).current;
  const autofillOpacity = useRef(new Animated.Value(1)).current;
  const blinkRef = useRef(null);

  useEffect(() => {
    checkIfPinSet();
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
    const unsub = navigation.addListener("focus", refreshAutofillStatus);
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

  useEffect(() => {
    if (blinkAutoLock) {
      let blinkCount = 0;

      const blink = () => {
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          blinkCount++;
          if (blinkCount < 3) {
            blink(); // repeat until 3 times
          }
        });
      };

      blink();
    }
  }, [blinkAutoLock]);

  useEffect(() => {
    if (!blinkAutofill) return;
    let count = 0;
    const blink = () => {
      Animated.sequence([
        Animated.timing(autofillOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(autofillOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        count += 1;
        if (count < 3) blink();
      });
    };
    blink();
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
      await deleteAllCertificates();
      await SecureStore.deleteItemAsync("userSecurityPIN");
      setIsSecurityPinSet(false);

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
      const ok = await commitBackupPayload(file.payload);
      if (ok) {
        triggerToast(
          "Imported",
          "Legacy backup imported. Re-export to encrypt.",
          "success",
          3500
        );
        onDataAdded && onDataAdded();
      } else {
        triggerToast("Import failed", "Could not save imported data.", "error", 3500);
      }
      return;
    }
    if (file.status === "encrypted") {
      setPendingEnvelope(file.envelope);
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
    setExportPassphraseModalVisible(false);
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
      const ok = await commitBackupPayload(payload);
      if (ok) {
        setImportPassphraseModalVisible(false);
        setPendingEnvelope(null);
        setImportPassphrase("");
        setImportError("");
        triggerToast(
          "Imported",
          "Encrypted backup decrypted and restored.",
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
        backgroundColor: "black",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Modal
        animationType="fade"
        transparent
        visible={backupLoader}
        onRequestClose={() => {}}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator size="large" color="#00c787" />
              <Text style={{ color: "white", fontSize: 18, fontWeight: 800, marginTop: 20 }}>
                Encrypting backup
              </Text>
              <Text style={{ color: "lightgrey", fontSize: 14, textAlign: "center", marginTop: 10, lineHeight: 20 }}>
                Deriving the encryption key. This can take a while — please keep the app open.
              </Text>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={authNotAvailableModal}
        onRequestClose={() => setAuthNotAvailableModal(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
              Authentication Not Available
            </Text>
            <Text style={{ color: "white", fontSize: 16, marginTop: 10 }}>
              Your device does not have any authentication method set up. Please set up a PIN, password, or biometric authentication in your device settings.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
                  onPress={() => setAuthNotAvailableModal(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "black" }}
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
        animationType="slide"
        transparent
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent]}>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text
                style={[styles.paragraph, { color: "white", fontWeight: 800 }]}
              >
                👋 Welcome to your Personal Password and Files Vault!
              </Text>

              <Text style={styles.sectionTitle}>🔐 Security First</Text>
              <Text style={styles.paragraph}>
                Your passwords and files are stored securely using Expo's Secure
                Store, which uses device-level encryption means your passwords
                are saved in encrypted form which no one can read. Nothing is
                stored online or synced — only you can access your saved
                passwords. If you uninstall this app then you will loose all
                your saved passwords
              </Text>

              <Text style={styles.sectionTitle}>
                ➕ How to Add Passwords/Certificates
              </Text>
              <Text style={styles.paragraph}>
                For Passwords, choose a particular category as per your
                password. Then add password by clicking the Add new button. For
                IDs/Certificates do the same thing for passwords.
              </Text>

              <Text style={styles.sectionTitle}>📂 Categories & Colors</Text>
              <Text style={styles.paragraph}>
                Use categories to organize your saved passwords. Each has a
                color and a dedicated icon for the same to recognise:
              </Text>
              <Text style={styles.bullet}>
                🟠 Banking – Credit cards, banking logins
              </Text>
              <Text style={styles.bullet}>
                🔴 Mail or ID – Gmail, personal accounts
              </Text>
              <Text style={styles.bullet}>
                🟢 Social – Facebook, Instagram,
              </Text>
              <Text style={styles.bullet}>
                🟣 Developer – GitHub, Firebase, etc.
              </Text>
              <Text style={styles.bullet}>
                🔵 Wi-Fi – Home or office Wi-Fi credentials
              </Text>

              <Text style={styles.sectionTitle}>For IDs/Certificates</Text>

              <Text style={styles.bullet}>
                Portrait – Voter Card,Passport etc.
              </Text>
              <Text style={styles.bullet}>
                Landscape – Pan Card,Adhaar Card etc.
              </Text>
              <Text style={styles.bullet}>
                File – Admit Card, Marksheets etc.
              </Text>

              <Text style={styles.tip}>
                💡 Tip: Tap any password card to view, edit, or delete it.
              </Text>

              <Text style={styles.sectionTitle}>🪄 Autofill</Text>
              <Text style={styles.paragraph}>
                This app can fill your saved logins on any other app or
                website — just like Google Passwords or Bitwarden. To enable
                it, tap the "Enable Autofill" card above and pick this app as
                your default autofill service in the system dialog.
              </Text>

              <Text style={styles.sectionTitle}>🔗 Linking passwords to apps</Text>
              <Text style={styles.paragraph}>
                Autofill knows which saved password belongs to which login
                screen using two keys on each record: a list of Android
                package names (e.g. com.instagram.android) and a list of
                website domains (e.g. instagram.com). Open any password, tap
                edit, and use LINKED APPS / LINKED WEBSITES to add these.
                "Add from installed apps" opens a picker of every app you
                have installed, so you don't have to type the package id by
                hand.
              </Text>

              <Text style={styles.paragraph}>
                If a login screen has no linked match yet, the autofill
                suggestion shows a "Search in Passwords" row — tapping it
                opens your vault, and picking a record auto-links that app
                for next time.
              </Text>

              <Text style={styles.sectionTitle}>🔐 Biometric before fill</Text>
              <Text style={styles.paragraph}>
                Every autofill action is gated behind your phone's biometric
                or device credential — fingerprint, face, or PIN. Nobody
                holding your unlocked phone can dump your passwords into a
                foreign login form without passing that check. If your
                device has no biometric enrolled, autofill still works but
                without the extra prompt.
              </Text>

              <Text style={styles.sectionTitle}>💾 Save prompts</Text>
              <Text style={styles.paragraph}>
                When you sign up or log in somewhere Android doesn't have
                a match for, it will offer to save the credentials to this
                app. You'll see a dialog with the detected username, a
                masked password, the source app or website, an editable
                label, and a category chip that we pre-pick based on the
                app (Instagram → Social, your bank → Banking, etc). Tap
                "Save password" and biometric-confirm.
              </Text>

              <Text style={styles.sectionTitle}>
                💾 Backup and Import Your Data
              </Text>
              <Text style={styles.paragraph}>
                To protect your data, this app supports encrypted JSON
                backups. From Settings → Generate Backup, after biometric
                you'll pick a passphrase — we use AES-256-GCM with
                PBKDF2-SHA256 to encrypt the file. Only someone with that
                exact passphrase can restore it. The passphrase is not
                stored anywhere — if you forget it, the backup file cannot
                be decrypted. Images linked to certificates are saved
                inside the app's storage; if you uninstall, those images
                are lost, so keep an extra copy in your gallery if they
                matter. To restore on a new device, import the backup via
                Settings → Import Backup and enter the passphrase.
              </Text>

              <Text style={styles.footer}>
                We hope this app makes your digital life safer and easier!
              </Text>

              <Text style={[styles.footer, { color: "#00c787" }]}>
                Designed and Developed by KOUSHIK CHAKRABORTY
              </Text>
            </ScrollView>

            <View style={[styles.buttonRow, { justifyContent: "center" }]}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => setInfoModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
      <Modal
        animationType="slide"
        transparent
        visible={importModalVisible}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
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
            <Text style={{ color: "white", fontSize: 16, paddingBottom: 20 }}>
              Please choose the exported backup file from your device and
              import.
            </Text>
            <Text style={{ color: "red", fontSize: 16 }}>
              Note: Importing backup file will replace all your current datas
              and your current datas will be lost. Don't add any passwords or
              image before importing any backup file.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => setImportModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
                  onPress={() => {
                    checkFingerprintForImport();
                    setImportModalVisible(false);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "green" }}
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
        animationType="slide"
        transparent
        visible={securityPinModalVisible}
        onRequestClose={() => setSecurityPinModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 16 }}>
              Add another level of security to protect your passwords, add a security PIN and you have to provide this PIN in lockscreen to open the app for extended security.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
                  onPress={() => openPinModal("set")}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "black" }}
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
        animationType="slide"
        transparent
        visible={pinInputModalVisible}
        onRequestClose={() => setPinInputModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>
              {pinMode === "update" ? "Update Security PIN" : "Set Security PIN"}
            </Text>
            <Text style={{ color: "lightgrey", fontSize: 14, textAlign: "center", marginBottom: 20 }}>
              Enter a 6-digit PIN
            </Text>

            <View style={styles.pinInputContainer}>
              {pinDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (pinInputRefs.current[index] = ref)}
                  style={styles.pinInput}
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
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => {
                    setPinInputModalVisible(false);
                    setPinDigits(["", "", "", "", "", ""]);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
                  onPress={handleSetPin}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "black" }}>
                    Set
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={deletePinModalVisible}
        onRequestClose={() => setDeletePinModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 16 }}>
              Are you sure you want to delete your security PIN?
            </Text>
            <Text style={{ color: "red", fontSize: 16, fontWeight: 800, marginTop: 10 }}>
              This action cannot be undone!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => setDeletePinModalVisible(false)}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "red", borderWidth: 0.5, borderColor: "#ff9999" }]}
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
        animationType="slide"
        transparent
        visible={deleteAllDataModalVisible}
        onRequestClose={() => setDeleteAllDataModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "red", fontSize: 18, fontWeight: 800, marginBottom: 15 }}>
              Delete All Data
            </Text>
            <Text style={{ color: "white", fontSize: 16, marginBottom: 10 }}>
              This action will permanently delete all your saved passwords, certificates, and security PIN.
            </Text>
            <Text style={{ color: "red", fontSize: 16, fontWeight: 800 }}>
              This action is irreversible and cannot be undone!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => setDeleteAllDataModalVisible(false)}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "red", borderWidth: 0.5, borderColor: "#ff9999" }]}
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
        animationType="slide"
        transparent
        visible={deleteAllPinInputModalVisible}
        onRequestClose={() => {
          setDeleteAllPinInputModalVisible(false);
          setDeleteAllPinDigits(["", "", "", "", "", ""]);
        }}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "red", fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>
              Confirm Deletion
            </Text>
            <Text style={{ color: "white", fontSize: 14, textAlign: "center", marginBottom: 20 }}>
              Enter your 6-digit security PIN to confirm
            </Text>

            <View style={styles.pinInputContainer}>
              {deleteAllPinDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (deleteAllPinInputRefs.current[index] = ref)}
                  style={styles.pinInput}
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
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => {
                    setDeleteAllPinInputModalVisible(false);
                    setDeleteAllPinDigits(["", "", "", "", "", ""]);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "red", borderWidth: 0.5, borderColor: "#ff9999" }]}
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
        animationType="slide"
        transparent
        visible={exportResultVisible}
        onRequestClose={dismissExportResult}
      >
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity
            style={styles.sheetDismissArea}
            activeOpacity={1}
            onPress={dismissExportResult}
          />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Backup Ready</Text>

            <View style={styles.fileCard}>
              <View style={styles.fileIconWrap}>
                <MaterialCommunityIcons
                  name="file-lock"
                  size={36}
                  color="#00c787"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={styles.fileName}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {exportedFile?.name}
                </Text>
                <Text style={styles.fileMeta}>
                  Encrypted JSON · {formatBytes(exportedFile?.size)}
                </Text>
              </View>
            </View>

            {downloadedTo ? (
              <View style={styles.downloadedBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#00c787" />
                <Text style={styles.downloadedText} numberOfLines={2}>
                  Saved to: {downloadedTo}
                </Text>
              </View>
            ) : (
              <Text style={styles.sheetHint}>
                Save this file to your phone. First time, you'll pick a folder
                (choose "Download") — we'll remember it for next time.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.downloadBtn,
                downloading && { opacity: 0.6 },
              ]}
              onPress={handleDownloadToPhone}
              disabled={downloading}
              activeOpacity={0.85}
            >
              {downloading ? (
                <ActivityIndicator color="black" />
              ) : (
                <>
                  <Ionicons name="download" size={22} color="black" />
                  <Text style={styles.downloadBtnText}>
                    {downloadedTo ? "Download again" : "Download"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={dismissExportResult}
            >
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={exportPassphraseModalVisible}
        onRequestClose={() => setExportPassphraseModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
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
            <Text style={{ color: "white", fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
              Choose a Password to encrypt this backup. You'll need the exact
              same Password to restore it later.
            </Text>
            <Text
              style={{
                color: "#ff0000",
                fontSize: 13,
                marginBottom: 18,
                lineHeight: 18,
              }}
            >
              This Password is NOT stored anywhere. If you forget it, the
              backup file cannot be recovered.
            </Text>

            <View style={styles.passInputRow}>
              <TextInput
                style={styles.passInput}
                placeholder="Password (Min 12 characters)"
                placeholderTextColor="#7a7a7a"
                value={exportPassphrase}
                onChangeText={setExportPassphrase}
                secureTextEntry={!exportShowPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setExportShowPass((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={exportShowPass ? "eye-off" : "eye"}
                  size={22}
                  color="lightgrey"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passInputRow}>
              <TextInput
                style={styles.passInput}
                placeholder="Confirm Password"
                placeholderTextColor="#7a7a7a"
                value={exportPassphraseConfirm}
                onChangeText={setExportPassphraseConfirm}
                secureTextEntry={!exportShowPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.fileNameHint}>
              File name (optional) — leave blank for default name.
            </Text>
            <View style={styles.passInputRow}>
              <TextInput
                style={styles.passInput}
                placeholder="e.g. work-backup"
                placeholderTextColor="#7a7a7a"
                value={exportCustomFileName}
                onChangeText={setExportCustomFileName}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={60}
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
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => {
                    setExportPassphraseModalVisible(false);
                    setExportPassphrase("");
                    setExportPassphraseConfirm("");
                    setExportCustomFileName("");
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[
                    styles.modalbtn,
                    {
                      backgroundColor:
                        exportPassphrase.length >= 12 &&
                        exportPassphrase === exportPassphraseConfirm
                          ? "white"
                          : "#5a5a5a",
                    },
                  ]}
                  onPress={handleConfirmExport}
                  disabled={
                    exportPassphrase.length < 12 ||
                    exportPassphrase !== exportPassphraseConfirm
                  }
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color:
                        exportPassphrase.length >= 12 &&
                        exportPassphrase === exportPassphraseConfirm
                          ? "#007a47"
                          : "#9a9a9a",
                    }}
                  >
                    Encrypt
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={importPassphraseModalVisible}
        onRequestClose={cancelImportFlow}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
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
            <Text style={{ color: "white", fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
              This backup file is encrypted. Enter the Password you used when
              exporting it.
            </Text>

            <View style={styles.passInputRow}>
              <TextInput
                style={styles.passInput}
                placeholder="Password"
                placeholderTextColor="#7a7a7a"
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
                    { backgroundColor: "#383838", opacity: decrypting ? 0.5 : 1 },
                  ]}
                  onPress={cancelImportFlow}
                  disabled={decrypting}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[
                    styles.modalbtn,
                    {
                      backgroundColor: decrypting ? "#5a5a5a" : "white",
                    },
                  ]}
                  onPress={handleConfirmImport}
                  disabled={decrypting}
                >
                  {decrypting ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text
                      style={{ fontSize: 15, fontWeight: 800, color: "#007a47" }}
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
        animationType="slide"
        transparent
        visible={backUpModalVisible}
        onRequestClose={() => setbackUpModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
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
            <Text style={{ color: "white", fontSize: 16, paddingBottom: 20 }}>
              It’s crucial to back up your passwords and certificates. All your
              data is securely stored locally on this device and is not synced
              to any cloud service for your privacy and security. If you
              uninstall this app, clear its data, or wipe your device, all your
              saved passwords and certificates will be permanently lost. Please
              Backup your passwords/datas before you unistall this app or wipe
              your device.
            </Text>

            <Text style={{ color: "red", fontSize: 16 }}>
              Note: A backup.json file will be created, don't share that with
              anyone as that file contains all your passwords.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => setbackUpModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
                  onPress={() => {
                    checkFingerprintForExport();
                    setbackUpModalVisible(false);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "green" }}
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
          backgroundColor: "black",
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
            color="white"
            style={{
              backgroundColor: "#2a2a2a",
              padding: 8,
              borderRadius: 50,
            }}
          />
        
        </TouchableOpacity>
        <Text
          style={{
            paddingHorizontal: 20,
            paddingTop: 25,
            paddingBottom: 30,
            fontSize: 30,
            color: "white",
            fontWeight: 800,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ width: "100%", paddingHorizontal: 20 }}
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
            <Ionicons name="cloud-download" size={28} color="lightgrey" />

            <Text
              style={{
                color: "lightgrey",
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
            const certificates = await fetchCertificates();

            if (passwords.length === 0 && certificates.length === 0) {
              triggerToast("Nothing exists to backup", "info");
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
            <Ionicons name="cloud-upload" size={28} color="lightgrey" />

            <Text
              style={{
                color: "lightgrey",
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              Generate Backup
            </Text>
          </View>
        </TouchableOpacity>

        {/* Security Category */}
        <View style={{ marginTop: 20 }} />

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
                borderWidth: 1,
                borderColor: enableAutoLock ? "#005c31" : "#780000",
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
            ]}
          >
            <View style={{ flexDirection: "row", gap: 20, marginLeft: 10 }}>
              {enableAutoLock ? (
                <ShieldCheck strokeWidth={1.5} size={30}
                  color="#00c76b" />
              ) : (
                <ShieldX  strokeWidth={1.5} size={30}
                  color="red" />
              )}

              <Text
                style={{
                  color: enableAutoLock ? "#00c76b" : "red",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Auto-Lock
              </Text>
            </View>

            {enableAutoLock ? (
              <FontAwesome
                style={{ marginRight: 10 }}
                name="toggle-on"
                size={30}
                color="green"
              />
            ) : (
              <FontAwesome
                name="toggle-off"
                size={30}
                color="red"
                style={{ marginRight: 10 }}
              />
            )}
          </TouchableOpacity>
        </Animated.View>

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
              <MaterialCommunityIcons name="keyboard-settings" size={24} color="lightgrey" />

              <Text
                style={{
                  color: "lightgrey",
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
                  <MaterialCommunityIcons name="keyboard-settings" size={24} color="lightgrey" />
                  <RefreshCw size={14} color="lightgrey" style={{ marginLeft: 5 }} />
                </View>

                <Text
                  style={{
                    color: "lightgrey",
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
                  backgroundColor: "#200000",
                  borderWidth: 1,
                  borderColor: "#780000",
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

        <Animated.View style={{ opacity: autofillOpacity }}>
        <TouchableOpacity
          onPress={handleAutofillTap}
          activeOpacity={0.8}
          style={[
            styles.settingsMain,
            {
              paddingVertical: 18,
              borderRadius: 35,
              backgroundColor: autofillOn ? "#001e10" : "#1c1c1c",
              borderWidth: 1,
              borderColor: autofillOn ? "#005c31" : "#242424",
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              marginLeft: 10,
              alignItems: "center",
              flex: 1,
            }}
          >
            <MaterialCommunityIcons
              name={autofillOn ? "form-textbox-password" : "form-textbox"}
              size={26}
              color={autofillOn ? "#00c76b" : "lightgrey"}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: autofillOn ? "#00c76b" : "lightgrey",
                  fontSize: 17,
                  fontWeight: "700",
                }}
              >
                {autofillOn ? "Autofill Enabled" : "Enable Autofill"}
              </Text>
              <Text
                style={{
                  color: autofillOn ? "#7ad9a6" : "#7a7a7a",
                  fontSize: 12,
                  marginTop: 2,
                }}
                numberOfLines={2}
              >
                {autofillSupported
                  ? autofillOn
                    ? "Passwords is set as your default autofill service."
                    : "Fill saved passwords in other apps and browsers."
                  : "Requires Android 8 or newer."}
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="arrow-forward-ios"
            size={18}
            color={autofillOn ? "#00c76b" : "lightgrey"}
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>
        </Animated.View>

        {/* Danger Zone */}
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
              backgroundColor: "red",
              borderWidth: 0.5,
              borderColor: "#ff9999",
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
            <Info strokeWidth={2} size={26} color="lightgrey" />

            <Text
              style={{
                color: "lightgrey",
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
    color: "lightgrey",
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
    color: "white",
  },
  searchpass: {
    width: "80%",
    color: "white",
  },
  bullet: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 5,
    color: "lightgrey",
  },
  settingsMain: {
    width: "100%",
    backgroundColor: "#1c1c1c",
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#242424ff",
  },
  tip: {
    fontSize: 16,
    marginTop: 15,
    fontStyle: "italic",
    color: "lightgrey",
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
    color: "white",
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
    width: "auto",
    height: "auto",
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: "red",
    paddingVertical: 12,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#ff9999",
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
  modalContent: {
    backgroundColor: "#202020ff",
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop:30,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#3d3d3d",
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#3d3d3d",
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    color: "white",
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
    backgroundColor: "#383838",
    borderWidth: 1,
    borderColor: "#505050",
    color: "white",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "800",
  },
  passInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderWidth: 0.6,
    borderColor: "#505050",
    borderRadius: 54,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  passInput: {
    flex: 1,
    color: "white",
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
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheetDismissArea: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: "#171717",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#2c2c2c",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    marginBottom: 14,
  },
  sheetTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#202020",
    borderRadius: 58,
    borderWidth: 1,
    borderColor: "#2e2e2e",
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
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  fileMeta: {
    color: "lightgrey",
    fontSize: 12,
    marginTop: 4,
  },
  sheetHint: {
    color: "lightgrey",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  downloadedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#001e10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#005c31",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  downloadedText: {
    color: "#c8ffe0",
    fontSize: 12,
    flex: 1,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#cfcfcf",
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 16,
    borderRadius: 50,
  },
  downloadBtnText: {
    color: "black",
    fontSize: 16,
    fontWeight: "800",
  },
  sheetCloseBtn: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
    backgroundColor:"#303030",
    borderRadius:50
  },
  sheetCloseText: {
    color: "lightgrey",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default Settings;
