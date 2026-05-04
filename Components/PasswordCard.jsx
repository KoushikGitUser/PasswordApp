import { View, Text, TouchableOpacity, StyleSheet, Image, Vibration, Dimensions } from "react-native";
import React from "react";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useNavigation } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Globe, KeyRound, UserRound, Wifi } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { getCategoryColors } from "../theme/colors";
import { ELEVATION_LEVELS, SHADOW_COLORS } from "../styles/elevationStyles";

const PasswordCard = ({
  userName,
  category,
  passName,
  index,
  headCategory,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const catColors = getCategoryColors(category, isDark);

  const truncateUsername = (name, item) => {
    if (item == "passName") {
      return name.length > 16 ? name.slice(0, 16) + "..." : name;
    } else {
      if (category == "Banking") {
        if (name.length > 5) {
          const visiblePart = name.slice(0, 5);
          const hiddenPart = "•".repeat(name.length - 5);
          return visiblePart + hiddenPart;
        } else {
          return name;
        }
      } else {
        return name.length > 16 ? name.slice(0, 16) + "..." : name;
      }
    }
  };

  const firstLetter = passName.charAt(0).toUpperCase();

  return (
    <View style={{ width: "100%", marginBottom: 13 }}>
      <TouchableOpacity
        onLongPress={() => {
          Vibration.vibrate(20);
          navigation.navigate("passdetails", {
            index: index,
            passCategory: headCategory,
          });
        }}
        onPress={() =>
          navigation.navigate("passdetails", {
            index: index,
            passCategory: headCategory,
          })
        }
        style={[styles.main, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder,borderWidth:isDark?1.5:1,shadowColor:isDark?"black":"#969696"}]}
      >
        <View style={styles.leftSection}>
          <View
            style={[
              styles.pic,
              {
                backgroundColor: catColors.iconBg,
                borderColor: catColors.iconBorder,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 30,
                fontWeight: 800,
                paddingBottom: 5,
                color: catColors.accent,
              }}
            >
              {firstLetter}
            </Text>
          </View>
          <View style={styles.name_and_user}>
            <Text
              style={[styles.passNameText, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {passName}
            </Text>
            <Text
              style={[styles.userNameText, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {truncateUsername(userName, "userName")}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.categoryPill, { backgroundColor: colors.categoryPillBg, borderColor: colors.categoryPillBorder }]}>
            {category === "Banking" ? (
              <Ionicons name="card-outline" size={22} color="orange" />
            ) : category === "Mail or ID" ? (
              <UserRound size={22} color="red" strokeWidth={2.1} />
            ) : category === "Developer" ? (
              <FontAwesome6 name="code" size={20} color="#e00092" />
            ) : category === "Wifi" ? (
              <Wifi size={20} color="#0098ff" strokeWidth={3} />
            ) : category === "Social" ? (
              <Globe size={22} color="#00c76b" strokeWidth={2.2} />
            ) : (
              <KeyRound size={22} color="#00cfbb" strokeWidth={2.1} />
            )}
          </View>
                <MaterialIcons name="arrow-forward-ios" size={20} color={colors.text} />
      
        </View>
      </TouchableOpacity>
    </View>
  );
};
const screenwidth = Dimensions.get("window").width
const paddingHorizontal = 40;
const styles = StyleSheet.create({
  main: {
    width: screenwidth - 40,
    margin: "auto",
    backgroundColor: "#1c1c1c",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 53,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "rgb(45, 45, 45)",
    elevation:ELEVATION_LEVELS.large,
    shadowColor: "#969696"

  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  inn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  name_and_user: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  passNameText: {
    fontSize: 17,
    fontWeight: 800,
    color: "white",
    width: "100%",
  },
  userNameText: {
    fontSize: 17,
    fontWeight: 500,
    color: "lightgrey",
    width: "100%",
  },
  pic: {
    width: 50,
    height: 50,
    borderRadius: 55,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    elevation:ELEVATION_LEVELS.medium,
    shadowColor:"#969696"
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderWidth:0.5,
    borderColor:"#363636",
    elevation:ELEVATION_LEVELS.medium,
    shadowColor:"#969696"
  },
});

export default PasswordCard;
