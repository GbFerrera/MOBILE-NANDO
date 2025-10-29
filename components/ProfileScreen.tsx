import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { UserCircle, Mail, Phone, Lock, FileText, Calendar, Clock, Scissors } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { createClient, CreateClientData, loginClient, LoginData, getClientAppointments, Appointment } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between login and register

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
      // Ordenar por data (mais recentes primeiro)
      const sortedAppointments = response.data.sort((a, b) => {
        const dateA = new Date(a.appointment_date + ' ' + a.start_time);
        const dateB = new Date(b.appointment_date + ' ' + b.start_time);
        return dateB.getTime() - dateA.getTime(); // Ordem decrescente (mais recente primeiro)
      });
      
      setAppointments(sortedAppointments);
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

  const handleLogin = async () => {
    console.log('handleLogin chamado');
    console.log('Dados:', { email, password });
    
    // Validações
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    const loginData: LoginData = {
      email,
      password
    };

    setLoading(true);
    const response = await loginClient(loginData);
    setLoading(false);

    if (response.error) {
      Alert.alert('Erro', `Erro ao fazer login: ${response.error}`);
    } else {
      // Salvar dados no AsyncStorage
      const userDataToSave = {
        id: response.data?.id || Date.now(),
        name: response.data?.name || 'Usuário',
        email: response.data?.email || email,
        phone_number: response.data?.phone_number || '',
        document: response.data?.document || '',
        created_at: response.data?.created_at || new Date().toISOString()
      };

      try {
        await AsyncStorage.setItem('userData', JSON.stringify(userDataToSave));
        setUserData(userDataToSave);
        setIsRegistered(true);
        Alert.alert('Sucesso! ✨', 'Login realizado com sucesso!');
        
        // Limpar campos
        setEmail('');
        setPassword('');
        
        // Carregar agendamentos
        if (userDataToSave.id) {
          loadAppointments(userDataToSave.id);
        }
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
      }
    }
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
              <Text style={styles.emptyStateText}>Nenhum agendamento encontrado</Text>
            </View>
          ) : (
            appointments.map((appointment) => {
              const appointmentDateTime = new Date(appointment.appointment_date + ' ' + appointment.start_time);
              const isPast = appointmentDateTime < new Date();
              
              return (
                <View key={appointment.id} style={[styles.appointmentCard, isPast && styles.appointmentCardPast]}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentDateBadge}>
                      <Calendar size={16} color={isPast ? '#999' : '#D4AF37'} />
                      <Text style={[styles.appointmentDate, isPast && styles.appointmentDatePast]}>
                        {formatDate(appointment.appointment_date)}
                      </Text>
                    </View>
                    <View style={styles.appointmentTimeBadge}>
                      <Clock size={16} color={isPast ? '#999' : '#D4AF37'} />
                      <Text style={[styles.appointmentTime, isPast && styles.appointmentTimePast]}>
                        {formatTime(appointment.start_time)}
                      </Text>
                    </View>
                  </View>
                
                <View style={styles.appointmentBody}>
                  <View style={styles.appointmentRow}>
                    <UserCircle size={18} color="#999" />
                    <Text style={styles.appointmentLabel}>Profissional:</Text>
                    <Text style={styles.appointmentValue}>
                      {appointment.professional_name || `Profissional #${appointment.professional_id}`}
                    </Text>
                  </View>
                  
                  {appointment.services && appointment.services.length > 0 && (
                    <View style={styles.appointmentRow}>
                      <Scissors size={18} color="#999" />
                      <Text style={styles.appointmentLabel}>Serviço:</Text>
                      <Text style={styles.appointmentValue}>{appointment.services[0].service_name}</Text>
                    </View>
                  )}
                  
                  <View style={[
                    styles.statusBadge,
                    appointment.status === 'confirmed' && styles.statusBadgeConfirmed,
                    appointment.status === 'pending' && styles.statusBadgePending,
                    appointment.status === 'canceled' && styles.statusBadgeCanceled
                  ]}>
                    <Text style={[
                      styles.statusText,
                      appointment.status === 'confirmed' && styles.statusTextConfirmed,
                      appointment.status === 'pending' && styles.statusTextPending,
                      appointment.status === 'canceled' && styles.statusTextCanceled
                    ]}>
                      {appointment.status === 'pending' ? '⏳ Pendente' : 
                       appointment.status === 'confirmed' ? '✓ Agendamento Confirmado' :
                       appointment.status === 'canceled' ? '✕ Cancelado' : '✓ Concluído'}
                    </Text>
                  </View>
                </View>
              </View>
              );
            })
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
        <Text style={styles.headerTitle}>{isLoginMode ? 'Entrar' : 'Criar Conta'}</Text>
        <Text style={styles.headerSubtitle}>
          {isLoginMode ? 'Acesse sua conta existente' : 'Preencha seus dados para começar'}
        </Text>
      </LinearGradient>

      <View style={styles.formSection}>
        {!isLoginMode && (
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
        )}

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

        {!isLoginMode && (
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
        )}

        {!isLoginMode && (
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
        )}

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

        {!isLoginMode && (
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
        )}

        <View style={styles.registerButtonWrapper}>
          <TouchableOpacity
            onPress={isLoginMode ? handleLogin : handleRegister}
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
                <Text style={styles.registerButtonText}>
                  {isLoginMode ? 'Entrar ✨' : 'Criar Conta ✨'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Toggle between login and register */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              // Clear form fields when switching
              setName('');
              setEmail('');
              setPhoneNumber('');
              setDocument('');
              setPassword('');
              setConfirmPassword('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleLink}>
              {isLoginMode ? 'Criar conta' : 'Fazer login'}
            </Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
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
    paddingTop: 16,
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
  statusBadgeConfirmed: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.5)',
  },
  statusBadgeCanceled: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.5)',
  },
  statusText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  toggleText: {
    color: '#999',
    fontSize: 14,
  },
  toggleLink: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  statusTextConfirmed: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statusTextPending: {
    color: '#FFC107',
  },
  statusTextCanceled: {
    color: '#F44336',
  },
  appointmentCardPast: {
    opacity: 0.6,
    borderColor: '#2a2a2a',
  },
  appointmentDatePast: {
    color: '#999',
  },
  appointmentTimePast: {
    color: '#999',
  },
});
