# Composants Date Picker Personnalisés

## Vue d'ensemble

Les composants `DatePicker` et `DateTimePicker` offrent une interface utilisateur cohérente et moderne pour la sélection de dates, remplaçant les champs de date natifs du navigateur qui peuvent varier selon l'OS et le navigateur.

## Composants disponibles

### 1. DatePicker
Composant pour la sélection de dates uniquement.

### 2. DateTimePicker
Composant pour la sélection de date et heure.

## Installation

### 1. Inclure les fichiers CSS
```html
<link rel="stylesheet" href="css/date-picker.css">
```

### 2. Inclure les fichiers JavaScript
```html
<script src="js/components/DatePicker.js"></script>
<script src="js/components/DateTimePicker.js"></script>
```

### 3. Enregistrer les composants dans Vue
```javascript
const MyComponent = {
    components: {
        DatePicker,
        DateTimePicker
    },
    // ...
}
```

## Utilisation

### DatePicker

```html
<date-picker 
    v-model="selectedDate"
    placeholder="Sélectionner une date"
    :min-date="minDate"
    :max-date="maxDate"
    :disabled="false"
    format="YYYY-MM-DD"
    display-format="DD/MM/YYYY"
></date-picker>
```

### DateTimePicker

```html
<date-time-picker 
    v-model="selectedDateTime"
    placeholder="Sélectionner une date et heure"
    :min-date="minDate"
    :max-date="maxDate"
    :disabled="false"
    format="YYYY-MM-DDTHH:mm"
    display-format="DD/MM/YYYY HH:mm"
    :time-step="15"
></date-time-picker>
```

## Propriétés (Props)

### DatePicker & DateTimePicker

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `value` | String | `''` | Valeur sélectionnée (v-model) |
| `placeholder` | String | `'Sélectionner une date'` | Texte d'aide |
| `disabled` | Boolean | `false` | Désactiver le composant |
| `minDate` | String | `null` | Date minimum (format YYYY-MM-DD) |
| `maxDate` | String | `null` | Date maximum (format YYYY-MM-DD) |
| `format` | String | `'YYYY-MM-DD'` | Format de sortie |
| `displayFormat` | String | `'DD/MM/YYYY'` | Format d'affichage |

### DateTimePicker uniquement

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `timeStep` | Number | `15` | Intervalle en minutes pour les options d'heure |

## Événements

| Événement | Description |
|-----------|-------------|
| `input` | Émis quand la valeur change (v-model) |

## Exemples d'utilisation

### Exemple basique
```javascript
new Vue({
    el: '#app',
    data() {
        return {
            birthDate: '',
            appointmentDateTime: '',
            today: new Date().toISOString().split('T')[0]
        };
    }
});
```

```html
<div id="app">
    <div class="form-group">
        <label>Date de naissance :</label>
        <date-picker 
            v-model="birthDate"
            placeholder="Sélectionner votre date de naissance"
            :max-date="today"
        ></date-picker>
    </div>
    
    <div class="form-group">
        <label>Rendez-vous :</label>
        <date-time-picker 
            v-model="appointmentDateTime"
            placeholder="Sélectionner la date et heure"
            :min-date="today"
            :time-step="30"
        ></date-time-picker>
    </div>
</div>
```

### Exemple avec validation
```javascript
data() {
    return {
        startDate: '',
        endDate: '',
        today: new Date().toISOString().split('T')[0],
        maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    };
}
```

```html
<div class="form-group">
    <label>Date de début :</label>
    <date-picker 
        v-model="startDate"
        :min-date="today"
        placeholder="Date de début"
    ></date-picker>
</div>

<div class="form-group">
    <label>Date de fin :</label>
    <date-picker 
        v-model="endDate"
        :max-date="maxDate"
        placeholder="Date de fin"
    ></date-picker>
</div>
```

## Personnalisation CSS

Les composants utilisent des variables CSS personnalisables :

```css
:root {
    --primary-color: #007bff;
    --primary-hover: #0056b3;
    --border-color: #ddd;
    --bg-hover: #f8f9fa;
    --bg-disabled: #f5f5f5;
    --text-primary: #333;
    --text-secondary: #666;
    --text-disabled: #ccc;
    --bg-secondary: #f8f9fa;
}
```

## Avantages

1. **Interface cohérente** : Même apparence sur tous les navigateurs et OS
2. **Personnalisable** : Styles et comportements adaptables
3. **Accessible** : Navigation au clavier et support des lecteurs d'écran
4. **Validation intégrée** : Support des dates min/max
5. **Responsive** : S'adapte aux écrans mobiles
6. **Localisation** : Interface en français avec format de date français

## Page de démonstration

Une page de démonstration est disponible à `/date-picker-demo.html` pour tester tous les composants et leurs fonctionnalités.

## Intégration dans les formulaires existants

### Véhicules
Le champ "Date d'achat" utilise maintenant le `DatePicker` avec validation (date max = aujourd'hui).

### Garages
Les champs de date peuvent être remplacés par les composants personnalisés.

### Conducteurs
Les champs de date de naissance et d'expiration du permis peuvent utiliser les composants.

### Assignations
Les champs de date d'assignation et de désassignation peuvent utiliser les composants.

## Support des navigateurs

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Notes techniques

- Les composants sont compatibles Vue 2
- Utilisation de Font Awesome pour les icônes
- Support des événements de clic extérieur pour fermer les dropdowns
- Animation CSS pour les transitions
- Gestion des états disabled et validation
