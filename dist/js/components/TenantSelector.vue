<template>
  <div class="tenant-selector">
    <div class="field">
      <label class="label">
        <i class="fas fa-building"></i> Organisation
      </label>
      <div class="control">
        <div class="select is-fullwidth">
          <select 
            v-model="selectedTenantId" 
            @change="handleTenantChange"
            :disabled="loading"
          >
            <option value="">{{ loading ? 'Chargement...' : 'Sélectionner une organisation' }}</option>
            <option 
              v-for="tenant in tenants" 
              :key="tenant.id" 
              :value="tenant.id"
            >
              {{ tenant.name }} ({{ tenant.vehicle_count || 0 }} véhicules)
            </option>
          </select>
        </div>
      </div>
      <p class="help" v-if="currentTenant">
        Organisation actuelle: <strong>{{ currentTenant.name }}</strong>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TenantSelector',
  props: {
    value: {
      type: [String, Number],
      default: null
    },
    showCurrentTenant: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      tenants: [],
      selectedTenantId: this.value,
      loading: false,
      currentTenant: null
    }
  },
  mounted() {
    this.loadTenants();
    this.loadCurrentTenant();
  },
  methods: {
    async loadTenants() {
      this.loading = true;
      try {
        const response = await this.$http.get('/api/tenants');
        if (response.data.success) {
          this.tenants = response.data.data.tenants || [];
        }
      } catch (error) {
        console.error('Error loading tenants:', error);
        this.$toast.open({
          message: 'Erreur lors du chargement des organisations',
          type: 'is-danger'
        });
      } finally {
        this.loading = false;
      }
    },

    async loadCurrentTenant() {
      try {
        const response = await this.$http.get('/api/auth/me');
        if (response.data.success && response.data.data.tenant) {
          this.currentTenant = response.data.data.tenant;
          if (!this.selectedTenantId) {
            this.selectedTenantId = this.currentTenant.id;
          }
        }
      } catch (error) {
        console.error('Error loading current tenant:', error);
      }
    },

    async handleTenantChange() {
      if (!this.selectedTenantId) return;

      this.loading = true;
      try {
        const response = await this.$http.post('/api/tenants/switch', {
          tenant_id: parseInt(this.selectedTenantId)
        });

        if (response.data.success) {
          // Mettre à jour les données de session
          sessionStorage.setItem('impact_auto_session', JSON.stringify(response.data.data.session));
          sessionStorage.setItem('impact_auto_tenant', JSON.stringify(response.data.data.tenant));
          sessionStorage.setItem('impact_auto_permissions', JSON.stringify(response.data.data.permissions));

          this.$emit('tenant-changed', response.data.data.tenant);
          
          this.$toast.open({
            message: `Organisation changée vers ${response.data.data.tenant.name}`,
            type: 'is-success'
          });

          // Recharger la page pour mettre à jour l'interface
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          this.$toast.open({
            message: 'Erreur lors du changement d\'organisation: ' + response.data.error,
            type: 'is-danger'
          });
        }
      } catch (error) {
        console.error('Error switching tenant:', error);
        this.$toast.open({
          message: 'Erreur lors du changement d\'organisation',
          type: 'is-danger'
        });
      } finally {
        this.loading = false;
      }
    }
  },
  watch: {
    value(newValue) {
      this.selectedTenantId = newValue;
    }
  }
}
</script>

<style scoped>
.tenant-selector {
  margin-bottom: 1rem;
}

.tenant-selector .label {
  color: var(--impact-dark, #34495e);
  font-weight: 600;
  margin-bottom: 8px;
}

.tenant-selector .label i {
  margin-right: 8px;
  color: var(--impact-secondary, #3498db);
}

.tenant-selector .select select {
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 12px 15px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.tenant-selector .select select:focus {
  border-color: var(--impact-secondary, #3498db);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.tenant-selector .help {
  color: #666;
  font-size: 0.9rem;
  margin-top: 8px;
}

.tenant-selector .help strong {
  color: var(--impact-dark, #34495e);
}
</style>
