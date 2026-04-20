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
import { fetchCertificates } from "../utilsForCertificate";
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
  const [certificatesQuantity, setCertificatesQuantity] = useState(0);
  const [backupLoader, setBackupLoader] = useState(false);
  const [disableAutoLockModalVisible, setDisableAutoLockModalVisible] =
    useState(false);
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const stored = await getPasswords();
      setPasswords(stored);
    };

    const focusListener = navigation.addListener("focus", fetchData);
    return focusListener;
  }, [navigation]);

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

  useEffect(() => {
    handleFetchCertificates();
  }, []);

  const handleFetchCertificates = async () => {
    const certs = await fetchCertificates();
    setCertificatesQuantity(certs?.length);
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
                  style={[styles.modalbtn, { backgroundColor: "white" }]}
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
                  style={[styles.modalbtn, { backgroundColor: "#383838" }]}
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
                  style={[styles.modalbtn, { backgroundColor: "red" }]}
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

              <Text style={styles.sectionTitle}>
                💾 Backup and Import Your Data
              </Text>
              <Text style={styles.paragraph}>
                To protect your important passwords and certificates, this app
                provides a simple backup system. You can generate a backup file
                that safely stores all your saved passwords by clicking the
                cloud export icon at the top, certificates, and associated data.
                This backup file can be shared securely. Please note: Images
                linked to certificates are saved inside the app’s storage. If
                you uninstall the app, these images will be deleted from your
                device. To fully protect your data, make sure to keep a backup
                file and save important certificate images separately to your
                gallery if needed. When you reinstall the app or set it up on a
                new device, you can easily import your backup file by clicking
                the cloud import icon at the top to restore all your saved data.
                Now after restoring edit the certificates and change or update
                the images by the images that you kept as backup on your device.
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

      <View style={styles.categoryMain}>
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
    borderWidth: 0.5,
    borderColor: "#383838ff",
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
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#505050",
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 8,
    color: "white",
  },
  modalbtn: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 54,
    backgroundColor: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  fabFirst: {
    position: "absolute",
    bottom: 50,
    left: 23,
    backgroundColor: "#231100ff",
    borderWidth:0.5,
    borderColor:"#643100",
    width: 100,
    height: "60",
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
    position: "absolute",
    bottom: 50,
    right: 23,
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
});

export default CategoryScreen;
