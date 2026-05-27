import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const SERVER_URL = 'http://192.168.2.111:3000';

type RecipeIngredient = {
  ingredient: string;
  need: number;
  have: number;
};

type Recipe = {
  _id: string;
  name: string;
  prepTime: number;
  servings: number;
  instructions: string;
  ingredients: Record<string, number>;
  available: string[];
  missing: RecipeIngredient[];
  canMake: boolean;
  missingCount: number;
};

export default function RecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/recipes/match`);
        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        setError('Failed to load recipes.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  return (
    <View style={styles.container}>

      {/* Recipe Detail Modal */}
      <Modal visible={!!selectedRecipe} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedRecipe && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
                  <View style={styles.modalMeta}>
                    <Text style={styles.modalMetaText}>⏱ {selectedRecipe.prepTime} mins</Text>
                    <Text style={styles.modalMetaText}>🍽 {selectedRecipe.servings} serving{selectedRecipe.servings > 1 ? 's' : ''}</Text>
                    <Text style={styles.modalMetaText}>{selectedRecipe.canMake ? '✅ Can make' : `❌ ${selectedRecipe.missingCount} missing`}</Text>
                  </View>

                  <Text style={styles.sectionLabel}>Ingredients</Text>
                  {Object.entries(selectedRecipe.ingredients).map(([name, amount]) => {
                    const isMissing = selectedRecipe.missing.some(m => m.ingredient === name);
                    return (
                      <Text key={name} style={[styles.ingredient, isMissing && styles.ingredientMissing]}>
                        {isMissing ? '❌' : '✅'} {name} — {amount}g
                      </Text>
                    );
                  })}

                  {selectedRecipe.missing.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>What you're missing</Text>
                      {selectedRecipe.missing.map(m => (
                        <Text key={m.ingredient} style={styles.missingDetail}>
                          {m.ingredient}: need {m.need}g, have {m.have}g
                        </Text>
                      ))}
                    </>
                  )}

                  <Text style={styles.sectionLabel}>Instructions</Text>
                  <Text style={styles.instructions}>{selectedRecipe.instructions}</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRecipe(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recipes</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#4ade80" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.empty}>{error}</Text>
      ) : recipes.length === 0 ? (
        <Text style={styles.empty}>No recipes found.</Text>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedRecipe(item)}>
              <View style={[styles.card, item.canMake && styles.cardCanMake]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, item.canMake && styles.iconBoxCanMake]}>
                    <Text style={styles.iconText}>{item.canMake ? '🍳' : '🛒'}</Text>
                  </View>
                  <View>
                    <Text style={styles.recipeName}>{item.name}</Text>
                    <Text style={styles.recipeMeta}>⏱ {item.prepTime} mins · 🍽 {item.servings} serving{item.servings > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {item.canMake ? (
                    <Text style={styles.canMakeTag}>Ready</Text>
                  ) : (
                    <Text style={styles.missingTag}>{item.missingCount} missing</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  back: { fontSize: 14, color: '#4ade80', width: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  list: { paddingHorizontal: 20 },
  empty: { color: '#444', fontSize: 16, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCanMake: { borderColor: '#4ade80' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  iconBox: { width: 40, height: 40, backgroundColor: '#2a2a2a', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBoxCanMake: { backgroundColor: '#14532d' },
  iconText: { fontSize: 18 },
  recipeName: { fontSize: 15, color: '#ffffff', fontWeight: '600', marginBottom: 2 },
  recipeMeta: { fontSize: 12, color: '#555' },
  canMakeTag: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  missingTag: { fontSize: 12, color: '#f87171' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', borderWidth: 1, borderColor: '#2a2a2a' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  modalMeta: { flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  modalMetaText: { fontSize: 13, color: '#888' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#4ade80', marginBottom: 8, marginTop: 12 },
  ingredient: { fontSize: 13, color: '#ccc', marginBottom: 4 },
  ingredientMissing: { color: '#f87171' },
  missingDetail: { fontSize: 13, color: '#f87171', marginBottom: 4 },
  instructions: { fontSize: 13, color: '#aaa', lineHeight: 20 },
  closeBtn: { margin: 16, padding: 14, backgroundColor: '#2a2a2a', borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});