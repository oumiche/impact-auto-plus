/**
 * Impact Auto - Date Picker Component
 * Composant Vue.js personnalisé pour la sélection de dates
 */

const DatePicker = {
    name: 'DatePicker',
    props: {
        value: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: 'Sélectionner une date'
        },
        disabled: {
            type: Boolean,
            default: false
        },
        minDate: {
            type: String,
            default: null
        },
        maxDate: {
            type: String,
            default: null
        },
        format: {
            type: String,
            default: 'YYYY-MM-DD'
        },
        displayFormat: {
            type: String,
            default: 'DD/MM/YYYY'
        }
    },
    data() {
        return {
            isOpen: false,
            selectedDate: null,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            today: new Date(),
            manualInput: '',
            isManualInput: false
        };
    },
    computed: {
        formattedValue() {
            if (this.isManualInput) return this.manualInput;
            if (!this.value) return '';
            const date = new Date(this.value);
            return this.formatDate(date, this.displayFormat);
        },
        calendarDays() {
            const year = this.currentYear;
            const month = this.currentMonth;
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();
            
            const days = [];
            
            // Jours du mois précédent
            const prevMonth = new Date(year, month - 1, 0);
            const daysInPrevMonth = prevMonth.getDate();
            for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                days.push({
                    day: daysInPrevMonth - i,
                    isCurrentMonth: false,
                    isToday: false,
                    isSelected: false,
                    isDisabled: false
                });
            }
            
            // Jours du mois actuel
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isToday = this.isSameDay(date, this.today);
                const isSelected = this.value && this.isSameDay(date, new Date(this.value));
                const isDisabled = this.isDateDisabled(date);
                
                days.push({
                    day,
                    isCurrentMonth: true,
                    isToday,
                    isSelected,
                    isDisabled
                });
            }
            
            // Jours du mois suivant
            const remainingDays = 42 - days.length; // 6 semaines * 7 jours
            for (let day = 1; day <= remainingDays; day++) {
                days.push({
                    day,
                    isCurrentMonth: false,
                    isToday: false,
                    isSelected: false,
                    isDisabled: false
                });
            }
            
            return days;
        },
        monthNames() {
            return [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ];
        },
        dayNames() {
            return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        }
    },
    watch: {
        value(newValue) {
            if (newValue) {
                const date = new Date(newValue);
                this.currentMonth = date.getMonth();
                this.currentYear = date.getFullYear();
            }
        }
    },
    methods: {
        toggle() {
            if (!this.disabled) {
                this.isOpen = !this.isOpen;
            }
        },
        selectDate(day) {
            if (day.isDisabled || !day.isCurrentMonth) return;
            
            const date = new Date(this.currentYear, this.currentMonth, day.day);
            const formattedDate = this.formatDate(date, this.format);
            this.$emit('input', formattedDate);
            this.isOpen = false;
        },
        previousMonth() {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else {
                this.currentMonth--;
            }
        },
        nextMonth() {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
        },
        goToToday() {
            const today = new Date();
            this.currentMonth = today.getMonth();
            this.currentYear = today.getFullYear();
            
            // Sélectionner la date d'aujourd'hui
            const formattedDate = this.formatDate(today, this.format);
            this.$emit('input', formattedDate);
            this.isOpen = false;
        },
        clear() {
            this.$emit('input', '');
            this.isOpen = false;
        },
        isSameDay(date1, date2) {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        },
        isDateDisabled(date) {
            if (this.minDate) {
                const minDate = new Date(this.minDate);
                if (date < minDate) return true;
            }
            if (this.maxDate) {
                const maxDate = new Date(this.maxDate);
                if (date > maxDate) return true;
            }
            return false;
        },
        formatDate(date, format) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return format
                .replace('DD', day)
                .replace('MM', month)
                .replace('YYYY', year);
        },
        handleClickOutside(event) {
            if (!this.$el.contains(event.target)) {
                this.isOpen = false;
            }
        },
        handleManualInput(event) {
            this.isManualInput = true;
            this.manualInput = event.target.value;
        },
        validateManualInput() {
            if (!this.isManualInput) return;
            
            const inputValue = this.manualInput.trim();
            if (!inputValue) {
                this.isManualInput = false;
                this.manualInput = '';
                return;
            }
            
            // Essayer de parser la date dans différents formats
            const parsedDate = this.parseDate(inputValue);
            if (parsedDate && !isNaN(parsedDate.getTime())) {
                // Vérifier les contraintes min/max
                if (this.isDateValid(parsedDate)) {
                    const formattedDate = this.formatDate(parsedDate, this.format);
                    this.$emit('input', formattedDate);
                    this.isManualInput = false;
                    this.manualInput = '';
                    this.isOpen = false;
                } else {
                    this.showInputError('Date en dehors des limites autorisées');
                }
            } else {
                this.showInputError('Format de date invalide');
            }
        },
        parseDate(dateString) {
            // Formats supportés : DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY
            const formats = [
                /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
                /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/
            ];
            
            for (const format of formats) {
                const match = dateString.match(format);
                if (match) {
                    let day, month, year;
                    if (format.source.includes('(\\d{4})[\\/\\-\\.]')) {
                        // Format YYYY-MM-DD
                        [, year, month, day] = match;
                    } else {
                        // Format DD/MM/YYYY
                        [, day, month, year] = match;
                    }
                    
                    const date = new Date(year, month - 1, day);
                    if (date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year) {
                        return date;
                    }
                }
            }
            return null;
        },
        isDateValid(date) {
            if (this.minDate) {
                const minDate = new Date(this.minDate);
                if (date < minDate) return false;
            }
            if (this.maxDate) {
                const maxDate = new Date(this.maxDate);
                if (date > maxDate) return false;
            }
            return true;
        },
        showInputError(message) {
            // Créer un message d'erreur temporaire
            const errorDiv = document.createElement('div');
            errorDiv.className = 'date-picker-error';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: #dc3545;
                color: white;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1001;
                margin-top: 4px;
            `;
            
            this.$el.appendChild(errorDiv);
            
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 3000);
        },
        onInputFocus() {
            this.isManualInput = true;
            this.manualInput = this.formattedValue;
        },
        onInputBlur() {
            setTimeout(() => {
                this.validateManualInput();
            }, 100);
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    template: `
        <div class="custom-date-picker" :class="{ 'disabled': disabled }">
            <div class="date-picker-input" @click="toggle">
                <input 
                    type="text" 
                    :value="formattedValue" 
                    :placeholder="placeholder"
                    :disabled="disabled"
                    @input="handleManualInput"
                    @focus="onInputFocus"
                    @blur="onInputBlur"
                    @keydown.enter="validateManualInput"
                    @keydown.escape="isManualInput = false; manualInput = ''"
                >
                <i class="fas fa-calendar-alt"></i>
                <button v-if="value" type="button" class="clear-btn" @click.stop="clear">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div v-if="isOpen" class="date-picker-dropdown">
                <div class="date-picker-header">
                    <button type="button" @click="previousMonth" class="nav-btn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="month-year">
                        {{ monthNames[currentMonth] }} {{ currentYear }}
                    </div>
                    <button type="button" @click="nextMonth" class="nav-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="date-picker-body">
                    <div class="day-names">
                        <div v-for="dayName in dayNames" :key="dayName" class="day-name">
                            {{ dayName }}
                        </div>
                    </div>
                    <div class="calendar-days">
                        <div 
                            v-for="(day, index) in calendarDays" 
                            :key="index"
                            :class="[
                                'calendar-day',
                                {
                                    'other-month': !day.isCurrentMonth,
                                    'today': day.isToday,
                                    'selected': day.isSelected,
                                    'disabled': day.isDisabled
                                }
                            ]"
                            @click="selectDate(day)"
                        >
                            {{ day.day }}
                        </div>
                    </div>
                </div>
                
                <div class="date-picker-footer">
                    <button type="button" @click="goToToday" class="today-btn">
                        Aujourd'hui
                    </button>
                </div>
            </div>
        </div>
    `
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined' && window.Vue) {
    window.DatePicker = DatePicker;
}
