import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Crown, Check, Calendar, Zap, Sparkles } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getPlans, Plan } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const response = await getPlans();
    if (response.data) {
      setPlans(response.data);
    }
    setLoading(false);
  };

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const handleSelectPlan = async (planId: number, planName: string) => {
    setSelectedPlan(planId);
    
    // Abrir WhatsApp com mensagem pré-definida
    const phoneNumber = '556299569611';
    const message = `Olá! Tenho interesse no plano: ${planName}`;
    const whatsappUrl = `http://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        console.error('Não foi possível abrir o WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando planos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <LinearGradient
            colors={['#D4AF37', '#FFD700']}
            style={styles.headerIcon}
          >
            <Crown size={32} color="#000" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>Planos Premium</Text>
        <Text style={styles.headerSubtitle}>Escolha o melhor plano para você</Text>
      </LinearGradient>

      {/* Plans Grid */}
      <View style={styles.plansContainer}>
        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum plano disponível</Text>
          </View>
        ) : (
          plans.map((plan, index) => (
            <View key={plan.id} style={styles.planCardWrapper}>
              <LinearGradient
                colors={
                  index === 0
                    ? ['rgba(212, 175, 55, 0.2)', 'rgba(255, 215, 0, 0.1)']
                    : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
                }
                style={[
                  styles.planCard,
                  index === 0 && styles.featuredPlan,
                  selectedPlan === plan.id && styles.selectedPlan
                ]}
              >
                {/* Badge de Destaque */}
                {index === 0 && (
                  <View style={styles.featuredBadge}>
                    <LinearGradient
                      colors={['#D4AF37', '#FFD700']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.badgeGradient}
                    >
                      <Sparkles size={12} color="#000" />
                      <Text style={styles.badgeText}>POPULAR</Text>
                    </LinearGradient>
                  </View>
                )}

                {/* Ícone do Plano */}
                <View style={styles.planIconContainer}>
                  <LinearGradient
                    colors={['#D4AF37', '#FFD700']}
                    style={styles.planIcon}
                  >
                    <Crown size={28} color="#000" />
                  </LinearGradient>
                </View>

                {/* Nome do Plano */}
                <Text style={styles.planName}>{plan.name}</Text>

                {/* Descrição */}
                <Text style={styles.planDescription}>{plan.description}</Text>

                {/* Preço */}
                <View style={styles.priceContainer}>
                  <Text style={styles.priceValue}>{formatPrice(plan.price)}</Text>
                  <Text style={styles.pricePeriod}>
                    {plan.is_recurring ? '/mês' : 'único'}
                  </Text>
                </View>

                {/* Informações */}
                <View style={styles.infoContainer}>
                  {plan.sessions_per_week > 0 && (
                    <View style={styles.infoRow}>
                      <Calendar size={16} color="#D4AF37" />
                      <Text style={styles.infoText}>
                        {plan.sessions_per_week} {plan.sessions_per_week === 1 ? 'sessão' : 'sessões'} por semana
                      </Text>
                    </View>
                  )}
                  
                  {plan.sessions_limit && (
                    <View style={styles.infoRow}>
                      <Zap size={16} color="#D4AF37" />
                      <Text style={styles.infoText}>
                        Limite de {plan.sessions_limit} sessões
                      </Text>
                    </View>
                  )}

                  {plan.is_recurring && (
                    <View style={styles.infoRow}>
                      <Check size={16} color="#D4AF37" />
                      <Text style={styles.infoText}>Renovação automática</Text>
                    </View>
                  )}
                </View>

                {/* Serviços Inclusos */}
                {plan.services && plan.services.length > 0 && (
                  <View style={styles.servicesContainer}>
                    <Text style={styles.servicesTitle}>Serviços inclusos:</Text>
                    {plan.services.map((service) => (
                      <View key={service.id} style={styles.serviceRow}>
                        <Check size={14} color="#D4AF37" />
                        <Text style={styles.serviceText}>{service.name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Botão de Seleção */}
                <TouchableOpacity
                  style={styles.selectButtonWrapper}
                  onPress={() => handleSelectPlan(plan.id, plan.name)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      selectedPlan === plan.id
                        ? ['#4CAF50', '#45a049']
                        : ['#D4AF37', '#FFD700', '#D4AF37']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectButton}
                  >
                    <Text style={styles.selectButtonText}>
                      {selectedPlan === plan.id ? 'Selecionado ✓' : 'Selecionar Plano'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
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
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  plansContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  planCardWrapper: {
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    position: 'relative',
  },
  featuredPlan: {
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedPlan: {
    borderColor: '#4CAF50',
  },
  featuredBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    zIndex: 10,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#999',
    marginLeft: 4,
  },
  infoContainer: {
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
  },
  servicesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  servicesTitle: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  serviceText: {
    color: '#fff',
    fontSize: 13,
  },
  selectButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 100,
  },
});
