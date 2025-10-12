import jsPDF from 'jspdf'

class PDFService {
  constructor() {
    this.doc = null
  }

  createPrediagnosticPDF(prediagnostic, intervention) {
    this.doc = new jsPDF('p', 'mm', 'a4')
    
    // Configuration
    const pageWidth = this.doc.internal.pageSize.getWidth()
    const pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
    this.contentWidth = pageWidth - (this.margin * 2)
    
    // S'assurer que le texte est correctement encodé
    this.doc.setProperties({
      title: 'Prédiagnostic',
      subject: 'Fiche de prédiagnostic véhicule',
      author: 'Fleet Manager International'
    })
    
    let yPosition = this.margin
    
    // 1. En-tête
    yPosition = this.addHeader(yPosition, intervention)
    
    // 2. Informations collaborateur et véhicule
    yPosition = this.addVehicleSection(yPosition, prediagnostic, intervention)
    
    // 3. Tableau des opérations
    yPosition = this.addOperationsTable(yPosition, prediagnostic)
    
    // 4. Section devis
    yPosition = this.addQuoteSection(yPosition)
    
    // 5. Pied de page
    this.addFooter(yPosition, prediagnostic)
    
    return this.doc
  }

  addHeader(yPosition, intervention) {
    // Titre principal
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FLEET MANAGER INTERNATIONAL', this.margin, yPosition)
    
    // Sous-titres à droite
    yPosition += 8
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('- SYSTÈME DE GESTION DE PARC', this.margin + (this.contentWidth * 0.6), yPosition)
    
    yPosition += 5
    this.doc.text('- FORMATION', this.margin + (this.contentWidth * 0.6), yPosition)
    
    yPosition += 5
    this.doc.text('- LOGICIEL GESTION DE PARC', this.margin + (this.contentWidth * 0.6), yPosition)
    
    // Ligne de séparation
    yPosition += 15
    this.doc.line(this.margin, yPosition, this.contentWidth + this.margin, yPosition)
    
    return yPosition + 10
  }

  addVehicleSection(yPosition, prediagnostic, intervention) {
    // Texte d'expertise
    const expertName = this.getExpertName(prediagnostic.expert)
    const vehicleInfo = this.getVehicleInfo(intervention.vehicle)
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    const expertText = `Notre collaborateur ${expertName} a procédé à l'expertise de votre véhicule ${vehicleInfo} dont la remise en état nécessite les opérations suivantes :`
    
    // Utiliser splitTextToSize pour le retour à la ligne automatique
    const lines = this.doc.splitTextToSize(expertText, this.contentWidth)
    this.doc.text(lines, this.margin, yPosition)
    
    return yPosition + (lines.length * 5) + 10
  }

  addOperationsTable(yPosition, prediagnostic) {
    const tableTop = yPosition
    const rowHeight = 10
    const colWidths = [this.contentWidth * 0.6, this.contentWidth * 0.1, this.contentWidth * 0.1, this.contentWidth * 0.1, this.contentWidth * 0.1]
    
    // En-tête du tableau
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    
    let xPosition = this.margin
    const headers = ['LIBELLÉ', 'Ech', 'Ctrl', 'Rep', 'P']
    
    headers.forEach((header, index) => {
      this.doc.rect(xPosition, tableTop, colWidths[index], rowHeight)
      // Fond gris pour l'en-tête
      this.doc.setFillColor(240, 240, 240)
      this.doc.rect(xPosition, tableTop, colWidths[index], rowHeight, 'F')
      this.doc.setFillColor(255, 255, 255)
      
      this.doc.text(header, xPosition + 3, tableTop + 6)
      xPosition += colWidths[index]
    })
    
    // Lignes des opérations
    let currentY = tableTop + rowHeight
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(9)
    
    prediagnostic.items.forEach(item => {
      if (currentY > this.doc.internal.pageSize.getHeight() - 80) {
        this.doc.addPage()
        currentY = this.margin
      }
      
      // Calculer la hauteur nécessaire pour le libellé
      const operationText = this.sanitizeText(item.operationLabel) || ''
      const maxWidth = colWidths[0] - 6 // Padding de 3mm de chaque côté
      const lines = this.doc.splitTextToSize(operationText, maxWidth)
      const textHeight = Math.max(rowHeight, lines.length * 4 + 4)
      
      // Dessiner les rectangles pour toutes les colonnes
      let xPos = this.margin
      for (let i = 0; i < colWidths.length; i++) {
        this.doc.rect(xPos, currentY, colWidths[i], textHeight)
        xPos += colWidths[i]
      }
      
      // Ajouter le contenu
      xPos = this.margin
      
      // Libellé (colonne 0)
      this.doc.text(lines, xPos + 3, currentY + 4)
      xPos += colWidths[0]
      
      // Checkboxes (colonnes 1-4)
      const checkboxes = [
        item.isExchange ? 'X' : '',
        item.isControl ? 'X' : '',
        item.isRepair ? 'X' : '',
        item.isPainting ? 'X' : ''
      ]
      
      checkboxes.forEach((checkbox, index) => {
        if (checkbox) {
          const textWidth = this.doc.getTextWidth(checkbox)
          const centerX = xPos + (colWidths[index + 1] / 2) - (textWidth / 2)
          this.doc.text(checkbox, centerX, currentY + 6)
        }
        xPos += colWidths[index + 1]
      })
      
      currentY += textHeight
    })
    
    return currentY + 20
  }

  addQuoteSection(yPosition) {
    // Section devis
    this.doc.setFontSize(13)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Devis avant travaux requis', this.margin, yPosition)
    
    return yPosition + 15
  }

  addFooter(yPosition, prediagnostic) {
    const pageHeight = this.doc.internal.pageSize.getHeight()
    const footerY = pageHeight - 80
    
    // Ligne de séparation
    this.doc.line(this.margin, footerY - 10, this.contentWidth + this.margin, footerY - 10)
    
    // Date à droite
    const date = this.formatDate(prediagnostic.prediagnosticDate || new Date())
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(`Fait le ${date}`, this.contentWidth + this.margin - this.doc.getTextWidth(`Fait le ${date}`), footerY)
    
    // Zone signatures
    this.addSignatures(footerY + 20, prediagnostic)
    
    // Informations de contact en bas
    this.addContactInfo(prediagnostic)
  }

  addSignatures(yPosition, prediagnostic) {
    const signatureWidth = this.contentWidth / 3
    const signatureHeight = 40
    
    const signatures = [
      { title: "L'EXPERT" },
      { title: "LE RÉPARATEUR" },
      { title: "L'ASSURÉ" }
    ]
    
    signatures.forEach((sig, index) => {
      const x = this.margin + (index * signatureWidth)
      
      // Titre
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(sig.title, x + 5, yPosition)
      
      // Zone signature (ligne)
      yPosition += 15
      this.doc.line(x, yPosition, x + signatureWidth - 10, yPosition)
    })
  }

  addContactInfo(prediagnostic) {
    const pageHeight = this.doc.internal.pageSize.getHeight()
    const contactY = pageHeight - 15
    
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    
    const contactText = [
      'Adresse: Cocody 5 Plateaux CITE SOGED VILLA N°UN DERRIERE SOCOCE & PLATEAUX 01 BP 8148 ABIDJAN 01',
      'Tel: +225 22 41 00 82 / +225 07 07 36 45',
      'RCCM: CI-ABJ-2018-B-12757',
      'Compte Bancaire: BACI N° 148720000019',
      'CC: N° 1000302 W',
      'Régime d\'imposition: Réel Simplifié - Centre des Impôts: Cocody 2',
      'Email: fleetmanager@gmail.com'
    ]
    
    let currentY = contactY
    contactText.forEach(line => {
      this.doc.text(line, this.margin, currentY)
      currentY -= 3
    })
  }

  // Helpers
  sanitizeText(text) {
    if (!text) return ''
    // Nettoyer le texte pour éviter les problèmes d'encodage
    return String(text).replace(/[^\x00-\x7F]/g, '').trim()
  }

  getExpertName(expert) {
    if (!expert) return 'Non défini'
    return this.sanitizeText(`${expert.firstName} ${expert.lastName}`)
  }

  getVehicleInfo(vehicle) {
    if (!vehicle) return 'Véhicule non défini'
    
    const plate = vehicle.registrationNumber || vehicle.plateNumber || ''
    const brand = vehicle.brand?.name || vehicle.brandName || ''
    const model = vehicle.model?.name || vehicle.modelName || ''
    
    return `${plate} ${brand} ${model}`.trim()
  }

  formatMileage(mileage) {
    if (!mileage) return 'Non défini'
    return new Intl.NumberFormat('fr-FR').format(mileage)
  }

  formatDate(date) {
    if (!date) return new Date().toLocaleDateString('fr-FR')
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR')
  }

  download(filename = 'prediagnostic.pdf') {
    if (this.doc) {
      this.doc.save(filename)
    }
  }

  openInNewTab() {
    if (this.doc) {
      const pdfBlob = this.doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 1000)
    }
  }
}

export default new PDFService()
