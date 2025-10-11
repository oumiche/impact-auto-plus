<template>
  <div class="permission-manager">
    <label v-if="label">{{ label }}</label>
    
    <div class="permissions-container">
      <div v-for="module in permissionModules" :key="module.name" class="permission-module">
        <div class="module-header">
          <input
            type="checkbox"
            :id="`module-${module.name}`"
            :checked="isModuleFullySelected(module)"
            :indeterminate.prop="isModulePartiallySelected(module)"
            @change="toggleModule(module)"
          />
          <label :for="`module-${module.name}`" class="module-name">
            <i :class="module.icon"></i>
            {{ module.label }}
          </label>
        </div>
        
        <div class="module-permissions">
          <div
            v-for="permission in module.permissions"
            :key="permission.value"
            class="permission-item"
          >
            <input
              type="checkbox"
              :id="`perm-${permission.value}`"
              :value="permission.value"
              v-model="selectedPermissions"
              @change="handlePermissionChange"
            />
            <label :for="`perm-${permission.value}`" class="permission-label">
              <span class="permission-name">{{ permission.label }}</span>
              <span v-if="permission.description" class="permission-description">
                {{ permission.description }}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button type="button" @click="selectAll" class="btn-quick">
        <i class="fas fa-check-double"></i> Tout sélectionner
      </button>
      <button type="button" @click="selectNone" class="btn-quick">
        <i class="fas fa-times"></i> Tout désélectionner
      </button>
      <button type="button" @click="selectReadOnly" class="btn-quick">
        <i class="fas fa-eye"></i> Lecture seule
      </button>
    </div>

    <!-- Selected Permissions Summary -->
    <div v-if="selectedPermissions.length > 0" class="permissions-summary">
      <div class="summary-header">
        <strong>{{ selectedPermissions.length }}</strong> permission(s) sélectionnée(s)
      </div>
      <div class="summary-badges">
        <span
          v-for="perm in selectedPermissions"
          :key="perm"
          class="permission-badge"
          @click="removePermission(perm)"
          :title="'Retirer ' + perm"
        >
          {{ getPermissionLabel(perm) }}
          <i class="fas fa-times"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: String
})

const emit = defineEmits(['update:modelValue', 'change'])

const selectedPermissions = ref([...props.modelValue])

// Définition des modules et permissions
const permissionModules = [
  {
    name: 'dashboard',
    label: 'Tableau de bord',
    icon: 'fas fa-tachometer-alt',
    permissions: [
      { value: 'dashboard:read', label: 'Voir', description: 'Accès au tableau de bord' }
    ]
  },
  {
    name: 'vehicles',
    label: 'Véhicules',
    icon: 'fas fa-car',
    permissions: [
      { value: 'vehicles:read', label: 'Voir', description: 'Consulter les véhicules' },
      { value: 'vehicles:create', label: 'Créer', description: 'Ajouter des véhicules' },
      { value: 'vehicles:update', label: 'Modifier', description: 'Modifier les véhicules' },
      { value: 'vehicles:delete', label: 'Supprimer', description: 'Supprimer les véhicules' }
    ]
  },
  {
    name: 'interventions',
    label: 'Interventions',
    icon: 'fas fa-tools',
    permissions: [
      { value: 'interventions:read', label: 'Voir', description: 'Consulter les interventions' },
      { value: 'interventions:create', label: 'Créer', description: 'Créer des interventions' },
      { value: 'interventions:update', label: 'Modifier', description: 'Modifier les interventions' },
      { value: 'interventions:delete', label: 'Supprimer', description: 'Supprimer les interventions' }
    ]
  },
  {
    name: 'drivers',
    label: 'Conducteurs',
    icon: 'fas fa-id-card',
    permissions: [
      { value: 'drivers:read', label: 'Voir', description: 'Consulter les conducteurs' },
      { value: 'drivers:create', label: 'Créer', description: 'Ajouter des conducteurs' },
      { value: 'drivers:update', label: 'Modifier', description: 'Modifier les conducteurs' },
      { value: 'drivers:delete', label: 'Supprimer', description: 'Supprimer les conducteurs' }
    ]
  },
  {
    name: 'supplies',
    label: 'Fournitures',
    icon: 'fas fa-box',
    permissions: [
      { value: 'supplies:read', label: 'Voir', description: 'Consulter les fournitures' },
      { value: 'supplies:create', label: 'Créer', description: 'Ajouter des fournitures' },
      { value: 'supplies:update', label: 'Modifier', description: 'Modifier les fournitures' },
      { value: 'supplies:delete', label: 'Supprimer', description: 'Supprimer les fournitures' }
    ]
  },
  {
    name: 'reports',
    label: 'Rapports',
    icon: 'fas fa-chart-bar',
    permissions: [
      { value: 'reports:read', label: 'Voir', description: 'Consulter les rapports' },
      { value: 'reports:export', label: 'Exporter', description: 'Exporter les données' }
    ]
  },
  {
    name: 'admin',
    label: 'Administration',
    icon: 'fas fa-cog',
    permissions: [
      { value: 'admin:users', label: 'Utilisateurs', description: 'Gérer les utilisateurs' },
      { value: 'admin:tenants', label: 'Tenants', description: 'Gérer les tenants' },
      { value: 'admin:parameters', label: 'Paramètres', description: 'Gérer les paramètres système' },
      { value: 'admin:full', label: 'Accès complet', description: 'Tous droits d\'administration' }
    ]
  }
]

watch(() => props.modelValue, (newVal) => {
  // Only update if values are actually different to prevent loops
  if (JSON.stringify(newVal) !== JSON.stringify(selectedPermissions.value)) {
    selectedPermissions.value = [...newVal]
  }
})

const emitChanges = () => {
  emit('update:modelValue', [...selectedPermissions.value])
  emit('change', [...selectedPermissions.value])
}

const handlePermissionChange = () => {
  // Emit changes when user modifies individual permissions
  emitChanges()
}

const isModuleFullySelected = (module) => {
  return module.permissions.every(p => selectedPermissions.value.includes(p.value))
}

const isModulePartiallySelected = (module) => {
  const selected = module.permissions.filter(p => selectedPermissions.value.includes(p.value))
  return selected.length > 0 && selected.length < module.permissions.length
}

const toggleModule = (module) => {
  const allSelected = isModuleFullySelected(module)
  
  if (allSelected) {
    // Désélectionner tout le module
    selectedPermissions.value = selectedPermissions.value.filter(
      p => !module.permissions.find(mp => mp.value === p)
    )
  } else {
    // Sélectionner tout le module
    module.permissions.forEach(perm => {
      if (!selectedPermissions.value.includes(perm.value)) {
        selectedPermissions.value.push(perm.value)
      }
    })
  }
  emitChanges()
}

const selectAll = () => {
  selectedPermissions.value = permissionModules.flatMap(m => m.permissions.map(p => p.value))
  emitChanges()
}

const selectNone = () => {
  selectedPermissions.value = []
  emitChanges()
}

const selectReadOnly = () => {
  selectedPermissions.value = permissionModules
    .flatMap(m => m.permissions)
    .filter(p => p.value.includes(':read'))
    .map(p => p.value)
  emitChanges()
}

const removePermission = (perm) => {
  selectedPermissions.value = selectedPermissions.value.filter(p => p !== perm)
  emitChanges()
}

const getPermissionLabel = (permValue) => {
  for (const module of permissionModules) {
    const perm = module.permissions.find(p => p.value === permValue)
    if (perm) {
      return `${module.label}: ${perm.label}`
    }
  }
  return permValue
}
</script>

<style scoped lang="scss">
.permission-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  > label {
    font-weight: 600;
    color: #333;
    font-size: 1rem;
  }

  .permissions-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
  }

  .permission-module {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    .module-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e5e7eb;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .module-name {
        font-weight: 700;
        font-size: 1rem;
        color: #1f2937;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          color: #3b82f6;
          width: 20px;
          text-align: center;
        }
      }
    }

    .module-permissions {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
      padding-left: 2rem;

      .permission-item {
        display: flex;
        align-items: start;
        gap: 0.5rem;

        input[type="checkbox"] {
          margin-top: 0.25rem;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .permission-label {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          cursor: pointer;
          flex: 1;

          .permission-name {
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
          }

          .permission-description {
            font-size: 0.75rem;
            color: #6b7280;
            line-height: 1.2;
          }
        }
      }
    }
  }

  .quick-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;

    .btn-quick {
      padding: 0.5rem 1rem;
      border: 2px solid #e5e7eb;
      background: white;
      color: #374151;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        font-size: 0.875rem;
      }

      &:hover {
        background: #f9fafb;
        border-color: #3b82f6;
        color: #3b82f6;
      }
    }
  }

  .permissions-summary {
    padding: 1rem;
    background: #eff6ff;
    border: 2px solid #bfdbfe;
    border-radius: 8px;

    .summary-header {
      margin-bottom: 0.75rem;
      color: #1e40af;
      font-size: 0.9rem;

      strong {
        font-size: 1.1rem;
      }
    }

    .summary-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      .permission-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.625rem;
        background: white;
        color: #1e40af;
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        i {
          font-size: 0.7rem;
          opacity: 0.6;
        }

        &:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;

          i {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>

