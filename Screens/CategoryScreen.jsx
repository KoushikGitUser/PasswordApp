import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import Foundation from "@expo/vector-icons/Foundation";
import { ScrollView } from "react-native-gesture-handler";
import CategoryCompo from "../Components/CategoryCompo";
import { getPasswords, setSkipLock } from "../utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { generateBackup } from "../backUpGenerator";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as LocalAuthentication from "expo-local-authentication";
import * as FileSystem from "expo-file-system";
import { restoreBackup } from "../importBackup";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Fontisto from "@expo/vector-icons/Fontisto";
import { Cog, LockKeyhole, LockKeyholeOpen, RotateCw } from "lucide-react-native";
import Feather from "@expo/vector-icons/Feather";
import { BlurView } from "@react-native-community/blur";
import { isAutofillSupported, isAutofillEnabled } from "../Services/autofill";
import { buttonStyles } from "../styles/buttonStyles";

const CategoryScreen = ({
  navigation,
  setIsAuthenticated,
  setEnableAutoLock,
  enableAutoLock,
  setautoLockDisabled,
}) => {
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [passwords, setPasswords] = useState([]);
  const [exitAppModalVisible, setExitAppModalVisible] = useState(false);
  const [backUpModalVisible, setbackUpModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [backupLoader, setBackupLoader] = useState(false);
  const [disableAutoLockModalVisible, setDisableAutoLockModalVisible] =
    useState(false);
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);
  const [autofillOnboardVisible, setAutofillOnboardVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const stored = await getPasswords();
      setPasswords(stored);
    };

    const focusListener = navigation.addListener("focus", fetchData);
    return focusListener;
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const supported = await isAutofillSupported();
      if (!supported) return;
      const enabled = await isAutofillEnabled();
      if (!enabled) setAutofillOnboardVisible(true);
    })();
  }, []);

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
    }
  };

  const exportBackup = async () => {
    try {
      setSkipLock(true);
      setBackupLoader(true);
      const backupData = await generateBackup();
      if (!backupData) return;

      const backupJson = JSON.stringify(backupData);
      const fileUri = FileSystem.documentDirectory + "backup.json";

      await FileSystem.writeAsStringAsync(fileUri, backupJson);

      await Sharing.shareAsync(fileUri);
      setSkipLock(false);
    } catch (error) {
      setBackupLoader(false);
      console.error("Error exporting backup:", error);
    } finally {
      setBackupLoader(false);
      setSkipLock(false);
    }
  };

  const fetchPasswords = async () => {
    const stored = await getPasswords();
    setPasswords(stored);
  };

  const categoryCounts = passwords.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const handleLockNow = () => {
    setIsAuthenticated(false);
    setSkipLock(false);
    setEnableAutoLock(true);
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
      restoreBackup();
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
      exportBackup();
    }
  };

  useEffect(() => {
    const backAction = () => {
      setExitAppModalVisible(true);
      return true; // prevent default behavior (exit)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // clean up
  }, [exitAppModalVisible]);

  return (
    <View style={{ flex: 1, backgroundColor: "black", alignItems: "center" }}>
      {backupLoader && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loaderText}>Exporting Backup...</Text>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent
        visible={autofillOnboardVisible}
        onRequestClose={() => setAutofillOnboardVisible(false)}
      >
        <View style={styles.onboardBackdrop}>
          <TouchableOpacity
            style={styles.onboardDismissArea}
            activeOpacity={1}
            onPress={() => setAutofillOnboardVisible(false)}
          />
          <View style={styles.onboardSheet}>

            <View style={styles.onboardIconWrap}>
              <MaterialCommunityIcons
                name="form-textbox-password"
                size={36}
                color="#00c76b"
              />
            </View>
            <Text style={styles.onboardTitle}>Fill Passwords anywhere</Text>
            <Text style={styles.onboardBody}>
              Set Passwords App as your default Autofill service and your saved
              logins will appear on any app or browser login screen.
            </Text>
            <View style={styles.onboardBtnRow}>
              <TouchableOpacity
                style={[styles.onboardBtn, styles.onboardCancelBtn]}
                activeOpacity={0.85}
                onPress={() => setAutofillOnboardVisible(false)}
              >
                <Text style={styles.onboardCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.onboardBtn, styles.onboardGoBtn]}
                activeOpacity={0.85}
                onPress={() => {
                  setAutofillOnboardVisible(false);
                  navigation.navigate("settings", { blinkAutofill: true });
                }}
              >
                <Text style={styles.onboardGoText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
                  style={[styles.modalbtn, buttonStyles.whiteButton]}
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
        visible={exitAppModalVisible}
        onRequestClose={() => setExitAppModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800,marginLeft:8}}>
              Exit App
            </Text>
            <Text style={{ color: "white", fontSize: 16,marginLeft:8 }}>
              Are you sure you want to exit?
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.cancelButton]}
                  onPress={() => setExitAppModalVisible(false)}
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
                  style={[styles.modalbtn, buttonStyles.redButton]}
                  onPress={() => {
                    BackHandler.exitApp();
                    setExitAppModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    Exit
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
                👋 Welcome to your Personal Password Vault!
              </Text>

              <Text style={styles.sectionTitle}>🔐 Security First</Text>
              <Text style={styles.paragraph}>
                Your passwords are stored securely using Android's native vault
                storage system with hardware-backed encryption. This means your passwords
                are encrypted at the device level and protected by your device's secure
                enclave. Nothing is stored online or synced — only you can access your
                saved passwords on this device. If you uninstall this app then you will
                lose all your saved passwords.
              </Text>

              <Text style={styles.sectionTitle}>
                ➕ How to Add Passwords
              </Text>
              <Text style={styles.paragraph}>
                Choose a category that matches your password type, then add your
                password by clicking the Add new button.
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

              <Text style={styles.tip}>
                💡 Tip: Tap any password card to view, edit, or delete it.
              </Text>

              <Text style={styles.sectionTitle}>
                💾 Backup and Import Your Data
              </Text>
              <Text style={styles.paragraph}>
                To protect your important passwords, this app
                provides a simple backup system. You can generate a backup file
                that safely stores all your saved passwords by clicking the
                cloud export icon at the top. This backup file can be shared securely.
                When you reinstall the app or set it up on a
                new device, you can easily import your backup file by clicking
                the cloud import icon at the top to restore all your saved data.
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
                  style={[styles.modalbtn, { backgroundColor: "#383838" }]}
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
      <View
        style={{
          width: "100%",
          height: 100,
          backgroundColor: "black",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 40,
          paddingHorizontal: 23,
        }}
      >
        <Text
          style={{
            paddingTop: 35,
            paddingBottom: 30,
            fontSize: 30,
            color: "white",
            fontWeight: 800,
          }}
        >
          Home
        </Text>

        <View style={styles.backupAndInfo}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("settings", { blinkAutoLock: true })
            }
          >
            {enableAutoLock ? (
              <Ionicons name="lock-closed" style={{ marginRight: 5 }}
                size={26} color="#00c76b" />
            ) : (
              <Ionicons name="lock-open" style={{ marginRight: 5 }}
                size={26}
                color="red" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("settings", { blinkAutoLock: false })
            }
          >
            <Cog size={28} color="lightgrey" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoryMain}>
          <CategoryCompo category="All" quantity={passwords?.length} />
          <CategoryCompo
            category="Banking"
            quantity={categoryCounts["Banking"] || 0}
          />
        </View>
        <View style={styles.categoryMain}>
          <CategoryCompo
            category="Mail or ID"
            quantity={categoryCounts["Mail or ID"] || 0}
          />
          <CategoryCompo
            category="Social"
            quantity={categoryCounts["Social"] || 0}
          />
        </View>
        <View style={styles.categoryMain}>
          <CategoryCompo
            category="Developer"
            quantity={categoryCounts["Developer"] || 0}
          />
          <CategoryCompo category="Wifi" quantity={categoryCounts["Wifi"] || 0} />
        </View>

        {/* <View style={styles.categoryMain}>
          <TouchableOpacity
            onPress={() => navigation.navigate("certificate")}
            style={styles.longCard}
          >
            <View style={[styles.catIconandNum, { width: "100%" }]}>
              <View
                style={[
                  styles.catIconandNum,
                  { gap: 8, alignItems: "center" },
                ]}
              >
                <View style={[styles.idIconPill, { backgroundColor: "#0f2b34" }]}>
                  <FontAwesome6 name="vcard" size={22} color="#6ac3dcff" />
                </View>
                <View style={[styles.idIconPill, { backgroundColor: "#0f3324" }]}>
                  <Ionicons name="id-card-outline" size={22} color="#6bc499ff" />
                </View>
                <View style={[styles.idIconPill, { backgroundColor: "#2b2419" }]}>
                  <Feather name="file-text" size={22} color="#b59769ff" />
                </View>
              </View>

              <View style={[styles.catIconandNum, { gap: 5 }]}>
                <Text style={{ color: "lightgrey", fontSize: 16, fontWeight: 800 }}>
                  {certificatesQuantity}
                </Text>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={20}
                  color="lightgrey"
                />
              </View>
            </View>
            <View style={styles.idTitlePill}>
              <Text style={{ color: "white", fontSize: 17, fontWeight: 800 }}>
                ID Cards and Certificates
              </Text>
            </View>
          </TouchableOpacity>
        </View> */}
        <View style={{height:50}} />
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabFirst}
          onPress={fetchPasswords}
          activeOpacity={0.7}
        >
          <Ionicons name="reload-circle" size={35} color="orange" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fab}
          onPress={handleLockNow}
          activeOpacity={0.7}
        >
          <Ionicons name="lock-closed" style={{ marginRight: 5 }}
                  size={30} color="#00c76b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerWrapper: {
    borderRadius: 6,
    marginBottom: 20,
    overflow: "hidden",
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
  catIconandNum: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disablebtn: {
    backgroundColor: "#391414",
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    width: "100%",
    borderWidth: 0.5,
    borderColor: "#930000",
    gap: 10,
  },
  backupAndInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1c1c1cff",
    gap: 30,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgb(63, 63, 63)",
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
    color: "lightgrey",
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
  tip: {
    fontSize: 16,
    marginTop: 15,
    color: "lightgrey",
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
  longCard: {
    width: "100%",
    borderRadius: 33,
    paddingHorizontal: 12,
    paddingVertical: 12,
    margin: "auto",
    backgroundColor: "#171717ff",
    gap: 20,
    borderWidth: 0.5,
    borderColor: "#4c4c4cff",
  },
  idIconPill: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#4c4c4cff",
  },
  idTitlePill: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: "#242424",
    borderWidth: 0.5,
    borderColor: "#4c4c4cff",
  },
  categoryMain: {
    width: "100%",
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
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
  fabContainer: {
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    width: "100%",
    height: 130,
    backgroundColor: "black",
    paddingHorizontal: 23,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fabFirst: {
    backgroundColor: "#231100ff",
    borderWidth:0.5,
    borderColor:"#643100",
    width: 100,
    height: 60,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
    gap: 10,
  },
  fab: {
    backgroundColor: "#001e10",
    borderWidth:0.5,
    borderColor:"#005c31",
    width: 100,
    height: 60,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
  },
  onboardBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  onboardDismissArea: {
    flex: 1,
  },
  onboardSheet: {
    backgroundColor: "#171717",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#2c2c2c",
    alignItems: "center",
  },
  onboardHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    marginBottom: 20,
  },
  onboardIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 50,
    backgroundColor: "#001e10",
    borderWidth: 1,
    borderColor: "#005c31",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  onboardTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  onboardBody: {
    color: "lightgrey",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  onboardBtnRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  onboardBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  onboardCancelBtn: {
    backgroundColor: "#2c2c2c",
    borderWidth: 1,
    borderColor: "#363636",
  },
  onboardCancelText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  onboardGoBtn: {
    ...buttonStyles.whiteButton,
  },
  onboardGoText: {
    color: "#007a47",
    fontSize: 15,
    fontWeight: "800",
  },
  scrollContent: {
    flex: 1,
    width: "100%",
  },
  scrollContentContainer: {
    paddingBottom: 130,
  },
});

export default CategoryScreen;
