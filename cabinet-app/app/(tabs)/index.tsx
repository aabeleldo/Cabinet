import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SERVER_URL } from '../../config';

type CabinetData = {
  _id: string;
  cabinet_id: string;
  name?: string;
  weight: number;
  rfid: string;
  timestamp: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<CabinetData[]>([]);
  const [activeTab, setActiveTab] = useState('pantry');
  const [selectedItem, setSelectedItem] = useState<CabinetData | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/`);
        const json = await response.json();
        setData(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (item: CabinetData) => {
    setSelectedItem(item);
    setNameInput(item.name ?? '');
  };

  const closeModal = () => {
    setSelectedItem(null);
    setNameInput('');
  };

  const saveName = async () => {
    if (!selectedItem || !nameInput.trim()) return;
    setSaving(true);
    try {
      await fetch(`${SERVER_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid: selectedItem.rfid, name: nameInput.trim() }),
      });
      setData(prev => prev.map(d => d.rfid === selectedItem.rfid ? { ...d, name: nameInput.trim() } : d));
      closeModal();
    } catch (err) {
      Alert.alert('Error', 'Failed to save name');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!selectedItem) return;
    try {
      await fetch(`${SERVER_URL}/container/${selectedItem.rfid}`, { method: 'DELETE' });
      setData(prev => prev.filter(d => d.rfid !== selectedItem.rfid));
      closeModal();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete container');
    }
  };

  return (
    <View style={styles.container}>

      {/* Rename Modal */}
      <Modal visible={!!selectedItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Name this container</Text>
            <Text style={styles.modalSub}>RFID: {selectedItem?.rfid}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flour, Rice, Sugar"
              placeholderTextColor="#555"
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveName} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={deleteItem}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good evening</Text>
          <Text style={styles.title}>Smart Cabinet</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.length}</Text>
          <Text style={styles.statLabel}>Containers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.filter(d => d.weight < 100).length}</Text>
          <Text style={styles.statLabel}>Running Low</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.length > 0 ? Math.round(data.reduce((a, b) => a + b.weight, 0) / data.length) : 0}g</Text>
          <Text style={styles.statLabel}>Avg Weight</Text>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Containers</Text>
        <TouchableOpacity><Text style={styles.sectionAction}>Sort</Text></TouchableOpacity>
      </View>

      {/* Container List */}
      {data.length === 0 ? (
        <Text style={styles.empty}>No containers detected</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openModal(item)}>
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconBox}>
                    <Text style={styles.iconText}>📦</Text>
                  </View>
                  <View>
                    <Text style={styles.rfid}>{item.name ?? item.rfid}</Text>
                    <Text style={styles.cabinet}>{item.cabinet_id}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.weight, item.weight < 100 && styles.weightLow]}>{item.weight}g</Text>
                  <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('pantry')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, activeTab === 'pantry' && styles.navLabelActive]}>Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/recipes')}>
          <Text style={styles.navIcon}>🍳</Text>
          <Text style={[styles.navLabel, activeTab === 'recipes' && styles.navLabelActive]}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('history')}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>Settings</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  greeting: { fontSize: 13, color: '#666', marginBottom: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4ade80', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a2a' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#666' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  sectionAction: { fontSize: 14, color: '#4ade80' },
  list: { paddingHorizontal: 20, flex: 1 },
  empty: { color: '#444', fontSize: 16, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardRight: { alignItems: 'flex-end' },
  iconBox: { width: 40, height: 40, backgroundColor: '#2a2a2a', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  rfid: { fontSize: 15, color: '#ffffff', fontWeight: '600', marginBottom: 2 },
  cabinet: { fontSize: 12, color: '#555' },
  weight: { fontSize: 16, color: '#4ade80', fontWeight: 'bold', marginBottom: 2 },
  weightLow: { color: '#f87171' },
  timestamp: { fontSize: 11, color: '#444' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingVertical: 10, paddingBottom: 24 },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 11, color: '#555' },
  navLabelActive: { color: '#4ade80' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, width: '80%', borderWidth: 1, borderColor: '#2a2a2a' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  modalSub: { fontSize: 12, color: '#555', marginBottom: 16 },
  input: { backgroundColor: '#0f0f0f', borderRadius: 8, borderWidth: 1, borderColor: '#333', color: '#fff', padding: 12, fontSize: 15, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  cancelText: { color: '#666', fontSize: 14 },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4ade80', alignItems: 'center' },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  deleteBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f87171', alignItems: 'center' },
  deleteText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});