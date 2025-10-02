/**
 * Impact Auto - DateTime Picker Component
 * Composant Vue.js personnalisé pour la sélection de date et heure
 */

const DateTimePicker = {
    name: 'DateTimePicker',
    props: {
        value: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: 'Sélectionner une date et heure'
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
            default: 'YYYY-MM-DDTHH:mm'
        },
        displayFormat: {
            type: String,
            default: 'DD/MM/YYYY HH:mm'
        },
        timeStep: {
            type: Number,
            default: 15 // minutes
        }
    },
    data() {
        return {
            isOpen: false,
            selectedDate: null,
            selectedTime: { hours: 0, minutes: 0 },
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            today: new Date(),
            showTimePicker: false,
            manualInput: '',
            isManualInput: false
        };
    },
    computed: {
        formattedValue() {
            if (this.isManualInput) return this.manualInput;
            if (!this.value) return '';
            const date = new Date(this.value);
            return this.formatDateTime(date, this.displayFormat);
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
            const remainingDays = 42 - days.length;
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
        },
        timeOptions() {
            const options = [];
            for (let hour = 0; hour < 24; hour++) {
                for (let minute = 0; minute < 60; minute += this.timeStep) {
                    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    options.push({
                        value: { hours: hour, minutes: minute },
                        label: timeString
                    });
                }
            }
            return options;
        }
    },
    watch: {
        value(newValue) {
            if (newValue) {
                const date = new Date(newValue);
                this.currentMonth = date.getMonth();
                this.currentYear = date.getFullYear();
                this.selectedTime = {
                    hours: date.getHours(),
                    minutes: date.getMinutes()
                };
            }
        }
    },
    methods: {
        toggle() {
            if (!this.disabled) {
                this.isOpen = !this.isOpen;
                this.showTimePicker = false;
            }
        },
        selectDate(day) {
            if (day.isDisabled || !day.isCurrentMonth) return;
            
            const date = new Date(this.currentYear, this.currentMonth, day.day);
            date.setHours(this.selectedTime.hours, this.selectedTime.minutes, 0, 0);
            const formattedDateTime = this.formatDateTime(date, this.format);
            this.$emit('input', formattedDateTime);
            this.showTimePicker = true;
        },
        selectTime(time) {
            this.selectedTime = time;
            if (this.value) {
                const date = new Date(this.value);
                date.setHours(time.hours, time.minutes, 0, 0);
                const formattedDateTime = this.formatDateTime(date, this.format);
                this.$emit('input', formattedDateTime);
            }
        },
        updateHours(value) {
            const hours = parseInt(value);
            if (hours >= 0 && hours <= 23) {
                this.selectedTime.hours = hours;
                this.emitValue();
            }
        },
        updateMinutes(value) {
            const minutes = parseInt(value);
            if (minutes >= 0 && minutes <= 59) {
                this.selectedTime.minutes = minutes;
                this.emitValue();
            }
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
            this.selectedTime = {
                hours: today.getHours(),
                minutes: today.getMinutes()
            };
            
            // Sélectionner la date et heure d'aujourd'hui
            const formattedDateTime = this.formatDateTime(today, this.format);
            this.$emit('input', formattedDateTime);
            this.isOpen = false;
            this.showTimePicker = false;
        },
        clear() {
            this.$emit('input', '');
            this.isOpen = false;
            this.showTimePicker = false;
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
        formatDateTime(date, format) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return format
                .replace('DD', day)
                .replace('MM', month)
                .replace('YYYY', year)
                .replace('HH', hours)
                .replace('mm', minutes);
        },
        handleClickOutside(event) {
            if (!this.$el.contains(event.target)) {
                this.isOpen = false;
                this.showTimePicker = false;
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
            
            // Essayer de parser la date et heure dans différents formats
            const parsedDateTime = this.parseDateTime(inputValue);
            if (parsedDateTime && !isNaN(parsedDateTime.getTime())) {
                // Vérifier les contraintes min/max
                if (this.isDateValid(parsedDateTime)) {
                    const formattedDateTime = this.formatDateTime(parsedDateTime, this.format);
                    this.$emit('input', formattedDateTime);
                    this.isManualInput = false;
                    this.manualInput = '';
                    this.isOpen = false;
                    this.showTimePicker = false;
                } else {
                    this.showInputError('Date en dehors des limites autorisées');
                }
            } else {
                this.showInputError('Format de date/heure invalide');
            }
        },
        parseDateTime(dateTimeString) {
            // Formats supportés : DD/MM/YYYY HH:mm, DD-MM-YYYY HH:mm, YYYY-MM-DDTHH:mm, etc.
            const formats = [
                /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\s+(\d{1,2}):(\d{2})$/,
                /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})T?(\d{1,2}):(\d{2})$/
            ];
            
            for (const format of formats) {
                const match = dateTimeString.match(format);
                if (match) {
                    let day, month, year, hours, minutes;
                    if (format.source.includes('(\\d{4})[\\/\\-\\.]')) {
                        // Format YYYY-MM-DDTHH:mm
                        [, year, month, day, hours, minutes] = match;
                    } else {
                        // Format DD/MM/YYYY HH:mm
                        [, day, month, year, hours, minutes] = match;
                    }
                    
                    const date = new Date(year, month - 1, day, hours, minutes);
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
            errorDiv.className = 'datetime-picker-error';
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
        <div class="custom-datetime-picker" :class="{ 'disabled': disabled }">
            <div class="datetime-picker-input" @click="toggle">
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
            
            <div v-if="isOpen" class="datetime-picker-dropdown">
                <div class="datetime-picker-header">
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
                
                <div class="datetime-picker-body">
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
                    
                    <div v-if="showTimePicker" class="time-picker">
                        <div class="time-picker-header">
                            <i class="fas fa-clock"></i>
                            <span>Sélectionner l'heure</span>
                        </div>
                        <div class="time-controls">
                            <div class="time-input-group">
                                <label>Heure:</label>
                                <input 
                                    type="number" 
                                    :value="selectedTime.hours" 
                                    @input="updateHours($event.target.value)"
                                    min="0" 
                                    max="23" 
                                    class="time-input"
                                >
                            </div>
                            <div class="time-separator">:</div>
                            <div class="time-input-group">
                                <label>Minutes:</label>
                                <input 
                                    type="number" 
                                    :value="selectedTime.minutes" 
                                    @input="updateMinutes($event.target.value)"
                                    min="0" 
                                    max="59" 
                                    class="time-input"
                                >
                            </div>
                        </div>
                        <div class="time-options">
                            <div 
                                v-for="time in timeOptions" 
                                :key="time.label"
                                :class="[
                                    'time-option',
                                    {
                                        'selected': time.value.hours === selectedTime.hours && 
                                                  time.value.minutes === selectedTime.minutes
                                    }
                                ]"
                                @click="selectTime(time.value)"
                            >
                                {{ time.label }}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="datetime-picker-footer">
                    <button type="button" @click="goToToday" class="today-btn">
                        Maintenant
                    </button>
                    <button v-if="showTimePicker" type="button" @click="isOpen = false" class="done-btn">
                        Terminé
                    </button>
                </div>
            </div>
        </div>
    `
};

// Enregistrer le composant globalement
if (typeof window !== 'undefined' && window.Vue) {
    window.DateTimePicker = DateTimePicker;
}
