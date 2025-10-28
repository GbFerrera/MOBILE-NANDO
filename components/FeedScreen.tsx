import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Image as RNImage } from 'react-native';
import { useState, useEffect } from 'react';
import { getClientPhotos, ClientPhoto } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    const response = await getClientPhotos();
    if (response.data) {
      setPhotos(response.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando fotos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Feed de Fotos</Text>
        <Text style={styles.headerSubtitle}>Trabalhos realizados</Text>
      </LinearGradient>

      <View style={styles.feedContainer}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma foto disponível</Text>
          </View>
        ) : (
          photos.map((photo, index) => (
            <View key={`${photo.client_id}-${index}`} style={styles.postCard}>
              {/* Header do Post */}
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <LinearGradient
                    colors={['#D4AF37', '#FFD700']}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {photo.name.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{photo.name}</Text>
                    <Text style={styles.postTime}>Nando Lima Barbearia</Text>
                  </View>
                </View>
              </View>

              {/* Imagem do Post */}
              <RNImage
                source={{ uri: photo.photo_url }}
                style={styles.postImage}
                resizeMode="cover"
              />


              {/* Descrição */}
              {photo.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.description}>
                    <Text style={styles.userName}>{photo.name} </Text>
                    {photo.description}
                  </Text>
                </View>
              )}

              {/* Divisor */}
              <View style={styles.divider} />
            </View>
          ))
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#D4AF37',
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  feedContainer: {
    paddingTop: 16,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  postCard: {
    marginBottom: 24,
    backgroundColor: '#0a0a0a',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  postTime: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: '#1a1a1a',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginTop: 12,
  },
  bottomSpacing: {
    height: 100,
  },
});
