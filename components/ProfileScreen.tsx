import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { UserCircle, Mail, Phone, Lock, FileText, Calendar, Clock, Scissors, Check, X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { createClient, CreateClientData, loginClient, LoginData, getClientAppointments, Appointment, updateAppointmentStatus } from '../services/api';
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

  // Verificar dados do usuário quando o estado de registro mudar
  useEffect(() => {
    if (!isRegistered) {
      // Se não está registrado, limpar todos os dados
      setUserData(null);
      setAppointments([]);
    }
  }, [isRegistered]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      console.log('Dados carregados do AsyncStorage:', data);
      if (data) {
        const parsedData = JSON.parse(data);
        console.log('Dados parseados:', parsedData);
        setUserData(parsedData);
        setIsRegistered(true);
        // Carregar agendamentos do cliente
        loadAppointments(parsedData.id);
      } else {
        // Não há dados salvos - usuário não está logado
        console.log('Nenhum dado de usuário encontrado - fazendo logout');
        setUserData(null);
        setIsRegistered(false);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Em caso de erro, assumir que não está logado
      setUserData(null);
      setIsRegistered(false);
      setAppointments([]);
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
      console.log('Erro de login - Status:', response.status, 'Mensagem:', response.error);
      
      // Verificar se é erro de credenciais inválidas
      if (response.status === 401 || response.error.toLowerCase().includes('invalid') || 
          response.error.toLowerCase().includes('unauthorized') || 
          response.error.toLowerCase().includes('credenciais') ||
          response.error.toLowerCase().includes('senha') ||
          response.error.toLowerCase().includes('email')) {
        Alert.alert(
          'Credenciais Inválidas', 
          'Email ou senha incorretos. Verifique seus dados e tente novamente.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Erro', `Erro ao fazer login: ${response.error}`);
      }
    } else {
      // Salvar dados no AsyncStorage
      const userData = response.data?.user || response.data;
      const userDataToSave = {
        id: userData?.id || Date.now(),
        name: userData?.name || 'Usuário',
        email: userData?.email || email,
        phone_number: userData?.phone_number || '',
        document: userData?.document || '',
        created_at: userData?.created_at || new Date().toISOString(),
        token: response.data?.token // Salvar o token também
      };

      console.log('Dados do usuário extraídos:', userData);
      console.log('Dados a serem salvos:', userDataToSave);

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

  const handleConfirmAppointment = async (appointmentId: number) => {
    Alert.alert(
      'Confirmar Agendamento',
      'Deseja confirmar este agendamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            console.log('[handleConfirmAppointment] Iniciando confirmação do agendamento:', appointmentId);
            setLoadingAppointments(true);
            
            try {
              const response = await updateAppointmentStatus(appointmentId, 'confirmed');
              setLoadingAppointments(false);
              
              console.log('[handleConfirmAppointment] Resposta recebida:', response);
              
              if (response.error) {
                console.error('[handleConfirmAppointment] Erro na resposta:', response);
                Alert.alert('Erro', `Erro ao confirmar agendamento: ${response.error}\n\nStatus: ${response.status || 'N/A'}`);
              } else {
                console.log('[handleConfirmAppointment] Sucesso!');
                Alert.alert('Sucesso! ✅', 'Agendamento confirmado com sucesso!');
                // Recarregar agendamentos
                if (userData?.id) {
                  loadAppointments(userData.id);
                }
              }
            } catch (error: any) {
              setLoadingAppointments(false);
              console.error('[handleConfirmAppointment] Erro não capturado:', error);
              Alert.alert('Erro', `Erro inesperado: ${error?.message || error}`);
            }
          }
        }
      ]
    );
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    Alert.alert(
      'Cancelar Agendamento',
      'Deseja realmente cancelar este agendamento? Esta ação não pode ser desfeita.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            console.log('[handleCancelAppointment] Iniciando cancelamento do agendamento:', appointmentId);
            setLoadingAppointments(true);
            
            try {
              const response = await updateAppointmentStatus(appointmentId, 'canceled', 'client');
              setLoadingAppointments(false);
              
              console.log('[handleCancelAppointment] Resposta recebida:', response);
              
              if (response.error) {
                console.error('[handleCancelAppointment] Erro na resposta:', response);
                Alert.alert('Erro', `Erro ao cancelar agendamento: ${response.error}\n\nStatus: ${response.status || 'N/A'}`);
              } else {
                console.log('[handleCancelAppointment] Sucesso!');
                Alert.alert('Agendamento Cancelado', 'Seu agendamento foi cancelado com sucesso.');
                // Recarregar agendamentos
                if (userData?.id) {
                  loadAppointments(userData.id);
                }
              }
            } catch (error: any) {
              setLoadingAppointments(false);
              console.error('[handleCancelAppointment] Erro não capturado:', error);
              Alert.alert('Erro', `Erro inesperado: ${error?.message || error}`);
            }
          }
        }
      ]
    );
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
            console.log('Iniciando processo de logout...');
            try {
              // Remover dados do AsyncStorage
              await AsyncStorage.removeItem('userData');
              console.log('Dados removidos do AsyncStorage');
              
              // Limpar estados locais
              setUserData(null);
              setIsRegistered(false);
              setAppointments([]);
              
              // Limpar campos do formulário
              setName('');
              setEmail('');
              setPhoneNumber('');
              setDocument('');
              setPassword('');
              setConfirmPassword('');
              
              // Voltar para modo login
              setIsLoginMode(true);
              
              console.log('Logout realizado com sucesso - todos os estados limpos');
              Alert.alert('Sucesso', 'Você saiu da sua conta com sucesso!');
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Erro ao sair da conta. Tente novamente.');
            }
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
                  
                  {/* Botões de ação para agendamentos pendentes e futuros */}
                  {appointment.status === 'pending' && !isPast && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => handleConfirmAppointment(appointment.id)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#4CAF50', '#45a049']}
                          style={styles.actionButtonGradient}
                        >
                          <Check size={16} color="#fff" />
                          <Text style={styles.confirmButtonText}>Confirmar</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelAppointment(appointment.id)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#f44336', '#d32f2f']}
                          style={styles.actionButtonGradient}
                        >
                          <X size={16} color="#fff" />
                          <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
