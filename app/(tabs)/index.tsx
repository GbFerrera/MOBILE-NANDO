import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Modal, Pressable, Dimensions, Image as RNImage } from 'react-native';
import { Scissors, Clock, ChevronRight, Sparkles, User, Calendar, X, Check, CalendarCheck, CreditCard, Image, UserCircle } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { getServices, Service } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

const barbers = [
  { id: 1, name: 'Carlos Silva', specialty: 'Especialista em Barba' },
  { id: 2, name: 'João Santos', specialty: 'Cortes Modernos' },
  { id: 3, name: 'Pedro Lima', specialty: 'Barbeiro Master' },
  { id: 4, name: 'Rafael Costa', specialty: 'Estilista' },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

export default function HomeScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const videoRef = useRef<Video>(null);
  
  // Selection states
  const [selectedBarber, setSelectedBarber] = useState<typeof barbers[0] | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Modal states
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  
  // Navbar state
  const [activeTab, setActiveTab] = useState('agenda');

  useEffect(() => {
    loadServices();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const response = await getServices();
    if (response.data) {
      setServices(response.data);
    }
    setLoading(false);
  };

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        ref={videoRef}
        source={require('../../assets/videos/background.mp4')}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
      />
      
      {/* Overlay escuro para melhorar legibilidade */}
      <View style={styles.videoOverlay} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section com Gradiente */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientHeader}
        >
          <Animated.View 
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo Moderno */}
            <View style={styles.logoContainer}>
              <View style={styles.logoImageContainer}>
                <RNImage 
                  source={require('../../assets/images/116120551_189103225905822_7528679222463076490_n.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.logoGlow} />
            </View>

            {/* Título Principal */}
            <Text style={styles.mainTitle}>Nando Lima</Text>
            <Text style={styles.subtitle}>Barbearia Premium</Text>
            
            <View style={styles.tagline}>
              <Sparkles size={16} color="#D4AF37" />
              <Text style={styles.taglineText}>Agende seu horário com estilo</Text>
              <Sparkles size={16} color="#D4AF37" />
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>Clientes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>4.9★</Text>
                <Text style={styles.statLabel}>Avaliação</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>10+</Text>
                <Text style={styles.statLabel}>Anos</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Selection Cards com Glassmorphism */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Monte seu Agendamento</Text>
          
          {/* Selecionar Barbeiro */}
          <TouchableOpacity 
            style={[styles.glassCard, selectedBarber && styles.glassCardSelected]}
            onPress={() => setShowBarberModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedBarber ? ['rgba(212, 175, 55, 0.15)', 'rgba(255, 215, 0, 0.15)'] : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.glassCardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <LinearGradient
                    colors={['#D4AF37', '#FFD700']}
                    style={styles.iconGradient}
                  >
                    <User size={22} color="#000" />
                  </LinearGradient>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardLabel}>Barbeiro</Text>
                    <Text style={styles.cardValue}>
                      {selectedBarber ? selectedBarber.name : 'Escolher profissional'}
                    </Text>
                  </View>
                </View>
                {selectedBarber && <Check size={20} color="#D4AF37" />}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Selecionar Serviço */}
          <TouchableOpacity 
            style={[styles.glassCard, selectedService && styles.glassCardSelected]}
            onPress={() => setShowServiceModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedService ? ['rgba(212, 175, 55, 0.15)', 'rgba(255, 215, 0, 0.15)'] : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.glassCardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <LinearGradient
                    colors={['#D4AF37', '#FFD700']}
                    style={styles.iconGradient}
                  >
                    <Scissors size={22} color="#000" />
                  </LinearGradient>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardLabel}>Serviço</Text>
                    <Text style={styles.cardValue}>
                      {selectedService ? selectedService.service_name : 'Escolher serviço'}
                    </Text>
                  </View>
                </View>
                {selectedService && <Check size={20} color="#D4AF37" />}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Selecionar Data e Hora */}
          <TouchableOpacity 
            style={[styles.glassCard, (selectedDate && selectedTime) && styles.glassCardSelected]}
            onPress={() => setShowDateTimeModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(selectedDate && selectedTime) ? ['rgba(212, 175, 55, 0.15)', 'rgba(255, 215, 0, 0.15)'] : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.glassCardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <LinearGradient
                    colors={['#D4AF37', '#FFD700']}
                    style={styles.iconGradient}
                  >
                    <Calendar size={22} color="#000" />
                  </LinearGradient>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardLabel}>Data e Hora</Text>
                    <Text style={styles.cardValue}>
                      {selectedDate && selectedTime ? `${selectedDate} às ${selectedTime}` : 'Escolher horário'}
                    </Text>
                  </View>
                </View>
                {(selectedDate && selectedTime) && <Check size={20} color="#D4AF37" />}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Botão de Agendamento */}
        <View style={styles.agendarSection}>
          <TouchableOpacity 
            style={styles.agendarButtonWrapper}
            activeOpacity={0.9}
            disabled={!selectedBarber || !selectedService || !selectedDate || !selectedTime}
          >
            <LinearGradient
              colors={
                (!selectedBarber || !selectedService || !selectedDate || !selectedTime)
                  ? ['#4a4a4a', '#2a2a2a']
                  : ['#D4AF37', '#FFD700', '#D4AF37']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.agendarButton}
            >
              <Text style={styles.agendarButtonText}>
                {(!selectedBarber || !selectedService || !selectedDate || !selectedTime)
                  ? 'Complete as seleções'
                  : 'Confirmar Agendamento ✨'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Barber Modal */}
      <Modal
        visible={showBarberModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBarberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Barbeiro</Text>
              <TouchableOpacity onPress={() => setShowBarberModal(false)}>
                <X size={24} color="#D4AF37" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {barbers.map((barber) => (
                <TouchableOpacity
                  key={barber.id}
                  style={[
                    styles.modalItem,
                    selectedBarber?.id === barber.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedBarber(barber);
                    setShowBarberModal(false);
                  }}
                >
                  <View style={styles.modalItemIcon}>
                    <User size={20} color="#D4AF37" />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{barber.name}</Text>
                    <Text style={styles.modalItemSubtitle}>{barber.specialty}</Text>
                  </View>
                  {selectedBarber?.id === barber.id && (
                    <View style={styles.selectedCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Service Modal */}
      <Modal
        visible={showServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Serviço</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <X size={24} color="#D4AF37" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {loading ? (
                <ActivityIndicator size="large" color="#D4AF37" style={styles.modalLoading} />
              ) : (
                services.map((service) => (
                  <TouchableOpacity
                    key={service.service_id}
                    style={[
                      styles.modalItem,
                      selectedService?.service_id === service.service_id && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setSelectedService(service);
                      setShowServiceModal(false);
                    }}
                  >
                    <View style={styles.modalItemIcon}>
                      <Scissors size={20} color="#D4AF37" />
                    </View>
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemName}>{service.service_name}</Text>
                      <Text style={styles.modalItemSubtitle}>
                        {service.service_duration} min • {formatPrice(service.service_price)}
                      </Text>
                    </View>
                    {selectedService?.service_id === service.service_id && (
                      <View style={styles.selectedCheck} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date & Time Modal */}
      <Modal
        visible={showDateTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Data e Hora</Text>
              <TouchableOpacity onPress={() => setShowDateTimeModal(false)}>
                <X size={24} color="#D4AF37" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {/* Date Selection */}
              <Text style={styles.modalSectionTitle}>Data</Text>
              <View style={styles.dateGrid}>
                {['Hoje', 'Amanhã', '28/10', '29/10', '30/10'].map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateButton,
                      selectedDate === date && styles.dateButtonSelected
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dateButtonText,
                      selectedDate === date && styles.dateButtonTextSelected
                    ]}>{date}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Selection */}
              {selectedDate && (
                <>
                  <Text style={styles.modalSectionTitle}>Horário</Text>
                  <View style={styles.timeGrid}>
                    {timeSlots.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeButton,
                          selectedTime === time && styles.timeButtonSelected
                        ]}
                        onPress={() => {
                          setSelectedTime(time);
                          setShowDateTimeModal(false);
                        }}
                      >
                        <Text style={[
                          styles.timeButtonText,
                          selectedTime === time && styles.timeButtonTextSelected
                        ]}>{time}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('agenda')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, activeTab === 'agenda' && styles.navIconActive]}>
            <CalendarCheck 
              size={20} 
              color={activeTab === 'agenda' ? '#000' : '#999'} 
              strokeWidth={2}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'agenda' && styles.navLabelActive]}>
            Agenda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('assinaturas')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, activeTab === 'assinaturas' && styles.navIconActive]}>
            <CreditCard 
              size={20} 
              color={activeTab === 'assinaturas' ? '#000' : '#999'} 
              strokeWidth={2}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'assinaturas' && styles.navLabelActive]}>
            Assinaturas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('fotos')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, activeTab === 'fotos' && styles.navIconActive]}>
            <Image 
              size={20} 
              color={activeTab === 'fotos' ? '#000' : '#999'} 
              strokeWidth={2}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'fotos' && styles.navLabelActive]}>
            Fotos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('perfil')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, activeTab === 'perfil' && styles.navIconActive]}>
            <UserCircle 
              size={20} 
              color={activeTab === 'perfil' ? '#000' : '#999'} 
              strokeWidth={2}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'perfil' && styles.navLabelActive]}>
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  gradientHeader: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  logoImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#D4AF37',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  taglineText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectionSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 20,
  },
  glassCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  glassCardSelected: {
    shadowColor: '#D4AF37',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glassCardGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#D4AF37',
    marginTop: 16,
    fontSize: 14,
  },
  bottomSpacing: {
    height: 20,
  },
  agendarSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  agendarButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  agendarButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  agendarButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
    borderTopWidth: 2,
    borderTopColor: '#D4AF37',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  modalScroll: {
    padding: 24,
  },
  modalLoading: {
    paddingVertical: 40,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  modalItemSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  modalItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 16,
    marginTop: 12,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  dateButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  dateButtonSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '600',
  },
  dateButtonTextSelected: {
    color: '#D4AF37',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    minWidth: 85,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  timeButtonText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '600',
  },
  timeButtonTextSelected: {
    color: '#000',
  },
  // Navbar Styles
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navIconActive: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  navLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
});
