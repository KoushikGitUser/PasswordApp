import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { listInstalledApps } from "../Services/autofill";
import { useTheme } from "../theme/ThemeContext";
import { BlurView } from "@react-native-community/blur";
import { getElevation, ELEVATION_LEVELS } from "../styles/elevationStyles";

const AppPickerSheet = ({ visible, onClose, onPick, existingPackages = [] }) => {
  const { colors, isDark } = useTheme();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const screenWidth = Dimensions.get("window").width

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await listInstalledApps();
      if (cancelled) return;
      setApps(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        (a.label || "").toLowerCase().includes(q) ||
        (a.packageName || "").toLowerCase().includes(q)
    );
  }, [apps, query]);

  const renderItem = ({ item }) => {
    const alreadyAdded = existingPackages
      .map((p) => p.toLowerCase())
      .includes((item.packageName || "").toLowerCase());
    return (
      <TouchableOpacity
        style={[styles.row, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...getElevation('medium', isDark),
          width:screenWidth - 80,
          margin:"auto",
        }, alreadyAdded && { opacity: 0.45 }]}
        activeOpacity={0.7}
        disabled={alreadyAdded}
        onPress={() => {
          onPick(item.packageName);
          onClose();
        }}
      >
        {item.iconBase64 ? (
          <Image
            source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
            style={styles.icon}
          />
        ) : (
          <View style={[styles.icon, styles.iconFallback, { backgroundColor: colors.categoryPillBg }]}>
            <Text style={[styles.iconFallbackText, { color: colors.text }]}>
              {(item.label || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {item.label || item.packageName}
          </Text>
          <Text style={[styles.rowPkg, { color: colors.textTertiary }]} numberOfLines={1}>
            {item.packageName}
          </Text>
        </View>
        {alreadyAdded ? (
          <Ionicons name="checkmark-circle" size={30} color={colors.accentGreen} />
        ) : (
          <Ionicons name="add" size={28} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={40}
        tint={isDark ? "dark" : "light"}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, {
          backgroundColor: colors.modalBackground,
          borderColor: colors.border
        }]}>
          <View style={[styles.header,{width:screenWidth - 80,margin:"auto"}]}>
            <Text style={[styles.title, { color: colors.text }]}>Link an app</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchWrap, {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            width:screenWidth - 80,
            margin:"auto"
          }]}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.inputText }]}
              placeholder="Search installed apps"
              placeholderTextColor={colors.inputPlaceholder}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.accentGreen} />
              <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading installed apps…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.packageName}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20, paddingTop:20}}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No matching apps.</Text>
                </View>
              }
            />
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dismissArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderRadius: 28,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: "85%",
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    elevation: ELEVATION_LEVELS.large,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 52,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  iconFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconFallbackText: {
    fontWeight: "800",
    fontSize: 16,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  rowPkg: {
    fontSize: 11,
    marginTop: 2,
  },
  loader: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
  },
});

export default AppPickerSheet;
