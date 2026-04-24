import { View, Text, TouchableOpacity, StyleSheet, Image, Vibration } from "react-native";
import React from "react";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useNavigation } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Globe, KeyRound, UserRound, Wifi } from "lucide-react-native";

const PasswordCard = ({
  userName,
  category,
  passName,
  index,
  headCategory,
}) => {
  const navigation = useNavigation();

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
        style={styles.main}
      >
        <View style={styles.leftSection}>
          <View
            style={[
              styles.pic,
              {
                backgroundColor:
                  category === "Banking"
                    ? "#1c0e00"
                    : category === "Mail or ID"
                    ? "#200000"
                    : category === "Developer"
                    ? "#1e0013"
                    : category === "Wifi"
                    ? "#000e1f"
                    : category === "Social"
                    ? "#001e10"
                    : "#001f1c",
                borderColor:
                  category === "Banking"
                    ? "#4b2400ff"
                    : category === "Mail or ID"
                    ? "#780000"
                    : category === "Developer"
                    ? "#62003f"
                    : category === "Wifi"
                    ? "#003a80"
                    : category === "Social"
                    ? "#005c31"
                    : "#006d60",
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 30,
                fontWeight: 800,
                paddingBottom: 5,
                color:
                  category === "Banking"
                    ? "orange"
                    : category === "Mail or ID"
                    ? "red"
                    : category === "Developer"
                    ? "#e00092"
                    : category === "Wifi"
                    ? "#0098ff"
                    : category === "Social"
                    ? "#00c76b"
                    : "#00cfbb",
              }}
            >
              {firstLetter}
            </Text>
          </View>
          <View style={styles.name_and_user}>
            <Text
              style={styles.passNameText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {passName}
            </Text>
            <Text
              style={styles.userNameText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {truncateUsername(userName, "userName")}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.categoryPill}>
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
                <MaterialIcons name="arrow-forward-ios" size={20} color="white" />
      
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    width: "100%",
    margin: "auto",
    backgroundColor: "#1c1c1c",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 53,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#242424ff",
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
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderWidth:1,
    borderColor:"#363636"
  },
});

export default PasswordCard;
