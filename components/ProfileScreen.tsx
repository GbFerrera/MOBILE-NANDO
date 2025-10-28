import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { UserCircle, Mail, Phone, Lock, FileText, Calendar, Clock, Scissors } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { createClient, CreateClientData, getClientAppointments, Appointment } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
        setIsRegistered(true);
        // Carregar agendamentos do cliente
        loadAppointments(parsedData.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadAppointments = async (clientId: number) => {
    setLoadingAppointments(true);
    const response = await getClientAppointments(clientId);
    setLoadingAppointments(false);
    
    if (response.data) {
      // Filtrar apenas agendamentos de hoje para frente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureAppointments = response.data.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today;
      });
      
      // Ordenar por data
      futureAppointments.sort((a, b) => {
        const dateA = new Date(a.appointment_date + ' ' + a.start_time);
        const dateB = new Date(b.appointment_date + ' ' + b.start_time);
        return dateA.getTime() - dateB.getTime();
      });
      
      setAppointments(futureAppointments);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5);
  };

  const handleRegister = async () => {
    console.log('handleRegister chamado');
    console.log('Dados:', { name, email, phoneNumber, password, confirmPassword });
    
    // Validações
    if (!name || !email || !phoneNumber || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    const clientData: CreateClientData = {
      name,
      email,
      phone_number: phoneNumber,
      password,
      ...(document && { document })
    };

    setLoading(true);
    const response = await createClient(clientData);
    setLoading(false);

    if (response.error) {
      Alert.alert('Erro', `Erro ao cadastrar: ${response.error}`);
    } else {
      // Salvar dados no AsyncStorage
      const userDataToSave = {
        id: response.data?.id || Date.now(),
        name,
        email,
        phone_number: phoneNumber,
        document,
        created_at: new Date().toISOString()
      };

      try {
        await AsyncStorage.setItem('userData', JSON.stringify(userDataToSave));
        setUserData(userDataToSave);
        setIsRegistered(true);
        Alert.alert('Sucesso! ✨', 'Cadastro realizado com sucesso!');
        
        // Limpar campos
        setName('');
        setEmail('');
        setPhoneNumber('');
        setDocument('');
        setPassword('');
        setConfirmPassword('');
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userData');
            setUserData(null);
            setIsRegistered(false);
          }
        }
      ]
    );
  };

  if (isRegistered && userData) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          style={styles.header}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#D4AF37', '#FFD700']}
              style={styles.avatar}
            >
              <UserCircle size={60} color="#000" />
            </LinearGradient>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </LinearGradient>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Phone size={20} color="#D4AF37" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{userData.phone_number}</Text>
              </View>
            </View>
          </View>

          {userData.document && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <FileText size={20} color="#D4AF37" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>CPF</Text>
                  <Text style={styles.infoValue}>{userData.document}</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Agendamentos */}
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>Meus Agendamentos</Text>
          
          {loadingAppointments ? (
            <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#666" />
              <Text style={styles.emptyStateText}>Nenhum agendamento futuro</Text>
            </View>
          ) : (
            appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentDateBadge}>
                    <Calendar size={16} color="#D4AF37" />
                    <Text style={styles.appointmentDate}>{formatDate(appointment.appointment_date)}</Text>
                  </View>
                  <View style={styles.appointmentTimeBadge}>
                    <Clock size={16} color="#D4AF37" />
                    <Text style={styles.appointmentTime}>{formatTime(appointment.start_time)}</Text>
                  </View>
                </View>
                
                <View style={styles.appointmentBody}>
                  <View style={styles.appointmentRow}>
                    <UserCircle size={18} color="#999" />
                    <Text style={styles.appointmentLabel}>Profissional:</Text>
                    <Text style={styles.appointmentValue}>Profissional #{appointment.professional_id}</Text>
                  </View>
                  
                  {appointment.services && appointment.services.length > 0 && (
                    <View style={styles.appointmentRow}>
                      <Scissors size={18} color="#999" />
                      <Text style={styles.appointmentLabel}>Serviço:</Text>
                      <Text style={styles.appointmentValue}>{appointment.services[0].service_name}</Text>
                    </View>
                  )}
                  
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {appointment.status === 'pending' ? '⏳ Pendente' : 
                       appointment.status === 'confirmed' ? '✓ Confirmado' :
                       appointment.status === 'canceled' ? '✕ Cancelado' : '✓ Concluído'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#D4AF37', '#FFD700']}
            style={styles.avatar}
          >
            <UserCircle size={60} color="#000" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>Criar Conta</Text>
        <Text style={styles.headerSubtitle}>Preencha seus dados para começar</Text>
      </LinearGradient>

      <View style={styles.formSection}>
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <UserCircle size={20} color="#D4AF37" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Mail size={20} color="#D4AF37" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Phone size={20} color="#D4AF37" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Telefone"
            placeholderTextColor="#666"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <FileText size={20} color="#D4AF37" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="CPF (opcional)"
            placeholderTextColor="#666"
            value={document}
            onChangeText={setDocument}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Lock size={20} color="#D4AF37" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Lock size={20} color="#D4AF37" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.registerButtonWrapper}>
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#D4AF37', '#FFD700', '#D4AF37']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButton}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.registerButtonText}>Criar Conta ✨</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },
  registerButtonWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  registerButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  logoutButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  appointmentsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  loader: {
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  appointmentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  appointmentDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentDate: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600',
  },
  appointmentTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentTime: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600',
  },
  appointmentBody: {
    gap: 12,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentLabel: {
    color: '#999',
    fontSize: 14,
  },
  appointmentValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
});
