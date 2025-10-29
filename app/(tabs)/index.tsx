import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, CalendarCheck, Check, CreditCard, Image, Scissors, User, UserCircle, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Modal, Image as RNImage, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FeedScreen from '../../components/FeedScreen';
import PlansScreen from '../../components/PlansScreen';
import ProfileScreen from '../../components/ProfileScreen';
import { createAppointment, CreateAppointmentData, getProfessionalScheduleByDate, getServices, getTeamMembers, Service, TeamMember } from '../../services/api';

const { width } = Dimensions.get('window');

// Função para traduzir cargos
const translatePosition = (position: string): string => {
  const translations: { [key: string]: string } = {
    'employee': 'Barbeiro',
    'admin': 'Administrador',
    'manager': 'Gerente'
  };
  return translations[position.toLowerCase()] || position;
};

// Mapeamento de dias da semana em inglês para português
const dayOfWeekMap: { [key: string]: string } = {
  'Monday': 'Segunda',
  'Tuesday': 'Terça',
  'Wednesday': 'Quarta',
  'Thursday': 'Quinta',
  'Friday': 'Sexta',
  'Saturday': 'Sábado',
  'Sunday': 'Domingo'
};

// Mapeamento inverso: português para inglês
const dayOfWeekMapReverse: { [key: string]: string } = {
  'Segunda': 'Monday',
  'Terça': 'Tuesday',
  'Quarta': 'Wednesday',
  'Quinta': 'Thursday',
  'Sexta': 'Friday',
  'Sábado': 'Saturday',
  'Domingo': 'Sunday'
};

// Função para gerar os próximos 7 dias da semana em português
const getNext7Days = (): Array<{ label: string; date: Date; dayOfWeekEn: string }> => {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeekEn = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dayOfWeekPt = dayOfWeekMap[dayOfWeekEn] || dayOfWeekEn;
    
    days.push({
      label: dayOfWeekPt,
      date: date,
      dayOfWeekEn: dayOfWeekEn
    });
  }
  
  return days;
};

export default function HomeScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const videoRef = useRef<Video>(null);
  
  // Selection states
  const [selectedBarber, setSelectedBarber] = useState<TeamMember | null>(null);
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
    loadTeamMembers();
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
    const response = await getServices();
    if (response.data) {
      setServices(response.data);
    }
  };

  const loadTeamMembers = async () => {
    setLoading(true);
    const response = await getTeamMembers();
    if (response.data) {
      setTeamMembers(response.data.filter(member => member.has_schedule));
    }
    setLoading(false);
  };

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const generateTimeSlots = (startTime: string, endTime: string, lunchStart: string | null, lunchEnd: string | null): string[] => {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      // Verificar se está no horário de almoço
      let isLunchTime = false;
      if (lunchStart && lunchEnd) {
        const [lunchStartHour, lunchStartMinute] = lunchStart.split(':').map(Number);
        const [lunchEndHour, lunchEndMinute] = lunchEnd.split(':').map(Number);
        
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const lunchStartInMinutes = lunchStartHour * 60 + lunchStartMinute;
        const lunchEndInMinutes = lunchEndHour * 60 + lunchEndMinute;
        
        isLunchTime = currentTimeInMinutes >= lunchStartInMinutes && currentTimeInMinutes < lunchEndInMinutes;
      }
      
      if (!isLunchTime) {
        slots.push(timeString);
      }
      
      // Incrementar 30 minutos
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  const loadProfessionalSchedule = async (professionalId: number, date: string) => {
    const response = await getProfessionalScheduleByDate(professionalId, date);
    
    if (response.data) {
      const { schedule, appointments } = response.data;
      
      // Verificar se o profissional trabalha neste dia
      if (schedule && !schedule.is_day_off && schedule.start_time && schedule.end_time) {
        // Gerar todos os slots disponíveis
        const allSlots = generateTimeSlots(
          schedule.start_time,
          schedule.end_time,
          schedule.lunch_start_time,
          schedule.lunch_end_time
        );
        
        // Filtrar slots que já estão ocupados
        const occupiedSlots = appointments.map(apt => {
          // Extrair apenas HH:MM do start_time (pode vir como HH:MM:SS)
          const time = apt.start_time.substring(0, 5);
          return time;
        });
        
        const availableSlots = allSlots.filter(slot => !occupiedSlots.includes(slot));
        setAvailableTimeSlots(availableSlots);
      } else {
        setAvailableTimeSlots([]);
      }
    } else {
      setAvailableTimeSlots([]);
    }
  };

  const getDayOfWeek = (dateString: string): string => {
    const daysMap: { [key: string]: string } = {
      'Hoje': new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      'Amanhã': new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long' })
    };
    
    if (daysMap[dateString]) {
      return daysMap[dateString];
    }
    
    // Para datas específicas no formato DD/MM
    const [day, month] = dateString.split('/');
    if (day && month) {
      const year = new Date().getFullYear();
      const date = new Date(parseInt(year.toString()), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return 'Monday'; // Fallback
  };

  const formatDateToISO = (dateString: string): string => {
    // Se for um dia da semana em português, encontrar a data correspondente
    if (dayOfWeekMapReverse[dateString]) {
      const days = getNext7Days();
      const selectedDay = days.find(d => d.label === dateString);
      if (selectedDay) {
        return selectedDay.date.toISOString().split('T')[0];
      }
    }
    
    // Fallback para formato antigo
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    
    if (dateString === 'Hoje') {
      return today.toISOString().split('T')[0];
    } else if (dateString === 'Amanhã') {
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Para datas no formato DD/MM, assumir ano atual
    const [day, month] = dateString.split('/');
    if (day && month) {
      const year = new Date().getFullYear();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return today.toISOString().split('T')[0];
  };

  const handleConfirmAppointment = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      Alert.alert('Erro', 'Por favor, complete todas as seleções');
      return;
    }

    // Buscar client_id do localStorage
    let clientId = 1; // Valor padrão
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        clientId = parsedData.id;
      } else {
        Alert.alert(
          'Cadastro necessário',
          'Você precisa criar uma conta antes de fazer um agendamento. Deseja ir para o perfil?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ir para Perfil', onPress: () => setActiveTab('perfil') }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }

    const appointmentData: CreateAppointmentData = {
      client_id: clientId,
      professional_id: selectedBarber.id,
      appointment_date: formatDateToISO(selectedDate),
      start_time: selectedTime,
      status: 'pending',
      services: [
        {
          service_id: selectedService.service_id,
          quantity: 1
        }
      ]
    };

    setLoading(true);
    const response = await createAppointment(appointmentData);
    setLoading(false);

    if (response.error) {
      Alert.alert('Erro', `Erro ao criar agendamento: ${response.error}`);
    } else {
      Alert.alert(
        'Agendamento Marcado com Sucesso! ✨',
        `Seu agendamento foi confirmado:\n\n` +
        `📅 Data: ${selectedDate}\n` +
        `⏰ Horário: ${selectedTime}\n` +
        `💈 Barbeiro: ${selectedBarber.name}\n` +
        `✂️ Serviço: ${selectedService.service_name}\n\n` +
        `Até breve!`,
        [{ text: 'OK', style: 'default' }]
      );
      
      // Limpar seleções
      setSelectedBarber(null);
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
      setAvailableTimeSlots([]);
    }
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
      
      {/* Renderização condicional baseada na aba ativa */}
      {activeTab === 'perfil' ? (
        <ProfileScreen />
      ) : activeTab === 'fotos' ? (
        <FeedScreen />
      ) : activeTab === 'assinaturas' ? (
        <PlansScreen />
      ) : (
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
            
            {/* Descrição */}
            <View style={styles.descriptionContainer}>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                  Agende seus horários de forma{' '}
                  <Text style={styles.descriptionHighlight}>rápida e inteligente</Text>.{'\n'}
                  Escolha seu profissional, serviço e horário em poucos cliques.
                </Text>
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
            onPress={handleConfirmAppointment}
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
      )}

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
              {loading ? (
                <ActivityIndicator size="large" color="#D4AF37" style={styles.modalLoading} />
              ) : (
                teamMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.modalItem,
                      selectedBarber?.id === member.id && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setSelectedBarber(member);
                      setShowBarberModal(false);
                    }}
                  >
                    {member.photo_url ? (
                      <RNImage 
                        source={{ uri: member.photo_url }}
                        style={styles.memberPhoto}
                      />
                    ) : (
                      <View style={styles.modalItemIcon}>
                        <User size={20} color="#D4AF37" />
                      </View>
                    )}
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemName}>{member.name}</Text>
                      <Text style={styles.modalItemSubtitle}>{translatePosition(member.position)}</Text>
                    </View>
                    {selectedBarber?.id === member.id && (
                      <View style={styles.selectedCheck} />
                    )}
                  </TouchableOpacity>
                ))
              )}
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
              {!selectedBarber ? (
                <Text style={styles.modalWarning}>Selecione um barbeiro primeiro</Text>
              ) : (
                <>
                  <Text style={styles.modalSectionTitle}>Data</Text>
                  <View style={styles.dateGrid}>
                    {getNext7Days().map((day) => (
                      <TouchableOpacity
                        key={day.label}
                        style={[
                          styles.dateButton,
                          selectedDate === day.label && styles.dateButtonSelected
                        ]}
                        onPress={() => {
                          setSelectedDate(day.label);
                          const dateISO = day.date.toISOString().split('T')[0];
                          loadProfessionalSchedule(selectedBarber.id, dateISO);
                        }}
                      >
                        <Text style={[
                          styles.dateButtonText,
                          selectedDate === day.label && styles.dateButtonTextSelected
                        ]}>{day.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Time Selection */}
                  {selectedDate && (
                    <>
                      <Text style={styles.modalSectionTitle}>Horário</Text>
                      {availableTimeSlots.length === 0 ? (
                        <Text style={styles.modalWarning}>Nenhum horário disponível para esta data</Text>
                      ) : (
                        <View style={styles.timeGrid}>
                          {availableTimeSlots.map((time) => (
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
                      )}
                    </>
                  )}
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
  descriptionContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
    width: '100%',
  },
  descriptionBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  descriptionHighlight: {
    color: '#D4AF37',
    fontWeight: '700',
    letterSpacing: 0.5,
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
  memberPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#D4AF37',
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
  modalWarning: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
