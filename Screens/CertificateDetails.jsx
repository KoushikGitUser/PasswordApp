import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ToastAndroid,
  TextInput,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Fontisto from "@expo/vector-icons/Fontisto";
import {
  deleteCertificateByIndex,
  editCertificateByIndex,
  fetchCertificates,
} from "../utilsForCertificate";
import ImageViewing from "react-native-image-viewing";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { setSkipLock } from "../utils";
import Feather from "@expo/vector-icons/Feather";
import * as LocalAuthentication from "expo-local-authentication";
import { triggerToast } from "../Services/toast";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { ChevronDown } from "lucide-react-native";
import Toaster from "../Components/UniversalToaster/Toaster";
import { BlurView } from "@react-native-community/blur";
import { ScrollView } from "react-native-gesture-handler";
import { buttonStyles } from "../styles/buttonStyles";

const CertificateDetails = ({ navigation, route }) => {
  const { index, categories } = route.params;
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [pinNum, setPinNum] = useState("");
  const [showImage, setShowImage] = useState(null);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [category, setCategory] = useState(categories);
  const [deletePassModalVisible, setDeletePassModalVisible] = useState(false);
  const [notUpdatedModalVisible, setNotUpdatedModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pickedImage, setPickedImage] = useState(null);
  const [backToInitial, setBackToInitial] = useState(1);

  const [initialName, setInitialName] = useState("");
  const [initialPinNum, setInitialPinNum] = useState("");
  const [initialCategory, setInitialCategory] = useState("");
  const [initialImage, setInitialImage] = useState(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);

  const categoryOptions = [
    { label: "Portrait", value: "Portrait" },
    { label: "Landscape", value: "Landscape" },
    { label: "File", value: "File" },
  ];

  useEffect(() => {
    const fetch = async () => {
      const all = await fetchCertificates();
      const item = all[index];
      setName(item?.name);
      setPinNum(item?.pinNum);
      setShowImage(item?.imageUri);

      setInitialName(item?.name);
      setInitialPinNum(item?.pinNum);
      setInitialImage(item?.imageUri);
      setInitialCategory(categories);
    };
    fetch();
  }, [backToInitial]);

  useEffect(() => {
    setTimeout(() => {
      if (showPass) {
        setShowPass(false);
      }
    }, 2000);
  }, [showPass]);

  const landscape = "#008eb6";
  const portrait = "#005f33";
  const file = "#9d5e00";

  const handleDownloadImage = async () => {
    setSkipLock(true);
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Cannot save image without storage permission."
        );
        return;
      }

      const fileName = showImage.split("/").pop();
      const fileUri = FileSystem.cacheDirectory + fileName;

      // Download the image to cache
      await FileSystem.copyAsync({ from: showImage, to: fileUri });

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("Download", asset, false);

      ToastAndroid.show("Saved to gallery.", ToastAndroid.SHORT);
      setSkipLock(false);
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image.");
    }
  };

  const handleSave = async () => {
    if (
      categories == category &&
      initialName == name &&
      (pickedImage == null || pickedImage == "") &&
      initialPinNum == pinNum
    ) {
      setNotUpdatedModalVisible(true);
    } else {
      const updatedInfo = {
        name: name,
        pinNum: pinNum,
        category: category,
      };
      setEditModalVisible(false);
      const success = await editCertificateByIndex(
        index,
        updatedInfo,
        pickedImage
      );
      if (success) {
        navigation.goBack();
        triggerToast("Updated", "Successfully updated", "success", 4000);
      } else {
        Alert.alert("Error", "Failed to update certificate.");
      }
    }
  };

  const handleDelete = async () => {
    setDeletePassModalVisible(false);
    await deleteCertificateByIndex(index);
    triggerToast("Deleted", "Successfully deleted", "success", 4000);
    navigation.goBack();
  };

  const copyToClipboard = async (text, item) => {
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
      await Clipboard.setStringAsync(text);
      triggerToast("Copied", "Number copied to clipboard", "success", 4000);
    }
  };

  const checkFingerprint = async () => {
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
      setShowPass(true);
    }
  };

  const checkFingerprintForDeletion = async () => {
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
      handleDelete();
    }
  };

  const checkFingerprintForUpdation = async () => {
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
      handleSave();
    }
  };

  const pickImage = async () => {
    setSkipLock(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        mediaTypes: ["images"],
        quality: 1,
      });

      if (result.canceled) return null;
      setSkipLock(false);

      const localUri = result.assets[0].uri;
      const fileName = localUri.split("/").pop();
      const newPath = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({ from: localUri, to: newPath });

      return newPath; // Return the image path (store in local state)
    } catch (error) {
      console.error("Error picking image:", error);
      return null;
    }
  };

  const handlePickImage = async () => {
    const imagePath = await pickImage();
    if (imagePath) setPickedImage(imagePath);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
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
        visible={notUpdatedModalVisible}
        onRequestClose={() => setNotUpdatedModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
              Couldn't Update
            </Text>
            <Text style={{ color: "white", fontSize: 16 }}>
              You didn't change anything to save!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838" }]}
                  onPress={() => {
                    setNotUpdatedModalVisible(false);
                  }}
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
        visible={deletePassModalVisible}
        onRequestClose={() => setDeletePassModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 16 }}>
              Are you sure you want to delete this ID/Certificate?
            </Text>
            <Text style={{ color: "red", fontSize: 16, fontWeight: 800 }}>
              This action is irreversible!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.cancelButton]}
                  onPress={() => setDeletePassModalVisible(false)}
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
                  onPress={checkFingerprintForDeletion}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
      <StatusBar />
      <View
        style={[styles.statusbar, { height: StatusBar.currentHeight }]}
      ></View>
      <View
        style={{
          width: "100%",
          paddingTop: 35,
          paddingBottom: 30,
          backgroundColor: "black",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("certificate")}>
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
            marginLeft: 20,
            fontSize: 25,
            color: "white",
            fontWeight: "800",
          }}
        >
          Details
        </Text>
      </View>
      <Modal
        animationType="slide"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholderTextColor="lightgrey"
              placeholder="Name/Label"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholderTextColor="lightgrey"
              placeholder="Number"
              value={pinNum}
              onChangeText={setPinNum}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <Text
                style={{
                  color: category ? "white" : "lightgrey",
                  fontSize: 16,
                }}
              >
                {category || "Select Category"}
              </Text>
              <ChevronDown size={30} color="lightgrey" strokeWidth={1.75} />
            </TouchableOpacity>

            <View style={{ width: "100%" }}>
              <TouchableOpacity
                style={[
                  styles.modalbtn,
                  { paddingVertical: 15, backgroundColor: "grey" },
                ]}
                onPress={() => handlePickImage()}
              >
                <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                  Update Image
                </Text>
              </TouchableOpacity>
            </View>

            {pickedImage !== null && pickedImage !== "" ? (
              <View style={styles.imageViewMain}>
                <Image
                  source={{ uri: pickedImage }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 35,
                    borderWidth: 3,
                    borderColor: "white",
                  }}
                />
              </View>
            ) : (
              <View style={styles.imageViewMain}>
                <Image
                  source={{ uri: showImage }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 35,
                    borderWidth: 3,
                    borderColor: "grey",
                  }}
                />
              </View>
            )}

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.cancelButton]}
                  onPress={() => {
                    setBackToInitial(backToInitial + 1);
                    setPickedImage(null);
                    setEditModalVisible(false);
                  }}
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
                  style={[styles.modalbtn, buttonStyles.whiteButton]}
                  onPress={checkFingerprintForUpdation}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "black" }}
                  >
                    Update
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
        visible={categoryPickerVisible}
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Select Category
            </Text>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryOption,
                  category === option.value && styles.categoryOptionSelected,
                ]}
                onPress={() => {
                  setCategory(option.value);
                  setCategoryPickerVisible(false);
                }}
              >
                <Text
                  style={{
                    color: category === option.value ? "white" : "lightgrey",
                    fontSize: 16,
                    fontWeight: category === option.value ? 700 : 400,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.modalbtn,
                { marginTop: 20, backgroundColor: "#343434ff" },
              ]}
              onPress={() => setCategoryPickerVisible(false)}
            >
              <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      <ImageViewing
        images={[{ uri: showImage }]}
        imageIndex={0}
        visible={isImageVisible}
        onRequestClose={() => setIsImageVisible(false)}
      />

      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.passmain}>
          <View
            style={[
              styles.passviewflex,
              {
                width: "95%",
                paddingBottom: 20,
                borderBottomWidth: 0.5,
                borderBottomColor: "#5d5d5dff",
              },
            ]}
          >
            <View style={styles.pic}>
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color:
                    categories === "Landscape"
                      ? landscape
                      : categories === "Portrait"
                      ? portrait
                      : file,
                }}
              >
                V
              </Text>
            </View>
            <View style={styles.name_and_user}>
              <Text style={styles.texts}>Name</Text>
              <Text
                style={[styles.texts, { color: "lightgrey" }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {name}
              </Text>
            </View>
            <View style={styles.categoryPillContainer}>
              <View style={styles.categoryPill}>
                {categories == "Landscape" ? (
                  <FontAwesome6 name="vcard" size={20} color="#6ac3dcff" />
                ) : categories == "Portrait" ? (
                  <Ionicons name="id-card-outline" size={22} color="#6bc499ff" />
                ) : (
                  <Feather name="file-text" size={22} color="#b59769ff" />
                )}
              </View>
            </View>
          </View>

          <View
            style={[
              styles.passviewflex,
              {
                width: "95%",
                paddingTop: 20,
              },
            ]}
          >
            <View style={styles.pic}>
              <Fontisto
                name="key"
                size={24}
                color={
                  categories === "Landscape"
                    ? landscape
                    : categories === "Portrait"
                    ? portrait
                    : file
                }
              />
            </View>
            <View style={styles.name_and_user}>
              <Text style={styles.texts}>Number</Text>
              <TouchableOpacity
                onPress={() => {
                  if (showPass) {
                    setShowPass(false);
                  } else {
                    checkFingerprint();
                  }
                }}
                style={[
                  styles.passTextView,
                  {
                    paddingVertical: showPass ? 5 : 1,
                    paddingHorizontal: showPass ? 20 : 8,
                  },
                ]}
              >
                {showPass ? (
                  <Text style={[styles.texts, { color: "red" }]}>{pinNum}</Text>
                ) : (
                  <Text style={[styles.texts, { color: "red" }]}>••••••</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.categoryPillContainer}>
              <TouchableOpacity
                onPress={() => copyToClipboard(pinNum, "password")}
                style={styles.categoryPill}
                activeOpacity={0.7}
              >
                <Ionicons name="copy" size={20} color="lightgrey" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setIsImageVisible(true)}
            style={styles.showImageMain}
          >
            <Image style={styles.showImages} source={{ uri: showImage }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDownloadImage}
            style={styles.downloadBtn}
          >
            <Text style={{ fontSize: 16, fontWeight: 800 }}>Download Image</Text>
            <Feather name="download" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={{height:100}} />
      </ScrollView>
      <View style={styles.buttonsmain}>
        <TouchableOpacity
          onPress={() => setDeletePassModalVisible(true)}
          style={styles.button}
        >
          <Text style={styles.texts}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setEditModalVisible(true)}
          style={[styles.button, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
        >
          <Text style={[styles.texts, { color: "black" }]}>Edit</Text>
        </TouchableOpacity>
      </View>
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
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderWidth: 1,
    borderColor: "#363636",
  },
  categoryPillContainer: {
    flexShrink: 0,
    marginLeft: 8,
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
  downloadBtn: {
    width: "95%",
    height: 53,
    gap: 20,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 55,
    marginTop: 20,
  },
  imageViewMain: {
    width: "100%",
    height: 200,
    marginTop: 20,
    borderRadius: 35,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 20,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 30,
    zIndex: 1,
  },
  showImageMain: {
    width: "100%",
    height: 250,
    marginTop: 20,
  },
  showImages: {
    width: "95%",
    margin: "auto",
    height: "100%",
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "lightgrey",
  },
  pic: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3d3d3dff",
    alignItems: "center",
    flexShrink: 0,
  },
  categorySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#3d3d3d",
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  categoryOption: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: "#2a2a2a",
            borderWidth: 1,
    borderColor: "#3d3d3d",
  },
  categoryOptionSelected: {
    backgroundColor: "#353535ff",
    borderWidth: 1,
    borderColor: "#505050ff",
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
  passTextView: {
    backgroundColor: "#391414",
    paddingHorizontal: 5,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#930000",
  },
  name_and_user: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  passviewflex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 12,
  },
  texts: {
    color: "white",
    fontSize: 17,
    fontWeight: 800,
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
  passmain: {
    width: "100%",
    height: "auto",
    paddingHorizontal: 10,
    paddingVertical: 20,
    backgroundColor: "#1c1c1c",
    borderWidth: 1.5,
    borderColor: "#282828ff",
    borderRadius: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  buttonsmain: {
    position: "absolute",
    bottom: 55,
    left: 20,
    right: 20,
    height: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    width: "45%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "red",
    paddingVertical: 18,
    borderRadius: 55,
    borderWidth: 0.5,
    borderColor: "#ff9999",
  },
  statusbar: {
    width: "100%",
    backgroundColor: "black",
  },
});

export default CertificateDetails;
