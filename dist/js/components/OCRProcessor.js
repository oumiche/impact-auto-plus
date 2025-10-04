/**
 * Composant OCR pour l'extraction de données des devis
 * Utilise Tesseract.js pour la reconnaissance de caractères
 */

const OCRProcessor = {
    props: {
        entityType: {
            type: String,
            default: 'intervention_quote'
        }
    },
    
    data() {
        return {
            // État du processus OCR
            isProcessing: false,
            progress: 0,
            extractedText: '',
            parsedData: null,
            error: null,
            activeTab: 'parsed',
            
            // Configuration OCR
            ocrConfig: {
                lang: 'fra+eng', // Français + Anglais
                oem: 1, // LSTM OCR Engine Mode
                psm: 6, // Uniform block of text
            },
            
            // Patterns de reconnaissance
            patterns: {
                // Montants (avec différents formats)
                amount: /(\d+(?:[.,]\d{2})?)\s*(?:€|F\s*CFA|FCFA|euros?|francs?)/gi,
                // Dates (format français)
                date: /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
                // Numéros de devis/facture
                quoteNumber: /(?:devis|quote|facture|n°?|num[ée]ro)[\s:]*([A-Z0-9\-]+)/gi,
                // Lignes de devis (quantité + description + montant)
                lineItem: /(\d+(?:[.,]\d+)?)\s+([A-Z\s]+?)\s+(\d+(?:[.,]\d{2})?)/gi,
                // Quantités
                quantity: /(?:qty|quantit[ée]|qte)[\s:]*(\d+(?:[.,]\d+)?)/gi,
                // Prix unitaires
                unitPrice: /(?:prix\s*unit|pu|price)[\s:]*(\d+(?:[.,]\d{2})?)/gi,
                // Totaux
                total: /(?:total|tva|ttc|ht)[\s:]*(\d+(?:[.,]\d{2})?)/gi,
                // Informations véhicule
                vehicleInfo: /(?:véhicule|voiture|immatriculation|plaque)[\s:]*([A-Z0-9\s\-]+)/gi,
                // Client
                clientInfo: /(?:client|customer)[\s:]*([A-Z0-9\s\-]+)/gi
            }
        };
    },
    
    methods: {
        /**
         * Initialise Tesseract.js
         */
        async initializeOCR() {
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js n\'est pas chargé');
            }
            
            console.log('Initialisation de Tesseract.js...');
        },
        
        /**
         * Traite un fichier image ou PDF
         * @param {File} file - Le fichier à traiter
         */
        async processFile(file) {
            this.resetState();
            this.isProcessing = true;
            this.progress = 0;
            
            try {
                // Vérifier le type de fichier
                if (!this.isValidFile(file)) {
                    throw new Error('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.');
                }
                
                // Initialiser OCR
                await this.initializeOCR();
                
                // Convertir le fichier en image si nécessaire
                const imageData = await this.convertToImage(file);
                
                // Extraire le texte avec Tesseract
                const result = await this.extractText(imageData);
                
                // Parser les données extraites
                this.parsedData = this.parseExtractedData(result.text);
                
                this.extractedText = result.text;
                this.progress = 100;
                
                console.log('OCR terminé avec succès');
                console.log('Texte extrait:', this.extractedText);
                console.log('Données parsées:', this.parsedData);
                
            } catch (error) {
                console.error('Erreur OCR:', error);
                this.error = error.message;
            } finally {
                this.isProcessing = false;
            }
        },
        
        /**
         * Vérifie si le fichier est valide
         */
        isValidFile(file) {
            const validTypes = [
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'image/bmp',
                'application/pdf'
            ];
            
            return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
        },
        
        /**
         * Convertit un fichier en image pour OCR
         */
        async convertToImage(file) {
            return new Promise((resolve, reject) => {
                if (file.type === 'application/pdf') {
                    // Pour les PDF, on pourrait utiliser PDF.js
                    reject(new Error('Les PDF ne sont pas encore supportés. Veuillez convertir en image.'));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
                    img.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
                reader.readAsDataURL(file);
            });
        },
        
        /**
         * Extrait le texte d'une image avec Tesseract
         */
        async extractText(image) {
            console.log('Démarrage de l\'extraction OCR...');
            
            const result = await Tesseract.recognize(
                image,
                this.ocrConfig.lang,
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            this.progress = Math.round(m.progress * 100);
                        }
                        console.log('OCR Progress:', m);
                    }
                }
            );
            
            return {
                text: result.data.text,
                confidence: result.data.confidence
            };
        },
        
        /**
         * Parse les données extraites pour identifier les informations du devis
         */
        parseExtractedData(text) {
            console.log('Parsing du texte:', text);
            
            const data = {
                quoteNumber: this.extractQuoteNumber(text),
                dates: this.extractDates(text),
                amounts: this.extractAmounts(text),
                lines: this.extractLines(text),
                totals: this.extractTotals(text),
                vehicleInfo: this.extractVehicleInfo(text),
                clientInfo: this.extractClientInfo(text),
                confidence: 'medium' // À améliorer avec la confiance Tesseract
            };
            
            console.log('Données parsées:', data);
            return data;
        },
        
        /**
         * Extrait le numéro de devis
         */
        extractQuoteNumber(text) {
            const matches = text.match(this.patterns.quoteNumber);
            return matches ? matches[0] : null;
        },
        
        /**
         * Extrait les dates
         */
        extractDates(text) {
            const matches = text.match(this.patterns.date);
            return matches ? matches.map(date => this.normalizeDate(date)) : [];
        },
        
        /**
         * Extrait les montants
         */
        extractAmounts(text) {
            const matches = text.match(this.patterns.amount);
            return matches ? matches.map(amount => this.normalizeAmount(amount)) : [];
        },
        
        /**
         * Extrait les lignes de devis (amélioré)
         */
        extractLines(text) {
            const lines = [];
            const linesText = text.split('\n');
            
            linesText.forEach((line, index) => {
                // Nettoyer la ligne
                const cleanLine = line.trim();
                
                // Pattern pour lignes avec quantité + description + prix
                // Exemple: "2 MOYEU AVANT COMPLET 125 000 250 000"
                // Gère les espaces multiples et les alignements de colonnes
                
                // Méthode robuste : extraire tous les nombres de la ligne
                const numbers = cleanLine.match(/\d+(?:\s?\d{3})*(?:[.,]\d{2})?/g);
                
                if (numbers && numbers.length >= 3) {
                    // Le premier nombre est la quantité
                    const quantity = parseFloat(numbers[0].replace(',', '.').replace(/\s/g, ''));
                    
                    // Les deux derniers nombres sont prix unitaire et total
                    const unitPrice = parseFloat(numbers[numbers.length - 2].replace(',', '.').replace(/\s/g, ''));
                    const totalPrice = parseFloat(numbers[numbers.length - 1].replace(',', '.').replace(/\s/g, ''));
                    
                    // La description est tout ce qui reste après avoir retiré les nombres
                    let description = cleanLine;
                    numbers.forEach(num => {
                        description = description.replace(num, '').trim();
                    });
                    description = description.replace(/\s+/g, ' ').trim();
                    
                    // Validation des données
                    if (!isNaN(quantity) && !isNaN(unitPrice) && !isNaN(totalPrice) && description.length > 2) {
                        console.log(`Ligne parsée: Qty=${quantity}, Desc="${description}", Unit=${unitPrice}, Total=${totalPrice}`);
                        
                        lines.push({
                            lineNumber: index + 1,
                            quantity: quantity,
                            description: description,
                            unitPrice: unitPrice,
                            totalPrice: totalPrice
                        });
                        return; // Sortir de la boucle pour cette ligne
                    }
                }
                
                // Pattern amélioré pour gérer les espaces multiples entre colonnes
                // Utilise \s{2,} pour détecter au moins 2 espaces consécutifs comme séparateur de colonnes
                const lineMatch = cleanLine.match(/^(\d+(?:[.,]\d+)?)\s+(.+?)\s{2,}(\d+(?:\s?\d{3})*(?:[.,]\d{2})?)\s{2,}(\d+(?:\s?\d{3})*(?:[.,]\d{2})?)$/);
                
                if (lineMatch) {
                    const quantity = parseFloat(lineMatch[1].replace(',', '.').replace(/\s/g, ''));
                    const description = lineMatch[2].trim();
                    const unitPrice = parseFloat(lineMatch[3].replace(',', '.').replace(/\s/g, ''));
                    const totalPrice = parseFloat(lineMatch[4].replace(',', '.').replace(/\s/g, ''));
                    
                    lines.push({
                        lineNumber: index + 1,
                        quantity: quantity,
                        description: description,
                        unitPrice: unitPrice,
                        totalPrice: totalPrice
                    });
                } else {
                    // Méthode alternative : parser par position fixe pour les colonnes
                    // Exemple: "14 MAIN D'OEUVRE             4 500      63 000"
                    const parts = cleanLine.split(/\s{2,}/); // Séparer par 2+ espaces
                    
                    if (parts.length >= 3) {
                        // Reconstituer la description en joignant les parties du milieu
                        const quantity = parseFloat(parts[0].replace(',', '.'));
                        const description = parts.slice(1, -2).join(' ').trim();
                        const unitPrice = parseFloat(parts[parts.length - 2].replace(',', '.').replace(/\s/g, ''));
                        const totalPrice = parseFloat(parts[parts.length - 1].replace(',', '.').replace(/\s/g, ''));
                        
                        if (!isNaN(quantity) && !isNaN(unitPrice) && !isNaN(totalPrice) && description.length > 2) {
                            lines.push({
                                lineNumber: index + 1,
                                quantity: quantity,
                                description: description,
                                unitPrice: unitPrice,
                                totalPrice: totalPrice
                            });
                            return; // Sortir de la boucle pour cette ligne
                        }
                    }
                    
                    // Pattern alternatif pour lignes avec juste quantité + description + montant final
                    const altMatch = cleanLine.match(/^(\d+(?:[.,]\d+)?)\s+(.+?)\s+(\d+(?:\s?\d{3})*(?:[.,]\d{2})?)$/);
                    
                    if (altMatch && cleanLine.length > 20) { // Éviter les lignes trop courtes
                        const quantity = parseFloat(altMatch[1].replace(',', '.').replace(/\s/g, ''));
                        const description = altMatch[2].trim();
                        const totalPrice = parseFloat(altMatch[3].replace(',', '.').replace(/\s/g, ''));
                        
                        // Calculer le prix unitaire
                        const unitPrice = quantity > 0 ? totalPrice / quantity : 0;
                        
                        lines.push({
                            lineNumber: index + 1,
                            quantity: quantity,
                            description: description,
                            unitPrice: unitPrice,
                            totalPrice: totalPrice
                        });
                    }
                }
            });
            
            // Filtrer les lignes vides et les lignes trop courtes
            return lines.filter(line => 
                line.description && 
                line.description.length > 3 && 
                line.quantity > 0 &&
                line.totalPrice > 0
            );
        },
        
        /**
         * Extrait les totaux
         */
        extractTotals(text) {
            const totals = {};
            
            // Recherche de différents types de totaux
            const htMatch = text.match(/ht[\s:]*(\d+(?:[.,]\d{2})?)/i);
            const ttcMatch = text.match(/ttc[\s:]*(\d+(?:[.,]\d{2})?)/i);
            const tvaMatch = text.match(/tva[\s:]*(\d+(?:[.,]\d{2})?)/i);
            const totalMatch = text.match(/total[\s:]*(\d+(?:[.,]\d{2})?)/i);
            
            if (htMatch) totals.ht = parseFloat(htMatch[1].replace(',', '.'));
            if (ttcMatch) totals.ttc = parseFloat(ttcMatch[1].replace(',', '.'));
            if (tvaMatch) totals.tva = parseFloat(tvaMatch[1].replace(',', '.'));
            if (totalMatch) totals.total = parseFloat(totalMatch[1].replace(',', '.'));
            
            return totals;
        },
        
        /**
         * Normalise une date
         */
        normalizeDate(dateStr) {
            // Convertit différentes formats de date en format standard
            const cleanDate = dateStr.replace(/[\/\-\.]/g, '/');
            const parts = cleanDate.split('/');
            
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                let year = parts[2];
                
                // Gestion des années à 2 chiffres
                if (year.length === 2) {
                    year = '20' + year;
                }
                
                return `${day}/${month}/${year}`;
            }
            
            return dateStr;
        },
        
        /**
         * Normalise un montant
         */
        normalizeAmount(amountStr) {
            return parseFloat(amountStr.replace(/[€\s]/g, '').replace(',', '.'));
        },
        
        /**
         * Extrait les informations véhicule
         */
        extractVehicleInfo(text) {
            const vehicleMatches = text.match(this.patterns.vehicleInfo);
            const toyotaMatch = text.match(/TOYOTA\s+([A-Z0-9\s\-]+)/i);
            const plateMatch = text.match(/([A-Z]{2}\d{2}[A-Z]{2}\d{2}|[A-Z]\d{4}[A-Z]{2})/i);
            
            return {
                brand: toyotaMatch ? 'TOYOTA' : (vehicleMatches ? vehicleMatches[0] : null),
                model: toyotaMatch ? toyotaMatch[1].trim() : null,
                plateNumber: plateMatch ? plateMatch[1] : null
            };
        },
        
        /**
         * Extrait les informations client
         */
        extractClientInfo(text) {
            const clientMatch = text.match(/CLIENT:\s*([A-Z0-9\s\-]+)/i);
            const addressMatch = text.match(/ADRESSE:\s*([A-Z0-9\s\-,\.]+)/i);
            
            return {
                name: clientMatch ? clientMatch[1].trim() : null,
                address: addressMatch ? addressMatch[1].trim() : null
            };
        },
        
        /**
         * Remet à zéro l'état du composant
         */
        resetState() {
            this.extractedText = '';
            this.parsedData = null;
            this.error = null;
            this.progress = 0;
        },
        
        /**
         * Applique les données parsées au formulaire parent
         */
        async applyToForm() {
            if (this.parsedData) {
                // Calculer le total des lignes
                this.calculateTotal();
                
                // Proposer d'ajouter les fournitures
                await this.offerToAddSupplies();
                
                this.$emit('data-extracted', this.parsedData);
            }
        },
        
        /**
         * Calcule le total des lignes extraites
         */
        calculateTotal() {
            if (this.parsedData && this.parsedData.lines) {
                const total = this.parsedData.lines.reduce((sum, line) => {
                    return sum + (line.totalPrice || 0);
                }, 0);
                
                this.parsedData.totals = this.parsedData.totals || {};
                this.parsedData.totals.calculated = total;
                
                console.log('Total calculé:', total);
            }
        },
        
        /**
         * Propose d'ajouter les fournitures détectées
         */
        async offerToAddSupplies() {
            if (!this.parsedData || !this.parsedData.lines || this.parsedData.lines.length === 0) {
                return;
            }
            
            const uniqueSupplies = this.getUniqueSupplies();
            
            if (uniqueSupplies.length > 0) {
                const confirmed = await this.confirmAddSupplies(uniqueSupplies);
                if (confirmed) {
                    await this.addSuppliesToDatabase(uniqueSupplies);
                }
            }
        },
        
        /**
         * Extrait les fournitures uniques des lignes
         */
        getUniqueSupplies() {
            const supplies = new Map();
            
            this.parsedData.lines.forEach(line => {
                if (line.description && line.description.trim().length > 3) {
                    const key = line.description.trim().toLowerCase();
                    if (!supplies.has(key)) {
                        const itemType = this.detectItemType(line.description);
                        supplies.set(key, {
                            name: line.description.trim(),
                            reference: this.generateReference(line.description),
                            unitPrice: line.unitPrice || 0,
                            category: itemType.category,
                            categoryName: itemType.categoryName,
                            brand: this.extractBrandFromDescription(line.description),
                            description: `${itemType.categoryName} extraite par OCR - ${line.description.trim()}`
                        });
                    }
                }
            });
            
            return Array.from(supplies.values());
        },
        
        /**
         * Détecte le type d'élément (Main d'œuvre, Fourniture, Divers)
         */
        detectItemType(description) {
            // Normaliser la description : apostrophes, espaces, accents
            const normalizedDesc = description.toLowerCase()
                .replace(/[''`]/g, "'") // Normaliser toutes les apostrophes
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[ç]/g, 'c')
                .replace(/\s+/g, ' ') // Normaliser les espaces
                .trim();
            
            console.log('Description normalisée:', normalizedDesc);
            
            // Mots-clés pour Main d'œuvre
            const laborKeywords = [
                'main d\'oeuvre', 'main d\'œuvre', 'maindoeuvre', 'main d oeuvre',
                'montage', 'demontage', 'reparation', 'reglage', 'diagnostic',
                'carrossage', 'parallelisme', 'regarnissage', 'rectification',
                'service', 'intervention', 'travaux', 'pose', 'installation'
            ];
            
            // Vérification spéciale pour "MAIN D'OEUVRE" (peu importe les chiffres autour)
            if (normalizedDesc.includes('main') && (normalizedDesc.includes('oeuvre') || normalizedDesc.includes('œuvre'))) {
                console.log('Type détecté: Main d\'œuvre (spécial) pour:', description);
                return {
                    category: 'Main d\'œuvre',
                    categoryName: 'Main d\'œuvre'
                };
            }
            
            // Mots-clés pour Fournitures
            const supplyKeywords = [
                'pièce', 'piece', 'pièces', 'pieces', 'moyeu', 'bras', 'silentbloc',
                'amortisseur', 'ressort', 'pneu', 'valve', 'tambour', 'machoire',
                'filtre', 'huile', 'bougie', 'courroie', 'plaquette', 'disque'
            ];
            
            // Vérifier Main d'œuvre
            if (laborKeywords.some(keyword => normalizedDesc.includes(keyword))) {
                console.log('Type détecté: Main d\'œuvre pour:', description);
                return {
                    category: 'Main d\'œuvre',
                    categoryName: 'Main d\'œuvre'
                };
            }
            
            // Vérifier Fournitures
            if (supplyKeywords.some(keyword => normalizedDesc.includes(keyword))) {
                console.log('Type détecté: Pièces détachées pour:', description);
                return {
                    category: 'Pièces détachées',
                    categoryName: 'Pièces détachées'
                };
            }
            
            // Par défaut : Divers
            console.log('Type détecté: Divers (par défaut) pour:', description);
            return {
                category: 'Divers',
                categoryName: 'Divers'
            };
        },
        
        /**
         * Génère une référence pour la fourniture
         */
        generateReference(description) {
            // Créer une référence basée sur les initiales
            const words = description.trim().split(' ');
            const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
            const timestamp = Date.now().toString().slice(-4);
            return `OCR-${initials}-${timestamp}`;
        },
        
        /**
         * Extrait la marque du véhicule de la description
         */
        extractBrandFromDescription(description) {
            const brands = ['TOYOTA', 'PEUGEOT', 'RENAULT', 'NISSAN', 'HYUNDAI', 'KIA', 'FORD', 'CHEVROLET'];
            const upperDesc = description.toUpperCase();
            
            for (const brand of brands) {
                if (upperDesc.includes(brand)) {
                    return brand;
                }
            }
            
            return 'Générique';
        },
        
        /**
         * Demande confirmation pour ajouter les fournitures
         */
        async confirmAddSupplies(supplies) {
            const message = `Voulez-vous ajouter ${supplies.length} nouvelles fournitures à la base de données ?\n\n` +
                supplies.slice(0, 5).map(s => `• ${s.name} (${s.reference})`).join('\n') +
                (supplies.length > 5 ? `\n... et ${supplies.length - 5} autres` : '');
            
            return confirm(message);
        },
        
        /**
         * Ajoute les fournitures à la base de données
         */
        async addSuppliesToDatabase(supplies) {
            try {
                this.isProcessing = true;
                this.progress = 0;
                
                // Créer les catégories manquantes et récupérer leurs IDs
                const categoryIds = await this.ensureCategoriesExist(supplies);
                console.log('Category IDs récupérés:', categoryIds);
                
                const addedSupplies = [];
                
                for (let i = 0; i < supplies.length; i++) {
                    const supply = supplies[i];
                    
                    try {
                        const categoryId = categoryIds[supply.category];
                        console.log(`Fourniture: ${supply.name}, Catégorie: ${supply.category}, CategoryId: ${categoryId}`);
                        
                        if (!categoryId) {
                            console.error(`Pas de categoryId trouvé pour la catégorie "${supply.category}"`);
                            continue;
                        }
                        
                        const response = await window.apiService.request('/supplies/admin', {
                            method: 'POST',
                            body: JSON.stringify({
                                name: supply.name,
                                reference: supply.reference,
                                unitPrice: supply.unitPrice,
                                categoryId: categoryId,
                                brand: supply.brand,
                                description: supply.description,
                                isActive: true
                            })
                        });
                        
                        if (response.success) {
                            addedSupplies.push({
                                ...supply,
                                id: response.data.id,
                                apiResponse: response.data
                            });
                        }
                        
                        this.progress = Math.round(((i + 1) / supplies.length) * 100);
                        
                    } catch (error) {
                        console.error(`Erreur lors de l'ajout de ${supply.name}:`, error);
                    }
                }
                
                // Associer les lignes aux fournitures ajoutées
                this.associateLinesWithSupplies(addedSupplies);
                
                console.log(`${addedSupplies.length} fournitures ajoutées avec succès`);
                
            } catch (error) {
                console.error('Erreur lors de l\'ajout des fournitures:', error);
            } finally {
                this.isProcessing = false;
                this.progress = 100;
            }
        },
        
        /**
         * S'assure que les catégories nécessaires existent
         */
        async ensureCategoriesExist(supplies) {
            const categories = [...new Set(supplies.map(s => s.category))];
            const categoryIds = {};
            
            console.log('Catégories à traiter:', categories);
            
            for (const categoryName of categories) {
                try {
                    console.log(`Recherche de la catégorie: "${categoryName}"`);
                    
                    // D'abord essayer de trouver la catégorie existante
                    let categoryId = await this.findCategoryByName(categoryName);
                    
                    if (!categoryId) {
                        console.log(`Catégorie "${categoryName}" non trouvée, création...`);
                        
                        // Créer la catégorie si elle n'existe pas
                        const response = await window.apiService.request('/supply-categories/admin', {
                            method: 'POST',
                            body: JSON.stringify({
                                name: categoryName,
                                description: `Catégorie créée automatiquement par OCR pour ${categoryName}`,
                                icon: this.getCategoryIcon(categoryName)
                            })
                        });
                        
                        console.log('Réponse création catégorie:', response);
                        
                        if (response.success && response.data) {
                            categoryId = response.data.id;
                            console.log(`Catégorie "${categoryName}" créée avec succès (ID: ${categoryId})`);
                        }
                    } else {
                        console.log(`Catégorie "${categoryName}" trouvée (ID: ${categoryId})`);
                    }
                    
                    if (categoryId) {
                        categoryIds[categoryName] = categoryId;
                        console.log(`CategoryId ajouté: ${categoryName} = ${categoryId}`);
                    } else {
                        console.error(`Impossible d'obtenir un ID pour la catégorie "${categoryName}"`);
                    }
                    
                } catch (error) {
                    console.error(`Erreur avec la catégorie "${categoryName}":`, error.message);
                }
            }
            
            console.log('CategoryIds final:', categoryIds);
            return categoryIds;
        },
        
        /**
         * Trouve une catégorie par son nom
         */
        async findCategoryByName(categoryName) {
            try {
                const response = await window.apiService.request('/supply-categories/active', {
                    method: 'GET'
                });
                
                if (response.success && Array.isArray(response.data)) {
                    const category = response.data.find(cat => cat.name === categoryName);
                    return category ? category.id : null;
                }
                
                return null;
            } catch (error) {
                console.error('Erreur lors de la recherche de catégorie:', error);
                return null;
            }
        },
        
        /**
         * Retourne l'icône appropriée pour la catégorie
         */
        getCategoryIcon(categoryName) {
            const icons = {
                'Main d\'œuvre': 'fas fa-tools',
                'Pièces détachées': 'fas fa-cog',
                'Divers': 'fas fa-ellipsis-h'
            };
            return icons[categoryName] || 'fas fa-box';
        },
        
        /**
         * Associe les lignes aux fournitures ajoutées
         */
        associateLinesWithSupplies(addedSupplies) {
            if (!this.parsedData || !this.parsedData.lines) return;
            
            this.parsedData.lines.forEach(line => {
                const matchingSupply = addedSupplies.find(supply => 
                    supply.name.toLowerCase() === line.description.toLowerCase()
                );
                
                if (matchingSupply) {
                    line.supplyId = matchingSupply.id;
                    line.supplyName = matchingSupply.name;
                    line.supplyReference = matchingSupply.reference;
                    
                    // Définir le type de travaux selon la catégorie
                    if (matchingSupply.category === 'Main d\'œuvre') {
                        line.workType = 'labor';
                    } else if (matchingSupply.category === 'Pièces détachées') {
                        line.workType = 'supply';
                    } else {
                        line.workType = 'other';
                    }
                } else {
                    // Si pas de fourniture correspondante, détecter le type
                    const itemType = this.detectItemType(line.description);
                    if (itemType.category === 'Main d\'œuvre') {
                        line.workType = 'labor';
                    } else if (itemType.category === 'Pièces détachées') {
                        line.workType = 'supply';
                    } else {
                        line.workType = 'other';
                    }
                }
            });
            
            console.log('Lignes associées aux fournitures:', this.parsedData.lines);
        },
        
        /**
         * Gère la sélection de fichier
         */
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                this.processFile(file);
            }
        },
        
        /**
         * Gère le drag & drop
         */
        handleDrop(event) {
            event.preventDefault();
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        },
        
        /**
         * Ferme le composant OCR
         */
        close() {
            this.$emit('close');
        }
    },
    
    template: `
        <div class="ocr-processor-modal">
            <div class="ocr-modal-content">
                <div class="ocr-header">
                    <h3><i class="fas fa-eye"></i> Extraction OCR</h3>
                    <button type="button" class="btn-close" @click="close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="ocr-body">
                    <!-- Zone d'upload -->
                    <div v-if="!isProcessing && !extractedText" class="upload-section">
                        <div class="upload-area" 
                             @dragover.prevent 
                             @drop.prevent="handleDrop"
                             @click="$refs.fileInput.click()">
                            <div class="upload-content">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Glissez-déposez une image ou cliquez pour sélectionner</p>
                                <small>Formats supportés: JPG, PNG, BMP (max 10MB)</small>
                            </div>
                        </div>
                        <input type="file" 
                               ref="fileInput" 
                               @change="handleFileSelect"
                               accept="image/*,.pdf"
                               style="display: none;">
                    </div>
                    
                    <!-- Progression OCR -->
                    <div v-if="isProcessing" class="processing-section">
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" :style="{width: progress + '%'}"></div>
                            </div>
                            <p class="progress-text">{{ progress === 100 ? 'Ajout des fournitures...' : 'Extraction en cours...' }} {{ progress }}%</p>
                        </div>
                        <div class="processing-info">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>{{ progress === 100 ? 'Ajout des fournitures à la base de données...' : 'Analyse de l image et extraction du texte...' }}</p>
                        </div>
                    </div>
                    
                    <!-- Résultats -->
                    <div v-if="extractedText && !isProcessing" class="results-section">
                        <div class="results-tabs">
                            <button type="button" 
                                    class="tab-btn active" 
                                    @click="activeTab = 'parsed'">
                                Données extraites
                            </button>
                            <button type="button" 
                                    class="tab-btn" 
                                    @click="activeTab = 'raw'">
                                Texte brut
                            </button>
                        </div>
                        
                        <!-- Données parsées -->
                        <div v-if="activeTab === 'parsed'" class="parsed-data">
                            <div v-if="parsedData.quoteNumber" class="data-item">
                                <label>Numéro de devis:</label>
                                <span>{{ parsedData.quoteNumber }}</span>
                            </div>
                            
                            <div v-if="parsedData.clientInfo && parsedData.clientInfo.name" class="data-item">
                                <label>Client:</label>
                                <span>{{ parsedData.clientInfo.name }}</span>
                            </div>
                            
                            <div v-if="parsedData.vehicleInfo && parsedData.vehicleInfo.brand" class="data-item">
                                <label>Véhicule:</label>
                                <span>{{ parsedData.vehicleInfo.brand }} {{ parsedData.vehicleInfo.model || '' }} {{ parsedData.vehicleInfo.plateNumber || '' }}</span>
                            </div>
                            
                            <div v-if="parsedData.dates.length" class="data-item">
                                <label>Dates trouvées:</label>
                                <span>{{ parsedData.dates.join(', ') }}</span>
                            </div>
                            
                            <div v-if="parsedData.lines.length" class="data-item">
                                <label>Lignes détectées:</label>
                                <span>{{ parsedData.lines.length }}</span>
                            </div>
                            
                            <div v-if="parsedData.totals.calculated" class="data-item">
                                <label>Total calculé:</label>
                                <span>{{ parsedData.totals.calculated.toLocaleString() }} F CFA</span>
                            </div>
                            
                            <div v-if="parsedData.totals.total && parsedData.totals.total !== parsedData.totals.calculated" class="data-item">
                                <label>Total document:</label>
                                <span>{{ parsedData.totals.total.toLocaleString() }} F CFA</span>
                            </div>
                            
                            <!-- Aperçu des lignes -->
                            <div v-if="parsedData.lines.length > 0" class="lines-preview">
                                <label>Lignes extraites:</label>
                                <div class="lines-list">
                                    <div v-for="(line, index) in parsedData.lines.slice(0, 5)" :key="index" class="line-item">
                                        <span class="line-quantity">{{ line.quantity }}</span>
                                        <span class="line-description">{{ line.description }}</span>
                                        <span class="line-total">{{ line.totalPrice.toLocaleString() }} F CFA</span>
                                    </div>
                                    <div v-if="parsedData.lines.length > 5" class="line-more">
                                        ... et {{ parsedData.lines.length - 5 }} autres lignes
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Texte brut -->
                        <div v-if="activeTab === 'raw'" class="raw-text">
                            <pre>{{ extractedText }}</pre>
                        </div>
                    </div>
                    
                    <!-- Erreur -->
                    <div v-if="error" class="error-section">
                        <div class="alert alert-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            {{ error }}
                        </div>
                    </div>
                </div>
                
                <div class="ocr-footer">
                    <button type="button" class="btn btn-secondary" @click="close">
                        Annuler
                    </button>
                    <button type="button" 
                            class="btn btn-primary" 
                            @click="applyToForm"
                            :disabled="!parsedData">
                        Appliquer au formulaire
                    </button>
                </div>
            </div>
        </div>
    `
};

// Rendre le composant disponible globalement
if (typeof window !== 'undefined') {
    window.OCRProcessor = OCRProcessor;
}

// Exporter pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OCRProcessor;
}
